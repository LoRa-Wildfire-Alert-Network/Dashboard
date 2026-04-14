import smtplib
import pytest
from unittest.mock import MagicMock, patch

import alerts.dispatch_email as dispatch_email_module
from alerts.dispatch_email import send_email_alert


def _make_smtp_mock():
    mock = MagicMock()
    mock.__enter__ = MagicMock(return_value=mock)
    mock.__exit__ = MagicMock(return_value=False)
    return mock


class TestEmailNotConfigured:

    def test_no_email_raises_runtime_error(self, monkeypatch):
        monkeypatch.setattr(dispatch_email_module, "EMAIL", None)
        monkeypatch.setattr(dispatch_email_module, "PASSWORD", "somepass")
        with pytest.raises(RuntimeError, match="Alert email not configured"):
            send_email_alert("recipient@example.com", "test message")

    def test_empty_string_email_raises_runtime_error(self, monkeypatch):
        monkeypatch.setattr(dispatch_email_module, "EMAIL", "")
        monkeypatch.setattr(dispatch_email_module, "PASSWORD", "somepass")
        with pytest.raises(RuntimeError, match="Alert email not configured"):
            send_email_alert("recipient@example.com", "test message")


class TestPasswordNotConfigured:

    def test_no_password_raises_runtime_error(self, monkeypatch):
        monkeypatch.setattr(dispatch_email_module, "EMAIL", "sender@example.com")
        monkeypatch.setattr(dispatch_email_module, "PASSWORD", None)
        with pytest.raises(RuntimeError, match="Alert email not configured"):
            send_email_alert("recipient@example.com", "test message")

    def test_empty_string_password_raises_runtime_error(self, monkeypatch):
        monkeypatch.setattr(dispatch_email_module, "EMAIL", "sender@example.com")
        monkeypatch.setattr(dispatch_email_module, "PASSWORD", "")
        with pytest.raises(RuntimeError, match="Alert email not configured"):
            send_email_alert("recipient@example.com", "test message")


class TestEmptyRecipient:

    def test_empty_to_email_raises_value_error(self, monkeypatch):
        monkeypatch.setattr(dispatch_email_module, "EMAIL", "sender@example.com")
        monkeypatch.setattr(dispatch_email_module, "PASSWORD", "pass123")
        with pytest.raises(ValueError, match="No recipient email provided"):
            send_email_alert("", "test message")

    def test_none_to_email_raises_value_error(self, monkeypatch):
        monkeypatch.setattr(dispatch_email_module, "EMAIL", "sender@example.com")
        monkeypatch.setattr(dispatch_email_module, "PASSWORD", "pass123")
        with pytest.raises(ValueError, match="No recipient email provided"):
            send_email_alert(None, "test message")  # type: ignore[arg-type]


class TestSmtpPort587:

    def test_uses_smtp_starttls(self, monkeypatch):
        monkeypatch.setattr(dispatch_email_module, "EMAIL", "sender@example.com")
        monkeypatch.setattr(dispatch_email_module, "PASSWORD", "pass123")
        monkeypatch.setattr(dispatch_email_module, "SMTP_LOGIN", "")

        smtp_mock = _make_smtp_mock()

        with patch.dict(
            "os.environ",
            {"ALERT_SMTP_HOST": "smtp.example.com", "ALERT_SMTP_PORT": "587"},
        ), patch("smtplib.SMTP", return_value=smtp_mock) as MockSMTP:
            send_email_alert("recipient@example.com", "hello")

        MockSMTP.assert_called_once_with("smtp.example.com", 587)
        smtp_mock.__enter__.assert_called_once()
        smtp_mock.starttls.assert_called_once()
        smtp_mock.login.assert_called_once_with(
            "sender@example.com", "pass123"
        )
        smtp_mock.sendmail.assert_called_once()
        call_args = smtp_mock.sendmail.call_args
        assert call_args[0][0] == "sender@example.com"
        assert call_args[0][1] == ["recipient@example.com"]

    def test_smtp_login_override_used_when_set(self, monkeypatch):
        monkeypatch.setattr(dispatch_email_module, "EMAIL", "sender@example.com")
        monkeypatch.setattr(dispatch_email_module, "PASSWORD", "pass123")
        monkeypatch.setattr(dispatch_email_module, "SMTP_LOGIN", "login@override.com")

        smtp_mock = _make_smtp_mock()

        with patch.dict(
            "os.environ",
            {"ALERT_SMTP_HOST": "smtp.example.com", "ALERT_SMTP_PORT": "587"},
        ), patch("smtplib.SMTP", return_value=smtp_mock):
            send_email_alert("recipient@example.com", "hello")

        smtp_mock.login.assert_called_once_with("login@override.com", "pass123")


class TestSmtpSsl:

    def test_uses_smtp_ssl(self, monkeypatch):
        monkeypatch.setattr(dispatch_email_module, "EMAIL", "sender@example.com")
        monkeypatch.setattr(dispatch_email_module, "PASSWORD", "pass123")
        monkeypatch.setattr(dispatch_email_module, "SMTP_LOGIN", "")

        smtp_mock = _make_smtp_mock()

        with patch.dict(
            "os.environ",
            {"ALERT_SMTP_HOST": "smtp.gmail.com", "ALERT_SMTP_PORT": "465"},
        ), patch("smtplib.SMTP_SSL", return_value=smtp_mock) as MockSSL:
            send_email_alert("recipient@example.com", "fire alert")

        MockSSL.assert_called_once_with("smtp.gmail.com", 465)
        smtp_mock.starttls.assert_not_called()
        smtp_mock.login.assert_called_once_with(
            "sender@example.com", "pass123"
        )
        smtp_mock.sendmail.assert_called_once()

    def test_default_port_is_465(self, monkeypatch):
        monkeypatch.setattr(dispatch_email_module, "EMAIL", "sender@example.com")
        monkeypatch.setattr(dispatch_email_module, "PASSWORD", "pass123")
        monkeypatch.setattr(dispatch_email_module, "SMTP_LOGIN", "")

        smtp_mock = _make_smtp_mock()

        env = {k: v for k, v in __import__("os").environ.items()
               if k != "ALERT_SMTP_PORT"}
        env.pop("ALERT_SMTP_PORT", None)

        with patch.dict("os.environ", env, clear=True), \
                patch("smtplib.SMTP_SSL", return_value=smtp_mock) as MockSSL:
            send_email_alert("recipient@example.com", "default port test")

        MockSSL.assert_called_once()

    def test_email_message_subject(self, monkeypatch):
        monkeypatch.setattr(dispatch_email_module, "EMAIL", "sender@example.com")
        monkeypatch.setattr(dispatch_email_module, "PASSWORD", "pass123")
        monkeypatch.setattr(dispatch_email_module, "SMTP_LOGIN", "")

        smtp_mock = _make_smtp_mock()
        captured_msg = []

        def capture_sendmail(from_addr, to_addrs, msg_string):
            captured_msg.append(msg_string)

        smtp_mock.sendmail.side_effect = capture_sendmail

        with patch.dict(
            "os.environ",
            {"ALERT_SMTP_PORT": "465"},
        ), patch("smtplib.SMTP_SSL", return_value=smtp_mock):
            send_email_alert("recipient@example.com", "smoke detected")

        assert len(captured_msg) == 1
        assert "Wildfire Alert" in captured_msg[0]
        assert "smoke detected" in captured_msg[0]


class TestSmtpRaises:

    def test_smtp_exception_wrapped_as_runtime_error_465(self, monkeypatch):
        monkeypatch.setattr(dispatch_email_module, "EMAIL", "sender@example.com")
        monkeypatch.setattr(dispatch_email_module, "PASSWORD", "pass123")
        monkeypatch.setattr(dispatch_email_module, "SMTP_LOGIN", "")

        smtp_mock = _make_smtp_mock()
        smtp_mock.__enter__.side_effect = smtplib.SMTPAuthenticationError(535, b"bad")

        with patch.dict("os.environ", {"ALERT_SMTP_PORT": "465"}), \
                patch("smtplib.SMTP_SSL", return_value=smtp_mock):
            with pytest.raises(RuntimeError, match="ALERT FAILED"):
                send_email_alert("recipient@example.com", "fire!")

    def test_smtp_exception_wrapped_as_runtime_error_587(self, monkeypatch):
        monkeypatch.setattr(dispatch_email_module, "EMAIL", "sender@example.com")
        monkeypatch.setattr(dispatch_email_module, "PASSWORD", "pass123")
        monkeypatch.setattr(dispatch_email_module, "SMTP_LOGIN", "")

        smtp_mock = _make_smtp_mock()
        smtp_mock.__enter__.side_effect = ConnectionRefusedError("refused")

        with patch.dict("os.environ", {"ALERT_SMTP_PORT": "587"}), \
                patch("smtplib.SMTP", return_value=smtp_mock):
            with pytest.raises(RuntimeError, match="ALERT FAILED"):
                send_email_alert("recipient@example.com", "fire!")

    def test_login_failure_raises_runtime_error(self, monkeypatch):
        monkeypatch.setattr(dispatch_email_module, "EMAIL", "sender@example.com")
        monkeypatch.setattr(dispatch_email_module, "PASSWORD", "wrongpass")
        monkeypatch.setattr(dispatch_email_module, "SMTP_LOGIN", "")

        smtp_mock = _make_smtp_mock()
        smtp_mock.login.side_effect = smtplib.SMTPAuthenticationError(535, b"auth fail")

        with patch.dict("os.environ", {"ALERT_SMTP_PORT": "465"}), \
                patch("smtplib.SMTP_SSL", return_value=smtp_mock):
            with pytest.raises(RuntimeError, match="ALERT FAILED"):
                send_email_alert("recipient@example.com", "fire!")

    def test_sendmail_failure_raises_runtime_error(self, monkeypatch):
        monkeypatch.setattr(dispatch_email_module, "EMAIL", "sender@example.com")
        monkeypatch.setattr(dispatch_email_module, "PASSWORD", "pass123")
        monkeypatch.setattr(dispatch_email_module, "SMTP_LOGIN", "")

        smtp_mock = _make_smtp_mock()
        smtp_mock.sendmail.side_effect = smtplib.SMTPRecipientsRefused({"bad@x.com": (550, b"no")})

        with patch.dict("os.environ", {"ALERT_SMTP_PORT": "465"}), \
                patch("smtplib.SMTP_SSL", return_value=smtp_mock):
            with pytest.raises(RuntimeError, match="ALERT FAILED"):
                send_email_alert("bad@x.com", "fire!")

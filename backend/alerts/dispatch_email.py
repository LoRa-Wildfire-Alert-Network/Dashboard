import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv

from .email_template import render_alert_email

load_dotenv()

EMAIL = os.getenv("ALERT_EMAIL")
PASSWORD = os.getenv("ALERT_PASS")
SMTP_LOGIN = os.getenv("ALERT_SMTP_LOGIN", "")


def send_email_alert(
    to_email: str,
    message: str,
    dev_eui: str = "",
    alert_type: str = "FIRE_RISK",
) -> None:
    if not EMAIL or not PASSWORD:
        raise RuntimeError("Alert email not configured (ALERT_EMAIL/ALERT_PASS).")

    if not to_email:
        raise ValueError("No recipient email provided.")

    msg = MIMEMultipart("alternative")
    msg["From"] = EMAIL
    msg["To"] = to_email
    msg["Subject"] = "🔥 Wildfire Alert — Action May Be Required"

    msg.attach(MIMEText(message, "plain"))
    msg.attach(MIMEText(render_alert_email(dev_eui, alert_type, message), "html"))

    try:
        SMTP_HOST = os.getenv("ALERT_SMTP_HOST", "smtp.gmail.com")
        SMTP_PORT = int(os.getenv("ALERT_SMTP_PORT", "465"))
        login = SMTP_LOGIN or EMAIL

        if SMTP_PORT == 587:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()
                server.login(login, PASSWORD)
                server.sendmail(EMAIL, [to_email], msg.as_string())
        else:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
                server.login(login, PASSWORD)
                server.sendmail(EMAIL, [to_email], msg.as_string())
    except Exception as e:
        raise RuntimeError(f"ALERT FAILED: {e}")

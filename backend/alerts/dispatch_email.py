import os
import smtplib
from email.mime.text import MIMEText

from dotenv import load_dotenv

load_dotenv()

EMAIL = os.getenv("ALERT_EMAIL")
PASSWORD = os.getenv("ALERT_PASS")


def send_email_alert(to_email: str, message: str) -> None:
    if not EMAIL or not PASSWORD:
        raise RuntimeError("Alert email not configured (ALERT_EMAIL/ALERT_PASS).")

    if not to_email:
        raise ValueError("No recipient email provided.")

    msg = MIMEText(message)
    msg["From"] = EMAIL
    msg["To"] = to_email
    msg["Subject"] = "Wildfire Alert"

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL, PASSWORD)
            server.sendmail(EMAIL, [to_email], msg.as_string())
    except Exception as e:
        raise RuntimeError(f"ALERT FAILED: {e}")

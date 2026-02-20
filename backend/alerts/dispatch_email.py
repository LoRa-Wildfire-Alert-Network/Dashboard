import os
import smtplib
from email.mime.text import MIMEText

from dotenv import load_dotenv

load_dotenv()

EMAIL = os.getenv("ALERT_EMAIL")
PASSWORD = os.getenv("ALERT_PASS")
TARGET = os.getenv("ALERT_TARGET")


def send_email_alert(message: str) -> None:
    if not EMAIL or not PASSWORD or not TARGET:
        print("Alert email not configured (ALERT_EMAIL/ALERT_PASS/ALERT_TARGET).")
        return

    msg = MIMEText(message)
    msg["From"] = EMAIL
    msg["To"] = TARGET
    msg["Subject"] = "Wildfire Alert"

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL, PASSWORD)
            server.sendmail(EMAIL, TARGET, msg.as_string())
        print("ALERT SENT")
    except Exception as e:
        print("ALERT FAILED:", e)

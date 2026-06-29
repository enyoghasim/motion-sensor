import os
import logging
from dotenv import load_dotenv

import resend
from premailer import transform

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY", "")

FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "Motion Sensor <onboarding@resend.dev>")


def send_email(to: str, subject: str, html: str) -> None:
    inlined_html = transform(html)
    resend.Emails.send(
        {
            "from": FROM_EMAIL,
            "to": [to],
            "subject": subject,
            "html": inlined_html,
        }
    )

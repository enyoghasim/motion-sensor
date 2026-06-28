from app.core.celery_app import celery_app
from app.core.mailer import send_email
from app.core.templates import render_template


@celery_app.task(name="send_welcome_email", bind=True, max_retries=5, default_retry_delay=30)
def send_welcome_email(self, to_email: str, device_id: str, device_name: str):
    try:
        html = render_template("welcome.html", device_id=device_id, device_name=device_name)
        send_email(to_email, "Your device is online", html)
    except Exception as exc:
        raise self.retry(exc=exc)

from app.tasks.email_tasks import send_welcome_email, send_otp_email


class EmailService:
    def enqueue_welcome_email(self, to_email: str, device_id: str, device_name: str) -> None:
        send_welcome_email.delay(to_email, device_id, device_name)  # type: ignore

    def enqueue_otp_email(self, to_email: str, otp: str) -> None:
        send_otp_email.delay(to_email, otp)  # type: ignore

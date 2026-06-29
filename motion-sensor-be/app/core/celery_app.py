import os
from dotenv import load_dotenv

from celery import Celery

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery("motion_sensor", broker=REDIS_URL, include=["app.tasks.email_tasks"])
celery_app.conf.task_ignore_result = True
celery_app.conf.broker_connection_retry_on_startup = True

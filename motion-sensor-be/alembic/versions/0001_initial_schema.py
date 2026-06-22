"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-06-22

"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "devices",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("device_id", sa.String(255), unique=True, nullable=False),
        sa.Column("name", sa.String(255)),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_table(
        "motion_events",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("device_id", sa.String(255), sa.ForeignKey("devices.device_id"), nullable=False),
        sa.Column("motion_detected", sa.Boolean),
        sa.Column("timestamp", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_motion_events_device_id", "motion_events", ["device_id"])
    op.create_index("ix_motion_events_timestamp", "motion_events", ["timestamp"])


def downgrade() -> None:
    op.drop_index("ix_motion_events_timestamp", table_name="motion_events")
    op.drop_index("ix_motion_events_device_id", table_name="motion_events")
    op.drop_table("motion_events")
    op.drop_table("devices")

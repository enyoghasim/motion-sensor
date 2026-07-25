"""Add space_id to devices

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-07-25 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('devices', sa.Column('space_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'devices_space_id_fkey', 'devices', 'spaces', ['space_id'], ['id']
    )


def downgrade() -> None:
    op.drop_constraint('devices_space_id_fkey', 'devices', type_='foreignkey')
    op.drop_column('devices', 'space_id')

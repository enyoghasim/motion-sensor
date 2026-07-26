"""Add icon to spaces

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-07-26 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'spaces',
        sa.Column('icon', sa.String(length=50), nullable=False, server_default='Home01Icon'),
    )


def downgrade() -> None:
    op.drop_column('spaces', 'icon')

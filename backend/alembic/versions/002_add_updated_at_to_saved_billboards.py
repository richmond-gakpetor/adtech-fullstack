"""Add updated_at column to saved_billboards table

Revision ID: 002_add_updated_at
Revises: 001_initial
Create Date: 2026-01-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_add_updated_at'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add updated_at column to saved_billboards table
    op.add_column(
        'saved_billboards',
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False
        )
    )


def downgrade() -> None:
    # Remove updated_at column from saved_billboards table
    op.drop_column('saved_billboards', 'updated_at')

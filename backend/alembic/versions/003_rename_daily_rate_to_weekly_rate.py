"""rename daily_rate to weekly_rate

Revision ID: 003_rename_daily_to_weekly
Revises: 002_add_updated_at
Create Date: 2026-01-08

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = '003_rename_daily_to_weekly'
down_revision = '002_add_updated_at'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Rename daily_rate column to weekly_rate in billboards table (if it exists)"""
    # Get connection to check if column exists
    conn = op.get_bind()
    inspector = inspect(conn)
    
    # Get existing columns in billboards table
    columns = [col['name'] for col in inspector.get_columns('billboards')]
    
    # Only rename if daily_rate exists and weekly_rate doesn't
    if 'daily_rate' in columns and 'weekly_rate' not in columns:
        op.alter_column(
            'billboards',
            'daily_rate',
            new_column_name='weekly_rate',
            existing_type=sa.Numeric(10, 2),
            existing_nullable=False
        )
    # If weekly_rate already exists, migration already applied or not needed (fresh install)
    # This is safe to skip


def downgrade() -> None:
    """Rename weekly_rate column back to daily_rate in billboards table"""
    conn = op.get_bind()
    inspector = inspect(conn)
    
    # Get existing columns in billboards table
    columns = [col['name'] for col in inspector.get_columns('billboards')]
    
    # Only rename if weekly_rate exists
    if 'weekly_rate' in columns and 'daily_rate' not in columns:
        op.alter_column(
            'billboards',
            'weekly_rate',
            new_column_name='daily_rate',
            existing_type=sa.Numeric(10, 2),
            existing_nullable=False
        )

"""add billboard details fields

Revision ID: 004_add_billboard_details
Revises: 003_rename_daily_to_weekly
Create Date: 2026-01-10

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '004_add_billboard_details'
down_revision = '003_rename_daily_to_weekly'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add new fields to billboards table"""
    # Add full_address
    op.add_column('billboards', sa.Column('full_address', sa.Text(), nullable=True))
    
    # Add orientation and illumination
    op.add_column('billboards', sa.Column('orientation', sa.String(length=50), nullable=True))
    op.add_column('billboards', sa.Column('illumination', sa.String(length=50), nullable=True))
    
    # Add minimum_duration
    op.add_column('billboards', sa.Column('minimum_duration', sa.String(length=50), nullable=True))
    
    # Add features and nearby_landmarks as arrays
    op.add_column('billboards', sa.Column('features', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'))
    op.add_column('billboards', sa.Column('nearby_landmarks', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'))
    
    # Add availability dates
    op.add_column('billboards', sa.Column('available_from', sa.String(), nullable=True))
    op.add_column('billboards', sa.Column('available_to', sa.String(), nullable=True))


def downgrade() -> None:
    """Remove new fields from billboards table"""
    op.drop_column('billboards', 'available_to')
    op.drop_column('billboards', 'available_from')
    op.drop_column('billboards', 'nearby_landmarks')
    op.drop_column('billboards', 'features')
    op.drop_column('billboards', 'minimum_duration')
    op.drop_column('billboards', 'illumination')
    op.drop_column('billboards', 'orientation')
    op.drop_column('billboards', 'full_address')

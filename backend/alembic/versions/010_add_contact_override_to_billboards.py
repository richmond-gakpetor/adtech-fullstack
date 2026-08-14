"""Add contact override fields to billboards

Revision ID: 010
Revises: 009
Create Date: 2026-07-07

Allows admin to list billboards on behalf of owners with their actual
contact details shown instead of the admin's profile info.
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = '010_billboard_contact_override'
down_revision = '009_time_based_visibility'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('billboards', sa.Column('contact_name', sa.String(200), nullable=True))
    op.add_column('billboards', sa.Column('contact_phone', sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_column('billboards', 'contact_phone')
    op.drop_column('billboards', 'contact_name')

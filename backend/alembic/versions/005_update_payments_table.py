"""update payments table structure

Revision ID: 005_update_payments_table
Revises: 004_add_billboard_details
Create Date: 2026-01-10

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005_update_payments_table'
down_revision = '004_add_billboard_details'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Update payments table to match current model"""
    
    # Add missing columns to payments table
    op.add_column('payments', sa.Column('type', sa.String(length=50), nullable=True, index=True))
    op.add_column('payments', sa.Column('currency', sa.String(length=3), nullable=True, server_default='GHS'))
    op.add_column('payments', sa.Column('paystack_access_code', sa.String(length=255), nullable=True))
    op.add_column('payments', sa.Column('paystack_authorization_url', sa.String(length=500), nullable=True))
    op.add_column('payments', sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True))
    
    # Update existing rows to have default values
    op.execute("UPDATE payments SET type = 'listing_access' WHERE type IS NULL")
    op.execute("UPDATE payments SET currency = 'GHS' WHERE currency IS NULL")
    
    # Make type column NOT NULL after setting defaults
    op.alter_column('payments', 'type', nullable=False)
    op.alter_column('payments', 'currency', nullable=False)
    
    # Drop old columns that are no longer used
    op.drop_column('payments', 'amount_ghs')
    op.drop_column('payments', 'payment_method')
    
    # Update billboard_listing_payments table
    op.add_column('billboard_listing_payments', sa.Column('tier_id', sa.String(length=10), nullable=True))
    op.add_column('billboard_listing_payments', sa.Column('price_ghs', sa.Integer(), nullable=True))
    op.add_column('billboard_listing_payments', sa.Column('access_starts_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('billboard_listing_payments', sa.Column('is_active', sa.Boolean(), nullable=True, server_default='false'))
    
    # Set defaults for existing rows
    op.execute("UPDATE billboard_listing_payments SET tier_id = '7d' WHERE tier_id IS NULL")
    op.execute("UPDATE billboard_listing_payments SET price_ghs = 70 WHERE price_ghs IS NULL")
    op.execute("UPDATE billboard_listing_payments SET is_active = false WHERE is_active IS NULL")
    
    # Make columns NOT NULL after setting defaults
    op.alter_column('billboard_listing_payments', 'tier_id', nullable=False)
    op.alter_column('billboard_listing_payments', 'price_ghs', nullable=False)
    op.alter_column('billboard_listing_payments', 'is_active', nullable=False)
    
    # Drop old columns
    op.drop_column('billboard_listing_payments', 'grace_period_expires_at')


def downgrade() -> None:
    """Revert payments table changes"""
    
    # Add back old columns to billboard_listing_payments
    op.add_column('billboard_listing_payments', sa.Column('grace_period_expires_at', sa.DateTime(timezone=True), nullable=True))
    
    # Remove new columns from billboard_listing_payments
    op.drop_column('billboard_listing_payments', 'is_active')
    op.drop_column('billboard_listing_payments', 'access_starts_at')
    op.drop_column('billboard_listing_payments', 'price_ghs')
    op.drop_column('billboard_listing_payments', 'tier_id')
    
    # Add back old columns to payments
    op.add_column('payments', sa.Column('payment_method', sa.String(length=50), nullable=True))
    op.add_column('payments', sa.Column('amount_ghs', sa.Numeric(10, 2), nullable=True))
    
    # Remove new columns from payments
    op.drop_column('payments', 'verified_at')
    op.drop_column('payments', 'paystack_authorization_url')
    op.drop_column('payments', 'paystack_access_code')
    op.drop_column('payments', 'currency')
    op.drop_column('payments', 'type')

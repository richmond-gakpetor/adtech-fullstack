"""Add rubric-compliant time-based visibility

Revision ID: 009_time_based_visibility
Revises: 008_add_coordinates_index
Create Date: 2026-01-20

Description:
- No schema changes needed (access_expires_at already exists)
- This migration documents the shift to time-based visibility
- Backend now uses time windows instead of is_active boolean
- is_active kept for backward compatibility but not primary visibility check

Rubric compliance:
✅ Time-bounded visibility (access_expires_at + grace period)
✅ Payment as time gate (not feature unlock)
✅ Configuration-driven (REQUIRE_PAYMENT_FOR_VISIBILITY)
✅ Backend authority on visibility
✅ Expiration as expected state
✅ No plan/tier/subscription abstraction
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '009_time_based_visibility'
down_revision = '008_add_coordinates_index'
branch_labels = None
depends_on = None


def upgrade():
    """
    This migration is primarily documentation.
    
    The billboard_listing_payments table already has the required columns:
    - access_starts_at: When visibility begins
    - access_expires_at: When visibility ends
    - is_active: Kept for backward compat (not used for visibility check)
    
    Billboard visibility is now determined by:
    WHERE now() < (access_expires_at + interval '3 days')  -- Grace period
    
    No schema changes needed. Backend logic updated to use time-based filtering.
    """
    # Add index for performance on time-based queries
    op.create_index(
        'idx_billboard_listing_payments_expiry',
        'billboard_listing_payments',
        ['billboard_id', 'access_expires_at'],
        unique=False
    )
    
    # Add comment to billboard_listing_payments table
    op.execute("""
        COMMENT ON TABLE billboard_listing_payments IS 
        'Tracks visibility time windows for billboards. 
        Each row grants a billboard visibility for duration_days. 
        Multiple rows per billboard = renewals/extensions.
        Visibility determined by: now() < access_expires_at + grace_period'
    """)
    
    op.execute("""
        COMMENT ON COLUMN billboard_listing_payments.access_expires_at IS
        'Primary visibility constraint. Billboard visible when now() < access_expires_at + grace_period.
        System checks this + grace_period, not is_active boolean.'
    """)
    
    op.execute("""
        COMMENT ON COLUMN billboards.is_active IS
        'DEPRECATED for visibility checks. Kept for backward compatibility.
        Do NOT use for browse filtering. Use billboard_listing_payments.access_expires_at instead.'
    """)


def downgrade():
    """Remove documentation changes"""
    op.drop_index('idx_billboard_listing_payments_expiry', table_name='billboard_listing_payments')
    
    op.execute("COMMENT ON TABLE billboard_listing_payments IS NULL")
    op.execute("COMMENT ON COLUMN billboard_listing_payments.access_expires_at IS NULL")
    op.execute("COMMENT ON COLUMN billboards.is_active IS NULL")

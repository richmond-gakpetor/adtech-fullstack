"""Add coordinates index for proximity search

Revision ID: 008_add_coordinates_index
Revises: 007_remove_chat_tables
Create Date: 2026-01-17

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '008_add_coordinates_index'
down_revision = '007_remove_chat_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Add functional indexes on billboard coordinates for efficient proximity search.
    This enables the Haversine distance calculation to be optimized.
    """
    # Create functional indexes on the lat and lng extracted from JSONB
    # This allows efficient filtering when doing proximity searches
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_billboards_coord_lat 
        ON billboards (((coordinates->>'lat')::float));
    """)
    
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_billboards_coord_lng 
        ON billboards (((coordinates->>'lng')::float));
    """)
    
    # Create a composite index for both lat and lng together
    # This is useful for bounding box queries (pre-filtering before Haversine)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_billboards_coords_composite 
        ON billboards (
            ((coordinates->>'lat')::float),
            ((coordinates->>'lng')::float)
        );
    """)


def downgrade() -> None:
    """Remove the coordinate indexes"""
    op.execute("DROP INDEX IF EXISTS idx_billboards_coord_lat;")
    op.execute("DROP INDEX IF EXISTS idx_billboards_coord_lng;")
    op.execute("DROP INDEX IF EXISTS idx_billboards_coords_composite;")

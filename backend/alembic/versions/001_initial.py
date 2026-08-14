"""Initial migration - Create all tables

Revision ID: 001_initial
Revises: 
Create Date: 2026-01-07 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create ENUM types explicitly
    op.execute("CREATE TYPE user_type AS ENUM ('owner', 'advertiser', 'admin')")
    op.execute("CREATE TYPE billboard_type AS ENUM ('Digital', 'Static')")
    op.execute("CREATE TYPE review_type AS ENUM ('billboard', 'owner', 'advertiser')")
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('phone_number', sa.String(20), nullable=True),
        sa.Column('user_type', postgresql.ENUM('owner', 'advertiser', 'admin', name='user_type', create_type=False), nullable=False, index=True),
        sa.Column('is_active', sa.Boolean, default=True, nullable=False, index=True),
        sa.Column('is_verified', sa.Boolean, default=False, nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)
    )
    
    # Create billboards table
    op.create_table(
        'billboards',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('location', sa.String(300), nullable=False),
        sa.Column('coordinates', postgresql.JSONB, nullable=False),
        sa.Column('billboard_type', postgresql.ENUM('Digital', 'Static', name='billboard_type', create_type=False), nullable=False, index=True),
        sa.Column('width_ft', sa.Float, nullable=False),
        sa.Column('height_ft', sa.Float, nullable=False),
        sa.Column('weekly_rate', sa.Numeric(10, 2), nullable=False),
        sa.Column('monthly_rate', sa.Numeric(10, 2), nullable=True),
        sa.Column('printing_fee', sa.Numeric(10, 2), nullable=True),
        sa.Column('flight_fee', sa.Numeric(10, 2), nullable=True),
        sa.Column('images', postgresql.ARRAY(sa.String), nullable=False, server_default='{}'),
        sa.Column('is_available', sa.Boolean, default=True, nullable=False, index=True),
        sa.Column('is_active', sa.Boolean, default=False, nullable=False, index=True),
        sa.Column('views', sa.Integer, default=0, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)
    )
    
    # Create saved_billboards table
    op.create_table(
        'saved_billboards',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('billboard_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('billboards.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('user_id', 'billboard_id', name='unique_user_billboard_save')
    )
    
    # Create chat_threads table
    op.create_table(
        'chat_threads',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('billboard_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('billboards.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('advertiser_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('last_message_at', sa.String, nullable=True),
        sa.Column('last_message_preview', sa.String(200), nullable=True),
        sa.Column('unread_count_advertiser', sa.Integer, default=0, nullable=False),
        sa.Column('unread_count_owner', sa.Integer, default=0, nullable=False),
        sa.Column('status', sa.String(20), default='active', nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint('billboard_id', 'advertiser_id', name='unique_billboard_advertiser_thread')
    )
    op.create_index('idx_chat_thread_participants', 'chat_threads', ['advertiser_id', 'owner_id'])
    
    # Create chat_messages table
    op.create_table(
        'chat_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('thread_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('chat_threads.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('sender_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('sender_type', sa.String(20), nullable=False),
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('is_read', sa.Boolean, default=False, nullable=False, index=True),
        sa.Column('read_at', sa.String, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)
    )
    op.create_index('idx_message_thread_created', 'chat_messages', ['thread_id', 'created_at'])
    op.create_index('idx_message_unread', 'chat_messages', ['thread_id', 'is_read'])
    
    # Create payments table
    op.create_table(
        'payments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('reference', sa.String(100), unique=True, nullable=False, index=True),
        sa.Column('amount_ghs', sa.Numeric(10, 2), nullable=False),
        sa.Column('amount_pesewas', sa.Integer, nullable=False),
        sa.Column('status', sa.String(50), nullable=False, index=True),
        sa.Column('payment_method', sa.String(50), nullable=True),
        sa.Column('payment_metadata', postgresql.JSONB, nullable=True),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)
    )
    
    # Create billboard_listing_payments table
    op.create_table(
        'billboard_listing_payments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('payment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('payments.id', ondelete='CASCADE'), unique=True, nullable=False, index=True),
        sa.Column('billboard_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('billboards.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('duration_days', sa.Integer, nullable=False),
        sa.Column('access_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('grace_period_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)
    )
    
    # Create reviews table
    op.create_table(
        'reviews',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('reviewer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('reviewee_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True, index=True),
        sa.Column('billboard_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('billboards.id', ondelete='CASCADE'), nullable=True, index=True),
        sa.Column('review_type', postgresql.ENUM('billboard', 'owner', 'advertiser', name='review_type', create_type=False), nullable=False, index=True),
        sa.Column('rating', sa.Integer, nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('comment', sa.Text, nullable=False),
        sa.Column('campaign_name', sa.String(200), nullable=True),
        sa.Column('is_verified', sa.Boolean, default=False, nullable=False),
        sa.Column('is_visible', sa.Boolean, default=True, nullable=False),
        sa.Column('helpful_count', sa.Integer, default=0, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range')
    )
    
    # Create indexes for performance
    op.create_index('idx_billboards_location', 'billboards', ['location'])
    op.create_index('idx_payments_created_at', 'payments', ['created_at'])
    op.create_index('idx_reviews_created_at', 'reviews', ['created_at'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('reviews')
    op.drop_table('billboard_listing_payments')
    op.drop_table('payments')
    op.drop_table('chat_messages')
    op.drop_table('chat_threads')
    op.drop_table('saved_billboards')
    op.drop_table('billboards')
    op.drop_table('users')
    
    # Drop ENUM types
    sa.Enum(name='review_type').drop(op.get_bind())
    sa.Enum(name='billboard_type').drop(op.get_bind())
    sa.Enum(name='user_type').drop(op.get_bind())

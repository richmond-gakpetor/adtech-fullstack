"""Remove chat tables

Revision ID: 007_remove_chat_tables
Revises: 006_add_verification_fields
Create Date: 2026-01-17 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '007_remove_chat_tables'
down_revision = '006_add_verification_fields'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop chat tables in reverse order of dependencies
    op.drop_table('chat_messages')
    op.drop_table('chat_threads')


def downgrade() -> None:
    # Recreate chat_threads table
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
    
    # Recreate chat_messages table
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

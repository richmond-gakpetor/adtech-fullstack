"""Add email verification and KYC fields

Revision ID: 006_add_verification_fields
Revises: 005_update_payments_table
Create Date: 2026-01-16

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '006_add_verification_fields'
down_revision = '005_update_payments_table'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create KYC status enum type
    kyc_status_enum = postgresql.ENUM('pending', 'submitted', 'approved', 'rejected', name='kyc_status', create_type=True)
    kyc_status_enum.create(op.get_bind(), checkfirst=True)
    
    # Add email verification columns
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('email_verification_token', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('email_verification_token_expires', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('email_verified_at', sa.DateTime(), nullable=True))
    
    # Add KYC verification columns
    op.add_column('users', sa.Column('kyc_status', sa.Enum('pending', 'submitted', 'approved', 'rejected', name='kyc_status'), nullable=False, server_default='pending'))
    op.add_column('users', sa.Column('kyc_submission_count', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('kyc_submitted_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('kyc_reviewed_at', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('kyc_reviewed_by_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('users', sa.Column('kyc_rejection_reason', sa.Text(), nullable=True))
    
    # Add password reset columns
    op.add_column('users', sa.Column('password_reset_token', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('password_reset_token_expires', sa.DateTime(), nullable=True))
    
    # Create indexes
    op.create_index(op.f('ix_users_email_verified'), 'users', ['email_verified'], unique=False)
    op.create_index(op.f('ix_users_kyc_status'), 'users', ['kyc_status'], unique=False)
    op.create_index(op.f('ix_users_email_verification_token'), 'users', ['email_verification_token'], unique=True)
    op.create_index(op.f('ix_users_password_reset_token'), 'users', ['password_reset_token'], unique=True)
    
    # Create foreign key for kyc_reviewed_by_id
    op.create_foreign_key('fk_users_kyc_reviewed_by', 'users', 'users', ['kyc_reviewed_by_id'], ['id'])


def downgrade() -> None:
    # Drop foreign key
    op.drop_constraint('fk_users_kyc_reviewed_by', 'users', type_='foreignkey')
    
    # Drop indexes
    op.drop_index(op.f('ix_users_password_reset_token'), table_name='users')
    op.drop_index(op.f('ix_users_email_verification_token'), table_name='users')
    op.drop_index(op.f('ix_users_kyc_status'), table_name='users')
    op.drop_index(op.f('ix_users_email_verified'), table_name='users')
    
    # Drop columns
    op.drop_column('users', 'password_reset_token_expires')
    op.drop_column('users', 'password_reset_token')
    op.drop_column('users', 'kyc_rejection_reason')
    op.drop_column('users', 'kyc_reviewed_by_id')
    op.drop_column('users', 'kyc_reviewed_at')
    op.drop_column('users', 'kyc_submitted_at')
    op.drop_column('users', 'kyc_submission_count')
    op.drop_column('users', 'kyc_status')
    op.drop_column('users', 'email_verified_at')
    op.drop_column('users', 'email_verification_token_expires')
    op.drop_column('users', 'email_verification_token')
    op.drop_column('users', 'email_verified')
    
    # Drop KYC status enum type
    kyc_status_enum = postgresql.ENUM('pending', 'submitted', 'approved', 'rejected', name='kyc_status')
    kyc_status_enum.drop(op.get_bind(), checkfirst=True)

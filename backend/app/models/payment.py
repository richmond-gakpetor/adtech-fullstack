from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB, ENUM
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from app.models.base import Base


class PaymentStatus(str, enum.Enum):
    """Payment status enumeration"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class PaymentType(str, enum.Enum):
    """Payment type enumeration"""
    LISTING_ACCESS = "listing_access"  # Billboard listing fee


class Payment(Base):
    """Payment transaction model"""
    
    __tablename__ = "payments"
    
    # User relationship
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Payment Details
    reference = Column(String(100), unique=True, nullable=False, index=True)  # Paystack reference
    type = Column(String(50), nullable=False, index=True)  # Store as string since no enum in DB
    status = Column(String(20), default="pending", nullable=False, index=True)  # Store as string
    
    # Amount (in pesewas - GHS * 100)
    amount_pesewas = Column(Integer, nullable=False)
    currency = Column(String(3), default="GHS", nullable=False)
    
    # Paystack Details
    paystack_access_code = Column(String(255), nullable=True)
    paystack_authorization_url = Column(String(500), nullable=True)
    
    # Payment verification
    paid_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    
    # Metadata
    payment_metadata = Column(JSONB, default={}, nullable=False)  # Additional payment info
    
    # Relationships
    user = relationship("User", backref="payments")
    listing_payment = relationship("BillboardListingPayment", back_populates="payment", uselist=False)
    
    def __repr__(self) -> str:
        return f"<Payment {self.reference} - {self.status}>"
    
    @property
    def amount_ghs(self) -> float:
        """Get amount in GHS"""
        return self.amount_pesewas / 100


class BillboardListingPayment(Base):
    """Billboard listing access payment details"""
    
    __tablename__ = "billboard_listing_payments"
    
    # Payment relationship (one-to-one)
    payment_id = Column(UUID(as_uuid=True), ForeignKey("payments.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    # Billboard relationship
    billboard_id = Column(UUID(as_uuid=True), ForeignKey("billboards.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Listing tier details
    tier_id = Column(String(10), nullable=False)  # "7d" or "14d"
    duration_days = Column(Integer, nullable=False)
    price_ghs = Column(Integer, nullable=False)  # Price paid in GHS (for reference)
    
    # Listing access period
    access_starts_at = Column(DateTime, nullable=True)  # When payment is completed
    access_expires_at = Column(DateTime, nullable=True)  # access_starts_at + duration_days
    
    # Status
    is_active = Column(Boolean, default=False, nullable=False, index=True)  # True if within access period
    
    # Relationships
    payment = relationship("Payment", back_populates="listing_payment")
    billboard = relationship("Billboard", backref="listing_payments")
    
    def __repr__(self) -> str:
        return f"<BillboardListingPayment billboard={self.billboard_id} tier={self.tier_id}>"

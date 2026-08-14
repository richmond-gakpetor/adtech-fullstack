"""Review models"""

from sqlalchemy import Column, String, Integer, Text, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import relationship
import enum
from app.models.base import Base


class ReviewType(str, enum.Enum):
    """Review type enumeration"""
    BILLBOARD = "billboard"
    OWNER = "owner"
    ADVERTISER = "advertiser"


class Review(Base):
    """Review model for billboards and users"""
    
    __tablename__ = "reviews"
    
    # Reviewer (user who writes the review)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Reviewee (user being reviewed - owner or advertiser)
    reviewee_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Billboard being reviewed (optional - for billboard reviews)
    billboard_id = Column(UUID(as_uuid=True), ForeignKey("billboards.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Review details
    review_type = Column(ENUM('billboard', 'owner', 'advertiser', name='review_type', create_type=False), nullable=False, index=True)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    title = Column(String(200), nullable=False)
    comment = Column(Text, nullable=False)
    
    # Campaign reference (optional)
    campaign_name = Column(String(200), nullable=True)
    
    # Moderation
    is_verified = Column(Boolean, default=False, nullable=False)  # Verified purchase/interaction
    is_visible = Column(Boolean, default=True, nullable=False)  # Visible to public
    
    # Helpfulness tracking
    helpful_count = Column(Integer, default=0, nullable=False)
    
    # Relationships
    reviewer = relationship("User", foreign_keys=[reviewer_id], backref="reviews_given")
    reviewee = relationship("User", foreign_keys=[reviewee_id], backref="reviews_received")
    billboard = relationship("Billboard", backref="reviews")
    
    def __repr__(self) -> str:
        return f"<Review {self.id} - {self.review_type} - {self.rating}★>"

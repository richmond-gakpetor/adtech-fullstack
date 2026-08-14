from sqlalchemy import Column, String, Integer, Float, Boolean, Text, Numeric, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB, ENUM
from sqlalchemy.orm import relationship
import enum
from app.models.base import Base


class BillboardType(str, enum.Enum):
    """Billboard type enumeration"""
    DIGITAL = "Digital"
    STATIC = "Static"


class Billboard(Base):
    """Billboard model for advertising spaces"""
    
    __tablename__ = "billboards"
    
    # Owner relationship
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Basic Information
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    
    # Location
    location = Column(String(300), nullable=False, index=True)
    full_address = Column(Text, nullable=True)  # Detailed address
    coordinates = Column(JSONB, nullable=False)  # {lat: float, lng: float}
    
    # Type
    billboard_type = Column(ENUM('Digital', 'Static', name='billboard_type', create_type=False), nullable=False, index=True)
    
    # Dimensions
    width_ft = Column(Float, nullable=False)
    height_ft = Column(Float, nullable=False)
    
    # Specifications
    orientation = Column(String(50), nullable=True)  # Horizontal, Vertical, Square
    illumination = Column(String(50), nullable=True)  # Lit, Unlit, Backlit
    
    # Pricing
    weekly_rate = Column(Numeric(10, 2), nullable=False)
    monthly_rate = Column(Numeric(10, 2), nullable=True)
    printing_fee = Column(Numeric(10, 2), nullable=True)
    flight_fee = Column(Numeric(10, 2), nullable=True)
    minimum_duration = Column(String(50), nullable=True)  # e.g., "1 week", "2 weeks", "1 month"
    
    # Features & Landmarks
    features = Column(ARRAY(String), nullable=False, server_default='{}')  # Billboard features
    nearby_landmarks = Column(ARRAY(String), nullable=False, server_default='{}')  # Nearby landmarks
    
    # Availability
    available_from = Column(String, nullable=True)  # Start date for availability
    available_to = Column(String, nullable=True)  # End date for availability (optional)
    
    # Images
    images = Column(ARRAY(String), nullable=False, server_default='{}')

    # Contact overrides (used when admin lists on behalf of an owner)
    contact_name = Column(String(200), nullable=True)
    contact_phone = Column(String(20), nullable=True)

    # Status
    is_available = Column(Boolean, default=True, nullable=False, index=True)
    is_active = Column(Boolean, default=False, nullable=False, index=True)
    views = Column(Integer, default=0, nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="billboards")
    saved_by = relationship("SavedBillboard", back_populates="billboard", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Billboard {self.title} - {self.location}>"


class SavedBillboard(Base):
    """Saved/bookmarked billboards by users"""
    
    __tablename__ = "saved_billboards"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    billboard_id = Column(UUID(as_uuid=True), ForeignKey("billboards.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="saved_billboards")
    billboard = relationship("Billboard", back_populates="saved_by")
    
    def __repr__(self) -> str:
        return f"<SavedBillboard user={self.user_id} billboard={self.billboard_id}>"

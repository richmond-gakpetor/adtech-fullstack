from datetime import datetime
from typing import Any
from sqlalchemy import Column, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declared_attr
from app.core.database import Base as SQLAlchemyBase
import uuid


class Base(SQLAlchemyBase):
    """Base model with common fields for all tables"""
    
    __abstract__ = True
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    @declared_attr
    def __tablename__(cls) -> str:
        """Generate __tablename__ automatically from class name"""
        return cls.__name__.lower() + 's'
    
    def dict(self) -> dict[str, Any]:
        """Convert model to dictionary"""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }

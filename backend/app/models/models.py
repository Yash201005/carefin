from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan")
    policies = relationship("InsurancePolicy", back_populates="owner", cascade="all, delete-orphan")
    calculations = relationship("SavedCalculation", back_populates="owner", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    document_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    processing_status = Column(String, nullable=False, default="PENDING")
    upload_date = Column(DateTime, default=datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    source = Column(String, nullable=False, default="USER UPLOAD")
    verification_status = Column(String, nullable=False, default="UNVERIFIED")
    storage_path = Column(String, nullable=False)

    # Relationships
    owner = relationship("User", back_populates="documents")
    policies = relationship("InsurancePolicy", back_populates="document")


class InsurancePolicy(Base):
    __tablename__ = "insurance_policies"

    id = Column(Integer, primary_key=True, index=True)
    policy_name = Column(String, nullable=False)
    sum_insured = Column(Float, nullable=False)
    copay = Column(Float, nullable=False)
    deductible = Column(Float, nullable=False)
    room_rent_limit = Column(Float, nullable=False)
    icu_limit = Column(Float, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="policies")
    document = relationship("Document", back_populates="policies")


class SavedCalculation(Base):
    __tablename__ = "saved_calculations"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    calculation_type = Column(String, nullable=False) # e.g. "OOP", "FUNDING_GAP", "CROWDFUNDING", "COST_COMPARISON"
    input_values = Column(String, nullable=False) # JSON-serialized inputs
    output_values = Column(String, nullable=False) # JSON-serialized outputs
    reference_metadata = Column(String, nullable=True) # Optional metadata description
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="calculations")

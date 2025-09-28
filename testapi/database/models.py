# database/models.py
"""
Database models for TaxWise application
"""

from sqlalchemy import (
    Column,
    String,
    Float,
    DateTime,
    Text,
    Integer,
    Boolean,
    ForeignKey,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime


Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    files = relationship("FileUpload", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    tax_data = relationship("TaxData", back_populates="user")
    cibil_data = relationship("CIBILData", back_populates="user")


class FileUpload(Base):
    __tablename__ = "file_uploads"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(
        String, nullable=False
    )  # bank_statement, credit_card, credit_report
    file_size = Column(Integer)
    processing_status = Column(
        String, default="uploaded"
    )  # uploaded, processing, completed, failed
    created_at = Column(DateTime, default=datetime.now)

    # Relationships
    user = relationship("User", back_populates="files")
    transactions = relationship("Transaction", back_populates="file")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    file_id = Column(String, ForeignKey("file_uploads.id"))
    date = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=False)
    transaction_type = Column(String)  # debit, credit
    category = Column(String)  # income, emi, sip, rent, insurance, other
    subcategory = Column(String)
    is_recurring = Column(Boolean, default=False)
    confidence_score = Column(Float)  # AI categorization confidence
    created_at = Column(DateTime, default=datetime.now)

    # Relationships
    user = relationship("User", back_populates="transactions")
    file = relationship("FileUpload", back_populates="transactions")


class TaxData(Base):
    __tablename__ = "tax_data"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    financial_year = Column(String, nullable=False)
    total_income = Column(Float)
    taxable_income = Column(Float)
    old_regime_tax = Column(Float)
    new_regime_tax = Column(Float)
    deductions = Column(Text)  # JSON string of deductions
    recommendations = Column(Text)  # JSON string of recommendations
    report_path = Column(String)  # Path to generated PDF report
    created_at = Column(DateTime, default=datetime.now)

    # Relationships
    user = relationship("User", back_populates="tax_data")


class CIBILData(Base):
    __tablename__ = "cibil_data"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    current_score = Column(Integer)
    credit_utilization = Column(Float)
    payment_history_score = Column(Integer)
    number_of_accounts = Column(Integer)
    credit_age_months = Column(Integer)
    hard_inquiries = Column(Integer)
    analysis_data = Column(Text)  # JSON string of detailed analysis
    recommendations = Column(Text)  # JSON string of recommendations
    created_at = Column(DateTime, default=datetime.now)

    # Relationships
    user = relationship("User", back_populates="cibil_data")


class KnowledgeBase(Base):
    __tablename__ = "knowledge_base"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    source_url = Column(String)
    category = Column(String)  # tax_laws, deductions, cibil, general
    embedding_id = Column(String)  # Reference to ChromaDB embedding
    last_updated = Column(DateTime, default=datetime.now)
    created_at = Column(DateTime, default=datetime.now)


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    context_used = Column(Text)  # JSON string of RAG context
    created_at = Column(DateTime, default=datetime.now)


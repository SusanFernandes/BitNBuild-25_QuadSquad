"""
TaxWise: AI-Powered Tax Assistant for Indian Users
FastAPI Backend with RAG, Document Processing, and Tax Optimization
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import (
    create_engine,
    Column,
    String,
    Float,
    DateTime,
    Text,
    Integer,
    Boolean,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
import os
from datetime import datetime
import pandas as pd
import json
import asyncio
from pathlib import Path

# Import custom modules
from database.models import Base, User, FileUpload, Transaction, TaxData, CIBILData
from services.file_processor import FileProcessor
from services.transaction_categorizer import TransactionCategorizer
from services.tax_calculator import TaxCalculator
from services.cibil_analyzer import CIBILAnalyzer
from services.rag_service import RAGService
from services.knowledge_scraper import LocalLLMKnowledgeScraper
from utils.pdf_extractor import PDFExtractor
from passlib.hash import bcrypt

# Initialize FastAPI app
app = FastAPI(
    title="TaxWise AI Tax Assistant",
    description="AI-powered personal finance platform for Indian users",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./taxwise.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize services
file_processor = FileProcessor()
transaction_categorizer = TransactionCategorizer()
tax_calculator = TaxCalculator()
cibil_analyzer = CIBILAnalyzer()
rag_service = RAGService()
knowledge_scraper = LocalLLMKnowledgeScraper()
pdf_extractor = PDFExtractor()


# Pydantic models
class UserCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    password: str


class TransactionResponse(BaseModel):
    id: str
    amount: float
    description: str
    date: datetime
    category: str
    subcategory: Optional[str] = None


class TaxComputationResponse(BaseModel):
    taxable_income: float
    old_regime_tax: float
    new_regime_tax: float
    recommended_regime: str
    deductions: Dict[str, float]
    recommendations: List[str]


class CIBILAnalysisResponse(BaseModel):
    current_score: Optional[int]
    credit_utilization: Optional[float]
    payment_history_score: Optional[int]
    recommendations: List[str]
    score_factors: Dict[str, Any]


class ChatQuery(BaseModel):
    user_id: str
    query: str


# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Routes


@app.on_event("startup")
async def startup_event():
    """Initialize knowledge base on startup"""
    await knowledge_scraper.scrape_tax_knowledge()
    await rag_service.initialize()


@app.post("/users/create")
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    hashed_password = bcrypt.hash(user.password)
    db_user = User(
        id=str(uuid.uuid4()),
        name=user.name,
        email=user.email,
        phone=user.phone,
        password_hash=hashed_password,
        created_at=datetime.now(),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"user_id": db_user.id, "message": "User created successfully"}


@app.post("/files/upload")
async def upload_file(
    file: UploadFile = File(...),
    user_id: str = None,
    file_type: str = "bank_statement",
    db: Session = Depends(get_db),
):
    """Upload financial documents (CSV, Excel, PDF)"""
    try:
        # Generate unique file ID
        file_id = str(uuid.uuid4())

        # Create upload directory if not exists
        upload_dir = Path("uploads")
        upload_dir.mkdir(exist_ok=True)

        # Save file
        file_path = upload_dir / f"{file_id}_{file.filename}"
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Store file metadata in database
        db_file = FileUpload(
            id=file_id,
            user_id=user_id,
            filename=file.filename,
            file_path=str(file_path),
            file_type=file_type,
            file_size=len(content),
            created_at=datetime.now(),
        )
        db.add(db_file)
        db.commit()

        return {
            "file_id": file_id,
            "filename": file.filename,
            "message": "File uploaded successfully",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")


@app.get("/files/{file_id}")
async def get_file_metadata(file_id: str, db: Session = Depends(get_db)):
    """Get file metadata"""
    file_record = db.query(FileUpload).filter(FileUpload.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    return {
        "file_id": file_record.id,
        "filename": file_record.filename,
        "file_type": file_record.file_type,
        "file_size": file_record.file_size,
        "created_at": file_record.created_at,
    }


@app.post("/transactions/parse")
async def parse_transactions(
    file_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)
):
    """Parse uploaded file and extract transactions"""
    try:
        # Get file record
        file_record = db.query(FileUpload).filter(FileUpload.id == file_id).first()
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found")

        # Process file based on type
        if file_record.filename.endswith(".pdf"):
            # Extract text from PDF
            extracted_text = await pdf_extractor.extract_text(file_record.file_path)
            transactions = await file_processor.parse_pdf_statements(
                extracted_text, file_record.file_type
            )
        else:
            # Process CSV/Excel files
            transactions = await file_processor.process_file(
                file_record.file_path, file_record.file_type
            )

        # Store transactions in database
        for transaction_data in transactions:
            transaction = Transaction(
                id=str(uuid.uuid4()),
                user_id=file_record.user_id,
                file_id=file_id,
                date=transaction_data["date"],
                amount=transaction_data["amount"],
                description=transaction_data["description"],
                transaction_type=transaction_data.get("type", "unknown"),
                created_at=datetime.now(),
            )
            db.add(transaction)

        db.commit()

        return {
            "message": f"Successfully parsed {len(transactions)} transactions",
            "transaction_count": len(transactions),
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error parsing transactions: {str(e)}"
        )


@app.get("/transactions/{user_id}")
async def get_user_transactions(user_id: str, db: Session = Depends(get_db)):
    """Get all transactions for a user"""
    transactions = db.query(Transaction).filter(Transaction.user_id == user_id).all()

    return [
        TransactionResponse(
            id=t.id,
            amount=t.amount,
            description=t.description,
            date=t.date,
            category=t.category or "uncategorized",
            subcategory=t.subcategory,
        )
        for t in transactions
    ]


@app.post("/transactions/categorize")
async def categorize_transactions(user_id: str, db: Session = Depends(get_db)):
    """Categorize transactions using AI"""
    try:
        # Get user transactions
        transactions = (
            db.query(Transaction).filter(Transaction.user_id == user_id).all()
        )

        # Categorize each transaction
        for transaction in transactions:
            category_data = await transaction_categorizer.categorize_transaction(
                transaction.description, transaction.amount
            )

            transaction.category = category_data["category"]
            transaction.subcategory = category_data.get("subcategory")
            transaction.is_recurring = category_data.get("is_recurring", False)

        db.commit()

        return {"message": f"Successfully categorized {len(transactions)} transactions"}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error categorizing transactions: {str(e)}"
        )


@app.get("/transactions/recurring/{user_id}")
async def get_recurring_transactions(user_id: str, db: Session = Depends(get_db)):
    """Get recurring transactions for a user"""
    recurring_transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id, Transaction.is_recurring == True)
        .all()
    )

    return [
        TransactionResponse(
            id=t.id,
            amount=t.amount,
            description=t.description,
            date=t.date,
            category=t.category or "uncategorized",
            subcategory=t.subcategory,
        )
        for t in recurring_transactions
    ]


@app.post("/tax/compute")
async def compute_tax(user_id: str, db: Session = Depends(get_db)):
    """Compute tax liability and compare regimes"""
    try:
        # Get categorized transactions
        transactions = (
            db.query(Transaction).filter(Transaction.user_id == user_id).all()
        )

        # Calculate tax
        tax_data = await tax_calculator.calculate_tax(transactions)

        # Store tax computation
        db_tax_data = TaxData(
            id=str(uuid.uuid4()),
            user_id=user_id,
            financial_year="2024-25",
            total_income=tax_data["total_income"],
            taxable_income=tax_data["taxable_income"],
            old_regime_tax=tax_data["old_regime_tax"],
            new_regime_tax=tax_data["new_regime_tax"],
            deductions=json.dumps(tax_data["deductions"]),
            recommendations=json.dumps(tax_data["recommendations"]),
            created_at=datetime.now(),
        )
        db.add(db_tax_data)
        db.commit()

        return TaxComputationResponse(
            taxable_income=tax_data["taxable_income"],
            old_regime_tax=tax_data["old_regime_tax"],
            new_regime_tax=tax_data["new_regime_tax"],
            recommended_regime=tax_data["recommended_regime"],
            deductions=tax_data["deductions"],
            recommendations=tax_data["recommendations"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing tax: {str(e)}")


@app.get("/tax/recommendations/{user_id}")
async def get_tax_recommendations(user_id: str, db: Session = Depends(get_db)):
    """Get personalized tax-saving recommendations"""
    # Get latest tax data
    tax_data = (
        db.query(TaxData)
        .filter(TaxData.user_id == user_id)
        .order_by(TaxData.created_at.desc())
        .first()
    )

    if not tax_data:
        raise HTTPException(
            status_code=404,
            detail="No tax computation found. Please compute tax first.",
        )

    recommendations = json.loads(tax_data.recommendations)
    return {"recommendations": recommendations}


@app.get("/tax/report/{user_id}")
async def generate_tax_report(user_id: str, db: Session = Depends(get_db)):
    """Generate comprehensive tax report"""
    try:
        # Get latest tax data
        tax_data = (
            db.query(TaxData)
            .filter(TaxData.user_id == user_id)
            .order_by(TaxData.created_at.desc())
            .first()
        )

        if not tax_data:
            raise HTTPException(status_code=404, detail="No tax computation found")

        # Generate PDF report
        report_path = await tax_calculator.generate_tax_report(tax_data)

        return FileResponse(
            report_path,
            media_type="application/pdf",
            filename=f"tax_report_{user_id}_{datetime.now().strftime('%Y%m%d')}.pdf",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error generating tax report: {str(e)}"
        )


@app.post("/cibil/upload")
async def upload_cibil_report(
    file: UploadFile = File(...), user_id: str = None, db: Session = Depends(get_db)
):
    """Upload CIBIL/credit report"""
    try:
        # Upload file (reuse existing upload logic)
        file_response = await upload_file(file, user_id, "credit_report", db)
        file_id = file_response["file_id"]

        # Parse credit report
        file_record = db.query(FileUpload).filter(FileUpload.id == file_id).first()
        credit_data = await pdf_extractor.extract_credit_report_data(
            file_record.file_path
        )

        return {
            "file_id": file_id,
            "message": "Credit report uploaded and parsed successfully",
            "credit_data": credit_data,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error uploading credit report: {str(e)}"
        )


@app.post("/cibil/analyze")
async def analyze_cibil_score(user_id: str, db: Session = Depends(get_db)):
    """Analyze CIBIL score and provide recommendations"""
    try:
        # Get user's credit reports
        credit_files = (
            db.query(FileUpload)
            .filter(
                FileUpload.user_id == user_id, FileUpload.file_type == "credit_report"
            )
            .all()
        )

        if not credit_files:
            raise HTTPException(status_code=404, detail="No credit report found")

        # Analyze latest credit report
        latest_file = max(credit_files, key=lambda x: x.created_at)
        analysis = await cibil_analyzer.analyze_credit_report(latest_file.file_path)

        # Store analysis
        db_cibil_data = CIBILData(
            id=str(uuid.uuid4()),
            user_id=user_id,
            current_score=analysis.get("current_score"),
            credit_utilization=analysis.get("credit_utilization"),
            payment_history_score=analysis.get("payment_history_score"),
            analysis_data=json.dumps(analysis),
            recommendations=json.dumps(analysis.get("recommendations", [])),
            created_at=datetime.now(),
        )
        db.add(db_cibil_data)
        db.commit()

        return CIBILAnalysisResponse(
            current_score=analysis.get("current_score"),
            credit_utilization=analysis.get("credit_utilization"),
            payment_history_score=analysis.get("payment_history_score"),
            recommendations=analysis.get("recommendations", []),
            score_factors=analysis.get("score_factors", {}),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error analyzing CIBIL score: {str(e)}"
        )


@app.get("/cibil/recommendations/{user_id}")
async def get_cibil_recommendations(user_id: str, db: Session = Depends(get_db)):
    """Get CIBIL improvement recommendations"""
    cibil_data = (
        db.query(CIBILData)
        .filter(CIBILData.user_id == user_id)
        .order_by(CIBILData.created_at.desc())
        .first()
    )

    if not cibil_data:
        raise HTTPException(status_code=404, detail="No CIBIL analysis found")

    recommendations = json.loads(cibil_data.recommendations)
    return {"recommendations": recommendations}


@app.post("/assistant/query")
async def chat_with_assistant(query: ChatQuery):
    """Chat with AI assistant using RAG"""
    try:
        response = await rag_service.query(query.user_id, query.query)
        return {"response": response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")


@app.post("/knowledge/update")
async def update_knowledge_base():
    """Manually trigger knowledge base update"""
    try:
        await knowledge_scraper.scrape_tax_knowledge()
        return {"message": "Knowledge base updated successfully"}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error updating knowledge base: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now()}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)


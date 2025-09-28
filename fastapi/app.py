from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
import io
import re
import json
from datetime import datetime, timedelta
import asyncio
import tempfile
import os
from pathlib import Path
import sqlite3
import hashlib
import uuid

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Core libraries - with error handling for imports
try:
    import chromadb
    from sentence_transformers import SentenceTransformer
    CHROMADB_AVAILABLE = True
except ImportError:
    print("ChromaDB and/or SentenceTransformers not installed. Vector search will be disabled.")
    CHROMADB_AVAILABLE = False

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    print("Groq not installed. AI chat will be disabled.")
    GROQ_AVAILABLE = False

try:
    from crawl4ai import AsyncWebCrawler
    CRAWL4AI_AVAILABLE = True
except ImportError:
    print("Crawl4ai not installed. Web crawling will be disabled.")
    CRAWL4AI_AVAILABLE = False

try:
    import pdfplumber
    PDF_AVAILABLE = True
except ImportError:
    print("PDFPlumber not installed. PDF processing will be limited.")
    PDF_AVAILABLE = False

try:
    import pytesseract
    from PIL import Image
    import cv2
    OCR_AVAILABLE = True
except ImportError:
    print("OCR libraries not installed. OCR fallback will be disabled.")
    OCR_AVAILABLE = False

# Initialize components
app = FastAPI(title="Financial AI Assistant", description="AI-powered tax and finance analysis with RAG")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DATABASE_PATH = "./financial_reports.db"

def init_database():
    """Initialize SQLite database with tables for storing reports"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Table for transaction analyses
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transaction_analyses (
            id TEXT PRIMARY KEY,
            file_hash TEXT,
            filename TEXT,
            analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            transactions_data TEXT,
            summary_data TEXT,
            total_transactions INTEGER,
            total_income REAL,
            total_expenses REAL,
            date_range_start TEXT,
            date_range_end TEXT
        )
    ''')
    
    # Table for tax analyses
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tax_analyses (
            id TEXT PRIMARY KEY,
            analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            annual_income REAL,
            current_investments TEXT,
            old_regime_tax REAL,
            new_regime_tax REAL,
            recommendations TEXT,
            deductions_available TEXT
        )
    ''')
    
    # Table for CIBIL analyses
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cibil_analyses (
            id TEXT PRIMARY KEY,
            file_hash TEXT,
            filename TEXT,
            analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            current_score INTEGER,
            factors TEXT,
            recommendations TEXT,
            improvement_potential INTEGER
        )
    ''')
    
    # Table for chat queries
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_queries (
            id TEXT PRIMARY KEY,
            query_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            question TEXT,
            answer TEXT,
            user_context TEXT,
            sources_used INTEGER,
            confidence TEXT
        )
    ''')
    
    conn.commit()
    conn.close()

def get_file_hash(content: bytes) -> str:
    """Generate hash for file content to detect duplicates"""
    return hashlib.sha256(content).hexdigest()

def save_transaction_analysis(file_hash: str, filename: str, transactions: List[Dict], summary: Dict) -> str:
    """Save transaction analysis to database"""
    analysis_id = str(uuid.uuid4())
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO transaction_analyses 
        (id, file_hash, filename, transactions_data, summary_data, total_transactions, 
         total_income, total_expenses, date_range_start, date_range_end)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        analysis_id,
        file_hash,
        filename,
        json.dumps(transactions),
        json.dumps(summary),
        summary.get('total_transactions', 0),
        summary.get('total_income', 0.0),
        summary.get('total_expenses', 0.0),
        summary.get('date_range', {}).get('start'),
        summary.get('date_range', {}).get('end')
    ))
    
    conn.commit()
    conn.close()
    
    return analysis_id

def save_tax_analysis(annual_income: float, investments: str, old_tax: float, 
                     new_tax: float, recommendations: List[str], deductions: Dict) -> str:
    """Save tax analysis to database"""
    analysis_id = str(uuid.uuid4())
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO tax_analyses 
        (id, annual_income, current_investments, old_regime_tax, new_regime_tax, 
         recommendations, deductions_available)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        analysis_id,
        annual_income,
        investments,
        old_tax,
        new_tax,
        json.dumps(recommendations),
        json.dumps(deductions)
    ))
    
    conn.commit()
    conn.close()
    
    return analysis_id

def save_cibil_analysis(file_hash: str, filename: str, score: Optional[int], 
                       factors: Dict, recommendations: List[str], improvement: int) -> str:
    """Save CIBIL analysis to database"""
    analysis_id = str(uuid.uuid4())
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO cibil_analyses 
        (id, file_hash, filename, current_score, factors, recommendations, improvement_potential)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        analysis_id,
        file_hash,
        filename,
        score,
        json.dumps(factors),
        json.dumps(recommendations),
        improvement
    ))
    
    conn.commit()
    conn.close()
    
    return analysis_id

def save_chat_query(question: str, answer: str, user_context: Optional[Dict], 
                   sources_used: int, confidence: str) -> str:
    """Save chat query to database"""
    query_id = str(uuid.uuid4())
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO chat_queries 
        (id, question, answer, user_context, sources_used, confidence)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        query_id,
        question,
        answer,
        json.dumps(user_context) if user_context else None,
        sources_used,
        confidence
    ))
    
    conn.commit()
    conn.close()
    
    return query_id

def get_existing_transaction_analysis(file_hash: str) -> Optional[Dict]:
    """Check if analysis already exists for this file"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT transactions_data, summary_data 
        FROM transaction_analyses 
        WHERE file_hash = ? 
        ORDER BY analysis_date DESC 
        LIMIT 1
    ''', (file_hash,))
    
    result = cursor.fetchone()
    conn.close()
    
    if result:
        return {
            'transactions': json.loads(result[0]),
            'summary': json.loads(result[1])
        }
    return None

def get_existing_cibil_analysis(file_hash: str) -> Optional[Dict]:
    """Check if CIBIL analysis already exists for this file"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT current_score, factors, recommendations, improvement_potential 
        FROM cibil_analyses 
        WHERE file_hash = ? 
        ORDER BY analysis_date DESC 
        LIMIT 1
    ''', (file_hash,))
    
    result = cursor.fetchone()
    conn.close()
    
    if result:
        return {
            'current_score': result[0],
            'factors': json.loads(result[1]),
            'recommendations': json.loads(result[2]),
            'improvement_potential': result[3]
        }
    return None

# Initialize components conditionally
if CHROMADB_AVAILABLE:
    try:
        embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        chroma_client = chromadb.PersistentClient(path="./chroma_db")
        collection = chroma_client.get_or_create_collection(name="financial_knowledge")
    except Exception as e:
        print(f"Error initializing ChromaDB: {e}")
        CHROMADB_AVAILABLE = False

if GROQ_AVAILABLE:
    try:
        groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        if not os.getenv("GROQ_API_KEY"):
            print("GROQ_API_KEY not set. AI features will be limited.")
    except Exception as e:
        print(f"Error initializing Groq: {e}")
        GROQ_AVAILABLE = False

# Pydantic models
class TransactionData(BaseModel):
    transactions: List[Dict[str, Any]]
    summary: Dict[str, Any]

class TaxAnalysis(BaseModel):
    old_regime_tax: float
    new_regime_tax: float
    recommendations: List[str]
    deductions_available: Dict[str, float]

class CIBILAnalysis(BaseModel):
    current_score: Optional[int]
    factors: Dict[str, Any]
    recommendations: List[str]
    improvement_potential: int

class ChatQuery(BaseModel):
    question: str
    user_context: Optional[Dict] = None

class ReportSummary(BaseModel):
    id: str
    type: str
    created_date: str
    filename: Optional[str] = None
    summary: Dict[str, Any]

# Financial categories for transaction classification
FINANCIAL_CATEGORIES = {
    'income': ['salary', 'freelance', 'dividend', 'interest', 'bonus', 'refund'],
    'emi': ['emi', 'loan', 'mortgage', 'car loan', 'home loan', 'personal loan'],
    'sip': ['sip', 'mutual fund', 'systematic', 'investment', 'elss'],
    'rent': ['rent', 'house rent', 'apartment', 'accommodation'],
    'insurance': ['insurance', 'premium', 'life insurance', 'health insurance'],
    'utilities': ['electricity', 'gas', 'water', 'internet', 'mobile', 'phone'],
    'food': ['restaurant', 'food', 'grocery', 'supermarket', 'dining'],
    'transport': ['fuel', 'petrol', 'taxi', 'uber', 'ola', 'metro', 'bus'],
    'entertainment': ['movie', 'entertainment', 'netflix', 'spotify', 'game'],
    'shopping': ['shopping', 'amazon', 'flipkart', 'clothing', 'electronics'],
    'medical': ['hospital', 'doctor', 'medical', 'pharmacy', 'medicine'],
    'education': ['school', 'college', 'course', 'book', 'education', 'tuition']
}

# Tax slabs and deductions (FY 2024-25)
OLD_REGIME_SLABS = [
    (250000, 0), (500000, 0.05), (1000000, 0.20), (float('inf'), 0.30)
]
NEW_REGIME_SLABS = [
    (300000, 0), (600000, 0.05), (900000, 0.10), (1200000, 0.15),
    (1500000, 0.20), (float('inf'), 0.30)
]

DEDUCTION_LIMITS = {
    '80C': 150000,  # PPF, ELSS, Life Insurance
    '80D': 25000,   # Health Insurance (up to 50k for senior citizens)
    '80G': 100000,  # Donations
    '24b': 200000   # Home Loan Interest
}

class FinancialProcessor:
    """Core financial data processing class"""
    
    @staticmethod
    def extract_text_from_pdf(file_content: bytes) -> str:
        """Extract text from PDF with OCR fallback"""
        if not PDF_AVAILABLE:
            return "PDF processing not available. Please install pdfplumber."
            
        try:
            # First try direct text extraction
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                text = ""
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                
                if text.strip():
                    return text
        except Exception as e:
            print(f"Direct PDF extraction failed: {e}")
        
        # Fallback to OCR if available
        if not OCR_AVAILABLE:
            return "Could not extract text from PDF. OCR libraries not available."
            
        try:
            # Save to temp file for OCR processing
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
                tmp_file.write(file_content)
                tmp_path = tmp_file.name
            
            try:
                import fitz  # PyMuPDF
                doc = fitz.open(tmp_path)
                text = ""
                
                for page_num in range(doc.page_count):
                    page = doc[page_num]
                    pix = page.get_pixmap()
                    img_data = pix.tobytes("png")
                    
                    # OCR the image
                    image = Image.open(io.BytesIO(img_data))
                    page_text = pytesseract.image_to_string(image)
                    text += page_text + "\n"
                
                doc.close()
                return text
            finally:
                os.unlink(tmp_path)
                
        except Exception as e:
            print(f"OCR extraction failed: {e}")
            return ""
    
    @staticmethod
    def categorize_transaction(description: str) -> str:
        """Categorize transaction based on description"""
        description_lower = description.lower()
        
        for category, keywords in FINANCIAL_CATEGORIES.items():
            for keyword in keywords:
                if keyword in description_lower:
                    return category
        
        # Default category
        if any(word in description_lower for word in ['transfer', 'payment', 'debit']):
            return 'other_expense'
        elif any(word in description_lower for word in ['credit', 'deposit']):
            return 'other_income'
        
        return 'uncategorized'
    
    @staticmethod
    def detect_recurring_transactions(transactions: List[Dict]) -> List[Dict]:
        """Detect recurring transactions"""
        # Group by similar amounts and descriptions
        recurring = []
        df = pd.DataFrame(transactions)
        
        if len(df) == 0:
            return recurring
        
        # Group by rounded amount and similar description
        for amount in df['amount'].round(-2).unique():  # Round to nearest 100
            similar_amount = df[df['amount'].between(amount * 0.95, amount * 1.05)]
            
            if len(similar_amount) >= 2:
                # Check for similar descriptions
                descriptions = similar_amount['description'].str.lower()
                for desc in descriptions.unique():
                    if len(desc) >= 10:  # Only check descriptions with sufficient length
                        matches = similar_amount[descriptions.str.contains(desc[:10], na=False)]
                        if len(matches) >= 2:
                            recurring.extend(matches.to_dict('records'))
        
        return recurring
    
    @staticmethod
    def calculate_tax(income: float, regime: str = 'new') -> Dict[str, Any]:
        """Calculate tax for given income and regime"""
        slabs = NEW_REGIME_SLABS if regime == 'new' else OLD_REGIME_SLABS
        tax = 0
        prev_limit = 0
        
        for limit, rate in slabs:
            if income <= prev_limit:
                break
            
            taxable_in_slab = min(income, limit) - prev_limit
            tax += taxable_in_slab * rate
            prev_limit = limit
            
            if income <= limit:
                break
        
        # Add cess (4% on tax)
        total_tax = tax * 1.04
        
        return {
            'gross_tax': tax,
            'cess': tax * 0.04,
            'total_tax': total_tax,
            'effective_rate': total_tax / income if income > 0 else 0
        }

# Initialize the processor
processor = FinancialProcessor()

@app.on_event("startup")
async def startup_event():
    """Initialize the application"""
    # Create necessary directories
    os.makedirs("./uploads", exist_ok=True)
    os.makedirs("./chroma_db", exist_ok=True)
    
    # Initialize database
    init_database()
    
    # Initialize with some basic financial knowledge
    if CHROMADB_AVAILABLE:
        basic_knowledge = [
            {
                'content': "Section 80C allows deduction up to ₹1.5 lakh for investments in PPF, ELSS, life insurance, and tax-saving FDs.",
                'metadata': {'type': 'tax_deduction', 'section': '80C'}
            },
            {
                'content': "CIBIL score above 750 is considered good. Credit utilization should be below 30% for optimal score.",
                'metadata': {'type': 'cibil', 'topic': 'score_factors'}
            },
            {
                'content': "Home loan interest deduction under section 24(b) allows up to ₹2 lakh deduction for self-occupied property.",
                'metadata': {'type': 'tax_deduction', 'section': '24b'}
            }
        ]
        
        # Add to vector database if not exists
        try:
            existing_ids = collection.get()['ids']
            if not existing_ids:
                embeddings = embedding_model.encode([item['content'] for item in basic_knowledge])
                collection.add(
                    embeddings=embeddings.tolist(),
                    documents=[item['content'] for item in basic_knowledge],
                    metadatas=[item['metadata'] for item in basic_knowledge],
                    ids=[f"basic_{i}" for i in range(len(basic_knowledge))]
                )
        except Exception as e:
            print(f"Error initializing knowledge base: {e}")

@app.post("/upload/statements", response_model=TransactionData)
async def upload_statements(files: List[UploadFile] = File(...)):
    """Upload and process bank/credit card statements"""
    
    # Validate files
    if not files or len(files) == 0:
        raise HTTPException(status_code=422, detail="No files provided")
    
    all_transactions = []
    combined_file_hash = ""
    filenames = []
    
    try:
        for file in files:
            # Validate file
            if not file.filename:
                continue
                
            # Check file size (limit to 10MB)
            content = await file.read()
            if len(content) > 10 * 1024 * 1024:
                raise HTTPException(status_code=422, detail=f"File {file.filename} is too large (max 10MB)")
            
            if len(content) == 0:
                continue
            
            filenames.append(file.filename)
            combined_file_hash += get_file_hash(content)
                
            file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
            
            # Process based on file type
            if file_extension == 'csv':
                try:
                    df = pd.read_csv(io.BytesIO(content))
                except Exception as e:
                    raise HTTPException(status_code=422, detail=f"Invalid CSV format in {file.filename}: {str(e)}")
                    
            elif file_extension in ['xlsx', 'xls']:
                try:
                    df = pd.read_excel(io.BytesIO(content))
                except Exception as e:
                    raise HTTPException(status_code=422, detail=f"Invalid Excel format in {file.filename}: {str(e)}")
                    
            elif file_extension == 'pdf':
                # Extract text and parse transactions
                text = processor.extract_text_from_pdf(content)
                if not text.strip():
                    raise HTTPException(status_code=422, detail=f"Could not extract text from PDF {file.filename}")
                
                transactions = parse_statement_text(text)
                all_transactions.extend(transactions)
                continue
            else:
                raise HTTPException(status_code=422, detail=f"Unsupported file type: {file_extension}. Supported: CSV, Excel, PDF")
            
            # Process CSV/Excel data
            if df.empty:
                continue
                
            transactions = process_dataframe(df)
            all_transactions.extend(transactions)
        
        if not all_transactions:
            raise HTTPException(status_code=422, detail="No valid transactions found in uploaded files")
        
        # Generate hash for all files combined
        final_file_hash = hashlib.sha256(combined_file_hash.encode()).hexdigest()
        
        # Check if analysis already exists
        existing_analysis = get_existing_transaction_analysis(final_file_hash)
        if existing_analysis:
            print(f"Returning cached analysis for files: {', '.join(filenames)}")
            return TransactionData(
                transactions=existing_analysis['transactions'],
                summary=existing_analysis['summary']
            )
        
        # Categorize transactions
        for transaction in all_transactions:
            transaction['category'] = processor.categorize_transaction(transaction.get('description', ''))
        
        # Detect recurring transactions
        recurring = processor.detect_recurring_transactions(all_transactions)
        
        # Generate summary
        df_transactions = pd.DataFrame(all_transactions)
        
        # Handle empty dataframe case
        if df_transactions.empty:
            summary = {
                'total_transactions': 0,
                'total_income': 0,
                'total_expenses': 0,
                'categories': {},
                'recurring_count': 0,
                'date_range': {'start': None, 'end': None}
            }
        else:
            # Convert date column to datetime
            df_transactions['date'] = pd.to_datetime(df_transactions['date'], errors='coerce')
            
            summary = {
                'total_transactions': len(all_transactions),
                'total_income': float(df_transactions[df_transactions['amount'] > 0]['amount'].sum()),
                'total_expenses': float(abs(df_transactions[df_transactions['amount'] < 0]['amount'].sum())),
                'categories': df_transactions['category'].value_counts().to_dict(),
                'recurring_count': len(recurring),
                'date_range': {
                    'start': df_transactions['date'].min().isoformat() if not pd.isna(df_transactions['date'].min()) else None,
                    'end': df_transactions['date'].max().isoformat() if not pd.isna(df_transactions['date'].max()) else None
                }
            }
        
        # Save analysis to database
        analysis_id = save_transaction_analysis(
            final_file_hash,
            ', '.join(filenames),
            all_transactions,
            summary
        )
        
        print(f"Saved transaction analysis with ID: {analysis_id}")
        
        return TransactionData(transactions=all_transactions, summary=summary)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing statements: {str(e)}")


@app.post("/analyze/tax", response_model=TaxAnalysis)
async def analyze_tax(
    annual_income: float = Form(...),
    current_investments: str = Form(default="{}")
):
    """Analyze tax implications and provide optimization suggestions"""
    try:
        # Parse the JSON string safely
        try:
            investments_dict = json.loads(current_investments) if current_investments else {}
        except json.JSONDecodeError:
            investments_dict = {}
        
        # Validate annual income
        if annual_income <= 0:
            raise HTTPException(status_code=422, detail="Annual income must be positive")
        
        # Calculate tax under both regimes
        old_regime = processor.calculate_tax(annual_income, 'old')
        new_regime = processor.calculate_tax(annual_income, 'new')
        
        # Calculate potential deductions
        available_deductions = {}
        for section, limit in DEDUCTION_LIMITS.items():
            current_investment = investments_dict.get(section, 0)
            available_deductions[section] = max(0, limit - current_investment)
        
        # Generate recommendations
        recommendations = []
        
        if old_regime['total_tax'] < new_regime['total_tax']:
            recommendations.append("Old tax regime is more beneficial for you")
            if available_deductions['80C'] > 0:
                potential_saving = available_deductions['80C'] * 0.30  # Assuming 30% tax bracket
                recommendations.append(f"Invest ₹{available_deductions['80C']:,.0f} more in 80C to save ₹{potential_saving:,.0f}")
        else:
            recommendations.append("New tax regime is more beneficial for you")
        
        if available_deductions['80D'] > 0:
            recommendations.append(f"Consider health insurance for ₹{available_deductions['80D']:,.0f} deduction")
        
        # Save analysis to database
        analysis_id = save_tax_analysis(
            annual_income,
            current_investments,
            old_regime['total_tax'],
            new_regime['total_tax'],
            recommendations,
            available_deductions
        )
        
        print(f"Saved tax analysis with ID: {analysis_id}")
        
        return TaxAnalysis(
            old_regime_tax=old_regime['total_tax'],
            new_regime_tax=new_regime['total_tax'],
            recommendations=recommendations,
            deductions_available=available_deductions
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error analyzing tax: {str(e)}")


@app.post("/analyze/cibil", response_model=CIBILAnalysis)
async def analyze_cibil(file: UploadFile = File(...)):
    """Analyze CIBIL report and provide improvement suggestions"""
    try:
        content = await file.read()
        file_hash = get_file_hash(content)
        
        # Check if analysis already exists
        existing_analysis = get_existing_cibil_analysis(file_hash)
        if existing_analysis:
            print(f"Returning cached CIBIL analysis for file: {file.filename}")
            return CIBILAnalysis(**existing_analysis)
        
        # Extract text from CIBIL report
        if file.filename.endswith('.pdf'):
            text = processor.extract_text_from_pdf(content)
        else:
            text = content.decode('utf-8')
        
        # Parse CIBIL data (simplified parsing)
        cibil_data = parse_cibil_report(text)
        
        # Analyze factors
        factors = {
            'credit_utilization': cibil_data.get('credit_utilization', 0),
            'payment_history': cibil_data.get('payment_history', 'Unknown'),
            'credit_age': cibil_data.get('credit_age', 0),
            'credit_mix': cibil_data.get('credit_mix', 'Unknown'),
            'recent_inquiries': cibil_data.get('recent_inquiries', 0)
        }
        
        # Generate recommendations
        recommendations = []
        improvement_potential = 0
        
        if factors['credit_utilization'] > 30:
            recommendations.append("Reduce credit utilization below 30% to improve score")
            improvement_potential += 50
        
        if factors['recent_inquiries'] > 3:
            recommendations.append("Avoid new credit applications for 6 months")
            improvement_potential += 20
        
        if 'missed' in str(factors['payment_history']).lower():
            recommendations.append("Ensure all EMIs and credit card payments are on time")
            improvement_potential += 80
        
        # Save analysis to database
        analysis_id = save_cibil_analysis(
            file_hash,
            file.filename,
            cibil_data.get('score'),
            factors,
            recommendations,
            min(improvement_potential, 100)
        )
        
        print(f"Saved CIBIL analysis with ID: {analysis_id}")
        
        return CIBILAnalysis(
            current_score=cibil_data.get('score'),
            factors=factors,
            recommendations=recommendations,
            improvement_potential=min(improvement_potential, 100)
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error analyzing CIBIL: {str(e)}")

@app.post("/search/update-knowledge")
async def update_knowledge(query: str = Form(...)):
    """Search for latest financial information and update knowledge base"""
    if not CRAWL4AI_AVAILABLE:
        return {"message": "Web crawling not available. Please install crawl4ai."}
        
    if not CHROMADB_AVAILABLE:
        return {"message": "Vector database not available. Please install chromadb and sentence-transformers."}
        
    try:
        # Use crawl4ai to search for financial information
        async with AsyncWebCrawler(verbose=True) as crawler:
            # Search for government tax updates
            search_queries = [
                f"{query} site:incometax.gov.in",
                f"{query} tax rules India 2024",
                f"latest {query} updates"
            ]
            
            new_documents = []
            
            for search_query in search_queries:
                try:
                    # Crawl search results (you might want to use actual search API)
                    result = await crawler.arun(
                        url=f"https://www.google.com/search?q={search_query}",
                        word_count_threshold=100,
                        extraction_strategy="NoExtractionStrategy"
                    )
                    
                    if result.success and result.cleaned_html:
                        # Process and chunk the content to fit context
                        chunks = chunk_content(result.cleaned_html, max_tokens=1000)
                        
                        for i, chunk in enumerate(chunks[:5]):  # Limit to 5 chunks per query
                            new_documents.append({
                                'content': chunk,
                                'metadata': {
                                    'source': 'web_search',
                                    'query': search_query,
                                    'timestamp': datetime.now().isoformat()
                                }
                            })
                
                except Exception as e:
                    print(f"Error crawling for query '{search_query}': {e}")
                    continue
            
            # Add to vector database
            if new_documents:
                embeddings = embedding_model.encode([doc['content'] for doc in new_documents])
                
                collection.add(
                    embeddings=embeddings.tolist(),
                    documents=[doc['content'] for doc in new_documents],
                    metadatas=[doc['metadata'] for doc in new_documents],
                    ids=[f"web_{datetime.now().timestamp()}_{i}" for i in range(len(new_documents))]
                )
                
                return {"message": f"Added {len(new_documents)} new documents to knowledge base"}
            else:
                return {"message": "No new information found"}
                
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error updating knowledge: {str(e)}")

@app.post("/chat/query")
async def chat_query(query: ChatQuery):
    """AI-powered Q&A with RAG capabilities"""
    try:
        # Validate input
        if not query.question or len(query.question.strip()) == 0:
            raise HTTPException(status_code=422, detail="Question cannot be empty")
        
        # Check if required services are available
        if not GROQ_AVAILABLE:
            answer = "AI chat is currently unavailable. Please install the 'groq' library and set GROQ_API_KEY."
            sources_used = 0
            confidence = "low"
        elif not os.getenv("GROQ_API_KEY"):
            answer = "AI chat is currently unavailable. Please set up GROQ_API_KEY environment variable."
            sources_used = 0
            confidence = "low"
        else:
            context = ""
            sources_used = 0
            
            # Search vector database if available
            if CHROMADB_AVAILABLE:
                try:
                    query_embedding = embedding_model.encode([query.question])
                    results = collection.query(
                        query_embeddings=query_embedding.tolist(),
                        n_results=5
                    )
                    context = "\n".join(results['documents'][0]) if results.get('documents') and results['documents'][0] else ""
                    sources_used = len(results['documents'][0]) if results.get('documents') else 0
                except Exception as e:
                    print(f"Vector search error: {e}")
            
            # Prepare system prompt
            system_prompt = f"""
            You are a financial advisor AI assistant specializing in Indian tax laws and personal finance.
            Use the following context from updated financial knowledge and user data to provide accurate, personalized advice.
            
            Context from knowledge base:
            {context}
            
            User context (if provided):
            {json.dumps(query.user_context) if query.user_context else 'No user context provided'}
            
            Guidelines:
            - Provide specific, actionable advice
            - Mention relevant sections of tax law when applicable
            - If uncertain about current laws, recommend consulting a tax professional
            - Keep responses concise but comprehensive
            - Use Indian currency (₹) and tax year format
            """
            
            try:
                # Call Groq API
                completion = groq_client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": query.question}
                    ],
                    temperature=0.1,
                    max_tokens=1000
                )
                
                answer = completion.choices[0].message.content
                confidence = "high" if context else "medium"
                
            except Exception as groq_error:
                print(f"Groq API error: {groq_error}")
                # Fallback response
                answer = f"I understand you're asking about: {query.question}. However, I'm currently unable to access the AI service. For tax-related queries, I recommend consulting with a qualified tax professional or checking the latest information on incometax.gov.in"
                confidence = "low"
        
        # Save chat query to database
        query_id = save_chat_query(
            query.question,
            answer,
            query.user_context,
            sources_used,
            confidence
        )
        
        print(f"Saved chat query with ID: {query_id}")
        
        return {
            "answer": answer,
            "sources_used": sources_used,
            "confidence": confidence
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing query: {str(e)}")

# New endpoints for fetching saved reports

@app.get("/reports/list")
async def list_reports(
    report_type: Optional[str] = Query(None, description="Filter by report type: transaction, tax, cibil, chat"),
    limit: int = Query(10, description="Number of reports to return"),
    offset: int = Query(0, description="Offset for pagination")
):
    """List all saved reports with pagination"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    reports = []
    
    try:
        # Transaction reports
        if not report_type or report_type == "transaction":
            cursor.execute('''
                SELECT id, filename, analysis_date, total_transactions, total_income, total_expenses
                FROM transaction_analyses 
                ORDER BY analysis_date DESC 
                LIMIT ? OFFSET ?
            ''', (limit, offset))
            
            for row in cursor.fetchall():
                reports.append({
                    'id': row[0],
                    'type': 'transaction',
                    'filename': row[1],
                    'created_date': row[2],
                    'summary': {
                        'total_transactions': row[3],
                        'total_income': row[4],
                        'total_expenses': row[5]
                    }
                })
        
        # Tax reports
        if not report_type or report_type == "tax":
            cursor.execute('''
                SELECT id, analysis_date, annual_income, old_regime_tax, new_regime_tax
                FROM tax_analyses 
                ORDER BY analysis_date DESC 
                LIMIT ? OFFSET ?
            ''', (limit, offset))
            
            for row in cursor.fetchall():
                reports.append({
                    'id': row[0],
                    'type': 'tax',
                    'filename': None,
                    'created_date': row[1],
                    'summary': {
                        'annual_income': row[2],
                        'old_regime_tax': row[3],
                        'new_regime_tax': row[4]
                    }
                })
        
        # CIBIL reports
        if not report_type or report_type == "cibil":
            cursor.execute('''
                SELECT id, filename, analysis_date, current_score, improvement_potential
                FROM cibil_analyses 
                ORDER BY analysis_date DESC 
                LIMIT ? OFFSET ?
            ''', (limit, offset))
            
            for row in cursor.fetchall():
                reports.append({
                    'id': row[0],
                    'type': 'cibil',
                    'filename': row[1],
                    'created_date': row[2],
                    'summary': {
                        'current_score': row[3],
                        'improvement_potential': row[4]
                    }
                })
        
        # Chat queries
        if not report_type or report_type == "chat":
            cursor.execute('''
                SELECT id, query_date, question, sources_used, confidence
                FROM chat_queries 
                ORDER BY query_date DESC 
                LIMIT ? OFFSET ?
            ''', (limit, offset))
            
            for row in cursor.fetchall():
                reports.append({
                    'id': row[0],
                    'type': 'chat',
                    'filename': None,
                    'created_date': row[1],
                    'summary': {
                        'question': row[2][:100] + "..." if len(row[2]) > 100 else row[2],
                        'sources_used': row[3],
                        'confidence': row[4]
                    }
                })
        
        # Sort all reports by date
        reports.sort(key=lambda x: x['created_date'], reverse=True)
        
        return {
            "reports": reports[:limit],
            "total_count": len(reports),
            "has_more": len(reports) > limit
        }
        
    finally:
        conn.close()

@app.get("/reports/transaction/{report_id}")
async def get_transaction_report(report_id: str):
    """Get detailed transaction analysis report"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT transactions_data, summary_data, filename, analysis_date
            FROM transaction_analyses 
            WHERE id = ?
        ''', (report_id,))
        
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Transaction report not found")
        
        return {
            'id': report_id,
            'transactions': json.loads(result[0]),
            'summary': json.loads(result[1]),
            'filename': result[2],
            'created_date': result[3]
        }
        
    finally:
        conn.close()

@app.get("/reports/tax/{report_id}")
async def get_tax_report(report_id: str):
    """Get detailed tax analysis report"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT annual_income, current_investments, old_regime_tax, new_regime_tax, 
                   recommendations, deductions_available, analysis_date
            FROM tax_analyses 
            WHERE id = ?
        ''', (report_id,))
        
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Tax report not found")
        
        return {
            'id': report_id,
            'annual_income': result[0],
            'current_investments': json.loads(result[1]) if result[1] else {},
            'old_regime_tax': result[2],
            'new_regime_tax': result[3],
            'recommendations': json.loads(result[4]),
            'deductions_available': json.loads(result[5]),
            'created_date': result[6]
        }
        
    finally:
        conn.close()

@app.get("/reports/cibil/{report_id}")
async def get_cibil_report(report_id: str):
    """Get detailed CIBIL analysis report"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT current_score, factors, recommendations, improvement_potential, 
                   filename, analysis_date
            FROM cibil_analyses 
            WHERE id = ?
        ''', (report_id,))
        
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="CIBIL report not found")
        
        return {
            'id': report_id,
            'current_score': result[0],
            'factors': json.loads(result[1]),
            'recommendations': json.loads(result[2]),
            'improvement_potential': result[3],
            'filename': result[4],
            'created_date': result[5]
        }
        
    finally:
        conn.close()

@app.get("/reports/chat/{query_id}")
async def get_chat_query(query_id: str):
    """Get detailed chat query and response"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT question, answer, user_context, sources_used, confidence, query_date
            FROM chat_queries 
            WHERE id = ?
        ''', (query_id,))
        
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Chat query not found")
        
        return {
            'id': query_id,
            'question': result[0],
            'answer': result[1],
            'user_context': json.loads(result[2]) if result[2] else None,
            'sources_used': result[3],
            'confidence': result[4],
            'created_date': result[5]
        }
        
    finally:
        conn.close()

@app.delete("/reports/{report_type}/{report_id}")
async def delete_report(report_type: str, report_id: str):
    """Delete a specific report"""
    if report_type not in ['transaction', 'tax', 'cibil', 'chat']:
        raise HTTPException(status_code=400, detail="Invalid report type")
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    try:
        table_map = {
            'transaction': 'transaction_analyses',
            'tax': 'tax_analyses',
            'cibil': 'cibil_analyses',
            'chat': 'chat_queries'
        }
        
        table_name = table_map[report_type]
        
        cursor.execute(f'DELETE FROM {table_name} WHERE id = ?', (report_id,))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Report not found")
        
        conn.commit()
        
        return {"message": f"Report {report_id} deleted successfully"}
        
    finally:
        conn.close()

# Helper functions

def process_dataframe(df: pd.DataFrame) -> List[Dict]:
    """Process transaction dataframe with improved error handling"""
    if df.empty:
        return []
        
    transactions = []
        
    # Try to identify columns (flexible column detection)
    date_cols = [col for col in df.columns if any(word in col.lower() for word in ['date', 'transaction_date', 'posting_date'])]
    desc_cols = [col for col in df.columns if any(word in col.lower() for word in ['description', 'narration', 'particulars', 'details'])]
    amount_cols = [col for col in df.columns if any(word in col.lower() for word in ['amount', 'debit', 'credit', 'withdrawal', 'deposit'])]
        
    # Fallback to positional mapping if column names don't match
    if not (date_cols and desc_cols and amount_cols):
        if len(df.columns) >= 3:
            date_col, desc_col, amount_col = df.columns[0], df.columns[1], df.columns[-1]
        else:
            raise ValueError("Cannot identify required columns. Expected at least 3 columns: Date, Description, Amount")
    else:
        date_col, desc_col, amount_col = date_cols[0], desc_cols[0], amount_cols[0]
        
    for idx, row in df.iterrows():
        try:
            # Handle date parsing
            date_val = row[date_col]
            if pd.isna(date_val):
                continue
                
            parsed_date = pd.to_datetime(date_val, errors='coerce')
            if pd.isna(parsed_date):
                continue
                
            # Handle description
            desc_val = str(row[desc_col]) if not pd.isna(row[desc_col]) else f"Transaction {idx}"
                
            # Handle amount
            amount_val = row[amount_col]
            if pd.isna(amount_val):
                continue
                
            # Clean amount (remove commas, currency symbols)
            if isinstance(amount_val, str):
                amount_val = re.sub(r'[^\d.-]', '', amount_val)
                
            amount = float(amount_val)
                
            transaction = {
                'date': parsed_date.isoformat(),
                'description': desc_val.strip(),
                'amount': amount
            }
            transactions.append(transaction)
                
        except (ValueError, TypeError) as e:
            # Skip malformed rows but log the issue
            print(f"Skipping row {idx}: {e}")
            continue
        
    return transactions

def parse_statement_text(text: str) -> List[Dict]:
    """Parse transaction text from PDF statements"""
    transactions = []
    lines = text.split('\n')
    
    # Simple pattern matching for common statement formats
    date_pattern = r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}'
    amount_pattern = r'[\d,]+\.?\d*'
    
    for line in lines:
        if re.search(date_pattern, line) and re.search(amount_pattern, line):
            try:
                # Extract date
                date_match = re.search(date_pattern, line)
                date_str = date_match.group() if date_match else ''
                
                # Extract amount (last number in line)
                amounts = re.findall(r'[\d,]+\.?\d*', line)
                amount = float(amounts[-1].replace(',', '')) if amounts else 0
                
                # Description is the remaining text
                description = re.sub(date_pattern, '', line)
                description = re.sub(r'[\d,]+\.?\d*', '', description).strip()
                
                # Determine if it's debit or credit based on context
                if any(word in line.lower() for word in ['cr', 'credit', 'deposit']):
                    amount = abs(amount)
                else:
                    amount = -abs(amount)
                
                transaction = {
                    'date': pd.to_datetime(date_str, errors='coerce').isoformat(),
                    'description': description,
                    'amount': amount
                }
                transactions.append(transaction)
            except Exception:
                continue
    
    return transactions

def parse_cibil_report(text: str) -> Dict:
    """Parse CIBIL report text"""
    cibil_data = {}
    
    # Extract CIBIL score
    score_match = re.search(r'cibil.*?score.*?(\d{3})', text, re.IGNORECASE)
    if score_match:
        cibil_data['score'] = int(score_match.group(1))
    
    # Extract credit utilization
    util_match = re.search(r'utilization.*?(\d{1,3})%', text, re.IGNORECASE)
    if util_match:
        cibil_data['credit_utilization'] = int(util_match.group(1))
    
    # Extract payment history
    if 'missed payment' in text.lower():
        cibil_data['payment_history'] = 'Has missed payments'
    elif 'timely payment' in text.lower():
        cibil_data['payment_history'] = 'All payments on time'
    
    # Extract credit age
    age_match = re.search(r'credit.*?age.*?(\d+).*?years?', text, re.IGNORECASE)
    if age_match:
        cibil_data['credit_age'] = int(age_match.group(1))
    
    # Count recent inquiries
    inquiry_matches = re.findall(r'inquiry|enquiry', text, re.IGNORECASE)
    cibil_data['recent_inquiries'] = len(inquiry_matches)
    
    return cibil_data

def chunk_content(content: str, max_tokens: int = 1000) -> List[str]:
    """Chunk content to fit within token limits"""
    # Rough estimate: 1 token ≈ 4 characters
    max_chars = max_tokens * 4
    
    if len(content) <= max_chars:
        return [content]
    
    chunks = []
    words = content.split()
    current_chunk = []
    current_length = 0
    
    for word in words:
        if current_length + len(word) + 1 <= max_chars:
            current_chunk.append(word)
            current_length += len(word) + 1
        else:
            if current_chunk:
                chunks.append(' '.join(current_chunk))
                current_chunk = [word]
                current_length = len(word)
    
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    return chunks

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "services": {
            "chromadb": CHROMADB_AVAILABLE,
            "groq": GROQ_AVAILABLE,
            "crawl4ai": CRAWL4AI_AVAILABLE,
            "pdf_processing": PDF_AVAILABLE,
            "ocr": OCR_AVAILABLE,
            "database": os.path.exists(DATABASE_PATH)
        }
    }

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Financial AI Assistant API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "upload_statements": "/upload/statements",
            "analyze_tax": "/analyze/tax",
            "analyze_cibil": "/analyze/cibil",
            "update_knowledge": "/search/update-knowledge",
            "chat_query": "/chat/query",
            "list_reports": "/reports/list",
            "get_transaction_report": "/reports/transaction/{report_id}",
            "get_tax_report": "/reports/tax/{report_id}",
            "get_cibil_report": "/reports/cibil/{report_id}",
            "get_chat_query": "/reports/chat/{query_id}",
            "delete_report": "/reports/{report_type}/{report_id}"
        },
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",  # Use import string instead of app object
        host="0.0.0.0",
        port=8000,
        reload=True
    )
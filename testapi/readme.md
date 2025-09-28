# TaxWise: AI-Powered Tax Assistant for Indian Users

## 🌟 Overview

TaxWise is a comprehensive AI-powered personal finance platform designed specifically for Indian users. It simplifies tax filing, optimizes tax savings, and provides intelligent credit score management through advanced document processing, machine learning, and retrieval-augmented generation (RAG) capabilities.

## 🚀 Key Features

### 📊 Smart Financial Data Ingestion
- **Multi-format Support**: Upload bank statements, credit card statements in CSV, Excel, or PDF format
- **Advanced OCR**: Uses docTR for high-accuracy text extraction from PDFs and images
- **Intelligent Parsing**: Automatically identifies and categorizes transactions
- **Pattern Recognition**: Detects recurring payments (EMIs, SIPs, rent, insurance)

### 🧠 AI-Powered Tax Optimization Engine
- **Automated Categorization**: AI categorizes income and expenses intelligently
- **Tax Computation**: Calculates taxable income and applies relevant deductions
- **Regime Comparison**: Simulates Old vs New tax regime side-by-side
- **Section Analysis**: Automatically applies deductions under sections 80C, 80D, 80G, 24(b), etc.
- **Personalized Recommendations**: Suggests legal tax-saving opportunities

### 📈 CIBIL Score Advisor
- **Credit Report Analysis**: Parses and analyzes credit reports using advanced OCR
- **Score Factor Analysis**: Identifies factors impacting your CIBIL score
- **Improvement Recommendations**: Provides actionable steps to improve creditworthiness
- **What-if Simulations**: Shows potential score improvements based on different actions

### 🤖 AI Assistant with RAG
- **Conversational AI**: Chat with an intelligent assistant about tax and finance queries
- **Contextual Responses**: Uses your personal financial data for personalized advice
- **Knowledge Base**: Continuously updated database of Indian tax laws and regulations
- **Real-time Scraping**: Automatically scrapes latest tax information using Crawl4AI

## 🏗️ Architecture

```
TaxWise/
├── main.py                 # FastAPI application entry point
├── database/
│   ├── models.py          # SQLAlchemy database models
│   └── __init__.py
├── services/
│   ├── file_processor.py    # File upload and parsing
│   ├── transaction_categorizer.py  # AI transaction categorization
│   ├── tax_calculator.py    # Tax computation engine
│   ├── cibil_analyzer.py    # CIBIL score analysis
│   ├── rag_service.py       # RAG system with ChromaDB
│   ├── knowledge_scraper.py # Web scraping with Crawl4AI
│   └── __init__.py
├── utils/
│   ├── pdf_extractor.py     # docTR-based PDF processing
│   └── __init__.py
├── uploads/                 # User uploaded files
├── reports/                 # Generated tax reports
├── chroma_db/              # ChromaDB vector storage
├── logs/                   # Application logs
└── requirements.txt        # Python dependencies
```

## 🛠️ Installation

### Prerequisites
- Python 3.8 or higher
- pip package manager
- 4GB+ RAM (recommended for docTR)
- Internet connection (for web scraping and AI services)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/your-repo/taxwise.git
cd taxwise
```

2. **Run the setup script**
```bash
python setup.py
```

3. **Configure environment variables**
```bash
# Edit .env file with your credentials
GROQ_API_KEY=your_groq_api_key_here
```

4. **Start the application**
```bash
python main.py
```

5. **Access the application**
- API Documentation: http://localhost:8000/docs
- Interactive API: http://localhost:8000/redoc

## 📝 API Endpoints

### User Management
- `POST /users/create` - Create a new user
- `GET /users/{user_id}` - Get user details

### File Management
- `POST /files/upload` - Upload financial documents
- `GET /files/{file_id}` - Get file metadata

### Transaction Processing
- `POST /transactions/parse` - Parse uploaded files for transactions
- `GET /transactions/{user_id}` - Get user's transactions
- `POST /transactions/categorize` - Categorize transactions using AI
- `GET /transactions/recurring/{user_id}` - Get recurring transactions

### Tax Computation
- `POST /tax/compute` - Compute tax liability and compare regimes
- `GET /tax/recommendations/{user_id}` - Get tax-saving recommendations
- `GET /tax/report/{user_id}` - Generate comprehensive tax report (PDF)

### CIBIL Analysis
- `POST /cibil/upload` - Upload CIBIL/credit report
- `POST /cibil/analyze` - Analyze CIBIL score and provide insights
- `GET /cibil/recommendations/{user_id}` - Get CIBIL improvement recommendations

### AI Assistant
- `POST /assistant/query` - Chat with AI assistant using RAG

### Knowledge Management
- `POST /knowledge/update` - Manually trigger knowledge base update

## 🔧 Configuration

### Environment Variables
```bash
# Required
GROQ_API_KEY=your_groq_api_key_here

# Optional
DATABASE_URL=sqlite:///./taxwise.db
DEBUG=True
MAX_FILE_SIZE_MB=50
CHROMA_DB_PATH=./chroma_db
```

### Supported File Formats
- **Bank Statements**: CSV, Excel (.xlsx, .xls), PDF
- **Credit Reports**: PDF
- **Receipt Images**: JPG, PNG (via docTR OCR)

## 🎯 User Workflow

### 1. Document Upload & Processing
```python
# Upload bank statement
POST /files/upload
{
  "file": "bank_statement.pdf",
  "user_id": "user123",
  "file_type": "bank_statement"
}

# Parse transactions
POST /transactions/parse
{
  "file_id": "file456"
}
```

### 2. AI Categorization
```python
# Categorize transactions
POST /transactions/categorize
{
  "user_id": "user123"
}
```

### 3. Tax Computation
```python
# Compute tax
POST /tax/compute
{
  "user_id": "user123"
}

# Response:
{
  "taxable_income": 800000,
  "old_regime_tax": 112500,
  "new_regime_tax": 135000,
  "recommended_regime": "Old Regime",
  "recommendations": [
    "Invest ₹30,000 more in ELSS to maximize 80C benefits",
    "Consider health insurance for additional 80D deduction"
  ]
}
```

### 4. CIBIL Analysis
```python
# Analyze credit score
POST /cibil/analyze
{
  "user_id": "user123"
}

# Response:
{
  "current_score": 720,
  "credit_utilization": 45,
  "recommendations": [
    "Reduce credit utilization to below 30% to improve score by 50+ points",
    "Pay ₹25,000 from credit card balance for faster improvement"
  ]
}
```

### 5. AI Assistant
```python
# Chat with assistant
POST /assistant/query
{
  "user_id": "user123",
  "query": "What's the best way to save tax with my current income?"
}
```

## 🧪 Testing

### Sample API Calls
```bash
# Upload a test file
curl -X POST "http://localhost:8000/files/upload" \
  -F "file=@test_statement.csv" \
  -F "user_id=test_user" \
  -F "file_type=bank_statement"

# Get health status
curl -X GET "http://localhost:8000/health"
```

### Test Data
The system works with standard Indian bank statement formats from major banks:
- State Bank of India (SBI)
- HDFC Bank
- ICICI Bank
- Axis Bank
- Kotak Mahindra Bank

## 🔍 Features in Detail

### Document Processing with docTR
- **High Accuracy OCR**: Extracts text from PDFs and images with 95%+ accuracy
- **Multi-language Support**: Handles English and Hindi text
- **Table Recognition**: Identifies and processes tabular data from statements
- **Preprocessing**: Automatic image enhancement for better OCR results

### AI Transaction Categorization
- **Pattern Recognition**: Identifies transaction types based on description patterns
- **Recurring Detection**: Automatically flags recurring transactions (EMIs, SIPs)
- **Confidence Scoring**: Provides confidence levels for categorizations
- **Custom Categories**: Supports Indian-specific categories (insurance, SIP, etc.)

### Tax Computation Engine
- **Current Tax Slabs**: Updated for FY 2024-25
- **Deduction Calculation**: Automatically applies all eligible deductions
- **Regime Comparison**: Detailed comparison of old vs new tax regimes
- **Report Generation**: Professional PDF reports with calculations

### CIBIL Score Analysis
- **Factor Analysis**: Breaks down score factors with weightings
- **Improvement Simulations**: Shows potential score improvements
- **Personalized Advice**: Tailored recommendations based on user's credit profile
- **Timeline Predictions**: Estimates timeframes for score improvements

### RAG System with Knowledge Base
- **Vector Search**: Fast semantic search across tax knowledge
- **Continuous Updates**: Automatically scrapes latest tax information
- **Contextual Responses**: Uses personal financial data for personalized advice
- **Multi-source Knowledge**: Aggregates information from official and trusted sources

## 🚨 Security & Privacy

- **Data Encryption**: All sensitive data is encrypted at rest
- **Secure File Handling**: Uploaded files are processed securely and can be auto-deleted
- **API Security**: Rate limiting and input validation on all endpoints
- **Privacy First**: No data is shared with third parties

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` endpoint for detailed API documentation
- **Issues**: Report bugs and feature requests on GitHub Issues
- **Community**: Join our Discord server for discussions

## 🎯 Roadmap

- [ ] Mobile app support
- [ ] Integration with bank APIs
- [ ] Advanced investment recommendations
- [ ] Multi-year tax planning
- [ ] Export to popular accounting software
- [ ] Real-time tax calculation widget

## 🏆 Acknowledgments

- **docTR**: For excellent OCR capabilities
- **ChromaDB**: For vector database functionality
- **Groq**: For fast LLM inference
- **Crawl4AI**: For intelligent web scraping
- **FastAPI**: For the robust web framework

---

**Made with ❤️ for Indian taxpayers and financial planning enthusiasts**
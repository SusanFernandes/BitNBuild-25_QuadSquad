# Financial AI API Documentation

A comprehensive AI-powered financial assistant API for Indian tax optimization, transaction analysis, and personal finance advice with persistent report storage.

## Base URL

http://localhost:8000

## Authentication
Currently, no authentication required. Set GROQ_API_KEY environment variable for AI chat functionality.

---

## API Endpoints

### 1. Health Check
**GET** `/health`

Check if the API is running and view service status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000000",
  "services": {
    "chromadb": true,
    "groq": true,
    "crawl4ai": false,
    "pdf_processing": true,
    "ocr": true,
    "database": true
  }
}
```

---

### 2. Upload Bank/Credit Card Statements
**POST** `/upload/statements`

Upload and analyze bank statements or credit card statements for transaction categorization and insights. Results are automatically saved and cached.

**Request:**
- **Content-Type:** multipart/form-data
- **Parameter:** files (array of files)

**Supported File Types:**
- CSV (.csv)
- Excel (.xlsx, .xls) 
- PDF (.pdf)

**File Format Requirements:**

**CSV/Excel Structure:**
```csv
Date,Description,Amount
2024-01-01,SALARY CREDIT - COMPANY NAME,75000.00
2024-01-02,HDFC HOME LOAN EMI,-28000.00
2024-01-03,SIP MUTUAL FUND AXIS,-5000.00
```

**Required Columns (flexible naming):**
- **Date:** Date, Transaction Date, Posting Date
- **Description:** Description, Narration, Particulars, Details  
- **Amount:** Amount, Debit, Credit, Withdrawal, Deposit

**Response:**
```json
{
  "transactions": [
    {
      "date": "2024-01-01T00:00:00",
      "description": "SALARY CREDIT - COMPANY NAME",
      "amount": 75000.0,
      "category": "income"
    }
  ],
  "summary": {
    "total_transactions": 100,
    "total_income": 150000.0,
    "total_expenses": 125000.0,
    "categories": {
      "income": 5,
      "emi": 12,
      "food": 25,
      "transport": 18
    },
    "recurring_count": 15,
    "date_range": {
      "start": "2024-01-01T00:00:00",
      "end": "2024-03-31T00:00:00"
    }
  }
}
```

**Features:**
- **Smart Caching:** Duplicate files return cached results instantly
- **Auto-Save:** All analyses automatically saved to database
- **File Hash Detection:** Uses SHA256 to detect identical files

**Error Responses:**
- 422: Invalid file format or empty files
- 400: Processing error

---

### 3. Tax Analysis
**POST** `/analyze/tax`

Analyze tax implications under old vs new regime and get optimization recommendations. Results are automatically saved.

**Request:**
- **Content-Type:** application/x-www-form-urlencoded

**Parameters:**
```
annual_income: 1200000 (required - float)
current_investments: {"80C": 100000, "80D": 18000, "24b": 200000} (optional - JSON string)
```

**Investment Categories:**
- 80C: PPF, ELSS, Life Insurance premiums (limit: ₹1,50,000)
- 80D: Health Insurance premiums (limit: ₹25,000, ₹50,000 for senior citizens)
- 80G: Donations (limit: varies)
- 24b: Home loan interest (limit: ₹2,00,000 for self-occupied)

**Response:**
```json
{
  "old_regime_tax": 187200.0,
  "new_regime_tax": 156000.0,
  "recommendations": [
    "New tax regime is more beneficial for you",
    "Consider health insurance for ₹25,000 deduction"
  ],
  "deductions_available": {
    "80C": 50000.0,
    "80D": 25000.0,
    "80G": 100000.0,
    "24b": 200000.0
  }
}
```

**Error Responses:**
- 422: Invalid annual income (must be positive)
- 400: Processing error

---

### 4. CIBIL Report Analysis
**POST** `/analyze/cibil`

Upload and analyze CIBIL credit report for score improvement recommendations. Results are automatically saved and cached.

**Request:**
- **Content-Type:** multipart/form-data
- **Parameter:** file (single PDF file)

**Response:**
```json
{
  "current_score": 742,
  "factors": {
    "credit_utilization": 36,
    "payment_history": "Has missed payments",
    "credit_age": 5,
    "credit_mix": "Good mix of credit types",
    "recent_inquiries": 2
  },
  "recommendations": [
    "Reduce credit utilization below 30% to improve score",
    "Ensure all EMIs and credit card payments are on time"
  ],
  "improvement_potential": 80
}
```

**Features:**
- **Smart Caching:** Same file returns cached analysis
- **Auto-Save:** Results stored for future reference

**Error Responses:**
- 422: Invalid file format or text extraction failed
- 400: Processing error

---

### 5. Update Knowledge Base
**POST** `/search/update-knowledge`

Search for latest financial information and update the AI knowledge base.

**Request:**
- **Content-Type:** application/x-www-form-urlencoded

**Parameters:**
```
query: "latest income tax rates India 2024" (required - string)
```

**Response:**
```json
{
  "message": "Added 12 new documents to knowledge base"
}
```

**Error Responses:**
- 400: Search or update error

---

### 6. AI Chat Query
**POST** `/chat/query`

Ask financial questions and get AI-powered personalized advice. All queries and responses are automatically saved.

**Request:**
- **Content-Type:** application/json

**Body:**
```json
{
  "question": "I earn ₹15 lakhs per year and invest ₹1 lakh in PPF. How much tax can I save with ₹50,000 ELSS investment?",
  "user_context": {
    "annual_income": 1500000,
    "current_investments": {"80C": 100000},
    "age": 32,
    "city": "Bangalore"
  }
}
```

**User Context Fields (all optional):**
```json
{
  "annual_income": 1200000,
  "age": 30,
  "city": "Mumbai",
  "current_investments": {"80C": 50000, "80D": 18000},
  "cibil_score": 750,
  "credit_utilization": 25,
  "home_loan_emi": 35000,
  "outstanding_loan": 2500000,
  "risk_profile": "moderate",
  "dependents": 2,
  "nri_status": false
}
```

**Response:**
```json
{
  "answer": "Based on your income of ₹15 lakhs, investing an additional ₹50,000 in ELSS under Section 80C can save you approximately ₹15,000 in taxes (30% tax bracket). This would bring your total 80C investment to ₹1.5 lakhs, maximizing your deduction limit...",
  "sources_used": 3,
  "confidence": "high"
}
```

**Features:**
- **Auto-Save:** All queries and responses stored for history

**Error Responses:**
- 422: Empty question
- 400: Processing error or AI service unavailable

---

## Report Management Endpoints

### 7. List All Reports
**GET** `/reports/list`

Get a paginated list of all saved reports with filtering options.

**Query Parameters:**
- `report_type` (optional): Filter by type (`transaction`, `tax`, `cibil`, `chat`)
- `limit` (optional, default: 10): Number of reports per page
- `offset` (optional, default: 0): Pagination offset

**Example:**
```
GET /reports/list?report_type=transaction&limit=5&offset=0
```

**Response:**
```json
{
  "reports": [
    {
      "id": "uuid-string",
      "type": "transaction",
      "filename": "bank_statement.csv",
      "created_date": "2024-01-01T12:00:00",
      "summary": {
        "total_transactions": 150,
        "total_income": 200000.0,
        "total_expenses": 125000.0
      }
    },
    {
      "id": "uuid-string",
      "type": "tax",
      "filename": null,
      "created_date": "2024-01-01T11:30:00",
      "summary": {
        "annual_income": 1200000.0,
        "old_regime_tax": 187200.0,
        "new_regime_tax": 156000.0
      }
    }
  ],
  "total_count": 25,
  "has_more": true
}
```

---

### 8. Get Transaction Report
**GET** `/reports/transaction/{report_id}`

Retrieve detailed transaction analysis report by ID.

**Path Parameters:**
- `report_id` (required): UUID of the transaction report

**Response:**
```json
{
  "id": "uuid-string",
  "transactions": [
    {
      "date": "2024-01-01T00:00:00",
      "description": "SALARY CREDIT",
      "amount": 75000.0,
      "category": "income"
    }
  ],
  "summary": {
    "total_transactions": 100,
    "total_income": 150000.0,
    "total_expenses": 125000.0,
    "categories": {"income": 5, "emi": 12}
  },
  "filename": "bank_statement.csv",
  "created_date": "2024-01-01T12:00:00"
}
```

**Error Responses:**
- 404: Report not found

---

### 9. Get Tax Report
**GET** `/reports/tax/{report_id}`

Retrieve detailed tax analysis report by ID.

**Path Parameters:**
- `report_id` (required): UUID of the tax report

**Response:**
```json
{
  "id": "uuid-string",
  "annual_income": 1200000.0,
  "current_investments": {"80C": 100000, "80D": 18000},
  "old_regime_tax": 187200.0,
  "new_regime_tax": 156000.0,
  "recommendations": ["New tax regime is more beneficial"],
  "deductions_available": {"80C": 50000.0, "80D": 7000.0},
  "created_date": "2024-01-01T12:00:00"
}
```

**Error Responses:**
- 404: Report not found

---

### 10. Get CIBIL Report
**GET** `/reports/cibil/{report_id}`

Retrieve detailed CIBIL analysis report by ID.

**Path Parameters:**
- `report_id` (required): UUID of the CIBIL report

**Response:**
```json
{
  "id": "uuid-string",
  "current_score": 742,
  "factors": {
    "credit_utilization": 36,
    "payment_history": "Has missed payments",
    "credit_age": 5,
    "recent_inquiries": 2
  },
  "recommendations": ["Reduce credit utilization below 30%"],
  "improvement_potential": 80,
  "filename": "cibil_report.pdf",
  "created_date": "2024-01-01T12:00:00"
}
```

**Error Responses:**
- 404: Report not found

---

### 11. Get Chat Query
**GET** `/reports/chat/{query_id}`

Retrieve chat query and response by ID.

**Path Parameters:**
- `query_id` (required): UUID of the chat query

**Response:**
```json
{
  "id": "uuid-string",
  "question": "How much tax can I save with ELSS?",
  "answer": "Based on your income bracket, investing in ELSS...",
  "user_context": {
    "annual_income": 1200000,
    "age": 30
  },
  "sources_used": 3,
  "confidence": "high",
  "created_date": "2024-01-01T12:00:00"
}
```

**Error Responses:**
- 404: Query not found

---

### 12. Delete Report
**DELETE** `/reports/{report_type}/{report_id}`

Delete a specific report from the database.

**Path Parameters:**
- `report_type` (required): Type of report (`transaction`, `tax`, `cibil`, `chat`)
- `report_id` (required): UUID of the report

**Example:**
```
DELETE /reports/transaction/uuid-string
```

**Response:**
```json
{
  "message": "Report uuid-string deleted successfully"
}
```

**Error Responses:**
- 400: Invalid report type
- 404: Report not found

---

## Transaction Categories

The system automatically categorizes transactions into:

| Category | Keywords |
|----------|----------|
| income | salary, freelance, dividend, interest, bonus, refund |
| emi | emi, loan, mortgage, car loan, home loan, personal loan |
| sip | sip, mutual fund, systematic, investment, elss |
| rent | rent, house rent, apartment, accommodation |
| insurance | insurance, premium, life insurance, health insurance |
| utilities | electricity, gas, water, internet, mobile, phone |
| food | restaurant, food, grocery, supermarket, dining |
| transport | fuel, petrol, taxi, uber, ola, metro, bus |
| entertainment | movie, entertainment, netflix, spotify, game |
| shopping | shopping, amazon, flipkart, clothing, electronics |
| medical | hospital, doctor, medical, pharmacy, medicine |
| education | school, college, course, book, education, tuition |

---

## Database Features

### Smart Caching System
- **File Hash Detection**: Uses SHA256 hashing to detect duplicate uploads
- **Automatic Retrieval**: Returns cached analysis for previously processed files
- **Performance Optimization**: Avoids re-processing identical files

### Persistent Storage
- **SQLite Database**: All analyses stored in `financial_reports.db`
- **Report History**: Complete audit trail of all analyses
- **Data Persistence**: Reports survive server restarts

### Report Management
- **Unique IDs**: Every report gets a UUID for tracking
- **Metadata Storage**: Filenames, dates, and summary data
- **Flexible Retrieval**: List, filter, and retrieve individual reports

---

## Error Handling

All endpoints return structured error responses:

```json
{
  "detail": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- 200: Success
- 400: Bad Request (processing error)
- 404: Not Found (report/resource not found)
- 422: Unprocessable Entity (validation error)
- 500: Internal Server Error

---

## Frontend Integration Examples

### JavaScript/React File Upload
```javascript
const uploadStatements = async (files) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  
  try {
    const response = await fetch('/upload/statements', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Tax Analysis Form
```javascript
const analyzeTax = async (income, investments = {}) => {
  const formData = new URLSearchParams();
  formData.append('annual_income', income);
  formData.append('current_investments', JSON.stringify(investments));
  
  try {
    const response = await fetch('/analyze/tax', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });
    return await response.json();
  } catch (error) {
    console.error('Tax analysis failed:', error);
  }
};
```

### Report Management
```javascript
// List all reports
const getReports = async (type = null, limit = 10, offset = 0) => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString()
  });
  if (type) params.append('report_type', type);
  
  const response = await fetch(`/reports/list?${params}`);
  return response.json();
};

// Get specific report
const getTransactionReport = async (reportId) => {
  const response = await fetch(`/reports/transaction/${reportId}`);
  return response.json();
};

// Delete report
const deleteReport = async (type, reportId) => {
  const response = await fetch(`/reports/${type}/${reportId}`, {
    method: 'DELETE'
  });
  return response.json();
};
```

### Chat Query
```javascript
const askQuestion = async (question, userContext = {}) => {
  try {
    const response = await fetch('/chat/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question,
        user_context: userContext
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Chat query failed:', error);
  }
};
```

---

## Sample Data for Testing

### Sample Bank Statement CSV:
```csv
Date,Description,Amount
2024-01-01,SALARY CREDIT - INFOSYS LTD,75000.00
2024-01-02,HDFC HOME LOAN EMI,-28000.00
2024-01-03,SIP MUTUAL FUND AXIS,-5000.00
2024-01-04,HOUSE RENT,-20000.00
2024-01-05,ELECTRICITY BILL,-2800.00
```

### Sample Tax Analysis Request:
```
annual_income=1200000
current_investments={"80C": 50000, "80D": 18000}
```

### Sample Chat Questions:
- "How much can I save by switching tax regimes?"
- "What's the best investment strategy for ₹12 LPA salary?"
- "How to improve CIBIL score from 650 to 750?"
- "Should I prepay home loan or invest in mutual funds?"

---

## Environment Setup

### Required Environment Variables:
```bash
GROQ_API_KEY=your_groq_api_key_here
```

### Docker Setup:
```dockerfile
FROM python:3.9
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Development Server:
```bash
pip install -r requirements.txt
python app.py
# or
uvicorn app:app --reload --port 8000
```

---

## Rate Limits & Constraints

- **File Upload Size:** Max 10MB per file
- **Concurrent Requests:** No explicit limit (depends on server capacity)
- **AI Chat:** Dependent on GROQ_API_KEY quota
- **Database:** SQLite - suitable for moderate usage, consider PostgreSQL for production
- **Response Time:** 
  - File upload: 2-10 seconds (cached: <1 second)
  - Tax analysis: <1 second
  - Chat queries: 2-5 seconds
  - Report retrieval: <1 second

---

## Support & Troubleshooting

### Common Issues:

1. **422 Error on file upload**: Check file format and ensure proper column headers
2. **400 Error on chat**: Verify GROQ_API_KEY is set correctly
3. **Tax analysis fails**: Ensure annual_income is a positive number
4. **Empty responses**: Check if files contain valid transaction data
5. **404 on report retrieval**: Verify report ID exists using `/reports/list`

### Debug Endpoints:
- `GET /health` - Check API status and service availability
- `GET /reports/list` - Verify reports are being saved
- Check server logs for detailed error messages

### Database Location:
- Reports stored in `./financial_reports.db`
- Vector database in `./chroma_db/`
- Uploaded files temporarily processed (not permanently stored)

### Contact:
For API issues, check server logs and ensure all dependencies are installed correctly. The database will be created automatically on first startup.
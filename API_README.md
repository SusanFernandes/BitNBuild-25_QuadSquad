# TaxWise API Documentation

## Overview

TaxWise is an AI-powered tax assistant API for Indian users. This API provides comprehensive financial management features including transaction processing, tax computation, credit score analysis, and AI-powered assistance.

**Base URL:** `http://localhost:8000` (when running locally)

## Authentication

Currently, the API uses user IDs passed as query parameters or in request bodies. No authentication tokens are required.

## Data Models

### UserCreate
```json
{
  "name": "string",
  "email": "string",
  "phone": "string (optional)"
}
```

### TransactionResponse
```json
{
  "id": "string",
  "amount": "number",
  "description": "string",
  "date": "datetime",
  "category": "string",
  "subcategory": "string (optional)"
}
```

### TaxComputationResponse
```json
{
  "taxable_income": "number",
  "old_regime_tax": "number",
  "new_regime_tax": "number",
  "recommended_regime": "string",
  "deductions": {
    "section_80c": "number",
    "section_80d": "number",
    "hra": "number"
  },
  "recommendations": ["string"]
}
```

### CIBILAnalysisResponse
```json
{
  "current_score": "number (optional)",
  "credit_utilization": "number (optional)",
  "payment_history_score": "number (optional)",
  "recommendations": ["string"],
  "score_factors": {
    "payment_history": "object",
    "credit_utilization": "object",
    "credit_age": "object"
  }
}
```

### ChatQuery
```json
{
  "user_id": "string",
  "query": "string"
}
```

## API Endpoints

### User Management

#### POST /users/create
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91-9876543210"
}
```

**Response:**
```json
{
  "user_id": "uuid-string",
  "message": "User created successfully"
}
```

**Status Codes:**
- `200` - Success
- `422` - Validation error

### File Upload

#### POST /files/upload
Upload financial documents (CSV, Excel, PDF bank statements, credit reports).

**Parameters:**
- `file` (form-data): The file to upload
- `user_id` (query): User ID (optional)
- `file_type` (query): Type of file ("bank_statement", "credit_report", etc.)

**Supported File Types:**
- CSV (.csv)
- Excel (.xlsx, .xls)
- PDF (.pdf)

**Response:**
```json
{
  "file_id": "uuid-string",
  "filename": "statement.csv",
  "message": "File uploaded successfully"
}
```

#### GET /files/{file_id}
Get metadata for an uploaded file.

**Parameters:**
- `file_id` (path): File ID

**Response:**
```json
{
  "file_id": "uuid-string",
  "filename": "statement.csv",
  "file_type": "bank_statement",
  "file_size": 12345,
  "created_at": "2024-01-01T00:00:00"
}
```

### Transaction Management

#### POST /transactions/parse
Parse an uploaded file and extract transactions.

**Parameters:**
- `file_id` (form-data): File ID to parse

**Response:**
```json
{
  "message": "Successfully parsed 150 transactions",
  "transaction_count": 150
}
```

#### GET /transactions/{user_id}
Get all transactions for a user.

**Parameters:**
- `user_id` (path): User ID

**Response:**
```json
[
  {
    "id": "uuid-string",
    "amount": 5000.00,
    "description": "Salary Credit",
    "date": "2024-01-15T00:00:00",
    "category": "income",
    "subcategory": "salary"
  }
]
```

#### POST /transactions/categorize
Automatically categorize transactions using AI.

**Parameters:**
- `user_id` (form-data): User ID

**Response:**
```json
{
  "message": "Successfully categorized 150 transactions"
}
```

#### GET /transactions/recurring/{user_id}
Get recurring transactions for a user.

**Parameters:**
- `user_id` (path): User ID

**Response:**
```json
[
  {
    "id": "uuid-string",
    "amount": -999.00,
    "description": "Netflix Subscription",
    "date": "2024-01-15T00:00:00",
    "category": "entertainment",
    "subcategory": "subscription"
  }
]
```

### Tax Computation

#### POST /tax/compute
Compute tax liability and compare old vs new tax regimes.

**Parameters:**
- `user_id` (form-data): User ID

**Response:**
```json
{
  "taxable_income": 850000.00,
  "old_regime_tax": 85000.00,
  "new_regime_tax": 75000.00,
  "recommended_regime": "new_regime",
  "deductions": {
    "section_80c": 150000.00,
    "section_80d": 25000.00,
    "hra": 100000.00
  },
  "recommendations": [
    "Consider investing more in Section 80C to reduce taxable income",
    "Switch to new tax regime for potential savings of ₹10,000"
  ]
}
```

#### GET /tax/recommendations/{user_id}
Get personalized tax-saving recommendations.

**Parameters:**
- `user_id` (path): User ID

**Response:**
```json
{
  "recommendations": [
    "Invest ₹50,000 more in ELSS for Section 80C benefits",
    "Consider NPS contribution for additional deductions",
    "Review HRA exemption eligibility"
  ]
}
```

#### GET /tax/report/{user_id}
Generate and download a comprehensive tax report PDF.

**Parameters:**
- `user_id` (path): User ID

**Response:**
- PDF file download

### Credit Score Analysis

#### POST /cibil/upload
Upload and parse CIBIL/credit reports.

**Parameters:**
- `file` (form-data): Credit report PDF
- `user_id` (query): User ID (optional)

**Response:**
```json
{
  "file_id": "uuid-string",
  "message": "Credit report uploaded and parsed successfully",
  "credit_data": {
    "current_score": 750,
    "accounts": [...],
    "payment_history": [...]
  }
}
```

#### POST /cibil/analyze
Analyze credit score and provide improvement recommendations.

**Parameters:**
- `user_id` (form-data): User ID

**Response:**
```json
{
  "current_score": 750,
  "credit_utilization": 35.5,
  "payment_history_score": 85,
  "recommendations": [
    "Reduce credit utilization below 30%",
    "Pay credit card bills before due date",
    "Avoid opening new credit cards"
  ],
  "score_factors": {
    "payment_history": {
      "score": 85,
      "impact": "high"
    },
    "credit_utilization": {
      "score": 65,
      "impact": "medium"
    }
  }
}
```

#### GET /cibil/recommendations/{user_id}
Get credit score improvement recommendations.

**Parameters:**
- `user_id` (path): User ID

**Response:**
```json
{
  "recommendations": [
    "Pay credit card bills 10 days before due date",
    "Keep credit utilization below 30%",
    "Avoid maxing out credit limits"
  ]
}
```

### AI Assistant

#### POST /assistant/query
Chat with the AI assistant using RAG (Retrieval Augmented Generation).

**Request Body:**
```json
{
  "user_id": "user-uuid",
  "query": "What are the tax benefits of investing in ELSS?"
}
```

**Response:**
```json
{
  "response": "ELSS (Equity Linked Savings Scheme) funds offer tax benefits under Section 80C of the Income Tax Act. You can claim a deduction of up to ₹1.5 lakh on investments in ELSS funds. Additionally, the returns from ELSS are tax-free under Section 10(10D) if held for more than 3 years..."
}
```

### Knowledge Base Management

#### POST /knowledge/update
Manually trigger knowledge base update (scrapes latest tax information).

**Response:**
```json
{
  "message": "Knowledge base updated successfully"
}
```

### Health Check

#### GET /health
Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00"
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `404` - Resource not found
- `422` - Validation error
- `500` - Internal server error

Error responses include a `detail` field with error description:

```json
{
  "detail": "User not found"
}
```

## File Upload Guidelines

### Supported Formats
- **Bank Statements:** CSV, Excel (.xlsx/.xls), PDF
- **Credit Reports:** PDF format

### File Size Limits
- Maximum file size: 50MB
- Recommended: Keep files under 10MB for better performance

### CSV Format Requirements
```csv
Date,Description,Amount,Type
2024-01-15,Salary Credit,50000.00,credit
2024-01-16,Grocery Shopping,-2500.00,debit
```

### Excel Format Requirements
- First row should contain headers
- Required columns: Date, Description, Amount
- Optional columns: Type, Balance

## Transaction Categories

The system automatically categorizes transactions into:

- **Income:** salary, freelance, business, interest, dividends
- **Housing:** rent, mortgage, property tax, maintenance
- **Transportation:** fuel, vehicle maintenance, public transport
- **Food:** groceries, dining out, food delivery
- **Entertainment:** movies, subscriptions, hobbies
- **Healthcare:** medical bills, insurance, pharmacy
- **Education:** tuition fees, books, courses
- **Shopping:** clothing, electronics, household items
- **Utilities:** electricity, water, gas, internet
- **Insurance:** life insurance, health insurance, vehicle insurance
- **Investments:** mutual funds, stocks, fixed deposits
- **Loans:** EMI payments, loan repayments
- **Miscellaneous:** other expenses

## Tax Regimes

The API compares two tax regimes:

### Old Tax Regime
- Up to ₹2.5L: Nil
- ₹2.5L - ₹5L: 5%
- ₹5L - ₹10L: 20%
- Above ₹10L: 30%

### New Tax Regime (FY 2024-25)
- Up to ₹3L: Nil
- ₹3L - ₹7L: 5%
- ₹7L - ₹10L: 10%
- ₹10L - ₹12L: 15%
- ₹12L - ₹15L: 20%
- Above ₹15L: 30%

## Development Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
cp .env.example .env
# Edit .env with your GROQ_API_KEY
```

3. Run the server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

## Frontend Integration Notes

1. **CORS:** The API includes CORS middleware allowing all origins
2. **File Uploads:** Use `multipart/form-data` for file uploads
3. **Async Operations:** Some endpoints may take time (PDF processing, AI categorization)
4. **Error Handling:** Always check response status and handle errors gracefully
5. **Data Validation:** Validate user inputs before sending to API

## Rate Limiting

Currently no rate limiting is implemented. Consider implementing client-side throttling for production use.
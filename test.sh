#!/bin/bash

# TaxWise API - cURL Test Requests
# Make sure the FastAPI server is running on http://localhost:8000

echo "=== TaxWise API Testing ==="
echo ""

# 1. Health Check
echo "1. Health Check"
curl -X GET "http://localhost:8000/health" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# 2. Create a new user
echo "2. Create a new user"
USER_RESPONSE=$(curl -s -X POST "http://localhost:8000/users/create" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@3example.com",
    "password": "testpass123",
    "phone": "+91 9676543210"
  }')

echo $USER_RESPONSE | jq '.'
USER_ID=$(echo $USER_RESPONSE | jq -r '.user_id')
echo "Created User ID: $USER_ID"
echo -e "\n"

# 3. Test user login - Success case
echo "3. User Login - Success"
curl -X POST "http://localhost:8000/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }' | jq '.'
echo -e "\n"

# 4. Test user login - Failure case
echo "4. User Login - Failure"
curl -X POST "http://localhost:8000/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrongpassword"
  }' | jq '.'
echo -e "\n"

# 5. Login with sample user from seeder
echo "5. Login with sample user (from seeder)"
curl -X POST "http://localhost:8000/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "password123"
  }' | jq '.'
echo -e "\n"

# 6. Get user profile
echo "6. Get user profile"
curl -X GET "http://localhost:8000/users/$USER_ID/profile" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# 7. Update user profile
echo "7. Update user profile"
curl -X PUT "http://localhost:8000/users/$USER_ID/profile?name=Updated%20Test%20User&phone=%2B91%209999999999" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# 8. Upload a file (create a sample CSV first)
echo "8. Upload a file"
cat > sample_transactions.csv << EOF
Date,Description,Amount,Type
2024-01-15,Salary Credit,-50000,credit
2024-01-16,EMI Payment,15000,debit
2024-01-17,Grocery Shopping,2500,debit
2024-01-18,SIP Investment,5000,debit
2024-01-19,Insurance Premium,3000,debit
EOF

FILE_RESPONSE=$(curl -s -X POST "http://localhost:8000/files/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sample_transactions.csv" \
  -F "user_id=$USER_ID" \
  -F "file_type=bank_statement")

echo $FILE_RESPONSE | jq '.'
FILE_ID=$(echo $FILE_RESPONSE | jq -r '.file_id')
echo "Uploaded File ID: $FILE_ID"
echo -e "\n"

# 9. Get file metadata
echo "9. Get file metadata"
curl -X GET "http://localhost:8000/files/$FILE_ID" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# 10. Parse transactions from uploaded file
echo "10. Parse transactions from uploaded file"
curl -X POST "http://localhost:8000/transactions/parse?file_id=$FILE_ID" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# 11. Get user transactions
echo "11. Get user transactions"
curl -X GET "http://localhost:8000/transactions/$USER_ID" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# 12. Categorize transactions
echo "12. Categorize transactions"
curl -X POST "http://localhost:8000/transactions/categorize?user_id=$USER_ID" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# 13. Get recurring transactions
echo "13. Get recurring transactions"
curl -X GET "http://localhost:8000/transactions/recurring/$USER_ID" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# 14. Compute tax
echo "14. Compute tax"
curl -X POST "http://localhost:8000/tax/compute?user_id=$USER_ID" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# 15. Get tax recommendations
echo "15. Get tax recommendations"
curl -X GET "http://localhost:8000/tax/recommendations/$USER_ID" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# 16. Upload CIBIL report (create a dummy PDF-like file)
echo "16. Upload CIBIL report"
echo "Dummy CIBIL Report Content" > dummy_cibil.pdf

CIBIL_FILE_RESPONSE=$(curl -s -X POST "http://localhost:8000/cibil/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@dummy_cibil.pdf" \
  -F "user_id=$USER_ID")

echo $CIBIL_FILE_RESPONSE | jq '.'
echo -e "\n"

# 17. Analyze CIBIL score
echo "17. Analyze CIBIL score"
curl -X POST "http://localhost:8000/cibil/analyze?user_id=$USER_ID" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# 18. Get CIBIL recommendations
echo "18. Get CIBIL recommendations"
curl -X GET "http://localhost:8000/cibil/recommendations/$USER_ID" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# 19. Chat with assistant
echo "19. Chat with assistant"
curl -X POST "http://localhost:8000/assistant/query" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"query\": \"What are the best tax-saving options for me?\"
  }" | jq '.'
echo -e "\n"

# 20. Get chat history
echo "20. Get chat history"
curl -X GET "http://localhost:8000/assistant/history/$USER_ID?limit=5" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# 21. Search knowledge base
echo "21. Search knowledge base"
curl -X GET "http://localhost:8000/knowledge/search?query=tax%20deduction&category=tax_laws&limit=3" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# 22. Add knowledge entry
echo "22. Add knowledge entry"
curl -X POST "http://localhost:8000/knowledge/add" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Section 80D Health Insurance",
    "content": "Section 80D allows deduction for health insurance premiums up to Rs. 25,000 for self and family, and additional Rs. 25,000 for parents.",
    "source_url": "https://incometaxindia.gov.in/section80d",
    "category": "tax_laws"
  }' | jq '.'
echo -e "\n"

# 23. Get user dashboard
echo "23. Get user dashboard"
curl -X GET "http://localhost:8000/dashboard/$USER_ID" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# 24. Generate tax report (this will likely return an error since it's a mock file)
echo "24. Generate tax report"
curl -X GET "http://localhost:8000/tax/report/$USER_ID" \
  -H "Content-Type: application/json"
echo -e "\n"

# 25. Test with existing sample user
echo "25. Test operations with sample user from seeder"
SAMPLE_USER_ID="john-doe-sample-id" # This would be the actual UUID from seeder

# Get sample user transactions
curl -X GET "http://localhost:8000/transactions/sample-user-id" \
  -H "Content-Type: application/json" | jq '.'
echo -e "\n"

# Clean up test files
echo "Cleaning up test files..."
rm -f sample_transactions.csv dummy_cibil.pdf

echo "=== Testing Complete ==="
echo ""
echo "Note: Some endpoints might return errors if the mock services don't have actual implementations."
echo "The database operations should work correctly with PostgreSQL."

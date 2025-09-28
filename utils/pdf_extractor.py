# utils/pdf_extractor.py
"""
PDF text extraction using docTR for high-quality OCR
"""

import os
from typing import Dict, Any, List
import asyncio
from pathlib import Path
import json
import re
from datetime import datetime

try:
    from doctr.models import ocr_predictor
    from doctr.io import DocumentFile
    import cv2
    import numpy as np
except ImportError:
    print("docTR not installed. Install with: pip install python-doctr[torch]")

class PDFExtractor:
    def __init__(self):
        self.model = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize docTR OCR model"""
        try:
            # Use pretrained model for better accuracy
            self.model = ocr_predictor(pretrained=True)
            print("docTR model initialized successfully")
        except Exception as e:
            print(f"Error initializing docTR model: {e}")
            self.model = None
    
    async def extract_text(self, file_path: str) -> str:
        """Extract text from PDF using docTR OCR"""
        if not self.model:
            raise ValueError("docTR model not initialized")
        
        try:
            # Load document
            doc = DocumentFile.from_pdf(file_path)
            
            # Perform OCR
            result = self.model(doc)
            
            # Extract text from result
            extracted_text = ""
            for page in result.pages:
                for block in page.blocks:
                    for line in block.lines:
                        for word in line.words:
                            extracted_text += word.value + " "
                        extracted_text += "\n"
                    extracted_text += "\n"
            
            return extracted_text
            
        except Exception as e:
            # Fallback to basic text extraction
            return await self._fallback_text_extraction(file_path)
    
    async def _fallback_text_extraction(self, file_path: str) -> str:
        """Fallback text extraction using PyPDF2"""
        try:
            import PyPDF2
            
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                
                return text
                
        except Exception as e:
            raise ValueError(f"Error extracting text from PDF: {str(e)}")
    
    async def extract_credit_report_data(self, file_path: str) -> Dict[str, Any]:
        """Extract structured data from credit report PDF"""
        text = await self.extract_text(file_path)
        return await self._parse_credit_report_text(text)
    
    async def _parse_credit_report_text(self, text: str) -> Dict[str, Any]:
        """Parse credit report text and extract key information"""
        credit_data = {
            'credit_score': None,
            'credit_utilization': None,
            'payment_history': None,
            'credit_accounts': [],
            'hard_inquiries': [],
            'personal_info': {}
        }
        
        # Extract credit score
        score_patterns = [
            r'(?:CIBIL\s+Score|Credit\s+Score|Score)[\s:]+(\d{3})',
            r'(\d{3})(?:\s*\/\s*900|\s*out\s+of\s+900)',
        ]
        
        for pattern in score_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                credit_data['credit_score'] = int(match.group(1))
                break
        
        # Extract credit utilization
        util_patterns = [
            r'(?:Credit\s+Utilization|Utilization)[\s:]+(\d+(?:\.\d+)?)%',
            r'(\d+(?:\.\d+)?)%\s+(?:Credit\s+Utilization|Utilization)',
        ]
        
        for pattern in util_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                credit_data['credit_utilization'] = float(match.group(1))
                break
        
        # Extract payment history information
        payment_patterns = [
            r'Payment\s+History[\s:]+(\d+)%',
            r'(\d+)%\s+Payment\s+History',
        ]
        
        for pattern in payment_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                credit_data['payment_history'] = int(match.group(1))
                break
        
        # Extract account information
        account_patterns = [
            r'(Credit\s+Card|Loan|EMI)[\s\w]*[\s:]+₹?([\d,]+)',
            r'(\w+\s+Bank)[\s\w]*[\s:]+₹?([\d,]+)',
        ]
        
        for pattern in account_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                account_type, amount_str = match
                try:
                    amount = float(amount_str.replace(',', ''))
                    credit_data['credit_accounts'].append({
                        'type': account_type.strip(),
                        'amount': amount
                    })
                except:
                    continue
        
        # Extract hard inquiries
        inquiry_patterns = [
            r'Hard\s+Inquir(?:y|ies)[\s:]+(\d+)',
            r'(\d+)\s+Hard\s+Inquir(?:y|ies)',
        ]
        
        for pattern in inquiry_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                credit_data['hard_inquiries'] = int(match.group(1))
                break
        
        return credit_data
    
    async def extract_bank_statement_data(self, file_path: str) -> List[Dict[str, Any]]:
        """Extract transaction data from bank statement PDF"""
        text = await self.extract_text(file_path)
        return await self._parse_bank_statement_text(text)
    
    async def _parse_bank_statement_text(self, text: str) -> List[Dict[str, Any]]:
        """Parse bank statement text and extract transactions"""
        transactions = []
        
        # Common transaction patterns
        patterns = [
            # DD/MM/YYYY Description Amount Balance
            r'(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)',
            # DD-MM-YYYY Description Amount
            r'(\d{2}-\d{2}-\d{4})\s+(.+?)\s+([\d,]+\.?\d*)',
            # YYYY-MM-DD Description Amount
            r'(\d{4}-\d{2}-\d{2})\s+(.+?)\s+([\d,]+\.?\d*)',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.MULTILINE | re.DOTALL)
            
            for match in matches:
                try:
                    if len(match) == 4:  # Date, Description, Amount, Balance
                        date_str, description, amount_str, balance_str = match
                    else:  # Date, Description, Amount
                        date_str, description, amount_str = match
                        balance_str = None
                    
                    # Parse date
                    try:
                        if '/' in date_str:
                            date = datetime.strptime(date_str, '%d/%m/%Y')
                        elif '-' in date_str and len(date_str.split('-')[0]) == 2:
                            date = datetime.strptime(date_str, '%d-%m-%Y')
                        else:
                            date = datetime.strptime(date_str, '%Y-%m-%d')
                    except:
                        continue
                    
                    # Clean and parse amount
                    amount_clean = re.sub(r'[,\s]', '', amount_str)
                    try:
                        amount = float(amount_clean)
                    except:
                        continue
                    
                    # Determine transaction type
                    transaction_type = "debit"
                    credit_keywords = ['credit', 'deposit', 'salary', 'interest', 'dividend', 'refund']
                    if any(keyword in description.lower() for keyword in credit_keywords):
                        transaction_type = "credit"
                    
                    transactions.append({
                        'date': date,
                        'amount': amount,
                        'description': description.strip(),
                        'type': transaction_type,
                        'balance': self._parse_amount(balance_str) if balance_str else None
                    })
                    
                except Exception as e:
                    continue
        
        return transactions
    
    def _parse_amount(self, amount_str: str) -> float:
        """Parse amount string to float"""
        if not amount_str:
            return 0.0
        
        try:
            cleaned = re.sub(r'[,\s₹]', '', str(amount_str))
            return float(cleaned)
        except:
            return 0.0
    
    async def preprocess_image(self, image_path: str) -> str:
        """Preprocess image for better OCR results"""
        try:
            import cv2
            
            # Read image
            img = cv2.imread(image_path)
            
            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Apply noise reduction
            denoised = cv2.medianBlur(gray, 5)
            
            # Apply thresholding
            _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Save preprocessed image
            preprocessed_path = image_path.replace('.', '_preprocessed.')
            cv2.imwrite(preprocessed_path, thresh)
            
            return preprocessed_path
            
        except Exception as e:
            print(f"Error preprocessing image: {e}")
            return image_path
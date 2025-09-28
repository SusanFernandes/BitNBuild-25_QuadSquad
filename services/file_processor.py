# services/file_processor.py
"""
File processor service to handle different file formats
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Dict, Any
import re
import json
from pathlib import Path

class FileProcessor:
    def __init__(self):
        self.supported_formats = ['.csv', '.xlsx', '.xls', '.pdf']
        
    async def process_file(self, file_path: str, file_type: str) -> List[Dict[str, Any]]:
        """Process uploaded file and extract transactions"""
        file_ext = Path(file_path).suffix.lower()
        
        if file_ext in ['.csv']:
            return await self._process_csv(file_path, file_type)
        elif file_ext in ['.xlsx', '.xls']:
            return await self._process_excel(file_path, file_type)
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")
    
    async def _process_csv(self, file_path: str, file_type: str) -> List[Dict[str, Any]]:
        """Process CSV files"""
        try:
            # Try different encodings
            encodings = ['utf-8', 'latin1', 'cp1252']
            df = None
            
            for encoding in encodings:
                try:
                    df = pd.read_csv(file_path, encoding=encoding)
                    break
                except UnicodeDecodeError:
                    continue
            
            if df is None:
                raise ValueError("Could not decode CSV file")
            
            return await self._normalize_transactions(df, file_type)
            
        except Exception as e:
            raise ValueError(f"Error processing CSV: {str(e)}")
    
    async def _process_excel(self, file_path: str, file_type: str) -> List[Dict[str, Any]]:
        """Process Excel files"""
        try:
            df = pd.read_excel(file_path)
            return await self._normalize_transactions(df, file_type)
            
        except Exception as e:
            raise ValueError(f"Error processing Excel: {str(e)}")
    
    async def _normalize_transactions(self, df: pd.DataFrame, file_type: str) -> List[Dict[str, Any]]:
        """Normalize transaction data from different bank formats"""
        transactions = []
        
        # Common column mappings for different banks
        column_mappings = {
            'date': ['date', 'transaction_date', 'txn_date', 'value_date', 'posting_date'],
            'description': ['description', 'particulars', 'narration', 'details', 'transaction_details'],
            'amount': ['amount', 'withdrawal_amt', 'deposit_amt', 'debit', 'credit', 'transaction_amount'],
            'balance': ['balance', 'running_balance', 'available_balance']
        }
        
        # Find actual column names
        actual_columns = {}
        for field, possible_names in column_mappings.items():
            for col in df.columns:
                if any(name.lower() in col.lower() for name in possible_names):
                    actual_columns[field] = col
                    break
        
        # Process each row
        for _, row in df.iterrows():
            try:
                transaction = await self._extract_transaction_data(row, actual_columns, file_type)
                if transaction:
                    transactions.append(transaction)
            except Exception as e:
                print(f"Error processing row: {e}")
                continue
        
        return transactions
    
    async def _extract_transaction_data(self, row: pd.Series, columns: Dict[str, str], file_type: str) -> Dict[str, Any]:
        """Extract transaction data from a row"""
        try:
            # Extract date
            date_col = columns.get('date')
            if date_col and pd.notna(row[date_col]):
                date = pd.to_datetime(row[date_col])
            else:
                return None
            
            # Extract description
            desc_col = columns.get('description')
            description = str(row[desc_col]) if desc_col and pd.notna(row[desc_col]) else "Unknown"
            
            # Extract amount - handle different formats
            amount = 0.0
            transaction_type = "unknown"
            
            if 'amount' in columns:
                amount_val = row[columns['amount']]
                if pd.notna(amount_val):
                    amount = abs(float(amount_val))
                    transaction_type = "debit" if float(amount_val) < 0 else "credit"
            else:
                # Check for separate debit/credit columns
                for col in row.index:
                    col_lower = col.lower()
                    if 'debit' in col_lower or 'withdrawal' in col_lower:
                        if pd.notna(row[col]) and row[col] != 0:
                            amount = abs(float(row[col]))
                            transaction_type = "debit"
                            break
                    elif 'credit' in col_lower or 'deposit' in col_lower:
                        if pd.notna(row[col]) and row[col] != 0:
                            amount = abs(float(row[col]))
                            transaction_type = "credit"
                            break
            
            if amount == 0:
                return None
            
            return {
                'date': date,
                'amount': amount,
                'description': description,
                'type': transaction_type,
                'raw_data': row.to_dict()
            }
            
        except Exception as e:
            print(f"Error extracting transaction: {e}")
            return None
    
    async def parse_pdf_statements(self, extracted_text: str, file_type: str) -> List[Dict[str, Any]]:
        """Parse transactions from PDF statement text"""
        transactions = []
        
        # Common patterns for different banks
        patterns = [
            # Pattern 1: DD/MM/YYYY DESCRIPTION AMOUNT
            r'(\d{2}/\d{2}/\d{4})\s+(.+?)\s+([\d,]+\.?\d*)',
            # Pattern 2: DD-MM-YYYY DESCRIPTION AMOUNT
            r'(\d{2}-\d{2}-\d{4})\s+(.+?)\s+([\d,]+\.?\d*)',
            # Pattern 3: YYYY-MM-DD DESCRIPTION AMOUNT
            r'(\d{4}-\d{2}-\d{2})\s+(.+?)\s+([\d,]+\.?\d*)',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, extracted_text, re.MULTILINE)
            
            for match in matches:
                try:
                    date_str, description, amount_str = match
                    
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
                    
                    # Determine transaction type based on keywords
                    transaction_type = "debit"
                    if any(keyword in description.lower() for keyword in ['credit', 'deposit', 'salary', 'interest']):
                        transaction_type = "credit"
                    
                    transactions.append({
                        'date': date,
                        'amount': amount,
                        'description': description.strip(),
                        'type': transaction_type
                    })
                    
                except Exception as e:
                    continue
        
        return transactions
    
    def _clean_amount(self, amount_str: str) -> float:
        """Clean and convert amount string to float"""
        if pd.isna(amount_str) or amount_str == '':
            return 0.0
        
        # Remove common formatting
        cleaned = str(amount_str).replace(',', '').replace('₹', '').replace(' ', '')
        
        try:
            return float(cleaned)
        except:
            return 0.0
    
    def _detect_bank_format(self, df: pd.DataFrame) -> str:
        """Detect bank format based on column names"""
        columns_lower = [col.lower() for col in df.columns]
        
        if 'particulars' in columns_lower:
            return 'sbi'
        elif 'narration' in columns_lower:
            return 'hdfc'
        elif 'description' in columns_lower:
            return 'icici'
        else:
            return 'generic'
                
# services/transaction_categorizer.py
"""
AI-powered transaction categorization service using Groq LLM
"""

import re
from typing import Dict, List, Any
import asyncio
from datetime import datetime, timedelta
import json
import os

try:
    from groq import AsyncGroq
except ImportError:
    print("Groq not installed. Install with: pip install groq")

class TransactionCategorizer:
    def __init__(self):
        self.groq_client = None
        self.initialize_groq()
        
        # Backup categories for fallback
        self.fallback_categories = [
            'income', 'emi', 'sip', 'rent', 'insurance', 'utilities',
            'food', 'transport', 'shopping', 'entertainment', 
            'healthcare', 'education', 'other'
        ]
    
    def initialize_groq(self):
        """Initialize Groq client"""
        try:
            groq_api_key = os.getenv('GROQ_API_KEY')
            if groq_api_key:
                self.groq_client = AsyncGroq(api_key=groq_api_key)
                print("Groq client initialized for transaction categorization")
            else:
                print("GROQ_API_KEY not found - using fallback categorization")
        except Exception as e:
            print(f"Error initializing Groq: {e}")
    
    async def categorize_transaction(self, description: str, amount: float) -> Dict[str, Any]:
        """Categorize a single transaction using Groq LLM"""
        
        if self.groq_client:
            try:
                return await self._categorize_with_groq(description, amount)
            except Exception as e:
                print(f"Error with Groq categorization: {e}")
                # Fallback to rule-based
                return await self._fallback_categorization(description, amount)
        else:
            return await self._fallback_categorization(description, amount)
    
    async def _categorize_with_groq(self, description: str, amount: float) -> Dict[str, Any]:
        """Use Groq LLM for intelligent transaction categorization"""
        
        prompt = f"""
You are an expert Indian financial transaction categorizer. Analyze this transaction and provide detailed categorization.

Transaction Details:
- Description: "{description}"
- Amount: ₹{amount:,.2f}

Categories available:
- income: Salary, wages, bonus, dividend, interest, refund, cashback
- emi: Home loan, car loan, personal loan, education loan EMIs
- sip: Mutual fund SIP, equity investments, ELSS
- rent: House rent, apartment rent, accommodation
- insurance: Life insurance, health insurance, motor insurance premiums
- utilities: Electricity, water, gas, mobile, internet bills
- food: Restaurant, grocery, food delivery, dining
- transport: Uber, Ola, taxi, bus, train, metro, fuel
- shopping: Online shopping, retail purchases, clothing
- entertainment: Movies, Netflix, gaming, subscriptions
- healthcare: Hospital, doctor, pharmacy, medical expenses
- education: School fees, course fees, tuition
- other: Miscellaneous expenses

Additional Analysis:
- Is this transaction recurring (monthly/quarterly payments)?
- What's the confidence level of categorization (0-100)?
- Provide a specific subcategory if applicable

Respond in JSON format:
{
  "category": "primary_category",
  "subcategory": "specific_subcategory or null",
  "confidence_score": confidence_percentage,
  "is_recurring": true/false,
  "reasoning": "brief explanation of categorization logic"
}

Focus on Indian context - recognize Indian bank names, payment methods, and common transaction patterns.
"""

        completion = await self.groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            max_tokens=300,
            temperature=0.1  # Low temperature for consistent categorization
        )
        
        response_text = completion.choices[0].message.content
        
        try:
            # Parse JSON response
            result = json.loads(response_text)
            
            # Validate and clean the response
            category = result.get('category', 'other').lower()
            if category not in self.fallback_categories:
                category = 'other'
            
            return {
                'category': category,
                'subcategory': result.get('subcategory'),
                'confidence_score': min(100, max(0, result.get('confidence_score', 50))),
                'is_recurring': bool(result.get('is_recurring', False)),
                'reasoning': result.get('reasoning', 'AI categorization')
            }
            
        except json.JSONDecodeError:
            # If JSON parsing fails, extract category from text
            category = await self._extract_category_from_text(response_text)
            return {
                'category': category,
                'subcategory': None,
                'confidence_score': 70,
                'is_recurring': False,
                'reasoning': 'Extracted from AI response'
            }
    
    async def _extract_category_from_text(self, text: str) -> str:
        """Extract category from text if JSON parsing fails"""
        text_lower = text.lower()
        
        for category in self.fallback_categories:
            if category in text_lower:
                return category
        
        return 'other'
    
    async def _fallback_categorization(self, description: str, amount: float) -> Dict[str, Any]:
        """Fallback rule-based categorization when Groq is not available"""
        description_lower = description.lower()
        
        # Income patterns
        if any(word in description_lower for word in ['salary', 'wage', 'bonus', 'dividend', 'interest', 'refund', 'cashback']):
            return {
                'category': 'income',
                'subcategory': 'salary' if 'salary' in description_lower else None,
                'confidence_score': 80,
                'is_recurring': 'salary' in description_lower,
                'reasoning': 'Rule-based: Income keywords detected'
            }
        
        # EMI patterns
        elif any(word in description_lower for word in ['emi', 'loan', 'mortgage']):
            return {
                'category': 'emi',
                'subcategory': 'home_loan' if 'home' in description_lower else None,
                'confidence_score': 85,
                'is_recurring': True,
                'reasoning': 'Rule-based: EMI/Loan keywords detected'
            }
        
        # SIP patterns
        elif any(word in description_lower for word in ['sip', 'mutual fund', 'elss', 'investment']):
            return {
                'category': 'sip',
                'subcategory': 'elss' if 'elss' in description_lower else None,
                'confidence_score': 85,
                'is_recurring': True,
                'reasoning': 'Rule-based: Investment keywords detected'
            }
        
        # Default to other
        else:
            return {
                'category': 'other',
                'subcategory': None,
                'confidence_score': 30,
                'is_recurring': False,
                'reasoning': 'Rule-based: No clear pattern found'
            }
    
    async def categorize_batch(self, transactions: List[Dict]) -> List[Dict]:
        """Categorize multiple transactions efficiently"""
        if self.groq_client and len(transactions) > 5:
            # For large batches, use batch processing with Groq
            return await self._batch_categorize_with_groq(transactions)
        else:
            # Process individually
            categorized = []
            for transaction in transactions:
                try:
                    category_data = await self.categorize_transaction(
                        transaction['description'],
                        transaction['amount']
                    )
                    transaction.update(category_data)
                    categorized.append(transaction)
                except Exception as e:
                    print(f"Error categorizing transaction: {e}")
                    transaction.update({
                        'category': 'other',
                        'subcategory': None,
                        'confidence_score': 0,
                        'is_recurring': False,
                        'reasoning': f'Error: {str(e)}'
                    })
                    categorized.append(transaction)
            
            return categorized
    
    async def _batch_categorize_with_groq(self, transactions: List[Dict]) -> List[Dict]:
        """Batch categorization using Groq for efficiency"""
        
        # Prepare batch prompt
        transaction_list = ""
        for i, txn in enumerate(transactions[:20]):  # Limit batch size
            transaction_list += f"{i+1}. Description: \"{txn['description']}\", Amount: ₹{txn['amount']:,.2f}\n"
        
        prompt = f"""
You are an expert Indian financial transaction categorizer. Analyze these {len(transactions[:20])} transactions and categorize each one.

Transactions:
{transaction_list}

Categories: income, emi, sip, rent, insurance, utilities, food, transport, shopping, entertainment, healthcare, education, other

For each transaction, respond in this format:
Transaction X: category=CATEGORY, subcategory=SUBCATEGORY, confidence=XX, recurring=true/false

Analyze all transactions considering Indian banking patterns and contexts.
"""
        
        try:
            completion = await self.groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
                max_tokens=800,
                temperature=0.1
            )
            
            response_text = completion.choices[0].message.content
            
            # Parse batch response
            return await self._parse_batch_response(response_text, transactions)
            
        except Exception as e:
            print(f"Batch categorization failed: {e}")
            # Fallback to individual processing
            return await self.categorize_batch(transactions[:5])  # Process smaller batch
    
    async def _parse_batch_response(self, response: str, transactions: List[Dict]) -> List[Dict]:
        """Parse batch response from Groq"""
        lines = response.split('\n')
        results = []
        
        for i, transaction in enumerate(transactions[:20]):
            # Find corresponding line in response
            category_info = self._extract_category_info_from_line(lines, i+1)
            
            transaction.update(category_info)
            results.append(transaction)
        
        # Add remaining transactions with fallback
        for transaction in transactions[20:]:
            fallback_data = await self._fallback_categorization(
                transaction['description'], 
                transaction['amount']
            )
            transaction.update(fallback_data)
            results.append(transaction)
        
        return results
    
    def _extract_category_info_from_line(self, lines: List[str], transaction_num: int) -> Dict[str, Any]:
        """Extract category information from a specific line"""
        pattern = f"Transaction {transaction_num}:"
        
        for line in lines:
            if pattern in line:
                # Extract information using simple parsing
                category = 'other'
                subcategory = None
                confidence = 50
                recurring = False
                
                if 'category=' in line:
                    try:
                        category = line.split('category=')[1].split(',')[0].strip()
                    except:
                        pass
                
                if 'confidence=' in line:
                    try:
                        confidence = int(line.split('confidence=')[1].split(',')[0].strip())
                    except:
                        pass
                
                if 'recurring=true' in line.lower():
                    recurring = True
                
                return {
                    'category': category,
                    'subcategory': subcategory,
                    'confidence_score': confidence,
                    'is_recurring': recurring,
                    'reasoning': 'Batch AI categorization'
                }
        
        # Fallback if not found
        return {
            'category': 'other',
            'subcategory': None,
            'confidence_score': 30,
            'is_recurring': False,
            'reasoning': 'Batch processing fallback'
        }
    
    async def detect_recurring_transactions(self, transactions: List[Dict]) -> List[Dict]:
        """Use AI to detect recurring transaction patterns"""
        if not self.groq_client or len(transactions) < 3:
            return []
        
        # Group similar transactions for analysis
        transaction_summary = self._create_transaction_summary(transactions)
        
        prompt = f"""
Analyze these transaction patterns to identify recurring transactions (monthly/quarterly payments like EMIs, SIPs, rent, subscriptions).

Transaction Summary:
{transaction_summary}

Identify which transactions are likely recurring based on:
1. Similar amounts appearing multiple times
2. Regular time intervals (monthly, quarterly)
3. Similar descriptions/merchants
4. Typical recurring payment patterns in India

List the recurring transaction patterns you identify with confidence levels.
Format: Description pattern, Approximate amount, Frequency, Confidence (0-100)
"""
        
        try:
            completion = await self.groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
                max_tokens=500,
                temperature=0.2
            )
            
            response = completion.choices[0].message.content
            
            # Mark transactions as recurring based on AI analysis
            return await self._mark_recurring_from_ai_response(response, transactions)
            
        except Exception as e:
            print(f"AI recurring detection failed: {e}")
            return []
    
    def _create_transaction_summary(self, transactions: List[Dict]) -> str:
        """Create a summary of transactions for AI analysis"""
        # Group by similar amounts and descriptions
        summary_lines = []
        
        for txn in transactions[-50:]:  # Last 50 transactions
            date_str = txn.get('date', datetime.now()).strftime('%Y-%m') if hasattr(txn.get('date'), 'strftime') else 'unknown'
            summary_lines.append(f"₹{txn['amount']:,.0f} - {txn['description'][:50]} ({date_str})")
        
        return '\n'.join(summary_lines)
    
    async def _mark_recurring_from_ai_response(self, ai_response: str, transactions: List[Dict]) -> List[Dict]:
        """Mark transactions as recurring based on AI response"""
        recurring_transactions = []
        
        # This is a simplified implementation
        # In production, you'd want more sophisticated pattern matching
        response_lower = ai_response.lower()
        
        for transaction in transactions:
            desc_lower = transaction['description'].lower()
            
            # Check if this transaction matches any recurring pattern mentioned by AI
            if any(word in response_lower for word in desc_lower.split()[:3]):
                if 'recurring' in ai_response.lower() or 'monthly' in ai_response.lower():
                    transaction['is_recurring'] = True
                    transaction['recurring_frequency'] = 'monthly'
                    recurring_transactions.append(transaction)
        
        return recurring_transactions
    
    async def get_category_insights_with_ai(self, transactions: List[Dict]) -> Dict[str, Any]:
        """Generate intelligent spending insights using AI"""
        if not self.groq_client:
            return self.get_category_insights(transactions)
        
        # Calculate basic stats
        category_totals = {}
        total_spending = 0
        
        for transaction in transactions:
            category = transaction.get('category', 'other')
            amount = transaction['amount']
            
            if transaction.get('type') == 'debit':
                category_totals[category] = category_totals.get(category, 0) + amount
                total_spending += amount
        
        # Create summary for AI analysis
        spending_summary = "\n".join([
            f"{category.title()}: ₹{amount:,.2f} ({(amount/total_spending)*100:.1f}%)" 
            for category, amount in sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
        ])
        
        prompt = f"""
Analyze this spending pattern and provide insights for an Indian user:

Monthly Spending Breakdown:
{spending_summary}
Total Monthly Spending: ₹{total_spending:,.2f}

Provide:
1. 3 key insights about spending patterns
2. 2 recommendations for better financial management
3. 1 potential red flag or area of concern (if any)

Focus on practical advice relevant to Indian financial planning, tax savings, and budgeting.
"""
        
        try:
            completion = await self.groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
                max_tokens=400,
                temperature=0.3
            )
            
            ai_insights = completion.choices[0].message.content
            
            return {
                'category_totals': category_totals,
                'total_spending': total_spending,
                'ai_insights': ai_insights,
                'spending_breakdown': {
                    cat: (amount/total_spending)*100 
                    for cat, amount in category_totals.items()
                }
            }
            
        except Exception as e:
            print(f"AI insights generation failed: {e}")
            return self.get_category_insights(transactions)
    
    def get_category_insights(self, transactions: List[Dict]) -> Dict[str, Any]:
        """Fallback category insights without AI"""
        category_totals = {}
        category_counts = {}
        
        for transaction in transactions:
            category = transaction.get('category', 'other')
            amount = transaction['amount']
            
            if category not in category_totals:
                category_totals[category] = 0
                category_counts[category] = 0
            
            if transaction.get('type') == 'debit':
                category_totals[category] += amount
            
            category_counts[category] += 1
        
        # Calculate percentages
        total_spending = sum(category_totals.values())
        category_percentages = {}
        
        for category, amount in category_totals.items():
            if total_spending > 0:
                category_percentages[category] = (amount / total_spending) * 100
            else:
                category_percentages[category] = 0
        
        return {
            'category_totals': category_totals,
            'category_counts': category_counts,
            'category_percentages': category_percentages,
            'total_spending': total_spending
        }
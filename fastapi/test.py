import requests
import json
import pandas as pd
import io
import tempfile
import os
from datetime import datetime, timedelta
import random
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import asyncio
import aiohttp
import time

# Base URL for the API
BASE_URL = "http://localhost:8000"

class IndianFinancialTestSuite:
    """Comprehensive test suite for Indian financial scenarios"""
    
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name: str, status: str, details: str = ""):
        """Log test results"""
        result = {
            'test_name': test_name,
            'status': status,
            'timestamp': datetime.now().isoformat(),
            'details': details
        }
        self.test_results.append(result)
        print(f"[{status}] {test_name}: {details}")
    
    def create_sample_bank_statement_csv(self) -> io.BytesIO:
        """Create realistic Indian bank statement CSV"""
        transactions = [
            # Income
            ("2024-01-01", "SALARY CREDIT - TCS BANGALORE", 85000.00),
            ("2024-01-15", "DIVIDEND CREDIT - RELIANCE", 2500.00),
            ("2024-01-20", "INTEREST CREDIT - SB A/C", 450.00),
            
            # EMIs
            ("2024-01-02", "HDFC HOME LOAN EMI AUTO DEBIT", -32000.00),
            ("2024-01-05", "BAJAJ AUTO LOAN EMI", -12500.00),
            ("2024-01-08", "ICICI PERSONAL LOAN EMI", -8500.00),
            
            # SIPs and Investments
            ("2024-01-10", "SIP MUTUAL FUND - AXIS BLUECHIP", -5000.00),
            ("2024-01-10", "SIP MUTUAL FUND - MIRAE ELSS", -3000.00),
            ("2024-01-15", "PPF DEPOSIT - SBI", -12500.00),
            
            # Insurance
            ("2024-01-03", "LIFE INSURANCE PREMIUM - LIC", -15000.00),
            ("2024-01-07", "HEALTH INSURANCE - STAR HEALTH", -8500.00),
            ("2024-01-12", "TERM INSURANCE - HDFC LIFE", -2400.00),
            
            # Utilities and Rent
            ("2024-01-04", "HOUSE RENT PAYMENT", -25000.00),
            ("2024-01-06", "ELECTRICITY BILL - BESCOM", -3200.00),
            ("2024-01-08", "MOBILE BILL - AIRTEL", -899.00),
            ("2024-01-09", "BROADBAND - ACT FIBERNET", -1299.00),
            ("2024-01-11", "GAS CYLINDER - HP", -850.00),
            
            # Food and Groceries
            ("2024-01-05", "BIG BASKET GROCERY", -4500.00),
            ("2024-01-07", "SWIGGY FOOD DELIVERY", -650.00),
            ("2024-01-09", "ZOMATO ORDER", -480.00),
            ("2024-01-12", "MORE SUPERMARKET", -2800.00),
            ("2024-01-14", "RESTAURANT - PUNJAB GRILL", -1850.00),
            
            # Transport
            ("2024-01-03", "PETROL - INDIAN OIL", -3500.00),
            ("2024-01-06", "UBER RIDE", -285.00),
            ("2024-01-08", "OLA CAB", -195.00),
            ("2024-01-10", "METRO CARD RECHARGE", -500.00),
            ("2024-01-13", "FASTAG RECHARGE", -1000.00),
            
            # Entertainment and Shopping
            ("2024-01-04", "NETFLIX SUBSCRIPTION", -649.00),
            ("2024-01-05", "SPOTIFY PREMIUM", -119.00),
            ("2024-01-07", "AMAZON SHOPPING", -2850.00),
            ("2024-01-09", "FLIPKART ELECTRONICS", -18500.00),
            ("2024-01-11", "PVR CINEMAS", -480.00),
            
            # Medical
            ("2024-01-06", "APOLLO PHARMACY", -850.00),
            ("2024-01-08", "DR CONSULTATION - PRACTO", -500.00),
            ("2024-01-12", "PATHOLOGY LAB", -2500.00),
            
            # Credit Card Payments
            ("2024-01-15", "HDFC CREDIT CARD PAYMENT", -15000.00),
            ("2024-01-16", "AXIS BANK CC PAYMENT", -8500.00),
            
            # Recurring for Feb
            ("2024-02-01", "SALARY CREDIT - TCS BANGALORE", 85000.00),
            ("2024-02-02", "HDFC HOME LOAN EMI AUTO DEBIT", -32000.00),
            ("2024-02-05", "BAJAJ AUTO LOAN EMI", -12500.00),
            ("2024-02-08", "ICICI PERSONAL LOAN EMI", -8500.00),
            ("2024-02-10", "SIP MUTUAL FUND - AXIS BLUECHIP", -5000.00),
            ("2024-02-10", "SIP MUTUAL FUND - MIRAE ELSS", -3000.00),
            ("2024-02-04", "HOUSE RENT PAYMENT", -25000.00),
            ("2024-02-15", "PPF DEPOSIT - SBI", -12500.00),
            
            # March transactions
            ("2024-03-01", "SALARY CREDIT - TCS BANGALORE", 87000.00),  # Salary increment
            ("2024-03-02", "HDFC HOME LOAN EMI AUTO DEBIT", -32000.00),
            ("2024-03-05", "BAJAJ AUTO LOAN EMI", -12500.00),
            ("2024-03-10", "SIP MUTUAL FUND - AXIS BLUECHIP", -5000.00),
            ("2024-03-15", "PPF DEPOSIT - SBI", -12500.00),
            ("2024-03-20", "BONUS PAYMENT - TCS", 25000.00),  # Annual bonus
        ]
        
        df = pd.DataFrame(transactions, columns=['Date', 'Description', 'Amount'])
        
        # Create CSV in memory
        csv_buffer = io.BytesIO()
        df.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)
        return csv_buffer
    
    def create_sample_credit_card_statement_excel(self) -> io.BytesIO:
        """Create realistic credit card statement in Excel"""
        transactions = [
            ("2024-01-02", "AMAZON.IN", -5850.00, "Shopping"),
            ("2024-01-03", "SWIGGY", -680.00, "Food"),
            ("2024-01-04", "UBER", -340.00, "Transport"),
            ("2024-01-05", "BIG BASKET", -2200.00, "Grocery"),
            ("2024-01-06", "FLIPKART", -12000.00, "Electronics"),
            ("2024-01-07", "CAFE COFFEE DAY", -450.00, "Food"),
            ("2024-01-08", "PETROL PUMP", -3000.00, "Fuel"),
            ("2024-01-09", "BOOK MY SHOW", -600.00, "Entertainment"),
            ("2024-01-10", "MYNTRA", -2800.00, "Clothing"),
            ("2024-01-11", "ZOMATO", -520.00, "Food"),
            ("2024-01-12", "APOLLO PHARMACY", -650.00, "Medical"),
            ("2024-01-13", "RELIANCE DIGITAL", -8500.00, "Electronics"),
            ("2024-01-14", "DOMINOS", -800.00, "Food"),
            ("2024-01-15", "PAYMENT RECEIVED", 15000.00, "Payment"),  # Partial payment
            ("2024-01-16", "LATE PAYMENT CHARGE", -500.00, "Fees"),
            ("2024-01-17", "INTEREST CHARGES", -850.00, "Fees"),
        ]
        
        df = pd.DataFrame(transactions, columns=['Transaction Date', 'Description', 'Amount', 'Category'])
        
        # Create Excel in memory
        excel_buffer = io.BytesIO()
        with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
            df.to_sheet(writer, sheet_name='Statement', index=False)
        excel_buffer.seek(0)
        return excel_buffer
    
    def create_sample_cibil_report_pdf(self) -> io.BytesIO:
        """Create a sample CIBIL report PDF"""
        pdf_buffer = io.BytesIO()
        c = canvas.Canvas(pdf_buffer, pagesize=letter)
        
        # CIBIL Report Content
        y_position = 750
        
        c.drawString(100, y_position, "CIBIL CREDIT INFORMATION REPORT")
        y_position -= 40
        
        c.drawString(100, y_position, "Personal Information:")
        y_position -= 20
        c.drawString(120, y_position, "Name: RAJESH KUMAR SHARMA")
        y_position -= 15
        c.drawString(120, y_position, "PAN: ABCDE1234F")
        y_position -= 15
        c.drawString(120, y_position, "Date of Birth: 15-Mar-1988")
        y_position -= 30
        
        c.drawString(100, y_position, "CIBIL Score: 742")
        y_position -= 30
        
        c.drawString(100, y_position, "Credit Summary:")
        y_position -= 20
        c.drawString(120, y_position, "Total Credit Limit: Rs. 3,50,000")
        y_position -= 15
        c.drawString(120, y_position, "Current Balance: Rs. 1,25,000")
        y_position -= 15
        c.drawString(120, y_position, "Credit Utilization: 36%")
        y_position -= 15
        c.drawString(120, y_position, "Payment History: 2 missed payments in last 12 months")
        y_position -= 15
        c.drawString(120, y_position, "Credit Age: 5 years 8 months")
        y_position -= 30
        
        c.drawString(100, y_position, "Active Accounts:")
        y_position -= 20
        c.drawString(120, y_position, "1. HDFC Bank Credit Card - Limit: Rs. 1,50,000, Balance: Rs. 65,000")
        y_position -= 15
        c.drawString(120, y_position, "2. ICICI Bank Credit Card - Limit: Rs. 2,00,000, Balance: Rs. 60,000")
        y_position -= 15
        c.drawString(120, y_position, "3. HDFC Home Loan - Sanctioned: Rs. 35,00,000, Outstanding: Rs. 28,50,000")
        y_position -= 15
        c.drawString(120, y_position, "4. Bajaj Finserv Personal Loan - Sanctioned: Rs. 5,00,000, Outstanding: Rs. 2,25,000")
        y_position -= 30
        
        c.drawString(100, y_position, "Recent Inquiries:")
        y_position -= 20
        c.drawString(120, y_position, "1. SBI Credit Card - 15-Dec-2023")
        y_position -= 15
        c.drawString(120, y_position, "2. Axis Bank Personal Loan - 22-Nov-2023")
        y_position -= 15
        c.drawString(120, y_position, "3. HDFC Car Loan - 08-Oct-2023")
        y_position -= 30
        
        c.drawString(100, y_position, "Payment History Details:")
        y_position -= 20
        c.drawString(120, y_position, "HDFC Credit Card: 30 days past due in Mar-2023, 60 days past due in Aug-2023")
        y_position -= 15
        c.drawString(120, y_position, "All EMIs: Timely payments for home loan and personal loan")
        y_position -= 15
        c.drawString(120, y_position, "Overall: 94% on-time payment ratio")
        
        c.save()
        pdf_buffer.seek(0)
        return pdf_buffer
    
    def create_investment_statement_pdf(self) -> io.BytesIO:
        """Create investment statement PDF for tax analysis"""
        pdf_buffer = io.BytesIO()
        c = canvas.Canvas(pdf_buffer, pagesize=letter)
        
        y_position = 750
        c.drawString(100, y_position, "ANNUAL INVESTMENT STATEMENT - FY 2023-24")
        y_position -= 40
        
        c.drawString(100, y_position, "Section 80C Investments:")
        y_position -= 20
        c.drawString(120, y_position, "PPF Contribution: Rs. 1,50,000")
        y_position -= 15
        c.drawString(120, y_position, "ELSS Mutual Funds: Rs. 50,000")
        y_position -= 15
        c.drawString(120, y_position, "Life Insurance Premium: Rs. 25,000")
        y_position -= 15
        c.drawString(120, y_position, "Total 80C: Rs. 2,25,000 (Exceeds limit of Rs. 1,50,000)")
        y_position -= 30
        
        c.drawString(100, y_position, "Section 80D - Health Insurance:")
        y_position -= 20
        c.drawString(120, y_position, "Self & Family: Rs. 18,000")
        y_position -= 15
        c.drawString(120, y_position, "Parents (Senior Citizens): Rs. 35,000")
        y_position -= 15
        c.drawString(120, y_position, "Total 80D: Rs. 53,000")
        y_position -= 30
        
        c.drawString(100, y_position, "Section 24(b) - Home Loan Interest:")
        y_position -= 20
        c.drawString(120, y_position, "Interest Paid: Rs. 2,85,000")
        y_position -= 15
        c.drawString(120, y_position, "Eligible Deduction: Rs. 2,00,000 (Self-occupied property)")
        y_position -= 30
        
        c.drawString(100, y_position, "Other Investments:")
        y_position -= 20
        c.drawString(120, y_position, "National Pension Scheme (80CCD): Rs. 50,000")
        y_position -= 15
        c.drawString(120, y_position, "Donations (80G): Rs. 15,000")
        
        c.save()
        pdf_buffer.seek(0)
        return pdf_buffer
    
    def test_health_check(self):
        """Test health check endpoint"""
        try:
            response = self.session.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                self.log_test("Health Check", "PASS", "API is running")
                return True
            else:
                self.log_test("Health Check", "FAIL", f"Status code: {response.status_code}")
                return False
        except requests.exceptions.ConnectionError:
            self.log_test("Health Check", "FAIL", "Cannot connect to API. Make sure server is running.")
            return False
        except Exception as e:
            self.log_test("Health Check", "FAIL", str(e))
            return False
    
    def test_upload_bank_statement(self):
        """Test bank statement upload functionality"""
        try:
            # Test CSV upload
            csv_data = self.create_sample_bank_statement_csv()
            
            files = [
                ('files', ('bank_statement.csv', csv_data, 'text/csv'))
            ]
            
            response = self.session.post(f"{BASE_URL}/upload/statements", files=files)
            
            if response.status_code == 200:
                result = response.json()
                
                # Validate response structure
                assert 'transactions' in result
                assert 'summary' in result
                assert len(result['transactions']) > 0
                
                # Check if categorization worked
                categories = result['summary']['categories']
                expected_categories = ['income', 'emi', 'sip', 'rent', 'insurance']
                
                found_categories = [cat for cat in expected_categories if cat in categories]
                
                self.log_test(
                    "Bank Statement Upload (CSV)", 
                    "PASS", 
                    f"Processed {len(result['transactions'])} transactions, found categories: {found_categories}"
                )
                
                return result
            else:
                self.log_test("Bank Statement Upload (CSV)", "FAIL", f"Status: {response.status_code}, Error: {response.text}")
                return None
                
        except Exception as e:
            self.log_test("Bank Statement Upload (CSV)", "FAIL", str(e))
            return None
    
    def test_upload_credit_card_statement(self):
        """Test credit card statement upload"""
        try:
            excel_data = self.create_sample_credit_card_statement_excel()
            
            files = [
                ('files', ('credit_card_statement.xlsx', excel_data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))
            ]
            
            response = self.session.post(f"{BASE_URL}/upload/statements", files=files)
            
            if response.status_code == 200:
                result = response.json()
                self.log_test(
                    "Credit Card Statement Upload (Excel)", 
                    "PASS", 
                    f"Processed {len(result['transactions'])} transactions"
                )
                return result
            else:
                self.log_test("Credit Card Statement Upload (Excel)", "FAIL", f"Status: {response.status_code}")
                return None
                
        except Exception as e:
            self.log_test("Credit Card Statement Upload (Excel)", "FAIL", str(e))
            return None
    
    def test_tax_analysis(self):
        """Test tax analysis functionality"""
        try:
            # Realistic Indian IT professional scenario
            tax_data = {
                'annual_income': 1200000,  # 12 LPA
                'current_investments': json.dumps({
                    '80C': 100000,  # Current 80C investments
                    '80D': 18000,   # Health insurance premium
                    '24b': 200000   # Home loan interest
                })
            }
            
            response = self.session.post(f"{BASE_URL}/analyze/tax", data=tax_data)
            
            if response.status_code == 200:
                result = response.json()
                
                # Validate response
                assert 'old_regime_tax' in result
                assert 'new_regime_tax' in result
                assert 'recommendations' in result
                assert 'deductions_available' in result
                
                old_tax = result['old_regime_tax']
                new_tax = result['new_regime_tax']
                savings_potential = abs(old_tax - new_tax)
                
                self.log_test(
                    "Tax Analysis", 
                    "PASS", 
                    f"Old regime: ₹{old_tax:,.0f}, New regime: ₹{new_tax:,.0f}, Potential savings: ₹{savings_potential:,.0f}"
                )
                
                return result
            else:
                error_detail = response.text
                self.log_test("Tax Analysis", "FAIL", f"Status: {response.status_code}, Error: {error_detail}")
                return None
                
        except Exception as e:
            self.log_test("Tax Analysis", "FAIL", str(e))
            return None
    
    def test_cibil_analysis(self):
        """Test CIBIL report analysis"""
        try:
            pdf_data = self.create_sample_cibil_report_pdf()
            
            files = {
                'file': ('cibil_report.pdf', pdf_data, 'application/pdf')
            }
            
            response = self.session.post(f"{BASE_URL}/analyze/cibil", files=files)
            
            if response.status_code == 200:
                result = response.json()
                
                # Validate response
                assert 'factors' in result
                assert 'recommendations' in result
                assert 'improvement_potential' in result
                
                score = result.get('current_score', 'Not detected')
                utilization = result['factors'].get('credit_utilization', 0)
                improvement = result['improvement_potential']
                
                self.log_test(
                    "CIBIL Analysis", 
                    "PASS", 
                    f"Score: {score}, Utilization: {utilization}%, Improvement potential: {improvement} points"
                )
                
                return result
            else:
                self.log_test("CIBIL Analysis", "FAIL", f"Status: {response.status_code}")
                return None
                
        except Exception as e:
            self.log_test("CIBIL Analysis", "FAIL", str(e))
            return None
    
    def test_knowledge_update(self):
        """Test knowledge base update functionality"""
        try:
            # Test with a realistic financial query
            query_data = {
                'query': 'latest income tax rates India 2024'
            }
            
            response = self.session.post(f"{BASE_URL}/search/update-knowledge", data=query_data)
            
            if response.status_code == 200:
                result = response.json()
                self.log_test("Knowledge Update", "PASS", result.get('message', 'Updated successfully'))
                return result
            else:
                self.log_test("Knowledge Update", "FAIL", f"Status: {response.status_code}")
                return None
                
        except Exception as e:
            self.log_test("Knowledge Update", "FAIL", str(e))
            return None
    
    def test_chat_queries(self):
        """Test AI chat functionality with realistic Indian scenarios"""
        
        # Realistic Indian financial queries
        test_queries = [
            {
                'question': 'I earn ₹15 lakhs per year and currently invest ₹1 lakh in PPF. How much tax can I save if I invest ₹50,000 more in ELSS?',
                'user_context': {
                    'annual_income': 1500000,
                    'current_investments': {'80C': 100000},
                    'age': 32,
                    'city': 'Bangalore'
                }
            },
            {
                'question': 'My CIBIL score is 720 and credit utilization is 45%. What steps should I take to improve it to 750+?',
                'user_context': {
                    'cibil_score': 720,
                    'credit_utilization': 45,
                    'total_credit_limit': 350000,
                    'current_balance': 157500
                }
            },
            {
                'question': 'I have a home loan EMI of ₹35,000. Is it better to prepay the loan or invest in mutual funds?',
                'user_context': {
                    'home_loan_emi': 35000,
                    'outstanding_loan': 2500000,
                    'interest_rate': 8.5,
                    'surplus_amount': 50000
                }
            },
            {
                'question': 'Which tax regime is better for me if I have ₹2 lakh home loan interest and ₹25,000 health insurance?',
                'user_context': {
                    'annual_income': 1000000,
                    'home_loan_interest': 200000,
                    'health_insurance': 25000,
                    'other_deductions': 0
                }
            },
            {
                'question': 'I am 28 years old with ₹12 LPA salary. What should be my investment strategy for tax saving and wealth creation?',
                'user_context': {
                    'age': 28,
                    'annual_income': 1200000,
                    'current_savings': 500000,
                    'risk_profile': 'moderate'
                }
            }
        ]
        
        passed_queries = 0
        
        for i, query_data in enumerate(test_queries):
            try:
                response = self.session.post(f"{BASE_URL}/chat/query", json=query_data)
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # Check if response contains answer
                    if 'answer' in result and len(result['answer']) > 50:
                        passed_queries += 1
                        self.log_test(
                            f"Chat Query {i+1}", 
                            "PASS", 
                            f"Got {len(result['answer'])} chars response, {result.get('sources_used', 0)} sources used"
                        )
                    else:
                        self.log_test(f"Chat Query {i+1}", "FAIL", "Response too short or missing")
                else:
                    self.log_test(f"Chat Query {i+1}", "FAIL", f"Status: {response.status_code}")
                    
                # Add delay to avoid rate limiting
                time.sleep(1)
                
            except Exception as e:
                self.log_test(f"Chat Query {i+1}", "FAIL", str(e))
        
        overall_status = "PASS" if passed_queries >= len(test_queries) * 0.7 else "FAIL"
        self.log_test("Overall Chat Functionality", overall_status, f"{passed_queries}/{len(test_queries)} queries successful")
        
        return passed_queries >= len(test_queries) * 0.7
    
    def test_edge_cases(self):
        """Test edge cases and error handling"""
        
        edge_cases = [
            {
                'name': 'Empty file upload',
                'test': lambda: self.session.post(f"{BASE_URL}/upload/statements", files=[])
            },
            {
                'name': 'Invalid tax income',
                'test': lambda: self.session.post(f"{BASE_URL}/analyze/tax", data={'annual_income': -1000})
            },
            {
                'name': 'Empty chat query',
                'test': lambda: self.session.post(f"{BASE_URL}/chat/query", json={'question': ''})
            },
            {
                'name': 'Very large income',
                'test': lambda: self.session.post(f"{BASE_URL}/analyze/tax", data={'annual_income': 100000000})
            }
        ]
        
        for case in edge_cases:
            try:
                response = case['test']()
                if response.status_code in [400, 422]:  # Expected error codes
                    self.log_test(f"Edge Case: {case['name']}", "PASS", "Handled gracefully")
                else:
                    self.log_test(f"Edge Case: {case['name']}", "FAIL", f"Unexpected status: {response.status_code}")
            except Exception as e:
                self.log_test(f"Edge Case: {case['name']}", "FAIL", str(e))
    
    def performance_test(self):
        """Basic performance testing"""
        try:
            # Test response time for health check
            start_time = time.time()
            response = self.session.get(f"{BASE_URL}/health")
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000  # Convert to milliseconds
            
            if response_time < 1000:  # Under 1 second
                self.log_test("Performance Test", "PASS", f"Health check: {response_time:.0f}ms")
            else:
                self.log_test("Performance Test", "FAIL", f"Health check too slow: {response_time:.0f}ms")
                
        except Exception as e:
            self.log_test("Performance Test", "FAIL", str(e))
    
    def run_all_tests(self):
        """Run all test scenarios"""
        self.start_time = time.time()  # Track execution time
        
        print("=" * 60)
        print("INDIAN FINANCIAL API TEST SUITE")
        print("=" * 60)
        print(f"Testing API at: {BASE_URL}")
        print(f"Test started at: {datetime.now().isoformat()}")
        print("=" * 60)
        
        # Run tests in sequence
        if not self.test_health_check():
            print("❌ Cannot proceed - API is not running!")
            return
        
        print("\n📊 Testing Financial Data Processing...")
        self.test_upload_bank_statement()
        self.test_upload_credit_card_statement()
        
        print("\n💰 Testing Tax Analysis...")
        self.test_tax_analysis()
        
        print("\n📈 Testing CIBIL Analysis...")
        self.test_cibil_analysis()
        
        print("\n🔍 Testing Knowledge Updates...")
        self.test_knowledge_update()
        
        print("\n🤖 Testing AI Chat Functionality...")
        self.test_chat_queries()
        
        print("\n⚠️ Testing Edge Cases...")
        self.test_edge_cases()
        
        print("\n⚡ Performance Testing...")
        self.performance_test()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        
        # Save detailed results to file
        with open(f'test_results_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json', 'w') as f:
            json.dump(self.test_results, f, indent=2)
        
        print("📄 Detailed results saved to test_results_[timestamp].json")
        
    def create_realistic_scenarios(self):
        """Create additional realistic Indian financial scenarios for comprehensive testing"""
        
        scenarios = {
            'young_professional': {
                'profile': 'Fresh graduate, 24 years, ₹6 LPA salary, no investments',
                'data': {
                    'annual_income': 600000,
                    'age': 24,
                    'investments': {},
                    'city': 'Pune',
                    'questions': [
                        'How should I start investing for tax savings?',
                        'What is the minimum I need to invest to save tax?'
                    ]
                }
            },
            'mid_career_professional': {
                'profile': '32 years, ₹18 LPA, home loan, family',
                'data': {
                    'annual_income': 1800000,
                    'age': 32,
                    'home_loan_emi': 45000,
                    'investments': {'80C': 150000, '80D': 31000},
                    'dependents': 2,
                    'city': 'Mumbai',
                    'questions': [
                        'Should I switch to new tax regime with my current investments?',
                        'How to optimize tax with home loan and family insurance?'
                    ]
                }
            },
            'senior_professional': {
                'profile': '45 years, ₹35 LPA, senior citizen parents',
                'data': {
                    'annual_income': 3500000,
                    'age': 45,
                    'investments': {'80C': 150000, '80D': 75000, 'NPS': 150000},
                    'senior_parents': True,
                    'city': 'Delhi',
                    'questions': [
                        'What are the best tax-saving options for high income earners?',
                        'How to claim deductions for senior citizen parents healthcare?'
                    ]
                }
            },
            'business_owner': {
                'profile': 'Small business owner, variable income, GST registered',
                'data': {
                    'annual_income': 1200000,
                    'business_income': True,
                    'gst_registered': True,
                    'business_expenses': 300000,
                    'city': 'Chennai',
                    'questions': [
                        'How to optimize business expenses for tax savings?',
                        'What are the presumptive taxation benefits?'
                    ]
                }
            },
            'nri_scenario': {
                'profile': 'NRI with Indian income and investments',
                'data': {
                    'annual_income': 2000000,
                    'nri_status': True,
                    'foreign_income': 500000,
                    'indian_investments': {'80C': 100000},
                    'country': 'UAE',
                    'questions': [
                        'How does NRI tax calculation work for Indian income?',
                        'Can I claim 80C deductions as an NRI?'
                    ]
                }
            }
        }
        
        return scenarios
    
    def test_realistic_scenarios(self):
        """Test with realistic user scenarios"""
        print("\n🎭 Testing Realistic User Scenarios...")
        
        scenarios = self.create_realistic_scenarios()
        
        for scenario_name, scenario_data in scenarios.items():
            print(f"\nTesting scenario: {scenario_data['profile']}")
            
            try:
                # Test tax analysis for this scenario
                tax_response = self.session.post(
                    f"{BASE_URL}/analyze/tax",
                    data={
                        'annual_income': scenario_data['data']['annual_income'],
                        'current_investments': json.dumps(scenario_data['data'].get('investments', {}))
                    }
                )
                
                if tax_response.status_code == 200:
                    tax_result = tax_response.json()
                    old_tax = tax_result['old_regime_tax']
                    new_tax = tax_result['new_regime_tax']
                    better_regime = "Old" if old_tax < new_tax else "New"
                    savings = abs(old_tax - new_tax)
                    
                    self.log_test(
                        f"Scenario: {scenario_name} - Tax Analysis",
                        "PASS",
                        f"{better_regime} regime better by ₹{savings:,.0f}"
                    )
                
                # Test chat queries for this scenario
                for question in scenario_data['data'].get('questions', []):
                    chat_response = self.session.post(
                        f"{BASE_URL}/chat/query",
                        json={
                            'question': question,
                            'user_context': scenario_data['data']
                        }
                    )
                    
                    if chat_response.status_code == 200:
                        chat_result = chat_response.json()
                        if len(chat_result.get('answer', '')) > 50:
                            self.log_test(
                                f"Scenario: {scenario_name} - Chat Query",
                                "PASS",
                                f"Relevant response for: {question[:50]}..."
                            )
                        else:
                            self.log_test(
                                f"Scenario: {scenario_name} - Chat Query",
                                "FAIL",
                                "Response too short"
                            )
                    
                    time.sleep(0.5)  # Rate limiting
                    
            except Exception as e:
                self.log_test(f"Scenario: {scenario_name}", "FAIL", str(e))
    
    def test_data_validation(self):
        """Test data validation and parsing accuracy"""
        print("\n✅ Testing Data Validation...")
        
        # Test transaction categorization accuracy
        test_transactions = [
            ("SALARY CREDIT TCS", "income"),
            ("HOME LOAN EMI HDFC", "emi"),
            ("SIP MUTUAL FUND", "sip"),
            ("HOUSE RENT", "rent"),
            ("LIFE INSURANCE PREMIUM", "insurance"),
            ("SWIGGY FOOD ORDER", "food"),
            ("UBER RIDE", "transport"),
            ("NETFLIX SUBSCRIPTION", "entertainment"),
            ("APOLLO PHARMACY", "medical"),
            ("ELECTRICITY BILL", "utilities")
        ]

        from new.app import FinancialProcessor  # Import from your main file
        processor = FinancialProcessor()
        
        correct_categorizations = 0
        total_tests = len(test_transactions)
        
        for description, expected_category in test_transactions:
            predicted_category = processor.categorize_transaction(description)
            
            if predicted_category == expected_category:
                correct_categorizations += 1
                self.log_test(
                    f"Categorization: {description[:20]}...",
                    "PASS",
                    f"Correctly categorized as {predicted_category}"
                )
            else:
                self.log_test(
                    f"Categorization: {description[:20]}...",
                    "FAIL",
                    f"Expected {expected_category}, got {predicted_category}"
                )
        
        accuracy = (correct_categorizations / total_tests) * 100
        self.log_test(
            "Overall Categorization Accuracy",
            "PASS" if accuracy >= 80 else "FAIL",
            f"{accuracy:.1f}% accuracy ({correct_categorizations}/{total_tests})"
        )
    
    def stress_test(self):
        """Basic stress testing with multiple concurrent requests"""
        print("\n⚡ Running Stress Tests...")
        
        import concurrent.futures
        import threading
        
        def make_health_check_request():
            try:
                response = requests.get(f"{BASE_URL}/health", timeout=10)
                return response.status_code == 200
            except:
                return False
        
        def make_tax_analysis_request():
            try:
                response = requests.post(
                    f"{BASE_URL}/analyze/tax",
                    data={'annual_income': random.randint(500000, 2000000)},
                    timeout=15
                )
                return response.status_code == 200
            except:
                return False
        
        # Test concurrent health checks
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            health_futures = [executor.submit(make_health_check_request) for _ in range(20)]
            health_results = [f.result() for f in health_futures]
        
        health_success_rate = sum(health_results) / len(health_results) * 100
        
        self.log_test(
            "Concurrent Health Checks",
            "PASS" if health_success_rate >= 90 else "FAIL",
            f"{health_success_rate:.1f}% success rate (20 concurrent requests)"
        )
        
        # Test concurrent tax analysis
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            tax_futures = [executor.submit(make_tax_analysis_request) for _ in range(10)]
            tax_results = [f.result() for f in tax_futures]
        
        tax_success_rate = sum(tax_results) / len(tax_results) * 100
        
        self.log_test(
            "Concurrent Tax Analysis",
            "PASS" if tax_success_rate >= 80 else "FAIL",
            f"{tax_success_rate:.1f}% success rate (10 concurrent requests)"
        )

def create_sample_files_for_manual_testing():
    """Create sample files that can be used for manual testing"""
    print("\n📁 Creating sample files for manual testing...")
    
    # Create sample CSV
    sample_csv = """Date,Description,Amount
2024-01-01,SALARY CREDIT - INFOSYS LTD,75000.00
2024-01-02,HDFC HOME LOAN EMI,-28000.00
2024-01-03,SIP MUTUAL FUND AXIS,-5000.00
2024-01-04,HOUSE RENT,-20000.00
2024-01-05,ELECTRICITY BILL,-2800.00
2024-01-06,AMAZON SHOPPING,-3500.00
2024-01-07,PETROL EXPENSE,-2000.00
2024-01-08,LIC PREMIUM PAYMENT,-12000.00
2024-01-09,SWIGGY FOOD ORDER,-650.00
2024-01-10,METRO CARD RECHARGE,-500.00"""
    
    with open('sample_bank_statement.csv', 'w') as f:
        f.write(sample_csv)
    
    # Create instructions file
    instructions = """
FINANCIAL API TESTING INSTRUCTIONS
==================================

1. Start the API server:
   python financial_ai_server.py

2. The server should run on http://localhost:8000

3. Manual testing files created:
   - sample_bank_statement.csv (for /upload/statements)

4. Test endpoints using curl or Postman:

   Health Check:
   GET http://localhost:8000/health

   Upload Bank Statement:
   POST http://localhost:8000/upload/statements
   (Upload sample_bank_statement.csv as 'files')

   Tax Analysis:
   POST http://localhost:8000/analyze/tax
   Form data: annual_income=1200000, current_investments={"80C": 50000}

   Chat Query:
   POST http://localhost:8000/chat/query
   JSON: {"question": "How much tax can I save with ELSS investment?"}

5. Run this test suite:
   python test_financial_api.py

Expected Results:
- Health check should return status 200
- Statement upload should categorize transactions correctly
- Tax analysis should calculate both regimes
- Chat should provide relevant financial advice
- CIBIL analysis should parse credit reports

Troubleshooting:
- Ensure all dependencies are installed
- Check if GROQ_API_KEY environment variable is set
- Verify that ports 8000 is available
- Check server logs for detailed error messages
"""
    
    with open('TESTING_INSTRUCTIONS.txt', 'w') as f:
        f.write(instructions)
    
    print("✅ Created sample_bank_statement.csv")
    print("✅ Created TESTING_INSTRUCTIONS.txt")

if __name__ == "__main__":
    # Create sample files
    create_sample_files_for_manual_testing()
    
    # Run test suite
    test_suite = IndianFinancialTestSuite()
    test_suite.run_all_tests()
    
    # Additional comprehensive tests
    test_suite.test_realistic_scenarios()
    test_suite.test_data_validation()
    test_suite.stress_test()
    
    print("\n🏁 All tests completed!")
    print("Check the generated JSON file for detailed results.")
    print("📁 Sample files created for manual testing.")
    print("📖 Read TESTING_INSTRUCTIONS.txt for manual testing guide.")
    
    # Final summary statistics
    total_tests = len(test_suite.test_results)
    passed_tests = len([t for t in test_suite.test_results if t['status'] == 'PASS'])
    
    print(f"\n📊 FINAL STATISTICS:")
    print(f"   Total Test Cases: {total_tests}")
    print(f"   Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    
    if passed_tests == total_tests:
        print("   🏆 PERFECT SCORE! All systems operational!")
    elif passed_tests >= total_tests * 0.9:
        print("   🥇 EXCELLENT! Minor tweaks needed.")
    elif passed_tests >= total_tests * 0.7:
        print("   🥈 GOOD! Some improvements required.")
    else:
        print("   ⚠️  NEEDS WORK! Major fixes required.")
    
    print("\n" + "=" * 60)
    print("Thank you for testing the Indian Financial API! 🇮🇳💰")
    print("=" * 60)

    # Final concise test summary
    print("\nTEST SUMMARY")
    print("=" * 60)

    total_tests = len(test_suite.test_results)
    passed_tests = len([t for t in test_suite.test_results if t['status'] == 'PASS'])
    failed_tests = total_tests - passed_tests

    print(f"Total Tests: {total_tests}")
    print(f"✅ Passed: {passed_tests}")
    print(f"❌ Failed: {failed_tests}")
    print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")

    if failed_tests > 0:
        print("\nFailed Tests:")
        for test in test_suite.test_results:
            if test['status'] == 'FAIL':
                print(f"  - {test['test_name']}: {test['details']}")

    print("\n" + "=" * 60)
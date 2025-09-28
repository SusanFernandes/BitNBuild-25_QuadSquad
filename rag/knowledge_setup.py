#tax_filing_knowledge_setup.py
import asyncio
import chromadb
import os
import json
import sqlite3
import time
import re
from datetime import datetime, timedelta
from chromadb.utils import embedding_functions
from loguru import logger
from typing import List, Dict, Any, Optional
from pathlib import Path
import hashlib

# Configure logging
logger.add("tax_filing_agent.log", rotation="1 MB", level="INFO")

# Import optional dependencies with fallbacks
try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    logger.warning("Pandas not installed - using basic data structures")
    HAS_PANDAS = False

try:
    from crawl4ai import AsyncWebCrawler
    from crawl4ai.extraction_strategy import NoExtractionStrategy
    HAS_CRAWL4AI = True
except ImportError:
    logger.warning("crawl4ai not installed - using curated data only")
    HAS_CRAWL4AI = False

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    logger.warning("requests not installed - no web data fetching")
    HAS_REQUESTS = False

class TaxFilingDataCrawler:
    def __init__(self):
        self.db_path = "tax_filing_data.db"
        self.setup_database()
        
    def setup_database(self):
        """Setup SQLite database for caching tax-related crawled data"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tax_content (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT UNIQUE,
                title TEXT,
                content TEXT,
                category TEXT,
                source TEXT,
                crawled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                relevance_score REAL
            )
        ''')
        
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_url ON tax_content (url)')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tax_forms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                form_name TEXT,
                description TEXT,
                applicability TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tax_rates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                assessment_year TEXT,
                regime_type TEXT,
                rate_structure TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info("Tax filing SQLite database setup completed")

    async def crawl_tax_websites(self):
        """Crawl tax-specific websites for latest information"""
        if not HAS_CRAWL4AI:
            logger.info("Crawl4AI not available - skipping web crawling")
            return
        
        tax_sources = [
            {
                "url": "https://www.incometaxindia.gov.in/Pages/default.aspx",
                "category": "official_tax_portal",
                "source": "Income Tax Department"
            },
            {
                "url": "https://cleartax.in/s/income-tax-guide",
                "category": "tax_filing_guide",
                "source": "ClearTax"
            },
            {
                "url": "https://cleartax.in/s/itr-forms",
                "category": "itr_forms",
                "source": "ClearTax"
            },
            {
                "url": "https://www.bankbazaar.com/tax/income-tax-slabs.html",
                "category": "tax_slabs",
                "source": "BankBazaar"
            },
            {
                "url": "https://groww.in/blog/category/tax",
                "category": "tax_planning",
                "source": "Groww"
            },
            {
                "url": "https://economictimes.indiatimes.com/wealth/tax",
                "category": "tax_news",
                "source": "Economic Times"
            },
            {
                "url": "https://www.livemint.com/money/personal-finance/income-tax",
                "category": "tax_updates",
                "source": "LiveMint"
            },
            {
                "url": "https://www.moneycontrol.com/news/business/personal-finance/tax/",
                "category": "tax_planning",
                "source": "Moneycontrol"
            }
        ]
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            async with AsyncWebCrawler(verbose=True) as crawler:
                for source in tax_sources:
                    # Skip if URL was crawled recently
                    cursor.execute("SELECT crawled_at FROM tax_content WHERE url = ?", (source['url'],))
                    result = cursor.fetchone()
                    if result and (datetime.now() - datetime.fromisoformat(result[0])).total_seconds() < 86400:
                        logger.info(f"Skipping {source['url']} - recently crawled")
                        continue
                    
                    try:
                        logger.info(f"Crawling tax content: {source['url']}")
                        
                        extraction_strategy = NoExtractionStrategy()
                        
                        result = await crawler.arun(
                            url=source['url'],
                            extraction_strategy=extraction_strategy,
                            bypass_cache=True,
                            css_selector="article, .content, .post, .tax-guide, main, .story-content, .article-content",
                            word_count_threshold=100,
                            exclude_external_links=True,
                            wait_for_images=False,
                            delay_before_return_html=2.0,
                            simulate_user=True,
                            magic=True
                        )
                        
                        if result.success:
                            title = getattr(result, 'title', '') or ''
                            content = result.cleaned_html or result.html or ''
                            relevance_score = self.calculate_tax_relevance(content)
                            
                            if relevance_score > 0.3:  # Only store tax-relevant content
                                await self.store_tax_content(
                                    url=source['url'],
                                    title=title,
                                    content=content,
                                    category=source['category'],
                                    source=source['source'],
                                    relevance_score=relevance_score
                                )
                                logger.success(f"Successfully crawled tax content: {source['source']}")
                            else:
                                logger.info(f"Low tax relevance for {source['url']}, skipping")
                        else:
                            logger.error(f"Failed to crawl: {source['url']}")
                            
                        # Rate limiting
                        await asyncio.sleep(3)
                        
                    except Exception as e:
                        logger.error(f"Error crawling {source['url']}: {str(e)}")
                        continue
        except Exception as e:
            logger.error(f"Tax web crawling error: {str(e)}")
        finally:
            conn.close()

    def calculate_tax_relevance(self, content: str) -> float:
        """Calculate how relevant content is to tax filing"""
        tax_keywords = [
            "income tax", "itr", "tax filing", "tax return", "assessment year",
            "old regime", "new regime", "section 80c", "deduction", "exemption",
            "salary income", "business income", "capital gains", "house property",
            "other sources", "advance tax", "tds", "tax refund", "pan card",
            "form 16", "ay 2024-25", "fy 2023-24", "tax slab", "rebate",
            "tax liability", "gross total income", "taxable income"
        ]
        
        content_lower = content.lower()
        keyword_matches = sum(1 for keyword in tax_keywords if keyword in content_lower)
        
        # Calculate relevance score
        relevance = min(1.0, keyword_matches / len(tax_keywords) * 5)  # Scale to 0-1
        
        return relevance

    async def store_tax_content(self, url: str, title: str, content: str, 
                              category: str, source: str, relevance_score: float):
        """Store tax-specific crawled content"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT OR REPLACE INTO tax_content 
                (url, title, content, category, source, relevance_score)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (url, title, content, category, source, relevance_score))
            
            conn.commit()
            logger.info(f"Stored tax content from {source}: {title[:50] if title else 'No title'}...")
            
        except Exception as e:
            logger.error(f"Error storing tax content: {str(e)}")
        finally:
            conn.close()

class TaxFilingKnowledgeBase:
    def __init__(self):
        try:
            self.client = chromadb.PersistentClient(path="./chroma_tax_filing_db")
            self.embedding_function = embedding_functions.DefaultEmbeddingFunction()
            self.setup_collections()
            self.crawler = TaxFilingDataCrawler()
            logger.info("Tax Filing ChromaDB initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing ChromaDB: {str(e)}")
            raise
        
    def setup_collections(self):
        """Setup ChromaDB collections for tax filing data"""        
        self.tax_filing_basics = self.client.get_or_create_collection(
            name="tax_filing_basics",
            embedding_function=self.embedding_function,
            metadata={"description": "Basic tax filing procedures and requirements"}
        )
        
        self.income_categories = self.client.get_or_create_collection(
            name="income_categories",
            embedding_function=self.embedding_function,
            metadata={"description": "Different income categories and their taxation"}
        )
        
        self.tax_regimes = self.client.get_or_create_collection(
            name="tax_regimes",
            embedding_function=self.embedding_function,
            metadata={"description": "Old vs New tax regime comparison and rules"}
        )
        
        self.itr_forms = self.client.get_or_create_collection(
            name="itr_forms",
            embedding_function=self.embedding_function,
            metadata={"description": "ITR forms and their applicability"}
        )
        
        self.deductions_exemptions = self.client.get_or_create_collection(
            name="deductions_exemptions",
            embedding_function=self.embedding_function,
            metadata={"description": "Tax deductions and exemptions"}
        )
        
        logger.info("Tax Filing ChromaDB collections setup completed")

    async def populate_tax_knowledge_base(self):
        """Populate the knowledge base with comprehensive tax filing data"""
        logger.info("Populating tax filing knowledge base...")
        
        # 1. Add curated tax filing knowledge
        await self.add_tax_filing_basics()
        await self.add_income_categories_knowledge()
        await self.add_tax_regimes_knowledge()
        await self.add_itr_forms_knowledge()
        await self.add_deductions_exemptions_knowledge()
        
        # 2. Crawl latest tax data from web
        try:
            await self.crawler.crawl_tax_websites()
            await self.process_crawled_tax_data()
        except Exception as e:
            logger.warning(f"Tax web crawling had issues: {e}")
            logger.info("Continuing with curated tax data...")
        
        logger.success("Tax filing knowledge base populated successfully!")

    async def add_tax_filing_basics(self):
        """Add comprehensive tax filing basics"""
        tax_filing_basics = [
            {
                "text": "Income Tax Return (ITR) filing is mandatory for individuals whose total income exceeds the basic exemption limit. For FY 2023-24 (AY 2024-25), filing is required if income exceeds ₹2.5 lakh under old regime or ₹3 lakh under new regime. Even if income is below threshold, filing may be required for claiming refunds, carrying forward losses, or if specified transactions exceed prescribed limits.",
                "metadata": {
                    "category": "filing_requirements",
                    "priority": "high",
                    "keywords": "ITR filing, mandatory, exemption limit, 2.5 lakh, 3 lakh, refund, losses"
                }
            },
            {
                "text": "Due dates for ITR filing: For individuals (not subject to audit) - July 31st. For individuals whose accounts are subject to audit - October 31st. Belated returns can be filed up to December 31st with penalty. Updated returns can be filed within 24 months from the end of relevant assessment year. E-filing is mandatory for income above ₹5 lakh.",
                "metadata": {
                    "category": "due_dates",
                    "priority": "high",
                    "keywords": "due dates, July 31, October 31, belated return, updated return, e-filing mandatory"
                }
            },
            {
                "text": "Documents required for tax filing: Form 16 (salary income), Form 16A (TDS on non-salary income), bank statements, investment proofs for deductions, property documents for house property income, business books of accounts, capital gains statements, foreign asset details if applicable, and previous year's ITR acknowledgment.",
                "metadata": {
                    "category": "required_documents",
                    "priority": "high",
                    "keywords": "Form 16, Form 16A, bank statements, investment proofs, property documents, business accounts"
                }
            },
            {
                "text": "E-verification of ITR: After e-filing, ITR must be verified within 30 days. Options include Aadhaar OTP, net banking, bank account number validation, EVC through demat account, or by sending signed ITR-V to CPC Bangalore. Without verification, ITR is considered defective and may be processed with errors.",
                "metadata": {
                    "category": "verification",
                    "priority": "high",
                    "keywords": "e-verification, 30 days, Aadhaar OTP, net banking, EVC, ITR-V, defective return"
                }
            },
            {
                "text": "Penalty for late filing: Late filing penalty ranges from ₹1,000 to ₹10,000 depending on income level and delay period. For income up to ₹5 lakh, penalty is ₹1,000. Above ₹5 lakh, penalty is ₹5,000 if filed by December 31st, otherwise ₹10,000. Interest at 1% per month is charged on unpaid taxes from due date.",
                "metadata": {
                    "category": "penalties",
                    "priority": "medium",
                    "keywords": "late filing penalty, 1000, 5000, 10000, interest 1%, unpaid taxes"
                }
            }
        ]
        
        documents = [item["text"] for item in tax_filing_basics]
        metadatas = [item["metadata"] for item in tax_filing_basics]
        self.tax_filing_basics.add(
            documents=documents,
            metadatas=metadatas,
            ids=[f"basics_{i}" for i in range(len(tax_filing_basics))]
        )
        
        logger.info(f"Added {len(tax_filing_basics)} tax filing basics")

    async def add_income_categories_knowledge(self):
        """Add knowledge about different income categories"""
        income_categories = [
            {
                "text": "Salary Income (Section 17): Includes basic salary, dearness allowance, bonus, commission, gratuity, pension, and perquisites. Standard deduction of ₹50,000 is available. Entertainment allowance deduction (₹5,000 or 1/5th of salary, whichever is less) for government employees. HRA exemption available if rent is paid. Professional tax paid is deductible.",
                "metadata": {
                    "category": "salary_income",
                    "priority": "high",
                    "keywords": "salary income, standard deduction 50000, entertainment allowance, HRA, professional tax"
                }
            },
            {
                "text": "House Property Income (Section 22-27): Annual rental value minus municipal taxes, standard deduction of 30% on net annual value, and interest on home loan (up to ₹2 lakh for self-occupied, no limit for let-out property). For self-occupied property with no rental income, notional rent is considered nil. Property can be self-occupied, let-out, or deemed let-out.",
                "metadata": {
                    "category": "house_property",
                    "priority": "high",
                    "keywords": "house property, rental value, 30% standard deduction, home loan interest, 2 lakh limit"
                }
            },
            {
                "text": "Business and Profession Income (Section 28-44): Profits and gains from business or profession. Can opt for presumptive taxation schemes - Section 44AD (8% of turnover for business up to ₹2 crore), Section 44ADA (50% of gross receipts for professionals up to ₹50 lakh), Section 44AE (for transport business). Regular books of accounts required if opting out of presumptive schemes.",
                "metadata": {
                    "category": "business_income",
                    "priority": "high",
                    "keywords": "business income, presumptive taxation, 44AD, 44ADA, 44AE, 8% turnover, 50% receipts"
                }
            },
            {
                "text": "Capital Gains (Section 45-55): Profits from sale of capital assets. Short-term capital gains (STCG) - assets held for ≤36 months (≤24 months for immovable property), taxed at applicable slab rates. Long-term capital gains (LTCG) - assets held for >36 months, taxed at 20% with indexation benefit. LTCG on equity shares/equity MF exceeding ₹1 lakh taxed at 10% without indexation.",
                "metadata": {
                    "category": "capital_gains",
                    "priority": "medium",
                    "keywords": "capital gains, STCG, LTCG, 36 months, 24 months, 20% tax, indexation, equity 10%"
                }
            },
            {
                "text": "Income from Other Sources (Section 56): Interest income, dividend income, winning from lottery/crossword puzzles, gifts exceeding ₹50,000, family pension, rental income from machinery/equipment. Interest income includes FD, savings bank, bonds. Dividend income above ₹10 is taxable. Lottery winnings taxed at flat 30%.",
                "metadata": {
                    "category": "other_sources",
                    "priority": "medium",
                    "keywords": "other sources, interest income, dividend, lottery 30%, gifts 50000, family pension"
                }
            }
        ]
        
        documents = [item["text"] for item in income_categories]
        metadatas = [item["metadata"] for item in income_categories]
        self.income_categories.add(
            documents=documents,
            metadatas=metadatas,
            ids=[f"income_{i}" for i in range(len(income_categories))]
        )
        
        logger.info(f"Added {len(income_categories)} income category details")

    async def add_tax_regimes_knowledge(self):
        """Add knowledge about old vs new tax regimes"""
        tax_regimes = [
            {
                "text": "New Tax Regime (Default from FY 2023-24): Lower tax rates but limited deductions. Tax slabs: ₹0-3 lakh (0%), ₹3-6 lakh (5%), ₹6-9 lakh (10%), ₹9-12 lakh (15%), ₹12-15 lakh (20%), above ₹15 lakh (30%). Rebate under Section 87A up to ₹25,000 for income up to ₹7 lakh (effective tax nil). Standard deduction of ₹50,000 and employer NPS contribution deduction available.",
                "metadata": {
                    "category": "new_regime",
                    "priority": "high",
                    "keywords": "new tax regime, default, 3-6 lakh 5%, 6-9 lakh 10%, rebate 25000, 7 lakh"
                }
            },
            {
                "text": "Old Tax Regime (Optional): Higher tax rates but extensive deductions available. Tax slabs: ₹0-2.5 lakh (0%), ₹2.5-5 lakh (5%), ₹5-10 lakh (20%), above ₹10 lakh (30%). Major deductions: 80C (₹1.5 lakh), 80D (₹25,000-50,000), HRA exemption, home loan interest (₹2 lakh), professional tax, LTA exemption. Need to specifically opt for old regime while filing.",
                "metadata": {
                    "category": "old_regime",
                    "priority": "high",
                    "keywords": "old tax regime, optional, 2.5-5 lakh 5%, 80C 1.5 lakh, 80D, HRA, home loan"
                }
            },
            {
                "text": "Choosing between regimes: Calculate tax liability under both regimes. New regime beneficial if total eligible deductions are less than ₹2-2.5 lakh annually. Old regime better for individuals with significant investments in PPF, ELSS, home loan EMI, health insurance, children's tuition fees. Choice can be made annually for salaried individuals (inform employer), business individuals need to choose at ITR filing stage.",
                "metadata": {
                    "category": "regime_comparison",
                    "priority": "high",
                    "keywords": "regime comparison, 2-2.5 lakh deductions, annual choice, inform employer"
                }
            },
            {
                "text": "Surcharge and Cess: Both regimes attract surcharge - 10% if income between ₹50 lakh-1 crore, 15% if between ₹1-2 crore, 25% if between ₹2-5 crore, 37% above ₹5 crore. Health and Education Cess at 4% on (tax + surcharge). Marginal relief available to ensure effective rate doesn't exceed the rate applicable to income at lower slab plus the amount of income exceeding such slab.",
                "metadata": {
                    "category": "surcharge_cess",
                    "priority": "medium",
                    "keywords": "surcharge, 10% 50 lakh, 15% 1 crore, 25% 2 crore, 37% 5 crore, cess 4%"
                }
            }
        ]
        
        documents = [item["text"] for item in tax_regimes]
        metadatas = [item["metadata"] for item in tax_regimes]
        self.tax_regimes.add(
            documents=documents,
            metadatas=metadatas,
            ids=[f"regime_{i}" for i in range(len(tax_regimes))]
        )
        
        logger.info(f"Added {len(tax_regimes)} tax regime details")

    async def add_itr_forms_knowledge(self):
        """Add knowledge about different ITR forms"""
        itr_forms = [
            {
                "text": "ITR-1 (Sahaj): For resident individuals with income up to ₹50 lakh from salary, one house property, other sources (interest, family pension, agriculture up to ₹5,000). Cannot be used if you have business income, capital gains, losses to carry forward, foreign assets, or are director in a company. Most common form for salaried employees.",
                "metadata": {
                    "category": "itr1",
                    "priority": "high",
                    "keywords": "ITR-1, Sahaj, 50 lakh limit, salary, one house property, salaried employees"
                }
            },
            {
                "text": "ITR-2: For individuals and HUFs with income from capital gains, business income, foreign assets, multiple house properties, or losses to carry forward. Required if you're director in a company, have unlisted equity shares, foreign income, or agricultural income above ₹5,000. More detailed form with additional schedules.",
                "metadata": {
                    "category": "itr2",
                    "priority": "high",
                    "keywords": "ITR-2, capital gains, foreign assets, multiple properties, director, unlisted shares"
                }
            },
            {
                "text": "ITR-3: For individuals having income from business or profession. Mandatory for proprietors, professionals like doctors, lawyers, consultants. Requires detailed profit & loss account, balance sheet. Cannot use presumptive taxation schedules in this form - those are covered in ITR-4.",
                "metadata": {
                    "category": "itr3",
                    "priority": "medium",
                    "keywords": "ITR-3, business income, profession, proprietors, P&L account, balance sheet"
                }
            },
            {
                "text": "ITR-4 (Sugam): For individuals/HUFs having presumptive income from business (Section 44AD/AE) or profession (Section 44ADA). Business turnover up to ₹2 crore and professional gross receipts up to ₹50 lakh. Cannot be used if opting out of presumptive schemes or having other sources of income requiring ITR-2.",
                "metadata": {
                    "category": "itr4",
                    "priority": "medium",
                    "keywords": "ITR-4, Sugam, presumptive income, 44AD, 44ADA, 2 crore turnover, 50 lakh receipts"
                }
            },
            {
                "text": "Common mistakes in ITR forms: Wrong form selection, incorrect income classification, missing TDS details, wrong bank account details for refund, not reporting high-value transactions, missing foreign asset disclosures, mathematical errors in tax calculation, not carrying forward losses, missing verification. Always cross-check Form 26AS with your ITR.",
                "metadata": {
                    "category": "common_mistakes",
                    "priority": "medium",
                    "keywords": "ITR mistakes, wrong form, TDS details, bank account, foreign assets, Form 26AS"
                }
            }
        ]
        
        documents = [item["text"] for item in itr_forms]
        metadatas = [item["metadata"] for item in itr_forms]
        self.itr_forms.add(
            documents=documents,
            metadatas=metadatas,
            ids=[f"itr_{i}" for i in range(len(itr_forms))]
        )
        
        logger.info(f"Added {len(itr_forms)} ITR forms knowledge")

    async def add_deductions_exemptions_knowledge(self):
        """Add knowledge about tax deductions and exemptions"""
        deductions_exemptions = [
            {
                "text": "Section 80C Deductions (₹1.5 lakh limit): PPF contributions, ELSS mutual funds, life insurance premiums, NSC, tax-saving FDs, home loan principal repayment, stamp duty and registration charges for house property, children's tuition fees, Sukanya Samriddhi Yojana. ELSS has shortest lock-in period of 3 years among all 80C investments.",
                "metadata": {
                    "category": "80c_deductions",
                    "priority": "high",
                    "keywords": "Section 80C, 1.5 lakh, PPF, ELSS, life insurance, NSC, home loan principal, tuition fees"
                }
            },
            {
                "text": "Section 80D Health Insurance: Medical insurance premiums for self/family up to ₹25,000, additional ₹25,000 for parents below 60 years, ₹50,000 for parents above 60 years. Preventive health check-up ₹5,000 within overall limit. Maximum deduction can reach ₹1 lakh (₹25,000 + ₹50,000 + ₹25,000 for very senior citizen parents).",
                "metadata": {
                    "category": "80d_health",
                    "priority": "high",
                    "keywords": "Section 80D, health insurance, 25000, parents 50000, preventive checkup 5000"
                }
            },
            {
                "text": "Other Important Deductions: Section 80E (education loan interest - no limit), Section 80G (donations to approved funds), Section 80TTA (savings account interest up to ₹10,000), Section 80TTB (senior citizen interest up to ₹50,000), Section 24 (home loan interest up to ₹2 lakh), HRA exemption, LTA exemption for salaried employees.",
                "metadata": {
                    "category": "other_deductions",
                    "priority": "medium",
                    "keywords": "80E education loan, 80G donations, 80TTA 10000, 80TTB 50000, Section 24, HRA, LTA"
                }
            },
            {
                "text": "Exemptions under Section 10: HRA exemption (minimum of actual HRA, rent paid minus 10% of basic, 50% of basic for metro/40% for non-metro), LTA for travel within India, gratuity up to ₹20 lakh, agriculture income up to ₹5,000, interest on EPF, scholarship for education, awards from government.",
                "metadata": {
                    "category": "section_10_exemptions",
                    "priority": "medium",
                    "keywords": "Section 10, HRA exemption, LTA, gratuity 20 lakh, agriculture 5000, EPF interest"
                }
            }
        ]
        
        documents = [item["text"] for item in deductions_exemptions]
        metadatas = [item["metadata"] for item in deductions_exemptions]
        self.deductions_exemptions.add(
            documents=documents,
            metadatas=metadatas,
            ids=[f"deduction_{i}" for i in range(len(deductions_exemptions))]
        )
        
        logger.info(f"Added {len(deductions_exemptions)} deductions and exemptions")

    async def process_crawled_tax_data(self):
        """Process crawled tax data and add to appropriate collections"""
        conn = sqlite3.connect(self.crawler.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                SELECT url, title, content, category, source, relevance_score 
                FROM tax_content 
                WHERE relevance_score > 0.5 AND length(content) > 200
                ORDER BY relevance_score DESC
                LIMIT 30
            ''')
            
            crawled_data = cursor.fetchall()
        except sqlite3.OperationalError:
            logger.warning("No crawled tax data table found - skipping")
            conn.close()
            return
        
        conn.close()
        
        if not crawled_data:
            logger.info("No quality crawled tax data found")
            return
        
        # Categorize and add crawled tax data
        for url, title, content, category, source, relevance_score in crawled_data:
            if not content or len(content.strip()) < 100:
                continue
            
            clean_content = self.clean_text(content)
            if len(clean_content) < 50:
                continue
            
            metadata = {
                "url": str(url),
                "title": str(title or "Unknown"),
                "category": str(category),
                "source": str(source),
                "relevance_score": str(relevance_score),
                "crawled_date": datetime.now().isoformat()
            }
            
            item_id = hashlib.md5(url.encode()).hexdigest()
            
            # Route to appropriate collection based on category
            if category in ["tax_filing_guide", "official_tax_portal"]:
                collection = self.tax_filing_basics
                prefix = "crawled_basics_"
            elif category in ["tax_slabs", "tax_regimes"]:
                collection = self.tax_regimes
                prefix = "crawled_regime_"
            elif category == "itr_forms":
                collection = self.itr_forms
                prefix = "crawled_itr_"
            else:
                collection = self.tax_filing_basics
                prefix = "crawled_general_"
            
            try:
                collection.add(
                    documents=[clean_content[:2000]],
                    metadatas=[metadata],
                    ids=[f"{prefix}{item_id}"]
                )
                logger.info(f"Added crawled tax content: {title[:30]}")
            except Exception as e:
                logger.error(f"Error adding crawled content: {str(e)}")

    def clean_text(self, text: str) -> str:
        """Clean and preprocess tax-specific text"""
        if not text:
            return ""
        
        # Remove extra whitespace and newlines
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\n+', '\n', text)
        
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        
        # Keep financial and tax-specific symbols
        text = re.sub(r'[^\w\s\.\,\:\;\!\?\-\(\)\[\]\"\'₹\%\&]', '', text)
        
        # Remove very short sentences
        sentences = text.split('.')
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
        text = '. '.join(sentences)
        
        return text.strip()

def check_dependencies():
    """Check and report on required dependencies"""
    print("Checking dependencies for tax filing system...")
    
    dependencies_status = {
        "chromadb": True,  # Required
        "crawl4ai": HAS_CRAWL4AI,
        "requests": HAS_REQUESTS,
        "pandas": HAS_PANDAS
    }
    
    print("\nDependency Status:")
    for dep, status in dependencies_status.items():
        status_symbol = "✅" if status else "❌"
        print(f"  {status_symbol} {dep}")
    
    missing_deps = [dep for dep, status in dependencies_status.items() if not status]
    
    if missing_deps:
        print(f"\n⚠️  Missing optional dependencies: {', '.join(missing_deps)}")
        print("Install with: pip install " + " ".join(missing_deps))
        print("The system will work with reduced functionality using fallbacks.\n")
    else:
        print("\n✅ All dependencies available!\n")
    
    return len(missing_deps) == 0

async def main():
    """Main setup function for tax filing knowledge base"""
    print("=" * 65)
    print("INDIAN TAX FILING VOICE RAG AGENT - KNOWLEDGE BASE SETUP")
    print("=" * 65)
    
    # Check dependencies
    all_deps_available = check_dependencies()
    
    try:
        kb = TaxFilingKnowledgeBase()
        
        print("Setting up comprehensive Indian tax filing knowledge base...")
        print("This will include:")
        print("📋 Tax filing procedures and requirements")
        print("💰 Income categories and their taxation rules")
        print("⚖️  Old vs New tax regime comparison")
        print("📄 ITR forms and their applicability")
        print("💸 Deductions and exemptions available")
        print("🌐 Latest tax updates from official sources")
        print()
        
        print("🔄 Step 1/2: Adding curated tax filing knowledge...")
        await kb.populate_tax_knowledge_base()
        
        print("\n=" * 65)
        print("✅ TAX FILING KNOWLEDGE BASE SETUP COMPLETED!")
        print("=" * 65)
        print()
        print("Collections created:")
        print("✅ Tax Filing Basics (procedures, requirements, penalties)")
        print("✅ Income Categories (salary, property, business, capital gains)")  
        print("✅ Tax Regimes (old vs new regime comparison)")
        print("✅ ITR Forms (form selection and applicability)")
        print("✅ Deductions & Exemptions (80C, 80D, HRA, etc.)")
        print()
        
        # Show data sources integrated
        print("Data sources integrated:")
        print("✅ Comprehensive curated tax filing knowledge")
        print("✅ Income Tax Act provisions and sections")
        print("✅ FY 2023-24 / AY 2024-25 tax rules")
        
        if HAS_CRAWL4AI:
            print("✅ Live tax updates from Income Tax Department")
            print("✅ Latest tax guidance from ClearTax, Groww, etc.")
        else:
            print("⚠️  Web crawling not available (crawl4ai not installed)")
        
        print()
        print("Knowledge base statistics:")
        
        # Get collection counts
        try:
            basics_count = kb.tax_filing_basics.count()
            income_count = kb.income_categories.count()
            regime_count = kb.tax_regimes.count()
            itr_count = kb.itr_forms.count()
            deduction_count = kb.deductions_exemptions.count()
            
            print(f"✅ Tax Filing Basics: {basics_count} documents")
            print(f"✅ Income Categories: {income_count} documents")
            print(f"✅ Tax Regimes: {regime_count} documents")
            print(f"✅ ITR Forms: {itr_count} documents")
            print(f"✅ Deductions & Exemptions: {deduction_count} documents")
            print(f"📊 Total: {basics_count + income_count + regime_count + itr_count + deduction_count} documents")
        except Exception as e:
            print(f"⚠️ Error counting documents: {str(e)}")
        
        print()
        print("Tax filing areas covered:")
        print("• Individual tax return filing (ITR-1 to ITR-4)")
        print("• Income categorization and computation")
        print("• Tax regime selection (old vs new)")
        print("• Deductions optimization (80C, 80D, HRA)")
        print("• Capital gains taxation")
        print("• Business and profession income")
        print("• Property income taxation")
        print("• Advance tax and TDS handling")
        print("• Penalty and interest calculations")
        print("• E-filing and verification process")
        
        print()
        print("Next steps:")
        print("1. Update app.py to use tax-focused logic")
        print("2. Run: python tax_filing_app.py (start the agent)")
        print("3. For phone integration: python twilio_setup.py")
        print("4. Test interface: http://localhost:5000/test")
        print()
        
        if not all_deps_available:
            print("⚠️  Note: Some optional dependencies are missing.")
            print("   The system will work but with limited web crawling.")
            print()
        
        print("🎉 Tax Filing knowledge base is ready!")
        
    except Exception as e:
        logger.error(f"Tax setup failed: {str(e)}")
        print(f"❌ Setup failed: {str(e)}")
        print("\nTroubleshooting:")
        print("1. Ensure ChromaDB is properly installed: pip install chromadb")
        print("2. Check write permissions in current directory")
        print("3. Install missing dependencies: pip install -r requirements.txt")
        print("4. Check logs in tax_filing_agent.log for details")

if __name__ == "__main__":
    asyncio.run(main())
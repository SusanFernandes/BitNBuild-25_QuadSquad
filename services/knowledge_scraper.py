# services/knowledge_scraper.py
"""
Knowledge scraper service using Crawl4AI with local Ollama LLM for efficient large context processing
No more rate limits - uses local models with smart chunking
"""

import asyncio
from typing import List, Dict, Any, Optional
import re
from datetime import datetime, timedelta
import uuid
from urllib.parse import urljoin, urlparse
import json
import os
from dotenv import load_dotenv
import requests

load_dotenv()

try:
    from crawl4ai import (
        AsyncWebCrawler, 
        LLMConfig, 
        LLMExtractionStrategy,
        CrawlerRunConfig, 
        CacheMode,
        BrowserConfig
    )
except ImportError:
    print("Crawl4AI not installed. Install with: pip install crawl4ai")

from services.rag_service import RAGService

class LocalLLMKnowledgeScraper:
    def __init__(self):
        self.rag_service = None
        self.ollama_base_url = "http://localhost:11434"
        
        # Recommended models for efficient processing
        self.model_options = {
            "fast": "llama3.1:8b",          # 8B model - very fast, good for basic extraction
            "balanced": "gemma2:2b",      # 2B model - good balance of speed/quality
            "quality": "mistral-nemo:12b",   # 12B model - higher quality extraction
            "large_context": "codestral:22b" # 22B model - excellent for large contexts
        }
        
        # Current model to use
        self.current_model = self.model_options["balanced"]  # Default to balanced
        
        # Tax-related websites to scrape
        self.tax_sources = [
            {
                'url': 'https://www.incometax.gov.in/iec/foportal',
                'category': 'official',
                'priority': 1
            },
            {
                'url': 'https://cleartax.in/s/income-tax-slabs',
                'category': 'tax_slabs',
                'priority': 1
            },
            {
                'url': 'https://cleartax.in/s/section-80c-deductions',
                'category': 'deductions',
                'priority': 1
            },
            {
                'url': 'https://www.bankbazaar.com/tax/section-80d.html',
                'category': 'deductions',
                'priority': 2
            },
            {
                'url': 'https://www.paisabazaar.com/cibil/cibil-score/',
                'category': 'cibil',
                'priority': 1
            },
            {
                'url': 'https://www.cibil.com/credit-score-report',
                'category': 'cibil',
                'priority': 1
            },
            {
                'url': 'https://zerodha.com/varsity/chapter/deductions/',
                'category': 'education',
                'priority': 2
            },
        ]
        
        # Patterns to identify relevant content
        self.content_patterns = {
            'tax_slabs': [
                r'tax slab', r'income tax rates', r'tax brackets',
                r'old regime', r'new regime', r'tax calculation'
            ],
            'deductions': [
                r'section 80[A-Z]', r'deduction', r'exemption',
                r'tax saving', r'investment', r'80C', r'80D'
            ],
            'cibil': [
                r'cibil score', r'credit score', r'credit report',
                r'credit utilization', r'payment history'
            ],
            'general': [
                r'income tax', r'financial planning', r'personal finance'
            ]
        }
    
    async def initialize_ollama(self, model_preference: str = "balanced") -> bool:
        """Initialize Ollama and ensure model is available"""
        try:
            # Check if Ollama is running
            response = requests.get(f"{self.ollama_base_url}/api/tags")
            if response.status_code != 200:
                print("Ollama server not running. Please start with: ollama serve")
                return False
            
            available_models = response.json()
            model_names = [model['name'] for model in available_models.get('models', [])]
            
            # Set model based on preference
            preferred_model = self.model_options.get(model_preference, self.model_options["balanced"])
            
            # Check if preferred model is available, if not, try to pull it
            if preferred_model not in model_names:
                print(f"Model {preferred_model} not found. Available models: {model_names}")
                
                # Try to pull the model
                print(f"Attempting to pull {preferred_model}...")
                pull_response = requests.post(
                    f"{self.ollama_base_url}/api/pull",
                    json={"name": preferred_model}
                )
                
                if pull_response.status_code == 200:
                    print(f"Successfully pulled {preferred_model}")
                    self.current_model = preferred_model
                else:
                    # Fallback to any available model
                    if model_names:
                        self.current_model = model_names[0]
                        print(f"Using available model: {self.current_model}")
                    else:
                        print("No models available. Please install a model first.")
                        return False
            else:
                self.current_model = preferred_model
                print(f"Using model: {self.current_model}")
            
            return True
            
        except Exception as e:
            print(f"Failed to initialize Ollama: {e}")
            return False
    
    async def scrape_tax_knowledge(self, model_preference: str = "balanced"):
        """Scrape tax-related knowledge using local LLM"""
        # Initialize Ollama
        if not await self.initialize_ollama(model_preference):
            print("Failed to initialize Ollama. Falling back to raw content extraction.")
            return await self._scrape_without_llm()
        
        if not self.rag_service:
            self.rag_service = RAGService()
        
        all_documents = []
        
        for source in self.tax_sources:
            try:
                print(f"Scraping {source['url']}...")
                documents = await self._scrape_website_with_local_llm(source)
                all_documents.extend(documents)
                
                # No need for delays with local models!
                print(f"Extracted {len(documents)} documents from {source['url']}")
                
            except Exception as e:
                print(f"Error scraping {source['url']}: {e}")
                continue
        
        # Add scraped knowledge to RAG system
        if all_documents:
            await self.rag_service.add_knowledge(all_documents)
            print(f"Added {len(all_documents)} documents to knowledge base")
        
        return len(all_documents)
    
    async def _scrape_website_with_local_llm(self, source: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Scrape website using local LLM with intelligent chunking"""
        documents = []
        
        try:
            # Configure browser settings
            browser_config = BrowserConfig(
                headless=True,
                java_script_enabled=True
            )
            
            # First, get raw content without LLM
            crawl_config = CrawlerRunConfig(
                word_count_threshold=10,
                cache_mode=CacheMode.BYPASS,
                page_timeout=60000,
                delay_before_return_html=3.0
            )
            
            # Get raw content
            async with AsyncWebCrawler(config=browser_config) as crawler:
                result = await crawler.arun(url=source['url'], config=crawl_config)
            
            if result.success and result.markdown:
                content = result.markdown.raw_markdown
                
                if content and len(content.strip()) > 100:
                    # Intelligent chunking based on model context window
                    chunks = await self._smart_chunk_content(content, source['category'])
                    
                    for i, chunk in enumerate(chunks):
                        if await self._is_relevant_content(chunk, source['category']):
                            # Process with local LLM - no rate limits!
                            processed_content = await self._process_chunk_with_local_llm(
                                chunk, source['category']
                            )
                            
                            documents.append({
                                'title': f"{source['url']} - Part {i+1}",
                                'content': processed_content or chunk,
                                'source': source['url'],
                                'category': source['category'],
                                'scraped_at': datetime.now().isoformat(),
                                'priority': source['priority'],
                                'model_used': self.current_model,
                                'extraction_type': 'local_llm' if processed_content else 'raw'
                            })
            
        except Exception as e:
            print(f"Error processing {source['url']}: {e}")
        
        return documents
    
    async def _smart_chunk_content(self, content: str, category: str) -> List[str]:
        """Intelligent chunking based on model capabilities and content type"""
        # Different models have different context windows
        model_context_limits = {
            "llama3.2:3b": 8192,      # 8k context
            "llama3.1:8b": 16384,     # 16k context  
            "mistral-nemo:12b": 32768, # 32k context
            "codestral:22b": 65536     # 64k context
        }
        
        # Get context limit for current model (default to 8k)
        max_tokens = model_context_limits.get(self.current_model, 8192)
        
        # Conservative estimate: use 60% of context for input, rest for processing
        max_input_tokens = int(max_tokens * 0.6)
        max_chars = max_input_tokens * 4  # Rough token to char conversion
        
        # Smart splitting based on content structure
        chunks = []
        
        # First, try to split by major sections
        sections = re.split(r'\n#{1,3}\s+', content)  # Split on headers
        
        current_chunk = ""
        for section in sections:
            section = section.strip()
            if not section:
                continue
                
            # If section fits in current chunk, add it
            if len(current_chunk) + len(section) + 100 < max_chars:  # +100 buffer
                current_chunk += section + "\n\n"
            else:
                # Save current chunk if it has content
                if current_chunk.strip():
                    chunks.append(current_chunk.strip())
                
                # If single section is too large, split it further
                if len(section) > max_chars:
                    sub_chunks = await self._split_large_section(section, max_chars)
                    chunks.extend(sub_chunks)
                    current_chunk = ""
                else:
                    current_chunk = section + "\n\n"
        
        # Don't forget the last chunk
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        # Filter meaningful chunks
        meaningful_chunks = [
            chunk for chunk in chunks 
            if len(chunk.strip()) > 200 and await self._is_relevant_content(chunk, category)
        ]
        
        print(f"Split content into {len(meaningful_chunks)} intelligent chunks for model {self.current_model}")
        return meaningful_chunks
    
    async def _split_large_section(self, section: str, max_chars: int) -> List[str]:
        """Split large sections by paragraphs and sentences"""
        chunks = []
        paragraphs = section.split('\n\n')
        
        current_chunk = ""
        for para in paragraphs:
            if len(current_chunk) + len(para) + 2 < max_chars:
                current_chunk += para + "\n\n"
            else:
                if current_chunk.strip():
                    chunks.append(current_chunk.strip())
                
                # If single paragraph is too large, split by sentences
                if len(para) > max_chars:
                    sentences = re.split(r'[.!?]+\s+', para)
                    temp_chunk = ""
                    
                    for sentence in sentences:
                        if len(temp_chunk) + len(sentence) + 2 < max_chars:
                            temp_chunk += sentence + ". "
                        else:
                            if temp_chunk.strip():
                                chunks.append(temp_chunk.strip())
                            temp_chunk = sentence + ". "
                    
                    current_chunk = temp_chunk
                else:
                    current_chunk = para + "\n\n"
        
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        return chunks
    
    async def _process_chunk_with_local_llm(self, chunk: str, category: str) -> Optional[str]:
        """Process chunk with local Ollama LLM - no rate limits!"""
        try:
            # Create tailored prompt based on category
            category_prompts = {
                'tax_slabs': """Extract and summarize tax slab information. Focus on:
                - Specific tax rates and income brackets
                - Old vs new tax regime details
                - Applicable financial years
                - Key changes or updates""",
                
                'deductions': """Extract deduction information. Focus on:
                - Section numbers (80C, 80D, etc.)
                - Deduction limits and eligibility
                - Investment options and benefits
                - Required documents or conditions""",
                
                'cibil': """Extract CIBIL and credit score information. Focus on:
                - Score ranges and meanings
                - Factors affecting credit scores
                - Improvement strategies
                - Impact on loans and financial products""",
                
                'official': """Extract official tax information. Focus on:
                - Government policies and announcements
                - Official procedures and deadlines
                - Compliance requirements
                - Recent updates or changes""",
                
                'education': """Extract educational financial content. Focus on:
                - Learning concepts and explanations
                - Practical examples and calculations
                - Step-by-step guides
                - Best practices and tips"""
            }
            
            prompt = category_prompts.get(category, category_prompts['official'])
            
            # Call local Ollama API
            response = requests.post(
                f"{self.ollama_base_url}/api/generate",
                json={
                    "model": self.current_model,
                    "prompt": f"{prompt}\n\nContent:\n{chunk}\n\nExtracted Information:",
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "top_p": 0.9,
                        "num_predict": 512,  # Limit response length
                    }
                },
                timeout=120  # 2 minute timeout for processing
            )
            
            if response.status_code == 200:
                result = response.json()
                extracted_content = result.get('response', '').strip()
                
                if extracted_content and len(extracted_content) > 50:
                    return extracted_content
            else:
                print(f"Ollama API error: {response.status_code}")
                
        except Exception as e:
            print(f"Local LLM processing failed: {e}")
        
        return None
    
    async def _scrape_without_llm(self) -> int:
        """Fallback method without LLM processing"""
        if not self.rag_service:
            self.rag_service = RAGService()
        
        all_documents = []
        
        for source in self.tax_sources:
            try:
                print(f"Scraping (raw) {source['url']}...")
                
                browser_config = BrowserConfig(headless=True, java_script_enabled=True)
                crawl_config = CrawlerRunConfig(
                    cache_mode=CacheMode.BYPASS,
                    page_timeout=60000
                )
                
                async with AsyncWebCrawler(config=browser_config) as crawler:
                    result = await crawler.arun(url=source['url'], config=crawl_config)
                
                if result.success and result.markdown:
                    content = result.markdown.raw_markdown
                    chunks = await self._smart_chunk_content(content, source['category'])
                    
                    for i, chunk in enumerate(chunks):
                        if await self._is_relevant_content(chunk, source['category']):
                            all_documents.append({
                                'title': f"{source['url']} - Part {i+1}",
                                'content': chunk,
                                'source': source['url'],
                                'category': source['category'],
                                'scraped_at': datetime.now().isoformat(),
                                'priority': source['priority'],
                                'extraction_type': 'raw_only'
                            })
                            
            except Exception as e:
                print(f"Error scraping {source['url']}: {e}")
        
        if all_documents:
            await self.rag_service.add_knowledge(all_documents)
        
        return len(all_documents)
    
    async def _is_relevant_content(self, content: str, category: str) -> bool:
        """Check if content is relevant to tax/finance topics"""
        content_lower = content.lower()
        
        # Get patterns for the category
        patterns = self.content_patterns.get(category, self.content_patterns['general'])
        
        # Check if any pattern matches
        for pattern in patterns:
            if re.search(pattern, content_lower):
                return True
        
        # Additional checks for tax-related keywords
        tax_keywords = [
            'income tax', 'deduction', 'exemption', 'section 80',
            'tax slab', 'tax saving', 'cibil', 'credit score',
            'financial year', 'assessment year', 'itr'
        ]
        
        keyword_count = sum(1 for keyword in tax_keywords if keyword in content_lower)
        return keyword_count >= 2
    
    async def scrape_specific_topic(self, topic: str, urls: List[str] = None, model_preference: str = "balanced") -> int:
        """Scrape specific topic with local LLM"""
        if not await self.initialize_ollama(model_preference):
            print("Falling back to raw content extraction")
            return await self._scrape_topic_raw(topic, urls)
        
        if not urls:
            urls = await self._search_topic_urls(topic)
        
        documents = []
        
        for url in urls:
            try:
                print(f"Scraping topic '{topic}' from {url}...")
                
                browser_config = BrowserConfig(headless=True, java_script_enabled=True)
                crawl_config = CrawlerRunConfig(
                    cache_mode=CacheMode.BYPASS,
                    page_timeout=60000
                )
                
                async with AsyncWebCrawler(config=browser_config) as crawler:
                    result = await crawler.arun(url=url, config=crawl_config)
                
                if result.success and result.markdown:
                    content = result.markdown.raw_markdown
                    chunks = await self._smart_chunk_content(content, 'specific_topic')
                    
                    for i, chunk in enumerate(chunks):
                        if await self._is_relevant_content(chunk, 'specific_topic'):
                            processed_content = await self._process_topic_chunk_local(chunk, topic)
                            
                            documents.append({
                                'title': f"{topic} - {url} - Part {i+1}",
                                'content': processed_content or chunk,
                                'source': url,
                                'category': 'specific_topic',
                                'topic': topic,
                                'scraped_at': datetime.now().isoformat(),
                                'priority': 1,
                                'model_used': self.current_model
                            })
                
            except Exception as e:
                print(f"Error scraping {url} for topic {topic}: {e}")
        
        if documents:
            if not self.rag_service:
                self.rag_service = RAGService()
            await self.rag_service.add_knowledge(documents)
        
        return len(documents)
    
    async def _process_topic_chunk_local(self, chunk: str, topic: str) -> Optional[str]:
        """Process topic-specific chunk with local LLM"""
        try:
            prompt = f"""Extract detailed information about {topic} from the following content. 
            Focus on practical, actionable information including:
            - Specific numbers, rates, and limits
            - Step-by-step procedures
            - Requirements and eligibility criteria
            - Recent updates or changes
            - Benefits and implications
            
            Be comprehensive but concise.
            
            Content:
            {chunk}
            
            Extracted Information:"""
            
            response = requests.post(
                f"{self.ollama_base_url}/api/generate",
                json={
                    "model": self.current_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "num_predict": 800,
                    }
                },
                timeout=120
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get('response', '').strip()
                
        except Exception as e:
            print(f"Topic processing failed: {e}")
        
        return None
    
    async def _search_topic_urls(self, topic: str) -> List[str]:
        """Get URLs for specific topics"""
        topic_urls = {
            'tax_slabs': [
                'https://cleartax.in/s/income-tax-slabs',
                'https://www.bankbazaar.com/tax/income-tax-slab.html'
            ],
            'section_80c': [
                'https://cleartax.in/s/section-80c-deductions',
                'https://www.bankbazaar.com/tax/section-80c.html'
            ],
            'cibil_score': [
                'https://www.paisabazaar.com/cibil/cibil-score/',
                'https://www.cibil.com/credit-score-report'
            ],
            'home_loan': [
                'https://www.bankbazaar.com/home-loan/tax-benefits.html',
                'https://cleartax.in/s/home-loan-tax-benefits'
            ]
        }
        
        return topic_urls.get(topic.lower(), [])
    
    def get_available_models(self) -> Dict[str, Any]:
        """Get information about available models"""
        try:
            response = requests.get(f"{self.ollama_base_url}/api/tags")
            if response.status_code == 200:
                available = response.json().get('models', [])
                return {
                    'available_models': [model['name'] for model in available],
                    'recommended_models': self.model_options,
                    'current_model': self.current_model,
                    'ollama_status': 'running'
                }
        except:
            pass
        
        return {
            'available_models': [],
            'recommended_models': self.model_options,
            'current_model': None,
            'ollama_status': 'not_running'
        }
    
    def switch_model(self, model_preference: str) -> bool:
        """Switch to a different model"""
        if model_preference in self.model_options:
            self.current_model = self.model_options[model_preference]
            return True
        return False

# Setup instructions function
def print_setup_instructions():
    """Print setup instructions for Ollama"""
    print("""
    🚀 OLLAMA SETUP INSTRUCTIONS:
    
    1. Install Ollama:
       - Visit: https://ollama.ai/
       - Download and install for your OS
    
    2. Start Ollama server:
       ollama serve
    
    3. Pull recommended models:
       ollama pull llama3.2:3b        # Fast model (2GB)
       ollama pull llama3.1:8b        # Balanced model (4.7GB) 
       ollama pull mistral-nemo:12b   # Quality model (7GB)
       ollama pull codestral:22b      # Large context model (13GB)
    
    4. Start with the balanced model:
       scraper = LocalLLMKnowledgeScraper()
       await scraper.scrape_tax_knowledge("balanced")
    
    ✅ Benefits:
    - No rate limits
    - No API costs
    - Works offline
    - Private and secure
    - Handle large contexts efficiently
    """)

# Example usage
async def test_local_scraper():
    """Test the local LLM scraper"""
    scraper = LocalLLMKnowledgeScraper()
    
    # Check available models
    models_info = scraper.get_available_models()
    print("Available models:", models_info)
    
    if models_info['ollama_status'] != 'running':
        print_setup_instructions()
        return
    
    # Test scraping
    try:
        result_count = await scraper.scrape_tax_knowledge("balanced")
        print(f"Successfully scraped {result_count} documents using local LLM!")
    except Exception as e:
        print(f"Error: {e}")
        print("Falling back to raw content extraction...")
        result_count = await scraper._scrape_without_llm()
        print(f"Extracted {result_count} documents without LLM processing")

if __name__ == "__main__":
    asyncio.run(test_local_scraper())
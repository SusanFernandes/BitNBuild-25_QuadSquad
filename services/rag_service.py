# services/rag_service.py
"""
RAG (Retrieval Augmented Generation) service using ChromaDB and Groq
"""

import os
from dotenv import load_dotenv
import asyncio
from typing import List, Dict, Any, Optional
import json
from datetime import datetime
import uuid

try:
    import chromadb
    from chromadb.config import Settings
    from chromadb.utils import embedding_functions
except ImportError:
    print("ChromaDB not installed. Install with: pip install chromadb")

try:
    from groq import AsyncGroq
except ImportError:
    print("Groq not installed. Install with: pip install groq")

from sqlalchemy.orm import Session
from database.models import User, Transaction, TaxData, CIBILData, KnowledgeBase

class RAGService:
    def __init__(self):
        load_dotenv()
        self.groq_client = None
        self.chroma_client = None
        self.collection = None
        self.embedding_function = None
        self.initialize_services()
    
    def initialize_services(self):
        """Initialize Groq and ChromaDB clients"""
        try:
            # Initialize Groq client
            groq_api_key = os.getenv('GROQ_API_KEY')
            if groq_api_key:
                self.groq_client = AsyncGroq(api_key=groq_api_key)
                print("Groq client initialized successfully")
            else:
                print("GROQ_API_KEY not found in environment variables")
            
            # Initialize ChromaDB
            self.chroma_client = chromadb.PersistentClient(path="./chroma_db")
            
            # Create embedding function
            self.embedding_function = embedding_functions.DefaultEmbeddingFunction()
            
            # Get or create collection
            self.collection = self.chroma_client.get_or_create_collection(
                name="taxwise_knowledge",
                embedding_function=self.embedding_function
            )
            
            print("ChromaDB initialized successfully")
            
        except Exception as e:
            print(f"Error initializing RAG services: {e}")
    
    async def initialize(self):
        """Async initialization if needed"""
        pass
    
    async def add_knowledge(self, documents: List[Dict[str, Any]]):
        """Add knowledge documents to ChromaDB"""
        try:
            ids = []
            texts = []
            metadatas = []
            
            for doc in documents:
                doc_id = str(uuid.uuid4())
                ids.append(doc_id)
                texts.append(doc['content'])
                metadatas.append({
                    'title': doc.get('title', ''),
                    'source': doc.get('source', ''),
                    'category': doc.get('category', 'general'),
                    'timestamp': datetime.now().isoformat()
                })
            
            self.collection.add(
                ids=ids,
                documents=texts,
                metadatas=metadatas
            )
            
            print(f"Added {len(documents)} documents to knowledge base")
            
        except Exception as e:
            print(f"Error adding knowledge to ChromaDB: {e}")
    
    async def query(self, user_id: str, query: str) -> str:
        """Query the RAG system with user context"""
        try:
            # Get relevant context from knowledge base
            search_results = self.collection.query(
                query_texts=[query],
                n_results=5
            )
            
            # Get user-specific context
            user_context = await self._get_user_context(user_id)
            
            # Build prompt with context
            prompt = await self._build_prompt(query, search_results, user_context)
            
            # Generate response using Groq
            response = await self._generate_response(prompt)
            
            return response
            
        except Exception as e:
            return f"I apologize, but I encountered an error processing your query: {str(e)}"
    
    async def _get_user_context(self, user_id: str) -> Dict[str, Any]:
        """Get user-specific context from database"""
        # This would typically use dependency injection, but for simplicity:
        from database.models import SessionLocal
        
        context = {
            'tax_data': None,
            'cibil_data': None,
            'recent_transactions': [],
            'user_profile': None
        }
        
        try:
            db = SessionLocal()
            
            # Get latest tax data
            tax_data = db.query(TaxData).filter(TaxData.user_id == user_id).order_by(TaxData.created_at.desc()).first()
            if tax_data:
                context['tax_data'] = {
                    'total_income': tax_data.total_income,
                    'taxable_income': tax_data.taxable_income,
                    'old_regime_tax': tax_data.old_regime_tax,
                    'new_regime_tax': tax_data.new_regime_tax,
                    'deductions': json.loads(tax_data.deductions) if tax_data.deductions else {}
                }
            
            # Get latest CIBIL data
            cibil_data = db.query(CIBILData).filter(CIBILData.user_id == user_id).order_by(CIBILData.created_at.desc()).first()
            if cibil_data:
                context['cibil_data'] = {
                    'current_score': cibil_data.current_score,
                    'credit_utilization': cibil_data.credit_utilization,
                    'payment_history_score': cibil_data.payment_history_score
                }
            
            # Get recent transactions (last 10)
            transactions = db.query(Transaction).filter(Transaction.user_id == user_id).order_by(Transaction.date.desc()).limit(10).all()
            context['recent_transactions'] = [
                {
                    'amount': t.amount,
                    'category': t.category,
                    'description': t.description,
                    'date': t.date.isoformat() if t.date else None
                }
                for t in transactions
            ]
            
            db.close()
            
        except Exception as e:
            print(f"Error getting user context: {e}")
        
        return context
    
    async def _build_prompt(self, query: str, search_results: Dict, user_context: Dict) -> str:
        """Build comprehensive prompt with context"""
        
        # Extract relevant documents
        relevant_docs = ""
        if search_results and 'documents' in search_results:
            for i, doc in enumerate(search_results['documents'][0]):
                metadata = search_results['metadatas'][0][i] if search_results.get('metadatas') else {}
                relevant_docs += f"\n\nDocument {i+1} ({metadata.get('category', 'general')}):\n{doc}"
        
        # Build user context section
        context_info = ""
        
        if user_context.get('tax_data'):
            tax_data = user_context['tax_data']
            context_info += f"""
User's Tax Information:
- Total Income: ₹{tax_data.get('total_income', 0):,.2f}
- Taxable Income: ₹{tax_data.get('taxable_income', 0):,.2f}
- Old Regime Tax: ₹{tax_data.get('old_regime_tax', 0):,.2f}
- New Regime Tax: ₹{tax_data.get('new_regime_tax', 0):,.2f}
- Current Deductions: {tax_data.get('deductions', {})}
"""
        
        if user_context.get('cibil_data'):
            cibil_data = user_context['cibil_data']
            context_info += f"""
User's Credit Information:
- CIBIL Score: {cibil_data.get('current_score', 'N/A')}
- Credit Utilization: {cibil_data.get('credit_utilization', 'N/A')}%
- Payment History Score: {cibil_data.get('payment_history_score', 'N/A')}
"""
        
        if user_context.get('recent_transactions'):
            context_info += "\nRecent Transactions:\n"
            for txn in user_context['recent_transactions'][:5]:  # Show only top 5
                context_info += f"- ₹{txn['amount']:,.2f} - {txn['category']} - {txn['description'][:50]}...\n"
        
        prompt = f"""
You are TaxWise AI, an expert financial advisor specializing in Indian tax laws and personal finance. 
You have access to comprehensive knowledge about Indian tax regulations, CIBIL scores, and financial planning.

User Query: {query}

User Context:
{context_info}

Relevant Knowledge:
{relevant_docs}

Instructions:
1. Provide accurate, personalized advice based on the user's specific financial situation
2. Reference current Indian tax laws and regulations
3. Be specific with numbers and calculations where applicable
4. If recommending investments or actions, explain the tax benefits clearly
5. For CIBIL-related queries, provide actionable improvement strategies
6. Always mention that this is advisory information and professional consultation is recommended for complex matters
7. Keep responses concise but comprehensive
8. Use Indian Rupee (₹) for all monetary values

Response:
"""
        
        return prompt
    
    async def _generate_response(self, prompt: str) -> str:
        """Generate response using Groq LLM"""
        if not self.groq_client:
            return "I'm sorry, but I'm unable to process your query at the moment. Please try again later."
        
        try:
            # Use Groq's chat completion
            completion = await self.groq_client.chat.completions.create(
                messages=[
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.1-8b-instant",  # or another available model
                max_tokens=1000,
                temperature=0.3
            )
            
            return completion.choices[0].message.content
            
        except Exception as e:
            print(f"Error generating response with Groq: {e}")
            return "I apologize, but I encountered an error while generating a response. Please try rephrasing your question."
    
    async def search_knowledge(self, query: str, category: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Search knowledge base directly"""
        try:
            where_clause = {}
            if category:
                where_clause["category"] = category
            
            results = self.collection.query(
                query_texts=[query],
                n_results=limit,
                where=where_clause if where_clause else None
            )
            
            formatted_results = []
            if results and 'documents' in results:
                for i, doc in enumerate(results['documents'][0]):
                    metadata = results['metadatas'][0][i] if results.get('metadatas') else {}
                    formatted_results.append({
                        'content': doc,
                        'title': metadata.get('title', ''),
                        'source': metadata.get('source', ''),
                        'category': metadata.get('category', 'general'),
                        'score': results['distances'][0][i] if results.get('distances') else 0
                    })
            
            return formatted_results
            
        except Exception as e:
            print(f"Error searching knowledge base: {e}")
            return []
    
    async def add_user_interaction(self, user_id: str, query: str, response: str):
        """Store user interactions for learning"""
        try:
            # Add interaction to knowledge base for future reference
            interaction_doc = {
                'content': f"Query: {query}\nResponse: {response}",
                'title': f"User Interaction - {datetime.now().strftime('%Y-%m-%d')}",
                'source': 'user_interaction',
                'category': 'user_queries'
            }
            
            await self.add_knowledge([interaction_doc])
            
        except Exception as e:
            print(f"Error storing user interaction: {e}")
    
    def get_knowledge_stats(self) -> Dict[str, Any]:
        """Get statistics about the knowledge base"""
        try:
            count = self.collection.count()
            
            return {
                'total_documents': count,
                'categories': self._get_category_counts(),
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error getting knowledge stats: {e}")
            return {'total_documents': 0, 'categories': {}, 'last_updated': None}
    
    def _get_category_counts(self) -> Dict[str, int]:
        """Get count of documents by category"""
        try:
            # This is a simplified version - ChromaDB doesn't have built-in aggregation
            # In production, you might want to maintain category counts separately
            all_docs = self.collection.get()
            categories = {}
            
            if all_docs and 'metadatas' in all_docs:
                for metadata in all_docs['metadatas']:
                    category = metadata.get('category', 'general')
                    categories[category] = categories.get(category, 0) + 1
            
            return categories
            
        except Exception as e:
            print(f"Error getting category counts: {e}")
            return {}
    
    async def update_knowledge(self, doc_id: str, content: str, metadata: Dict[str, Any]):
        """Update existing knowledge document"""
        try:
            self.collection.update(
                ids=[doc_id],
                documents=[content],
                metadatas=[metadata]
            )
            
            print(f"Updated document {doc_id}")
            
        except Exception as e:
            print(f"Error updating knowledge: {e}")
    
    async def delete_knowledge(self, doc_id: str):
        """Delete knowledge document"""
        try:
            self.collection.delete(ids=[doc_id])
            print(f"Deleted document {doc_id}")
            
        except Exception as e:
            print(f"Error deleting knowledge: {e}")
    
    async def get_personalized_insights(self, user_id: str) -> List[str]:
        """Generate personalized financial insights"""
        user_context = await self._get_user_context(user_id)
        insights = []
        
        # Tax-based insights
        if user_context.get('tax_data'):
            tax_data = user_context['tax_data']
            
            if tax_data['old_regime_tax'] < tax_data['new_regime_tax']:
                savings = tax_data['new_regime_tax'] - tax_data['old_regime_tax']
                insights.append(f"You can save ₹{savings:,.2f} by using the Old Tax Regime instead of the New Regime.")
            
            # Check for unused deduction limits
            deductions = tax_data.get('deductions', {})
            if deductions.get('80C', 0) < 150000:
                remaining = 150000 - deductions.get('80C', 0)
                insights.append(f"You can invest ₹{remaining:,.2f} more in 80C instruments to maximize tax savings.")
        
        # CIBIL-based insights
        if user_context.get('cibil_data'):
            cibil_data = user_context['cibil_data']
            
            if cibil_data.get('credit_utilization', 0) > 30:
                insights.append("Your credit utilization is high. Reducing it below 30% can improve your CIBIL score significantly.")
            
            if cibil_data.get('current_score', 0) < 750:
                insights.append("Your CIBIL score has room for improvement. Focus on timely payments and low credit utilization.")
        
        return insights
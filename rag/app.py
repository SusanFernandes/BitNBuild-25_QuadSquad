# Tax Filing Voice RAG Agent - Main Application
# tax_filing_app.py
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, Response, jsonify, redirect
import os
import json
import chromadb
import requests
import logging
import asyncio
import aiohttp
from datetime import datetime, timedelta
from twilio.twiml.voice_response import VoiceResponse, Gather
from chromadb.utils import embedding_functions
from chromadb import PersistentClient
import time
import google.generativeai as genai
from groq import Groq
from typing import Dict, List, Any, Optional
import pandas as pd
from loguru import logger
import sqlite3
import re
from textblob import TextBlob
import threading

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = Flask(__name__)

@app.before_request
def before_request():
    """Force HTTPS for ngrok"""
    if 'ngrok' in request.host and request.headers.get('X-Forwarded-Proto') == 'http':
        url = request.url.replace('http://', 'https://', 1)
        return redirect(url, code=301)

# Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL = "llama-3.1-8b-instant"
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")

# Initialize AI clients
groq_client = None
gemini_model = None

if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
        logger.info("Groq client initialized as primary")
    except Exception as e:
        logger.error(f"Failed to initialize Groq: {str(e)}")

if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel(
            'gemini-1.5-flash-latest',
            generation_config={
                'temperature': 0.1,
                'top_p': 0.6,
                'max_output_tokens': 250
            }
        )
        logger.info("Gemini AI initialized as fallback")
    except Exception as e:
        logger.error(f"Failed to initialize Gemini: {str(e)}")

# Initialize ChromaDB with tax-focused collections
try:
    client = PersistentClient(path="./chroma_tax_filing_db")
    embedding_function = embedding_functions.DefaultEmbeddingFunction()
    
    # Get tax-specific collections
    collections = {}
    collection_names = [
        "tax_filing_basics", 
        "income_categories", 
        "tax_regimes", 
        "itr_forms", 
        "deductions_exemptions"
    ]
    
    for name in collection_names:
        try:
            collections[name] = client.get_collection(
                name=name, 
                embedding_function=embedding_function
            )
            logger.info(f"Connected to {name} collection")
        except Exception as e:
            logger.warning(f"Collection {name} not found: {str(e)}")
            collections[name] = None
    
    logger.info("Connected to tax filing ChromaDB collections")
    
except Exception as e:
    logger.error(f"ChromaDB connection failed: {str(e)}")
    logger.error("Please run tax_filing_knowledge_setup.py first")
    collections = {}

# Session storage for tax filing context
sessions = {}

def extract_number_from_speech(speech: str) -> Optional[float]:
    """Extract the first number from speech input"""
    # Handle spoken numbers like "ten lakhs", "five crores", etc.
    speech_lower = speech.lower()
    
    # Handle Indian number formats
    lakh_match = re.search(r'(\d+(?:\.\d+)?)\s*lakh', speech_lower)
    if lakh_match:
        return float(lakh_match.group(1)) * 100000
    
    crore_match = re.search(r'(\d+(?:\.\d+)?)\s*crore', speech_lower)
    if crore_match:
        return float(crore_match.group(1)) * 10000000
    
    # Handle regular numbers
    match = re.search(r'\b(\d+(?:\.\d+)?)\b', speech, re.IGNORECASE)
    return float(match.group(1)) if match else None

def extract_income_sources_from_speech(speech: str) -> List[str]:
    """Extract income sources mentioned in speech"""
    speech_lower = speech.lower()
    income_sources = []
    
    income_keywords = {
        "salary": ["salary", "job", "employed", "employment", "wage"],
        "business": ["business", "self-employed", "proprietor", "shop", "trading"],
        "profession": ["profession", "professional", "doctor", "lawyer", "consultant", "practice"],
        "house_property": ["rental", "rent", "property", "house property", "real estate"],
        "capital_gains": ["capital gains", "shares", "stocks", "mutual fund", "property sale"],
        "other_sources": ["interest", "dividend", "fd", "fixed deposit", "savings"]
    }
    
    for source_type, keywords in income_keywords.items():
        if any(keyword in speech_lower for keyword in keywords):
            income_sources.append(source_type)
    
    return income_sources if income_sources else ["unknown"]

def extract_age_from_speech(speech: str) -> Optional[int]:
    """Extract age from speech"""
    match = re.search(r'\b(\d{1,2})\b', speech)
    if match:
        age = int(match.group(1))
        return age if 18 <= age <= 99 else None
    return None

def extract_yes_no_from_speech(speech: str) -> Optional[bool]:
    """Extract yes/no response from speech"""
    speech_lower = speech.lower().strip()
    if any(word in speech_lower for word in ["yes", "yeah", "yep", "sure", "correct", "right"]):
        return True
    elif any(word in speech_lower for word in ["no", "nope", "not", "wrong", "incorrect"]):
        return False
    return None

class TaxFilingAdvisor:
    def __init__(self):
        self.gemini_requests_count = 0
        self.max_gemini_requests = 1000
        self.rate_limit_reset = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        
    def reset_daily_limits(self):
        """Reset daily API limits"""
        if datetime.now() >= self.rate_limit_reset:
            self.gemini_requests_count = 0
            self.rate_limit_reset = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
            logger.info("Daily API limits reset")
    
    def get_user_tax_profile(self, session_data: Dict) -> Dict:
        """Extract user tax profile from conversation"""
        profile = {
            "age": session_data.get("age", "unknown"),
            "total_income": session_data.get("total_income", "unknown"),
            "income_sources": session_data.get("income_sources", ["unknown"]),
            "salary_income": session_data.get("salary_income", "unknown"),
            "business_income": session_data.get("business_income", "unknown"),
            "house_property": session_data.get("house_property", "unknown"),
            "capital_gains": session_data.get("capital_gains", "unknown"),
            "inherited_property": session_data.get("inherited_property", "unknown"),
            "tax_regime_preference": session_data.get("tax_regime_preference", "unknown"),
            "previous_itr_filed": session_data.get("previous_itr_filed", "unknown"),
            "current_deductions": session_data.get("current_deductions", "unknown"),
            "pan_card": session_data.get("pan_card", "unknown")
        }
        return profile
    
    def determine_tax_query_category(self, query: str) -> str:
        """Categorize tax-related queries"""
        query_lower = query.lower()
        
        # Tax filing basics
        basic_keywords = [
            "how to file", "tax filing", "itr filing", "tax return", "file taxes",
            "due date", "penalty", "documents required", "verification", "e-filing"
        ]
        
        # Income categories
        income_keywords = [
            "salary income", "business income", "house property", "rental income",
            "capital gains", "other sources", "dividend", "interest income"
        ]
        
        # Tax regimes
        regime_keywords = [
            "old regime", "new regime", "tax regime", "which regime", "regime comparison",
            "tax rates", "tax slabs"
        ]
        
        # ITR forms
        form_keywords = [
            "itr form", "itr-1", "itr-2", "itr-3", "itr-4", "which form",
            "form selection", "sahaj", "sugam"
        ]
        
        # Deductions and exemptions
        deduction_keywords = [
            "deduction", "80c", "80d", "exemption", "hra", "standard deduction",
            "tax saving", "investment", "ppf", "elss", "home loan"
        ]
        
        if any(keyword in query_lower for keyword in basic_keywords):
            return "tax_filing_basics"
        elif any(keyword in query_lower for keyword in income_keywords):
            return "income_categories"
        elif any(keyword in query_lower for keyword in regime_keywords):
            return "tax_regimes"
        elif any(keyword in query_lower for keyword in form_keywords):
            return "itr_forms"
        elif any(keyword in query_lower for keyword in deduction_keywords):
            return "deductions_exemptions"
        else:
            return "tax_filing_basics"
    
    def query_tax_collection(self, query: str, category: str) -> List[Dict]:
        """Query specific tax collection with relevance filtering"""
        if collections.get(category):
            try:
                results = collections[category].query(
                    query_texts=[query],
                    n_results=5,
                    include=["documents", "metadatas", "distances"]
                )
                
                # Filter highly relevant results
                filtered_results = [
                    {"content": doc, "metadata": meta}
                    for doc, meta, dist in zip(results["documents"][0], results["metadatas"][0], results["distances"][0])
                    if dist < 0.6
                ]
                
                return filtered_results if filtered_results else [{"content": "No specific information found for your query.", "metadata": {}}]
            except Exception as e:
                logger.error(f"Tax collection query failed for {category}: {str(e)}")
                return [{"content": "Unable to retrieve tax information at the moment.", "metadata": {}}]
        return [{"content": "Tax information not available.", "metadata": {}}]
    
    async def get_ai_response(self, prompt: str) -> Optional[str]:
        """Get AI response for tax queries"""
        self.reset_daily_limits()
        
        # Primary: Groq
        if groq_client:
            try:
                response = groq_client.chat.completions.create(
                    messages=[{"role": "user", "content": prompt}],
                    model=GROQ_MODEL,
                    temperature=0.1,
                    max_tokens=250,
                    top_p=0.6
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                logger.warning(f"Groq failed: {str(e)} - falling back to Gemini")
        
        # Fallback: Gemini
        if gemini_model and self.gemini_requests_count < self.max_gemini_requests:
            try:
                self.gemini_requests_count += 1
                response = await gemini_model.generate_content_async(prompt)
                return response.text.strip()
            except Exception as e:
                logger.error(f"Gemini failed: {str(e)}")
        
        # Ultimate fallback
        return self.get_tax_rule_based_response(prompt)
    
    def get_tax_rule_based_response(self, query: str) -> str:
        """Tax-specific rule-based fallback responses"""
        query_lower = query.lower()
        
        if "file tax" in query_lower or "itr" in query_lower:
            return "For tax filing, you need Form 16, bank statements, and investment proofs. ITR-1 is for salary income up to ₹50 lakh. Due date is July 31st for individuals. What's your income source?"
        elif "regime" in query_lower:
            return "New tax regime has lower rates but fewer deductions. Old regime allows 80C, HRA, home loan benefits. Choose based on your total deductions. What deductions do you currently have?"
        elif "deduction" in query_lower or "80c" in query_lower:
            return "Section 80C allows ₹1.5 lakh deduction via ELSS, PPF, life insurance, home loan principal. Section 80D for health insurance up to ₹25,000. What investments do you have?"
        elif "penalty" in query_lower:
            return "Late filing penalty is ₹1,000-10,000 based on income. Interest charged at 1% per month on unpaid taxes. File before July 31st to avoid penalty."
        else:
            return "I can help with tax filing, ITR forms, regime selection, and deductions. Please specify your tax-related question."
    
    def suggest_itr_form(self, profile: Dict) -> str:
        """Suggest appropriate ITR form based on user profile"""
        income_sources = profile.get("income_sources", [])
        total_income = profile.get("total_income", "unknown")
        
        # Try to get numeric income
        try:
            income_amount = float(total_income) if total_income != "unknown" else 0
        except:
            income_amount = 0
        
        # ITR-1 eligibility
        if (len(income_sources) == 1 and 
            "salary" in income_sources and 
            income_amount <= 5000000 and  # 50 lakh
            profile.get("house_property", "no") == "one" and
            profile.get("capital_gains", "no") == "no"):
            return "ITR-1 (Sahaj) - suitable for your salary income"
        
        # ITR-4 for presumptive business
        if "business" in income_sources and income_amount <= 20000000:  # 2 crore
            return "ITR-4 (Sugam) - for presumptive business income"
        
        # ITR-3 for business/profession
        if "business" in income_sources or "profession" in income_sources:
            return "ITR-3 - required for business/professional income"
        
        # ITR-2 for complex cases
        if (len(income_sources) > 1 or 
            "capital_gains" in income_sources or 
            profile.get("inherited_property", "no") == "yes"):
            return "ITR-2 - for multiple income sources or capital gains"
        
        return "ITR-2 - recommended for your income profile"
    
    async def generate_tax_response(self, query: str, session_id: str) -> tuple[str, Optional[str]]:
        """Generate tax filing advice with context"""
        session = sessions.get(session_id, {})
        category = self.determine_tax_query_category(query)
        rag_results = self.query_tax_collection(query, category)
        
        context = "\n".join([result["content"] for result in rag_results]) if rag_results else "No specific information found."
        profile = self.get_user_tax_profile(session)
        
        # Create tax-focused prompt
        prompt = f"""
        You are an expert Indian Tax Consultant specializing in income tax filing. Provide accurate, practical advice based on Indian tax laws and the context provided. Keep responses under 80 words for voice delivery, using clear, professional language.

        User Tax Profile: Age {profile['age']}, Total Income ₹{profile['total_income']}, 
        Income Sources: {', '.join(profile['income_sources'])}, 
        Tax Regime: {profile['tax_regime_preference']}, 
        Previous ITR Filed: {profile['previous_itr_filed']}

        Tax Knowledge Context: {context}
        
        Current Query: {query}
        
        Provide specific, actionable tax advice in a conversational tone suitable for voice.
        """
        
        response = await self.get_ai_response(prompt)
        
        # Determine appropriate follow-up questions
        follow_up = None
        follow_up_type = None
        
        if "file tax" in query.lower() or "itr" in query.lower():
            if profile['total_income'] == "unknown":
                follow_up = "What's your approximate annual income? You can say like 'five lakhs' or 'ten lakhs'."
                follow_up_type = "total_income"
            elif profile['income_sources'] == ["unknown"]:
                follow_up = "What are your sources of income? Salary, business, rental, or others?"
                follow_up_type = "income_sources"
            elif profile['previous_itr_filed'] == "unknown":
                follow_up = "Have you filed ITR in previous years?"
                follow_up_type = "previous_itr_filed"
        elif "regime" in query.lower() and profile['current_deductions'] == "unknown":
            follow_up = "Do you have investments like PPF, ELSS, or home loan for deductions?"
            follow_up_type = "current_deductions"
        
        # Update session
        session["last_query"] = query
        session["last_response"] = response
        if follow_up:
            session["pending_follow_up"] = follow_up
            session["pending_follow_up_type"] = follow_up_type
        sessions[session_id] = session
        
        return response, follow_up

advisor = TaxFilingAdvisor()

@app.route("/voice", methods=["POST"])
def voice():
    """Handle incoming voice calls for tax filing assistance"""
    session_id = request.form.get("CallSid")
    sessions[session_id] = {}
    
    response = VoiceResponse()
    response.say(
        "Hello, I'm your Tax Filing Assistant for India. I can help you with ITR filing, tax regime selection, deductions, and income tax queries. How can I assist you with your tax filing today?", 
        voice="Polly.Aditi", 
        language="en-IN"
    )
    gather = Gather(input="speech", action="/process_tax_speech", method="POST", speech_timeout="auto", language="en-IN", timeout=60)
    response.append(gather)
    return Response(str(response), mimetype="text/xml")

@app.route("/process_tax_speech", methods=["POST"])
def process_tax_speech():
    """Process user speech for tax queries"""
    speech = request.form.get("SpeechResult", "").strip()
    session_id = request.form.get("CallSid")
    session = sessions.get(session_id, {})
    
    response = VoiceResponse()
    
    if not speech:
        response.say("I didn't catch that. Please try again with your tax question.", voice="Polly.Aditi", language="en-IN")
        gather = Gather(input="speech", action="/process_tax_speech", method="POST", speech_timeout="auto", language="en-IN", timeout=60)
        response.append(gather)
        return Response(str(response), mimetype="text/xml")
    
    if any(word in speech.lower() for word in ["goodbye", "end call", "thank you", "bye"]):
        response.say("Thank you for using our tax filing service. For complex cases, consult a qualified CA. Goodbye!", voice="Polly.Aditi", language="en-IN")
        response.hangup()
        return Response(str(response), mimetype="text/xml")
    
    # Handle pending follow-ups
    pending_follow_up = session.get("pending_follow_up")
    pending_follow_up_type = session.get("pending_follow_up_type")
    
    if pending_follow_up:
        if pending_follow_up_type == "total_income":
            income_amount = extract_number_from_speech(speech)
            if income_amount and income_amount > 0:
                session["total_income"] = str(int(income_amount))
                del session["pending_follow_up"]
                del session["pending_follow_up_type"]
                sessions[session_id] = session
                
                itr_suggestion = advisor.suggest_itr_form(advisor.get_user_tax_profile(session))
                response.say(f"Noted, income ₹{int(income_amount):,}. Based on this, you should use {itr_suggestion}.", voice="Polly.Aditi", language="en-IN")
                
                # Ask for income sources next
                session["pending_follow_up"] = "What are your income sources? Salary, business, property rental, or others?"
                session["pending_follow_up_type"] = "income_sources"
                gather = Gather(input="speech", action="/process_tax_speech", method="POST", speech_timeout="auto", language="en-IN", timeout=60)
                gather.say(session["pending_follow_up"], voice="Polly.Aditi", language="en-IN")
                response.append(gather)
                sessions[session_id] = session
                return Response(str(response), mimetype="text/xml")
            else:
                response.say("Please specify your income amount, like 'five lakhs' or 'ten lakhs'.", voice="Polly.Aditi", language="en-IN")
                gather = Gather(input="speech", action="/process_tax_speech", method="POST", speech_timeout="auto", language="en-IN", timeout=60)
                response.append(gather)
                sessions[session_id] = session
                return Response(str(response), mimetype="text/xml")
        
        elif pending_follow_up_type == "income_sources":
            income_sources = extract_income_sources_from_speech(speech)
            if income_sources != ["unknown"]:
                session["income_sources"] = income_sources
                del session["pending_follow_up"]
                del session["pending_follow_up_type"]
                sessions[session_id] = session
                
                sources_text = ", ".join(income_sources)
                response.say(f"Understood, your income sources are {sources_text}.", voice="Polly.Aditi", language="en-IN")
                
                # Suggest ITR form based on updated profile
                itr_suggestion = advisor.suggest_itr_form(advisor.get_user_tax_profile(session))
                response.say(f"For your profile, I recommend {itr_suggestion}. Need help with anything specific?", voice="Polly.Aditi", language="en-IN")
                
                gather = Gather(input="speech", action="/process_tax_speech", method="POST", speech_timeout="auto", language="en-IN", timeout=60)
                response.append(gather)
                sessions[session_id] = session
                return Response(str(response), mimetype="text/xml")
            else:
                response.say("Please mention your income sources like salary, business, rental property, or others.", voice="Polly.Aditi", language="en-IN")
                gather = Gather(input="speech", action="/process_tax_speech", method="POST", speech_timeout="auto", language="en-IN", timeout=60)
                response.append(gather)
                sessions[session_id] = session
                return Response(str(response), mimetype="text/xml")
        
        elif pending_follow_up_type == "previous_itr_filed":
            itr_response = extract_yes_no_from_speech(speech)
            if itr_response is not None:
                session["previous_itr_filed"] = "yes" if itr_response else "no"
                del session["pending_follow_up"]
                del session["pending_follow_up_type"]
                sessions[session_id] = session
                
                if itr_response:
                    response.say("Good, since you've filed before, the process will be familiar.", voice="Polly.Aditi", language="en-IN")
                else:
                    response.say("No problem, I'll guide you through first-time filing.", voice="Polly.Aditi", language="en-IN")
                
                # Continue with tax advice
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                ai_response, new_follow_up = loop.run_until_complete(
                    advisor.generate_tax_response("help with tax filing process", session_id)
                )
                response.say(ai_response, voice="Polly.Aditi", language="en-IN")
                
                if new_follow_up:
                    session["pending_follow_up"] = new_follow_up
                    gather = Gather(input="speech", action="/process_tax_speech", method="POST", speech_timeout="auto", language="en-IN", timeout=60)
                    gather.say(new_follow_up, voice="Polly.Aditi", language="en-IN")
                    response.append(gather)
                else:
                    gather = Gather(input="speech", action="/process_tax_speech", method="POST", speech_timeout="auto", language="en-IN", timeout=60)
                    response.append(gather)
                
                sessions[session_id] = session
                return Response(str(response), mimetype="text/xml")
            else:
                response.say("Please say yes or no - have you filed ITR before?", voice="Polly.Aditi", language="en-IN")
                gather = Gather(input="speech", action="/process_tax_speech", method="POST", speech_timeout="auto", language="en-IN", timeout=60)
                response.append(gather)
                sessions[session_id] = session
                return Response(str(response), mimetype="text/xml")
        
        elif pending_follow_up_type == "current_deductions":
            has_deductions = extract_yes_no_from_speech(speech)
            if has_deductions is not None:
                session["current_deductions"] = "yes" if has_deductions else "no"
                del session["pending_follow_up"]
                del session["pending_follow_up_type"]
                sessions[session_id] = session
                
                if has_deductions:
                    response.say("With your deductions, old tax regime might be beneficial. Let me calculate.", voice="Polly.Aditi", language="en-IN")
                else:
                    response.say("Without major deductions, new tax regime with lower rates may suit you better.", voice="Polly.Aditi", language="en-IN")
                
                gather = Gather(input="speech", action="/process_tax_speech", method="POST", speech_timeout="auto", language="en-IN", timeout=60)
                response.append(gather)
                sessions[session_id] = session
                return Response(str(response), mimetype="text/xml")
            else:
                response.say("Please say yes or no - do you have investments like PPF, ELSS, or home loan?", voice="Polly.Aditi", language="en-IN")
                gather = Gather(input="speech", action="/process_tax_speech", method="POST", speech_timeout="auto", language="en-IN", timeout=60)
                response.append(gather)
                sessions[session_id] = session
                return Response(str(response), mimetype="text/xml")
    
    # Generate normal tax response
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    ai_response, follow_up = loop.run_until_complete(advisor.generate_tax_response(speech, session_id))
    
    response.say(ai_response, voice="Polly.Aditi", language="en-IN")
    
    if follow_up:
        session["pending_follow_up"] = follow_up
        if "income" in follow_up.lower() and "annual" in follow_up.lower():
            session["pending_follow_up_type"] = "total_income"
        elif "sources" in follow_up.lower():
            session["pending_follow_up_type"] = "income_sources"
        elif "filed" in follow_up.lower():
            session["pending_follow_up_type"] = "previous_itr_filed"
        elif "deductions" in follow_up.lower() or "investments" in follow_up.lower():
            session["pending_follow_up_type"] = "current_deductions"
        
        gather = Gather(input="speech", action="/process_tax_speech", method="POST", speech_timeout="auto", language="en-IN", timeout=60)
        gather.say(follow_up, voice="Polly.Aditi", language="en-IN")
        response.append(gather)
    else:
        gather = Gather(input="speech", action="/process_tax_speech", method="POST", speech_timeout="auto", language="en-IN", timeout=60)
        response.append(gather)
    
    sessions[session_id] = session
    return Response(str(response), mimetype="text/xml")

@app.route("/test", methods=["GET"])
def test_interface():
    return """
    <html>
        <head><title>Indian Tax Filing Voice Assistant</title></head>
        <body style="font-family: Arial, sans-serif; margin: 40px;">
            <h1>Indian Tax Filing Voice Assistant</h1>
            <p><strong>Specialized in Indian Income Tax Filing</strong></p>
            <h3>Services Available:</h3>
            <ul>
                <li>ITR form selection (ITR-1 to ITR-4)</li>
                <li>Tax regime comparison (Old vs New)</li>
                <li>Income categorization and computation</li>
                <li>Deductions optimization (80C, 80D, HRA)</li>
                <li>Filing procedures and requirements</li>
                <li>Penalty and due date information</li>
            </ul>
            <p><em>Call via Twilio to test voice interactions</em></p>
            <p><a href="/health">Check System Health</a></p>
        </body>
    </html>
    """

@app.route("/health", methods=["GET"])
def health_check():
    """Health check for tax filing system"""
    ai_status = "available" if (groq_client or gemini_model) else "unavailable"
    
    collection_status = {}
    total_docs = 0
    for name, collection in collections.items():
        if collection:
            try:
                count = collection.count()
                collection_status[name] = count
                total_docs += count
            except:
                collection_status[name] = "error"
        else:
            collection_status[name] = "not_found"
    
    status = "healthy" if ai_status == "available" and total_docs > 0 else "degraded"
    
    return jsonify({
        "status": status,
        "ai_services": ai_status,
        "tax_collections": collection_status,
        "total_documents": total_docs,
        "timestamp": datetime.now().isoformat(),
        "specialization": "Indian Tax Filing"
    })

@app.errorhandler(Exception)
def handle_exception(e):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(e)}")
    
    if request.endpoint in ['voice', 'process_tax_speech']:
        response = VoiceResponse()
        response.say("Technical issue occurred. Please try again or call back later.", voice="Polly.Aditi", language="en-IN")
        return Response(str(response), mimetype="text/xml")
    
    return jsonify({
        "error": "Internal server error",
        "message": "Please try again or contact support"
    }), 500

def verify_tax_system_health():
    """Verify tax filing system components"""
    issues = []
    
    # Check tax collections
    tax_collections_available = 0
    for name, collection in collections.items():
        try:
            if collection and collection.count() > 0:
                tax_collections_available += 1
        except:
            issues.append(f"Tax collection {name} has issues")
    
    if tax_collections_available == 0:
        issues.append("No tax knowledge base found - run tax_filing_knowledge_setup.py")
    
    # Check AI services
    if not (groq_client or gemini_model):
        issues.append("No AI services available - configure GROQ_API_KEY or GEMINI_API_KEY")
    
    # Check Twilio
    if not (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN):
        issues.append("Twilio not configured - voice calls won't work")
    
    if issues:
        print("Warning - System Issues Found:")
        for issue in issues:
            print(f"   - {issue}")
        print("\nSystem will run with available components and fallbacks")
    else:
        print("All tax filing system components operational")
    
    return len(issues) == 0

if __name__ == "__main__":
    print("Indian Tax Filing Voice RAG Agent Starting...")
    print("=" * 55)
    
    system_ok = verify_tax_system_health()
    
    print("\nTax Filing Services:")
    print(f"Voice Interface: {'Yes' if TWILIO_ACCOUNT_SID else 'No - configure Twilio'}")
    print(f"AI Services: {'Yes' if (groq_client or gemini_model) else 'No - configure APIs'}")
    
    # Show tax collections status
    print(f"Tax Knowledge Collections:")
    for name, collection in collections.items():
        try:
            count = collection.count() if collection else 0
            status = f"{count} docs" if count > 0 else "Empty/Missing"
            print(f"   {name}: {status}")
        except:
            print(f"   {name}: Error")
    
    print("\nSpecialized Tax Areas Covered:")
    print("- ITR form selection and filing procedures")
    print("- Old vs New tax regime comparison")
    print("- Income categorization (Salary, Business, Property)")
    print("- Tax deductions and exemptions (80C, 80D, HRA)")
    print("- Penalty calculations and due dates")
    print("- E-filing and verification process")
    
    print("=" * 55)
    print(f"Test Interface: http://localhost:5000/test")
    print(f"Health Check: http://localhost:5000/health") 
    print(f"Twilio Webhook: Use HTTPS ngrok URL + /voice")
    print("=" * 55)
    
    if not system_ok:
        print("Running with limited functionality - some components need setup")
    
    try:
        app.run(debug=False, port=5000, host='0.0.0.0', threaded=True)
    except Exception as e:
        print(f"Failed to start server: {e}")
        print("Check if port 5000 is available")
# services/cibil_analyzer.py
"""
CIBIL score analysis and improvement recommendations service
"""

from typing import Dict, List, Any, Tuple
import json
import re
from datetime import datetime, timedelta
from utils.pdf_extractor import PDFExtractor

class CIBILAnalyzer:
    def __init__(self):
        self.pdf_extractor = PDFExtractor()
        
        # CIBIL score ranges
        self.score_ranges = {
            'excellent': (750, 900),
            'good': (700, 749),
            'fair': (650, 699),
            'poor': (550, 649),
            'bad': (300, 549)
        }
        
        # Credit utilization thresholds
        self.utilization_thresholds = {
            'excellent': 10,
            'good': 30,
            'fair': 50,
            'poor': 70,
            'bad': 100
        }
    
    async def analyze_credit_report(self, file_path: str) -> Dict[str, Any]:
        """Analyze credit report and provide comprehensive insights"""
        # Extract data from credit report
        credit_data = await self.pdf_extractor.extract_credit_report_data(file_path)
        
        # Perform detailed analysis
        analysis = {
            'current_score': credit_data.get('credit_score'),
            'score_category': self._get_score_category(credit_data.get('credit_score')),
            'credit_utilization': credit_data.get('credit_utilization'),
            'utilization_category': self._get_utilization_category(credit_data.get('credit_utilization')),
            'payment_history_score': credit_data.get('payment_history'),
            'credit_accounts': credit_data.get('credit_accounts', []),
            'hard_inquiries': credit_data.get('hard_inquiries', 0),
            'score_factors': await self._analyze_score_factors(credit_data),
            'recommendations': await self._generate_recommendations(credit_data),
            'improvement_plan': await self._create_improvement_plan(credit_data),
            'score_simulation': await self._simulate_score_improvements(credit_data)
        }
        
        return analysis
    
    def _get_score_category(self, score: int) -> str:
        """Get score category based on CIBIL score"""
        if not score:
            return 'unknown'
        
        for category, (min_score, max_score) in self.score_ranges.items():
            if min_score <= score <= max_score:
                return category
        
        return 'unknown'
    
    def _get_utilization_category(self, utilization: float) -> str:
        """Get utilization category"""
        if not utilization:
            return 'unknown'
        
        for category, threshold in self.utilization_thresholds.items():
            if utilization <= threshold:
                return category
        
        return 'bad'
    
    async def _analyze_score_factors(self, credit_data: Dict) -> Dict[str, Any]:
        """Analyze factors affecting CIBIL score"""
        factors = {
            'payment_history': {
                'weight': 35,
                'status': 'good' if credit_data.get('payment_history', 0) >= 80 else 'needs_improvement',
                'impact': 'high'
            },
            'credit_utilization': {
                'weight': 30,
                'status': self._get_utilization_category(credit_data.get('credit_utilization', 100)),
                'impact': 'high',
                'current_value': credit_data.get('credit_utilization')
            },
            'credit_history_length': {
                'weight': 15,
                'status': 'unknown',  # Would need more data from report
                'impact': 'medium'
            },
            'credit_mix': {
                'weight': 10,
                'status': self._analyze_credit_mix(credit_data.get('credit_accounts', [])),
                'impact': 'medium'
            },
            'new_credit': {
                'weight': 10,
                'status': 'good' if credit_data.get('hard_inquiries', 0) <= 2 else 'needs_improvement',
                'impact': 'low',
                'hard_inquiries': credit_data.get('hard_inquiries', 0)
            }
        }
        
        return factors
    
    def _analyze_credit_mix(self, accounts: List[Dict]) -> str:
        """Analyze credit mix from account types"""
        if not accounts:
            return 'unknown'
        
        account_types = set()
        for account in accounts:
            acc_type = account.get('type', '').lower()
            if 'credit card' in acc_type:
                account_types.add('credit_card')
            elif 'loan' in acc_type:
                account_types.add('loan')
        
        if len(account_types) >= 2:
            return 'good'
        elif len(account_types) == 1:
            return 'fair'
        else:
            return 'poor'
    
    async def _generate_recommendations(self, credit_data: Dict) -> List[str]:
        """Generate personalized CIBIL improvement recommendations"""
        recommendations = []
        
        current_score = credit_data.get('credit_score', 0)
        utilization = credit_data.get('credit_utilization', 0)
        hard_inquiries = credit_data.get('hard_inquiries', 0)
        
        # Credit utilization recommendations
        if utilization > 30:
            reduction_needed = utilization - 30
            recommendations.append(
                f"Reduce your credit utilization from {utilization}% to below 30%. "
                f"This could improve your score by 50-100 points. "
                f"Pay down credit card balances to achieve this."
            )
        elif utilization > 10:
            recommendations.append(
                f"Excellent work keeping utilization at {utilization}%! "
                f"For an even better score, try to keep it below 10%."
            )
        
        # Payment history recommendations
        if current_score < 700:
            recommendations.append(
                "Ensure all EMIs and credit card bills are paid on time. "
                "Set up auto-pay to avoid missing payments. "
                "Even one missed payment can significantly impact your score."
            )
        
        # Hard inquiries recommendations
        if hard_inquiries > 3:
            recommendations.append(
                f"You have {hard_inquiries} hard inquiries. "
                f"Avoid applying for new credit for the next 6-12 months. "
                f"Each inquiry can reduce your score by 5-10 points."
            )
        
        # Score-specific recommendations
        if current_score < 600:
            recommendations.extend([
                "Consider a secured credit card to start building positive payment history.",
                "Keep old accounts open to maintain credit history length.",
                "Monitor your credit report monthly for errors and dispute them promptly."
            ])
        elif current_score < 700:
            recommendations.extend([
                "Focus on paying down existing debt to improve utilization ratio.",
                "Consider debt consolidation if you have multiple high-interest debts.",
                "Maintain a diverse credit mix with both cards and loans."
            ])
        elif current_score < 750:
            recommendations.extend([
                "You're in the good range! Focus on maintaining current habits.",
                "Consider requesting credit limit increases to lower utilization.",
                "Keep monitoring for any negative items that might appear."
            ])
        else:
            recommendations.append(
                "Excellent score! Maintain your current financial discipline. "
                "You qualify for the best interest rates and credit products."
            )
        
        return recommendations
    
    async def _create_improvement_plan(self, credit_data: Dict) -> Dict[str, Any]:
        """Create a structured improvement plan"""
        current_score = credit_data.get('credit_score', 0)
        utilization = credit_data.get('credit_utilization', 0)
        
        plan = {
            'current_score': current_score,
            'target_score': min(current_score + 100, 850),
            'estimated_timeframe': '6-12 months',
            'priority_actions': [],
            'monthly_tasks': [],
            'long_term_goals': []
        }
        
        # Priority actions (immediate)
        if utilization > 30:
            plan['priority_actions'].append({
                'action': 'Reduce credit utilization',
                'target': 'Below 30%',
                'impact': '+50-100 points',
                'timeframe': '1-2 months'
            })
        
        if credit_data.get('hard_inquiries', 0) > 3:
            plan['priority_actions'].append({
                'action': 'Stop applying for new credit',
                'target': 'No new applications',
                'impact': 'Prevent further score reduction',
                'timeframe': 'Immediate'
            })
        
        # Monthly tasks
        plan['monthly_tasks'] = [
            'Pay all bills on time',
            'Check credit utilization ratio',
            'Monitor credit report for errors',
            'Track score improvement'
        ]
        
        # Long-term goals
        if current_score < 750:
            plan['long_term_goals'].append({
                'goal': 'Achieve excellent credit score (750+)',
                'timeframe': '12-18 months',
                'actions': ['Maintain low utilization', 'Build payment history', 'Diversify credit mix']
            })
        
        return plan
    
    async def _simulate_score_improvements(self, credit_data: Dict) -> Dict[str, Any]:
        """Simulate potential score improvements based on different actions"""
        current_score = credit_data.get('credit_score', 0)
        utilization = credit_data.get('credit_utilization', 0)
        
        simulations = {}
        
        # Scenario 1: Reduce utilization to 30%
        if utilization > 30:
            estimated_improvement = min(80, (utilization - 30) * 2)
            simulations['reduce_utilization_30'] = {
                'action': 'Reduce credit utilization to 30%',
                'estimated_score': current_score + estimated_improvement,
                'timeframe': '1-2 months',
                'confidence': 'high'
            }
        
        # Scenario 2: Reduce utilization to 10%
        if utilization > 10:
            estimated_improvement = min(100, (utilization - 10) * 1.5)
            simulations['reduce_utilization_10'] = {
                'action': 'Reduce credit utilization to 10%',
                'estimated_score': current_score + estimated_improvement,
                'timeframe': '2-3 months',
                'confidence': 'high'
            }
        
        # Scenario 3: Pay off all credit card debt
        if utilization > 0:
            estimated_improvement = min(120, utilization * 1.2)
            simulations['pay_off_cards'] = {
                'action': 'Pay off all credit card debt',
                'estimated_score': current_score + estimated_improvement,
                'timeframe': '1-3 months',
                'confidence': 'high'
            }
        
        # Scenario 4: Add positive payment history (6 months)
        if current_score < 750:
            simulations['payment_history_6m'] = {
                'action': '6 months of on-time payments',
                'estimated_score': current_score + 40,
                'timeframe': '6 months',
                'confidence': 'medium'
            }
        
        return simulations
    
    def analyze_credit_behavior(self, transactions: List[Any]) -> Dict[str, Any]:
        """Analyze credit behavior from transaction data"""
        credit_behavior = {
            'avg_credit_utilization': 0,
            'payment_patterns': {},
            'credit_card_spending': 0,
            'emi_payments': [],
            'potential_issues': []
        }
        
        credit_card_transactions = []
        emi_transactions = []
        
        for transaction in transactions:
            description = transaction.description.lower()
            amount = transaction.amount
            
            # Identify credit card transactions
            if any(keyword in description for keyword in ['credit card', 'card payment', 'cc payment']):
                credit_card_transactions.append({
                    'amount': amount,
                    'date': transaction.date,
                    'description': transaction.description
                })
            
            # Identify EMI transactions
            elif 'emi' in description or any(keyword in description for keyword in ['loan', 'mortgage']):
                emi_transactions.append({
                    'amount': amount,
                    'date': transaction.date,
                    'description': transaction.description
                })
        
        # Analyze credit card behavior
        if credit_card_transactions:
            total_cc_spending = sum(t['amount'] for t in credit_card_transactions)
            credit_behavior['credit_card_spending'] = total_cc_spending
            
            # Check for concerning patterns
            if len(credit_card_transactions) > 20:  # High frequency
                credit_behavior['potential_issues'].append(
                    "High frequency of credit card transactions detected. Monitor spending patterns."
                )
        
        # Analyze EMI behavior
        credit_behavior['emi_payments'] = emi_transactions
        
        if emi_transactions:
            # Check for missed EMIs (would need more sophisticated logic)
            emi_amounts = [t['amount'] for t in emi_transactions]
            if len(set(emi_amounts)) > 3:  # Varying EMI amounts might indicate issues
                credit_behavior['potential_issues'].append(
                    "Varying EMI amounts detected. Ensure all loan payments are consistent."
                )
        
        return credit_behavior
    
    def get_credit_health_score(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate overall credit health score"""
        score_factors = analysis.get('score_factors', {})
        current_score = analysis.get('current_score', 0)
        
        health_components = {
            'cibil_score': {
                'score': min(100, (current_score / 850) * 100) if current_score else 0,
                'weight': 40
            },
            'credit_utilization': {
                'score': max(0, 100 - (analysis.get('credit_utilization', 0) * 2)),
                'weight': 25
            },
            'payment_history': {
                'score': analysis.get('payment_history_score', 0),
                'weight': 20
            },
            'credit_mix': {
                'score': 80 if score_factors.get('credit_mix', {}).get('status') == 'good' else 60,
                'weight': 10
            },
            'new_credit': {
                'score': max(0, 100 - (analysis.get('hard_inquiries', 0) * 10)),
                'weight': 5
            }
        }
        
        # Calculate weighted average
        total_score = 0
        total_weight = 0
        
        for component, data in health_components.items():
            total_score += data['score'] * data['weight']
            total_weight += data['weight']
        
        overall_health_score = total_score / total_weight if total_weight > 0 else 0
        
        # Determine health category
        if overall_health_score >= 85:
            health_category = 'Excellent'
        elif overall_health_score >= 70:
            health_category = 'Good'
        elif overall_health_score >= 55:
            health_category = 'Fair'
        else:
            health_category = 'Needs Improvement'
        
        return {
            'overall_score': round(overall_health_score, 1),
            'category': health_category,
            'components': health_components,
            'improvement_potential': 100 - overall_health_score
        }
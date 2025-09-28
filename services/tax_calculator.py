# services/tax_calculator.py
"""
Advanced tax calculation service for Indian tax laws
"""

from typing import Dict, List, Any, Tuple
from datetime import datetime, timedelta
import json
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

class TaxCalculator:
    def __init__(self):
        # Tax slabs for FY 2024-25
        self.old_regime_slabs = [
            (250000, 0),      # Up to 2.5L - 0%
            (500000, 0.05),   # 2.5L to 5L - 5%
            (1000000, 0.20),  # 5L to 10L - 20%
            (float('inf'), 0.30)  # Above 10L - 30%
        ]
        
        self.new_regime_slabs = [
            (300000, 0),      # Up to 3L - 0%
            (600000, 0.05),   # 3L to 6L - 5%
            (900000, 0.10),   # 6L to 9L - 10%
            (1200000, 0.15),  # 9L to 12L - 15%
            (1500000, 0.20),  # 12L to 15L - 20%
            (float('inf'), 0.30)  # Above 15L - 30%
        ]
        
        # Standard deductions
        self.standard_deduction = 50000
        
        # Deduction limits
        self.deduction_limits = {
            '80C': 150000,   # ELSS, PPF, NSC, etc.
            '80D': 25000,    # Health insurance (self)
            '80D_parents': 50000,  # Health insurance (parents)
            '80G': 0,        # Charitable donations (no limit)
            '24b': 200000,   # Home loan interest
            '80TTA': 10000,  # Savings account interest
            '80E': 0,        # Education loan interest (no limit)
            '80EE': 50000,   # First-time home buyer
        }
    
    async def calculate_tax(self, transactions: List[Any]) -> Dict[str, Any]:
        """Calculate comprehensive tax for a user"""
        # Analyze transactions to compute income and deductions
        financial_summary = await self._analyze_financial_data(transactions)
        
        # Calculate taxable income
        total_income = financial_summary['total_income']
        total_deductions = financial_summary['total_deductions']
        taxable_income = max(0, total_income - total_deductions - self.standard_deduction)
        
        # Calculate tax under both regimes
        old_regime_tax = await self._calculate_old_regime_tax(taxable_income, financial_summary['deductions'])
        new_regime_tax = await self._calculate_new_regime_tax(total_income)
        
        # Determine recommended regime
        recommended_regime = "Old Regime" if old_regime_tax < new_regime_tax else "New Regime"
        
        # Generate recommendations
        recommendations = await self._generate_tax_recommendations(financial_summary, taxable_income)
        
        return {
            'total_income': total_income,
            'taxable_income': taxable_income,
            'old_regime_tax': old_regime_tax,
            'new_regime_tax': new_regime_tax,
            'recommended_regime': recommended_regime,
            'tax_saved': abs(old_regime_tax - new_regime_tax),
            'deductions': financial_summary['deductions'],
            'recommendations': recommendations,
            'financial_summary': financial_summary
        }
    
    async def _analyze_financial_data(self, transactions: List[Any]) -> Dict[str, Any]:
        """Analyze transactions to extract financial information"""
        income_total = 0
        deductions = {
            '80C': 0,
            '80D': 0,
            '24b': 0,
            '80G': 0,
            '80TTA': 0,
            '80E': 0
        }
        
        category_totals = {}
        
        for transaction in transactions:
            amount = transaction.amount
            category = getattr(transaction, 'category', 'other')
            description = transaction.description.lower()
            
            # Income calculation
            if category == 'income' or transaction.transaction_type == 'credit':
                if any(keyword in description for keyword in ['salary', 'wage', 'bonus']):
                    income_total += amount
            
            # Deduction calculations
            elif category == 'sip' or 'sip' in description:
                if 'elss' in description:
                    deductions['80C'] += min(amount, self.deduction_limits['80C'] - deductions['80C'])
            
            elif category == 'insurance' or 'insurance' in description:
                if 'health' in description or 'medical' in description:
                    if 'parent' in description:
                        deductions['80D'] += min(amount, self.deduction_limits['80D_parents'])
                    else:
                        deductions['80D'] += min(amount, self.deduction_limits['80D'])
            
            elif category == 'emi' and 'home loan' in description:
                # Assume 70% of home loan EMI is interest (rough estimate)
                interest_portion = amount * 0.7
                deductions['24b'] += min(interest_portion, self.deduction_limits['24b'] - deductions['24b'])
            
            elif 'donation' in description or 'charity' in description:
                deductions['80G'] += amount  # No limit for 80G
            
            elif 'interest' in description and transaction.transaction_type == 'credit':
                if 'savings' in description:
                    deductions['80TTA'] += min(amount, self.deduction_limits['80TTA'] - deductions['80TTA'])
            
            elif 'education loan' in description:
                # Assume full EMI is interest for education loans
                deductions['80E'] += amount
            
            # Category totals for insights
            if category not in category_totals:
                category_totals[category] = 0
            if transaction.transaction_type == 'debit':
                category_totals[category] += amount
        
        total_deductions = sum(deductions.values())
        
        return {
            'total_income': income_total,
            'total_deductions': total_deductions,
            'deductions': deductions,
            'category_totals': category_totals
        }
    
    async def _calculate_old_regime_tax(self, taxable_income: float, deductions: Dict[str, float]) -> float:
        """Calculate tax under old regime"""
        # Apply deductions
        income_after_deductions = max(0, taxable_income - sum(deductions.values()))
        
        return self._calculate_tax_from_slabs(income_after_deductions, self.old_regime_slabs)
    
    async def _calculate_new_regime_tax(self, total_income: float) -> float:
        """Calculate tax under new regime (no deductions except standard)"""
        taxable_income = max(0, total_income - self.standard_deduction)
        
        return self._calculate_tax_from_slabs(taxable_income, self.new_regime_slabs)
    
    def _calculate_tax_from_slabs(self, income: float, slabs: List[Tuple[float, float]]) -> float:
        """Calculate tax from given slabs"""
        total_tax = 0
        remaining_income = income
        previous_limit = 0
        
        for limit, rate in slabs:
            if remaining_income <= 0:
                break
            
            taxable_in_slab = min(remaining_income, limit - previous_limit)
            total_tax += taxable_in_slab * rate
            remaining_income -= taxable_in_slab
            previous_limit = limit
        
        # Add cess (4% on total tax)
        total_tax_with_cess = total_tax * 1.04
        
        return round(total_tax_with_cess, 2)
    
    async def _generate_tax_recommendations(self, financial_summary: Dict, taxable_income: float) -> List[str]:
        """Generate personalized tax-saving recommendations"""
        recommendations = []
        deductions = financial_summary['deductions']
        
        # 80C recommendations
        remaining_80c = self.deduction_limits['80C'] - deductions['80C']
        if remaining_80c > 0:
            recommendations.append(
                f"Invest ₹{remaining_80c:,.0f} more in ELSS/PPF/NSC to maximize your 80C benefits and save ₹{remaining_80c * 0.31:,.0f} in taxes."
            )
        
        # 80D recommendations
        if deductions['80D'] < self.deduction_limits['80D']:
            remaining_80d = self.deduction_limits['80D'] - deductions['80D']
            recommendations.append(
                f"Consider health insurance of ₹{remaining_80d:,.0f} to claim 80D deduction and save ₹{remaining_80d * 0.31:,.0f} in taxes."
            )
        
        # Home loan recommendations
        if deductions['24b'] == 0 and taxable_income > 500000:
            recommendations.append(
                "Consider a home loan to claim up to ₹2,00,000 deduction on interest under section 24(b)."
            )
        
        # Savings account interest
        if deductions['80TTA'] < self.deduction_limits['80TTA']:
            recommendations.append(
                f"Optimize your savings account interest to claim full ₹{self.deduction_limits['80TTA']:,.0f} deduction under 80TTA."
            )
        
        # Regime-specific recommendations
        old_tax = await self._calculate_old_regime_tax(taxable_income, deductions)
        new_tax = await self._calculate_new_regime_tax(financial_summary['total_income'])
        
        if old_tax < new_tax:
            recommendations.append(
                f"Stick with the Old Tax Regime to save ₹{new_tax - old_tax:,.0f} compared to the New Regime."
            )
        else:
            recommendations.append(
                f"Switch to the New Tax Regime to save ₹{old_tax - new_tax:,.0f} compared to the Old Regime."
            )
        
        # Investment recommendations based on income level
        if taxable_income > 1000000:
            recommendations.append(
                "Consider tax-free bonds and NPS (National Pension System) for additional tax benefits."
            )
        
        return recommendations
    
    async def generate_tax_report(self, tax_data) -> str:
        """Generate comprehensive tax report as PDF"""
        from pathlib import Path
        import os
        
        # Create reports directory
        reports_dir = Path("reports")
        reports_dir.mkdir(exist_ok=True)
        
        # Generate filename
        filename = f"tax_report_{tax_data.user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        filepath = reports_dir / filename
        
        # Create PDF document
        doc = SimpleDocTemplate(str(filepath), pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            alignment=1  # Center alignment
        )
        story.append(Paragraph("TaxWise - Tax Computation Report", title_style))
        story.append(Spacer(1, 20))
        
        # User information
        story.append(Paragraph(f"<b>Financial Year:</b> {tax_data.financial_year}", styles['Normal']))
        story.append(Paragraph(f"<b>Report Generated:</b> {datetime.now().strftime('%B %d, %Y')}", styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Tax computation summary
        story.append(Paragraph("Tax Computation Summary", styles['Heading2']))
        
        tax_table_data = [
            ['Description', 'Amount (₹)'],
            ['Total Income', f"{tax_data.total_income:,.2f}"],
            ['Taxable Income', f"{tax_data.taxable_income:,.2f}"],
            ['Old Regime Tax', f"{tax_data.old_regime_tax:,.2f}"],
            ['New Regime Tax', f"{tax_data.new_regime_tax:,.2f}"],
        ]
        
        tax_table = Table(tax_table_data)
        tax_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(tax_table)
        story.append(Spacer(1, 20))
        
        # Deductions breakdown
        if tax_data.deductions:
            story.append(Paragraph("Deductions Breakdown", styles['Heading2']))
            deductions = json.loads(tax_data.deductions)
            
            for section, amount in deductions.items():
                if amount > 0:
                    story.append(Paragraph(f"<b>Section {section}:</b> ₹{amount:,.2f}", styles['Normal']))
            
            story.append(Spacer(1, 20))
        
        # Recommendations
        if tax_data.recommendations:
            story.append(Paragraph("Tax-Saving Recommendations", styles['Heading2']))
            recommendations = json.loads(tax_data.recommendations)
            
            for i, recommendation in enumerate(recommendations, 1):
                story.append(Paragraph(f"{i}. {recommendation}", styles['Normal']))
                story.append(Spacer(1, 10))
        
        # Disclaimer
        story.append(Spacer(1, 30))
        disclaimer_style = ParagraphStyle(
            'Disclaimer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey
        )
        story.append(Paragraph(
            "<i>Disclaimer: This report is generated based on the financial data provided and current tax laws. "
            "Please consult a tax advisor for personalized advice. TaxWise is not responsible for any tax-related decisions.</i>",
            disclaimer_style
        ))
        
        # Build PDF
        doc.build(story)
        
        return str(filepath)
    
    def calculate_tax_projections(self, current_income: float, additional_investments: Dict[str, float]) -> Dict[str, Any]:
        """Calculate tax projections with additional investments"""
        projections = {}
        
        # Current tax calculation
        current_taxable = max(0, current_income - self.standard_deduction)
        current_tax_old = self._calculate_tax_from_slabs(current_taxable, self.old_regime_slabs)
        current_tax_new = self._calculate_tax_from_slabs(current_taxable, self.new_regime_slabs)
        
        # Calculate with additional investments
        total_additional_deductions = sum(additional_investments.values())
        new_taxable_old = max(0, current_taxable - total_additional_deductions)
        new_tax_old = self._calculate_tax_from_slabs(new_taxable_old, self.old_regime_slabs)
        
        projections = {
            'current_tax_old_regime': current_tax_old,
            'current_tax_new_regime': current_tax_new,
            'projected_tax_old_regime': new_tax_old,
            'projected_tax_new_regime': current_tax_new,  # New regime doesn't benefit from additional deductions
            'tax_savings_old_regime': current_tax_old - new_tax_old,
            'recommended_investments': additional_investments,
            'total_investment_needed': total_additional_deductions
        }
        
        return projections
                
// Static data for screens without APIs

// Dashboard static data
export const dashboardData = {
  cards: [
    {
      title: 'Tax Liability',
      subtitle: 'Old: ₹1,25,000 | New: ₹98,000',
      value: '₹98,000',
      change: 'Save ₹27,000',
      icon: 'TrendingUp',
      color: '#10B981',
    },
    {
      title: 'CIBIL Score',
      subtitle: 'Credit Health',
      value: '742',
      change: '+15 this month',
      icon: 'Shield',
      color: '#3B82F6',
    },
    {
      title: 'Potential Savings',
      subtitle: '80C, 80D & Other Deductions',
      value: '₹45,000',
      change: 'Available this year',
      icon: 'PiggyBank',
      color: '#F59E0B',
    },
    {
      title: 'Monthly Spending',
      subtitle: 'Current Month',
      value: '₹35,000',
      change: '+12% vs last month',
      icon: 'CreditCard',
      color: '#EF4444',
    },
  ],
  insights: [
    {
      title: '💡 Tax Tip',
      text: 'You can save ₹30,000 more in taxes by investing in ELSS funds under Section 80C',
    },
    {
      title: '📈 Credit Tip',
      text: 'Your credit utilization is 75%. Reduce it to below 30% to improve your CIBIL score',
    },
  ],
};

// Transactions static data
export const transactionsData = [
  {
    id: 'static-1',
    date: '2024-01-15T00:00:00',
    description: 'SALARY CREDIT - COMPANY NAME',
    amount: 85000,
    category: 'income',
    type: 'credit',
  },
  {
    id: 'static-2',
    date: '2024-01-16T00:00:00',
    description: 'HDFC HOME LOAN EMI',
    amount: -25000,
    category: 'emi',
    type: 'debit',
  },
  {
    id: 'static-3',
    date: '2024-01-18T00:00:00',
    description: 'SIP MUTUAL FUND AXIS',
    amount: -10000,
    category: 'sip',
    type: 'debit',
  },
  {
    id: 'static-4',
    date: '2024-01-20T00:00:00',
    description: 'HOUSE RENT PAYMENT',
    amount: -20000,
    category: 'rent',
    type: 'debit',
  },
  {
    id: 'static-5',
    date: '2024-01-22T00:00:00',
    description: 'HEALTH INSURANCE PREMIUM',
    amount: -8000,
    category: 'insurance',
    type: 'debit',
  },
  {
    id: 'static-6',
    date: '2024-01-23T00:00:00',
    description: 'GROCERY SHOPPING',
    amount: -2500,
    category: 'food',
    type: 'debit',
  },
  {
    id: 'static-7',
    date: '2024-01-24T00:00:00',
    description: 'FUEL PAYMENT',
    amount: -1500,
    category: 'transport',
    type: 'debit',
  },
  {
    id: 'static-8',
    date: '2024-01-25T00:00:00',
    description: 'ONLINE SHOPPING',
    amount: -5000,
    category: 'shopping',
    type: 'debit',
  },
];

// Tax optimization static data
export const taxOptimizationData = {
  old_regime_tax: 187200,
  new_regime_tax: 156000,
  recommendations: [
    'New tax regime is more beneficial for you',
    'Consider health insurance for ₹25,000 deduction',
    'Maximize 80C investments to ₹1,50,000',
    'Consider home loan for additional deductions',
  ],
  deductions_available: {
    "80C": 50000,
    "80D": 25000,
    "80G": 100000,
    "24b": 200000,
  },
};

// CIBIL advisor static data
export const cibilAdvisorData = {
  current_score: 742,
  factors: {
    credit_utilization: 36,
    payment_history: 'Has missed payments',
    credit_age: 5,
    credit_mix: 'Good mix of credit types',
    recent_inquiries: 2,
  },
  recommendations: [
    'Reduce credit utilization below 30% to improve score',
    'Ensure all EMIs and credit card payments are on time',
    'Avoid multiple credit inquiries in short period',
    'Maintain a good mix of secured and unsecured credit',
  ],
  improvement_potential: 80,
};

// Reports static data
export const reportsData = {
  financialSummary: {
    totalIncome: 85000,
    totalExpenses: 70000,
    netIncome: 15000,
    categoryBreakdown: {
      emi: 25000,
      sip: 10000,
      rent: 20000,
      insurance: 8000,
      food: 2500,
      transport: 1500,
      shopping: 5000,
    },
  },
  taxSummary: {
    taxableIncome: 800000,
    oldRegimeTax: 187200,
    newRegimeTax: 156000,
    recommendedRegime: 'new_regime',
  },
  creditSummary: {
    currentScore: 742,
    creditUtilization: 36,
    paymentHistory: 85,
  },
};

// AI chat static responses
export const aiChatData = {
  welcomeMessage: "Hello! I'm your financial AI assistant. I can help you with tax planning, investment advice, and financial questions. How can I assist you today?",
  sampleQuestions: [
    "How can I save more on taxes?",
    "What's the best investment strategy for me?",
    "How can I improve my CIBIL score?",
    "Should I choose old or new tax regime?",
  ],
};

// Upload screen static data
export const uploadData = {
  supportedFormats: {
    bank: ['PDF', 'CSV', 'Excel'],
    credit: ['PDF'],
  },
  instructions: {
    bank: 'Upload your bank statements in PDF, CSV, or Excel format for transaction analysis',
    credit: 'Upload your CIBIL credit report in PDF format for score analysis',
  },
};
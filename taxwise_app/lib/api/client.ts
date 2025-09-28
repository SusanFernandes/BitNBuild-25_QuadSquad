import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = 'https://fa69c7091b5b.ngrok-free.app';

// New API Response Types
export interface StatementUploadResponse {
  transactions: TransactionResponse[];
  summary: {
    total_transactions: number;
    total_income: number;
    total_expenses: number;
    categories: Record<string, number>;
    recurring_count: number;
    date_range: {
      start: string;
      end: string;
    };
  };
}

export interface TransactionResponse {
  date: string;
  description: string;
  amount: number;
  category: string;
}

export interface TaxAnalysisRequest {
  annual_income: number;
  current_investments?: {
    "80C"?: number;
    "80D"?: number;
    "80G"?: number;
    "24b"?: number;
  };
}

export interface TaxAnalysisResponse {
  old_regime_tax: number;
  new_regime_tax: number;
  recommendations: string[];
  deductions_available: {
    "80C": number;
    "80D": number;
    "80G": number;
    "24b": number;
  };
}

export interface CIBILAnalysisResponse {
  current_score: number;
  factors: {
    credit_utilization: number;
    payment_history: string;
    credit_age: number;
    credit_mix: string;
    recent_inquiries: number;
  };
  recommendations: string[];
  improvement_potential: number;
}

export interface KnowledgeUpdateRequest {
  query: string;
}

export interface KnowledgeUpdateResponse {
  message: string;
}

export interface ChatQueryRequest {
  question: string;
  user_context?: {
    annual_income?: number;
    age?: number;
    city?: string;
    current_investments?: Record<string, number>;
    cibil_score?: number;
    credit_utilization?: number;
    home_loan_emi?: number;
    outstanding_loan?: number;
    risk_profile?: string;
    dependents?: number;
    nri_status?: boolean;
  };
}

export interface ChatQueryResponse {
  answer: string;
  sources_used: number;
  confidence: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

// Report Management Types
export interface ReportListItem {
  id: string;
  type: 'transaction' | 'tax' | 'cibil' | 'chat';
  filename: string | null;
  created_date: string;
  summary: any;
}

export interface ReportsListResponse {
  reports: ReportListItem[];
  total_count: number;
  has_more: boolean;
}

export interface TransactionReportResponse {
  id: string;
  transactions: TransactionResponse[];
  summary: {
    total_transactions: number;
    total_income: number;
    total_expenses: number;
    categories: Record<string, number>;
  };
  filename: string;
  created_date: string;
}

export interface TaxReportResponse {
  id: string;
  annual_income: number;
  current_investments: Record<string, number>;
  old_regime_tax: number;
  new_regime_tax: number;
  recommendations: string[];
  deductions_available: Record<string, number>;
  created_date: string;
}

export interface CIBILReportResponse {
  id: string;
  current_score: number;
  factors: {
    credit_utilization: number;
    payment_history: string;
    credit_age: number;
    credit_mix: string;
    recent_inquiries: number;
  };
  recommendations: string[];
  improvement_potential: number;
  filename: string;
  created_date: string;
}

export interface ChatReportResponse {
  id: string;
  question: string;
  answer: string;
  user_context: any;
  sources_used: number;
  confidence: string;
  created_date: string;
}

export interface DeleteReportResponse {
  message: string;
}

// API Client Class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const user = await AsyncStorage.getItem('currentUser');
    const userId = user ? JSON.parse(user).id : null;
    
    return {
      'Content-Type': 'application/json',
      ...(userId && { 'X-User-ID': userId }),
    };
  }

  private async getUserId(): Promise<string> {
    const user = await AsyncStorage.getItem('currentUser');
    if (!user) {
      throw new Error('User not authenticated');
    }
    return JSON.parse(user).id;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getAuthHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
console.log(response.json())
    return response.json();
  }

  // Statement Upload - New API
  async uploadStatements(files: any[]): Promise<StatementUploadResponse> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('files', file);
    });

    const response = await fetch(`${this.baseURL}/upload/statements`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Tax Analysis - New API
  async analyzeTax(request: TaxAnalysisRequest): Promise<TaxAnalysisResponse> {
    const formData = new URLSearchParams();
    
    // Append annual_income as number (no need for parseInt if it's already a number)
    formData.append('annual_income', request.annual_income.toString());
    
    // Append current_investments as JSON string only if it exists
    if (request.current_investments && Object.keys(request.current_investments).length > 0) {
        formData.append('current_investments', JSON.stringify(request.current_investments));
    }
    
    // Debug: Log the actual formData contents properly
    console.log('Request object:', request);
    console.log('FormData entries:');
    for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }
    
    const response = await fetch(`${this.baseURL}/analyze/tax`, {
        method: 'POST',
        body: formData,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('Error response:', errorData);
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
}

  // CIBIL Analysis - New API
  async analyzeCIBILReport(file: any): Promise<CIBILAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseURL}/analyze/cibil`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // AI Chat Query - New API
  async queryChat(request: ChatQueryRequest): Promise<ChatQueryResponse> {
    return this.request<ChatQueryResponse>('/chat/query', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Knowledge Base Update - New API
  async updateKnowledgeBase(request: KnowledgeUpdateRequest): Promise<KnowledgeUpdateResponse> {
    const formData = new URLSearchParams();
    formData.append('query', request.query);

    const response = await fetch(`${this.baseURL}/search/update-knowledge`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Health Check
  async healthCheck(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  // Report Management APIs
  async listReports(params?: {
    report_type?: 'transaction' | 'tax' | 'cibil' | 'chat';
    limit?: number;
    offset?: number;
  }): Promise<ReportsListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.report_type) queryParams.append('report_type', params.report_type);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/reports/list?${queryString}` : '/reports/list';
    
    return this.request<ReportsListResponse>(endpoint);
  }

  async getTransactionReport(reportId: string): Promise<TransactionReportResponse> {
    return this.request<TransactionReportResponse>(`/reports/transaction/${reportId}`);
  }

  async getTaxReport(reportId: string): Promise<TaxReportResponse> {
    return this.request<TaxReportResponse>(`/reports/tax/${reportId}`);
  }

  async getCIBILReport(reportId: string): Promise<CIBILReportResponse> {
    return this.request<CIBILReportResponse>(`/reports/cibil/${reportId}`);
  }

  async getChatReport(queryId: string): Promise<ChatReportResponse> {
    return this.request<ChatReportResponse>(`/reports/chat/${queryId}`);
  }

  async deleteReport(reportType: 'transaction' | 'tax' | 'cibil' | 'chat', reportId: string): Promise<DeleteReportResponse> {
    return this.request<DeleteReportResponse>(`/reports/${reportType}/${reportId}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type {
  StatementUploadResponse,
  TaxAnalysisRequest,
  TaxAnalysisResponse,
  CIBILAnalysisResponse,
  ChatQueryRequest,
  ChatQueryResponse,
  KnowledgeUpdateRequest,
  KnowledgeUpdateResponse,
  HealthResponse,
  ReportsListResponse,
  TransactionReportResponse,
  TaxReportResponse,
  CIBILReportResponse,
  ChatReportResponse,
  DeleteReportResponse,
} from './client';

// Query Keys
export const queryKeys = {
  health: ['health'] as const,
  reports: ['reports'] as const,
  transactionReport: (id: string) => ['reports', 'transaction', id] as const,
  taxReport: (id: string) => ['reports', 'tax', id] as const,
  cibilReport: (id: string) => ['reports', 'cibil', id] as const,
  chatReport: (id: string) => ['reports', 'chat', id] as const,
} as const;

// New API Hooks

// Statement Upload Hook
export const useUploadStatements = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (files: any[]) => apiClient.uploadStatements(files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

// Tax Analysis Hook
export const useAnalyzeTax = () => {
  return useMutation({
    mutationFn: (request: TaxAnalysisRequest) => apiClient.analyzeTax(request),
  });
};

// CIBIL Analysis Hook
export const useAnalyzeCIBILReport = () => {
  return useMutation({
    mutationFn: (file: any) => apiClient.analyzeCIBILReport(file),
  });
};

// Chat Query Hook
export const useQueryChat = () => {
  return useMutation({
    mutationFn: (request: ChatQueryRequest) => apiClient.queryChat(request),
  });
};

// Knowledge Base Update Hook
export const useUpdateKnowledgeBase = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: KnowledgeUpdateRequest) => apiClient.updateKnowledgeBase(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    },
  });
};

// Health Check Hook
export const useHealthCheck = (enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => apiClient.healthCheck(),
    enabled,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// Report Management Hooks
export const useListReports = (params?: {
  report_type?: 'transaction' | 'tax' | 'cibil' | 'chat';
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: [...queryKeys.reports, params],
    queryFn: () => apiClient.listReports(params),
  });
};

export const useGetTransactionReport = (reportId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.transactionReport(reportId),
    queryFn: () => apiClient.getTransactionReport(reportId),
    enabled: enabled && !!reportId,
  });
};

export const useGetTaxReport = (reportId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.taxReport(reportId),
    queryFn: () => apiClient.getTaxReport(reportId),
    enabled: enabled && !!reportId,
  });
};

export const useGetCIBILReport = (reportId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.cibilReport(reportId),
    queryFn: () => apiClient.getCIBILReport(reportId),
    enabled: enabled && !!reportId,
  });
};

export const useGetChatReport = (queryId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.chatReport(queryId),
    queryFn: () => apiClient.getChatReport(queryId),
    enabled: enabled && !!queryId,
  });
};

export const useDeleteReport = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ reportType, reportId }: { 
      reportType: 'transaction' | 'tax' | 'cibil' | 'chat'; 
      reportId: string; 
    }) => apiClient.deleteReport(reportType, reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports });
    },
  });
};
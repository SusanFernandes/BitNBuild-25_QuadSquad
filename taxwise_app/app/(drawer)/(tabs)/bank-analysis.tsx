import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import {
  Upload,
  FileText,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  CheckCircle,
  AlertCircle,
  Trash2,
  Download,
  Eye,
  Filter,
  Search,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useUploadStatements } from '~/lib/api/hooks';
import type { StatementUploadResponse, TransactionResponse } from '~/lib/api/client';
import {
  isMobile,
  isTablet,
  isDesktop,
  getResponsivePadding,
  spacing,
  fontSizes,
  borderRadius,
  shadow,
  layout,
  textStyles
} from '~/lib/utils/responsive';

const { width } = Dimensions.get('window');

export default function BankAnalysisScreen() {
  const [files, setFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<StatementUploadResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const uploadStatements = useUploadStatements();

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const pickFiles = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/pdf'
        ],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets) {
        const mapped = res.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size,
        }));
        setFiles((prev) => [...prev, ...mapped]);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick files');
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onUpload = async () => {
    if (files.length === 0) {
      Alert.alert('No Files', 'Please select one or more statements');
      return;
    }
    setIsUploading(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => (p >= 90 ? p : p + 8));
    }, 200);
    try {
      const data = await uploadStatements.mutateAsync(files);
      setResult(data);
      setProgress(100);
    } catch (e: any) {
      Alert.alert('Upload Failed', e?.message || 'Please try again');
    } finally {
      clearInterval(interval);
      setIsUploading(false);
    }
  };

  const totals = useMemo(() => {
    if (!result) return null;
    const income = result.transactions.filter(t => t.amount >= 0).reduce((s, t) => s + t.amount, 0);
    const expenses = result.transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const netFlow = income - expenses;
    return { income, expenses, netFlow };
  }, [result]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return FileText; // Could expand this to show different icons for different file types
  };

  return (
    <SafeAreaView style={styles.container}>


      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10B981"
            colors={['#10B981']}
          />
        }
      >
        {/* Upload Section */}
        <View style={styles.uploadSection}>
          <View style={styles.uploadCard}>
            <View style={styles.uploadHeader}>
              <View style={styles.uploadIconContainer}>
                <Upload size={24} color="#10B981" />
              </View>
              <Text style={styles.uploadTitle}>Upload Statements</Text>
              <Text style={styles.uploadSubtitle}>
                Support for CSV, Excel, and PDF formats
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
              onPress={pickFiles}
              disabled={isUploading}
            >
              <Upload size={20} color="#FFFFFF" />
              <Text style={styles.uploadButtonText}>
                {isUploading ? 'Processing...' : 'Select Files'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.supportedFormats}>
              Supported: CSV, XLS, XLSX, PDF
            </Text>
          </View>
        </View>

        {/* Selected Files */}
        {files.length > 0 && (
          <View style={styles.filesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Selected Files ({files.length})</Text>
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={() => setFiles([])}
                disabled={isUploading}
              >
                <Trash2 size={16} color="#EF4444" />
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            {files.map((file, index) => {
              const FileIcon = getFileIcon(file.name);
              return (
                <View key={`${file.uri}-${index}`} style={styles.fileCard}>
                  <View style={styles.fileInfo}>
                    <View style={styles.fileIconContainer}>
                      <FileIcon size={20} color="#3B82F6" />
                    </View>
                    <View style={styles.fileDetails}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Text style={styles.fileSize}>
                        {file.size ? formatFileSize(file.size) : 'Unknown size'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    <X size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Upload Progress */}
            {isUploading && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Processing files...</Text>
                  <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
              </View>
            )}

            {/* Analyze Button */}
            <TouchableOpacity
              style={[styles.analyzeButton, isUploading && styles.analyzeButtonDisabled]}
              onPress={onUpload}
              disabled={isUploading}
            >
              <BarChart3 size={20} color="#FFFFFF" />
              <Text style={styles.analyzeButtonText}>
                {isUploading ? 'Analyzing...' : 'Analyze Statements'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results Section */}
        {result && totals && (
          <View style={styles.resultsSection}>
            {/* Summary Cards */}
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Financial Summary</Text>
              <View style={styles.summaryGrid}>
                <View style={[styles.summaryCard, styles.incomeCard]}>
                  <View style={styles.summaryHeader}>
                    <View style={[styles.summaryIcon, { backgroundColor: '#10B98115' }]}>
                      <TrendingUp size={20} color="#10B981" />
                    </View>
                    <Text style={styles.summaryChange}>+{result.summary.total_transactions}</Text>
                  </View>
                  <Text style={styles.summaryValue}>₹{totals.income.toLocaleString('en-IN')}</Text>
                  <Text style={styles.summaryLabel}>Total Income</Text>
                </View>

                <View style={[styles.summaryCard, styles.expenseCard]}>
                  <View style={styles.summaryHeader}>
                    <View style={[styles.summaryIcon, { backgroundColor: '#EF444415' }]}>
                      <TrendingDown size={20} color="#EF4444" />
                    </View>
                    <Text style={[styles.summaryChange, { color: '#EF4444' }]}>
                      -{Object.values(result.summary.categories).reduce((a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0)}
                    </Text>
                  </View>
                  <Text style={styles.summaryValue}>₹{totals.expenses.toLocaleString('en-IN')}</Text>
                  <Text style={styles.summaryLabel}>Total Expenses</Text>
                </View>

                <View style={[styles.summaryCard, styles.netFlowCard]}>
                  <View style={styles.summaryHeader}>
                    <View style={[styles.summaryIcon, {
                      backgroundColor: totals.netFlow >= 0 ? '#10B98115' : '#EF444415'
                    }]}>
                      <DollarSign size={20} color={totals.netFlow >= 0 ? '#10B981' : '#EF4444'} />
                    </View>
                    <Text style={[styles.summaryChange, {
                      color: totals.netFlow >= 0 ? '#10B981' : '#EF4444'
                    }]}>
                      {totals.netFlow >= 0 ? '+' : ''}{Math.round((totals.netFlow / totals.income) * 100)}%
                    </Text>
                  </View>
                  <Text style={[styles.summaryValue, {
                    color: totals.netFlow >= 0 ? '#10B981' : '#EF4444'
                  }]}>
                    ₹{Math.abs(totals.netFlow).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.summaryLabel}>Net Flow</Text>
                </View>
              </View>
            </View>

            {/* Date Range */}
            <View style={styles.dateRangeCard}>
              <View style={styles.dateRangeHeader}>
                <Calendar size={20} color="#64748B" />
                <Text style={styles.dateRangeTitle}>Analysis Period</Text>
              </View>
              <Text style={styles.dateRangeText}>
                {new Date(result.summary.date_range.start).toLocaleDateString()} - {new Date(result.summary.date_range.end).toLocaleDateString()}
              </Text>
            </View>

            {/* Categories */}
            <View style={styles.categoriesSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Transaction Categories</Text>
                <TouchableOpacity style={styles.viewChartButton}>
                  <PieChart size={16} color="#10B981" />
                  <Text style={styles.viewChartText}>View Chart</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.categoriesGrid}>
                {Object.entries(result.summary.categories)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .slice(0, 6)
                  .map(([category, count], index) => {
                    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
                    const color = colors[index % colors.length];
                    
                    return (
                      <View key={category} style={styles.categoryCard}>
                        <View style={[styles.categoryIcon, { backgroundColor: `${color}15` }]}>
                          <View style={[styles.categoryDot, { backgroundColor: color }]} />
                        </View>
                        <Text style={styles.categoryName}>{category}</Text>
                        <Text style={[styles.categoryCount, { color }]}>{count as number}</Text>
                      </View>
                    );
                  })}
              </View>
            </View>

            {/* Recent Transactions */}
            <View style={styles.transactionsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                <TouchableOpacity style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>View All</Text>
                  <Eye size={16} color="#10B981" />
                </TouchableOpacity>
              </View>

              {result.transactions.slice(0, 5).map((transaction: TransactionResponse, index: number) => (
                <View key={index} style={styles.transactionCard}>
                  <View style={styles.transactionInfo}>
                    <View style={[styles.transactionIcon, {
                      backgroundColor: transaction.amount >= 0 ? '#10B98115' : '#EF444415'
                    }]}>
                      {transaction.amount >= 0 ? 
                        <TrendingUp size={16} color="#10B981" /> :
                        <TrendingDown size={16} color="#EF4444" />
                      }
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionDescription} numberOfLines={1}>
                        {transaction.description}
                      </Text>
                      <View style={styles.transactionMeta}>
                        <Text style={styles.transactionDate}>
                          {new Date(transaction.date).toLocaleDateString()}
                        </Text>
                        <View style={styles.categoryTag}>
                          <Text style={styles.categoryTagText}>{transaction.category}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.transactionAmount, {
                    color: transaction.amount >= 0 ? '#10B981' : '#EF4444'
                  }]}>
                    {transaction.amount >= 0 ? '+' : ''}₹{Math.abs(transaction.amount).toLocaleString('en-IN')}
                  </Text>
                </View>
              ))}
            </View>

            {/* Export Actions */}
            <View style={styles.exportSection}>
              <TouchableOpacity style={styles.exportButton}>
                <Download size={20} color="#FFFFFF" />
                <Text style={styles.exportButtonText}>Export Analysis</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.md,
    paddingHorizontal: getResponsivePadding(),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: '#64748B',
  },
  helpButton: {
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.full,
  },
  scrollView: {
    flex: 1,
  },
  uploadSection: {
    paddingHorizontal: getResponsivePadding(),
    paddingTop: spacing.lg,
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadow.lg,
    borderWidth: 2,
    borderColor: '#F1F5F9',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  uploadHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  uploadIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#10B98115',
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  uploadTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: spacing.xs,
  },
  uploadSubtitle: {
    fontSize: fontSizes.sm,
    color: '#64748B',
    textAlign: 'center',
  },
  uploadButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  uploadButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  supportedFormats: {
    fontSize: fontSizes.xs,
    color: '#94A3B8',
    textAlign: 'center',
  },
  filesSection: {
    paddingHorizontal: getResponsivePadding(),
    paddingTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: '#0F172A',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearAllText: {
    fontSize: fontSizes.sm,
    color: '#EF4444',
    fontWeight: '600',
  },
  fileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: '#3B82F615',
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: fontSizes.xs,
    color: '#64748B',
  },
  removeButton: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.full,
  },
  progressSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: fontSizes.sm,
    color: '#64748B',
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: fontSizes.sm,
    color: '#10B981',
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: borderRadius.full,
  },
  analyzeButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadow.sm,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  resultsSection: {
    paddingHorizontal: getResponsivePadding(),
    paddingTop: spacing.xl,
  },
  summarySection: {
    marginBottom: spacing.lg,
  },
  summaryGrid: {
    flexDirection: isMobile ? 'column' : 'row',
    gap: spacing.md,
  },
  summaryCard: {
    flex: isMobile ? 0 : 1,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadow.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryChange: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: '#10B981',
  },
  summaryValue: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: fontSizes.sm,
    color: '#64748B',
  },
  dateRangeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  dateRangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  dateRangeTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: '#64748B',
  },
  dateRangeText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#0F172A',
  },
  categoriesSection: {
    marginBottom: spacing.lg,
  },
  viewChartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B98115',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  viewChartText: {
    fontSize: fontSizes.sm,
    color: '#10B981',
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: isMobile ? '48%' : '30%',
    alignItems: 'center',
    ...shadow.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: fontSizes.xs,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  transactionsSection: {
    marginBottom: spacing.lg,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: fontSizes.sm,
    color: '#10B981',
    fontWeight: '600',
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  transactionDate: {
    fontSize: fontSizes.xs,
    color: '#64748B',
  },
  categoryTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryTagText: {
    fontSize: fontSizes.xs,
    color: '#64748B',
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  exportSection: {
    alignItems: 'center',
  },
  exportButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadow.sm,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
});
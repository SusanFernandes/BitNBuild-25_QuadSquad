import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Shield,
  Zap,
  Target,
  Upload,
  BookOpen,
  Award,
  Activity,
  Calendar,
  Users,
  Search,
  ArrowRight,
  Lightbulb,
  Star,
  FileText,
  X,
} from 'lucide-react-native';
import { cibilAdvisorData } from '~/lib/utils/fallbackData';
import { useAnalyzeCIBILReport } from '~/lib/api/hooks';
import { useUser } from '~/lib/contexts/UserContext';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { Progress } from '~/components/ui/progress';
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

export default function CIBILAdvisorScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [cibilData, setCibilData] = useState(cibilAdvisorData);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const { financialProfile } = useUser();
  const analyzeCIBILMutation = useAnalyzeCIBILReport();

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh - in real app, this would fetch latest data
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const file = result.assets[0];
        setUploadedFile({
          name: file.name,
          uri: file.uri,
          size: file.size || 0,
          type: file.mimeType || 'application/pdf',
        });
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setHasAnalyzed(false);
    setCibilData(cibilAdvisorData);
  };

  const analyzeFile = async () => {
    if (!uploadedFile) {
      Alert.alert('No File', 'Please select a CIBIL report file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const fileData = {
        uri: uploadedFile.uri,
        name: uploadedFile.name,
        type: uploadedFile.type,
      };

      const result = await analyzeCIBILMutation.mutateAsync(fileData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      // Update the CIBIL data with API response
      setCibilData({
        current_score: result.current_score,
        factors: {
          credit_utilization: result.factors.credit_utilization,
          payment_history: result.factors.payment_history,
          credit_age: result.factors.credit_age,
          credit_mix: result.factors.credit_mix,
          recent_inquiries: result.factors.recent_inquiries,
        },
        recommendations: result.recommendations,
        improvement_potential: result.improvement_potential,
      });

      setHasAnalyzed(true);

      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);

    } catch (error: any) {
      setIsUploading(false);
      setUploadProgress(0);
      console.error('Analysis error:', error);
      Alert.alert('Analysis Failed', error?.message || 'Failed to analyze CIBIL report. Please try again.');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 750) return '#10B981';
    if (score >= 650) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 750) return 'Excellent';
    if (score >= 650) return 'Good';
    if (score >= 550) return 'Fair';
    return 'Poor';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 750) return ['#10B981', '#059669'];
    if (score >= 650) return ['#F59E0B', '#D97706'];
    return ['#EF4444', '#DC2626'];
  };

  const getScoreIcon = (score: number) => {
    if (score >= 750) return CheckCircle;
    if (score >= 650) return TrendingUp;
    return AlertCircle;
  };

  const factorIcons = {
    'Payment History': Clock,
    'Credit Utilization': CreditCard,
    'Credit Age': Calendar,
    'Credit Mix': Users,
    'Recent Inquiries': Search,
  };

  const factorColors = {
    'Payment History': '#10B981',
    'Credit Utilization': '#3B82F6',
    'Credit Age': '#8B5CF6',
    'Credit Mix': '#F59E0B',
    'Recent Inquiries': '#EF4444',
  };

  const ScoreIcon = getScoreIcon(cibilData.current_score);
  const scoreColor = getScoreColor(cibilData.current_score);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Credit Score</Text>
            <Text style={styles.headerSubtitle}>Monitor and improve your creditworthiness</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton}>
            <Activity size={20} color="#10B981" />
          </TouchableOpacity>
        </View>
      </View>

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
        {/* File Upload Section */}
        <View style={styles.uploadSection}>
          <Text style={styles.uploadTitle}>Upload CIBIL Report</Text>
          <Text style={styles.uploadSubtitle}>Upload your CIBIL credit report for detailed analysis</Text>
          
          {!uploadedFile ? (
            <View style={styles.uploadCard}>
              <View style={styles.uploadIcon}>
                <FileText size={32} color="#10B981" />
              </View>
              <Text style={styles.uploadText}>No file selected</Text>
              <Text style={styles.uploadHint}>PDF format only</Text>
              <Button onPress={pickFile} disabled={isUploading} style={styles.uploadButton}>
                <Text style={styles.uploadButtonText}>Select CIBIL Report</Text>
              </Button>
            </View>
          ) : (
            <View style={styles.uploadedFileCard}>
              <View style={styles.fileInfo}>
                <View style={styles.fileIcon}>
                  <FileText size={20} color="#10B981" />
                </View>
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName} numberOfLines={1}>{uploadedFile.name}</Text>
                  <Text style={styles.fileSize}>
                    {uploadedFile.size > 0 ? `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                  </Text>
                </View>
                <TouchableOpacity onPress={removeFile} disabled={isUploading} style={styles.removeButton}>
                  <X size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
              
              {isUploading && (
                <View style={styles.progressContainer}>
                  <Text style={styles.uploadProgressText}>Analyzing report...</Text>
                  <Progress value={uploadProgress} style={styles.uploadProgressBar} />
                </View>
              )}
              
              {!isUploading && !hasAnalyzed && (
                <Button onPress={analyzeFile} style={styles.analyzeButton}>
                  <Text style={styles.analyzeButtonText}>Analyze Report</Text>
                </Button>
              )}
              
              {hasAnalyzed && (
                <View style={styles.analyzedBadge}>
                  <CheckCircle size={16} color="#10B981" />
                  <Text style={styles.analyzedText}>Analysis Complete</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Credit Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <Text style={styles.cardTitle}>Your Credit Score</Text>
            <View style={styles.lastUpdated}>
              <Clock size={14} color="#94A3B8" />
              <Text style={styles.lastUpdatedText}>Updated today</Text>
            </View>
          </View>

          <View style={styles.scoreDisplay}>
            <View style={[styles.scoreCircle, { borderColor: `${scoreColor}20` }]}>
              <View style={[styles.scoreInner, { backgroundColor: `${scoreColor}10` }]}>
                <Text style={[styles.scoreNumber, { color: scoreColor }]}>
                  {cibilData.current_score}
                </Text>
                <Text style={[styles.scoreMax, { color: scoreColor }]}>/900</Text>
              </View>
            </View>
            
            <View style={styles.scoreInfo}>
              <View style={[styles.scoreBadge, { backgroundColor: `${scoreColor}15` }]}>
                <ScoreIcon size={16} color={scoreColor} />
              <Text style={[styles.scoreLabel, { color: scoreColor }]}>
                {getScoreLabel(cibilData.current_score)}
              </Text>
              </View>
              
              <Text style={styles.scoreDescription}>
                {cibilData.current_score >= 750 
                  ? "Excellent! You qualify for the best rates." 
                  : cibilData.current_score >= 650 
                  ? "Good score. Room for improvement to get better rates."
                  : "Needs improvement. Focus on building credit health."}
              </Text>
            </View>
          </View>

          {/* Credit Utilization */}
          <View style={styles.utilizationSection}>
            <View style={styles.utilizationHeader}>
              <Text style={styles.utilizationLabel}>Credit Utilization</Text>
              <Text style={[styles.utilizationValue, {
                color: cibilData.factors.credit_utilization > 30 ? '#EF4444' : '#10B981'
              }]}>
                {cibilData.factors.credit_utilization}%
              </Text>
            </View>
            <View style={styles.utilizationBarContainer}>
              <View style={styles.utilizationBar}>
                <View 
                    style={[
                      styles.utilizationFill,
                      { 
                        width: `${Math.min(cibilData.factors.credit_utilization, 100)}%`,
                        backgroundColor: cibilData.factors.credit_utilization > 30 ? '#EF4444' : '#10B981'
                      }
                    ]}
                />
              </View>
              <View style={styles.utilizationMarkers}>
                <View style={[styles.marker, { left: '30%' }]}>
                  <Text style={styles.markerText}>30%</Text>
                </View>
              </View>
            </View>
            <Text style={styles.utilizationTip}>
              Keep below 30% for optimal score impact
            </Text>
          </View>
        </View>

        {/* Score Factors Grid */}
        <View style={styles.factorsSection}>
          <Text style={styles.sectionTitle}>Credit Score Factors</Text>
          <View style={styles.factorsGrid}>
            {Object.entries({
              'Payment History': cibilData.factors.payment_history,
              'Credit Utilization': `${cibilData.factors.credit_utilization}%`,
              'Credit Age': `${cibilData.factors.credit_age} years`,
              'Credit Mix': cibilData.factors.credit_mix,
              'Recent Inquiries': cibilData.factors.recent_inquiries,
            }).map(([factor, value], index) => {
              const IconComponent = factorIcons[factor as keyof typeof factorIcons];
              const color = factorColors[factor as keyof typeof factorColors];
              
              return (
                <TouchableOpacity key={factor} style={styles.factorCard}>
                  <View style={[styles.factorIcon, { backgroundColor: `${color}15` }]}>
                    <IconComponent size={20} color={color} />
                  </View>
                  <Text style={styles.factorName}>{factor}</Text>
                  <Text style={[styles.factorValue, { color: color }]}>{value}</Text>
                  <View style={styles.factorImpact}>
                    <View style={[styles.impactDot, { backgroundColor: color }]} />
                    <Text style={styles.impactText}>
                      {factor === 'Payment History' ? 'High Impact' :
                       factor === 'Credit Utilization' ? 'High Impact' :
                       factor === 'Credit Age' ? 'Medium Impact' :
                       factor === 'Credit Mix' ? 'Low Impact' :
                       'Low Impact'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* AI Recommendations */}
        <View style={styles.recommendationsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.recommendationsTitle}>
              <Lightbulb size={20} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Personalized Recommendations</Text>
            </View>
            <View style={styles.aiTag}>
              <Star size={12} color="#8B5CF6" />
              <Text style={styles.aiTagText}>AI Powered</Text>
            </View>
          </View>
          
          <View style={styles.recommendationsList}>
            {cibilData.recommendations.map((recommendation, index) => (
              <TouchableOpacity key={index} style={styles.recommendationCard}>
                <View style={styles.recommendationContent}>
                  <View style={[styles.recommendationIcon, {
                    backgroundColor: index % 3 === 0 ? '#10B98115' : 
                                   index % 3 === 1 ? '#3B82F615' : '#F59E0B15'
                  }]}>
                    <Target size={18} color={
                      index % 3 === 0 ? '#10B981' : 
                      index % 3 === 1 ? '#3B82F6' : '#F59E0B'
                    } />
                  </View>
                  <View style={styles.recommendationText}>
                    <Text style={styles.recommendationTitle}>
                      {index === 0 ? 'Payment Consistency' :
                       index === 1 ? 'Credit Utilization' :
                       index === 2 ? 'Credit Mix' :
                       `Tip ${index + 1}`}
                    </Text>
                    <Text style={styles.recommendationDescription}>{recommendation}</Text>
                  </View>
                  <ArrowRight size={16} color="#D1D5DB" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Improvement Timeline */}
        <View style={styles.improvementSection}>
          <Text style={styles.sectionTitle}>Improvement Potential</Text>
          <View style={styles.improvementCard}>
            <View style={styles.improvementHeader}>
              <View style={styles.improvementIcon}>
                <TrendingUp size={24} color="#10B981" />
              </View>
              <View style={styles.improvementInfo}>
                <Text style={styles.improvementTitle}>Score can improve by</Text>
                <Text style={styles.improvementValue}>+{cibilData.improvement_potential} points</Text>
                <Text style={styles.improvementTimeframe}>In 3-6 months with consistent efforts</Text>
              </View>
            </View>
            
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${(cibilData.improvement_potential / 100) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {cibilData.improvement_potential}% improvement potential
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.actionCard, styles.primaryAction]}
              onPress={pickFile}
              disabled={isUploading}
            >
              <View style={styles.actionIcon}>
                <Upload size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionTitle}>Upload New Report</Text>
              <Text style={styles.actionSubtitle}>Analyze another CIBIL report</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, styles.secondaryAction]}
              onPress={() => Alert.alert('Info', 'Learn more about CIBIL feature will be available soon!')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#3B82F615' }]}>
                <BookOpen size={20} color="#3B82F6" />
              </View>
              <Text style={[styles.actionTitle, { color: '#3B82F6' }]}>Learn More</Text>
              <Text style={[styles.actionSubtitle, { color: '#64748B' }]}>Credit education</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  refreshButton: {
    padding: 12,
    backgroundColor: '#10B98115',
    borderRadius: 999,
  },
  scrollView: {
    flex: 1,
  },
  uploadSection: {
    paddingHorizontal: getResponsivePadding(),
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
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
    marginBottom: spacing.lg,
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F1F5F9',
    borderStyle: 'dashed',
    ...shadow.sm,
  },
  uploadIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#10B98115',
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  uploadText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: spacing.xs,
  },
  uploadHint: {
    fontSize: fontSizes.sm,
    color: '#94A3B8',
    marginBottom: spacing.lg,
  },
  uploadButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: fontSizes.sm,
  },
  uploadedFileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadow.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  fileIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#10B98115',
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
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
    padding: spacing.xs,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  uploadProgressText: {
    fontSize: fontSizes.sm,
    color: '#64748B',
    marginBottom: spacing.sm,
  },
  uploadProgressBar: {
    height: 6,
  },
  analyzeButton: {
    backgroundColor: '#10B981',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: fontSizes.sm,
  },
  analyzedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B98115',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  analyzedText: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: fontSizes.sm,
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    margin: getResponsivePadding(),
    ...shadow.lg,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: '#0F172A',
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastUpdatedText: {
    fontSize: fontSizes.xs,
    color: '#94A3B8',
  },
  scoreDisplay: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  scoreCircle: {
    width: isMobile ? 140 : 160,
    height: isMobile ? 140 : 160,
    borderRadius: isMobile ? 70 : 80,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scoreInner: {
    width: isMobile ? 100 : 120,
    height: isMobile ? 100 : 120,
    borderRadius: isMobile ? 50 : 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: isMobile ? 36 : 42,
    fontWeight: '800',
    lineHeight: isMobile ? 40 : 46,
  },
  scoreMax: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    opacity: 0.7,
  },
  scoreInfo: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  scoreLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  scoreDescription: {
    fontSize: fontSizes.sm,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: fontSizes.sm * 1.4,
  },
  utilizationSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  utilizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  utilizationLabel: {
    fontSize: fontSizes.sm,
    color: '#64748B',
    fontWeight: '600',
  },
  utilizationValue: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
  utilizationBarContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  utilizationBar: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    overflow: 'hidden',
  },
  utilizationFill: {
    height: '100%',
    borderRadius: 999,
  },
  utilizationMarkers: {
    position: 'absolute',
    top: 12,
    width: '100%',
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerText: {
    fontSize: fontSizes.xs,
    color: '#94A3B8',
    fontWeight: '600',
  },
  utilizationTip: {
    fontSize: fontSizes.xs,
    color: '#94A3B8',
    textAlign: 'center',
  },
  factorsSection: {
    paddingHorizontal: getResponsivePadding(),
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: spacing.md,
  },
  factorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  factorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: isMobile ? '48%' : '19%',
    ...shadow.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  factorIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  factorName: {
    fontSize: fontSizes.xs,
    color: '#64748B',
    marginBottom: 4,
  },
  factorValue: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  factorImpact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  impactDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  impactText: {
    fontSize: fontSizes.xs,
    color: '#94A3B8',
  },
  recommendationsSection: {
    paddingHorizontal: getResponsivePadding(),
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  recommendationsTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8B5CF615',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  aiTagText: {
    fontSize: fontSizes.xs,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  recommendationsList: {
    gap: spacing.sm,
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadow.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  recommendationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recommendationIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationText: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  recommendationDescription: {
    fontSize: fontSizes.sm,
    color: '#64748B',
    lineHeight: fontSizes.sm * 1.4,
  },
  improvementSection: {
    paddingHorizontal: getResponsivePadding(),
    marginBottom: spacing.lg,
  },
  improvementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadow.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  improvementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  improvementIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#10B98115',
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  improvementInfo: {
    flex: 1,
  },
  improvementTitle: {
    fontSize: fontSizes.sm,
    color: '#64748B',
    marginBottom: 2,
  },
  improvementValue: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 2,
  },
  improvementTimeframe: {
    fontSize: fontSizes.xs,
    color: '#94A3B8',
  },
  progressSection: {
    gap: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 999,
  },
  progressText: {
    fontSize: fontSizes.sm,
    color: '#64748B',
    textAlign: 'center',
  },
  quickActions: {
    paddingHorizontal: getResponsivePadding(),
    marginBottom: spacing.lg,
  },
  actionsGrid: {
    flexDirection: isMobile ? 'column' : 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: isMobile ? 0 : 1,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadow.md,
  },
  primaryAction: {
    backgroundColor: '#10B981',
  },
  secondaryAction: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F1F5F9',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: fontSizes.sm,
    color: 'rgba(255,255,255,0.8)',
  },
});
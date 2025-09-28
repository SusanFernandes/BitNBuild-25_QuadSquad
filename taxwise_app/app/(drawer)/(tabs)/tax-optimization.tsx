import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  Download, 
  AlertCircle,
  Shield,
  Heart,
  Gift,
  Home,
  CheckCircle,
  ArrowRight,
  Target,
  DollarSign,
  PieChart,
  FileText,
  Lightbulb,
} from 'lucide-react-native';
import { taxOptimizationData } from '~/lib/utils/fallbackData';
import { useAnalyzeTax } from '~/lib/api/hooks';
import { useUser } from '~/lib/contexts/UserContext';
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

export default function TaxOptimizationScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [taxData, setTaxData] = useState(taxOptimizationData);
  const [isLoading, setIsLoading] = useState(false);

  const { financialProfile } = useUser();
  const analyzeTaxMutation = useAnalyzeTax();

  const onRefresh = async () => {
    setRefreshing(true);
    await handleTaxAnalysis();
    setRefreshing(false);
  };

  const handleTaxAnalysis = async () => {
    if (!financialProfile?.annual_income) {
      Alert.alert('Missing Information', 'Please complete your profile with annual income to get personalized tax analysis.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await analyzeTaxMutation.mutateAsync({
        annual_income: financialProfile.annual_income,
        current_investments: financialProfile.current_investments,
      });
      setTaxData(response);
    } catch (error) {
      console.error('Tax analysis error:', error);
      Alert.alert('Error', 'Failed to analyze tax. Using fallback data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    Alert.alert('Info', 'Tax report download feature will be available soon!');
  };

  const handleCalculateTax = () => {
    Alert.alert('Tax Calculator', 'Opening advanced tax calculator...');
  };

  const savings = taxData.old_regime_tax - taxData.new_regime_tax;
  const isNewRegimeBetter = taxData.new_regime_tax < taxData.old_regime_tax;
  const savingsPercentage = ((Math.abs(savings) / taxData.old_regime_tax) * 100).toFixed(1);

  const deductionIcons = {
    '80C': Shield,
    '80D': Heart,
    '80G': Gift,
    '24b': Home,
  };

  const deductionColors = {
    '80C': '#3B82F6',
    '80D': '#EF4444',
    '80G': '#10B981',
    '24b': '#F59E0B',
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Tax Optimization</Text>
            <Text style={styles.headerSubtitle}>Maximize your savings for FY 2024-25</Text>
          </View>
          <TouchableOpacity 
            style={styles.calculatorButton}
            onPress={handleCalculateTax}
          >
            <Calculator size={20} color="#10B981" />
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
        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Analyzing your tax situation...</Text>
          </View>
        )}

        {/* Tax Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <View style={[styles.titleIcon, { backgroundColor: '#10B98115' }]}>
                <PieChart size={20} color="#10B981" />
              </View>
              <Text style={[styles.cardTitle, { fontSize: fontSizes.lg }]}>Tax Comparison</Text>
            </View>

          </View>

          {/* Comparison Cards */}
          <View style={styles.comparisonContainer}>
            <View style={[styles.regimeCard, !isNewRegimeBetter && styles.recommendedCard]}>
              <View style={styles.regimeHeader}>
                <Text style={styles.regimeTitle}>Old Regime</Text>
                {!isNewRegimeBetter && (
                  <View style={styles.recommendedTag}>
                    <Text style={styles.recommendedTagText}>Recommended</Text>
                  </View>
                )}
              </View>
              <Text style={styles.regimeAmount}>₹{taxData.old_regime_tax.toLocaleString('en-IN')}</Text>
              <Text style={styles.regimeSubtext}>With deductions</Text>
            </View>
            
            <View style={[styles.regimeCard, isNewRegimeBetter && styles.recommendedCard]}>
              <View style={styles.regimeHeader}>
                <Text style={styles.regimeTitle}>New Regime</Text>
                {isNewRegimeBetter && (
                  <View style={styles.recommendedTag}>
                    <Text style={styles.recommendedTagText}>Recommended</Text>
                  </View>
                )}
              </View>
              <Text style={styles.regimeAmount}>₹{taxData.new_regime_tax.toLocaleString('en-IN')}</Text>
              <Text style={styles.regimeSubtext}>Lower tax rates</Text>
            </View>
          </View>

          {/* Savings Highlight */}
          <View style={styles.savingsHighlight}>
            <View style={styles.savingsContent}>
              <View style={[styles.savingsIcon, { backgroundColor: savings > 0 ? '#10B98115' : '#EF444415' }]}>
                {savings > 0 ? 
                  <TrendingUp size={24} color="#10B981" /> : 
                  <TrendingDown size={24} color="#EF4444" />
                }
              </View>
              <View style={styles.savingsText}>
                <Text style={styles.savingsLabel}>
                  {savings > 0 ? 'You can save' : 'Additional tax'}
                </Text>
                <Text style={[styles.savingsAmount, { color: savings > 0 ? '#10B981' : '#EF4444' }]}>
                  ₹{Math.abs(savings).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.savingsPercentage}>
                  {savingsPercentage}% {savings > 0 ? 'savings' : 'increase'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Deductions Grid */}
        <View style={styles.deductionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Deductions</Text>
            <Text style={styles.sectionSubtitle}>Maximize your tax benefits</Text>
          </View>
          
          <View style={styles.deductionsGrid}>
            {Object.entries(taxData.deductions_available).map(([section, amount], index) => {
              const IconComponent = deductionIcons[section];
              const color = deductionColors[section];
              
              return (
                <TouchableOpacity key={section} style={styles.deductionCard}>
                  <View style={[styles.deductionIcon, { backgroundColor: `${color}15` }]}>
                    <IconComponent size={20} color={color} />
                  </View>
                  <Text style={styles.deductionSection}>Section {section}</Text>
                  <Text style={styles.deductionAmount}>₹{amount.toLocaleString('en-IN')}</Text>
                  <Text style={styles.deductionDescription}>
                    {section === '80C' && 'Investments & Insurance'}
                    {section === '80D' && 'Health Insurance'}
                    {section === '80G' && 'Charitable Donations'}
                    {section === '24b' && 'Home Loan Interest'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* AI Recommendations */}
        <View style={styles.recommendationsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.recommendationsTitle}>
              <Lightbulb size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>AI Recommendations</Text>
            </View>
            <View style={styles.aiTag}>
              <Text style={styles.aiTagText}>Powered by AI</Text>
            </View>
          </View>
          
          <View style={styles.recommendationsList}>
            {taxData.recommendations.map((recommendation, index) => (
              <TouchableOpacity key={index} style={styles.recommendationCard}>
                <View style={styles.recommendationContent}>
                  <View style={[styles.recommendationNumber, { backgroundColor: index % 2 === 0 ? '#10B98115' : '#3B82F615' }]}>
                    <Text style={[styles.recommendationNumberText, { color: index % 2 === 0 ? '#10B981' : '#3B82F6' }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={styles.recommendationText}>{recommendation}</Text>
                  <ArrowRight size={16} color="#D1D5DB" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleDownloadReport}
          >
            <Download size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Download Tax Report</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleCalculateTax}
          >
            <Calculator size={20} color="#10B981" />
            <Text style={styles.secondaryButtonText}>Tax Calculator</Text>
          </TouchableOpacity>
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
  calculatorButton: {
    padding: 12,
    backgroundColor: '#10B98115',
    borderRadius: borderRadius.full,
  },
  scrollView: {
    flex: 1,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    margin: getResponsivePadding(),
    ...shadow.lg,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: '700',
    color: '#0F172A',
  },
  recommendationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  recommendationText: {
    color: '#FFFFFF',
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  comparisonContainer: {
    flexDirection: isMobile ? 'column' : 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  regimeCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  recommendedCard: {
    borderColor: '#10B981',
    backgroundColor: '#10B98108',
  },
  regimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  regimeTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: '#64748B',
  },
  recommendedTag: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  recommendedTagText: {
    fontSize: fontSizes.xs,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  regimeAmount: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  regimeSubtext: {
    fontSize: fontSizes.xs,
    color: '#94A3B8',
  },
  savingsHighlight: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  savingsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  savingsIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingsText: {
    flex: 1,
  },
  savingsLabel: {
    fontSize: fontSizes.sm,
    color: '#64748B',
    marginBottom: 2,
  },
  savingsAmount: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    marginBottom: 2,
  },
  savingsPercentage: {
    fontSize: fontSizes.xs,
    color: '#94A3B8',
  },
  deductionsSection: {
    paddingHorizontal: getResponsivePadding(),
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: fontSizes.sm,
    color: '#64748B',
  },
  deductionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  deductionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: isMobile ? '48%' : '23%',
    ...shadow.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  deductionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  deductionSection: {
    fontSize: fontSizes.xs,
    color: '#64748B',
    marginBottom: 4,
  },
  deductionAmount: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  deductionDescription: {
    fontSize: fontSizes.xs,
    color: '#94A3B8',
    lineHeight: fontSizes.xs * 1.3,
  },
  recommendationsSection: {
    paddingHorizontal: getResponsivePadding(),
    marginBottom: spacing.lg,
  },
  recommendationsTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  aiTag: {
    backgroundColor: '#F59E0B15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  aiTagText: {
    fontSize: fontSizes.xs,
    color: '#F59E0B',
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
  recommendationNumber: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationNumberText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  recommendationText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: '#334155',
    lineHeight: fontSizes.sm * 1.4,
  },
  actionButtons: {
    paddingHorizontal: getResponsivePadding(),
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadow.sm,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: '#10B981',
    ...shadow.sm,
  },
  secondaryButtonText: {
    color: '#10B981',
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginHorizontal: getResponsivePadding(),
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: fontSizes.sm,
    color: '#64748B',
  },
});
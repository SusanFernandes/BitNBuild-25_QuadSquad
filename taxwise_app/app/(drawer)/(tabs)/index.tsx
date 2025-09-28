import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  TrendingUp,
  Shield,
  PiggyBank,
  CreditCard,
  ChevronRight,
  Upload,
  MessageCircle,
  Sparkles,
  Target,
  Bell,
  User,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { dashboardData } from '~/lib/utils/fallbackData';
import {
  isMobile,
  isTablet,
  isDesktop,
  getGridColumns,
  getCardWidth,
  getResponsivePadding,
  spacing,
  fontSizes,
  borderRadius,
  shadow,
  layout,
  textStyles
} from '~/lib/utils/responsive';

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const cards = dashboardData.cards.map(card => ({
    ...card,
    icon: card.icon === 'TrendingUp' ? TrendingUp :
          card.icon === 'Shield' ? Shield :
          card.icon === 'PiggyBank' ? PiggyBank :
          CreditCard,
  }));

  const gridColumns = getGridColumns();
  const cardWidth = getCardWidth(gridColumns);

  return (
    <SafeAreaView style={styles.container}>
 

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#10B981"
            colors={['#10B981']}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Stats Overview */}
        <View style={styles.statsOverview}>
          <Text style={styles.sectionTitle}>Financial Overview</Text>
          <View style={styles.gridContainer}>
            {cards.map((card, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.gridCard,
                  isMobile ? styles.mobileGridCard : styles.desktopGridCard,
                ]}
                onPress={() => router.push(card.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: `${card.color}15` }]}>
                    <card.icon size={isMobile ? 22 : 26} color={card.color} />
                  </View>
                  <View style={[styles.chevronContainer, { backgroundColor: '#F9FAFB' }]}>
                    <ChevronRight size={16} color="#9CA3AF" />
                  </View>
                </View>
                <Text style={[styles.cardTitle, { fontSize: fontSizes.sm }]}>{card.title}</Text>
                <Text style={[styles.cardSubtitle, { fontSize: fontSizes.xs }]}>{card.subtitle}</Text>
                <Text style={[styles.cardValue, { fontSize: isMobile ? fontSizes.xl : fontSizes.xxl }]}>{card.value}</Text>
                <View style={styles.changeContainer}>
                  <View style={[styles.changePill, { backgroundColor: `${card.color}15` }]}>
                    <TrendingUp size={12} color={card.color} />
                    <Text style={[styles.cardChange, { color: card.color, fontSize: fontSizes.xs }]}>
                      {card.change}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Enhanced Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryAction]}
              onPress={() => router.push('/upload')}
              activeOpacity={0.8}
            >
              <View style={styles.actionIcon}>
                <Upload size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.actionButtonText}>Upload Documents</Text>
              <Text style={styles.actionSubtext}>Tax forms, receipts</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={() => router.push('/ai')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#8B5CF615' }]}>
                <Sparkles size={20} color="#8B5CF6" />
              </View>
              <Text style={[styles.actionButtonText, { color: '#8B5CF6' }]}>AI Assistant</Text>
              <Text style={[styles.actionSubtext, { color: '#6B7280' }]}>Get financial advice</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Goals Section */}
        <View style={styles.goalsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Financial Goals</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View style={[styles.goalIcon, { backgroundColor: '#F59E0B15' }]}>
                <Target size={20} color="#F59E0B" />
              </View>
              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>Emergency Fund</Text>
                <Text style={styles.goalSubtitle}>₹2,50,000 / ₹5,00,000</Text>
              </View>
              <Text style={styles.goalPercentage}>50%</Text>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: '50%', backgroundColor: '#F59E0B' }]} />
              </View>
            </View>
          </View>

          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View style={[styles.goalIcon, { backgroundColor: '#06B6D415' }]}>
                <PiggyBank size={20} color="#06B6D4" />
              </View>
              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>Retirement Planning</Text>
                <Text style={styles.goalSubtitle}>₹15,00,000 / ₹50,00,000</Text>
              </View>
              <Text style={styles.goalPercentage}>30%</Text>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressBar, { width: '30%', backgroundColor: '#06B6D4' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Enhanced AI Insights */}
        <View style={styles.insights}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Insights</Text>
            <View style={styles.aiIndicator}>
              <Sparkles size={16} color="#8B5CF6" />
              <Text style={styles.aiText}>Powered by AI</Text>
            </View>
          </View>
          
          {dashboardData.insights.map((insight, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.insightCard}
              activeOpacity={0.9}
            >
              <View style={styles.insightHeader}>
                <View style={[styles.insightIcon, { backgroundColor: index % 2 === 0 ? '#10B98115' : '#F59E0B15' }]}>
                  <Sparkles size={18} color={index % 2 === 0 ? '#10B981' : '#F59E0B'} />
                </View>
                <ChevronRight size={16} color="#D1D5DB" />
              </View>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightText}>{insight.text}</Text>
              <View style={styles.insightFooter}>
                <Text style={styles.insightTime}>2 hours ago</Text>
                <View style={styles.priorityBadge}>
                  <Text style={styles.priorityText}>High Priority</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
  welcomeText: {
    fontSize: fontSizes.sm,
    color: '#64748B',
    marginBottom: 2,
  },
  userName: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: '#0F172A',
  },
  profileButton: {
    position: 'relative',
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.full,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  statsOverview: {
    paddingHorizontal: getResponsivePadding(),
    paddingTop: spacing.lg,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    marginHorizontal: -spacing.xs, // Negative margin to offset card margins
  },
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadow.lg,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    margin: spacing.xs, // Small margin between cards
  },
  mobileGridCard: {
    width: (width - (getResponsivePadding() * 2) - (spacing.xs * 4)) / 2, // 2 columns on mobile
  },
  desktopGridCard: {
    width: (width - (getResponsivePadding() * 2) - (spacing.xs * 8)) / 4, // 4 columns on desktop/tablet
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: isMobile ? 44 : 48,
    height: isMobile ? 44 : 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronContainer: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#64748B',
    marginBottom: spacing.sm,
  },
  cardValue: {
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: spacing.sm,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  cardChange: {
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewAllText: {
    fontSize: fontSizes.sm,
    color: '#10B981',
    fontWeight: '600',
  },
  quickActions: {
    paddingHorizontal: getResponsivePadding(),
    paddingTop: spacing.xl,
  },
  actionButtons: {
    flexDirection: isMobile ? 'column' : 'row',
    gap: spacing.md,
  },
  actionButton: {
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
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: fontSizes.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  actionSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSizes.sm,
  },
  goalsSection: {
    paddingHorizontal: getResponsivePadding(),
    paddingTop: spacing.xl,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  goalSubtitle: {
    fontSize: fontSizes.sm,
    color: '#64748B',
  },
  goalPercentage: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  insights: {
    paddingHorizontal: getResponsivePadding(),
    paddingTop: spacing.xl,
  },
  aiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8B5CF615',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  aiText: {
    fontSize: fontSizes.xs,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: spacing.sm,
  },
  insightText: {
    fontSize: fontSizes.sm,
    color: '#64748B',
    lineHeight: fontSizes.sm * 1.5,
    marginBottom: spacing.md,
  },
  insightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightTime: {
    fontSize: fontSizes.xs,
    color: '#94A3B8',
  },
  priorityBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  priorityText: {
    fontSize: fontSizes.xs,
    color: '#D97706',
    fontWeight: '600',
  },
});
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { ArrowLeft, Edit3, TrendingUp, TrendingDown } from 'lucide-react-native';
import { router } from 'expo-router';
import { useFinanceStore, Transaction } from '~/store/financeStore';
import { transactionsData } from '~/lib/utils/fallbackData';
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

const categories = ['Income', 'EMI', 'SIP', 'Rent', 'Insurance', 'Food', 'Shopping', 'Other'];

export default function TransactionsScreen() {
  const { updateTransactionCategory } = useFinanceStore();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Use static data
  const displayTransactions = transactionsData.map(t => ({
    id: t.id,
    date: t.date,
    description: t.description,
    amount: t.amount,
    category: t.category as Transaction['category'],
    type: t.type as Transaction['type'],
  }));

  const handleCategoryChange = (category: Transaction['category']) => {
    if (selectedTransaction) {
      updateTransactionCategory(selectedTransaction.id, category);
      setModalVisible(false);
      setSelectedTransaction(null);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const openCategoryModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={[
      styles.transactionItem,
      {
        width: isMobile ? '100%' : '48%',
        marginRight: isMobile ? 0 : spacing.sm,
        marginBottom: spacing.sm,
      }
    ]}>
      <View style={styles.transactionLeft}>
        <View
          style={[
            styles.transactionIcon,
            { backgroundColor: item.type === 'credit' ? '#DCFCE7' : '#FEF2F2' },
          ]}
        >
          {item.type === 'credit' ? (
            <TrendingUp size={isMobile ? 14 : 16} color="#10B981" />
          ) : (
            <TrendingDown size={isMobile ? 14 : 16} color="#EF4444" />
          )}
        </View>
        <View style={styles.transactionDetails}>
          <Text style={[styles.transactionDescription, { fontSize: fontSizes.sm }]}>
            {item.description}
          </Text>
          <Text style={[styles.transactionDate, { fontSize: fontSizes.xs }]}>
            {new Date(item.date).toLocaleDateString('en-IN')}
          </Text>
          <View style={styles.categoryContainer}>
            <Text style={[styles.categoryText, { fontSize: fontSizes.xs }]}>
              {item.category}
            </Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => openCategoryModal(item)}
            >
              <Edit3 size={isMobile ? 10 : 12} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          { 
            color: item.type === 'credit' ? '#10B981' : '#EF4444',
            fontSize: isMobile ? fontSizes.sm : fontSizes.md,
          },
        ]}
      >
        {item.type === 'credit' ? '+' : '-'}₹{Math.abs(item.amount).toLocaleString('en-IN')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={isMobile ? 20 : 24} color="#111827" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: fontSizes.xl }]}>Transactions</Text>
        <View style={{ width: isMobile ? 20 : 24 }} />
      </View>

      <FlatList
        data={displayTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={[styles.listContent, {
          padding: getResponsivePadding(),
        }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        numColumns={isMobile ? 1 : 2}
        key={isMobile ? 'single' : 'double'}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { fontSize: fontSizes.h3 }]}>Select Category</Text>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryOption,
                  selectedTransaction?.category === category && styles.selectedCategory,
                ]}
                onPress={() => handleCategoryChange(category as Transaction['category'])}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    selectedTransaction?.category === category && styles.selectedCategoryText,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontWeight: '600',
    color: '#111827',
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: spacing.sm,
  },
  transactionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadow.sm,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: isMobile ? 28 : 32,
    height: isMobile ? 28 : 32,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  transactionDate: {
    color: '#6B7280',
    marginBottom: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryText: {
    color: '#10B981',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    fontWeight: '500',
  },
  editButton: {
    padding: 2,
  },
  transactionAmount: {
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: getResponsivePadding(),
    minHeight: 300,
  },
  modalTitle: {
    ...textStyles.h3,
    color: '#111827',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  categoryOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    backgroundColor: '#F9FAFB',
  },
  selectedCategory: {
    backgroundColor: '#10B981',
  },
  categoryOptionText: {
    ...textStyles.body,
    color: '#111827',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...textStyles.body,
    color: '#6B7280',
  },
});
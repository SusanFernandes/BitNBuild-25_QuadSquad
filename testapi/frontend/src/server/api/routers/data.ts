// dataRouter.ts
import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

export const dataRouter = createTRPCRouter({
  // Get all knowledge base entries with optional filtering (public data)
  getKnowledgeBase: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const entries = await ctx.db.knowledge_base.findMany({
        where: input.category ? { category: input.category } : undefined,
        take: input.limit,
        skip: input.offset,
        orderBy: { last_updated: "desc" },
        select: {
          id: true,
          title: true,
          content: true,
          category: true,
          source_url: true,
          last_updated: true,
          created_at: true,
        },
      });
      return entries;
    }),

  // Search knowledge base (public data)
  searchKnowledgeBase: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        category: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const entries = await ctx.db.knowledge_base.findMany({
        where: {
          AND: [
            {
              OR: [
                { title: { contains: input.query } },
                { content: { contains: input.query } },
              ],
            },
            input.category ? { category: input.category } : {},
          ],
        },
        take: input.limit,
        orderBy: { last_updated: "desc" },
        select: {
          id: true,
          title: true,
          content: true,
          category: true,
          source_url: true,
          last_updated: true,
        },
      });
      return entries;
    }),

  // Get knowledge base categories (public data)
  getKnowledgeCategories: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db.knowledge_base.findMany({
      select: { category: true },
      distinct: ["category"],
      where: { category: { not: null } },
    });
    return categories.map((c) => c.category).filter(Boolean);
  }),

  // Get user's transaction analytics
  getUserTransactionAnalytics: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        category: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const transactions = await ctx.db.transactions.findMany({
        where: {
          user_id: input.userId,
          date: {
            gte: input.dateFrom,
            lte: input.dateTo,
          },
          category: input.category,
        },
        select: {
          amount: true,
          category: true,
          subcategory: true,
          transaction_type: true,
          date: true,
        },
        orderBy: { date: "desc" },
      });

      // Aggregate by category
      const categoryTotals = transactions.reduce((acc, tx) => {
        const category = tx.category || "Unknown";
        acc[category] = (acc[category] || 0) + tx.amount;
        return acc;
      }, {} as Record<string, number>);

      return {
        transactions,
        categoryTotals,
        totalAmount: transactions.reduce((sum, tx) => sum + tx.amount, 0),
        count: transactions.length,
      };
    }),

  // Get user's file upload statistics
  getUserFileStats: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const stats = await ctx.db.file_uploads.groupBy({
        by: ["file_type", "processing_status"],
        where: { user_id: input.userId },
        _count: { id: true },
        _sum: { file_size: true },
      });

      const totalFiles = await ctx.db.file_uploads.count({
        where: { user_id: input.userId },
      });

      const totalSize = await ctx.db.file_uploads.aggregate({
        where: { user_id: input.userId },
        _sum: { file_size: true },
      });

      return {
        stats,
        totalFiles,
        totalSize: totalSize._sum.file_size || 0,
      };
    }),

  // Get user's recent activities
  getUserRecentActivities: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get recent transactions
      const recentTransactions = await ctx.db.transactions.findMany({
        where: { user_id: input.userId },
        take: input.limit,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          description: true,
          amount: true,
          created_at: true,
        },
      });

      // Get recent file uploads
      const recentUploads = await ctx.db.file_uploads.findMany({
        where: { user_id: input.userId },
        take: input.limit,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          filename: true,
          file_type: true,
          processing_status: true,
          created_at: true,
        },
      });

      // Get recent chat history
      const recentChats = await ctx.db.chat_history.findMany({
        where: { user_id: input.userId },
        take: input.limit,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          query: true,
          created_at: true,
        },
      });

      return {
        transactions: recentTransactions,
        uploads: recentUploads,
        chats: recentChats,
      };
    }),

  // Get user's CIBIL data
  getUserCibilData: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const cibilData = await ctx.db.cibil_data.findMany({
        where: { user_id: input.userId },
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          current_score: true,
          credit_utilization: true,
          payment_history_score: true,
          number_of_accounts: true,
          credit_age_months: true,
          hard_inquiries: true,
          analysis_data: true,
          recommendations: true,
          created_at: true,
        },
      });

      return cibilData;
    }),

  // Get user's tax data
  getUserTaxData: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        financialYear: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const taxData = await ctx.db.tax_data.findMany({
        where: {
          user_id: input.userId,
          financial_year: input.financialYear,
        },
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          financial_year: true,
          total_income: true,
          taxable_income: true,
          old_regime_tax: true,
          new_regime_tax: true,
          deductions: true,
          recommendations: true,
          report_path: true,
          created_at: true,
        },
      });

      return taxData;
    }),

  // Get user's chat history
  getUserChatHistory: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const chatHistory = await ctx.db.chat_history.findMany({
        where: { user_id: input.userId },
        take: input.limit,
        skip: input.offset,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          query: true,
          response: true,
          context_used: true,
          created_at: true,
        },
      });

      const totalCount = await ctx.db.chat_history.count({
        where: { user_id: input.userId },
      });

      return {
        chats: chatHistory,
        totalCount,
      };
    }),

  // Search user's transactions
  searchUserTransactions: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const transactions = await ctx.db.transactions.findMany({
        where: {
          user_id: input.userId,
          description: { contains: input.query },
        },
        take: input.limit,
        orderBy: { date: "desc" },
        select: {
          id: true,
          date: true,
          amount: true,
          description: true,
          transaction_type: true,
          category: true,
          subcategory: true,
        },
      });

      return transactions;
    }),

  // Get user's financial trends (monthly aggregation)
  getUserFinancialTrends: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        months: z.number().min(1).max(24).default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - input.months);

      const transactions = await ctx.db.transactions.findMany({
        where: {
          user_id: input.userId,
          date: {
            gte: startDate,
          },
        },
        select: {
          amount: true,
          transaction_type: true,
          date: true,
          category: true,
        },
        orderBy: { date: "asc" },
      });

      // Group by month
      const monthlyData = transactions.reduce((acc, tx) => {
        const monthKey = tx.date.toISOString().slice(0, 7); // YYYY-MM
        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthKey,
            income: 0,
            expense: 0,
            total: 0,
          };
        }

        if (tx.transaction_type === "credit" || tx.amount > 0) {
          acc[monthKey].income += Math.abs(tx.amount);
        } else {
          acc[monthKey].expense += Math.abs(tx.amount);
        }
        acc[monthKey].total += tx.amount;

        return acc;
      }, {} as Record<string, any>);

      return Object.values(monthlyData);
    }),

  // Get user's transaction categories
  getUserTransactionCategories: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const categories = await ctx.db.transactions.findMany({
        where: { user_id: input.userId },
        select: {
          category: true,
          subcategory: true,
        },
        distinct: ["category", "subcategory"],
      });

      const grouped = categories.reduce((acc, item) => {
        const category = item.category || "Unknown";
        if (!acc[category]) {
          acc[category] = new Set();
        }
        if (item.subcategory) {
          acc[category].add(item.subcategory);
        }
        return acc;
      }, {} as Record<string, Set<string>>);

      // Convert Sets to arrays
      const result = Object.entries(grouped).map(([category, subcategories]) => ({
        category,
        subcategories: Array.from(subcategories),
      }));

      return result;
    }),

  // System-wide statistics (admin only - no user filtering)
  getSystemStats: publicProcedure.query(async ({ ctx }) => {
    const [
      totalUsers,
      totalTransactions,
      totalFiles,
      knowledgeBaseEntries,
      totalChatHistories,
    ] = await Promise.all([
      ctx.db.users.count(),
      ctx.db.transactions.count(),
      ctx.db.file_uploads.count(),
      ctx.db.knowledge_base.count(),
      ctx.db.chat_history.count(),
    ]);

    return {
      totalUsers,
      totalTransactions,
      totalFiles,
      knowledgeBaseEntries,
      totalChatHistories,
    };
  }),
});


// src/app/stats/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

interface UserStats {
  username: string;
  id: string;
}

export default function StatsPage() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // tRPC queries
  const { data: recentActivities, isLoading: activitiesLoading } = api.data.getUserRecentActivities.useQuery(
    { userId: userStats?.id || "", limit: 5 },
    { enabled: !!userStats?.id }
  );

  const { data: transactionAnalytics, isLoading: analyticsLoading } = api.data.getUserTransactionAnalytics.useQuery(
    { userId: userStats?.id || "" },
    { enabled: !!userStats?.id }
  );

  const { data: fileStats, isLoading: fileStatsLoading } = api.data.getUserFileStats.useQuery(
    { userId: userStats?.id || "" },
    { enabled: !!userStats?.id }
  );

  const { data: financialTrends, isLoading: trendsLoading } = api.data.getUserFinancialTrends.useQuery(
    { userId: userStats?.id || "", months: 6 },
    { enabled: !!userStats?.id }
  );

  const { data: cibilData, isLoading: cibilLoading } = api.data.getUserCibilData.useQuery(
    { userId: userStats?.id || "" },
    { enabled: !!userStats?.id }
  );

  useEffect(() => {
    // Function to get cookie value by name
    const getCookie = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
      }
      return null;
    };

    // Check if user is logged in by checking cookies or localStorage
    const username = getCookie('username');
    const userId = getCookie('userId') || localStorage.getItem('userId');

    if (!username) {
      // If no username found, redirect to home page
      router.push('/');
      return;
    }

    // Set user stats
    setUserStats({
      username,
      id: userId || 'Not Available'
    });

    setLoading(false);
  }, [router]);

  const handleSignOut = () => {
    // Clear cookies and localStorage
    document.cookie = 'username=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'userId=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    localStorage.removeItem('userId');

    // Redirect to home page
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!userStats) {
    return null; // This will briefly show while redirecting
  }

  const isDataLoading = activitiesLoading || analyticsLoading || fileStatsLoading || trendsLoading || cibilLoading;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="flex justify-between items-start mb-8">
            <h1 className="text-3xl font-bold text-gray-800">User Dashboard</h1>
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>

          {/* User Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h2 className="text-xl font-semibold text-blue-800 mb-2">Username</h2>
              <p className="text-2xl font-bold text-blue-600">{userStats.username}</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h2 className="text-xl font-semibold text-green-800 mb-2">User ID</h2>
              <p className="text-2xl font-bold text-green-600">{userStats.id}</p>
            </div>
          </div>

          {isDataLoading ? (
            <div className="text-center py-8">
              <div className="text-lg text-gray-600">Loading your data...</div>
            </div>
          ) : (
            <>
              {/* Transaction Analytics */}
              {transactionAnalytics && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Transaction Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <h3 className="text-lg font-semibold text-purple-800">Total Transactions</h3>
                      <p className="text-2xl font-bold text-purple-600">{transactionAnalytics.count}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h3 className="text-lg font-semibold text-yellow-800">Total Amount</h3>
                      <p className="text-2xl font-bold text-yellow-600">
                        ₹{transactionAnalytics.totalAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                      <h3 className="text-lg font-semibold text-indigo-800">Categories</h3>
                      <p className="text-2xl font-bold text-indigo-600">
                        {Object.keys(transactionAnalytics.categoryTotals).length}
                      </p>
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  {Object.keys(transactionAnalytics.categoryTotals).length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Category Breakdown</h3>
                      <div className="space-y-2">
                        {Object.entries(transactionAnalytics.categoryTotals).map(([category, amount]) => (
                          <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <span className="font-medium">{category}</span>
                            <span className="font-bold text-green-600">₹{amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* File Statistics */}
              {fileStats && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">File Statistics</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                      <h3 className="text-lg font-semibold text-teal-800">Total Files</h3>
                      <p className="text-2xl font-bold text-teal-600">{fileStats.totalFiles}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h3 className="text-lg font-semibold text-orange-800">Total Size</h3>
                      <p className="text-2xl font-bold text-orange-600">
                        {(fileStats.totalSize / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* CIBIL Score */}
              {cibilData && cibilData.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Credit Score</h2>
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-700">Current Score</h3>
                        <p className="text-3xl font-bold text-green-600">
                          {cibilData[0].current_score || 'N/A'}
                        </p>
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-700">Credit Utilization</h3>
                        <p className="text-2xl font-bold text-blue-600">
                          {cibilData[0].credit_utilization ? `${(cibilData[0].credit_utilization * 100).toFixed(1)}%` : 'N/A'}
                        </p>
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-700">Payment History</h3>
                        <p className="text-2xl font-bold text-purple-600">
                          {cibilData[0].payment_history_score || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Activities */}
              {recentActivities && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Activity</h2>
                  <div className="space-y-4">
                    {recentActivities.transactions.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Recent Transactions</h3>
                        <div className="space-y-2">
                          {recentActivities.transactions.map((tx) => (
                            <div key={tx.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                              <span className="font-medium">{tx.description}</span>
                              <div className="text-right">
                                <span className="font-bold text-green-600">₹{tx.amount}</span>
                                <div className="text-sm text-gray-500">
                                  {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : 'N/A'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {recentActivities.uploads.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Recent Uploads</h3>
                        <div className="space-y-2">
                          {recentActivities.uploads.map((upload) => (
                            <div key={upload.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                              <span className="font-medium">{upload.filename}</span>
                              <div className="text-right">
                                <span className="text-blue-600">{upload.file_type}</span>
                                <div className="text-sm text-gray-500">{upload.processing_status}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Financial Trends */}
              {financialTrends && financialTrends.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">6-Month Financial Trend</h2>
                  <div className="space-y-3">
                    {financialTrends.map((trend) => (
                      <div key={trend.month} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <span className="font-semibold text-gray-700">{trend.month}</span>
                        <div className="flex space-x-6">
                          <div className="text-center">
                            <div className="text-sm text-gray-600">Income</div>
                            <div className="font-bold text-green-600">₹{trend.income.toLocaleString()}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-600">Expense</div>
                            <div className="font-bold text-red-600">₹{trend.expense.toLocaleString()}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-600">Net</div>
                            <div className={`font-bold ${trend.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ₹{trend.total.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Account Information */}
          <div className="mt-8 bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Information</h2>
            <div className="space-y-2">
              <p className="text-gray-600">
                <span className="font-medium">Login Status:</span>
                <span className="text-green-600 ml-2">✓ Authenticated</span>
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Session:</span>
                <span className="text-blue-600 ml-2">Active</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { AdminUser, getAllUsers, getUserMonthlyUsage, upgradeUserToPro, downgradeUserToFree } from '../../services/adminService';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterType = 'all' | 'free' | 'pro';

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usageMap, setUsageMap] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Загрузить пользователей
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers);

      // Загрузить статистику для каждого
      const usageData: Record<string, number> = {};
      for (const user of allUsers) {
        const count = await getUserMonthlyUsage(user.id);
        usageData[user.id] = count;
      }
      setUsageMap(usageData);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const handleUpgrade = async (userId: string) => {
    setActionLoading(userId);
    try {
      await upgradeUserToPro(userId);
      await loadUsers(); // Перезагрузить список
    } catch (error) {
      alert('Не удалось повысить пользователя');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDowngrade = async (userId: string) => {
    if (!confirm('Понизить пользователя до FREE?')) return;

    setActionLoading(userId);
    try {
      await downgradeUserToFree(userId);
      await loadUsers();
    } catch (error) {
      alert('Не удалось понизить пользователя');
    } finally {
      setActionLoading(null);
    }
  };

  // Фильтрация
  const filteredUsers = users.filter(user => {
    if (filter === 'all') return true;
    return user.subscription_tier === filter;
  });

  const freeCount = users.filter(u => u.subscription_tier === 'free').length;
  const proCount = users.filter(u => u.subscription_tier === 'pro').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative w-[800px] bg-white shadow-2xl h-full flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#000080] to-blue-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <i className="ph ph-shield text-white text-2xl"></i>
              <h2 className="text-white text-xl font-bold">Админ-панель</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <i className="ph ph-x text-2xl"></i>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-[#000080] text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Все ({users.length})
            </button>
            <button
              onClick={() => setFilter('free')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'free'
                  ? 'bg-[#000080] text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Free ({freeCount})
            </button>
            <button
              onClick={() => setFilter('pro')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'pro'
                  ? 'bg-[#000080] text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              PRO ({proCount})
            </button>
          </div>
        </div>

        {/* User Table */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <i className="ph ph-spinner animate-spin text-3xl"></i>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Тариф</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Использовано</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Дата регистрации</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.subscription_tier === 'pro'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.subscription_tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {usageMap[user.id] || 0} / {user.subscription_tier === 'pro' ? '∞' : '5'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {user.subscription_tier === 'free' ? (
                        <button
                          onClick={() => handleUpgrade(user.id)}
                          disabled={actionLoading === user.id}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === user.id ? (
                            <i className="ph ph-spinner animate-spin"></i>
                          ) : (
                            'Upgrade → PRO'
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDowngrade(user.id)}
                          disabled={actionLoading === user.id}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === user.id ? (
                            <i className="ph ph-spinner animate-spin"></i>
                          ) : (
                            'Downgrade → FREE'
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{users.length}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Всего пользователей</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">{freeCount}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Free tier</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{proCount}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">PRO tier</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

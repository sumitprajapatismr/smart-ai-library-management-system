import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Search, CheckCircle2, AlertTriangle, HelpCircle, X, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import { useToast } from './Toast';

interface NotificationsDrawerProps {
  notifications: any[];
  onClose: () => void;
  onRefresh: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ notifications, onClose, onRefresh }) => {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'due' | 'borrow'>('all');

  const handleMarkRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.put('/notifications/read-all');
      if (res.data.success) {
        showToast('All notifications marked as read', 'success');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = notifications.filter(n => {
    // Search match
    const msgMatch = n.message.toLowerCase().includes(search.toLowerCase());
    
    // Tab Filter match
    if (filter === 'unread') return !n.isRead && msgMatch;
    if (filter === 'due') return n.type === 'due' && msgMatch;
    if (filter === 'borrow') return n.type === 'borrow' && msgMatch;
    
    return msgMatch;
  });

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-slate-950/20 dark:bg-slate-950/50 backdrop-blur-xs" onClick={onClose} />
      
      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white dark:bg-slate-900 border-l border-slate-205 dark:border-slate-800 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2 text-slate-850 dark:text-slate-100">
            <Bell className="w-5 h-5 text-brand-600" />
            <h3 className="font-extrabold text-sm tracking-tight">Notification Center</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-[10px] uppercase font-bold text-brand-655 hover:underline cursor-pointer"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-655 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-850/80 space-y-2">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search alert histories..."
              className="form-input text-[11px] pl-8 py-1.5 rounded-lg"
            />
          </div>

          {/* Toggle pill buttons */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'due', label: 'Dues' },
              { id: 'borrow', label: 'Loans' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-2.5 py-1 text-[9px] uppercase font-bold tracking-wider rounded-lg border transition-all cursor-pointer ${
                  filter === tab.id
                    ? 'bg-brand-600 text-white border-brand-650'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-205 dark:border-slate-750'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <HelpCircle className="w-8 h-8 mx-auto opacity-20 mb-2 animate-pulse" />
              <p className="text-xs">No matching alerts found</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item._id}
                onClick={() => !item.isRead && handleMarkRead(item._id)}
                className={`p-4 flex gap-3 cursor-pointer transition-colors relative ${
                  !item.isRead 
                    ? 'bg-brand-500/5 hover:bg-slate-50 dark:hover:bg-slate-800/40' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  item.type === 'due'
                    ? 'bg-rose-500/10 text-rose-500'
                    : item.type === 'borrow'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-indigo-500/10 text-indigo-500'
                }`}>
                  {item.type === 'due' ? (
                    <AlertTriangle className="w-4 h-4 animate-bounce" />
                  ) : item.type === 'borrow' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <ShieldAlert className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-normal ${!item.isRead ? 'font-bold text-slate-800 dark:text-slate-150' : 'text-slate-500'}`}>
                    {item.message}
                  </p>
                  <span className="text-[9px] text-slate-400 dark:text-slate-550 block mt-1.5">
                    {new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                
                {!item.isRead && (
                  <span className="w-2 h-2 rounded-full bg-brand-500 absolute top-4 right-4" />
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>
    </>
  );
};

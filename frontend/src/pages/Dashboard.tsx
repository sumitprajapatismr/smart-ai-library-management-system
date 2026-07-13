import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Users, Bookmark, FileClock, ShieldAlert, 
  ArrowUpRight, Sparkles, RefreshCw, HelpCircle, AlertCircle,
  TrendingUp, Award, Library
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { BookCard } from '../components/BookCard';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  LineChart, Line, CartesianGrid 
} from 'recharts';
import { AdminDashboard } from './AdminDashboard';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentStats, setStudentStats] = useState<any>(null);
  const [staffStats, setStaffStats] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recentNotifs, setRecentNotifs] = useState<any[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string>('');

  const loadStudentDashboard = async () => {
    try {
      // 1. Fetch student stats
      const statsRes = await api.get('/dashboard/student');
      if (statsRes.data.success) {
        setStudentStats(statsRes.data.stats);
      }

      // 2. Fetch AI Recommendations
      const recRes = await api.get('/ai/recommendations');
      if (recRes.data.success) {
        setRecommendations(recRes.data.recommendations || []);
      }

      // 3. Fetch notifications
      const notifRes = await api.get('/notifications');
      if (notifRes.data.success) {
        setRecentNotifs(notifRes.data.notifications.slice(0, 4));
      }

      // Get reading suggestion summary
      generateAiReadingSuggestion();

    } catch (err) {
      console.error('Error loading student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAiReadingSuggestion = async () => {
    // Simulate AI reading advice based on wishlist/borrows count to show premium features
    setAiSuggestions("ALPHA's Analysis: You have a keen interest in literature. Based on your current wishlist, we suggest exploring more books in **Technology** or **Data Structures** to balance your humanities focus. Complete your active books to maintain a healthy study rhythm!");
  };

  const loadStaffDashboard = async () => {
    try {
      const statsRes = await api.get('/dashboard/staff');
      if (statsRes.data.success) {
        setStaffStats(statsRes.data);
      }
    } catch (err) {
      console.error('Error loading staff dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'student') {
      loadStudentDashboard();
    } else if (user?.role === 'librarian' || user?.role === 'admin') {
      loadStaffDashboard();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading your personalized dashboard...</p>
      </div>
    );
  }

  // ==================== STUDENT DASHBOARD VIEW ====================
  if (user?.role === 'student') {
    return (
      <div className="space-y-8 page-fade-in">
        {/* Welcome Message Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-650 p-6 md:p-8 text-white shadow-lg">
          <div className="absolute top-0 right-0 translate-x-[10%] translate-y-[-10%] w-[350px] h-[350px] rounded-full bg-white/10 blur-[80px] pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              AI Powered Library
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Hello, {user.name}!
            </h2>
            <p className="text-sm text-brand-100/90 mt-2 leading-relaxed">
              Explore smart semantic book searches, get personalized AI suggestions, and view your borrow history in real-time. Need help? Click the sparkles icon in the corner to chat with **ALPHA**!
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Borrows</span>
            <div className="flex items-baseline justify-between mt-4">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{studentStats?.activeBorrows || 0}</span>
              <BookOpen className="w-5 h-5 text-indigo-500" />
            </div>
            <Link to="/history" className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline mt-4 inline-flex items-center gap-0.5">
              View return details
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Reservations</span>
            <div className="flex items-baseline justify-between mt-4">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{studentStats?.pendingReservations || 0}</span>
              <Bookmark className="w-5 h-5 text-indigo-550" />
            </div>
            <Link to="/history" className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline mt-4 inline-flex items-center gap-0.5">
              Check holds
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">My Wishlist</span>
            <div className="flex items-baseline justify-between mt-4">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{studentStats?.wishlistCount || 0}</span>
              <Award className="w-5 h-5 text-indigo-500" />
            </div>
            <Link to="/search" className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline mt-4 inline-flex items-center gap-0.5">
              Add books
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className={`glass-card p-5 rounded-2xl flex flex-col justify-between border ${
            studentStats?.unpaidFinesAmount > 0 
              ? 'border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/2' 
              : ''
          }`}>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Unpaid Fines</span>
            <div className="flex items-baseline justify-between mt-4">
              <span className={`text-3xl font-extrabold ${studentStats?.unpaidFinesAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                ${studentStats?.unpaidFinesAmount ? studentStats.unpaidFinesAmount.toFixed(2) : '0.00'}
              </span>
              <ShieldAlert className={`w-5 h-5 ${studentStats?.unpaidFinesAmount > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
            </div>
            <Link to="/history" className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline mt-4 inline-flex items-center gap-0.5">
              Clear balance
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* AI Recommendations Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              AI Recommendations
            </h3>
            <button 
              onClick={loadStudentDashboard} 
              className="p-1 text-slate-450 hover:text-slate-650 dark:hover:text-slate-200 transition-colors"
              title="Refresh suggestions"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recommendations.slice(0, 4).map((rec, index) => (
              <div key={rec.book?._id || index} className="flex flex-col">
                <BookCard book={rec.book} />
                {rec.reason && (
                  <div className="mt-3 p-3 bg-brand-500/5 dark:bg-brand-550/2 border border-brand-500/15 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 leading-normal flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{rec.reason}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AI Reading suggestion & Notifications Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI suggestion */}
          <div className="lg:col-span-2 glass-card p-6 rounded-3xl flex flex-col justify-between bg-gradient-to-tr from-white via-white to-brand-50/10 dark:from-slate-900 dark:to-slate-900">
            <div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-405" />
                AI Reading Suggestions & Analysis
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {aiSuggestions}
              </p>
            </div>
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Analysis updated today</span>
              <Link to="/search" className="btn-primary py-2 px-4 text-xs font-semibold rounded-lg shadow-sm">
                Explore Tech Catalog
              </Link>
            </div>
          </div>

          {/* Quick Notifications Widget */}
          <div className="glass-card p-6 rounded-3xl flex flex-col">
            <h4 className="font-bold text-base text-slate-900 dark:text-white mb-4">Recent Alerts</h4>
            <div className="flex-1 space-y-3.5">
              {recentNotifs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6">
                  <AlertCircle className="w-8 h-8 opacity-20 mb-2" />
                  <span className="text-xs">No alerts yet</span>
                </div>
              ) : (
                recentNotifs.map((notif) => (
                  <div key={notif._id} className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/20 dark:border-slate-800/50 rounded-xl text-xs flex gap-2">
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notif.type === 'due' ? 'bg-rose-500' : 'bg-brand-500'}`} />
                    <p className="text-slate-600 dark:text-slate-350 leading-normal">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== LIBRARIAN / ADMIN DASHBOARD VIEW ====================
  return <AdminDashboard />;
};

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  BookOpen, LayoutDashboard, Search, History, User, 
  Settings, LogOut, Bell, Sun, Moon, Menu, X, 
  Users, BookMarked, BarChart3, Receipt, HelpCircle, 
  Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Mail, Calendar, Brain
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { ChatAssistant } from './ChatAssistant';
import { NotificationsDrawer } from './NotificationsDrawer';
import api from '../services/api';
import { AnimatePresence, motion } from 'framer-motion';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Apply dark mode theme
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Fetch user notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.notifications.filter((n: any) => !n.isRead).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 45 seconds
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      const res = await api.put('/notifications/read-all');
      if (res.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        showToast('All notifications marked as read', 'success');
      }
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleNotificationClick = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'info');
    navigate('/login');
  };

  // Close mobile drawer on route transition
  useEffect(() => {
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  // Define sidebar menu options based on role
  const getNavItems = () => {
    if (!user) return [];

    const common = [
      { path: '/profile', label: 'My Profile', icon: User },
      { path: '/about', label: 'About ALPHA', icon: HelpCircle },
      { path: '/contact', label: 'Contact Dev', icon: Mail },
    ];

    if (user.role === 'student') {
      return [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/search', label: 'Search Books', icon: Search },
        { path: '/history', label: 'Borrow History & Fines', icon: History },
        { path: '/ai-suite', label: 'AI Study Hub', icon: Sparkles },
        { path: '/ai-research-assistant', label: 'AI Research Assistant', icon: Brain },
        { path: '/research', label: 'Research Hub', icon: BookOpen },
        { path: '/events', label: 'Events & Timelines', icon: Calendar },
        ...common
      ];
    }

    if (user.role === 'librarian') {
      return [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/books-mgmt', label: 'Book Catalog', icon: BookMarked },
        { path: '/transactions', label: 'Check-In/Out Requests', icon: Receipt },
        { path: '/students-mgmt', label: 'Student Directory', icon: Users },
        { path: '/ai-research-assistant', label: 'AI Research Assistant', icon: Brain },
        { path: '/research', label: 'Research Hub', icon: BookOpen },
        { path: '/events', label: 'Events & Timelines', icon: Calendar },
        ...common
      ];
    }

    if (user.role === 'admin') {
      return [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/books-mgmt', label: 'Book Catalog', icon: BookMarked },
        { path: '/transactions', label: 'Check-In/Out Requests', icon: Receipt },
        { path: '/students-mgmt', label: 'Student Directory', icon: Users },
        { path: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
        { path: '/ai-research-assistant', label: 'AI Research Assistant', icon: Brain },
        { path: '/research', label: 'Research Hub', icon: BookOpen },
        { path: '/events', label: 'Events & Timelines', icon: Calendar },
        ...common,
        { path: '/settings', label: 'System Settings', icon: Settings },
      ];
    }

    return common;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200">
      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200/50 dark:border-slate-900 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shrink-0">
        {/* Brand Logo */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-200/50 dark:border-slate-900/50">
          <div className="p-2 bg-gradient-to-tr from-brand-600 to-brand-400 text-white rounded-xl shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-slate-900 dark:text-white leading-none tracking-tight flex items-center gap-1.5">
              LibraSmart
            </h1>
            <span className="text-[10px] text-brand-500 font-bold uppercase tracking-wider">AI Library Management</span>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/10'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? '' : 'text-slate-400 dark:text-slate-550 group-hover:text-slate-600'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-900/50">
          <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-900/40 rounded-2xl mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-base capitalize shadow-inner">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-250 truncate">{user?.name}</h4>
              <span className="text-[10px] capitalize font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-brand-500" />
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100/50 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-250/20 dark:border-rose-900/30 rounded-xl text-xs font-semibold cursor-pointer active:scale-98 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Navbar */}
        <header className="h-16 px-4 lg:px-8 border-b border-slate-200/50 dark:border-slate-900 bg-white/70 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / Title */}
            <div className="hidden sm:block">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-550 capitalize">Smart Library</span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                {location.pathname.substring(1).replace('-', ' ') || 'Dashboard'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Light / Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-550 text-white font-bold text-[9px] flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <NotificationsDrawer
                    notifications={notifications}
                    onClose={() => setNotificationsOpen(false)}
                    onRefresh={fetchNotifications}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Mobile User Profile Button */}
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm capitalize sm:hidden">
              {user?.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Dynamic Outlet Views */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Chat Assistant */}
      {user && <ChatAssistant />}

      {/* Mobile Sidebar Slide-out Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Drawer Backdrop */}
            <div className="absolute inset-0 bg-slate-950/30 dark:bg-slate-950/60 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
            
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-r border-slate-200 dark:border-slate-800"
            >
              {/* Drawer Logo */}
              <div className="h-16 px-6 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-600 text-white rounded-xl">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h1 className="font-extrabold text-base text-slate-900 dark:text-white leading-none">LibraSmart</h1>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Links */}
              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-md'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Drawer User Card */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-900/40 rounded-2xl mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-base capitalize">
                    {user?.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200 truncate">{user?.name}</h4>
                    <span className="text-[10px] capitalize font-bold text-slate-400">{user?.role}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100/50 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-450 rounded-xl text-xs font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

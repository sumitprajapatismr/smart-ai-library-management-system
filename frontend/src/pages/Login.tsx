import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, BookOpen, AlertCircle, ArrowRight, UserCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Set default role based on query param if present
  const defaultRole = searchParams.get('role') || 'student';
  const [activeRole, setActiveRole] = useState<string>(defaultRole);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Pre-fill fields whenever the selected role tab changes
  useEffect(() => {
    const emailMap: Record<string, string> = {
      student: 'student@university.edu',
      librarian: 'librarian@university.edu',
      admin: 'admin@university.edu',
    };
    setValue('email', emailMap[activeRole] || '');
    setValue('password', 'password123');
  }, [activeRole, setValue]);

  const isExpired = searchParams.get('expired') === 'true';

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      showToast(`${activeRole.toUpperCase()} logged in successfully`, 'success');
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Invalid email or password';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic branding configurations
  const themeStyles: Record<string, {
    glow: string;
    logo: string;
    btn: string;
    text: string;
    title: string;
  }> = {
    student: {
      glow: 'bg-brand-500/5',
      logo: 'from-brand-600 to-brand-500 shadow-brand-500/20',
      btn: 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/20 focus:ring-brand-500',
      text: 'text-brand-600 dark:text-brand-400',
      title: 'Student Portal',
    },
    librarian: {
      glow: 'bg-emerald-500/5',
      logo: 'from-emerald-600 to-emerald-500 shadow-emerald-500/20',
      btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 focus:ring-emerald-550',
      text: 'text-emerald-600 dark:text-emerald-450',
      title: 'Librarian Portal',
    },
    admin: {
      glow: 'bg-indigo-500/5',
      logo: 'from-indigo-650 to-indigo-550 shadow-indigo-500/20',
      btn: 'bg-indigo-650 hover:bg-indigo-750 shadow-indigo-600/20 focus:ring-indigo-500',
      text: 'text-indigo-600 dark:text-indigo-400',
      title: 'Admin Console',
    },
  };

  const style = themeStyles[activeRole] || themeStyles.student;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 relative overflow-hidden font-sans">
      {/* Background shape layers based on selected tab */}
      <div className={`absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-colors duration-500 ${style.glow}`} />
      <div className={`absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-colors duration-500 ${style.glow}`} />

      <div className="max-w-md w-full z-10 page-slide-up">
        {/* Logo and Titles */}
        <div className="flex flex-col items-center mb-6">
          <div className={`p-3.5 bg-gradient-to-tr text-white rounded-2xl shadow-lg mb-3 transition-all duration-500 ${style.logo}`}>
            {activeRole === 'student' && <BookOpen className="w-6 h-6" />}
            {activeRole === 'librarian' && <UserCheck className="w-6 h-6" />}
            {activeRole === 'admin' && <ShieldAlert className="w-6 h-6" />}
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-all duration-300">
            {style.title}
          </h2>
          <p className="text-xs text-slate-450 mt-1.5">Smart AI Powered Library Management System</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-2xl mb-6 border border-slate-200/50 dark:border-slate-850 shadow-inner">
          {(['student', 'librarian', 'admin'] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setActiveRole(role)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold capitalize transition-all duration-300 cursor-pointer ${
                activeRole === role
                  ? role === 'student'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : role === 'librarian'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-indigo-650 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Form Card Container */}
        <div className="glass-card p-8 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-850 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md">
          {isExpired && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-650 dark:text-rose-455 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Your session has expired. Please log in again to continue.</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  placeholder="name@university.edu"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Please enter a valid email address',
                    },
                  })}
                  className={`form-input pl-11 focus:ring-2 ${errors.email ? 'border-rose-500 focus:ring-rose-500' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] font-medium text-rose-550 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-350 hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Password is required',
                  })}
                  className={`form-input pl-11 pr-11 focus:ring-2 ${errors.password ? 'border-rose-500 focus:ring-rose-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-655 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] font-medium text-rose-555 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-5 text-sm text-white font-semibold rounded-xl transition-all duration-300 shadow-md active:scale-95 disabled:opacity-50 disabled:scale-100 cursor-pointer ${style.btn}`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footnotes */}
          {activeRole === 'student' && (
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                New student?{' '}
                <Link
                  to="/register"
                  className={`font-bold hover:underline ${style.text}`}
                >
                  Create student card
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

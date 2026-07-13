import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, BookOpen, Loader2, ArrowRight } from 'lucide-react';
import api from '../services/api';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing. Please check your verification link.');
        return;
      }

      try {
        const res = await api.get(`/auth/verify-email/${token}`);
        if (res.data.success) {
          setStatus('success');
          setMessage(res.data.message || 'Your email address has been verified successfully!');
        }
      } catch (err: any) {
        console.error(err);
        setStatus('error');
        setMessage(err.response?.data?.message || 'Email verification failed. The link may have expired or is invalid.');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />
      
      <div className="max-w-md w-full z-10 page-slide-up text-center">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3.5 bg-gradient-to-tr from-brand-600 to-brand-500 text-white rounded-2xl shadow-lg mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Email Verification</h2>
        </div>

        {/* Verification Status Card */}
        <div className="glass-card p-8 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-850 flex flex-col items-center">
          {status === 'loading' && (
            <div className="py-6 flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-brand-600 dark:text-brand-400 animate-spin" />
              <p className="text-sm font-semibold text-slate-550 dark:text-slate-400">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-4 flex flex-col items-center gap-4">
              <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-405 rounded-full shadow-inner">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100">Verification Successful!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">{message}</p>
              
              <Link to="/login" className="btn-primary w-full mt-6">
                <span>Proceed to Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="py-4 flex flex-col items-center gap-4">
              <div className="p-4 bg-rose-500/10 text-rose-600 dark:text-rose-405 rounded-full shadow-inner">
                <AlertTriangle className="w-12 h-12" />
              </div>
              <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100">Verification Failed</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">{message}</p>
              
              <Link to="/login" className="btn-secondary w-full mt-6">
                <span>Back to Login</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

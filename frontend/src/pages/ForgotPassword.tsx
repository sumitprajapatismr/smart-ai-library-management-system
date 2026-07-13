import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, BookOpen, AlertCircle, ArrowRight, CheckCircle2, ChevronLeft } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export const ForgotPassword: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: data.email });
      if (res.data.success) {
        setSuccess(true);
        showToast('Password reset link sent to your email', 'success');
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to submit password reset request';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full z-10 page-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3.5 bg-gradient-to-tr from-brand-600 to-brand-500 text-white rounded-2xl shadow-lg mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Reset Password</h2>
          <p className="text-xs text-slate-400 mt-1.5">Recover your account access</p>
        </div>

        {/* Card Container */}
        <div className="glass-card p-8 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-850">
          {!success ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your email address. We'll verify it and send a secure 10-minute link to reset your password.
              </p>

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
                    className={`form-input pl-11 ${errors.email ? 'border-rose-500 focus:ring-rose-500' : ''}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] font-medium text-rose-550 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary mt-2"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending link...</span>
                  </div>
                ) : (
                  <>
                    <span>Request Reset Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-4 flex flex-col items-center gap-4">
              <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-full">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100">Check Your Email</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                If an account exists for that email, we have sent instructions to reset your password.
              </p>
            </div>
          )}

          {/* Go Back Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex justify-center">
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-505 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

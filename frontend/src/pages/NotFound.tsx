import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300 font-sans selection:bg-brand-500 selection:text-white">
      {/* Background glow elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-rose-500/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-brand-500/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="glass-card w-full max-w-md p-8 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-850/80 text-center space-y-6 relative z-10 page-slide-up">
        <div className="w-16 h-16 bg-rose-500/10 text-rose-550 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <AlertCircle className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-550 dark:text-rose-400">Error 404</span>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Index Page Not Found</h3>
          <p className="text-xs text-slate-500 leading-normal">
            The page catalog record you are looking for does not exist or has been archived. Double check the address or return home.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-850">
          <Link
            to="/"
            className="w-full btn-primary py-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Safety
          </Link>
        </div>
      </div>
    </div>
  );
};

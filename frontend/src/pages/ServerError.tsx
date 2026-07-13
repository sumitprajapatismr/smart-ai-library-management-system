import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export const ServerError: React.FC = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300 font-sans selection:bg-brand-500 selection:text-white">
      {/* Background glow elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-rose-500/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="glass-card w-full max-w-md p-8 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-850/80 text-center space-y-6 relative z-10 page-slide-up">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-500 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500 dark:text-amber-400">Error 500</span>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">System Core Offline</h3>
          <p className="text-xs text-slate-500 leading-normal">
            The database gateway or Express server is experiencing connection issues. Please check if the services are actively running and try again.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-850">
          <button
            onClick={handleRetry}
            className="w-full btn-primary py-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/10 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Retry System Core
          </button>
        </div>
      </div>
    </div>
  );
};

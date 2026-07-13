import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, ShieldCheck, Zap, BarChart3, Clock, ArrowRight, Library } from 'lucide-react';

export const Landing: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300 font-sans selection:bg-brand-500 selection:text-white">
      {/* Glow elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-accent-500/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 glass-nav backdrop-blur-md border-b border-slate-200/50 dark:border-slate-900/60 py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-brand-600 to-brand-500 text-white rounded-xl shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-brand-600 to-indigo-500 dark:from-brand-400 dark:to-indigo-300 bg-clip-text text-transparent">
              ALPHA
            </span>
            <span className="hidden sm:inline-block text-[10px] ml-1.5 uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-905 text-slate-500 border border-slate-200 dark:border-slate-800">
              Smart Library
            </span>
          </div>
        </div>

        {/* Desktop Menu links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-650 dark:text-slate-350">
          <a href="#hero" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Home</a>
          <a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Features</a>
          <a href="#about" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">About</a>
          <a href="#contact" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Contact</a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-350 hover:text-slate-905 dark:hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="btn-primary py-2 px-4 text-xs font-semibold rounded-lg shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 dark:bg-brand-500/5 text-brand-600 dark:text-brand-400 border border-brand-500/20 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Artificial Intelligence Enabled
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-slate-900 dark:text-white">
            Smart AI Powered <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500 dark:from-brand-400 dark:to-accent-400 bg-clip-text text-transparent">
              Library Management System
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
            Manage Books. Manage Students. Powered by Artificial Intelligence. 
            Experience a modern workspace featuring semantic searches, automated fine management, and personalized reading recommendations from assistant <strong>ALPHA</strong>.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/register"
              className="btn-primary py-3 px-6 text-sm flex items-center gap-2 group hover:shadow-lg hover:shadow-brand-500/15"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="btn-secondary py-3 px-6 text-sm border border-slate-200 dark:border-slate-800"
            >
              Student Portal
            </Link>
            <Link
              to="/login?role=librarian"
              className="px-4.5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              Librarian Portal
            </Link>
          </motion.div>
        </motion.div>

        {/* Hero Interactive Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative lg:ml-6"
        >
          {/* Glassmorphic Mockup Widget */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 shadow-2xl relative overflow-hidden bg-gradient-to-tr from-white/80 via-white/40 to-brand-50/20 dark:from-slate-900/80 dark:to-slate-950/20 backdrop-blur-lg">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl" />
            
            {/* Window header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/85">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <div className="px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg text-[10px] font-mono text-slate-455">
                ALPHA_CORE_ACTIVE
              </div>
            </div>

            {/* Mock Chat Interface */}
            <div className="mt-4 space-y-4">
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-xs shrink-0">
                  S
                </div>
                <div className="bg-slate-100 dark:bg-slate-900/85 p-3 rounded-2xl rounded-tl-none text-xs text-slate-600 dark:text-slate-350 max-w-[80%]">
                  Recommend some Java programming books.
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <div className="bg-brand-600 text-white p-3 rounded-2xl rounded-tr-none text-xs max-w-[85%] space-y-2 leading-relaxed shadow-sm">
                  <div className="flex items-center gap-1 font-bold text-[10px] text-amber-300">
                    <Sparkles className="w-3 h-3" />
                    ALPHA
                  </div>
                  <p>Based on your interests, I recommend:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-brand-100">
                    <li><strong>Effective Java</strong> (Joshua Bloch)</li>
                    <li><strong>Clean Code</strong> (Robert C. Martin)</li>
                    <li><strong>Head First Java</strong> (Kathy Sierra)</li>
                  </ul>
                </div>
                <div className="w-7 h-7 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  A
                </div>
              </div>

              {/* Statistics Chart Preview */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/85">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reading Progress Analytics</span>
                  <span className="text-[10px] font-bold text-emerald-500">+14% This Month</span>
                </div>
                <div className="h-16 flex items-end gap-1.5 pt-2">
                  <div className="w-full h-8 bg-slate-200 dark:bg-slate-800 rounded-t-sm" />
                  <div className="w-full h-12 bg-slate-200 dark:bg-slate-800 rounded-t-sm" />
                  <div className="w-full h-6 bg-slate-200 dark:bg-slate-800 rounded-t-sm" />
                  <div className="w-full h-14 bg-brand-500/80 rounded-t-sm" />
                  <div className="w-full h-16 bg-brand-500 rounded-t-sm" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 md:px-12 py-20 border-t border-slate-200/50 dark:border-slate-900/60">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Premium Features for Modern Libraries
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            ALPHA brings high-speed cloud infrastructure and artificial intelligence to your school or community library.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-850 hover:-translate-y-1 transition-all duration-300">
            <div className="p-3 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl w-fit mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">AI Assistant ALPHA</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Interact with a custom intelligence trained in library operations. ALPHA helps students summarize materials, check deadlines, calculate fines, and select novels.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-850 hover:-translate-y-1 transition-all duration-300">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl w-fit mb-4">
              <Library className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-905 dark:text-slate-100 mb-2">Semantic Smart Search</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Find files and books through natural queries. Simply type "Recommend Java books for beginners" or "Artificial Intelligence algorithms" to get perfect recommendations.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-850 hover:-translate-y-1 transition-all duration-300">
            <div className="p-3 bg-cyan-500/10 text-cyan-500 rounded-xl w-fit mb-4">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Advanced Analytics</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Administrators and librarians can track active checkouts, overdue logs, category counts, and fine collections via interactive charts and downloadable PDF ledger reports.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-855 hover:-translate-y-1 transition-all duration-300">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl w-fit mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Role-Based Dashboard</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Specific, clean user interfaces for Admins, Librarians, and Students. Features include check-in/check-out, reservations, settings, catalog edits, and security logs.
            </p>
          </div>

          {/* Card 5 */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-850 hover:-translate-y-1 transition-all duration-300">
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl w-fit mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Realtime Alerts</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Immediate Socket.io updates for database transactions, borrow success notifications, return verifications, and automated overdue fine alerts right in the panel.
            </p>
          </div>

          {/* Card 6 */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200/40 dark:border-slate-850 hover:-translate-y-1 transition-all duration-300">
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl w-fit mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Self-Service Reservations</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Reserve copies when out of stock. The system automatically places holds and locks available books, notifying students via email when ready for desk pickup.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 py-12 px-6 md:px-12 text-center text-xs text-slate-400">
        <p className="font-semibold text-slate-600 dark:text-slate-400 mb-2">
          Smart AI Powered Library Management System — Created by Sumit Prajapati
        </p>
        <p>&copy; {new Date().getFullYear()} ALPHA Core System. All rights reserved.</p>
      </footer>
    </div>
  );
};

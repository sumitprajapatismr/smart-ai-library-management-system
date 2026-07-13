import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, Sparkles, Code2, Cpu, GraduationCap, 
  Mail, Calendar, ArrowUpRight, CheckCircle2 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export const About: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  const techStack = {
    Frontend: ['React 19', 'Vite', 'Tailwind CSS', 'Framer Motion', 'Recharts', 'React Hook Form'],
    Backend: ['Node.js', 'Express.js', 'Socket.io', 'JSON Web Token (JWT)', 'Bcrypt'],
    Database: ['MongoDB', 'Mongoose ODM'],
    AI: ['Google Gemini Pro API', 'Natural Language Understanding']
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300 font-sans pb-16 selection:bg-brand-500 selection:text-white">
      {/* Background glow elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Header */}
      <nav className="sticky top-0 z-50 glass-nav backdrop-blur-md border-b border-slate-200/50 dark:border-slate-900/60 py-4 px-6 md:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-brand-600 to-brand-500 text-white rounded-xl shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-brand-600 to-indigo-500 dark:from-brand-400 dark:to-indigo-300 bg-clip-text text-transparent">
            ALPHA Smart Library
          </span>
        </Link>
        <div className="flex gap-4">
          <Link to="/" className="text-xs font-semibold text-slate-600 dark:text-slate-350 hover:text-brand-550">Home</Link>
          <Link to="/contact" className="text-xs font-semibold text-slate-600 dark:text-slate-350 hover:text-brand-550">Contact</Link>
          <Link to="/login" className="btn-primary py-1.5 px-4 text-[10px] font-semibold rounded-lg">Sign In</Link>
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-6 md:px-12 pt-12 relative z-10 space-y-16">
        
        {/* Title Intro */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 max-w-2xl mx-auto"
        >
          <span className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 text-xs font-bold uppercase tracking-wider">
            Project Overview
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
            Smart AI Powered <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-cyan-550 dark:from-brand-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Library Management System
            </span>
          </h2>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            An enterprise-level, production-ready library intelligence workspace featuring natural language semantic searching, real-time transaction synchronization, automated fine calculators, and personalized study suites led by virtual assistant <strong>ALPHA</strong>.
          </p>
        </motion.div>

        {/* Section 1: Objectives & Architecture */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 rounded-3xl space-y-4">
            <GraduationCap className="w-8 h-8 text-brand-600" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Project Objectives</h3>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Seamless Cataloging:</strong> Digitize library indexing with quick imports and exports of catalog data sheets.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>AI Study Assistant:</strong> Provide context-aware search, book comparisons, instant study explanations, quizzes, and automated flashcards.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Robust Administration:</strong> Automate loan pipelines, approval logs, fee balances, and ledger exports for librarians.</span>
              </li>
            </ul>
          </motion.div>

          <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 rounded-3xl space-y-4">
            <Cpu className="w-8 h-8 text-cyan-600" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">MERN Architecture</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Designed using a strict clean architecture separating Concerns:
            </p>
            <div className="space-y-3 font-semibold text-xs">
              <div className="flex justify-between p-2 bg-slate-100 dark:bg-slate-900/60 rounded-xl">
                <span className="text-slate-500">Frontend View Layer</span>
                <span className="text-brand-655 dark:text-brand-400">React 19 + Vite</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-100 dark:bg-slate-900/60 rounded-xl">
                <span className="text-slate-500">API Gateway Server</span>
                <span className="text-cyan-600 dark:text-cyan-400">Express.js + Node.js</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-100 dark:bg-slate-900/60 rounded-xl">
                <span className="text-slate-500">Storage & Indexes</span>
                <span className="text-emerald-650 dark:text-emerald-450">MongoDB + Mongoose</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-100 dark:bg-slate-900/60 rounded-xl">
                <span className="text-slate-500">Real-Time Sync</span>
                <span className="text-amber-600 dark:text-amber-400">Socket.io Engine</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Section 2: Technology Stack & Grid */}
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Production Tech Stack</h3>
            <p className="text-xs text-slate-400 mt-1">Enterprise-grade technologies and libraries utilized</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(techStack).map(([category, items]) => (
              <div key={category} className="glass-card p-5 rounded-2xl border border-slate-200/50 dark:border-slate-850 bg-white/40 dark:bg-slate-900/30">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">{category}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item) => (
                    <span key={item} className="text-[10px] font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded-md text-slate-600 dark:text-slate-350">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Developer Card (Sumit Prajapati) */}
        <div className="max-w-xl mx-auto">
          <div className="glass-card p-8 rounded-3xl border border-slate-200/60 dark:border-brand-500/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-6 items-center">
            {/* Design accents */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />

            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-cyan-500 text-white flex items-center justify-center font-bold text-3xl shadow-lg shrink-0">
              SP
            </div>
            
            <div className="space-y-4 flex-1 text-center md:text-left">
              <div>
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-brand-600 dark:text-brand-400">Project Architect</span>
                <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">Sumit Prajapati</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Full Stack MERN Developer</p>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center justify-center md:justify-start gap-1 font-semibold">
                  <GraduationCap className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                  Dr. A.P.J. Abdul Kalam Technical University
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
                <span className="text-slate-300 dark:text-slate-800">|</span>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </a>
                <span className="text-slate-300 dark:text-slate-800">|</span>
                <a 
                  href="mailto:prajapatisumitop@gmail.com"
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Timeline & Future Scope */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-550" />
              Project Development Timeline
            </h3>
            <div className="space-y-4 relative border-l border-slate-200 dark:border-slate-850 ml-2 pl-4">
              <div className="relative">
                <span className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-brand-500 border border-white dark:border-slate-950" />
                <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">Phase 1 - Database Architecture</span>
                <p className="text-xs text-slate-500 mt-0.5">Implemented schema relations, indices, JWT setups, and email configurations.</p>
              </div>
              <div className="relative">
                <span className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-brand-500 border border-white dark:border-slate-950" />
                <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">Phase 2 - Core Operations</span>
                <p className="text-xs text-slate-500 mt-0.5">Coded borrowing mechanisms, reservations, manual approvals, and real-time socket toasts.</p>
              </div>
              <div className="relative">
                <span className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-cyan-500 border border-white dark:border-slate-950" />
                <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">Phase 3 - AI Suite Deployment</span>
                <p className="text-xs text-slate-500 mt-0.5">Integrated ALPHA chatbot memory, AI planner, automated quizzes, explain engines, and comparison templates.</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-cyan-550" />
              Future Roadmap Scope
            </h3>
            <ul className="space-y-3 text-xs text-slate-500 dark:text-slate-400 leading-normal">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                <span><strong>Multi-lingual Voice Interface:</strong> Extend Voice Search commands to transcribe multiple languages dynamically.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                <span><strong>Facial Recognition Logs:</strong> Deploy webcam-based user identification for quick touchless library check-in counters.</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                <span><strong>Unified IoT Lockers:</strong> Hook physical book cabinet locks to book checkouts emitting GPIO events via sockets.</span>
              </li>
            </ul>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-slate-200/50 dark:border-slate-900/50 text-center text-xs text-slate-400">
        <p>Smart AI Powered Library Management System — Created by Sumit Prajapati</p>
        <p className="mt-1 text-[10px] opacity-70">&copy; {new Date().getFullYear()} All Rights Reserved.</p>
      </footer>
    </div>
  );
};

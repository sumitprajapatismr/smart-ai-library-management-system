import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Send, Mail, User, Info, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export const Contact: React.FC = () => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      showToast('Please fill out all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/dashboard/contact', {
        name,
        email,
        subject,
        message,
      });

      if (res.data.success) {
        showToast('Your message has been sent successfully!', 'success');
        setSuccess(true);
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not send message. Please try again.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-550 transition-colors duration-300 font-sans pb-16 relative">
      {/* Background glow elements */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[130px] pointer-events-none" />

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
          <Link to="/" className="text-xs font-semibold text-slate-655 dark:text-slate-300 hover:text-brand-550">Home</Link>
          <Link to="/about" className="text-xs font-semibold text-slate-655 dark:text-slate-300 hover:text-brand-550">About</Link>
          <Link to="/login" className="btn-primary py-1.5 px-4 text-[10px] font-semibold rounded-lg">Sign In</Link>
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto px-6 pt-16 relative z-10 flex flex-col md:flex-row gap-8 items-stretch">
        
        {/* Contact Info Column */}
        <div className="md:w-5/12 flex flex-col justify-between p-6 bg-brand-600 text-white rounded-3xl shadow-xl space-y-8 relative overflow-hidden">
          {/* Design glow inside card */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          
          <div className="space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">Support Core</span>
            <h3 className="text-2xl font-extrabold tracking-tight">Get in Touch with Sumit</h3>
            <p className="text-xs text-white/80 leading-relaxed">
              Have questions about ALPHA's AI models, search algorithms, or system configuration? Let us know! We welcome code suggestions or library feature request proposals.
            </p>
          </div>

          <div className="space-y-4 pt-6 border-t border-white/15">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-brand-200" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-brand-200">Email Developer</span>
                <a href="mailto:prajapatisumitop@gmail.com" className="text-xs hover:underline font-semibold">prajapatisumitop@gmail.com</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-brand-200" />
              <div>
                <span className="block text-[10px] uppercase font-bold text-brand-200">Office Location</span>
                <span className="text-xs font-semibold">Dr. A.P.J. Abdul Kalam Technical University</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-white/50 pt-4">
            Smart AI Powered Library Management System — Created by Sumit Prajapati
          </div>
        </div>

        {/* Contact Form Column */}
        <div className="flex-1 glass-card p-6 md:p-8 rounded-3xl shadow-xl flex flex-col justify-center">
          {success ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Message Sent Successfully!</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-normal">
                Thank you for reaching out. Your message has been logged, and Sumit Prajapati will get back to you shortly.
              </p>
              <button 
                onClick={() => setSuccess(false)}
                className="btn-secondary text-xs px-4 py-2 mt-4"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-extrabold text-lg text-slate-909 dark:text-white tracking-tight">Submit Feedback Query</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="form-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="form-input text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject of message"
                  className="form-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message details here..."
                  rows={4}
                  className="form-input text-xs resize-none py-3"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          )}
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

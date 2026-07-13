import React, { useEffect, useState } from 'react';
import { Award, TrendingUp, BookOpen, Plus, Flame } from 'lucide-react';
import api from '../services/api';
import { useToast } from './Toast';

export const ReadingChallengeTab: React.FC = () => {
  const { showToast } = useToast();
  const [challenge, setChallenge] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logPages, setLogPages] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadChallengeData = async () => {
    setLoading(true);
    try {
      // Get challenge status
      const res = await api.get('/premium/challenge/leaderboard');
      if (res.data.success) {
        setLeaderboard(res.data.leaderboard);
      }

      // Check if user has active challenge
      const startRes = await api.post('/premium/challenge/start', {}, { validateStatus: () => true });
      if (startRes.status === 400) {
        // Active challenge already exists, let's load it from the database
        // We can find it inside the leaderboard for this user or fetch a specific status.
        // Let's call leaderboard first. If not found, we'll start one.
      }
      
      // Let's fetch my profile status
      const profileRes = await api.get('/auth/me');
      if (profileRes.data.success) {
        // Find active challenge for user
        const matching = res.data.leaderboard.find((l: any) => l.user?._id === profileRes.data.user._id);
        if (matching) {
          setChallenge(matching);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallengeData();
  }, []);

  const handleStartChallenge = async () => {
    setActionLoading(true);
    try {
      const res = await api.post('/premium/challenge/start');
      if (res.data.success) {
        setChallenge(res.data.challenge);
        showToast('Successfully joined the 30-Day Reading Challenge!', 'success');
        loadChallengeData();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not start challenge';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logPages || parseInt(logPages) <= 0) return;
    setActionLoading(true);
    try {
      const res = await api.post('/premium/challenge/progress', { pages: parseInt(logPages) });
      if (res.data.success) {
        setChallenge(res.data.challenge);
        setLogPages('');
        showToast('Logged progress! Reading streak continues!', 'success');
        loadChallengeData();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to log progress';
      showToast(msg, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Tracker Column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-[20%] translate-y-[-20%] w-[200px] h-[200px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
            30-Day Reading Challenge
          </h3>

          {challenge ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/20 dark:border-slate-800 rounded-2xl text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Completed Days</span>
                  <h4 className="text-2xl font-extrabold text-slate-805 dark:text-white mt-1">{challenge.completedDays} / 30</h4>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/20 dark:border-slate-800 rounded-2xl text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Pages Read</span>
                  <h4 className="text-2xl font-extrabold text-slate-805 dark:text-white mt-1">{challenge.pagesRead} Pages</h4>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-450">Challenge Timeline</span>
                  <span className="text-brand-600 dark:text-brand-400">{Math.round((challenge.completedDays / 30) * 100)}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-600 to-indigo-650 rounded-full transition-all duration-300" style={{ width: `${(challenge.completedDays / 30) * 100}%` }} />
                </div>
              </div>

              {/* Log Progress Form */}
              {challenge.status === 'active' ? (
                <form onSubmit={handleLogProgress} className="flex gap-3 pt-2">
                  <input
                    type="number"
                    value={logPages}
                    onChange={(e) => setLogPages(e.target.value)}
                    placeholder="Log daily pages read..."
                    className="form-input text-xs flex-1"
                    min={1}
                    required
                  />
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn-primary py-2 px-5 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Log Pages
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-2xl text-xs font-bold text-center">
                  🎉 Challenge Completed! You earned the "{challenge.badgeAwarded || 'Challenger Pro'}" Badge!
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <BookOpen className="w-12 h-12 mx-auto text-slate-400 opacity-20 mb-1" />
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Commit to building a consistent reading habit. Track your pages and rank on the leaderboards!
              </p>
              <button
                onClick={handleStartChallenge}
                disabled={actionLoading}
                className="btn-primary py-2.5 px-6 text-xs font-bold rounded-xl cursor-pointer"
              >
                Join 30-Day Challenge
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Column */}
      <div className="glass-card p-6 rounded-3xl">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-brand-650" />
          Leaderboard Standings
        </h3>

        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No participants yet.</p>
          ) : (
            leaderboard.map((item, idx) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-205/40 dark:border-slate-850"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-lg flex items-center justify-center font-extrabold text-xs ${
                    idx === 0 ? 'bg-amber-400 text-amber-950' : idx === 1 ? 'bg-slate-300 text-slate-800' : 'bg-brand-500/10 text-brand-600'
                  }`}>
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-805 dark:text-slate-100">{item.user?.name}</h4>
                    <p className="text-[10px] text-slate-450">{item.completedDays} days logged</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-slate-200">{item.pagesRead} Pages</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

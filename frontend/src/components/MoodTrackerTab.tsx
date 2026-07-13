import React, { useState } from 'react';
import { Sparkles, HelpCircle, Heart, Brain, GraduationCap, Flame } from 'lucide-react';
import api from '../services/api';
import { useToast } from './Toast';

export const MoodTrackerTab: React.FC = () => {
  const { showToast } = useToast();
  const [selectedMood, setSelectedMood] = useState('Happy');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const moods = [
    { name: 'Happy', icon: Heart, color: 'text-rose-500 bg-rose-500/10 border-rose-200' },
    { name: 'Focused', icon: Brain, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-200' },
    { name: 'Exam Mode', icon: GraduationCap, color: 'text-brand-500 bg-brand-500/10 border-brand-200' },
    { name: 'Research Mode', icon: Flame, color: 'text-amber-500 bg-amber-500/10 border-amber-200' }
  ];

  const handleGetRecommendations = async () => {
    setLoading(true);
    try {
      const res = await api.post('/premium/mood-recommend', { mood: selectedMood });
      if (res.data.success) {
        setRecommendations(res.data.recommendations);
        showToast(`Compiled recommendations for ${selectedMood} mood!`, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Could not fetch recommendations', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 rounded-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          Reading Mood Tracker
        </h3>
      </div>
      
      <p className="text-xs text-slate-450 leading-relaxed max-w-xl">
        Select your current academic frame of mind. ALPHA Pro will calculate Gemini recommendations suited to your cognitive load.
      </p>

      {/* Mood Cards Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {moods.map((mood) => {
          const Icon = mood.icon;
          const isSelected = selectedMood === mood.name;
          return (
            <button
              key={mood.name}
              onClick={() => setSelectedMood(mood.name)}
              className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-500/5'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <Icon className={`w-6 h-6 ${mood.color}`} />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{mood.name}</span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center pt-2">
        <button
          onClick={handleGetRecommendations}
          disabled={loading}
          className="btn-primary py-2.5 px-6 text-xs font-bold rounded-xl cursor-pointer"
        >
          {loading ? 'Analyzing Mood...' : 'Get Mood Recommendations'}
        </button>
      </div>

      {/* Recommendations result */}
      {recommendations.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">ALPHA Suggestions matching {selectedMood}</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-205/30 dark:border-slate-850 rounded-2xl space-y-2 flex flex-col justify-between"
              >
                <div>
                  <h5 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">{rec.title}</h5>
                  <span className="text-[10px] text-slate-400 block mt-0.5">by {rec.author}</span>
                  <p className="text-[11px] text-slate-500 mt-2 leading-normal italic">"{rec.reason}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

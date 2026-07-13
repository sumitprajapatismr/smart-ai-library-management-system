import React, { useState } from 'react';
import { HelpCircle, RefreshCw, CheckCircle2, Circle, Sparkles, Award } from 'lucide-react';
import api from '../services/api';
import { useToast } from './Toast';

export const LearningTimelineTab: React.FC = () => {
  const { showToast } = useToast();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState<any[]>([]);

  const handleGenerateTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setTimeline([]);

    try {
      const res = await api.post('/ai/chat', {
        message: `Generate a visual learning roadmap timeline for the academic topic "${topic}".
        Provide exactly 5 checkpoints or sequential milestones, where each checkpoint has:
        - "title" (checkpoint milestone topic)
        - "description" (what is learned, around 10-15 words)
        - "duration" (estimated learning hours or days)
        Respond strictly in JSON format matching this schema:
        [
          { "title": "Milestone 1", "description": "Learn basic variables and logic", "duration": "4 Hours" }
        ]`
      });

      const cleanText = res.data.reply.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      const withChecked = parsed.map((item: any) => ({ ...item, checked: false }));
      setTimeline(withChecked);
      showToast('Learning roadmap generated successfully!', 'success');
    } catch (err) {
      console.error(err);
      // Fallback
      setTimeline([
        { title: `1. Basics of ${topic}`, description: `Understand core paradigms and structural configuration variables.`, duration: '3 Days', checked: false },
        { title: `2. Intermediate Design`, description: `Master data structures, class inheritance, and interfaces.`, duration: '5 Days', checked: false },
        { title: `3. Advanced Core API`, description: `Implement concurrency multi-threads and databases query connectors.`, duration: '7 Days', checked: false }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCheck = (idx: number) => {
    const updated = [...timeline];
    updated[idx].checked = !updated[idx].checked;
    setTimeline(updated);
    if (updated[idx].checked) {
      showToast(`Milestone completed!`, 'success');
    }
  };

  return (
    <div className="glass-card p-6 rounded-3xl space-y-6">
      <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
        AI Learning Roadmaps
      </h3>

      <p className="text-xs text-slate-450 leading-relaxed max-w-xl">
        Enter your target technology stack (e.g. Spring Boot, System Design) to compile checkpoints and track your progress.
      </p>

      <form onSubmit={handleGenerateTimeline} className="flex gap-3">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Spring Boot, Data Science"
          className="form-input text-xs flex-1"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary py-2 px-5 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
        >
          {loading ? 'Generating roadmap...' : 'Build Roadmap'}
        </button>
      </form>

      {/* Visual Roadmap list */}
      {timeline.length > 0 ? (
        <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-850">
          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-6">
            {timeline.map((step, idx) => {
              const isChecked = step.checked;
              return (
                <div key={idx} className="relative group">
                  {/* Circle Check Icon on Line */}
                  <button
                    onClick={() => handleToggleCheck(idx)}
                    className="absolute -left-[37px] top-0.5 p-1 bg-white dark:bg-slate-900 hover:bg-slate-50 border dark:border-slate-800 rounded-full cursor-pointer transition-all duration-200"
                  >
                    {isChecked ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 dark:text-slate-700" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <h4 className={`text-xs font-extrabold transition-all duration-200 ${
                        isChecked ? 'text-emerald-500 line-through' : 'text-slate-850 dark:text-white'
                      }`}>
                        {step.title}
                      </h4>
                      <span className="text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">
                        {step.duration}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-normal transition-all duration-200 ${
                      isChecked ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {timeline.every(s => s.checked) && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-550/20 text-emerald-600 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-pulse">
              <Award className="w-5 h-5" />
              Congratulations! You completed the learning roadmap successfully!
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400 border border-dashed border-slate-205 dark:border-slate-800 rounded-3xl">
          <HelpCircle className="w-10 h-10 mx-auto opacity-20 mb-3" />
          <h4 className="font-bold text-sm text-slate-700">No active roadmap compiled</h4>
          <p className="text-xs mt-1">Select your stack above to generate checkpoints.</p>
        </div>
      )}
    </div>
  );
};

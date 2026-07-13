import React, { useState } from 'react';
import { HelpCircle, Sparkles, CheckCircle2, ChevronRight, RefreshCw, Award } from 'lucide-react';
import api from '../services/api';
import { useToast } from './Toast';

export const CodingPracticeTab: React.FC = () => {
  const { showToast } = useToast();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  const handleGenerateQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setQuestions([]);
    setActiveIdx(0);
    setScore(0);
    setSubmitted(false);
    setSelectedOption(null);
    setShowSolution(false);

    try {
      const res = await api.post('/ai/chat', {
        message: `Generate exactly 3 coding MCQs for the technical topic "${topic}".
        Each question must have exactly 4 choices, a correct index (0-3), and a short explanation logic.
        Respond strictly in JSON format matching this schema:
        [
          {
            "question": "What is the output of X?",
            "choices": ["A", "B", "C", "D"],
            "correctIndex": 0,
            "explanation": "Because X is evaluated as..."
          }
        ]`
      });

      const cleanText = res.data.reply.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      setQuestions(parsed);
      showToast('Coding Practice MCQs compiled!', 'success');
    } catch (err) {
      console.error(err);
      // Fallback
      setQuestions([
        {
          question: `What is the time complexity of searching an element in a HashMap in Java (average case)?`,
          choices: ['O(1)', 'O(log N)', 'O(N)', 'O(N log N)'],
          correctIndex: 0,
          explanation: 'HashMap searches in average O(1) time using hash distribution buckets.'
        },
        {
          question: `Which HTTP method is typically used to update an existing resource in REST APIs?`,
          choices: ['GET', 'POST', 'PUT', 'DELETE'],
          correctIndex: 2,
          explanation: 'PUT (or PATCH) is used in REST conventions to update existing resources.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = () => {
    if (selectedOption === null || submitted) return;
    setSubmitted(true);
    const isCorrect = selectedOption === questions[activeIdx].correctIndex;
    if (isCorrect) {
      setScore(prev => prev + 1);
      showToast('Correct answer!', 'success');
    } else {
      showToast('Incorrect answer', 'error');
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setSubmitted(false);
    setShowSolution(false);
    setActiveIdx(prev => prev + 1);
  };

  return (
    <div className="glass-card p-6 rounded-3xl space-y-6">
      <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
        AI Coding Practice Hub
      </h3>

      <p className="text-xs text-slate-450 leading-relaxed max-w-xl">
        Select a subject (e.g. Java Collections, SQL Queries) to compile dynamic assessments, MCQ challenges, and coding practices.
      </p>

      <form onSubmit={handleGenerateQuestions} className="flex gap-3">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Java HashMap, REST APIs, Git"
          className="form-input text-xs flex-1"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary py-2 px-5 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
        >
          {loading ? 'Compiling Hub...' : 'Compile Questions'}
        </button>
      </form>

      {/* Questions view */}
      {questions.length > 0 ? (
        activeIdx < questions.length ? (
          <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400">
              <span>Question {activeIdx + 1} of {questions.length}</span>
              <span>Score: {score}</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-205/30 rounded-2xl">
              <p className="text-xs font-bold text-slate-800 dark:text-white leading-relaxed">
                {questions[activeIdx].question}
              </p>
            </div>

            {/* Choices */}
            <div className="grid grid-cols-1 gap-3">
              {questions[activeIdx].choices.map((choice: string, idx: number) => {
                const isSelected = selectedOption === idx;
                const isCorrectIdx = idx === questions[activeIdx].correctIndex;
                let bgStyle = 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900';
                
                if (submitted) {
                  if (isCorrectIdx) {
                    bgStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-600';
                  } else if (isSelected) {
                    bgStyle = 'border-rose-500 bg-rose-500/10 text-rose-600';
                  }
                } else if (isSelected) {
                  bgStyle = 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-500/5';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => !submitted && setSelectedOption(idx)}
                    disabled={submitted}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-all duration-200 ${bgStyle}`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setShowSolution(prev => !prev)}
                className="btn-secondary py-2 px-4 text-xs font-bold rounded-xl"
              >
                {showSolution ? 'Hide Explanation' : 'View Explanation/Hint'}
              </button>
              
              {!submitted ? (
                <button
                  onClick={handleAnswerSubmit}
                  disabled={selectedOption === null}
                  className="btn-primary py-2 px-5 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="btn-primary py-2 px-5 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1"
                >
                  Next Question
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Explanation box */}
            {showSolution && (
              <div className="p-4 bg-brand-500/5 border border-brand-550/15 rounded-2xl text-[11px] text-slate-500 leading-normal flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-655 shrink-0 mt-0.5" />
                <p>
                  <strong>Explanation:</strong> {questions[activeIdx].explanation}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 bg-emerald-500/5 border border-emerald-550/15 rounded-3xl text-center space-y-4 pt-8">
            <Award className="w-12 h-12 mx-auto text-emerald-500 animate-bounce" />
            <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Coding Assessment Completed!</h4>
            <p className="text-xs text-slate-500">
              You scored **{score} out of {questions.length}** points! Keep practice up to polish engineering placements skills.
            </p>
          </div>
        )
      ) : (
        <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl animate-pulse">
          <HelpCircle className="w-10 h-10 mx-auto opacity-20 mb-3" />
          <h4 className="font-bold text-sm text-slate-705">No practice problems active</h4>
          <p className="text-xs mt-1">Compile subject questions using the practice compiler bar above.</p>
        </div>
      )}
    </div>
  );
};

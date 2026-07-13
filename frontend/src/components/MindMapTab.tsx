import React, { useState } from 'react';
import { HelpCircle, RefreshCw, ZoomIn, ZoomOut, Share2, Sparkles } from 'lucide-react';
import api from '../services/api';
import { useToast } from './Toast';

export const MindMapTab: React.FC = () => {
  const { showToast } = useToast();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [nodes, setNodes] = useState<any[]>([]);

  const handleGenerateMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/ai/chat', {
        message: `Generate a structured hierarchical mind map for the academic topic "${topic}".
        List the central root node, and exactly 3 secondary nodes (branches), and exactly 2 leaf nodes for each secondary branch.
        Format your response strictly as JSON matching this schema:
        [
          { "id": "1", "label": "Topic", "parent": null },
          { "id": "2", "label": "Branch 1", "parent": "1" },
          { "id": "3", "label": "Sub 1.1", "parent": "2" },
          { "id": "4", "label": "Sub 1.2", "parent": "2" }
        ]`
      });

      // Simple regex JSON parser in case Gemini formats it in code block
      const cleanText = res.data.reply.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      setNodes(parsed);
      showToast('Mind Map generated successfully!', 'success');
    } catch (err) {
      console.error(err);
      // Offline fallback
      setNodes([
        { id: '1', label: topic, parent: null },
        { id: '2', label: 'Core Fundamentals', parent: '1' },
        { id: '3', label: 'Key Standards', parent: '2' },
        { id: '4', label: 'Advanced Practices', parent: '2' },
        { id: '5', label: 'Industrial Applications', parent: '1' },
        { id: '6', label: 'Enterprise Frameworks', parent: '5' }
      ]);
      showToast('Compiled offline fallback mind map', 'success');
    } finally {
      setLoading(false);
    }
  };

  const getCoordinates = (node: any, index: number, total: number) => {
    const centerX = 350;
    const centerY = 200;
    
    if (node.parent === null) {
      return { x: centerX, y: centerY, r: 24, fill: '#2563eb', textColor: '#ffffff' };
    }

    const isSecondLevel = node.parent === '1';
    if (isSecondLevel) {
      const angle = (index * 2 * Math.PI) / total;
      return {
        x: centerX + 110 * Math.cos(angle),
        y: centerY + 80 * Math.sin(angle),
        r: 16,
        fill: '#10b981',
        textColor: '#ffffff'
      };
    }

    // Leaf nodes
    const angle = (index * 2 * Math.PI) / total + 0.3;
    return {
      x: centerX + 220 * Math.cos(angle),
      y: centerY + 140 * Math.sin(angle),
      r: 10,
      fill: '#f59e0b',
      textColor: '#ffffff'
    };
  };

  return (
    <div className="glass-card p-6 rounded-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          AI Mind Map Explorer
        </h3>
        {nodes.length > 0 && (
          <div className="flex items-center gap-1.5 print:hidden">
            <button onClick={() => setZoomScale(prev => Math.min(2, prev + 0.1))} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 cursor-pointer">
              <ZoomIn className="w-4 h-4 text-slate-500" />
            </button>
            <button onClick={() => setZoomScale(prev => Math.max(0.5, prev - 0.1))} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 cursor-pointer">
              <ZoomOut className="w-4 h-4 text-slate-500" />
            </button>
            <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(nodes)); showToast('Coordinates copied', 'success'); }} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 cursor-pointer">
              <Share2 className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-450 leading-relaxed max-w-xl">
        Enter any academic topic or book subject. ALPHA Pro will calculate primary, secondary, and leaf branches in a visual hierarchy map.
      </p>

      <form onSubmit={handleGenerateMap} className="flex gap-3">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. MERN Architecture, Binary Trees"
          className="form-input text-xs flex-1"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary py-2 px-5 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
        >
          {loading ? 'Analyzing...' : 'Generate Map'}
        </button>
      </form>

      {/* SVG Canvas Map */}
      {nodes.length > 0 ? (
        <div className="w-full overflow-x-auto rounded-3xl bg-slate-50/50 dark:bg-slate-955 p-4 border border-slate-200/50 dark:border-slate-850 flex justify-center">
          <div className="relative min-w-[700px] h-[400px]">
            <svg className="w-full h-full transition-transform duration-300" viewBox="0 0 700 400" style={{ transform: `scale(${zoomScale})` }}>
              {/* Draw connecting lines first */}
              {nodes.map((node, idx) => {
                if (node.parent === null) return null;
                const parentNode = nodes.find(n => n.id === node.parent);
                if (!parentNode) return null;

                const nodeCoords = getCoordinates(node, idx, nodes.length);
                const parentCoords = getCoordinates(parentNode, nodes.indexOf(parentNode), nodes.length);

                return (
                  <line
                    key={`line-${idx}`}
                    x1={parentCoords.x}
                    y1={parentCoords.y}
                    x2={nodeCoords.x}
                    y2={nodeCoords.y}
                    stroke="#cbd5e1"
                    strokeWidth={2}
                    className="transition-all duration-300"
                  />
                );
              })}

              {/* Draw Nodes circles */}
              {nodes.map((node, idx) => {
                const coords = getCoordinates(node, idx, nodes.length);
                return (
                  <g key={node.id} className="cursor-pointer">
                    <circle cx={coords.x} cy={coords.y} r={coords.r} fill={coords.fill} shadow-sm="true" />
                    <text
                      x={coords.x}
                      y={coords.y - coords.r - 4}
                      textAnchor="middle"
                      fill="#334155"
                      className="text-[9px] font-extrabold select-none dark:fill-slate-350 font-sans"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
          <HelpCircle className="w-10 h-10 mx-auto opacity-20 mb-3" />
          <h4 className="font-bold text-sm text-slate-700">No Mind Map Compiled</h4>
          <p className="text-xs mt-1">Enter a topic above to generate a hierarchical study tree.</p>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState, useRef } from 'react';
import { Compass, Sparkles, HelpCircle } from 'lucide-react';
import api from '../services/api';

export const KnowledgeGraphTab: React.FC = () => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<any | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const loadGraphData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/premium/knowledge-graph');
      if (res.data.success) {
        // Assign coordinates dynamically in a circular concentric format
        const fetchedNodes = res.data.nodes || [];
        const fetchedLinks = res.data.links || [];

        const centerX = 350;
        const centerY = 200;

        const updatedNodes = fetchedNodes.map((node: any, idx: number) => {
          // Inner circle for books, outer circle for authors/categories
          const radius = node.group === 'book' ? 70 : 160;
          const angle = (idx * 2 * Math.PI) / fetchedNodes.length;

          return {
            ...node,
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
          };
        });

        setNodes(updatedNodes);
        setLinks(fetchedLinks);
      }
    } catch (err) {
      console.error('Failed to load knowledge graph', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraphData();
  }, []);

  // Find coordinates for source and target nodes to draw link lines
  const getLinkCoordinates = (link: any) => {
    const sourceNode = nodes.find(n => n.id === link.source);
    const targetNode = nodes.find(n => n.id === link.target);

    if (sourceNode && targetNode) {
      return {
        x1: sourceNode.x,
        y1: sourceNode.y,
        x2: targetNode.x,
        y2: targetNode.y,
      };
    }
    return { x1: 0, y1: 0, x2: 0, y2: 0 };
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-3xl space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-brand-600">
          <Compass className="w-5 h-5 text-brand-550" />
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">AI Book Knowledge Graph</h3>
        </div>
        <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl text-[10px] text-slate-450 flex items-center gap-1.5 border border-slate-205/30">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-500 inline-block" /> Book
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Author
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Genre
        </div>
      </div>

      <p className="text-xs text-slate-450 leading-relaxed max-w-2xl">
        Interconnected semantic layout representing catalogue records. Hover over node spheres to visualize category groupings and authorship bonds.
      </p>

      {/* SVG Vector Canvas */}
      <div className="w-full overflow-x-auto rounded-3xl bg-slate-50/50 dark:bg-slate-950/60 p-4 border border-slate-200/50 dark:border-slate-850 flex justify-center">
        <div className="relative min-w-[700px] h-[400px]">
          <svg ref={svgRef} className="w-full h-full" viewBox="0 0 700 400">
            {/* Draw Links Lines */}
            {links.map((link, idx) => {
              const coords = getLinkCoordinates(link);
              const isHighlighted = hoveredNode && (link.source === hoveredNode.id || link.target === hoveredNode.id);
              return (
                <line
                  key={idx}
                  x1={coords.x1}
                  y1={coords.y1}
                  x2={coords.x2}
                  y2={coords.y2}
                  stroke={isHighlighted ? '#3b82f6' : '#94a3b8'}
                  strokeWidth={isHighlighted ? 2.5 : 1}
                  strokeDasharray={isHighlighted ? '0' : '4'}
                  opacity={hoveredNode ? (isHighlighted ? 0.95 : 0.15) : 0.4}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* Draw Nodes Circles */}
            {nodes.map((node) => {
              const color = node.group === 'book' ? '#2563eb' : node.group === 'author' ? '#10b981' : '#f59e0b';
              const isHovered = hoveredNode && hoveredNode.id === node.id;
              const isRelated = hoveredNode && links.some(l => 
                (l.source === hoveredNode.id && l.target === node.id) || 
                (l.target === hoveredNode.id && l.source === node.id)
              );

              const opacity = hoveredNode ? (isHovered || isRelated ? 1.0 : 0.25) : 0.9;
              const size = node.group === 'book' ? 12 : 9;

              return (
                <g
                  key={node.id}
                  className="cursor-pointer transition-all duration-300"
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isHovered ? size + 3 : size}
                    fill={color}
                    opacity={opacity}
                    className="transition-all duration-200"
                  />
                  {/* Labels on hover or for books */}
                  {(node.group === 'book' || isHovered || isRelated) && (
                    <text
                      x={node.x}
                      y={node.y - size - 4}
                      textAnchor="middle"
                      fill={isHovered ? '#2563eb' : '#475569'}
                      className="text-[9px] font-extrabold tracking-tight select-none dark:fill-slate-350 transition-all font-sans"
                    >
                      {node.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Info Badge */}
          {hoveredNode && (
            <div className="absolute bottom-4 left-4 p-4 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl backdrop-blur-md max-w-xs transition-all duration-200">
              <span className="text-[9px] uppercase font-bold text-brand-600 block tracking-widest">{hoveredNode.group} Node</span>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white mt-1">{hoveredNode.label}</h4>
              <p className="text-[10px] text-slate-500 mt-1">Hover other linked nodes to explore relationships.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

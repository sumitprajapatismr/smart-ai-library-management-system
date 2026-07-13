import React, { useEffect, useState } from 'react';
import { BarChart3, HelpCircle, ShieldCheck, Map, Users } from 'lucide-react';
import api from '../services/api';

export const DigitalTwinTab: React.FC = () => {
  const [heatmap, setHeatmap] = useState<number[][]>([]);
  const [loading, setLoading] = useState(true);

  // Live seats layout map coordinates representation
  const seats = [
    { id: 1, x: 20, y: 30, occupied: true },
    { id: 2, x: 50, y: 30, occupied: false },
    { id: 3, x: 80, y: 30, occupied: false },
    { id: 4, x: 110, y: 30, occupied: true },
    { id: 5, x: 20, y: 70, occupied: false },
    { id: 6, x: 50, y: 70, occupied: true },
    { id: 7, x: 80, y: 70, occupied: false },
    { id: 8, x: 110, y: 70, occupied: false }
  ];

  const loadTwinData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/premium/heatmap');
      if (res.data.success) {
        setHeatmap(res.data.heatmap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTwinData();
  }, []);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = ['8a', '10a', '12p', '2p', '4p', '6p', '8p'];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const occupiedSeatsCount = seats.filter(s => s.occupied).length;
  const availableSeatsCount = seats.length - occupiedSeatsCount;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Live Floor plan Layout */}
      <div className="glass-card p-6 rounded-3xl space-y-6">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Map className="w-5 h-5 text-brand-600" />
          Library Live Desk Twin
        </h3>
        
        <p className="text-xs text-slate-450 leading-relaxed">
          Virtual model mapping desk layout. Color markers denote real-time desk occupancy.
        </p>

        {/* Floor grid visual */}
        <div className="w-full h-44 bg-slate-50 dark:bg-slate-950/40 rounded-2xl relative border border-slate-200/50 dark:border-slate-850 p-4">
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 p-4 gap-4">
            {seats.map((seat) => (
              <div
                key={seat.id}
                className={`rounded-xl border flex flex-col items-center justify-center text-[10px] font-bold ${
                  seat.occupied
                    ? 'border-rose-500 bg-rose-500/10 text-rose-600'
                    : 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                }`}
              >
                <span>Seat {seat.id}</span>
                <span className="text-[8px] opacity-70">{seat.occupied ? 'Occupied' : 'Free'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-slate-450">Active Occupancy</span>
          <span className="text-slate-800 dark:text-white">{occupiedSeatsCount} Desks / {seats.length} Total</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="lg:col-span-2 glass-card p-6 rounded-3xl space-y-6">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          Busiest Borrowing Peak Hours Heatmap
        </h3>

        <p className="text-xs text-slate-450 leading-relaxed">
          Borrowing density statistics across hours of the week. Darker coordinates represent peak checkout intervals.
        </p>

        {/* Heatmap Grid Visual */}
        <div className="overflow-x-auto rounded-2xl border border-slate-205/30 p-4 bg-slate-55/30 dark:bg-slate-950/40">
          <div className="min-w-[450px] space-y-2">
            {/* Hours Header labels */}
            <div className="flex items-center gap-1 pl-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {hours.map((h, idx) => (
                <div key={idx} className="flex-1 text-center">{h}</div>
              ))}
            </div>

            {/* Grid rows */}
            {days.map((day, dayIdx) => (
              <div key={dayIdx} className="flex items-center gap-1">
                <div className="w-8 text-[9px] font-bold text-slate-400 text-left">{day}</div>
                {Array.from({ length: 7 }).map((_, hourIdx) => {
                  // Map density calculations
                  const count = heatmap[dayIdx]?.[hourIdx * 3] || 0;
                  const intensity = Math.min(4, count);
                  
                  let fillStyle = 'bg-slate-100 dark:bg-slate-800';
                  if (intensity === 1) fillStyle = 'bg-brand-500/20';
                  else if (intensity === 2) fillStyle = 'bg-brand-500/40';
                  else if (intensity === 3) fillStyle = 'bg-brand-500/60';
                  else if (intensity >= 4) fillStyle = 'bg-brand-600';

                  return (
                    <div
                      key={hourIdx}
                      title={`${day} at ${hours[hourIdx]}: ${count} borrow logs`}
                      className={`flex-1 h-6 rounded-md border border-white/5 transition-all duration-300 ${fillStyle}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

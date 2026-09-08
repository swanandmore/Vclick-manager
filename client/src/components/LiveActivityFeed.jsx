import React, { useState } from 'react';
import { 
  Activity, 
  Calendar, 
  Radio
} from 'lucide-react';

export default function LiveActivityFeed({ activities, currentHead, theme = 'dark' }) {
  const [filterHead, setFilterHead] = useState('ALL');

  const isDark = theme === 'dark';

  const filtered = activities.filter(act => {
    if (filterHead === 'ALL') return true;
    return act.headName === filterHead;
  });

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATED_EVENT':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">New Event</span>;
      case 'UPDATED_EVENT':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">Event Updated</span>;
      case 'UPDATED_ALLOTMENT':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500/20 text-red-500 border border-red-500/30">Allotment Changed</span>;
      case 'TOGGLE_DRIVE':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">Drive Status</span>;
      case 'DELETED_EVENT':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500/20 text-red-500 border border-red-500/30">Deleted Event</span>;
      case 'ADDED_MEMBER':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">Added Member</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-800 text-zinc-400">Activity</span>;
    }
  };

  const formatTime = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' • ' + d.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <div>
          <div className="flex items-center space-x-2 text-red-500 font-bold text-xs uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>Real-Time Audit Trail</span>
          </div>
          <h2 className="text-lg font-bold">VCLICK Live Audit Feed</h2>
          <p className="text-xs opacity-60">
            Real-time synchronization history across all 5 heads
          </p>
        </div>

        <select
          value={filterHead}
          onChange={(e) => setFilterHead(e.target.value)}
          className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-500 ${
            isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-300 text-zinc-800'
          }`}
        >
          <option value="ALL">All Heads</option>
          <option value="Swanand More">Swanand More</option>
          <option value="Pratham Hindocha">Pratham Hindocha</option>
          <option value="Varad Belsare">Varad Belsare</option>
          <option value="Harshal Shinde">Harshal Shinde</option>
          <option value="Kunal Pawar">Kunal Pawar</option>
          <option value="System">System Baseline</option>
        </select>
      </div>

      <div className={`border rounded-2xl p-4 sm:p-6 shadow-xl divide-y ${
        isDark ? 'bg-zinc-900 border-zinc-800 divide-zinc-800/60' : 'bg-white border-zinc-200 divide-zinc-200'
      }`}>
        {filtered.length === 0 ? (
          <div className="py-12 text-center opacity-50 text-xs">
            No activity recorded yet for this filter.
          </div>
        ) : (
          filtered.map((act) => {
            const isMe = act.headName === currentHead;

            return (
              <div key={act.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start space-x-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isMe 
                      ? 'bg-red-600 text-white shadow-sm shadow-red-600/30' 
                      : isDark ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : 'bg-zinc-100 text-zinc-800 border border-zinc-300'
                  }`}>
                    {act.headName.charAt(0)}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">
                        {act.headName}
                      </span>
                      {isMe && (
                        <span className="text-[10px] text-red-500 font-bold">(You)</span>
                      )}
                      {getActionBadge(act.action)}
                    </div>

                    <p className="opacity-80 text-xs break-words">
                      {act.details}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] opacity-50 font-mono shrink-0 whitespace-nowrap pt-1">
                  {formatTime(act.timestamp)}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
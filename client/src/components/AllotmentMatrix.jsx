import React, { useState, useRef } from 'react';
import { 
  Scale, 
  UserCheck, 
  AlertCircle, 
  Camera, 
  Check, 
  Plus, 
  Clock, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

function parseEventDate(dateStr) {
  if (!dateStr) return 0;
  const str = String(dateStr).trim();
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10)).getTime();
  }
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    return new Date(year, month, day).getTime();
  }
  const dmMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (dmMatch) {
    const currentYear = new Date().getFullYear();
    const day = parseInt(dmMatch[1], 10);
    const month = parseInt(dmMatch[2], 10) - 1;
    return new Date(currentYear, month, day).getTime();
  }
  const parsed = Date.parse(str);
  return isNaN(parsed) ? 0 : parsed;
}

export default function AllotmentMatrix({
  members,
  events,
  memberStats,
  onOpenNewEventWithMember,
  onToggleMemberInEvent,
  theme = 'dark'
}) {
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [campusFilter, setCampusFilter] = useState('ALL');
  const [skillFilter, setSkillFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('LEAST_EVENTS');
  const tableContainerRef = useRef(null);

  // Auto-arrange events chronologically by date
  const sortedEvents = [...events].sort((a, b) => {
    const diff = parseEventDate(a.date) - parseEventDate(b.date);
    return diff !== 0 ? diff : (a.srNo || 0) - (b.srNo || 0);
  });

  // Identify members with 0 events
  const zeroEventMembers = members.filter(m => (memberStats[m.id] || 0) === 0);
  
  // Calculate load distribution statistics
  const counts = members.map(m => memberStats[m.id] || 0);
  const maxEvents = counts.length > 0 ? Math.max(...counts) : 0;
  const minEvents = counts.length > 0 ? Math.min(...counts) : 0;
  const avgEvents = counts.length > 0 ? (counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1) : 0;

  // Horizontal scroll buttons
  const scrollTable = (direction) => {
    if (tableContainerRef.current) {
      const offset = direction === 'left' ? -350 : 350;
      tableContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Filter and sort members
  const processedMembers = members
    .filter(m => {
      const matchRole = roleFilter === 'ALL' || m.role === roleFilter;
      const matchCampus = campusFilter === 'ALL' || m.campus === campusFilter;
      let matchSkill = true;
      if (skillFilter !== 'ALL') {
        matchSkill = m.work.includes(skillFilter);
      }
      return matchRole && matchCampus && matchSkill;
    })
    .sort((a, b) => {
      const countA = memberStats[a.id] || 0;
      const countB = memberStats[b.id] || 0;
      if (sortBy === 'LEAST_EVENTS') {
        return countA - countB || a.name.localeCompare(b.name);
      }
      if (sortBy === 'MOST_EVENTS') {
        return countB - countA || a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">

      {/* Fairness & Balance Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Zero Event Spotlight Banner */}
        <div className={`md:col-span-2 p-5 rounded-2xl shadow-lg border relative overflow-hidden ${
          isDark 
            ? 'bg-gradient-to-r from-red-950/30 via-zinc-900 to-zinc-900 border-red-500/30 text-white' 
            : 'bg-gradient-to-r from-red-50 via-white to-white border-red-200 text-zinc-900'
        }`}>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-red-500 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>Zero-Event Equity Spotlight</span>
              </div>
              <h3 className="text-lg font-extrabold">
                {zeroEventMembers.length} Team Members Awaiting Event Allotment
              </h3>
              <p className={`text-xs max-w-xl ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                To maintain equal event distribution, assign these coordinators and volunteers next. Click any name below or use the matrix checkboxes.
              </p>
            </div>
            <span className="text-3xl font-black text-red-500 px-3 py-1 rounded-xl bg-red-500/10 border border-red-500/20">
              {zeroEventMembers.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-red-500/20">
            {zeroEventMembers.map(m => (
              <button
                key={m.id}
                onClick={() => onOpenNewEventWithMember(m.id)}
                title={`Draft new event assigning ${m.name}`}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 transition group font-medium"
              >
                <span>{m.name}</span>
                <span className="text-[10px] opacity-75 font-mono">({m.campus} • {m.work})</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
              </button>
            ))}
          </div>
        </div>

        {/* Load Balance Stats */}
        <div className={`p-5 rounded-2xl shadow-lg border flex flex-col justify-between ${
          isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
        }`}>
          <div>
            <div className="flex items-center space-x-2 text-red-500 font-bold text-xs uppercase tracking-wider mb-2">
              <Scale className="w-4 h-4" />
              <span>Workload Balance Stats</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Average Events / Member:</span>
                <span className="font-bold font-mono text-sm">{avgEvents}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Min / Max Allotment:</span>
                <span className="font-bold font-mono text-sm">{minEvents} / {maxEvents}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Balanced Load (1-2 events):</span>
                <span className="font-bold text-emerald-500 font-mono text-sm">
                  {members.filter(m => (memberStats[m.id] || 0) >= 1 && (memberStats[m.id] || 0) <= 2).length}
                </span>
              </div>
            </div>
          </div>

          <div className={`pt-3 border-t text-[11px] flex items-center justify-between ${
            isDark ? 'border-zinc-800 text-zinc-400' : 'border-zinc-100 text-zinc-500'
          }`}>
            <span>Total Team Capacity</span>
            <span className="text-red-500 font-bold">{members.length} Members</span>
          </div>
        </div>

      </div>

      {/* Control Bar & Horizontal Scroll Navigation */}
      <div className={`p-3 sm:p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shadow-sm ${
        isDark ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <div className="flex flex-wrap items-center gap-2">
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-500 ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-300 text-zinc-800'
            }`}
          >
            <option value="ALL">All Roles ({members.length})</option>
            <option value="Volunteer">Volunteers ({members.filter(m => m.role === 'Volunteer').length})</option>
            <option value="Coordinator">Coordinators ({members.filter(m => m.role === 'Coordinator').length})</option>
            <option value="Head">Heads ({members.filter(m => m.role === 'Head').length})</option>
          </select>

          <select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-500 ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-300 text-zinc-800'
            }`}
          >
            <option value="ALL">All Campuses</option>
            <option value="Bibwewadi">Bibwewadi</option>
            <option value="Kondhwa">Kondhwa</option>
          </select>

          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-500 ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-300 text-zinc-800'
            }`}
          >
            <option value="ALL">All Skills</option>
            <option value="PHOTO">Photography</option>
            <option value="VIDEO">Videography</option>
            <option value="EDIT">Editing</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none focus:border-red-500 ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-red-400' : 'bg-zinc-50 border-zinc-300 text-red-600'
            }`}
          >
            <option value="LEAST_EVENTS">Least Events (Priority)</option>
            <option value="MOST_EVENTS">Most Events (Highest)</option>
            <option value="NAME">Name (A-Z)</option>
          </select>

        </div>

        {/* Sidewise Scroll Arrows */}
        <div className="flex items-center space-x-2">
          <span className={`text-[11px] font-medium hidden sm:inline ${
            isDark ? 'text-zinc-400' : 'text-zinc-500'
          }`}>
            Scroll Events:
          </span>
          <button
            onClick={() => scrollTable('left')}
            title="Scroll table left"
            className={`p-2 rounded-xl border transition flex items-center gap-1 text-xs font-semibold ${
              isDark 
                ? 'bg-zinc-950 border-zinc-800 text-zinc-200 hover:bg-zinc-800' 
                : 'bg-zinc-50 border-zinc-300 text-zinc-800 hover:bg-zinc-100'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Left</span>
          </button>
          <button
            onClick={() => scrollTable('right')}
            title="Scroll table right"
            className={`p-2 rounded-xl border transition flex items-center gap-1 text-xs font-semibold ${
              isDark 
                ? 'bg-zinc-950 border-zinc-800 text-zinc-200 hover:bg-zinc-800' 
                : 'bg-zinc-50 border-zinc-300 text-zinc-800 hover:bg-zinc-100'
            }`}
          >
            <span className="hidden sm:inline">Right</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Helper notice */}
      <div className={`text-xs px-4 py-2 rounded-xl border flex items-center justify-between ${
        isDark ? 'bg-zinc-900/50 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
      }`}>
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>
            <strong>Interactive Matrix:</strong> Click directly on ANY event box in front of a coordinator or volunteer's name to check/assign or unassign them in real-time!
          </span>
        </div>
        <span className="text-[11px] font-mono hidden md:inline">
          {events.length} Events Tracked
        </span>
      </div>

      {/* Interactive Allotment Matrix Table Container */}
      <div className={`border rounded-2xl shadow-xl overflow-hidden ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <div 
          ref={tableContainerRef}
          className="overflow-x-auto scroll-smooth w-full"
          style={{ maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}
        >
          <table className="w-full text-left border-collapse border-spacing-0">
            <thead>
              <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-400' : 'border-zinc-200 bg-zinc-50 text-zinc-600'
              }`}>
                
                {/* Sticky Member Column 1 */}
                <th className={`py-4 px-4 sticky left-0 z-30 min-w-[210px] shadow-sm ${
                  isDark ? 'bg-zinc-950' : 'bg-zinc-50'
                }`}>
                  Team Member
                </th>

                {/* Sticky Member Column 2 */}
                <th className={`py-4 px-3 sticky left-[210px] z-30 min-w-[100px] border-r shadow-md ${
                  isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  Events Total
                </th>

                {/* Event Columns */}
                {sortedEvents.map((evt, i) => (
                  <th 
                    key={evt.id} 
                    className={`py-3 px-3 text-center min-w-[130px] border-r transition ${
                      isDark ? 'border-zinc-800 hover:bg-zinc-900' : 'border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <div className="font-bold text-xs truncate max-w-[125px]" title={evt.name}>
                      {evt.name}
                    </div>
                    <div className="flex items-center justify-center gap-1 text-[10px] font-mono mt-0.5 opacity-70">
                      <span>{evt.date}</span>
                      <span>•</span>
                      <span>{evt.campus.slice(0, 4)}</span>
                    </div>
                    <div className="text-[10px] text-red-500 font-bold mt-0.5">
                      {(evt.assignedMemberIds || []).length} assigned
                    </div>
                  </th>
                ))}

              </tr>
            </thead>
            <tbody className={`divide-y text-xs ${
              isDark ? 'divide-zinc-800/80 text-zinc-200' : 'divide-zinc-200 text-zinc-800'
            }`}>
              {processedMembers.map((member) => {
                const count = memberStats[member.id] || 0;

                return (
                  <tr key={member.id} className={`transition group ${
                    isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-50'
                  }`}>
                    
                    {/* Sticky Column: Member Name, Role, Campus */}
                    <td className={`py-3 px-4 sticky left-0 z-20 shadow-sm ${
                      isDark ? 'bg-zinc-900 group-hover:bg-zinc-850' : 'bg-white group-hover:bg-zinc-50'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm truncate max-w-[130px]">{member.name}</span>
                        {member.hasCamera && (
                          <span title="Owns camera">
                            <Camera className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1.5 text-[10px] opacity-70 mt-0.5">
                        <span className="font-semibold">{member.role}</span>
                        <span>•</span>
                        <span>{member.campus}</span>
                        <span>•</span>
                        <span className="font-mono text-red-500 font-bold">{member.work}</span>
                      </div>
                    </td>

                    {/* Sticky Column: Event Count Badge */}
                    <td className={`py-3 px-3 sticky left-[210px] z-20 border-r shadow-md font-mono ${
                      isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
                    }`}>
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-extrabold ${
                        count === 0
                          ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                          : count >= 3
                          ? 'bg-red-500/20 text-red-500 border border-red-500/40'
                          : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'
                      }`}>
                        {count} {count === 1 ? 'event' : 'events'}
                      </span>
                    </td>

                    {/* Interactive Event Cells: Click to Toggle Allotment! */}
                    {sortedEvents.map((evt) => {
                      const isAssigned = (evt.assignedMemberIds || []).includes(member.id);

                      return (
                        <td 
                          key={evt.id} 
                          className={`py-2 px-3 text-center border-r transition ${
                            isDark ? 'border-zinc-800/80' : 'border-zinc-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onToggleMemberInEvent(evt.id, member.id)}
                            title={isAssigned 
                              ? `Assigned: Click to remove ${member.name} from "${evt.name}"` 
                              : `Not assigned: Click to assign ${member.name} to "${evt.name}"`
                            }
                            className={`w-8 h-8 rounded-xl mx-auto flex items-center justify-center transition-all transform active:scale-90 ${
                              isAssigned
                                ? 'bg-red-600 text-white shadow-md shadow-red-600/30 ring-2 ring-red-500/40 hover:bg-red-700'
                                : isDark
                                ? 'border border-dashed border-zinc-700 text-zinc-600 hover:border-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                                : 'border border-dashed border-zinc-300 text-zinc-400 hover:border-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
                            }`}
                          >
                            {isAssigned ? (
                              <Check className="w-4 h-4 stroke-[3]" />
                            ) : (
                              <Plus className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                            )}
                          </button>
                        </td>
                      );
                    })}

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
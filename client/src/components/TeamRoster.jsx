import React, { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  Camera, 
  Trash2, 
  Phone, 
  Clock, 
  MapPin, 
  CheckCircle,
  Sparkles
} from 'lucide-react';

export default function TeamRoster({
  members,
  memberStats,
  onAddMember,
  onEditMember,
  onDeleteMember,
  theme = 'dark'
}) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [campusFilter, setCampusFilter] = useState('ALL');
  const [cameraFilter, setCameraFilter] = useState('ALL');

  const isDark = theme === 'dark';

  const filteredMembers = members.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.collegeTimings && m.collegeTimings.toLowerCase().includes(search.toLowerCase())) ||
      (m.phone && m.phone.includes(search));
    
    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
    const matchesCampus = campusFilter === 'ALL' || m.campus === campusFilter;
    const matchesCamera = 
      cameraFilter === 'ALL' ||
      (cameraFilter === 'YES' && m.hasCamera) ||
      (cameraFilter === 'NO' && !m.hasCamera);

    return matchesSearch && matchesRole && matchesCampus && matchesCamera;
  });

  return (
    <div className="space-y-6">
      
      {/* Action & Filter Bar */}
      <div className={`p-3 sm:p-4 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm ${
        isDark ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 opacity-50 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search member by name, timings, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-500 transition ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500' : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-500 ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-300 text-zinc-800'
            }`}
          >
            <option value="ALL">All Roles</option>
            <option value="Volunteer">Volunteers</option>
            <option value="Coordinator">Coordinators</option>
            <option value="Head">Heads</option>
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
            value={cameraFilter}
            onChange={(e) => setCameraFilter(e.target.value)}
            className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-500 ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-300 text-zinc-800'
            }`}
          >
            <option value="ALL">Camera: All</option>
            <option value="YES">Has Camera (Yes)</option>
            <option value="NO">No Camera</option>
          </select>

          <button
            onClick={onAddMember}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Roster Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map(m => {
          const count = memberStats[m.id] || 0;

          return (
            <div
              key={m.id}
              className={`border rounded-2xl p-5 hover:border-red-500/50 transition flex flex-col justify-between shadow-lg relative group ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-100 border-zinc-300 text-zinc-800'
                    }`}>
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm group-hover:text-red-500 transition">
                        {m.name}
                      </h4>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        m.role === 'Head'
                          ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                          : m.role === 'Coordinator'
                          ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                          : 'opacity-70 border border-zinc-700'
                      }`}>
                        {m.role}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    count === 0
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                      : count >= 3
                      ? 'bg-red-500/20 text-red-500 border border-red-500/40'
                      : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'
                  }`}>
                    {count} {count === 1 ? 'Event' : 'Events'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs opacity-75 my-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 opacity-60 shrink-0" />
                    <span>Campus: <strong className="opacity-100">{m.campus}</strong></span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Camera className="w-3.5 h-3.5 opacity-60 shrink-0" />
                    <span>
                      Camera:{' '}
                      <strong className={m.hasCamera ? 'text-emerald-500' : 'opacity-60'}>
                        {m.hasCamera ? 'Yes (Owns Camera)' : 'No'}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="w-3.5 h-3.5 flex items-center justify-center font-mono text-[10px] opacity-60 font-bold shrink-0">W</span>
                    <span>Work: <strong className="font-mono text-red-500">{m.work}</strong></span>
                  </div>

                  {m.collegeTimings && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 opacity-60 shrink-0" />
                      <span>Timings: <span className="opacity-100">{m.collegeTimings}</span></span>
                    </div>
                  )}

                  {m.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 opacity-60 shrink-0" />
                      <span className="font-mono text-[11px] opacity-100">{m.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={`pt-3 border-t flex items-center justify-end space-x-1 ${
                isDark ? 'border-zinc-800' : 'border-zinc-200'
              }`}>
                <button
                  onClick={() => onEditMember(m)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    isDark ? 'text-zinc-300 hover:text-white hover:bg-zinc-800' : 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteMember(m.id)}
                  className="p-1.5 rounded-lg opacity-40 hover:text-red-500 hover:opacity-100 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
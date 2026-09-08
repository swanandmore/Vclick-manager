import React, { useState } from 'react';
import { 
  Plus, 
  X,
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  User, 
  Users,
  Camera, 
  LayoutGrid, 
  Table as TableIcon, 
  Edit3, 
  Trash2,
  MessageSquare,
  Sparkles
} from 'lucide-react';

export function parseEventDate(dateStr) {
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

export default function EventList({
  events,
  members,
  memberStats,
  onOpenNewEventModal,
  onEditEvent,
  onDeleteEvent,
  onToggleDriveStatus,
  onToggleMemberInEvent,
  onUpdateDriveLink,
  onOpenWhatsAppModal,
  theme = 'dark'
}) {
  const [search, setSearch] = useState('');
  const [campusFilter, setCampusFilter] = useState('ALL');
  const [driveFilter, setDriveFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('DATE_ASC');
  const [viewMode, setViewMode] = useState('table');
  const [copiedId, setCopiedId] = useState(null);
  const [copiedWpId, setCopiedWpId] = useState(null);

  // Quick Inline Modals State
  const [allotmentModalEventId, setAllotmentModalEventId] = useState(null);
  const [allotmentSearch, setAllotmentSearch] = useState('');
  const [allotmentRoleFilter, setAllotmentRoleFilter] = useState('ALL');
  const [driveModalEventId, setDriveModalEventId] = useState(null);
  const [driveInputUrl, setDriveInputUrl] = useState('');

  const isDark = theme === 'dark';

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyWhatsAppFormat = (evt) => {
    const assignedNames = (evt.assignedMemberIds || [])
      .map(id => {
        const m = members.find(mem => mem.id === id);
        return m ? `• *${m.name}* (${m.role} • ${m.work})` : null;
      })
      .filter(Boolean)
      .join('\n');

    const msg = `📸 *VCLICK MULTIMEDIA PROD.* 🎬\n` +
      `*EVENT ALLOTMENT: ${evt.name}*\n\n` +
      `📅 *Date:* ${evt.date}\n` +
      `🏫 *Campus:* ${evt.campus}\n` +
      `👤 *POC:* ${evt.contactPerson || 'Club Head'}\n\n` +
      `👥 *Assigned Crew:*\n${assignedNames || '• None allotted yet'}\n\n` +
      (evt.driveLink ? `📁 *Drive Link:* ${evt.driveLink}\n` : '') +
      (evt.notes ? `📝 *Notes:* ${evt.notes}\n` : '') +
      `⚡ _Please reach 15 mins prior with charged equipment!_`;

    navigator.clipboard.writeText(msg);
    setCopiedWpId(evt.id);
    setTimeout(() => setCopiedWpId(null), 2000);
  };

  const getMemberById = (id) => members.find(m => m.id === id);

  const filteredEvents = events.filter(evt => {
    const matchesSearch = 
      evt.name.toLowerCase().includes(search.toLowerCase()) ||
      evt.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      (evt.notes && evt.notes.toLowerCase().includes(search.toLowerCase())) ||
      (evt.assignedMemberIds || []).some(mId => {
        const m = getMemberById(mId);
        return m && m.name.toLowerCase().includes(search.toLowerCase());
      });

    const matchesCampus = campusFilter === 'ALL' || evt.campus === campusFilter;
    
    const matchesDrive = 
      driveFilter === 'ALL' ||
      (driveFilter === 'SUBMITTED' && evt.driveLinkSubmitted) ||
      (driveFilter === 'PENDING' && !evt.driveLinkSubmitted);

    return matchesSearch && matchesCampus && matchesDrive;
  });

  const totalEvents = events.length;
  const submittedDrives = events.filter(e => e.driveLinkSubmitted).length;
  const pendingDrives = totalEvents - submittedDrives;
  const driveRate = totalEvents > 0 ? Math.round((submittedDrives / totalEvents) * 100) : 0;

  const currentAllotmentEvent = events.find(e => e.id === allotmentModalEventId);
  const currentDriveEvent = events.find(e => e.id === driveModalEventId);

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortBy === 'DATE_ASC') {
      const diff = parseEventDate(a.date) - parseEventDate(b.date);
      return diff !== 0 ? diff : (a.srNo || 0) - (b.srNo || 0);
    }
    if (sortBy === 'DATE_DESC') {
      const diff = parseEventDate(b.date) - parseEventDate(a.date);
      return diff !== 0 ? diff : (b.srNo || 0) - (a.srNo || 0);
    }
    if (sortBy === 'NAME') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const filteredModalMembers = members.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(allotmentSearch.toLowerCase()) ||
      (m.work && m.work.toLowerCase().includes(allotmentSearch.toLowerCase())) ||
      (m.campus && m.campus.toLowerCase().includes(allotmentSearch.toLowerCase()));
    const matchesRole = allotmentRoleFilter === 'ALL' || m.role === allotmentRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <div className="flex items-center justify-between opacity-70 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Events</span>
            <span className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
              <Camera className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black">{totalEvents}</div>
          <p className="text-[11px] opacity-60 mt-1">Recorded in VCLICK schedule</p>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <div className="flex items-center justify-between opacity-70 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Drive Submitted</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-500">{submittedDrives}</div>
          <p className="text-[11px] opacity-60 mt-1">{driveRate}% albums uploaded</p>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <div className="flex items-center justify-between opacity-70 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Drive Pending</span>
            <span className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
              <XCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-500">{pendingDrives}</div>
          <p className="text-[11px] opacity-60 mt-1">Photos pending upload</p>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <div className="flex items-center justify-between opacity-70 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">WhatsApp Broadcast</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <MessageSquare className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">Ready</div>
          <p className="text-[11px] opacity-60 mt-1">1-click message format</p>
        </div>
      </div>

      {/* Control Bar: Search, Filters & View Toggle */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm ${
        isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            type="text"
            placeholder="Search events by name, POC, note, or assigned student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-500 transition ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500' : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold focus:outline-none focus:border-red-500 ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-red-400' : 'bg-zinc-50 border-zinc-300 text-red-600'
            }`}
            title="Auto sort events"
          >
            <option value="DATE_ASC">📅 Date (Earliest to Latest)</option>
            <option value="DATE_DESC">📅 Date (Newest First)</option>
            <option value="NAME">🔤 Event Name (A-Z)</option>
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
            value={driveFilter}
            onChange={(e) => setDriveFilter(e.target.value)}
            className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-500 ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-300 text-zinc-800'
            }`}
          >
            <option value="ALL">All Drive Statuses</option>
            <option value="SUBMITTED">Drive Submitted (Yes)</option>
            <option value="PENDING">Drive Pending (No)</option>
          </select>

          <div className={`flex items-center p-1 rounded-xl border ${
            isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
          }`}>
            <button
              onClick={() => setViewMode('table')}
              title="Table view"
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' 
                  ? 'bg-red-600 text-white shadow-sm' 
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Cards view"
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'cards' 
                  ? 'bg-red-600 text-white shadow-sm' 
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onOpenNewEventModal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* Presentation */}
      {viewMode === 'table' ? (
        <div className={`border rounded-2xl shadow-xl overflow-hidden ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                  isDark ? 'border-zinc-800 bg-zinc-950 text-zinc-400' : 'border-zinc-200 bg-zinc-50 text-zinc-600'
                }`}>
                  <th className="py-3.5 px-4 w-12 text-center">Sr.</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Name of Event</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Contact POC</th>
                  <th className="py-3.5 px-3 min-w-[90px]">Email Recv.</th>
                  <th className="py-3.5 px-4 min-w-[110px]">Date</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Students Assigned</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Google Drive</th>
                  <th className="py-3.5 px-3 min-w-[110px] text-center">Drive Status</th>
                  <th className="py-3.5 px-4 text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${
                isDark ? 'divide-zinc-800/60' : 'divide-zinc-200'
              }`}>
                {sortedEvents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center opacity-50">
                      No events matching filters.
                    </td>
                  </tr>
                ) : (
                  sortedEvents.map((evt, idx) => {
                    const assignedMembers = (evt.assignedMemberIds || []).map(id => getMemberById(id)).filter(Boolean);

                    return (
                      <tr key={evt.id} className={`transition group ${
                        isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-50'
                      }`}>
                        
                        <td className="py-3.5 px-4 text-center font-mono opacity-60 font-semibold">
                          {evt.srNo || idx + 1}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold group-hover:text-red-500 transition">
                            {evt.name}
                          </div>
                          <div className="flex items-center space-x-2 mt-0.5 text-[10px] opacity-60">
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-0.5" />
                              {evt.campus}
                            </span>
                            {evt.notes && (
                              <span className="truncate max-w-[180px]" title={evt.notes}>
                                • {evt.notes}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 opacity-50 shrink-0" />
                            <span>{evt.contactPerson || '—'}</span>
                          </div>
                          {evt.communicationDetails && (
                            <p className="text-[10px] opacity-60 truncate max-w-[140px]" title={evt.communicationDetails}>
                              {evt.communicationDetails}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          {evt.emailReceived ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/30">
                              No
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-medium whitespace-nowrap">
                          {evt.date}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {assignedMembers.length === 0 ? (
                              <span className="text-red-500/80 text-[11px] font-medium italic mr-1">
                                No crew allotted
                              </span>
                            ) : (
                              assignedMembers.map(m => {
                                const count = memberStats[m.id] || 0;
                                return (
                                  <span 
                                    key={m.id}
                                    className={`inline-flex items-center gap-1.5 pl-2 pr-1 py-0.5 rounded-md text-[11px] font-medium border transition ${
                                      isDark 
                                        ? 'bg-zinc-800 text-zinc-200 border-zinc-700' 
                                        : 'bg-zinc-100 text-zinc-800 border-zinc-300'
                                    }`}
                                  >
                                    <span>{m.name}</span>
                                    <span className={`text-[9px] px-1 rounded-sm font-bold ${
                                      count >= 3 ? 'bg-red-500/20 text-red-500' : 'opacity-60'
                                    }`}>
                                      {count}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onToggleMemberInEvent) {
                                          onToggleMemberInEvent(evt.id, m.id);
                                        }
                                      }}
                                      title={`Remove ${m.name} from this event`}
                                      className="p-0.5 rounded hover:bg-red-500/20 hover:text-red-500 text-zinc-400 hover:text-red-400 transition"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                );
                              })
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setAllotmentModalEventId(evt.id);
                                setAllotmentSearch('');
                                setAllotmentRoleFilter('ALL');
                              }}
                              title="Add or remove students for this event"
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border border-dashed transition ${
                                isDark
                                  ? 'border-zinc-700 text-zinc-400 hover:border-red-500 hover:text-red-400 hover:bg-zinc-800'
                                  : 'border-zinc-300 text-zinc-600 hover:border-red-500 hover:text-red-500 hover:bg-zinc-50'
                              }`}
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add / Edit</span>
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {evt.driveLink ? (
                            <div className="flex items-center space-x-1.5">
                              <a
                                href={evt.driveLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 text-red-500 hover:text-red-600 underline underline-offset-2 text-[11px] max-w-[100px] truncate font-semibold"
                              >
                                <span>Open Drive</span>
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                              <button
                                onClick={() => copyToClipboard(evt.driveLink, evt.id)}
                                title="Copy Drive URL"
                                className="p-1 rounded opacity-60 hover:opacity-100 transition"
                              >
                                {copiedId === evt.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDriveModalEventId(evt.id);
                                  setDriveInputUrl(evt.driveLink || '');
                                }}
                                title="Edit Drive Link"
                                className="p-1 rounded opacity-60 hover:text-red-400 hover:opacity-100 transition"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setDriveModalEventId(evt.id);
                                setDriveInputUrl('');
                              }}
                              className="inline-flex items-center space-x-1 text-[11px] font-semibold text-red-500 hover:text-red-400 border border-dashed border-red-500/40 hover:border-red-500 px-2 py-0.5 rounded-md transition hover:bg-red-500/10"
                              title="Upload or paste Google Drive Link"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Drive Link</span>
                            </button>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <button
                            onClick={() => onToggleDriveStatus(evt.id)}
                            title="Click to toggle submission status in real-time"
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition transform active:scale-95 border ${
                              evt.driveLinkSubmitted
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20'
                            }`}
                          >
                            {evt.driveLinkSubmitted ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Submitted</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Pending</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1 opacity-80 group-hover:opacity-100 transition">
                            <button
                              onClick={() => copyWhatsAppFormat(evt)}
                              title="Copy WhatsApp Group Allotment Text"
                              className="p-1.5 rounded-lg opacity-60 hover:text-emerald-500 hover:opacity-100 transition"
                            >
                              {copiedWpId === evt.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <MessageSquare className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => onEditEvent(evt)}
                              title="Edit Event"
                              className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteEvent(evt.id)}
                              title="Delete Event"
                              className="p-1.5 rounded-lg opacity-60 hover:text-red-500 hover:opacity-100 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedEvents.length === 0 ? (
            <div className={`col-span-full py-12 text-center text-xs opacity-50 border rounded-2xl ${
              isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            }`}>
              No events matching filters.
            </div>
          ) : (
            sortedEvents.map((evt, idx) => {
            const assignedMembers = (evt.assignedMemberIds || []).map(id => getMemberById(id)).filter(Boolean);

            return (
              <div
                key={evt.id}
                className={`border rounded-2xl p-5 flex flex-col justify-between hover:border-red-500/50 transition shadow-lg relative group ${
                  isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                      isDark ? 'bg-zinc-950 border-zinc-800 opacity-70' : 'bg-zinc-100 border-zinc-200'
                    }`}>
                      #{evt.srNo || idx + 1}
                    </span>
                    
                    <button
                      onClick={() => onToggleDriveStatus(evt.id)}
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        evt.driveLinkSubmitted
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-500 border-red-500/30'
                      }`}
                    >
                      {evt.driveLinkSubmitted ? 'Drive Uploaded' : 'Drive Pending'}
                    </button>
                  </div>

                  <h3 className="text-sm font-bold mb-1 group-hover:text-red-500 transition">
                    {evt.name}
                  </h3>

                  <div className="space-y-1.5 text-xs opacity-70 my-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{evt.date}</span>
                      <span>•</span>
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{evt.campus}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <User className="w-3.5 h-3.5" />
                      <span>{evt.contactPerson || 'POC not specified'}</span>
                    </div>

                    {evt.notes && (
                      <p className={`text-[11px] p-2 rounded-lg border mt-2 ${
                        isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                      }`}>
                        {evt.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className={`pt-3 border-t space-y-3 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                        Assigned Crew ({assignedMembers.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAllotmentModalEventId(evt.id);
                          setAllotmentSearch('');
                          setAllotmentRoleFilter('ALL');
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-400 transition"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Manage Crew</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      {assignedMembers.length === 0 ? (
                        <span className="text-[10px] italic text-red-500/70">No crew allotted yet</span>
                      ) : (
                        assignedMembers.map(m => (
                          <span 
                            key={m.id}
                            className={`inline-flex items-center gap-1 text-[10px] pl-2 pr-1 py-0.5 rounded border font-medium ${
                              isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-zinc-100 border-zinc-300 text-zinc-800'
                            }`}
                          >
                            <span>{m.name} ({memberStats[m.id] || 0})</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onToggleMemberInEvent) {
                                  onToggleMemberInEvent(evt.id, m.id);
                                }
                              }}
                              title={`Remove ${m.name}`}
                              className="p-0.5 rounded hover:bg-red-500/20 hover:text-red-500 text-zinc-400 transition"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {evt.driveLink ? (
                      <div className="flex items-center space-x-2">
                        <a
                          href={evt.driveLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-red-500 hover:text-red-600 text-xs font-semibold"
                        >
                          <span>Open Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setDriveModalEventId(evt.id);
                            setDriveInputUrl(evt.driveLink || '');
                          }}
                          title="Edit Drive Link"
                          className="p-1 rounded opacity-60 hover:text-red-400 hover:opacity-100 transition"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setDriveModalEventId(evt.id);
                          setDriveInputUrl('');
                        }}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-red-500 hover:text-red-400 border border-dashed border-red-500/40 hover:border-red-500 px-2 py-0.5 rounded-md transition hover:bg-red-500/10"
                        title="Upload or paste Google Drive Link"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Drive Link</span>
                      </button>
                    )}

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => copyWhatsAppFormat(evt)}
                        title="Copy WhatsApp Group Message"
                        className="p-1.5 rounded-lg opacity-60 hover:text-emerald-500 hover:opacity-100 transition"
                      >
                        {copiedWpId === evt.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <MessageSquare className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => onEditEvent(evt)}
                        className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteEvent(evt.id)}
                        className="p-1.5 rounded-lg opacity-60 hover:text-red-500 hover:opacity-100 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            );
          })
        )}
        </div>
      )}

      {/* Quick Crew Allotment Modal */}
      {currentAllotmentEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
            isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            {/* Modal Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-zinc-50'
            }`}>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="p-1.5 rounded-lg bg-red-600 text-white">
                    <Users className="w-4 h-4" />
                  </span>
                  <h3 className="font-bold text-sm">Edit Crew Allotment</h3>
                </div>
                <p className="text-xs opacity-60 mt-0.5">
                  <span className="font-semibold text-red-500">{currentAllotmentEvent.name}</span> • {currentAllotmentEvent.date} • {currentAllotmentEvent.campus}
                </p>
              </div>
              <button
                onClick={() => setAllotmentModalEventId(null)}
                className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-zinc-800/50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className={`p-3 border-b space-y-2 ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50/50'}`}>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
                <input
                  type="text"
                  placeholder="Search member by name or skill..."
                  value={allotmentSearch}
                  onChange={(e) => setAllotmentSearch(e.target.value)}
                  className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-500 transition ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-1">
                  {['ALL', 'Coordinator', 'Volunteer'].map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setAllotmentRoleFilter(role)}
                      className={`px-2 py-0.5 rounded-md font-semibold transition ${
                        allotmentRoleFilter === role
                          ? 'bg-red-600 text-white'
                          : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-zinc-200 text-zinc-600 hover:text-black'
                      }`}
                    >
                      {role === 'ALL' ? 'All Roles' : role + 's'}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] font-bold text-red-500">
                  {(currentAllotmentEvent.assignedMemberIds || []).length} Allotted
                </span>
              </div>
            </div>

            {/* Member Selection List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-zinc-800/30">
              {filteredModalMembers.length === 0 ? (
                <div className="py-8 text-center text-xs opacity-50">
                  No members match "{allotmentSearch}".
                </div>
              ) : (
                filteredModalMembers.map(member => {
                  const isAssigned = (currentAllotmentEvent.assignedMemberIds || []).includes(member.id);
                  const count = memberStats[member.id] || 0;

                  return (
                    <div
                      key={member.id}
                      onClick={() => onToggleMemberInEvent && onToggleMemberInEvent(currentAllotmentEvent.id, member.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                        isAssigned
                          ? isDark
                            ? 'bg-red-950/20 border-red-500/50 text-white'
                            : 'bg-red-50 border-red-300 text-zinc-900'
                          : isDark
                          ? 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                          : 'bg-white border-zinc-200 hover:border-zinc-300 text-zinc-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                          isAssigned
                            ? 'bg-red-600 border-red-600 text-white'
                            : isDark ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-300 bg-zinc-100'
                        }`}>
                          {isAssigned && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold flex items-center space-x-1.5">
                            <span>{member.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                              member.role === 'Coordinator'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : member.role === 'Volunteer'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            }`}>
                              {member.role}
                            </span>
                          </div>
                          <div className="text-[10px] opacity-60 flex items-center space-x-2 mt-0.5">
                            <span>{member.campus}</span>
                            <span>•</span>
                            <span>{member.work || 'Photo / Video'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          count === 0
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : count >= 3
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-700'
                        }`}>
                          {count} events
                        </span>
                        <button
                          type="button"
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg transition ${
                            isAssigned
                              ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                              : isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                          }`}
                        >
                          {isAssigned ? 'Remove' : '+ Add'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className={`p-3 border-t flex items-center justify-between ${
              isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-zinc-50'
            }`}>
              <p className="text-[11px] opacity-60">
                Click any member to assign or remove. Synced instantly.
              </p>
              <button
                onClick={() => setAllotmentModalEventId(null)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Google Drive Modal */}
      {currentDriveEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${
            isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            {/* Modal Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-zinc-50'
            }`}>
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-red-600 text-white">
                  <ExternalLink className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-sm">Google Drive Link</h3>
                  <p className="text-[11px] opacity-60 truncate max-w-[240px]">
                    {currentDriveEvent.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDriveModalEventId(null)}
                className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-zinc-800/50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={(e) => {
              e.preventDefault();
              if (onUpdateDriveLink) {
                onUpdateDriveLink(currentDriveEvent.id, driveInputUrl);
              }
              setDriveModalEventId(null);
            }}>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5 opacity-80">
                    Drive Folder / Photos URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={driveInputUrl}
                    onChange={(e) => setDriveInputUrl(e.target.value)}
                    autoFocus
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-red-500 transition font-mono ${
                      isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-300 text-zinc-900'
                    }`}
                  />
                </div>

                <div className="text-[11px] opacity-60 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>
                    Adding a Drive link will automatically mark this event's status as <strong className="text-emerald-400">Drive Uploaded</strong> and sync live with all 5 Heads!
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className={`p-4 border-t flex items-center justify-between ${
                isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-zinc-50'
              }`}>
                {currentDriveEvent.driveLink ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Clear the Google Drive link for this event?')) {
                        if (onUpdateDriveLink) {
                          onUpdateDriveLink(currentDriveEvent.id, '');
                        }
                        setDriveModalEventId(null);
                      }
                    }}
                    className="text-xs font-semibold text-red-400 hover:text-red-300 transition"
                  >
                    Clear Link
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setDriveModalEventId(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium opacity-70 hover:opacity-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-red-600/30"
                  >
                    Save Drive Link
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
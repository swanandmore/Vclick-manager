import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  Sparkles, 
  Copy, 
  Check, 
  Calendar, 
  MapPin, 
  User, 
  Link as LinkIcon, 
  CheckCircle2, 
  Send,
  AlertCircle,
  Users
} from 'lucide-react';

export default function WhatsAppSyncModal({
  isOpen,
  onClose,
  allMembers,
  events,
  currentHead,
  onSaveNewEvent,
  onUpdateEvent
}) {
  const [activeTab, setActiveTab] = useState('import'); // 'import' or 'generate'
  const [pastedText, setPastedText] = useState('');
  const [targetEventId, setTargetEventId] = useState('NEW'); // 'NEW' or existing event ID

  // Parsed fields
  const [parsedData, setParsedData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    campus: 'Bibwewadi',
    contactPerson: '',
    driveLink: '',
    notes: '',
    matchedMemberIds: []
  });

  // Generator state
  const [selectedEventForBroadcast, setSelectedEventForBroadcast] = useState('');
  const [broadcastText, setBroadcastText] = useState('');
  const [copiedBroadcast, setCopiedBroadcast] = useState(false);

  // Automatically parse pasted WhatsApp text
  useEffect(() => {
    if (!pastedText.trim()) return;

    const lines = pastedText.split('\n').map(l => l.trim()).filter(Boolean);
    let name = '';
    let date = parsedData.date;
    let campus = 'Bibwewadi';
    let contactPerson = '';
    let driveLink = '';
    let notes = '';
    const matchedIds = new Set();

    // Regex matchers
    const driveRegex = /(https?:\/\/(?:drive\.google\.com|photos\.app\.goo\.gl)[^\s]+)/i;
    const driveMatch = pastedText.match(driveRegex);
    if (driveMatch) driveLink = driveMatch[1];

    if (/kondhwa/i.test(pastedText)) campus = 'Kondhwa';
    else if (/bibwewadi/i.test(pastedText)) campus = 'Bibwewadi';

    // Parse key-value lines or bullet points
    lines.forEach(line => {
      // Event name
      const nameMatch = line.match(/(?:event|name|shoot|coverage)\s*[:\-]\s*(.*)/i);
      if (nameMatch && nameMatch[1]) name = nameMatch[1].replace(/[*_~]/g, '').trim();

      // Date match
      const dateMatch = line.match(/(?:date|on|when)\s*[:\-]\s*(.*)/i);
      if (dateMatch && dateMatch[1]) {
        const rawDate = dateMatch[1].replace(/[*_~]/g, '').trim();
        // Try parsing date
        const parsedTimestamp = Date.parse(rawDate);
        if (!isNaN(parsedTimestamp)) {
          date = new Date(parsedTimestamp).toISOString().split('T')[0];
        }
      }

      // Contact / POC
      const pocMatch = line.match(/(?:poc|contact|faculty|staff|prof|requester)\s*[:\-]\s*(.*)/i);
      if (pocMatch && pocMatch[1]) contactPerson = pocMatch[1].replace(/[*_~]/g, '').trim();

      // Notes
      const notesMatch = line.match(/(?:notes|details|agenda|requirements)\s*[:\-]\s*(.*)/i);
      if (notesMatch && notesMatch[1]) notes = notesMatch[1].replace(/[*_~]/g, '').trim();
    });

    // If no explicit event line, use the first line as name
    if (!name && lines.length > 0) {
      name = lines[0].replace(/[*_~:]/g, '').trim();
    }

    // Match members from the entire text
    const lowerText = pastedText.toLowerCase();
    allMembers.forEach(m => {
      const lowerFullName = m.name.toLowerCase();
      const lowerFirstName = m.name.split(' ')[0].toLowerCase();
      
      // Match full name
      if (lowerText.includes(lowerFullName)) {
        matchedIds.add(m.id);
      } 
      // Match first name if at least 4 chars or distinct
      else if (lowerFirstName.length >= 3 && new RegExp(`\\b${lowerFirstName}\\b`, 'i').test(pastedText)) {
        matchedIds.add(m.id);
      }
    });

    setParsedData(prev => ({
      ...prev,
      name: name || prev.name,
      date,
      campus,
      contactPerson: contactPerson || prev.contactPerson,
      driveLink: driveLink || prev.driveLink,
      notes: notes || prev.notes,
      matchedMemberIds: Array.from(matchedIds)
    }));

  }, [pastedText, allMembers]);

  // When selected event changes in generator
  useEffect(() => {
    if (!selectedEventForBroadcast && events.length > 0) {
      setSelectedEventForBroadcast(events[0].id);
    }
  }, [events, selectedEventForBroadcast]);

  // Generate WhatsApp message preview
  useEffect(() => {
    const evt = events.find(e => e.id === selectedEventForBroadcast);
    if (!evt) return;

    const assignedNames = (evt.assignedMemberIds || [])
      .map(id => {
        const m = allMembers.find(mem => mem.id === id);
        return m ? `• *${m.name}* (${m.role} • ${m.work})` : null;
      })
      .filter(Boolean)
      .join('\n');

    const msg = `📸 *VCLICK MULTIMEDIA PROD.* 🎬\n` +
      `*EVENT ALLOTMENT CALL*\n\n` +
      `📍 *Event:* ${evt.name}\n` +
      `📅 *Date:* ${evt.date}\n` +
      `🏫 *Campus:* ${evt.campus}\n` +
      `👤 *POC / Contact:* ${evt.contactPerson || 'Club Head'}\n\n` +
      `👥 *Assigned Crew Members:*\n${assignedNames || '• None allotted yet'}\n\n` +
      (evt.driveLink ? `📁 *Drive Link:* ${evt.driveLink}\n` : '') +
      (evt.notes ? `📝 *Notes:* ${evt.notes}\n\n` : '\n') +
      `⚡ _Please acknowledge and coordinate in the group!_`;

    setBroadcastText(msg);
  }, [selectedEventForBroadcast, events, allMembers]);

  if (!isOpen) return null;

  // Toggle member chip in parsed preview
  const toggleMatchedMember = (id) => {
    setParsedData(prev => ({
      ...prev,
      matchedMemberIds: prev.matchedMemberIds.includes(id)
        ? prev.matchedMemberIds.filter(mId => mId !== id)
        : [...prev.matchedMemberIds, id]
    }));
  };

  // Submit parsed data
  const handleApplyParsed = () => {
    if (targetEventId === 'NEW') {
      if (!parsedData.name) {
        alert('Please provide an event name.');
        return;
      }
      onSaveNewEvent({
        name: parsedData.name,
        date: parsedData.date,
        campus: parsedData.campus,
        contactPerson: parsedData.contactPerson,
        driveLink: parsedData.driveLink,
        driveLinkSubmitted: Boolean(parsedData.driveLink),
        assignedMemberIds: parsedData.matchedMemberIds,
        notes: parsedData.notes,
        emailReceived: true
      });
    } else {
      const existing = events.find(e => e.id === targetEventId);
      if (!existing) return;
      onUpdateEvent({
        ...existing,
        name: parsedData.name || existing.name,
        contactPerson: parsedData.contactPerson || existing.contactPerson,
        campus: parsedData.campus || existing.campus,
        driveLink: parsedData.driveLink || existing.driveLink,
        notes: parsedData.notes || existing.notes,
        assignedMemberIds: Array.from(new Set([...existing.assignedMemberIds, ...parsedData.matchedMemberIds]))
      });
    }
    onClose();
  };

  const copyBroadcastText = () => {
    navigator.clipboard.writeText(broadcastText);
    setCopiedBroadcast(true);
    setTimeout(() => setCopiedBroadcast(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 text-zinc-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                WhatsApp Quick Sync & Parser
              </h2>
              <p className="text-xs text-zinc-400">
                Paste raw WhatsApp group messages to auto-update allotments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 px-6">
          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'import'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Paste WhatsApp Message & Import</span>
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'generate'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>Generate WhatsApp Broadcast</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          
          {activeTab === 'import' ? (
            <div className="space-y-4">
              
              {/* Target Destination */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Destination:
                </label>
                <select
                  value={targetEventId}
                  onChange={(e) => setTargetEventId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                >
                  <option value="NEW">➕ Create as New Event Record</option>
                  <optgroup label="Or Merge into Existing Event:">
                    {events.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.date} • {e.campus})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Text Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Paste WhatsApp Message:
                  </label>
                  <span className="text-[11px] text-zinc-500">
                    Smart parser extracts name, date, POC, campus & crew automatically
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Example paste:\nShoot for Mech Dept Video Shoot on 6 August at Bibwewadi.\nPOC: Dr Sandeep Kore\nAssigned: Pratham, Varad\nDrive: https://drive.google.com/...`}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Extracted Fields Preview */}
              {pastedText.trim() && (
                <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4" />
                      Extracted Preview
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Edit any field below before applying
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Event Name</span>
                      <input
                        type="text"
                        value={parsedData.name}
                        onChange={(e) => setParsedData({ ...parsedData, name: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Date</span>
                      <input
                        type="date"
                        value={parsedData.date}
                        onChange={(e) => setParsedData({ ...parsedData, date: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Campus</span>
                      <select
                        value={parsedData.campus}
                        onChange={(e) => setParsedData({ ...parsedData, campus: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white"
                      >
                        <option value="Bibwewadi">Bibwewadi</option>
                        <option value="Kondhwa">Kondhwa</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">POC / Requester</span>
                      <input
                        type="text"
                        value={parsedData.contactPerson}
                        onChange={(e) => setParsedData({ ...parsedData, contactPerson: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Matched Crew Members */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                        Matched Crew Members ({parsedData.matchedMemberIds.length})
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Click chips to toggle or add missing coords
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {allMembers.map(m => {
                        const isMatched = parsedData.matchedMemberIds.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleMatchedMember(m.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                              isMatched
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                : 'bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            {isMatched ? '✓ ' : '+ '} {m.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Apply Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleApplyParsed}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        {targetEventId === 'NEW' ? 'Create Event & Update Allotments' : 'Update Event Allotments'}
                      </span>
                    </button>
                  </div>

                </div>
              )}

            </div>
          ) : (
            /* Broadcast Generator */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Select Event to Broadcast to WhatsApp:
                </label>
                <select
                  value={selectedEventForBroadcast}
                  onChange={(e) => setSelectedEventForBroadcast(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                >
                  {events.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.date} • {e.campus})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-zinc-300">
                    Ready-to-Paste WhatsApp Message:
                  </span>
                  <button
                    onClick={copyBroadcastText}
                    className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-bold"
                  >
                    {copiedBroadcast ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Message</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={11}
                  value={broadcastText}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 font-mono focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={copyBroadcastText}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
                >
                  {copiedBroadcast ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedBroadcast ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
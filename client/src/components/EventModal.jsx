import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  MapPin,
  User,
  Link as LinkIcon,
  Camera,
  AlertTriangle,
  Search,
  Check,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Users
} from 'lucide-react';

// Generate array of date strings between startDate and endDate (inclusive)
function getDateRange(startDate, endDate) {
  if (!startDate || !endDate) return [];
  const result = [];
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  if (isNaN(start) || isNaN(end) || end < start) return [startDate].filter(Boolean);
  const current = new Date(start);
  let safety = 0;
  while (current <= end && safety < 31) {
    result.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
    safety++;
  }
  return result;
}

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function EventModal({
  isOpen,
  onClose,
  onSave,
  eventToEdit,
  allMembers,
  memberStats,
  allEvents
}) {
  const defaultForm = {
    name: '',
    contactPerson: '',
    emailReceived: true,
    communicationDetails: '',
    date: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    isMultiDay: false,
    campus: 'Bibwewadi',
    assignedMemberIds: [],
    dailyAssignments: {},
    driveLink: '',
    driveLinkSubmitted: false,
    status: 'Upcoming',
    notes: ''
  };

  const [formData, setFormData] = useState(defaultForm);
  const [activeDayTab, setActiveDayTab] = useState(0);

  const [candidateSearch, setCandidateSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [skillFilter, setSkillFilter] = useState('ALL');
  const [campusFilter, setCampusFilter] = useState('ALL');
  const [cameraOnly, setCameraOnly] = useState(false);

  useEffect(() => {
    if (eventToEdit) {
      setFormData({
        name: eventToEdit.name || '',
        contactPerson: eventToEdit.contactPerson || '',
        emailReceived: eventToEdit.emailReceived ?? true,
        communicationDetails: eventToEdit.communicationDetails || '',
        date: eventToEdit.date || eventToEdit.startDate || new Date().toISOString().split('T')[0],
        startDate: eventToEdit.startDate || eventToEdit.date || new Date().toISOString().split('T')[0],
        endDate: eventToEdit.endDate || eventToEdit.date || new Date().toISOString().split('T')[0],
        isMultiDay: Boolean(eventToEdit.isMultiDay),
        campus: eventToEdit.campus || 'Bibwewadi',
        assignedMemberIds: eventToEdit.assignedMemberIds || [],
        dailyAssignments: eventToEdit.dailyAssignments || {},
        driveLink: eventToEdit.driveLink || '',
        driveLinkSubmitted: eventToEdit.driveLinkSubmitted || false,
        status: eventToEdit.status || 'Upcoming',
        notes: eventToEdit.notes || ''
      });
    } else {
      setFormData(defaultForm);
    }
    setActiveDayTab(0);
    setCandidateSearch('');
    setRoleFilter('ALL');
    setSkillFilter('ALL');
    setCampusFilter('ALL');
    setCameraOnly(false);
  }, [eventToEdit, isOpen]);

  if (!isOpen) return null;

  // ── Date range helper ─────────────────────────────────────────────────────
  const dateRange = formData.isMultiDay
    ? getDateRange(formData.startDate, formData.endDate)
    : [formData.date];

  const currentDayDate = dateRange[activeDayTab] || dateRange[0];

  // ── Per-day crew toggle ───────────────────────────────────────────────────
  const toggleMemberForDay = (memberId, dayDate) => {
    if (formData.isMultiDay) {
      setFormData(prev => {
        const prev_day = prev.dailyAssignments[dayDate] || [];
        const exists = prev_day.includes(memberId);
        const newDay = exists ? prev_day.filter(id => id !== memberId) : [...prev_day, memberId];
        const newDA = { ...prev.dailyAssignments, [dayDate]: newDay };
        // Update union assignedMemberIds
        const allIds = new Set();
        Object.values(newDA).forEach(ids => ids.forEach(id => allIds.add(id)));
        return { ...prev, dailyAssignments: newDA, assignedMemberIds: Array.from(allIds) };
      });
    } else {
      setFormData(prev => {
        const exists = prev.assignedMemberIds.includes(memberId);
        return {
          ...prev,
          assignedMemberIds: exists
            ? prev.assignedMemberIds.filter(id => id !== memberId)
            : [...prev.assignedMemberIds, memberId]
        };
      });
    }
  };

  const isMemberSelectedForDay = (memberId, dayDate) => {
    if (formData.isMultiDay) {
      return (formData.dailyAssignments[dayDate] || []).includes(memberId);
    }
    return formData.assignedMemberIds.includes(memberId);
  };

  // ── Conflict detection ────────────────────────────────────────────────────
  const bookedOnDate = new Set();
  if (currentDayDate) {
    allEvents
      .filter(e => {
        if (eventToEdit && e.id === eventToEdit.id) return false;
        if (e.isMultiDay && e.dailyAssignments) {
          return Object.keys(e.dailyAssignments).includes(currentDayDate);
        }
        return e.date === currentDayDate;
      })
      .forEach(e => {
        if (e.isMultiDay && e.dailyAssignments && e.dailyAssignments[currentDayDate]) {
          e.dailyAssignments[currentDayDate].forEach(mId => bookedOnDate.add(mId));
        } else {
          (e.assignedMemberIds || []).forEach(mId => bookedOnDate.add(mId));
        }
      });
  }

  // ── Candidate list ────────────────────────────────────────────────────────
  const filteredCandidates = allMembers
    .map(m => {
      const count = memberStats[m.id] || 0;
      const isBooked = bookedOnDate.has(m.id);
      return { ...m, currentCount: count, isBooked };
    })
    .filter(m => {
      const matchSearch = m.name.toLowerCase().includes(candidateSearch.toLowerCase());
      const matchRole = roleFilter === 'ALL' || m.role === roleFilter;
      const matchCampus = campusFilter === 'ALL' || m.campus === campusFilter;
      const matchCamera = !cameraOnly || m.hasCamera;
      let matchSkill = true;
      if (skillFilter !== 'ALL') matchSkill = m.work.includes(skillFilter);
      return matchSearch && matchRole && matchCampus && matchCamera && matchSkill;
    })
    .sort((a, b) => {
      const aSel = isMemberSelectedForDay(a.id, currentDayDate);
      const bSel = isMemberSelectedForDay(b.id, currentDayDate);
      if (aSel !== bSel) return aSel ? -1 : 1;
      return a.currentCount - b.currentCount;
    });

  // ── Auto-suggest ──────────────────────────────────────────────────────────
  const handleAutoSuggest = () => {
    const available = allMembers
      .filter(m => !bookedOnDate.has(m.id))
      .sort((a, b) => {
        const aCampus = a.campus === formData.campus ? 0 : 1;
        const bCampus = b.campus === formData.campus ? 0 : 1;
        if (aCampus !== bCampus) return aCampus - bCampus;
        return (memberStats[a.id] || 0) - (memberStats[b.id] || 0);
      });

    const selectedIds = new Set(
      formData.isMultiDay
        ? (formData.dailyAssignments[currentDayDate] || [])
        : formData.assignedMemberIds
    );
    let photoCount = 0;
    let videoCount = 0;

    available.forEach(m => {
      if (m.work.includes('PHOTO') && photoCount < 2 && !selectedIds.has(m.id)) {
        selectedIds.add(m.id); photoCount++;
      } else if (m.work.includes('VIDEO') && videoCount < 1 && !selectedIds.has(m.id)) {
        selectedIds.add(m.id); videoCount++;
      }
    });

    if (formData.isMultiDay) {
      setFormData(prev => {
        const newDA = { ...prev.dailyAssignments, [currentDayDate]: Array.from(selectedIds) };
        const allIds = new Set();
        Object.values(newDA).forEach(ids => ids.forEach(id => allIds.add(id)));
        return { ...prev, dailyAssignments: newDA, assignedMemberIds: Array.from(allIds) };
      });
    } else {
      setFormData(prev => ({ ...prev, assignedMemberIds: Array.from(selectedIds) }));
    }
  };

  // ── Multi-day toggle ──────────────────────────────────────────────────────
  const handleMultiDayToggle = (enabled) => {
    if (enabled) {
      // Migrate existing single-day crew to day 1
      const sd = formData.date;
      const ed = formData.date;
      const da = { [sd]: [...formData.assignedMemberIds] };
      setFormData(prev => ({
        ...prev,
        isMultiDay: true,
        startDate: sd,
        endDate: ed,
        dailyAssignments: da
      }));
    } else {
      // Flatten: union of all days → single assignedMemberIds
      const allIds = new Set();
      Object.values(formData.dailyAssignments).forEach(ids => ids.forEach(id => allIds.add(id)));
      setFormData(prev => ({
        ...prev,
        isMultiDay: false,
        date: prev.startDate,
        assignedMemberIds: Array.from(allIds),
        dailyAssignments: {}
      }));
    }
    setActiveDayTab(0);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  // ── Day summary ──────────────────────────────────────────────────────────
  const getDayCrewCount = (dayDate) => {
    return (formData.dailyAssignments[dayDate] || []).length;
  };

  const totalUniqueCrewCount = formData.isMultiDay
    ? formData.assignedMemberIds.length
    : formData.assignedMemberIds.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 text-zinc-100">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div>
            <h2 className="text-base font-bold text-white">
              {eventToEdit ? 'Edit Event Details' : 'Create New Event Record'}
            </h2>
            <p className="text-xs text-zinc-400">
              VCLICK Real-Time System • Synchronized across all 5 heads
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">

          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Name of Event *</label>
              <input
                type="text"
                required
                placeholder="e.g. Independence Day, Guru Pournima IT Dept..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Contact Person</label>
              <input
                type="text"
                placeholder="e.g. Prof. Riddhi Mirajkar"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Campus Location</label>
              <select
                value={formData.campus}
                onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="Bibwewadi">Bibwewadi</option>
                <option value="Kondhwa">Kondhwa</option>
              </select>
            </div>

            {/* Multi-Day Toggle */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <CalendarRange className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-xs font-semibold text-white">Multi-Day Event</p>
                    <p className="text-[10px] text-zinc-400">Enable to assign different crew members per day</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleMultiDayToggle(!formData.isMultiDay)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.isMultiDay ? 'bg-red-600' : 'bg-zinc-700'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ease-in-out ${
                    formData.isMultiDay ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* Date fields */}
            {!formData.isMultiDay ? (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Date of Event *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value, startDate: e.target.value, endDate: e.target.value })}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      // If end is before start, push end forward
                      const newEnd = formData.endDate < newStart ? newStart : formData.endDate;
                      setFormData(prev => ({
                        ...prev,
                        startDate: newStart,
                        endDate: newEnd,
                        date: newStart
                      }));
                      setActiveDayTab(0);
                    }}
                    className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    min={formData.startDate}
                    value={formData.endDate}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, endDate: e.target.value }));
                      setActiveDayTab(0);
                    }}
                    className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </>
            )}

            {/* Email status */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Email Received Status</label>
              <div className="flex items-center space-x-4 h-9">
                <label className="flex items-center space-x-2 text-xs text-zinc-200 cursor-pointer">
                  <input type="radio" name="emailReceived" checked={formData.emailReceived === true}
                    onChange={() => setFormData({ ...formData, emailReceived: true })}
                    className="text-red-600 focus:ring-red-500" />
                  <span>Yes</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-zinc-200 cursor-pointer">
                  <input type="radio" name="emailReceived" checked={formData.emailReceived === false}
                    onChange={() => setFormData({ ...formData, emailReceived: false })}
                    className="text-red-600 focus:ring-red-500" />
                  <span>No</span>
                </label>
              </div>
            </div>

            {!formData.emailReceived && (
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Communication Details</label>
                <input
                  type="text"
                  placeholder="e.g. Verbal request by HOD, WhatsApp group message..."
                  value={formData.communicationDetails}
                  onChange={(e) => setFormData({ ...formData, communicationDetails: e.target.value })}
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Google Drive Link</label>
              <input
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={formData.driveLink}
                onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Drive Link Submitted?</label>
              <label className="flex items-center space-x-2 h-9 text-xs text-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.driveLinkSubmitted}
                  onChange={(e) => setFormData({ ...formData, driveLinkSubmitted: e.target.checked })}
                  className="rounded border-zinc-700 text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <span>Yes, uploaded to Google Drive</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Notes / Details</label>
              <textarea
                rows={2}
                placeholder="Equipment requirements, shot list, deliverables..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

          </div>

          {/* Section 2: Crew Allotment */}
          <div className="border-t border-zinc-800 pt-5 space-y-3">

            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  {formData.isMultiDay ? 'Assign Crew Per Day' : 'Assign Crew Members'}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                    {formData.isMultiDay
                      ? `${totalUniqueCrewCount} unique crew`
                      : `${formData.assignedMemberIds.length} Selected`}
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  {formData.isMultiDay
                    ? 'Select a day tab below to assign crew for that specific day'
                    : 'Sorted by lowest event count to balance workload equally'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutoSuggest}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Suggest</span>
              </button>
            </div>

            {/* Day Tabs for Multi-Day */}
            {formData.isMultiDay && dateRange.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {dateRange.map((dayDate, idx) => {
                  const count = getDayCrewCount(dayDate);
                  const isActive = idx === activeDayTab;
                  return (
                    <button
                      key={dayDate}
                      type="button"
                      onClick={() => setActiveDayTab(idx)}
                      className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                        isActive
                          ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-600/30'
                          : 'bg-zinc-950 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                      }`}
                    >
                      <div className="font-bold">Day {idx + 1}</div>
                      <div className="text-[10px] opacity-80">{formatDateLabel(dayDate)}</div>
                      <div className={`text-[10px] mt-0.5 font-bold ${count > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {count} crew
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Active day label */}
            {formData.isMultiDay && currentDayDate && (
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
                <Calendar className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="text-xs text-zinc-300">
                  Assigning crew for: <span className="font-bold text-white">{formatDateLabel(currentDayDate)}</span>
                  {' '}— <span className="text-zinc-400">{getDayCrewCount(currentDayDate)} member{getDayCrewCount(currentDayDate) !== 1 ? 's' : ''} assigned</span>
                </span>
              </div>
            )}

            {/* Filters */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
              <div className="col-span-2 sm:col-span-1">
                <input
                  type="text"
                  placeholder="Search name..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500"
                />
              </div>
              <div>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200">
                  <option value="ALL">All Roles</option>
                  <option value="Volunteer">Volunteers</option>
                  <option value="Coordinator">Coordinators</option>
                  <option value="Head">Heads</option>
                </select>
              </div>
              <div>
                <select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)}
                  className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200">
                  <option value="ALL">All Skills</option>
                  <option value="PHOTO">Photo</option>
                  <option value="VIDEO">Video</option>
                  <option value="EDIT">Edit</option>
                </select>
              </div>
              <div>
                <select value={campusFilter} onChange={(e) => setCampusFilter(e.target.value)}
                  className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200">
                  <option value="ALL">All Campuses</option>
                  <option value="Bibwewadi">Bibwewadi</option>
                  <option value="Kondhwa">Kondhwa</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center space-x-1.5 text-xs text-zinc-300 cursor-pointer">
                  <input type="checkbox" checked={cameraOnly} onChange={(e) => setCameraOnly(e.target.checked)}
                    className="rounded border-zinc-700 text-red-600 focus:ring-red-500 w-3.5 h-3.5" />
                  <span>Has Camera</span>
                </label>
              </div>
            </div>

            {/* Candidate Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
              {filteredCandidates.map(m => {
                const isSelected = isMemberSelectedForDay(m.id, currentDayDate);

                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMemberForDay(m.id, currentDayDate)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-red-600/20 border-red-500 text-white shadow-sm'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isSelected ? 'bg-red-600 border-red-500 text-white' : 'border-zinc-700'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate flex items-center gap-1.5">
                          <span>{m.name}</span>
                          {m.hasCamera && <Camera className="w-3 h-3 text-red-500 shrink-0" title="Owns Camera" />}
                        </div>
                        <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                          <span>{m.role}</span>
                          <span>•</span>
                          <span>{m.campus}</span>
                          <span>•</span>
                          <span className="font-mono text-red-400">{m.work}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.currentCount === 0
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : m.currentCount <= 2
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-red-500/20 text-red-400 border border-red-500/40'
                      }`}>
                        {m.currentCount} {m.currentCount === 1 ? 'event' : 'events'}
                      </span>
                      {m.isBooked && (
                        <div className="text-[9px] text-red-400 font-medium mt-0.5 flex items-center gap-0.5 justify-end">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Same date</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Multi-day crew summary */}
            {formData.isMultiDay && dateRange.length > 1 && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
                <p className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-red-400" />
                  Crew Summary ({totalUniqueCrewCount} unique members across all days)
                </p>
                <div className="flex flex-wrap gap-2">
                  {dateRange.map((dayDate, idx) => (
                    <div key={dayDate} className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1">
                      <span className="text-[10px] font-bold text-zinc-400">Day {idx + 1}</span>
                      <span className="text-[10px] text-zinc-500">{formatDateLabel(dayDate)}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        getDayCrewCount(dayDate) > 0
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-700 text-zinc-500'
                      }`}>
                        {getDayCrewCount(dayDate)} crew
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition"
            >
              {eventToEdit ? 'Save Changes' : 'Create Event'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
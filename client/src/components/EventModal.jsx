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
  Check
} from 'lucide-react';

export default function EventModal({
  isOpen,
  onClose,
  onSave,
  eventToEdit,
  allMembers,
  memberStats,
  allEvents
}) {
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    emailReceived: true,
    communicationDetails: '',
    date: new Date().toISOString().split('T')[0],
    campus: 'Bibwewadi',
    assignedMemberIds: [],
    driveLink: '',
    driveLinkSubmitted: false,
    status: 'Upcoming',
    notes: ''
  });

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
        date: eventToEdit.date || new Date().toISOString().split('T')[0],
        campus: eventToEdit.campus || 'Bibwewadi',
        assignedMemberIds: eventToEdit.assignedMemberIds || [],
        driveLink: eventToEdit.driveLink || '',
        driveLinkSubmitted: eventToEdit.driveLinkSubmitted || false,
        status: eventToEdit.status || 'Upcoming',
        notes: eventToEdit.notes || ''
      });
    } else {
      setFormData({
        name: '',
        contactPerson: '',
        emailReceived: true,
        communicationDetails: '',
        date: new Date().toISOString().split('T')[0],
        campus: 'Bibwewadi',
        assignedMemberIds: [],
        driveLink: '',
        driveLinkSubmitted: false,
        status: 'Upcoming',
        notes: ''
      });
    }
  }, [eventToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleMember = (id) => {
    setFormData(prev => {
      const exists = prev.assignedMemberIds.includes(id);
      return {
        ...prev,
        assignedMemberIds: exists 
          ? prev.assignedMemberIds.filter(mId => mId !== id)
          : [...prev.assignedMemberIds, id]
      };
    });
  };

  const bookedOnDate = new Set();
  if (formData.date) {
    allEvents
      .filter(e => e.date === formData.date && (!eventToEdit || e.id !== eventToEdit.id))
      .forEach(e => {
        (e.assignedMemberIds || []).forEach(mId => bookedOnDate.add(mId));
      });
  }

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
      if (skillFilter !== 'ALL') {
        matchSkill = m.work.includes(skillFilter);
      }

      return matchSearch && matchRole && matchCampus && matchCamera && matchSkill;
    })
    .sort((a, b) => {
      const aAssigned = formData.assignedMemberIds.includes(a.id);
      const bAssigned = formData.assignedMemberIds.includes(b.id);
      if (aAssigned !== bAssigned) return aAssigned ? -1 : 1;
      return a.currentCount - b.currentCount;
    });

  const handleAutoSuggest = () => {
    const available = allMembers
      .filter(m => !bookedOnDate.has(m.id))
      .sort((a, b) => {
        const aCampus = a.campus === formData.campus ? 0 : 1;
        const bCampus = b.campus === formData.campus ? 0 : 1;
        if (aCampus !== bCampus) return aCampus - bCampus;
        return (memberStats[a.id] || 0) - (memberStats[b.id] || 0);
      });

    const selectedIds = new Set(formData.assignedMemberIds);
    let photoCount = 0;
    let videoCount = 0;

    available.forEach(m => {
      if (m.work.includes('PHOTO') && photoCount < 2 && !selectedIds.has(m.id)) {
        selectedIds.add(m.id);
        photoCount++;
      } else if (m.work.includes('VIDEO') && videoCount < 1 && !selectedIds.has(m.id)) {
        selectedIds.add(m.id);
        videoCount++;
      }
    });

    setFormData(prev => ({
      ...prev,
      assignedMemberIds: Array.from(selectedIds)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8 text-zinc-100">
        
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Name of Event *
              </label>
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
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Contact Person (Staff / Student Requester)
              </label>
              <input
                type="text"
                placeholder="e.g. Prof. Riddhi Mirajkar, Dr. Sandeep S Kore"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Date of Event *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Campus Location
              </label>
              <select
                value={formData.campus}
                onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="Bibwewadi">Bibwewadi</option>
                <option value="Kondhwa">Kondhwa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Email Received Status
              </label>
              <div className="flex items-center space-x-4 h-9">
                <label className="flex items-center space-x-2 text-xs text-zinc-200 cursor-pointer">
                  <input
                    type="radio"
                    name="emailReceived"
                    checked={formData.emailReceived === true}
                    onChange={() => setFormData({ ...formData, emailReceived: true })}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span>Yes (Email Received)</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-zinc-200 cursor-pointer">
                  <input
                    type="radio"
                    name="emailReceived"
                    checked={formData.emailReceived === false}
                    onChange={() => setFormData({ ...formData, emailReceived: false })}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {!formData.emailReceived && (
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Communication Details (since no official email)
                </label>
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
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Google Drive Link
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/drive/folders/..."
                value={formData.driveLink}
                onChange={(e) => setFormData({ ...formData, driveLink: e.target.value })}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Drive Link Submitted?
              </label>
              <label className="flex items-center space-x-2 h-9 text-xs text-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.driveLinkSubmitted}
                  onChange={(e) => setFormData({ ...formData, driveLinkSubmitted: e.target.checked })}
                  className="rounded border-zinc-700 text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <span>Yes, final deliverables uploaded to Google Drive</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Any Other Details / Notes
              </label>
              <textarea
                rows={2}
                placeholder="Equipment requirements, shot list, deliverables requested..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>

          </div>

          {/* Section 2: Smart Crew Allotment */}
          <div className="border-t border-zinc-800 pt-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Assign Crew Members
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                    {formData.assignedMemberIds.length} Selected
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Sorted by lowest event count to balance workload equally
                </p>
              </div>

              <button
                type="button"
                onClick={handleAutoSuggest}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Suggest Balanced Crew</span>
              </button>
            </div>

            {/* Quick Candidate Filters */}
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
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                >
                  <option value="ALL">All Roles</option>
                  <option value="Volunteer">Volunteers</option>
                  <option value="Coordinator">Coordinators</option>
                  <option value="Head">Heads</option>
                </select>
              </div>

              <div>
                <select
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                >
                  <option value="ALL">All Skills</option>
                  <option value="PHOTO">Photo</option>
                  <option value="VIDEO">Video</option>
                  <option value="EDIT">Edit</option>
                </select>
              </div>

              <div>
                <select
                  value={campusFilter}
                  onChange={(e) => setCampusFilter(e.target.value)}
                  className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                >
                  <option value="ALL">All Campuses</option>
                  <option value="Bibwewadi">Bibwewadi</option>
                  <option value="Kondhwa">Kondhwa</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-1.5 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cameraOnly}
                    onChange={(e) => setCameraOnly(e.target.checked)}
                    className="rounded border-zinc-700 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                  />
                  <span>Has Camera</span>
                </label>
              </div>
            </div>

            {/* Candidate Selector Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
              {filteredCandidates.map(m => {
                const isSelected = formData.assignedMemberIds.includes(m.id);

                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMember(m.id)}
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
                          {m.hasCamera && (
                            <span title="Owns Camera">
                              <Camera className="w-3 h-3 text-red-500 shrink-0" />
                            </span>
                          )}
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

          </div>

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
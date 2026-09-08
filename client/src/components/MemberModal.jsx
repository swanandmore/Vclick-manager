import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function MemberModal({
  isOpen,
  onClose,
  onSave,
  memberToEdit
}) {
  const [formData, setFormData] = useState({
    name: '',
    role: 'Volunteer',
    campus: 'Bibwewadi',
    hasCamera: false,
    work: 'PHOTO',
    collegeTimings: 'Morning',
    phone: ''
  });

  useEffect(() => {
    if (memberToEdit) {
      setFormData({
        name: memberToEdit.name || '',
        role: memberToEdit.role || 'Volunteer',
        campus: memberToEdit.campus || 'Bibwewadi',
        hasCamera: memberToEdit.hasCamera || false,
        work: memberToEdit.work || 'PHOTO',
        collegeTimings: memberToEdit.collegeTimings || '',
        phone: memberToEdit.phone || ''
      });
    } else {
      setFormData({
        name: '',
        role: 'Volunteer',
        campus: 'Bibwewadi',
        hasCamera: false,
        work: 'PHOTO',
        collegeTimings: 'Morning',
        phone: ''
      });
    }
  }, [memberToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-zinc-100">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <h2 className="text-base font-bold text-white">
            {memberToEdit ? 'Edit Team Member' : 'Add Team Member'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Atharva Dharankar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Club Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="Volunteer">Volunteer</option>
                <option value="Coordinator">Coordinator</option>
                <option value="Head">Head</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Campus
              </label>
              <select
                value={formData.campus}
                onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="Bibwewadi">Bibwewadi</option>
                <option value="Kondhwa">Kondhwa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Primary Skill / Work
              </label>
              <select
                value={formData.work}
                onChange={(e) => setFormData({ ...formData, work: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="PHOTO">PHOTO</option>
                <option value="VIDEO">VIDEO</option>
                <option value="PHOTO/VIDEO">PHOTO/VIDEO</option>
                <option value="EDIT">EDIT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Owns Camera?
              </label>
              <label className="flex items-center space-x-2 h-9 text-xs text-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasCamera}
                  onChange={(e) => setFormData({ ...formData, hasCamera: e.target.checked })}
                  className="rounded border-zinc-700 text-red-600 focus:ring-red-500 w-4 h-4"
                />
                <span>Yes (Camera: Yes)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              College Timings / Availability
            </label>
            <input
              type="text"
              placeholder="e.g. Morning 8:30 - 2:30, Afternoon, Flexible..."
              value={formData.collegeTimings}
              onChange={(e) => setFormData({ ...formData, collegeTimings: e.target.value })}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="text"
              placeholder="+91 98220 00000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
            />
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
              {memberToEdit ? 'Save Changes' : 'Add to Team'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
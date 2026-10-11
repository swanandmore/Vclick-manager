import React, { useState } from 'react';
import { 
  X, 
  Star, 
  ExternalLink, 
  CheckCircle2, 
  Lock, 
  Check, 
  Sparkles, 
  Award,
  ShieldCheck,
  Camera,
  MapPin
} from 'lucide-react';

export default function EventReviewModal({
  isOpen,
  onClose,
  event,
  allMembers = [],
  currentHead,
  onSaveReview
}) {
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [savingMemberId, setSavingMemberId] = useState(null);
  const [savedMemberId, setSavedMemberId] = useState(null);

  if (!isOpen || !event) return null;

  // Filter ONLY Coordinators and Volunteers who are assigned to this event
  const assignedAssessableMembers = (event.assignedMemberIds || [])
    .map(id => allMembers.find(m => m.id === id))
    .filter(m => m && (m.role === 'Coordinator' || m.role === 'Volunteer'));

  const getDraft = (memberId) => {
    if (reviewDrafts[memberId]) {
      return reviewDrafts[memberId];
    }
    const existing = (event.crewReviews || []).find(r => r.memberId === memberId);
    if (existing) {
      return {
        isReviewed: Boolean(existing.isReviewed),
        rating: existing.rating || 5,
        feedback: existing.feedback || ''
      };
    }
    return {
      isReviewed: false,
      rating: 5,
      feedback: ''
    };
  };

  const updateDraft = (memberId, field, value) => {
    setReviewDrafts(prev => {
      const current = prev[memberId] || getDraft(memberId);
      return {
        ...prev,
        [memberId]: {
          ...current,
          [field]: value
        }
      };
    });
  };

  const handleSaveClick = async (member) => {
    const draft = getDraft(member.id);
    setSavingMemberId(member.id);
    try {
      await onSaveReview(event.id, member.id, draft);
      setSavedMemberId(member.id);
      setTimeout(() => setSavedMemberId(null), 2500);
    } catch (err) {
      console.error('Failed to save review:', err);
    } finally {
      setSavingMemberId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-zinc-100 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-500">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">
                  Review & Grade Event Crew
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30 flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Heads Only
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {event.name} • {event.date} ({event.campus})
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

        {/* Event Quick Info Banner */}
        <div className="px-6 py-3 bg-zinc-950/60 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          <div className="flex items-center space-x-2 text-zinc-400">
            <span>POC: <strong className="text-zinc-200">{event.contactPerson || 'Faculty'}</strong></span>
            <span>•</span>
            <span className={event.driveLinkSubmitted ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
              {event.driveLinkSubmitted ? 'Drive Uploaded' : 'Drive Pending'}
            </span>
          </div>

          {event.driveLink ? (
            <a
              href={event.driveLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-500 font-bold border border-red-500/30 transition text-[11px]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Inspect Drive Photos/Videos</span>
            </a>
          ) : (
            <span className="text-zinc-500 text-[11px] italic">No Drive Link</span>
          )}
        </div>

        {/* Scrollable Crew List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {assignedAssessableMembers.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500 border border-zinc-800/80 rounded-xl">
              No coordinators or volunteers are assigned to this event. (Heads cannot be graded).
            </div>
          ) : (
            assignedAssessableMembers.map(member => {
              const draft = getDraft(member.id);
              const isSaving = savingMemberId === member.id;
              const isSaved = savedMemberId === member.id;

              return (
                <div 
                  key={member.id}
                  className={`p-4 rounded-xl border transition ${
                    draft.isReviewed 
                      ? 'bg-zinc-950/80 border-emerald-500/30' 
                      : 'bg-zinc-950/40 border-zinc-800'
                  }`}
                >
                  {/* Member Info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-white">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-white">{member.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {member.role}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          Work: <strong className="text-red-400 font-mono">{member.work}</strong> • Current Auto Grade: <strong className="text-amber-400">{member.overallGrade?.toFixed(1) || '4.0'}/5.0</strong>
                        </div>
                      </div>
                    </div>

                    {draft.isReviewed ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        ✓ Reviewed ({draft.rating}/5)
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-bold border border-zinc-700">
                        Review Pending
                      </span>
                    )}
                  </div>

                  {/* Reviewed Toggle Switch */}
                  <div className="pb-2.5 mb-2.5 border-b border-zinc-800/80 flex items-center justify-between">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.isReviewed}
                        onChange={(e) => updateDraft(member.id, 'isReviewed', e.target.checked)}
                        className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-zinc-700 bg-zinc-900 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-zinc-200">
                        Photos & Videos Reviewed
                      </span>
                    </label>

                    {!draft.isReviewed && (
                      <span className="text-[11px] text-amber-500/80 flex items-center space-x-1">
                        <Lock className="w-3 h-3 inline mr-1" />
                        <span>Check "Reviewed" to unlock grading</span>
                      </span>
                    )}
                  </div>

                  {/* 5-Point Selector */}
                  <div className={`space-y-2 mb-3 transition-opacity ${draft.isReviewed ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-300">5-Point Event Rating:</span>
                      <span className="font-bold text-amber-400">{draft.rating} / 5 Points</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map(pts => (
                        <button
                          key={pts}
                          type="button"
                          disabled={!draft.isReviewed}
                          onClick={() => updateDraft(member.id, 'rating', pts)}
                          className={`flex-1 py-1 rounded-lg text-xs font-bold border transition flex items-center justify-center space-x-1 ${
                            draft.rating >= pts 
                              ? 'bg-amber-500 text-black border-amber-400' 
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <span>{pts}</span>
                          <Star className={`w-3 h-3 ${draft.rating >= pts ? 'fill-black' : 'fill-none'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Textarea */}
                  <div className={`mb-3 transition-opacity ${draft.isReviewed ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <textarea
                      rows={2}
                      disabled={!draft.isReviewed}
                      placeholder={
                        draft.isReviewed
                          ? "Constructive feedback on photos/videos framing, focus, punctuality..."
                          : "Check 'Reviewed' to unlock feedback..."
                      }
                      value={draft.feedback}
                      onChange={(e) => updateDraft(member.id, 'feedback', e.target.value)}
                      className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveClick(member)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md ${
                        isSaved
                          ? 'bg-emerald-600 text-white'
                          : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                      }`}
                    >
                      {isSaving ? (
                        <span>Saving...</span>
                      ) : isSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Saved & Updated!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Save Review for {member.name.split(' ')[0]}</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0 text-xs">
          <span className="text-zinc-500">
            Evaluating as: <strong className="text-zinc-300">{currentHead}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

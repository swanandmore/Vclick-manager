import React, { useState } from 'react';
import { 
  Award, 
  Star, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  ShieldCheck, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Unlock, 
  Edit2, 
  MessageSquare, 
  Sparkles,
  Camera,
  MapPin,
  Calendar,
  Check,
  TrendingUp,
  X
} from 'lucide-react';

export default function GradingDashboard({
  members = [],
  events = [],
  currentHead,
  onSaveReview,
  onSaveInitialGrade,
  theme = 'dark',
  authUser
}) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // ALL, Coordinator, Volunteer
  const [campusFilter, setCampusFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PENDING, REVIEWED
  const [sortBy, setSortBy] = useState('GRADE_DESC'); // GRADE_DESC, GRADE_ASC, PENDING_DESC, NAME_ASC
  const [expandedMemberId, setExpandedMemberId] = useState(null);

  // Initial Grade Edit Modal
  const [editingInitialMember, setEditingInitialMember] = useState(null);
  const [newInitialGrade, setNewInitialGrade] = useState(4.0);

  // Local draft state for event reviews being edited: { [`${eventId}_${memberId}`]: { isReviewed, rating, feedback } }
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [savingKey, setSavingKey] = useState(null);
  const [savedKey, setSavedKey] = useState(null);

  const isDark = theme === 'dark';
  const isCoord = authUser?.role === 'Coordinator';
  const isHead = authUser?.role === 'Head';

  // Access Control: Operating Heads or Coordinators
  const headMembers = members.filter(m => m.role === 'Head');
  const authorizedHeadNames = headMembers.length > 0 
    ? headMembers.map(h => h.name.toLowerCase()) 
    : ['swanand more', 'pratham hindocha', 'varad belsare'];
  
  const isAuthorized = isCoord || isHead || authorizedHeadNames.includes((currentHead || '').toLowerCase());

  if (!isAuthorized) {
    return (
      <div className={`p-8 rounded-3xl border text-center max-w-2xl mx-auto my-12 shadow-2xl ${
        isDark ? 'bg-zinc-900/90 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>
        <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-500">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black uppercase tracking-wider mb-2">
          Restricted Access: Operating Heads & Coordinators
        </h2>
        <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
          The Performance & Grading Portal contains confidential evaluation metrics. 
          Please sign in using your authorized Head or Coordinator passcode to access reviews.
        </p>
      </div>
    );
  }

  // Permission Boundary: Coordinators can ONLY access and grade Volunteers!
  const assessableMembers = isCoord
    ? members.filter(m => m.role === 'Volunteer')
    : members.filter(m => m.role === 'Coordinator' || m.role === 'Volunteer');

  // Overall Statistics
  const totalCrew = assessableMembers.length;
  const totalAssignedSlots = assessableMembers.reduce((sum, m) => {
    const assignedCount = events.filter(e => (e.assignedMemberIds || []).includes(m.id)).length;
    return sum + assignedCount;
  }, 0);

  let totalReviewedSlots = 0;
  let totalRatingSum = 0;

  events.forEach(evt => {
    (evt.crewReviews || []).forEach(rev => {
      if (rev.isReviewed && typeof rev.rating === 'number' && rev.rating > 0) {
        totalReviewedSlots++;
        totalRatingSum += rev.rating;
      }
    });
  });

  const totalPendingSlots = Math.max(0, totalAssignedSlots - totalReviewedSlots);
  const avgClubRating = assessableMembers.length > 0 
    ? (assessableMembers.reduce((sum, m) => sum + (m.overallGrade || m.initialGrade || 4.0), 0) / assessableMembers.length).toFixed(1)
    : '4.0';

  // Helper for Grade Tier Badge
  const getGradeTier = (grade) => {
    const g = Number(grade) || 4.0;
    if (g >= 4.6) return { label: 'A+ Master', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    if (g >= 4.2) return { label: 'A Excellent', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' };
    if (g >= 3.8) return { label: 'B+ Very Good', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    if (g >= 3.4) return { label: 'B Good', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    if (g >= 3.0) return { label: 'C+ Average', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
    return { label: 'C Needs Work', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
  };

  // Helper to get or initialize draft for an event-member review
  const getDraft = (event, member) => {
    const key = `${event.id}_${member.id}`;
    if (reviewDrafts[key]) {
      return reviewDrafts[key];
    }
    const existingRev = (event.crewReviews || []).find(r => r.memberId === member.id);
    if (existingRev) {
      return {
        isReviewed: Boolean(existingRev.isReviewed),
        rating: existingRev.rating || 5,
        feedback: existingRev.feedback || ''
      };
    }
    return {
      isReviewed: false,
      rating: 5,
      feedback: ''
    };
  };

  const updateDraft = (eventId, memberId, field, value) => {
    const key = `${eventId}_${memberId}`;
    setReviewDrafts(prev => {
      const current = prev[key] || getDraft(events.find(e => e.id === eventId), members.find(m => m.id === memberId));
      return {
        ...prev,
        [key]: {
          ...current,
          [field]: value
        }
      };
    });
  };

  const handleSaveReviewClick = async (event, member) => {
    const key = `${event.id}_${member.id}`;
    const draft = getDraft(event, member);
    setSavingKey(key);

    try {
      await onSaveReview(event.id, member.id, draft);
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2500);
    } catch (err) {
      console.error('Error saving review:', err);
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveInitialGradeSubmit = (e) => {
    e.preventDefault();
    if (!editingInitialMember) return;
    const grade = Math.min(5, Math.max(1, parseFloat(newInitialGrade) || 4.0));
    onSaveInitialGrade(editingInitialMember.id, grade);
    setEditingInitialMember(null);
  };

  // Filter & Sort Members
  const filteredMembers = assessableMembers.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.phone && m.phone.includes(search)) ||
      (m.campus && m.campus.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
    const matchesCampus = campusFilter === 'ALL' || m.campus === campusFilter;

    let matchesStatus = true;
    if (statusFilter === 'PENDING') {
      matchesStatus = (m.pendingReviewsCount || 0) > 0;
    } else if (statusFilter === 'REVIEWED') {
      matchesStatus = (m.pendingReviewsCount || 0) === 0 && (m.reviewsCount || 0) > 0;
    }

    return matchesSearch && matchesRole && matchesCampus && matchesStatus;
  });

  filteredMembers.sort((a, b) => {
    const gradeA = a.overallGrade ?? a.initialGrade ?? 4.0;
    const gradeB = b.overallGrade ?? b.initialGrade ?? 4.0;
    if (sortBy === 'GRADE_DESC') return gradeB - gradeA;
    if (sortBy === 'GRADE_ASC') return gradeA - gradeB;
    if (sortBy === 'PENDING_DESC') return (b.pendingReviewsCount || 0) - (a.pendingReviewsCount || 0);
    if (sortBy === 'NAME_ASC') return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Leadership / Coordinator Confidential Banner */}
      <div className={`p-5 rounded-3xl border shadow-xl relative overflow-hidden ${
        isDark ? 'bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-zinc-800' : 'bg-gradient-to-r from-zinc-50 via-white to-zinc-50 border-zinc-200'
      }`}>
        <div className="absolute top-0 right-0 w-80 h-full bg-red-600/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-md">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-black tracking-wide uppercase">
                  {isCoord ? 'Volunteer Performance & Event Grading' : 'Crew Performance & Auto-Grading Portal'}
                </h1>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center space-x-1 ${
                  isCoord 
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  <ShieldCheck className="w-3 h-3 inline mr-0.5" />
                  {isCoord ? 'Coordinator Access' : 'Heads Admin'}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {isCoord 
                  ? "Review volunteers' event photos/videos, toggle the Reviewed checkmark, and assign 1-5 star event ratings."
                  : "Evaluates Coordinators & Volunteers. Grades dynamically auto-calculate from baseline initial grades and verified 5-point event reviews."
                }
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className={`px-3 py-1.5 rounded-xl border font-medium ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
            }`}>
              {isCoord ? 'Operating Coordinator: ' : 'Authorized Head: '}
              <strong className="text-red-500 ml-1">{authUser?.name || currentHead}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-zinc-400">Total Active Crew</span>
            <Award className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black tracking-tight">{totalCrew}</div>
          <p className="text-[10px] text-zinc-500 mt-1">Coordinators & Volunteers</p>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-zinc-400">Club Average Grade</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-black tracking-tight text-amber-500">{avgClubRating} <span className="text-xs font-semibold text-zinc-500">/ 5.0</span></div>
          <p className="text-[10px] text-zinc-500 mt-1">Overall club performance</p>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-zinc-400">Photos & Videos Reviewed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black tracking-tight text-emerald-500">{totalReviewedSlots}</div>
          <p className="text-[10px] text-zinc-500 mt-1">Verified with 5-point grading</p>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm ${
          isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-zinc-400">Pending Reviews</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black tracking-tight text-amber-500">{totalPendingSlots}</div>
          <p className="text-[10px] text-zinc-500 mt-1">Awaiting head inspection</p>
        </div>

      </div>

      {/* Filter and Search Controls */}
      <div className={`p-3 sm:p-4 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm ${
        isDark ? 'bg-zinc-900/70 border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <div className="relative flex-1">
          <Search className="w-4 h-4 opacity-50 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search coordinator or volunteer by name, phone, campus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-500 transition ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500' : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          
          {!isCoord ? (
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-500 ${
                isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-300 text-zinc-800'
              }`}
            >
              <option value="ALL">All Roles (Coords + Vols)</option>
              <option value="Coordinator">Coordinators Only</option>
              <option value="Volunteer">Volunteers Only</option>
            </select>
          ) : (
            <div className={`px-3 py-2 border rounded-xl text-xs font-bold text-red-500 ${
              isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-300'
            }`}>
              Volunteers
            </div>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-500 ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-300 text-zinc-800'
            }`}
          >
            <option value="ALL">All Review Statuses</option>
            <option value="PENDING">Has Pending Reviews</option>
            <option value="REVIEWED">All Caught Up</option>
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
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-red-500 ${
              isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-300 text-zinc-800'
            }`}
          >
            <option value="GRADE_DESC">Grade: Highest First</option>
            <option value="GRADE_ASC">Grade: Lowest First</option>
            <option value="PENDING_DESC">Pending Reviews: Most First</option>
            <option value="NAME_ASC">Name (A-Z)</option>
          </select>

        </div>
      </div>

      {/* Member Performance Cards */}
      <div className="space-y-4">
        {filteredMembers.length === 0 ? (
          <div className={`p-12 text-center rounded-2xl border ${
            isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-500'
          }`}>
            <Award className="w-10 h-10 mx-auto mb-3 opacity-40 text-red-500" />
            <p className="text-sm font-semibold">No crew members matching current filter criteria.</p>
          </div>
        ) : (
          filteredMembers.map(member => {
            const isExpanded = expandedMemberId === member.id;
            const assignedEvents = events.filter(e => (e.assignedMemberIds || []).includes(member.id));
            const overallGrade = member.overallGrade ?? member.initialGrade ?? 4.0;
            const initialGrade = member.initialGrade ?? 4.0;
            const tier = getGradeTier(overallGrade);
            const pendingCount = member.pendingReviewsCount ?? Math.max(0, assignedEvents.length - (member.reviewsCount || 0));

            return (
              <div 
                key={member.id}
                className={`border rounded-2xl transition-all shadow-md overflow-hidden ${
                  isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-zinc-200'
                }`}
              >
                {/* Member Header Bar */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  
                  {/* Left: Avatar, Name & Demographics */}
                  <div className="flex items-center space-x-3.5">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base border shadow-sm ${
                      member.role === 'Coordinator'
                        ? 'bg-red-500/10 border-red-500/30 text-red-500'
                        : 'bg-zinc-800 border-zinc-700 text-white'
                    }`}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-sm sm:text-base">
                          {member.name}
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                          member.role === 'Coordinator'
                            ? 'bg-red-500/10 text-red-500 border-red-500/30'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-zinc-400">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 opacity-60" />
                          <span>{member.campus}</span>
                        </span>
                        <span>•</span>
                        <span className="font-mono text-red-500 font-semibold">{member.work}</span>
                        <span>•</span>
                        <span className={member.hasCamera ? 'text-emerald-400 font-medium' : 'text-zinc-500'}>
                          {member.hasCamera ? 'Camera: Yes' : 'No Camera'}
                        </span>
                        {member.phone && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[10px]">{member.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Initial Grade, Overall Auto Grade, and Expand Button */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full lg:w-auto justify-between lg:justify-end">
                    
                    {/* Baseline Initial Grade Box */}
                    <div className={`px-3 py-1.5 rounded-xl border flex items-center space-x-2 ${
                      isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                    }`}>
                      <div>
                        <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Initial Baseline</div>
                        <div className="text-xs font-black text-zinc-200">{initialGrade.toFixed(1)} <span className="text-[10px] font-normal text-zinc-500">/ 5.0</span></div>
                      </div>
                      {!isCoord && (
                        <button
                          onClick={() => {
                            setEditingInitialMember(member);
                            setNewInitialGrade(initialGrade);
                          }}
                          title="Edit baseline initial grade"
                          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Overall Auto Grade Display */}
                    <div className={`px-3.5 py-1.5 rounded-xl border flex items-center space-x-2.5 ${
                      isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-300'
                    }`}>
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <Star className="w-4 h-4 fill-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm font-black text-amber-400 tracking-tight">
                            {overallGrade.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-zinc-500">/ 5.0</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ml-1 ${tier.color}`}>
                            {tier.label}
                          </span>
                        </div>
                        <div className="text-[9px] text-zinc-500">
                          {assignedEvents.length} assigned • {member.reviewsCount || 0} reviewed
                        </div>
                      </div>
                    </div>

                    {/* Pending Pill (if any) */}
                    {pendingCount > 0 ? (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{pendingCount} Pending</span>
                      </span>
                    ) : (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Reviewed</span>
                      </span>
                    )}

                    {/* Toggle Expand Events Button */}
                    <button
                      onClick={() => setExpandedMemberId(isExpanded ? null : member.id)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        isExpanded 
                          ? 'bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20'
                          : isDark 
                          ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700' 
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
                      }`}
                    >
                      <span>{isExpanded ? 'Hide Events' : `Review Events (${assignedEvents.length})`}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                  </div>

                </div>

                {/* Expandable Event Review Section */}
                {isExpanded && (
                  <div className={`p-4 sm:p-5 border-t space-y-4 ${
                    isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/60">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                          <span>Allotted Event Reviews for {member.name}</span>
                        </h4>
                        <p className="text-[11px] text-zinc-400">
                          Inspect Google Drive photos/videos, toggle "Reviewed", assign a 5-point rating, and leave feedback.
                        </p>
                      </div>
                      <div className="text-[11px] text-zinc-400 bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">
                        Formula: <span className="font-mono text-red-400">(Initial {initialGrade.toFixed(1)} + Event Ratings) / (1 + Count)</span>
                      </div>
                    </div>

                    {assignedEvents.length === 0 ? (
                      <div className="p-6 text-center text-xs text-zinc-500">
                        This member is not yet allotted to any events.
                      </div>
                    ) : (
                      assignedEvents.map(event => {
                        const key = `${event.id}_${member.id}`;
                        const draft = getDraft(event, member);
                        const isSaving = savingKey === key;
                        const isSaved = savedKey === key;

                        return (
                          <div 
                            key={event.id}
                            className={`p-4 rounded-xl border transition-all ${
                              draft.isReviewed
                                ? isDark ? 'bg-zinc-900/90 border-emerald-500/30' : 'bg-white border-emerald-500/30'
                                : isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
                            }`}
                          >
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
                              
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-bold text-white hover:text-red-400 transition">
                                    {event.name}
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.2 rounded font-semibold ${
                                    event.driveLinkSubmitted 
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  }`}>
                                    {event.driveLinkSubmitted ? 'Drive Uploaded' : 'Drive Pending'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-3 text-[11px] text-zinc-400 mt-1">
                                  <span>📅 {event.date}</span>
                                  <span>•</span>
                                  <span>🏫 {event.campus}</span>
                                  <span>•</span>
                                  <span>👤 POC: {event.contactPerson || 'General'}</span>
                                </div>
                              </div>

                              {/* Drive Link Action Button */}
                              <div className="flex items-center space-x-2">
                                {event.driveLink ? (
                                  <a
                                    href={event.driveLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-500 text-xs font-semibold border border-red-500/30 transition shadow-sm"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>Inspect Photos/Videos in Drive</span>
                                  </a>
                                ) : (
                                  <span className="text-[11px] text-zinc-500 italic">
                                    No Drive link added yet
                                  </span>
                                )}
                              </div>

                            </div>

                            {/* Core Grading Box: Reviewed Toggle, 5-Point Selector, and Feedback */}
                            <div className={`p-3.5 rounded-xl border mt-3 space-y-3 ${
                              isDark ? 'bg-zinc-950/80 border-zinc-800/80' : 'bg-zinc-100/70 border-zinc-300/80'
                            }`}>
                              
                              {/* 1. REVIEWED TOGGLE SWITCH */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-800">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={draft.isReviewed}
                                    onChange={(e) => updateDraft(event.id, member.id, 'isReviewed', e.target.checked)}
                                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-zinc-700 bg-zinc-900 cursor-pointer"
                                  />
                                  <div className="flex items-center space-x-1.5">
                                    <span className="text-xs font-bold text-zinc-200">
                                      Photos & Videos Reviewed by Head
                                    </span>
                                    {draft.isReviewed ? (
                                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                                        ✓ Reviewed
                                      </span>
                                    ) : (
                                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-zinc-800 text-zinc-400 font-bold border border-zinc-700">
                                        Pending Review
                                      </span>
                                    )}
                                  </div>
                                </label>

                                {!draft.isReviewed && (
                                  <span className="text-[11px] text-amber-500/90 flex items-center space-x-1">
                                    <Lock className="w-3 h-3 inline mr-1" />
                                    <span>Check "Reviewed" to unlock 5-point grading & feedback</span>
                                  </span>
                                )}
                              </div>

                              {/* 2. 5-POINT GRADING SELECTOR (LOCKED IF NOT REVIEWED) */}
                              <div className={`transition-opacity ${draft.isReviewed ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                  <label className="text-xs font-bold text-zinc-300 flex items-center space-x-1.5">
                                    <Star className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Event 5-Point Rating (Based on Photos/Videos):</span>
                                  </label>
                                  <div className="text-xs font-black text-amber-400">
                                    {draft.rating} / 5 Points &nbsp;
                                    <span className="text-[11px] font-medium text-zinc-400">
                                      {draft.rating === 5 && '(5 - Exceptional Masterclass)'}
                                      {draft.rating === 4 && '(4 - Very Good / Sharp)'}
                                      {draft.rating === 3 && '(3 - Good Standard)'}
                                      {draft.rating === 2 && '(2 - Fair / Room to Improve)'}
                                      {draft.rating === 1 && '(1 - Poor / Unsatisfactory)'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  {[1, 2, 3, 4, 5].map(pts => (
                                    <button
                                      key={pts}
                                      type="button"
                                      disabled={!draft.isReviewed}
                                      onClick={() => updateDraft(event.id, member.id, 'rating', pts)}
                                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition flex items-center justify-center space-x-1 ${
                                        draft.rating >= pts 
                                          ? 'bg-amber-500 text-black border-amber-400 shadow-sm'
                                          : isDark
                                          ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                          : 'bg-white border-zinc-300 text-zinc-600 hover:border-zinc-400'
                                      }`}
                                    >
                                      <span>{pts}</span>
                                      <Star className={`w-3 h-3 ${draft.rating >= pts ? 'fill-black' : 'fill-none'}`} />
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* 3. FEEDBACK TEXTAREA (LOCKED IF NOT REVIEWED) */}
                              <div className={`transition-opacity ${draft.isReviewed ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                                  Constructive Feedback on Photos / Videos
                                </label>
                                <textarea
                                  rows={2}
                                  disabled={!draft.isReviewed}
                                  placeholder={
                                    draft.isReviewed
                                      ? "Write specific feedback on photo framing, camera focus, lighting, gimbal stability, or punctuality..."
                                      : "Check 'Reviewed' above to unlock feedback..."
                                  }
                                  value={draft.feedback}
                                  onChange={(e) => updateDraft(event.id, member.id, 'feedback', e.target.value)}
                                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:border-red-500 transition ${
                                    isDark ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500' : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400'
                                  }`}
                                />
                              </div>

                              {/* 4. SAVE REVIEW BUTTON */}
                              <div className="flex items-center justify-between pt-1">
                                <div className="text-[11px] text-zinc-500">
                                  Operating Head: <strong className="text-zinc-300">{currentHead}</strong>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleSaveReviewClick(event, member)}
                                  disabled={isSaving}
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
                                      <span>Saved & Auto-Graded!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3.5 h-3.5" />
                                      <span>Save & Update Grade</span>
                                    </>
                                  )}
                                </button>
                              </div>

                            </div>

                          </div>
                        );
                      })
                    )}

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Edit Initial Grade Modal */}
      {editingInitialMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-zinc-100">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white">
                Edit Initial Baseline Grade
              </h3>
              <button
                onClick={() => setEditingInitialMember(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInitialGradeSubmit} className="space-y-4">
              <p className="text-xs text-zinc-400">
                Adjust baseline induction rating for <strong className="text-white">{editingInitialMember.name}</strong> ({editingInitialMember.role}):
              </p>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Baseline Grade (1.0 to 5.0 Points)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    required
                    value={newInitialGrade}
                    onChange={(e) => setNewInitialGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-red-500"
                  />
                  <span className="text-sm font-bold text-amber-400">/ 5.0</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingInitialMember(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30"
                >
                  Save Baseline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

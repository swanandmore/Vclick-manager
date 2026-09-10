import React, { useState, useRef } from 'react';
import { 
  Activity, 
  Users, 
  Calendar, 
  Scale, 
  Download, 
  Upload,
  Database,
  RotateCcw, 
  CheckCircle2, 
  UserCheck,
  ChevronDown,
  Sun,
  Moon,
  MessageSquare
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  isConnected,
  currentHead,
  setCurrentHead,
  activeHeads,
  eventsCount,
  zeroEventsCount,
  members = [],
  onResetData,
  onExportCsv,
  dbInfo,
  onDownloadBackup,
  onRestoreBackup,
  theme,
  setTheme,
  onOpenWhatsAppModal
}) {
  const [showHeadMenu, setShowHeadMenu] = useState(false);
  const [showPresenceMenu, setShowPresenceMenu] = useState(false);
  const fileInputRef = useRef(null);

  // Dynamically derive head options from team members whose role is 'Head'
  const headMembers = members.filter(m => m.role === 'Head');
  const headOptions = headMembers.length > 0 
    ? headMembers.map(m => m.name)
    : ['Swanand More', 'Pratham Hindocha', 'Varad Belsare', 'Co-Head 4', 'Co-Head 5'];

  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-40 border-b transition-colors backdrop-blur-md ${
      isDark 
        ? 'bg-zinc-950/95 border-zinc-800 text-zinc-100 shadow-xl' 
        : 'bg-white/95 border-zinc-200 text-zinc-900 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Club Branding */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="VCLICK Logo" 
                className="h-10 w-auto max-w-[140px] sm:max-w-[170px] object-contain rounded-md"
              />
              <div className="hidden lg:block">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-bold border border-red-500/30">
                  Live Sync
                </span>
              </div>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className={`hidden md:flex items-center space-x-1 p-1 rounded-xl border ${
            isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
          }`}>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'events'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : isDark 
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' 
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Events</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                activeTab === 'events' ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-300'
              }`}>
                {eventsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('allotment')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'allotment'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : isDark 
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' 
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-white'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Allotment Matrix</span>
              {zeroEventsCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30">
                  {zeroEventsCount} unassigned
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('team')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'team'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : isDark 
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' 
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Team Roster</span>
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'activity'
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                  : isDark 
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' 
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Audit Feed</span>
            </button>
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* WhatsApp Import/Export Button */}
            <button
              onClick={onOpenWhatsAppModal}
              title="Quick paste WhatsApp messages or generate WhatsApp broadcast"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp Sync</span>
            </button>

            {/* Live Socket Status */}
            <div 
              title={isConnected ? 'Real-time WebSocket Live' : 'Reconnecting...'}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {isConnected ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                )}
              </span>
              <span className={`text-[11px] font-semibold hidden md:inline ${isConnected ? 'text-emerald-500' : 'text-red-500'}`}>
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>

            {/* Database Status Indicator */}
            <div 
              title={dbInfo?.connected 
                ? 'Persistent Cloud Database (MongoDB Atlas) Connected. Your data will never reset!' 
                : 'Local File Storage. Connect MongoDB Atlas on Render to keep records permanent for 2+ years.'
              }
              className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
              }`}
            >
              <Database className={`w-3.5 h-3.5 ${dbInfo?.connected ? 'text-emerald-500' : 'text-amber-500'}`} />
              <span className={`text-[11px] font-semibold ${dbInfo?.connected ? 'text-emerald-500' : 'text-amber-500'}`}>
                {dbInfo?.connected ? 'Cloud DB' : 'Local DB'}
              </span>
            </div>

            {/* Active Connected Heads Count */}
            <div className="relative">
              <button
                onClick={() => setShowPresenceMenu(!showPresenceMenu)}
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium border transition ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-[11px] font-medium hidden sm:inline">
                  {activeHeads.length} Online
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {showPresenceMenu && (
                <div className={`absolute right-0 mt-2 w-48 rounded-xl border shadow-2xl py-2 z-50 ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-800'
                }`}>
                  <div className="px-3 py-1 text-[11px] font-bold opacity-50 uppercase tracking-wider">
                    Connected Heads
                  </div>
                  {activeHeads.map((h, i) => (
                    <div key={i} className="px-3 py-1.5 text-xs flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>{h.headName || 'Unnamed Head'}</span>
                      {h.headName === currentHead && (
                        <span className="text-[10px] text-red-500 font-bold ml-auto">(You)</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Head Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowHeadMenu(!showHeadMenu)}
                className={`flex items-center space-x-2 pl-2 pr-3 py-1 rounded-xl border transition ${
                  isDark 
                    ? 'bg-zinc-900 border-zinc-800 text-white hover:border-zinc-700' 
                    : 'bg-zinc-100 border-zinc-300 text-zinc-900 hover:border-zinc-400'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
                  {currentHead.charAt(0)}
                </div>
                <span className="text-xs font-bold max-w-[90px] truncate">
                  {currentHead}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {showHeadMenu && (
                <div className={`absolute right-0 mt-2 w-56 rounded-xl border shadow-2xl py-2 z-50 ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-800'
                }`}>
                  <div className="px-3 py-1 text-[11px] font-bold opacity-50 uppercase tracking-wider">
                    Operating as Head:
                  </div>
                  <p className="px-3 pb-2 text-[10px] opacity-60 leading-tight">
                    Select your Head profile for audit logs:
                  </p>
                  {headOptions.map((name) => (
                    <button
                      key={name}
                      onClick={() => {
                        setCurrentHead(name);
                        setShowHeadMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition ${
                        name === currentHead 
                          ? 'text-red-500 font-bold bg-red-500/10' 
                          : isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <UserCheck className="w-3.5 h-3.5 opacity-60" />
                        <span>{name}</span>
                      </span>
                      {name === currentHead && <CheckCircle2 className="w-3.5 h-3.5 text-red-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
              className={`p-2 rounded-xl border transition ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-800 text-amber-400 hover:bg-zinc-800' 
                  : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Hidden JSON file input for Restore */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onRestoreBackup) {
                  onRestoreBackup(file);
                }
                e.target.value = '';
              }}
            />

            {/* Backup Database JSON */}
            <button
              onClick={onDownloadBackup}
              title="Download Complete Database Backup (JSON)"
              className={`p-2 rounded-xl border transition ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-emerald-400 hover:bg-zinc-800' : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-emerald-600 hover:bg-zinc-200'
              }`}
            >
              <Database className="w-4 h-4" />
            </button>

            {/* Restore Database JSON */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Restore Database from JSON Backup file"
              className={`p-2 rounded-xl border transition ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-red-400 hover:bg-zinc-800' : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-red-500 hover:bg-zinc-200'
              }`}
            >
              <Upload className="w-4 h-4" />
            </button>

            {/* Quick Export & Reset */}
            <button
              onClick={onExportCsv}
              title="Export all records to CSV"
              className={`p-2 rounded-xl border transition ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onResetData}
              title="Reset records to initial baseline"
              className={`p-2 rounded-xl border transition ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-800' : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:text-red-500 hover:bg-zinc-200'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

          </div>
        </div>

        {/* Mobile Sub-navigation */}
        <div className={`md:hidden flex items-center justify-around py-2 border-t ${
          isDark ? 'border-zinc-800/80 text-zinc-400' : 'border-zinc-200 text-zinc-600'
        }`}>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex flex-col items-center py-1 text-[11px] font-medium ${
              activeTab === 'events' ? 'text-red-500 font-bold' : ''
            }`}
          >
            <Calendar className="w-4 h-4 mb-0.5" />
            Events ({eventsCount})
          </button>
          <button
            onClick={() => setActiveTab('allotment')}
            className={`flex flex-col items-center py-1 text-[11px] font-medium ${
              activeTab === 'allotment' ? 'text-red-500 font-bold' : ''
            }`}
          >
            <Scale className="w-4 h-4 mb-0.5" />
            Matrix
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex flex-col items-center py-1 text-[11px] font-medium ${
              activeTab === 'team' ? 'text-red-500 font-bold' : ''
            }`}
          >
            <Users className="w-4 h-4 mb-0.5" />
            Team
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex flex-col items-center py-1 text-[11px] font-medium ${
              activeTab === 'activity' ? 'text-red-500 font-bold' : ''
            }`}
          >
            <Activity className="w-4 h-4 mb-0.5" />
            Audit
          </button>
        </div>

      </div>
    </header>
  );
}
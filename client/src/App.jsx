import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import EventList from './components/EventList';
import EventModal from './components/EventModal';
import AllotmentMatrix from './components/AllotmentMatrix';
import TeamRoster from './components/TeamRoster';
import MemberModal from './components/MemberModal';
import LiveActivityFeed from './components/LiveActivityFeed';
import WhatsAppSyncModal from './components/WhatsAppSyncModal';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberStats, setMemberStats] = useState({});
  const [activities, setActivities] = useState([]);
  const [activeHeads, setActiveHeads] = useState([]);
  const [dbInfo, setDbInfo] = useState({ type: 'local', status: 'Local File Storage', connected: false });
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('events');
  
  // Theme state: 'dark' or 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('vclick_theme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('vclick_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.className = "bg-zinc-950 text-zinc-100 antialiased font-['Plus_Jakarta_Sans',sans-serif]";
    } else {
      document.documentElement.classList.remove('dark');
      document.body.className = "bg-zinc-100 text-zinc-900 antialiased font-['Plus_Jakarta_Sans',sans-serif]";
    }
  }, [theme]);

  // Persisted head profile switcher
  const [currentHead, setCurrentHead] = useState(() => {
    return localStorage.getItem('vclick_head') || 'Swanand More';
  });

  // Live real-time toast notification
  const [toastMessage, setToastMessage] = useState(null);

  // Modals state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  const socketRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('vclick_head', currentHead);
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'SET_HEAD',
        headName: currentHead
      }));
    }
  }, [currentHead]);

  // WebSocket real-time connection lifecycle
  useEffect(() => {
    let reconnectTimeout = null;

    function connectWs() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      // In cloud (Render/Railway), port is standard 80/443 so window.location.port is empty
      const portPart = window.location.port === '3000' 
        ? ':5000' 
        : (window.location.port ? `:${window.location.port}` : '');
      const wsUrl = `${protocol}//${host}${portPart}`;

      console.log('Connecting to WebSocket at:', wsUrl);
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('✅ Connected to real-time WebSocket server');
        setIsConnected(true);
        ws.send(JSON.stringify({
          type: 'SET_HEAD',
          headName: currentHead
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'INITIAL_STATE') {
            setEvents(data.state.events || []);
            setMembers(data.state.members || []);
            setActivities(data.state.activities || []);
            setMemberStats(data.memberStats || {});
            setActiveHeads(data.activeHeads || []);
          }

          if (data.type === 'PRESENCE_UPDATE') {
            setActiveHeads(data.activeHeads || []);
          }

          if (
            data.type === 'EVENT_CREATED' ||
            data.type === 'EVENT_UPDATED' ||
            data.type === 'EVENT_DELETED' ||
            data.type === 'MEMBER_ADDED' ||
            data.type === 'MEMBER_UPDATED' ||
            data.type === 'MEMBER_DELETED' ||
            data.type === 'RESET_COMPLETED'
          ) {
            if (data.state) {
              setEvents(data.state.events || []);
              setMembers(data.state.members || []);
              setActivities(data.state.activities || []);
            }
            if (data.memberStats) {
              setMemberStats(data.memberStats);
            }
            if (data.message) {
              showToast(data.message);
            }
          }
        } catch (e) {
          console.error('Error handling WS message:', e);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket closed. Reconnecting in 2.5s...');
        setIsConnected(false);
        reconnectTimeout = setTimeout(connectWs, 2500);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        ws.close();
      };
    }

    connectWs();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  // Initial HTTP fallback load
  useEffect(() => {
    fetch(getApiUrl('/api/state'))
      .then(res => res.json())
      .then(data => {
        if (data.state) {
          setEvents(data.state.events || []);
          setMembers(data.state.members || []);
          setActivities(data.state.activities || []);
          setMemberStats(data.memberStats || {});
        }
        if (data.dbInfo) {
          setDbInfo(data.dbInfo);
        }
      })
      .catch(e => console.log('HTTP fetch deferred to WebSocket:', e));
  }, []);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const getApiUrl = (endpoint) => {
    return window.location.port === '3000' 
      ? `http://localhost:5000${endpoint}` 
      : endpoint;
  };

  // --- Interactive 1-Click Toggle of Member in Event from Allotment Matrix ---
  const handleToggleMemberInEvent = async (eventId, memberId) => {
    // Optimistic UI update
    setEvents(prev => prev.map(evt => {
      if (evt.id !== eventId) return evt;
      const currentIds = Array.isArray(evt.assignedMemberIds) ? evt.assignedMemberIds : [];
      const hasMember = currentIds.includes(memberId);
      return {
        ...evt,
        assignedMemberIds: hasMember
          ? currentIds.filter(id => id !== memberId)
          : [...currentIds, memberId]
      };
    }));

    setMemberStats(prev => {
      const currentCount = prev[memberId] || 0;
      const evt = events.find(e => e.id === eventId);
      const isAssigned = evt && (evt.assignedMemberIds || []).includes(memberId);
      return {
        ...prev,
        [memberId]: Math.max(0, isAssigned ? currentCount - 1 : currentCount + 1)
      };
    });

    try {
      await fetch(getApiUrl(`/api/events/${eventId}/toggle-member`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, headName: currentHead })
      });
    } catch (err) {
      console.error('Failed to toggle member allotment:', err);
    }
  };

  // Save Event
  const handleSaveEvent = async (formData) => {
    try {
      if (eventToEdit) {
        await fetch(getApiUrl(`/api/events/${eventToEdit.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, headName: currentHead })
        });
      } else {
        await fetch(getApiUrl('/api/events'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, headName: currentHead })
        });
      }
      setIsEventModalOpen(false);
      setEventToEdit(null);
    } catch (err) {
      console.error('Failed to save event:', err);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event record?')) return;
    try {
      await fetch(getApiUrl(`/api/events/${id}?headName=${encodeURIComponent(currentHead)}`), {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  const handleToggleDriveStatus = async (id) => {
    // Optimistic UI update
    setEvents(prev => prev.map(evt => {
      if (evt.id !== id) return evt;
      return {
        ...evt,
        driveLinkSubmitted: !evt.driveLinkSubmitted
      };
    }));

    try {
      const res = await fetch(getApiUrl(`/api/events/${id}/toggle-drive`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headName: currentHead })
      });
      const data = await res.json();
      if (data.state && data.state.events) {
        setEvents(data.state.events);
      }
    } catch (err) {
      console.error('Failed to toggle drive status:', err);
    }
  };

  const handleUpdateDriveLink = async (eventId, driveLink) => {
    setEvents(prev => prev.map(evt => {
      if (evt.id !== eventId) return evt;
      const trimmed = (driveLink || '').trim();
      return {
        ...evt,
        driveLink: trimmed,
        driveLinkSubmitted: trimmed ? true : evt.driveLinkSubmitted
      };
    }));

    try {
      await fetch(getApiUrl(`/api/events/${eventId}/set-drive`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driveLink, headName: currentHead })
      });
    } catch (err) {
      console.error('Failed to update drive link:', err);
    }
  };

  // Member Handlers
  const handleSaveMember = async (formData) => {
    try {
      if (memberToEdit) {
        await fetch(getApiUrl(`/api/members/${memberToEdit.id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, headName: currentHead })
        });
      } else {
        await fetch(getApiUrl('/api/members'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, headName: currentHead })
        });
      }
      setIsMemberModalOpen(false);
      setMemberToEdit(null);
    } catch (err) {
      console.error('Failed to save member:', err);
    }
  };

  const handleDeleteMember = async (id) => {
    if (!window.confirm('Remove this member from the roster?')) return;
    try {
      await fetch(getApiUrl(`/api/members/${id}?headName=${encodeURIComponent(currentHead)}`), {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Failed to delete member:', err);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset all records to the original baseline from the sheets?')) return;
    try {
      await fetch(getApiUrl('/api/reset-demo'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headName: currentHead })
      });
    } catch (err) {
      console.error('Failed to reset data:', err);
    }
  };

  const handleExportCsv = () => {
    window.open(getApiUrl('/api/export/csv'), '_blank');
  };

  const handleDownloadBackup = () => {
    window.open(getApiUrl('/api/backup'), '_blank');
  };

  const handleRestoreBackup = async (file) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const backupState = parsed.state || parsed;
      if (!backupState || !Array.isArray(backupState.events) || !Array.isArray(backupState.members)) {
        alert('Invalid backup file. Must contain valid events and members.');
        return;
      }

      if (!window.confirm(`Restore database from backup file? This will replace all current events and members with the ${backupState.events.length} events from this backup.`)) {
        return;
      }

      const res = await fetch(getApiUrl('/api/restore'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restoredState: backupState, headName: currentHead })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Database successfully restored from backup!');
      }
    } catch (err) {
      console.error('Failed to restore backup:', err);
      alert('Error restoring backup file. Please ensure it is a valid JSON file.');
    }
  };

  const handleOpenNewEventWithMember = (memberId) => {
    setEventToEdit({
      name: '',
      contactPerson: '',
      emailReceived: true,
      communicationDetails: '',
      date: new Date().toISOString().split('T')[0],
      campus: members.find(m => m.id === memberId)?.campus || 'Bibwewadi',
      assignedMemberIds: [memberId],
      driveLink: '',
      driveLinkSubmitted: false,
      status: 'Upcoming',
      notes: ''
    });
    setIsEventModalOpen(true);
  };

  const zeroEventsCount = members.filter(m => (memberStats[m.id] || 0) === 0).length;
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-100 text-zinc-900'
    }`}>
      
      {/* Top Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isConnected={isConnected}
        currentHead={currentHead}
        setCurrentHead={setCurrentHead}
        activeHeads={activeHeads}
        eventsCount={events.length}
        zeroEventsCount={zeroEventsCount}
        members={members}
        onResetData={handleResetData}
        onExportCsv={handleExportCsv}
        dbInfo={dbInfo}
        onDownloadBackup={handleDownloadBackup}
        onRestoreBackup={handleRestoreBackup}
        theme={theme}
        setTheme={setTheme}
        onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
      />

      {/* Real-time Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="bg-zinc-900 border border-red-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 backdrop-blur-md">
            <span className="p-1 rounded-lg bg-red-500/20 text-red-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Screen Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'events' && (
          <EventList
            events={events}
            members={members}
            memberStats={memberStats}
            onOpenNewEventModal={() => {
              setEventToEdit(null);
              setIsEventModalOpen(true);
            }}
            onEditEvent={(evt) => {
              setEventToEdit(evt);
              setIsEventModalOpen(true);
            }}
            onDeleteEvent={handleDeleteEvent}
            onToggleDriveStatus={handleToggleDriveStatus}
            onToggleMemberInEvent={handleToggleMemberInEvent}
            onUpdateDriveLink={handleUpdateDriveLink}
            onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
            theme={theme}
          />
        )}

        {activeTab === 'allotment' && (
          <AllotmentMatrix
            members={members}
            events={events}
            memberStats={memberStats}
            onOpenNewEventWithMember={handleOpenNewEventWithMember}
            onToggleMemberInEvent={handleToggleMemberInEvent}
            theme={theme}
          />
        )}

        {activeTab === 'team' && (
          <TeamRoster
            members={members}
            memberStats={memberStats}
            onAddMember={() => {
              setMemberToEdit(null);
              setIsMemberModalOpen(true);
            }}
            onEditMember={(m) => {
              setMemberToEdit(m);
              setIsMemberModalOpen(true);
            }}
            onDeleteMember={handleDeleteMember}
            theme={theme}
          />
        )}

        {activeTab === 'activity' && (
          <LiveActivityFeed
            activities={activities}
            currentHead={currentHead}
            theme={theme}
          />
        )}

      </main>

      {/* Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEventToEdit(null);
        }}
        onSave={handleSaveEvent}
        eventToEdit={eventToEdit}
        allMembers={members}
        memberStats={memberStats}
        allEvents={events}
      />

      {/* Member Modal */}
      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => {
          setIsMemberModalOpen(false);
          setMemberToEdit(null);
        }}
        onSave={handleSaveMember}
        memberToEdit={memberToEdit}
      />

      {/* WhatsApp Parser & Broadcaster Modal */}
      <WhatsAppSyncModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        allMembers={members}
        events={events}
        currentHead={currentHead}
        onSaveNewEvent={handleSaveEvent}
        onUpdateEvent={(updatedEvt) => {
          fetch(getApiUrl(`/api/events/${updatedEvt.id}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...updatedEvt, headName: currentHead })
          });
        }}
      />

    </div>
  );
}
const express = require('express');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { MongoClient } = require('mongodb');
const { initialMembers, initialEvents } = require('./seedData');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 5000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

// MongoDB Atlas Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'vclick_club';
let mongoClient = null;
let mongoDb = null;
let stateCollection = null;
let isMongoConnected = false;

// Access Control Passcodes for Heads (Admins) and Coordinators
const HEAD_PASSWORD = process.env.HEAD_PASSWORD || 'head2026';
const COORD_PASSWORD = process.env.COORD_PASSWORD || 'coord2026';

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let state = {
  members: [],
  events: [],
  activities: []
};

function enrichStateWithGrades(currentState) {
  if (!currentState || !Array.isArray(currentState.members)) return;

  if (!Array.isArray(currentState.events)) {
    currentState.events = [];
  }

  // Ensure all events have crewReviews array
  currentState.events.forEach(evt => {
    if (!Array.isArray(evt.crewReviews)) {
      evt.crewReviews = [];
    }
  });

  // Calculate event count stats
  const memberEventCounts = {};
  currentState.members.forEach(m => {
    memberEventCounts[m.id] = 0;
  });
  currentState.events.forEach(evt => {
    (evt.assignedMemberIds || []).forEach(mId => {
      memberEventCounts[mId] = (memberEventCounts[mId] || 0) + 1;
    });
  });

  // Enrich members with grading metrics
  currentState.members.forEach(m => {
    if (m.role === 'Head') {
      m.initialGrade = null;
      m.overallGrade = null;
      m.reviewsCount = 0;
      m.pendingReviewsCount = 0;
      m.avgEventRating = null;
      return;
    }

    // Baseline Initial Grade (default 4.0 out of 5.0)
    if (typeof m.initialGrade !== 'number' || isNaN(m.initialGrade)) {
      m.initialGrade = 4.0;
    } else {
      m.initialGrade = Math.min(5, Math.max(1, Number(m.initialGrade.toFixed(1))));
    }

    // Gather valid reviews for this member across all assigned events
    const validReviews = [];
    const assignedCount = memberEventCounts[m.id] || 0;

    currentState.events.forEach(evt => {
      const isAssigned = Array.isArray(evt.assignedMemberIds) && evt.assignedMemberIds.includes(m.id);
      if (isAssigned && Array.isArray(evt.crewReviews)) {
        const rev = evt.crewReviews.find(r => r.memberId === m.id);
        if (rev && rev.isReviewed === true && typeof rev.rating === 'number' && rev.rating >= 1 && rev.rating <= 5) {
          validReviews.push(rev);
        }
      }
    });

    const reviewsCount = validReviews.length;
    const pendingReviewsCount = Math.max(0, assignedCount - reviewsCount);

    let overallGrade = m.initialGrade;
    let avgEventRating = null;

    if (reviewsCount > 0) {
      const totalRatings = validReviews.reduce((sum, r) => sum + r.rating, 0);
      avgEventRating = Number((totalRatings / reviewsCount).toFixed(1));
      // Auto Grade formula: (Initial Grade + Sum of Event Ratings) / (1 + Count of Event Reviews)
      overallGrade = Number(((m.initialGrade + totalRatings) / (1 + reviewsCount)).toFixed(1));
    }

    m.overallGrade = overallGrade;
    m.reviewsCount = reviewsCount;
    m.pendingReviewsCount = pendingReviewsCount;
    m.avgEventRating = avgEventRating;
  });
}

function loadStore() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      state = JSON.parse(raw);
      enrichStateWithGrades(state);
      saveStore();
      console.log('Database loaded from disk. Events:', state.events.length, 'Members:', state.members.length);
      return;
    } catch (err) {
      console.error('Error reading store.json, re-seeding:', err);
    }
  }

  state = {
    members: JSON.parse(JSON.stringify(initialMembers)),
    events: JSON.parse(JSON.stringify(initialEvents)),
    activities: [
      {
        id: uuidv4(),
        headName: 'System',
        action: 'INITIALIZED',
        details: 'System initialized with official records (9 events, 22 members).',
        timestamp: new Date().toISOString()
      }
    ]
  };
  enrichStateWithGrades(state);
  saveStore();
}

function saveStore() {
  // 1. Always save to local store.json
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save store.json:', err);
  }

  // 2. If connected to MongoDB Atlas, persist immediately to cloud
  if (isMongoConnected && stateCollection) {
    stateCollection.updateOne(
      { _id: 'vclick_primary_state' },
      { $set: { state, updatedAt: new Date().toISOString() } },
      { upsert: true }
    ).catch(err => {
      console.error('Failed to save state to MongoDB Atlas:', err);
    });
  }
}

// Initialize local store first as fast fallback
loadStore();

// Asynchronously connect to MongoDB Atlas if MONGODB_URI is provided
async function initMongo() {
  if (!MONGODB_URI) {
    console.log('ℹ️ No MONGODB_URI detected. Using local store.json persistence.');
    return;
  }

  try {
    console.log('Connecting to MongoDB Atlas Cloud Database...');
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    mongoDb = mongoClient.db(MONGODB_DB_NAME);
    stateCollection = mongoDb.collection('app_state');
    isMongoConnected = true;
    console.log('✅ Connected to MongoDB Atlas Cloud Database!');

    // Check if cloud state document exists
    const cloudDoc = await stateCollection.findOne({ _id: 'vclick_primary_state' });
    if (cloudDoc && cloudDoc.state && Array.isArray(cloudDoc.state.events) && cloudDoc.state.events.length > 0) {
      state = cloudDoc.state;
      enrichStateWithGrades(state);
      saveStore();
      console.log(`✅ Loaded persistent state from MongoDB Atlas: ${state.events.length} events, ${state.members.length} members.`);
    } else {
      // First time on MongoDB: seed cloud database with current data
      console.log('Initializing MongoDB Atlas with current club records...');
      await stateCollection.updateOne(
        { _id: 'vclick_primary_state' },
        { $set: { _id: 'vclick_primary_state', state, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
      console.log('✅ Baseline seeded to MongoDB Atlas.');
    }
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB Atlas, continuing with local store.json:', err.message);
    isMongoConnected = false;
  }
}

initMongo();

function calculateEventStats() {
  const memberCounts = {};
  state.members.forEach(m => {
    memberCounts[m.id] = 0;
  });

  state.events.forEach(evt => {
    (evt.assignedMemberIds || []).forEach(mId => {
      memberCounts[mId] = (memberCounts[mId] || 0) + 1;
    });
  });

  return memberCounts;
}

function logActivity(headName, action, details) {
  const activity = {
    id: uuidv4(),
    headName: headName || 'Head',
    action,
    details,
    timestamp: new Date().toISOString()
  };
  state.activities.unshift(activity);
  if (state.activities.length > 100) {
    state.activities = state.activities.slice(0, 100);
  }
  return activity;
}

const activeClients = new Map();

function broadcast(payload) {
  const data = JSON.stringify(payload);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function broadcastPresence() {
  const activeHeads = Array.from(activeClients.values());
  broadcast({
    type: 'PRESENCE_UPDATE',
    activeHeads
  });
}

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  activeClients.set(ws, { id: clientId, headName: 'Swanand More' });

  ws.send(JSON.stringify({
    type: 'INITIAL_STATE',
    state,
    memberStats: calculateEventStats(),
    activeHeads: Array.from(activeClients.values())
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'SET_HEAD') {
        const current = activeClients.get(ws) || { id: clientId };
        current.headName = data.headName || 'Head';
        activeClients.set(ws, current);
        broadcastPresence();
      }

      if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
      }
    } catch (e) {
      console.error('WS message error:', e);
    }
  });

  ws.on('close', () => {
    activeClients.delete(ws);
    broadcastPresence();
  });

  ws.on('error', (err) => {
    console.error('WS error:', err);
  });
});

app.use(cors());
app.use(express.json());

// Authentication Endpoint for Operating Heads (Admins) and Coordinators
app.post('/api/auth/login', (req, res) => {
  const { role, memberId, name, password } = req.body;

  if (!role || !password) {
    return res.status(400).json({ error: 'Role and passcode are required.' });
  }

  const cleanRole = role === 'Head' ? 'Head' : (role === 'Coordinator' ? 'Coordinator' : null);
  if (!cleanRole) {
    return res.status(400).json({ error: 'Invalid login role. Must be Head or Coordinator.' });
  }

  const trimmedPass = String(password).trim();

  if (cleanRole === 'Head') {
    if (trimmedPass !== HEAD_PASSWORD) {
      return res.status(401).json({ error: 'Incorrect Operating Head passcode. Access denied.' });
    }
    const headMember = state.members.find(m => m.id === memberId || (m.role === 'Head' && m.name === name)) || {
      id: memberId || 'm-head',
      name: name || 'Swanand More',
      role: 'Head',
      campus: 'Kondhwa'
    };
    return res.json({
      success: true,
      user: {
        id: headMember.id,
        name: headMember.name,
        role: 'Head',
        campus: headMember.campus
      }
    });
  }

  if (cleanRole === 'Coordinator') {
    if (trimmedPass !== COORD_PASSWORD) {
      return res.status(401).json({ error: 'Incorrect Coordinator passcode. Access denied.' });
    }
    const coordMember = state.members.find(m => m.id === memberId || (m.role === 'Coordinator' && m.name === name));
    if (!coordMember) {
      return res.status(404).json({ error: 'Coordinator profile not found in club records.' });
    }
    return res.json({
      success: true,
      user: {
        id: coordMember.id,
        name: coordMember.name,
        role: 'Coordinator',
        campus: coordMember.campus
      }
    });
  }
});

app.get('/api/state', (req, res) => {
  res.json({
    state,
    memberStats: calculateEventStats(),
    activeHeads: Array.from(activeClients.values()),
    dbInfo: {
      type: isMongoConnected ? 'mongodb' : 'local',
      status: isMongoConnected ? 'Connected to MongoDB Atlas' : 'Local File Storage',
      connected: isMongoConnected
    }
  });
});

// Download JSON Backup
app.get('/api/backup', (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="vclick_backup_${timestamp}.json"`);
  res.send(JSON.stringify({
    version: '1.0',
    exportedAt: new Date().toISOString(),
    state,
    memberStats: calculateEventStats()
  }, null, 2));
});

// Restore State from JSON Backup
app.post('/api/restore', (req, res) => {
  const { restoredState, headName } = req.body;
  if (!restoredState || !Array.isArray(restoredState.events) || !Array.isArray(restoredState.members)) {
    return res.status(400).json({ error: 'Invalid backup file format' });
  }

  state = {
    events: restoredState.events,
    members: restoredState.members,
    activities: Array.isArray(restoredState.activities) ? restoredState.activities : []
  };

  const activity = logActivity(
    headName,
    'RESTORED_DATABASE',
    `Restored database from JSON backup (${state.events.length} events, ${state.members.length} members)`
  );

  saveStore();

  broadcast({
    type: 'RESET_COMPLETED',
    state,
    memberStats: calculateEventStats(),
    activity,
    message: `${headName || 'A head'} restored database from JSON backup`
  });

  res.json({ success: true, state, memberStats: calculateEventStats() });
});

// Create Event
app.post('/api/events', (req, res) => {
  const {
    name,
    contactPerson,
    emailReceived,
    communicationDetails,
    date,
    campus,
    assignedMemberIds,
    driveLink,
    driveLinkSubmitted,
    status,
    notes,
    headName
  } = req.body;

  if (!name || !date) {
    return res.status(400).json({ error: 'Event name and date are required' });
  }

  const newEvent = {
    id: 'evt-' + Date.now(),
    srNo: state.events.length + 1,
    name: name.trim(),
    contactPerson: (contactPerson || '').trim(),
    emailReceived: Boolean(emailReceived),
    communicationDetails: (communicationDetails || '').trim(),
    date,
    campus: campus || 'Bibwewadi',
    assignedMemberIds: assignedMemberIds || [],
    driveLink: (driveLink || '').trim(),
    driveLinkSubmitted: Boolean(driveLinkSubmitted),
    status: status || 'Upcoming',
    notes: (notes || '').trim(),
    createdBy: headName || 'Head',
    createdAt: new Date().toISOString()
  };

  state.events.unshift(newEvent);
  saveStore();

  const activity = logActivity(
    headName,
    'CREATED_EVENT',
    `Created event: "${newEvent.name}" for ${newEvent.date}`
  );

  broadcast({
    type: 'EVENT_CREATED',
    event: newEvent,
    state,
    memberStats: calculateEventStats(),
    activity,
    message: `${headName || 'A head'} added event "${newEvent.name}"`
  });

  res.status(201).json({ event: newEvent, memberStats: calculateEventStats() });
});

// Update Event
app.put('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const index = state.events.findIndex(e => e.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const existing = state.events[index];
  const { headName, ...updates } = req.body;

  const updatedEvent = {
    ...existing,
    ...updates,
    id: existing.id
  };

  state.events[index] = updatedEvent;
  saveStore();

  const activity = logActivity(
    headName,
    'UPDATED_EVENT',
    `Updated event: "${updatedEvent.name}"`
  );

  broadcast({
    type: 'EVENT_UPDATED',
    event: updatedEvent,
    state,
    memberStats: calculateEventStats(),
    activity,
    message: `${headName || 'A head'} updated event "${updatedEvent.name}"`
  });

  res.json({ event: updatedEvent, memberStats: calculateEventStats() });
});

// Direct 1-Click Toggle of Member in Event from Allotment Matrix
app.post('/api/events/:id/toggle-member', (req, res) => {
  const { id } = req.params;
  const { memberId, headName } = req.body;

  const event = state.events.find(e => e.id === id);
  const member = state.members.find(m => m.id === memberId);

  if (!event || !member) {
    return res.status(404).json({ error: 'Event or Member not found' });
  }

  if (!Array.isArray(event.assignedMemberIds)) {
    event.assignedMemberIds = [];
  }

  const mIndex = event.assignedMemberIds.indexOf(memberId);
  const isNowAssigned = mIndex === -1;

  if (isNowAssigned) {
    event.assignedMemberIds.push(memberId);
  } else {
    event.assignedMemberIds.splice(mIndex, 1);
  }

  saveStore();

  const activity = logActivity(
    headName,
    'UPDATED_ALLOTMENT',
    `${isNowAssigned ? 'Assigned' : 'Removed'} ${member.name} ${isNowAssigned ? 'to' : 'from'} "${event.name}"`
  );

  broadcast({
    type: 'EVENT_UPDATED',
    event,
    state,
    memberStats: calculateEventStats(),
    activity,
    message: `${headName || 'A head'} ${isNowAssigned ? 'assigned' : 'removed'} ${member.name} ${isNowAssigned ? 'to' : 'from'} "${event.name}"`
  });

  res.json({ event, memberStats: calculateEventStats(), isAssigned: isNowAssigned });
});

// Direct 1-Click Update of Google Drive Link from Event List
app.post('/api/events/:id/set-drive', (req, res) => {
  const { id } = req.params;
  const { driveLink, headName } = req.body;

  const event = state.events.find(e => e.id === id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  event.driveLink = (driveLink || '').trim();
  if (event.driveLink) {
    event.driveLinkSubmitted = true;
  }
  saveStore();

  const activity = logActivity(
    headName,
    'UPDATED_EVENT',
    `Updated Drive link for "${event.name}"`
  );

  broadcast({
    type: 'EVENT_UPDATED',
    event,
    state,
    memberStats: calculateEventStats(),
    activity,
    message: `${headName || 'A head'} updated Drive link for "${event.name}"`
  });

  res.json({ event, memberStats: calculateEventStats() });
});

// Toggle Drive Submitted
app.post('/api/events/:id/toggle-drive', (req, res) => {
  const { id } = req.params;
  const { headName } = req.body;
  const event = state.events.find(e => e.id === id);

  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  event.driveLinkSubmitted = !event.driveLinkSubmitted;
  saveStore();

  const activity = logActivity(
    headName,
    'TOGGLE_DRIVE',
    `${event.driveLinkSubmitted ? 'Drive link submitted' : 'Drive link marked pending'} for "${event.name}"`
  );

  broadcast({
    type: 'EVENT_UPDATED',
    event,
    state,
    memberStats: calculateEventStats(),
    activity,
    message: `${headName || 'A head'} marked drive ${event.driveLinkSubmitted ? 'SUBMITTED' : 'PENDING'} for "${event.name}"`
  });

  res.json({ event, memberStats: calculateEventStats() });
});

// Save Event Crew Member Review & 5-Point Grade
app.post('/api/events/:id/reviews', (req, res) => {
  const { id } = req.params;
  const { memberId, isReviewed, rating, feedback, headName, userRole } = req.body;

  const event = state.events.find(e => e.id === id);
  const member = state.members.find(m => m.id === memberId);

  if (!event || !member) {
    return res.status(404).json({ error: 'Event or Member not found' });
  }

  // Permission Guard: Coordinators can ONLY review & grade Volunteers!
  if (userRole === 'Coordinator' && member.role !== 'Volunteer') {
    return res.status(403).json({ error: 'Coordinators are strictly restricted to grading Volunteers only.' });
  }

  if (member.role === 'Head') {
    return res.status(400).json({ error: 'Heads cannot be graded. Grading applies only to Coordinators and Volunteers.' });
  }

  if (!Array.isArray(event.crewReviews)) {
    event.crewReviews = [];
  }

  const reviewIdx = event.crewReviews.findIndex(r => r.memberId === memberId);
  const reviewedFlag = Boolean(isReviewed);

  if (!reviewedFlag) {
    const unreviewedObj = {
      memberId,
      isReviewed: false,
      rating: 0,
      feedback: '',
      reviewedBy: headName || 'Head',
      reviewedAt: new Date().toISOString()
    };
    if (reviewIdx !== -1) {
      event.crewReviews[reviewIdx] = unreviewedObj;
    } else {
      event.crewReviews.push(unreviewedObj);
    }
  } else {
    // 5-Point grading scale: strictly 1 to 5 points
    const numRating = Math.min(5, Math.max(1, Math.round(Number(rating) || 5)));
    const cleanFeedback = (feedback || '').trim();

    const reviewObj = {
      memberId,
      isReviewed: true,
      rating: numRating,
      feedback: cleanFeedback,
      reviewedBy: headName || 'Head',
      reviewedAt: new Date().toISOString()
    };

    if (reviewIdx !== -1) {
      event.crewReviews[reviewIdx] = reviewObj;
    } else {
      event.crewReviews.push(reviewObj);
    }
  }

  enrichStateWithGrades(state);
  saveStore();

  const updatedMember = state.members.find(m => m.id === memberId);
  const activity = logActivity(
    headName,
    'GRADED_CREW',
    reviewedFlag
      ? `Reviewed & graded ${member.name} (${rating || 5}/5 ⭐) for "${event.name}". Auto grade updated to: ${updatedMember?.overallGrade || 4.0}/5.0`
      : `Marked review pending for ${member.name} on "${event.name}"`
  );

  broadcast({
    type: 'EVENT_UPDATED',
    event,
    state,
    memberStats: calculateEventStats(),
    activity,
    message: reviewedFlag
      ? `${headName || 'A head'} graded ${member.name} (${rating || 5}/5 ⭐) on "${event.name}"`
      : `${headName || 'A head'} updated review status for ${member.name}`
  });

  res.json({ success: true, event, member: updatedMember, state, memberStats: calculateEventStats() });
});

// Delete Event
app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const { headName } = req.query;
  const index = state.events.findIndex(e => e.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const deleted = state.events.splice(index, 1)[0];
  enrichStateWithGrades(state);
  saveStore();

  const activity = logActivity(
    headName,
    'DELETED_EVENT',
    `Deleted event: "${deleted.name}"`
  );

  broadcast({
    type: 'EVENT_DELETED',
    eventId: id,
    state,
    memberStats: calculateEventStats(),
    activity,
    message: `${headName || 'A head'} removed event "${deleted.name}"`
  });

  res.json({ success: true, memberStats: calculateEventStats() });
});

// Add Member
app.post('/api/members', (req, res) => {
  const { name, role, campus, hasCamera, work, collegeTimings, phone, initialGrade, headName } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Member name is required' });
  }

  const memberRole = role || 'Volunteer';
  const newMember = {
    id: 'm-' + Date.now(),
    name: name.trim(),
    role: memberRole,
    campus: campus || 'Bibwewadi',
    hasCamera: Boolean(hasCamera),
    work: work || 'PHOTO',
    collegeTimings: (collegeTimings || '').trim(),
    phone: (phone || '').trim(),
    initialGrade: memberRole === 'Head' ? null : (typeof initialGrade === 'number' ? Math.min(5, Math.max(1, initialGrade)) : 4.0)
  };

  state.members.push(newMember);
  enrichStateWithGrades(state);
  saveStore();

  const activity = logActivity(
    headName,
    'ADDED_MEMBER',
    `Added new ${newMember.role}: "${newMember.name}"`
  );

  broadcast({
    type: 'MEMBER_ADDED',
    member: newMember,
    state,
    memberStats: calculateEventStats(),
    activity,
    message: `${headName || 'A head'} added member "${newMember.name}"`
  });

  res.status(201).json({ member: newMember, memberStats: calculateEventStats() });
});

// Update Member
app.put('/api/members/:id', (req, res) => {
  const { id } = req.params;
  const index = state.members.findIndex(m => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Member not found' });
  }

  const existing = state.members[index];
  const { headName, ...updates } = req.body;

  const updatedMember = {
    ...existing,
    ...updates,
    id: existing.id
  };

  if (updatedMember.role === 'Head') {
    updatedMember.initialGrade = null;
    updatedMember.overallGrade = null;
  } else if (typeof updatedMember.initialGrade === 'number') {
    updatedMember.initialGrade = Math.min(5, Math.max(1, Number(updatedMember.initialGrade.toFixed(1))));
  }

  state.members[index] = updatedMember;
  enrichStateWithGrades(state);
  saveStore();

  const activity = logActivity(
    headName,
    'UPDATED_MEMBER',
    `Updated member: "${updatedMember.name}"`
  );

  broadcast({
    type: 'MEMBER_UPDATED',
    member: updatedMember,
    state,
    memberStats: calculateEventStats(),
    activity,
    message: `${headName || 'A head'} updated "${updatedMember.name}"`
  });

  res.json({ member: updatedMember, memberStats: calculateEventStats() });
});

// Update Initial Baseline Grade for Coordinator / Volunteer
app.put('/api/members/:id/initial-grade', (req, res) => {
  const { id } = req.params;
  const { initialGrade, headName, userRole } = req.body;
  const member = state.members.find(m => m.id === id);

  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }

  if (userRole && userRole !== 'Head') {
    return res.status(403).json({ error: 'Only Operating Heads can edit baseline initial grades.' });
  }

  if (member.role === 'Head') {
    return res.status(400).json({ error: 'Heads do not have baseline grades.' });
  }

  const gradeNum = Math.min(5, Math.max(1, parseFloat(initialGrade) || 4.0));
  member.initialGrade = Number(gradeNum.toFixed(1));

  enrichStateWithGrades(state);
  saveStore();

  const activity = logActivity(
    headName,
    'UPDATED_INITIAL_GRADE',
    `Updated baseline grade for ${member.name} to ${member.initialGrade}/5.0 (Overall auto-grade: ${member.overallGrade}/5.0)`
  );

  broadcast({
    type: 'MEMBER_UPDATED',
    member,
    state,
    memberStats: calculateEventStats(),
    activity,
    message: `${headName || 'A head'} updated baseline grade for ${member.name} to ${member.initialGrade}/5.0`
  });

  res.json({ success: true, member, state });
});

// Delete Member
app.delete('/api/members/:id', (req, res) => {
  const { id } = req.params;
  const { headName } = req.query;
  const index = state.members.findIndex(m => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Member not found' });
  }

  const deleted = state.members.splice(index, 1)[0];

  state.events.forEach(evt => {
    if (evt.assignedMemberIds && evt.assignedMemberIds.includes(id)) {
      evt.assignedMemberIds = evt.assignedMemberIds.filter(mId => mId !== id);
    }
    if (Array.isArray(evt.crewReviews)) {
      evt.crewReviews = evt.crewReviews.filter(r => r.memberId !== id);
    }
  });

  enrichStateWithGrades(state);
  saveStore();

  const activity = logActivity(
    headName,
    'DELETED_MEMBER',
    `Removed member: "${deleted.name}"`
  );

  broadcast({
    type: 'MEMBER_DELETED',
    memberId: id,
    state,
    memberStats: calculateEventStats(),
    activity,
    message: `${headName || 'A head'} removed "${deleted.name}"`
  });

  res.json({ success: true, memberStats: calculateEventStats() });
});

// Smart Fair Allotment Recommender
app.post('/api/smart-suggest', (req, res) => {
  const {
    eventDate,
    requiredCount = 2,
    workFilter,
    campusFilter,
    cameraRequired,
    roleFilter
  } = req.body;

  const stats = calculateEventStats();
  const bookedMemberIds = new Set();
  if (eventDate) {
    state.events
      .filter(e => e.date === eventDate)
      .forEach(e => {
        (e.assignedMemberIds || []).forEach(mId => bookedMemberIds.add(mId));
      });
  }

  let candidates = state.members.map(member => {
    const eventCount = stats[member.id] || 0;
    const isBooked = bookedMemberIds.has(member.id);

    let skillMatch = true;
    if (workFilter && workFilter !== 'ALL') {
      if (workFilter === 'PHOTO') skillMatch = member.work.includes('PHOTO');
      else if (workFilter === 'VIDEO') skillMatch = member.work.includes('VIDEO');
      else if (workFilter === 'EDIT') skillMatch = member.work.includes('EDIT');
    }

    let campusMatch = true;
    if (campusFilter && campusFilter !== 'ALL') {
      campusMatch = (member.campus === campusFilter);
    }

    let cameraMatch = true;
    if (cameraRequired === true) {
      cameraMatch = member.hasCamera === true;
    }

    let roleMatch = true;
    if (roleFilter && roleFilter !== 'ALL') {
      roleMatch = member.role === roleFilter;
    }

    let score = 100 - (eventCount * 20);
    if (isBooked) score -= 80;
    if (!skillMatch) score -= 35;
    if (!campusMatch) score -= 25;
    if (!cameraMatch) score -= 30;
    if (eventCount === 0) score += 30;

    return {
      ...member,
      currentEventCount: eventCount,
      isBooked,
      skillMatch,
      campusMatch,
      cameraMatch,
      roleMatch,
      suitabilityScore: score
    };
  });

  candidates.sort((a, b) => {
    if (b.suitabilityScore !== a.suitabilityScore) {
      return b.suitabilityScore - a.suitabilityScore;
    }
    return a.currentEventCount - b.currentEventCount;
  });

  const recommended = candidates
    .filter(c => !c.isBooked && c.skillMatch && c.campusMatch && c.cameraMatch && c.roleMatch)
    .slice(0, Number(requiredCount));

  res.json({
    recommended,
    allCandidates: candidates,
    totalZeroEventMembers: state.members.filter(m => (stats[m.id] || 0) === 0).length
  });
});

// CSV Export
app.get('/api/export/csv', (req, res) => {
  const stats = calculateEventStats();

  let csv = 'Type,Name,Role,Campus,Camera,Work,Initial Grade,Overall Auto Grade,Reviews Count,Total Events Covered,College Timings\r\n';
  state.members.forEach(m => {
    const initG = m.role === 'Head' ? 'N/A (Head)' : (m.initialGrade ? `${m.initialGrade}/5.0` : '4.0/5.0');
    const overG = m.role === 'Head' ? 'N/A (Head)' : (m.overallGrade ? `${m.overallGrade}/5.0` : `${initG}`);
    const revCnt = m.role === 'Head' ? 'N/A' : (m.reviewsCount || 0);
    csv += `"${m.name}","${m.role}","${m.campus}","${m.hasCamera ? 'Yes' : 'No'}","${m.work}","${initG}","${overG}",${revCnt},${stats[m.id] || 0},"${m.collegeTimings || ''}"\r\n`;
  });

  csv += '\r\n\r\nSr No,Event Name,Contact Person,Date,Campus,Students Assigned,Drive Link,Drive Submitted,Notes\r\n';
  state.events.forEach((e, idx) => {
    const assignedNames = (e.assignedMemberIds || [])
      .map(id => {
        const m = state.members.find(mem => mem.id === id);
        return m ? m.name : id;
      })
      .join('; ');

    csv += `${idx + 1},"${e.name}","${e.contactPerson}","${e.date}","${e.campus}","${assignedNames}","${e.driveLink}","${e.driveLinkSubmitted ? 'Yes' : 'No'}","${e.notes || ''}"\r\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="vclick_media_club_records.csv"');
  res.send(csv);
});

// Reset Demo Data
app.post('/api/reset-demo', (req, res) => {
  const { headName, userRole } = req.body;
  if (userRole && userRole !== 'Head') {
    return res.status(403).json({ error: 'Only Operating Heads can reset the database.' });
  }
  state = {
    members: JSON.parse(JSON.stringify(initialMembers)),
    events: JSON.parse(JSON.stringify(initialEvents)),
    activities: [
      {
        id: uuidv4(),
        headName: headName || 'System',
        action: 'RESET_DATA',
        details: 'Data reset to official sheets baseline.',
        timestamp: new Date().toISOString()
      }
    ]
  };
  saveStore();

  broadcast({
    type: 'RESET_COMPLETED',
    state,
    memberStats: calculateEventStats(),
    message: 'System data reset to official spreadsheet records'
  });

  res.json({ success: true, state, memberStats: calculateEventStats() });
});

const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ VCLICK Media Club Server running on http://localhost:${PORT}`);
});
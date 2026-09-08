# LensSync — College Media Club Real-Time Management System
### Photography, Videography & Editing Club Event Allotment & Deliverable Tracker

Designed specifically for the 5 Heads to manage Coordinators and Volunteers across campuses (**Bibwewadi** & **Kondhwa**) with instant multi-user synchronization and a smart fair-allotment load balancing engine.

---

## 🚀 Quick Start (1-Click Run)

### Option 1: Double Click
Simply double-click `start.bat` in the root folder.
It starts both the real-time WebSocket backend and the web app, and opens at:
```
http://localhost:3000   (Vite Dev Server)
http://localhost:5000   (Unified Production Server & WebSocket)
```

### Option 2: Command Line
```powershell
# In root directory:
cd server
npm start
```
The server on port `5000` serves the full compiled application and WebSocket live engine.

---

## 📱 How All 5 Heads Can Use It Together Simultaneously

### Over College Wi-Fi / Hotspot (Instant Local Network Sharing)
1. Turn on Mobile Hotspot or connect your laptop to the college Wi-Fi.
2. Check your laptop's local IP address:
   ```powershell
   ipconfig
   ```
   (Look for *IPv4 Address*, e.g., `192.168.1.45`).
3. Start the server: `cd server && npm start`.
4. Any of the other 4 heads can now open `http://192.168.1.45:5000` directly in Chrome or Safari on their laptops or smartphones!
5. Changes made by any head sync across all screens in under 50ms over WebSocket!

### Free Cloud Deployment (Access from Anywhere)
You can deploy this repository for free to **Render.com** or **Railway.app**:
- Build Command: `cd client && npm install && npm run build && cd ../server && npm install`
- Start Command: `node server/server.js`
- Environment Variables: `PORT=5000`

---

## ⚡ Core Features & Solutions Provided

### 1. Fair Allotment & Equal Distribution Engine (Main Problem Solved)
- **Zero-Event Spotlight**: An alert banner at the top of the **Fair Allotment Matrix** tab spotlights every coordinator and volunteer who currently has 0 events allotted (e.g. Adwait Torne, Manav Dantakale, Om Patil, Kartik, Nayan, Sanskar).
- **Allotment Meter**: Each member displays a visual workload gauge (`0 events` = Priority, `1-2 events` = Balanced, `3+ events` = High load).
- **Auto-Suggest Balanced Crew**: When drafting a new event or editing an existing one, click **"Auto-Suggest Balanced Crew"**. The algorithm automatically filters for candidates with the lowest cumulative event count, matching required skills (Photo / Video / Edit) and campus.
- **Double-Booking Detection**: Warns if a member is already assigned to another shoot on the same date.

### 2. Instant Real-Time Synchronization
- **WebSocket duplex pipeline**: When any head edits an event, assigns a student, or toggles drive link status, the update is broadcast live to all other connected heads without needing to refresh the page.
- **Live Head Switcher**: Switch between any of the 5 Heads (`Swanand More`, `Pratham Hindocha`, `Varad Belsare`, `Harshal Shinde`, `Kunal Pawar`) to attribute edits accurately in the audit feed.
- **Active Heads Presence**: Live pill showing how many heads are currently online.
- **Live Toast Notifications**: Non-intrusive alerts showing what other heads just updated.

### 3. Deliverables & Google Drive Tracking
- Real Google Drive folders for all 9 events pre-loaded with 1-click external open and copy buttons.
- 1-click interactive toggle for **"Drive Link Submitted"** status (turns green for Submitted, red for Pending).
- Overdue and pending submission indicators.

### 4. Data Pre-seeded from Attached Documents
- **22 Team Members**: The 5 Heads, 5 Coordinators, and 12 Volunteers transcribed directly from your provided Excel sheets with campus, camera ownership, and skill tags.
- **9 Official Events (2026-27)**: Student Teacher Photoshoots, Guru Pournima IT Dept, Friendship Day Shoot, Mech Dept Promo, IEEE EMBS, Independence Day Kondhwa & Bibwewadi, Speakers Club, and AIDS Dept.

---

## 📁 Project Structure

```
club-sync-app/
├── package.json           # Root project script runner
├── start.bat              # 1-click launch batch script
├── server/
│   ├── server.js          # Express API + WebSocket broadcast + JSON persistence
│   ├── seedData.js        # Baseline 9 events & 22 team members from college sheets
│   ├── package.json       # Server dependencies (express, ws, cors, uuid)
│   └── data/
│       └── store.json     # Auto-saved persistent database
└── client/
    ├── src/
    │   ├── App.jsx        # Root app with real-time socket synchronizer
    │   ├── components/
    │   │   ├── Navbar.jsx           # Presence, head switcher, live badge
    │   │   ├── EventList.jsx        # Spreadsheet table & cards view, filters
    │   │   ├── EventModal.jsx       # Event editor & smart crew assignment
    │   │   ├── AllotmentMatrix.jsx  # Heatmap, load balancing & zero-event spotlight
    │   │   ├── TeamRoster.jsx       # Member directory with camera/skill badges
    │   │   ├── MemberModal.jsx      # Add/edit member dialog
    │   │   └── LiveActivityFeed.jsx # Real-time audit stream
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    └── package.json
```
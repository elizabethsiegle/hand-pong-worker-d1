### Hand-Pong--AI-powered Hand-tracking Pong game!
<img width="2206" height="1164" alt="image" src="https://github.com/user-attachments/assets/762567ac-adda-4494-9500-fb9cdf9fcf1b" />


Control a real-time game of Pong via your hand or play against a friend (or yourself) feat. 3 difficulty levels! 

🛠️ Tech Stack
Deployment: Wrangler CLI
- Backend: [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- Handtracking: [MediaPipe](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js)
- Dynamic AI names for AI player and 2 players w/ [Cloudflare Workers AI (Llama 4 Scout)](https://developers.cloudflare.com/workers-ai/)
- SQL Database for leaderboard: [Cloudflare D1](https://developers.cloudflare.com/d1/)
- Frontend: Vanilla JavaScript with Canvas API

#### Prerequisites

- Node.js 16+
- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

1. Clone & Install
```bash
git clone https://github.com/elizabethsiegle/hand-pong-worker-d1.git
cd hand-pong-worker-d1
npm install
```

2. Cloudflare Setup

a. Login via Wrangler
```bash
wrangler login
```
b. Create D1 Database
```bash
wrangler d1 create hand-pong-leaderboard
```
(and paste the output into your wrangler.jsonc or wrangler.toml)
c. Create the leaderboard table in D1 
```bash
wrangler d1 execute hand-pong-leaderboard --command "CREATE TABLE hand_pong_leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    score INTEGER NOT NULL,
    time INTEGER NOT NULL,
    difficulty TEXT DEFAULT 'normal',
    date TEXT NOT NULL
);"
```
d. Add the AI binding to your wrangler file.

3. Development
bash
```bash
# Start local development server
wrangler dev
# Access your game at http://localhost:8787
```
4. Deploy! 🚀🚢
```bash
# Deploy to Cloudflare Workers
wrangler deploy
# Your game will be live at https://your-worker-name.your-subdomain.workers.dev
```

#### 🔧 Configuration
No environment variables needed! 

#### Database Schema
```sql
CREATE TABLE hand_pong_leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    score INTEGER NOT NULL,
    time INTEGER NOT NULL,
    difficulty TEXT DEFAULT 'normal',
    date TEXT NOT NULL
);
```

#### 🌐 API Endpoints
- GET / - Game interface
- GET /styles/main.css - Game styles
- POST /api/generate-names - Generate AI/player names
- POST /api/save-score - Save player score
- GET /api/leaderboard - Get top scores

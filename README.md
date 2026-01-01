# 🗺️ Girify - Barcelona Streets Quiz

A daily geography challenge where users identify Barcelona streets on an interactive map. Everyone gets the same 10 streets each day!

🎮 **[Play Live](https://girify.vercel.app)**

## Features
- 🌍 Interactive Leaflet map with Barcelona streets
- 🎯 Daily challenges with deterministic seeding
- ⚡ Speed-based scoring system
- 💡 Smart hints system with map overlays
- 🏆 Global Firebase leaderboard
- 🔐 Google & Email/Password authentication
- 🌓 Dark/Light mode
- 📱 Fully responsive (Mobile/Tablet/Desktop)

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS
- **Map**: Leaflet.js + OpenStreetMap
- **Backend**: Firebase (Auth + Firestore)
- **Deployment**: Vercel
- **Data**: OpenStreetMap via Overpass API

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project (for auth & database)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/robdoesthething/Girify.git
cd Girify
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Firebase**
   
   Copy the env template:
```bash
cp .env.template .env.development
```
   
   Fill in your Firebase credentials in `.env.development`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. **Run development server**
```bash
npm run dev
```
   
   Open [http://localhost:5173](http://localhost:5173)

5. **Build for production**
```bash
npm run build
```

## Data Pipeline

The app uses 200 curated Barcelona streets extracted from OpenStreetMap:
```bash
# Fetch latest street data (requires ~180s)
npm run fetch-streets
```

This runs `scripts/fetchStreets.js` which:
1. Queries Overpass API for Barcelona streets
2. Filters and deduplicates ~11,466 segments
3. Saves 200 best streets to `src/data/streets.json`

## Game Mechanics

### Daily Challenge System
- Uses date-based seeding: `hash("2026-01-01") → deterministic shuffle`
- Everyone gets the same 10 streets per day
- No backend coordination needed!

### Scoring
- **Speed-based**: <3s = 1000pts, <10s = 750pts, <20s = 500pts, >20s = 250pts
- **No hint penalties** (as of v1.0)

### Hints
- 3 hints per question
- Shows nearby intersecting streets
- Fallback: nearest streets by distance

## Project Structure
```
Girify/
├── src/
│   ├── components/       # React UI components
│   │   ├── App.jsx       # Main game logic
│   │   ├── MapArea.jsx   # Leaflet map
│   │   ├── Quiz/         # Quiz components
│   │   └── ...
│   ├── context/          # React Context (Theme)
│   ├── data/             # Static game data
│   │   ├── streets.json  # 200 Barcelona streets
│   │   └── boundary.json # City boundary
│   └── utils/            # Firebase config, helpers
├── scripts/              # Data fetching scripts
├── public/               # Static assets
└── vercel.json           # Deployment config
```

## Deployment

Deployed automatically via Vercel on push to `main`:

1. **Connect to Vercel**: Link your GitHub repo
2. **Add Environment Variables**: Copy all `VITE_*` vars to Vercel dashboard
3. **Deploy**: `git push origin main`

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- [ ] TypeScript migration
- [ ] Add testing (Vitest + React Testing Library)
- [ ] Multi-city support (Madrid, Valencia)
- [ ] Multiplayer mode (real-time races)
- [ ] Achievement system
- [ ] Progressive difficulty modes

## License

MIT License - feel free to use for learning or your own projects!

## Credits

- **Map Data**: OpenStreetMap contributors
- **Map Tiles**: Carto CDN
- **Street Data**: Overpass API
- Built with 💙 by [robdoesthething](https://github.com/robdoesthething)

## Support

Found a bug? [Open an issue](https://github.com/robdoesthething/Girify/issues)

---

⭐ Star this repo if you find it helpful!

# 🗺️ Girify - Barcelona Streets Quiz

![TypeScript](https://img.shields.io/badge/TypeScript-57.6%25-blue)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-70%20passed-brightgreen)

A daily geography challenge where users identify Barcelona streets on an interactive map. Everyone gets the same 10 streets each day!

🎮 **[Play Live](https://girify.vercel.app)**

## ✨ Features

- 🌍 **Interactive Map** - Leaflet-powered Barcelona street exploration
- 🎯 **Daily Challenges** - Same 10 streets for everyone, new set daily
- ⚡ **Speed Scoring** - Faster answers = more points (up to 1000 per question)
- 💡 **Smart Hints** - Map overlays showing nearby intersecting streets
- 🏆 **Leaderboards** - Global rankings (daily, weekly, all-time, districts)
- 🏙️ **District Teams** - Join one of 10 Barcelona district teams
- 👥 **Social Features** - Friends, profiles, achievements, referrals
- 🛒 **Shop** - Customizable avatars, frames, and titles with in-game currency
- 🔐 **Authentication** - Google & Email/Password with email verification
- 🌓 **Themes** - Dark/Light/Auto mode
- 📱 **Responsive** - Mobile, Tablet, and Desktop optimized
- 🔔 **PWA** - Installable with offline support

## 🛠️ Tech Stack

| Category       | Technologies                                |
| -------------- | ------------------------------------------- |
| **Frontend**   | React 19, TypeScript, Vite 7, Tailwind CSS  |
| **Map**        | Leaflet.js, React-Leaflet, OpenStreetMap    |
| **Backend**    | Firebase (Auth, Firestore, Cloud Messaging) |
| **Animation**  | Framer Motion                               |
| **Testing**    | Vitest, React Testing Library, Playwright   |
| **Deployment** | Vercel (auto-deploy on push)                |

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/robdoesthething/Girify.git
cd Girify
npm install

# Configure Firebase (copy .env.template to .env.development)
cp .env.template .env.development
# Fill in your Firebase credentials

# Run development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## 📁 Project Structure

```
src/
├── components/      # Shared UI components
│   └── admin/       # Admin panel components
├── features/        # Feature-based modules
│   ├── auth/        # Authentication (login, register, verify)
│   ├── friends/     # Friend system
│   ├── game/        # Core game logic & components
│   ├── leaderboard/ # Rankings & scores
│   ├── profile/     # User profiles
│   └── shop/        # In-game shop
├── context/         # React Context providers
├── data/            # Static data (streets, cosmetics, districts)
├── hooks/           # Custom React hooks
├── types/           # TypeScript type definitions
└── utils/           # Utility functions & Firebase helpers
```

## 🎮 Game Mechanics

### Daily Challenge System

- Date-based seeding: `hash("2026-01-18") → deterministic shuffle`
- Everyone gets the same 10 streets per day
- No backend coordination needed!

### Scoring

| Speed | Points |
| ----- | ------ |
| < 3s  | 1000   |
| < 10s | 750    |
| < 20s | 500    |
| > 20s | 250    |

### District Teams

Each user joins one of 10 Barcelona district teams:

- Ciutat Vella Gargoyles 🏛️
- Eixample Dragons 🐉
- Sants Lions 🦁
- Les Corts Eagles 🦅
- Sarrià Foxes 🦊
- Gràcia Cats 🐱
- Horta Boars 🐗
- Nou Barris Wolves 🐺
- Sant Andreu Bears 🐻
- Sant Martí Sharks 🦈

## 🧪 Testing

```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run test:e2e      # Playwright E2E tests
```

## 📝 Scripts

| Script                  | Description                  |
| ----------------------- | ---------------------------- |
| `npm run dev`           | Start dev server             |
| `npm run build`         | Production build             |
| `npm run lint`          | ESLint check                 |
| `npm run type-check`    | TypeScript validation        |
| `npm run fetch-streets` | Refresh street data from OSM |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit with conventional commits (`git commit -m 'feat: add amazing feature'`)
4. Push and open a Pull Request

## 📄 License

MIT License - feel free to use for learning or your own projects!

## 🙏 Credits

- **Map Data**: OpenStreetMap contributors
- **Map Tiles**: Carto CDN
- **Street Data**: Overpass API
- Built with 💙 by [robdoesthething](https://github.com/robdoesthething)

---

⭐ Star this repo if you find it helpful!

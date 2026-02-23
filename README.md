# MySQL Client GUI

A professional web-based MySQL client with a modern GUI, built with React, TypeScript, Express, and MongoDB.

## Features

- 🔐 **User Authentication** — Register/login with JWT-based auth
- 💾 **Saved Connections** — Store MySQL connection details securely (AES-256-CBC encrypted passwords)
- 🗄️ **Database Browser** — Navigate databases and tables in a collapsible tree view
- 📊 **Table Viewer** — View table data with pagination and per-column filter inputs
- ✏️ **Query Editor** — Execute raw SQL with results table, row count, and execution time
- 🔒 **Security** — bcrypt password hashing, JWT authentication, AES-256-CBC encryption for stored credentials

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| HTTP Client | Axios |
| Backend | Express.js + TypeScript |
| App Database | MongoDB + Mongoose |
| MySQL Driver | mysql2 |
| Auth | JWT + bcryptjs |
| Encryption | Node.js crypto (AES-256-CBC) |

## Project Structure

```
mysql-client/
├── backend/
│   ├── src/
│   │   ├── models/        # MongoDB models (User, Connection)
│   │   ├── routes/        # API routes (auth, connections, mysql)
│   │   ├── middleware/    # Auth middleware, crypto utilities
│   │   └── index.ts       # App entry point
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/           # Axios API client
│   │   ├── context/       # React contexts (Auth, Connection)
│   │   ├── components/    # ConnectionManager, DatabaseTree, TableViewer, QueryEditor
│   │   ├── pages/         # LoginPage, MainPage
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
└── docker-compose.yml
```

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Local Development

1. **Install dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Configure backend environment:**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your values
   ```

3. **Start MongoDB** (if local):
   ```bash
   mongod --dbpath /data/db
   ```

4. **Start backend:**
   ```bash
   cd backend && npm run dev
   ```

5. **Start frontend:**
   ```bash
   cd frontend && npm run dev
   ```

6. Open http://localhost:5173

### Docker

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## API Reference

### Auth (`/api/auth`)
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/register` | `{email, password}` | Register |
| POST | `/login` | `{email, password}` | Login → JWT |

### Connections (`/api/connections`) — Bearer token required
| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/` | — | List saved connections |
| POST | `/` | `{name, host, port, user, password, database?}` | Save connection |
| DELETE | `/:id` | — | Delete connection |

### MySQL (`/api/mysql`) — Bearer token required
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/test` | connection info | Test connectivity |
| POST | `/databases` | connection info | List databases |
| POST | `/tables` | connection info + `database` | List tables |
| POST | `/table-structure` | connection info + `database` + `table` | Get columns |
| POST | `/table-data` | connection info + `database` + `table` + `filters?` + `limit?` + `offset?` | Get rows |
| POST | `/query` | connection info + `database?` + `sql` | Execute SQL |

**Connection info**: `{host, port, user, password, database?}` or `{connectionId}` for saved connections.

## Environment Variables

```
MONGODB_URI=mongodb://localhost:27017/mysql-client
JWT_SECRET=your-very-secret-jwt-key
ENCRYPTION_KEY=exactly-32-chars-long-key-here!!
PORT=3001
```

## License

MIT

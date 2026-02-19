# 🏆 Sportz

A real-time sports commentary and match tracking API built with **Node.js**, **Express**, **WebSockets**, and **Drizzle ORM** on a **PostgreSQL** (Neon) database.

---

## ✨ Features

- **Match Management** — Create and list sports matches with automatic status derivation (`scheduled`, `live`, `finished`)
- **Live Commentary** — Post and stream per-match commentary events in real time
- **WebSocket Broadcasting** — Instantly push new matches and commentary entries to all subscribed clients via WebSocket
- **Per-match Subscriptions** — Clients can subscribe to individual match channels and receive targeted updates
- **Heartbeat / Keep-alive** — Automatic ping/pong cycle every 30 seconds to detect and terminate dead connections
- **Input Validation** — Full request validation using [Zod](https://zod.dev) on all REST endpoints
- **Database Migrations** — Schema managed via [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)

---

## 🗂️ Project Structure

```
sportz/
├── collection/
│   └── sportz.postman_collection.json  # Postman API collection
├── drizzle/                            # Generated migration files
├── drizzle.config.js                   # Drizzle Kit configuration
├── utils/
│   └── match-status.js                 # Match status helper (scheduled/live/finished)
├── src/
│   ├── index.js                        # App entry point (Express + HTTP + WebSocket)
│   ├── db/
│   │   └── db.js                       # PostgreSQL pool + Drizzle instance
│   ├── schema/
│   │   └── schema.js                   # Drizzle table definitions (matches, commentary)
│   ├── routes/
│   │   ├── matches.route.js            # GET/POST /matches
│   │   └── commentary.route.js         # GET/POST /matches/:id/commentary
│   ├── validation/
│   │   ├── matches.js                  # Zod schemas for matches
│   │   └── commentary.js               # Zod schemas for commentary
│   └── ws/
│       └── server.js                   # WebSocket server + subscription logic
└── package.json
```

---

## 🛠️ Tech Stack

| Layer         | Technology                    |
| ------------- | ----------------------------- |
| Runtime       | Node.js (ESM)                 |
| Web Framework | Express v5                    |
| WebSocket     | `ws` library                  |
| Database      | PostgreSQL (Neon recommended) |
| ORM           | Drizzle ORM                   |
| Migrations    | Drizzle Kit                   |
| Validation    | Zod                           |
| Config        | dotenv                        |

---

## ⚙️ Prerequisites

- **Node.js** v18+
- A **PostgreSQL** database (e.g. [Neon](https://neon.tech) — free tier works fine)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd sportz
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
PORT=8000
HOST=0.0.0.0
```

### 4. Run database migrations

```bash
# Generate migration SQL from the schema
npm run db:generate

# Apply migrations to the database
npm run db:migrate
```

### 5. Start the development server

```bash
npm run dev
```

The API will be available at `http://localhost:8000` and the WebSocket server at `ws://localhost:8000/ws`.

---

## 📡 REST API Reference

### Health Check

```
GET /
```

Returns a plain-text confirmation that the server is running.

---

### Matches

#### List Matches

```
GET /matches?limit=<number>
```

| Query Param | Type           | Description                        |
| ----------- | -------------- | ---------------------------------- |
| `limit`     | number (1–100) | Max results to return. Default: 50 |

**Response `200`**

```json
{
  "data": [
    {
      "id": 1,
      "sport": "football",
      "homeTeam": "TeamA",
      "awayTeam": "TeamB",
      "status": "live",
      "startTime": "2025-02-01T12:00:00.000Z",
      "endTime": "2025-02-01T13:45:00.000Z",
      "homeScore": 1,
      "awayScore": 0,
      "createdAt": "2025-02-01T11:55:00.000Z"
    }
  ]
}
```

#### Create a Match

```
POST /matches
Content-Type: application/json
```

**Request Body**

```json
{
  "sport": "football",
  "homeTeam": "TeamA",
  "awayTeam": "TeamB",
  "startTime": "2025-02-01T12:00:00.000Z",
  "endTime": "2025-02-01T13:45:00.000Z",
  "homeScore": 0,
  "awayScore": 0
}
```

| Field       | Required | Description                                        |
| ----------- | -------- | -------------------------------------------------- |
| `sport`     | ✅       | Sport type (e.g. `"football"`)                     |
| `homeTeam`  | ✅       | Home team name                                     |
| `awayTeam`  | ✅       | Away team name                                     |
| `startTime` | ✅       | ISO 8601 UTC timestamp                             |
| `endTime`   | ✅       | ISO 8601 UTC timestamp (must be after `startTime`) |
| `homeScore` | ❌       | Defaults to `0`                                    |
| `awayScore` | ❌       | Defaults to `0`                                    |

**Response `201`** — Returns the newly created match object.  
On success, a `match_created` WebSocket event is broadcast to all connected clients.

---

### Commentary

#### List Commentary

```
GET /matches/:id/commentary?limit=<number>
```

Returns commentary for a specific match, ordered newest first.

| Query Param | Type           | Description                         |
| ----------- | -------------- | ----------------------------------- |
| `limit`     | number (1–100) | Max results to return. Default: 100 |

#### Add Commentary

```
POST /matches/:id/commentary
Content-Type: application/json
```

**Request Body**

```json
{
  "minute": 45,
  "sequence": 1,
  "period": "first_half",
  "eventType": "goal",
  "actor": "Player Name",
  "team": "TeamA",
  "message": "GOAL! Player Name scores for TeamA!",
  "metadata": { "assistedBy": "PlayerX" },
  "tags": ["goal", "first_half"]
}
```

| Field       | Required | Description                          |
| ----------- | -------- | ------------------------------------ |
| `message`   | ✅       | Commentary text (min 1 char)         |
| `minute`    | ✅       | Match minute (non-negative integer)  |
| `sequence`  | ❌       | Optional ordering within the minute  |
| `period`    | ❌       | Match period (e.g. `"first_half"`)   |
| `eventType` | ❌       | Event type (e.g. `"goal"`, `"foul"`) |
| `actor`     | ❌       | Player or actor involved             |
| `team`      | ❌       | Team associated with the event       |
| `metadata`  | ❌       | Arbitrary JSON object for extra data |
| `tags`      | ❌       | Array of string tags                 |

**Response `201`** — Returns the created commentary entry.  
On success, a `commentary` WebSocket event is broadcast to subscribers of that match.

---

## 🔌 WebSocket Reference

Connect to: `ws://localhost:8000/ws`

On connection, the server sends:

```json
{ "type": "Welcome" }
```

### Subscribe to a Match

```json
{ "type": "subscribe", "matchId": 1 }
```

**Server response:**

```json
{ "type": "subscribed", "matchId": 1 }
```

### Unsubscribe from a Match

```json
{ "type": "unsubscribe", "matchId": 1 }
```

**Server response:**

```json
{ "type": "unsubscribed", "matchId": 1 }
```

### Server → Client Events

| Event Type      | Trigger                                           | Payload                                      |
| --------------- | ------------------------------------------------- | -------------------------------------------- |
| `match_created` | New match created via `POST /matches`             | `{ type: "match_created", data: <match> }`   |
| `commentary`    | New commentary via `POST /matches/:id/commentary` | `{ type: "commentary", data: <commentary> }` |
| `error`         | Invalid JSON sent by client                       | `{ type: "error", message: "Invalid JSON" }` |

> **Note:** `match_created` is broadcast to **all** connected clients. `commentary` events are sent **only** to clients subscribed to that specific `matchId`.

---

## 🗄️ Database Schema

### `matches` table

| Column       | Type      | Notes                             |
| ------------ | --------- | --------------------------------- |
| `id`         | serial    | Primary key                       |
| `sport`      | text      | Required                          |
| `home_team`  | text      | Required                          |
| `away_team`  | text      | Required                          |
| `status`     | enum      | `scheduled` / `live` / `finished` |
| `start_time` | timestamp | Required                          |
| `end_time`   | timestamp |                                   |
| `home_score` | integer   | Default `0`                       |
| `away_score` | integer   | Default `0`                       |
| `created_at` | timestamp | Auto                              |

### `commentary` table

| Column       | Type      | Notes                              |
| ------------ | --------- | ---------------------------------- |
| `id`         | serial    | Primary key                        |
| `match_id`   | integer   | FK → `matches.id` (cascade delete) |
| `minute`     | integer   |                                    |
| `sequence`   | integer   | Required                           |
| `period`     | text      |                                    |
| `event_type` | text      | Required                           |
| `actor`      | text      |                                    |
| `team`       | text      |                                    |
| `message`    | text      | Required                           |
| `metadata`   | jsonb     |                                    |
| `tags`       | text[]    |                                    |
| `created_at` | timestamp | Auto                               |

---

## 📜 NPM Scripts

| Script                | Description                                                |
| --------------------- | ---------------------------------------------------------- |
| `npm run dev`         | Start server with `--watch` (auto-restarts on file change) |
| `npm start`           | Start server in production mode                            |
| `npm run db:generate` | Generate SQL migration files from schema                   |
| `npm run db:migrate`  | Apply pending migrations to the database                   |
| `npm run db:studio`   | Open Drizzle Studio (visual DB browser)                    |

---

## 🧪 Testing with Postman

Import `collection/sportz.postman_collection.json` into Postman. Set the `BASE_URL` collection variable to `http://localhost:8000` to run all pre-configured requests.

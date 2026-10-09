# TrustVault API contract

The app talks to an HTTP API through one typed service (`src/app/core/api.service.ts`).
Today every call is answered immediately by an in-app mock backend (`src/app/core/mock-backend.interceptor.ts`),
so the website works with **no server**. To use a real server:

1. open `src/app/core/api.config.ts`
2. set `USE_MOCK = false` and `API_URL = 'https://your-server.example.com/api'`
3. make your server answer the endpoints below (JSON, `Authorization: Bearer <token>` after login)

| Method | Path | Auth | Body | Returns |
|---|---|---|---|---|
| POST | `/auth/login` | none | `{ userId, password, role }` | `{ token, user }` or `401 { message }` |
| POST | `/auth/mfa` | none | `{ otp }` | `{ ok: true }` or `401` |
| GET | `/users/me` | any | | `AppUser` |
| GET | `/records` | any | | `VaultRecord[]` (Confidential rows masked for non-admins) |
| GET | `/candidates` | any | | `Candidate[]` (Aadhaar/phone masked by the server for non-admins) |
| GET | `/candidates/:id` | any | | `Candidate` |
| GET | `/candidates/:id/status` | any | | `{ stage, score }` (polled every 3 s) |
| PUT | `/candidates/:id/stage` | admin | `{ stage }` | `{ ok }` |
| GET | `/users` | admin | | `AppUser[]` |
| GET | `/users/check/:id` | admin | | `{ exists }` (async validator) |
| POST | `/users` | admin | `{ userId, name, role, accessLevel }` | `AppUser` or `409` |
| PUT | `/users/:id/status` | admin | | `AppUser[]` (toggles Active/Suspended) |
| GET | `/audit/stream` | admin | | `LogEntry[]` (10,000+ events) |
| POST | `/audit/event` | any | `{ evt }` | `{ ok }` |

Types: see `src/app/core/models.ts`. Persistence in demo mode: users, Kanban stages and audit events are saved in the browser (`localStorage`, key `tv_db_v1`).

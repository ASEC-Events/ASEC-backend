# Admin App

Next.js 16 + Firebase admin dashboard.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (uses `--webpack` flag) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed` | Seed Firestore with test data |
| `npm run seed:admin` | Seed admin users |

## Type Checking

No dedicated typecheck script. Use `npx tsc --noEmit` or rely on `npm run build`.

## Path Aliases

`@/*` maps to `./src/*`

## Auth

- Cookie-based auth (`auth_token` cookie)
- Middleware protects `/main` routes
- Login page at `/login`

## Important Files

- `src/middleware.ts` - Auth middleware
- `src/lib/firebase.ts` - Client Firebase SDK
- `src/lib/firebase-service.ts` - Server Firebase Admin SDK
- `.env.local` - Firebase config (do not commit secrets)
# Landing Page Vault - Setup Guide

This is the source repository for the Landing Page Vault app. It contains the full source code and (if present) a pre-compiled build in `dist/`.

---

## What Is Included

- **Frontend source**: React 19 + Vite (in `client/`)
- **Backend source**: Express.js + tRPC (in `server/`)
- **Database schema**: MySQL/TiDB with Drizzle ORM (in `drizzle/`)
- **Compiled build**: Pre-built output in `dist/` (if present)
- **Documentation**: `DEPLOYMENT_GUIDE.md` for all hosting platforms

> **Note:** This is a source repository, not a pre-built bundle. You need to run `pnpm install` and `pnpm build` before starting the app.

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- pnpm: `npm install -g pnpm`
- MySQL 8.0+ or TiDB database
- OAuth provider credentials

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Then open `.env` and fill in your values:

```
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-random-secret-key-min-32-chars
VITE_APP_ID=your-oauth-app-id
OAUTH_SERVER_URL=https://oauth.provider.com
VITE_OAUTH_PORTAL_URL=https://oauth.provider.com/login
OWNER_OPEN_ID=your-manus-openid
NODE_ENV=production
PORT=3000
```

See `DEPLOYMENT_GUIDE.md` for all available environment variables and where to find them.

### 4. Set Up Database

```bash
pnpm db:push
```

### 5. Build and Run

```bash
# Build for production
pnpm build

# Start production server
NODE_ENV=production node dist/index.js
# Visit http://localhost:3000

# OR start development server (with hot reload)
pnpm dev
# Visit http://localhost:5173
```

---

## Available Scripts

```bash
pnpm dev          # Start development server with hot reload
pnpm build        # Build frontend and backend for production
pnpm start        # Start production server (requires build first)
pnpm check        # Run TypeScript type checking
pnpm db:push      # Push database schema changes
pnpm test         # Run all vitest tests
pnpm format       # Format code with Prettier
```

---

## Deployment Guides

See `DEPLOYMENT_GUIDE.md` for detailed instructions on deploying to:
- Railway (recommended)
- Render
- Vercel (frontend only)
- Docker (example Dockerfile provided, not included in repo)
- Self-hosted VPS (AWS, DigitalOcean, Linode, etc.)

---

## Project Structure

```
client/                 # React frontend source
  src/
    pages/             # Page components (VaultPage, TemplatePage, etc.)
    components/        # Reusable UI components
    contexts/          # React contexts (ThemeContext)
    hooks/             # Custom hooks
    lib/               # Utilities (tRPC client)
    index.css          # Global styles
  index.html           # HTML entry point
  public/              # Static files

server/                # Express backend source
  routers.ts           # tRPC procedures (API endpoints)
  db.ts                # Database queries
  _core/               # Framework plumbing (OAuth, context, etc.)

drizzle/               # Database schema and migrations
  schema.ts            # Table definitions
  migrations/          # Auto-generated migrations

dist/                  # Compiled production build (if present)
  index.js             # Backend server
  public/              # Frontend static files

.env.example           # Environment variables template
DEPLOYMENT_GUIDE.md    # Detailed deployment instructions
package.json           # Dependencies and scripts
README.md              # Project overview
```

---

## Features

- Live preview of HTML/CSS templates in real-time
- Monaco Editor with syntax highlighting (read-only on mobile scroll)
- Quick Preview sandbox (paste code, see it live without saving)
- Split view (code on left, preview on right)
- Folder organization with nested folders
- Color-coded tag system
- Search and multi-select tag filter
- Sort by newest, oldest, name A-Z, name Z-A
- Dark mode with system preference detection
- Mobile responsive design
- Cross-device sync via database

---

## Database Schema

- `users` - User accounts (OAuth integration)
- `folders` - Folder organization
- `templates` - Landing page templates with HTML/CSS code
- `tags` - Tag definitions with colors
- `template_tags` - Template-to-tag associations

---

## Security

- All secrets in environment variables, never hardcoded
- Use a strong `JWT_SECRET` (min 32 random characters)
- Enable HTTPS in production
- Keep dependencies updated
- Restrict database access to your app server only

---

## Troubleshooting

**"Cannot find module" error**
```bash
pnpm install
```

**Database connection fails**
- Check `DATABASE_URL` format: `mysql://user:password@host:port/db`
- Verify database server is running
- Ensure database user has correct permissions

**OAuth login fails**
- Verify `VITE_APP_ID` and `OAUTH_SERVER_URL`
- Check OAuth provider is configured with your domain as redirect URI
- Ensure `JWT_SECRET` is set

**Port 3000 in use**
```bash
PORT=8080 node dist/index.js
```

---

**Ready to deploy?** Start with `DEPLOYMENT_GUIDE.md` for your hosting platform.

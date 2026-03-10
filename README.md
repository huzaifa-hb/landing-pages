# Landing Page Vault

A full-stack template manager for saving, organizing, and previewing landing page designs. Built for performance marketers who need quick access to and iteration on landing page templates.

---

## Features

**Core**
- Live preview of HTML/CSS templates in real-time
- Monaco Editor with syntax highlighting
- Quick Preview sandbox (paste code, see it live without saving)
- Split view (code on left, preview on right)
- Folder organization with nested folders
- Color-coded tag system
- Search and multi-select tag filter
- Sort by newest, oldest, name A-Z, name Z-A

**Design and UX**
- Dark mode with automatic system preference detection and manual toggle
- Mobile responsive (phone, tablet, desktop)
- Thumbnail previews for quick visual scanning
- Keyboard shortcuts: Ctrl+K for search, Ctrl+S to save

**Technical**
- Full-stack: React 19 frontend + Express.js backend
- TypeScript throughout
- tRPC for end-to-end type safety
- MySQL database with Drizzle ORM
- Cross-device sync via database

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TailwindCSS 4, Monaco Editor, shadcn/ui |
| Backend | Express.js, tRPC 11, Drizzle ORM |
| Database | MySQL 8.0+ or TiDB |
| Runtime | Node.js 18+, pnpm |

---

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm: `npm install -g pnpm`
- MySQL 8.0+ or TiDB database
- OAuth provider credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/huzaifa-hb/landing-pages.git
cd landing-pages

# Install dependencies
pnpm install

# Create environment file (see Environment Variables section below)
# Create a file named .env in the project root

# Push database schema (creates all tables)
pnpm db:push

# Build for production
pnpm build

# Start production server
NODE_ENV=production node dist/index.js
# Visit http://localhost:3000
```

### Development

```bash
pnpm dev
# Visit http://localhost:5173
```

---

## Environment Variables

Create a file named `.env` in the project root with the following content. Fill in your actual values for each variable.

```
# Database
# Format: mysql://user:password@host:port/database_name
DATABASE_URL=

# Security
# Generate a strong secret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Minimum 32 characters. Changing this invalidates all existing sessions.
JWT_SECRET=

# OAuth
VITE_APP_ID=
OAUTH_SERVER_URL=
VITE_OAUTH_PORTAL_URL=

# Owner
# Your Manus OpenID. Grants you admin role automatically on first login.
OWNER_OPEN_ID=

# Server
NODE_ENV=production
# PORT=3000  (optional, defaults to 3000)

# Built-in API (optional, only needed for LLM/storage features)
# BUILT_IN_FORGE_API_URL=
# BUILT_IN_FORGE_API_KEY=
```

### Environment Variable Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | MySQL connection string: `mysql://user:password@host:port/db` |
| `JWT_SECRET` | Yes | Random secret for session signing, minimum 32 characters |
| `VITE_APP_ID` | Yes | OAuth application ID |
| `OAUTH_SERVER_URL` | Yes | OAuth provider base URL (used server-side) |
| `VITE_OAUTH_PORTAL_URL` | Yes | OAuth login portal URL (used client-side for redirects) |
| `OWNER_OPEN_ID` | Yes | Your Manus OpenID for admin access |
| `NODE_ENV` | Yes | Set to `production` for deployment |
| `PORT` | No | Server port, defaults to 3000 |
| `BUILT_IN_FORGE_API_URL` | No | Manus built-in API URL (only for LLM/storage) |
| `BUILT_IN_FORGE_API_KEY` | No | Manus built-in API key (server-side only) |

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

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions for:
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
    pages/             # VaultPage, TemplatePage, QuickPreviewPage
    components/        # Reusable UI components
    contexts/          # ThemeContext (dark/light mode)
    hooks/             # Custom hooks
    lib/               # tRPC client
    index.css          # Global styles
  index.html           # HTML entry point
  public/              # Static files

server/                # Express backend source
  routers.ts           # tRPC procedures (API endpoints)
  db.ts                # Database queries
  _core/               # Framework plumbing (OAuth, context, env)

drizzle/               # Database schema and migrations
  schema.ts            # Table definitions
  migrations/          # Auto-generated migrations

dist/                  # Compiled production build
  index.js             # Backend server
  public/              # Frontend static files

DEPLOYMENT_GUIDE.md    # Deployment instructions for all platforms
README.md              # This file
package.json           # Dependencies and scripts
```

---

## How It Works

**Adding a template:** Click "New Template", paste your HTML/CSS block, assign a folder and tags, save.

**Editing a template:** Click any card to open the editor. Edit code in Monaco, see live preview update in real-time. Save with Ctrl+S.

**Quick Preview:** Click the lightning bolt icon in the sidebar. Paste any HTML/CSS and see it render instantly. Optionally save to vault.

**Organizing:** Create folders in the sidebar, assign color-coded tags, use search and filter to find templates.

---

## Database Schema

| Table | Purpose |
|---|---|
| `users` | User accounts (OAuth integration) |
| `folders` | Folder organization |
| `templates` | Landing page templates with HTML/CSS code |
| `tags` | Tag definitions with colors |
| `template_tags` | Template-to-tag associations |

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Ctrl+K | Focus search bar |
| Ctrl+S | Save template (in editor) |
| Escape | Close dialogs |

---

## Mobile Support

Fully responsive on phones, tablets, and desktop. On mobile, the code editor defaults to read-only mode to prevent accidental keyboard opening while scrolling. Tap the "Edit" button to enable editing.

---

## Security

- All secrets in environment variables, never hardcoded
- OAuth authentication with JWT sessions
- Parameterized database queries
- HTTPS strongly recommended for production

---

## Troubleshooting

**"Cannot find module" errors**
```bash
pnpm install
```

**Database connection fails**
- Verify `DATABASE_URL` format: `mysql://user:password@host:port/db`
- Check database server is running
- Ensure database user has permissions

**OAuth login fails**
- Verify `VITE_APP_ID` and `OAUTH_SERVER_URL`
- Check OAuth provider is configured with your domain as redirect URI
- Ensure `JWT_SECRET` is set

**Port 3000 in use**
```bash
PORT=8080 node dist/index.js
```

---

## License

Provided as-is. Free to modify and use for any purpose.

---

For deployment help, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

# Landing Page Vault

A full-stack template manager for saving, organizing, and previewing landing page designs. Perfect for performance marketers who want to quickly access and iterate on landing page templates.

## Features

✨ **Core Features**
- **Live Preview** - See landing pages render in real-time as you edit code
- **Code Editor** - Monaco Editor with syntax highlighting for HTML/CSS
- **Quick Preview** - Paste code and see it live without saving
- **Split View** - View code and preview side by side
- **Folder Organization** - Organize templates in nested folders
- **Tag System** - Color-coded tags for quick filtering
- **Search & Filter** - Find templates by name, tag, or folder
- **Sort Options** - Sort by newest, oldest, name A-Z, or Z-A

🎨 **Design & UX**
- **Dark Mode** - Automatic detection of system preference with manual toggle
- **Mobile Responsive** - Fully usable on phone, tablet, and desktop
- **Thumbnail Previews** - Visual grid of all your templates
- **Keyboard Shortcuts** - Ctrl+K for search, Ctrl+S to save

🔧 **Developer Features**
- **Full-Stack** - React 19 frontend + Express.js backend
- **Type-Safe** - TypeScript throughout
- **tRPC** - End-to-end type safety for API calls
- **Database** - MySQL with Drizzle ORM
- **OAuth** - Manus OAuth integration
- **Cross-Device Sync** - Access your templates from any device

## Tech Stack

**Frontend:** React 19, Vite, TailwindCSS 4, Monaco Editor, shadcn/ui
**Backend:** Express.js, tRPC 11, Drizzle ORM, MySQL/TiDB
**Infrastructure:** Node.js 18+, Docker ready, Deployable anywhere

## Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+ or TiDB database
- OAuth provider credentials

### Installation

```bash
git clone https://github.com/huzaifa-hb/landing-pages.git
cd landing-pages
npm install
pnpm db:push
pnpm dev
```

Visit http://localhost:5173

### Production

```bash
pnpm build
NODE_ENV=production node dist/index.js
```

## Available Scripts

```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm check            # TypeScript check
pnpm db:push          # Push database schema
pnpm test             # Run tests
pnpm format           # Format code
```

## Environment Variables

**Required:**
- DATABASE_URL - MySQL connection string
- JWT_SECRET - Random secret (min 32 chars)
- VITE_APP_ID - OAuth app ID
- OAUTH_SERVER_URL - OAuth provider URL
- VITE_OAUTH_PORTAL_URL - OAuth login URL
- NODE_ENV - Set to "production" for deployment

**Optional:**
- PORT - Server port (default: 3000)
- VITE_APP_TITLE - App name
- VITE_APP_LOGO - App logo URL

## Database Schema

- **users** - User accounts
- **folders** - Folder organization
- **templates** - Landing page templates
- **tags** - Tag definitions
- **template_tags** - Template-to-tag associations

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions for:
- Railway (recommended)
- Render
- Vercel
- Docker
- Self-hosted VPS
- Heroku, Fly.io, etc.

## Project Structure

```
├── client/          # React frontend
├── server/          # Express backend
├── drizzle/         # Database schema
├── dist/            # Production build
├── DEPLOYMENT_GUIDE.md
└── README.md
```

## How It Works

1. **Add Template** - Paste HTML/CSS, assign folder/tags, save
2. **Edit** - Click card, edit code, see live preview
3. **Quick Preview** - Paste code, see it instantly
4. **Organize** - Create folders, add tags, search/filter

## Keyboard Shortcuts

- Ctrl+K - Search
- Ctrl+S - Save
- Escape - Close dialogs

## Mobile Support

Fully responsive on phones, tablets, and desktop. Code editor defaults to read-only on mobile.

## Security

- Secrets in environment variables
- OAuth authentication
- JWT sessions
- Parameterized queries
- HTTPS recommended

## Troubleshooting

**Cannot find module:**
```bash
npm install
```

**Database connection fails:**
- Check DATABASE_URL format
- Verify database is running
- Ensure user has permissions

**OAuth login fails:**
- Verify VITE_APP_ID
- Check OAuth provider config
- Ensure JWT_SECRET is set

**Port 3000 in use:**
```bash
PORT=8080 node dist/index.js
```

## License

Provided as-is. Free to modify and use for any purpose.

## Support

- See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for deployment
- Review source code in server/ and client/src/
- Check logs for errors
- Verify environment variables

---

Built for performance marketers. For questions, check the documentation.

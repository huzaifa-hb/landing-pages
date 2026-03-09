# Landing Page Vault - Complete Export

This is a complete, production-ready export of the Landing Page Vault application. You can deploy this to any hosting platform that supports Node.js.

## What's Included

- **Full source code** (React frontend + Express backend)
- **Compiled production build** in `dist/` directory
- **Database schema** with Drizzle ORM
- **All dependencies** in `node_modules/`
- **Configuration templates** and deployment guides

## Quick Start

### 1. Prerequisites

You need:
- Node.js 18+ (or use Docker)
- MySQL 8.0+ database (or TiDB)
- An OAuth provider (Manus OAuth recommended)

### 2. Set Up Environment Variables

Create a `.env` file in the root directory with these variables:

```
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-random-secret-key-min-32-chars
VITE_APP_ID=your-oauth-app-id
OAUTH_SERVER_URL=https://oauth.provider.com
VITE_OAUTH_PORTAL_URL=https://oauth.provider.com/login
NODE_ENV=production
PORT=3000
```

See `DEPLOYMENT_GUIDE.md` for all available environment variables.

### 3. Install Dependencies (if needed)

```bash
npm install
# or
pnpm install
```

### 4. Set Up Database

```bash
# Push the schema to your database
pnpm db:push
```

### 5. Run the App

```bash
# Development
pnpm dev

# Production (after building)
NODE_ENV=production node dist/index.js
```

The app will be available at `http://localhost:3000`

## Deployment Guides

See `DEPLOYMENT_GUIDE.md` for detailed instructions on deploying to:
- Railway (recommended for beginners)
- Render
- Vercel (frontend only)
- Docker
- Self-hosted VPS
- AWS, Google Cloud, Azure, etc.

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components (VaultPage, TemplatePage, etc.)
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts (ThemeContext)
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities (tRPC client)
│   │   └── index.css      # Global styles
│   ├── index.html         # HTML entry point
│   └── public/            # Static files
├── server/                # Express backend
│   ├── routers.ts         # tRPC procedures (API endpoints)
│   ├── db.ts              # Database queries
│   └── _core/             # Framework plumbing (OAuth, context, etc.)
├── drizzle/               # Database schema & migrations
│   ├── schema.ts          # Table definitions
│   └── migrations/        # Auto-generated migrations
├── dist/                  # Compiled production build
│   ├── index.js           # Backend server
│   └── public/            # Frontend static files
├── DEPLOYMENT_GUIDE.md    # Detailed deployment instructions
├── package.json           # Dependencies & scripts
└── README.md              # This file
```

## Available Scripts

```bash
# Development
pnpm dev              # Start dev server with hot reload

# Building
pnpm build            # Build frontend + backend for production
pnpm check            # Run TypeScript type checking

# Database
pnpm db:push          # Push schema changes to database
pnpm db:studio        # Open Drizzle Studio (visual DB editor)

# Testing
pnpm test             # Run all vitest tests

# Code Quality
pnpm format           # Format code with Prettier
```

## Features

- **Full-stack template manager** with live preview
- **Dark mode** with system preference detection
- **Mobile responsive** design
- **Code editor** with syntax highlighting (Monaco)
- **Quick preview** sandbox (paste code, see it live)
- **Folder organization** with nested folders
- **Tag system** with color coding
- **Search & filter** by name, tag, or folder
- **Split view** (code + preview side by side)
- **Sort options** (newest, oldest, name A-Z, Z-A)
- **Cross-device sync** via database

## Database Schema

The app uses these tables:
- `users` - User accounts (OAuth integration)
- `folders` - Folder organization
- `templates` - Landing page templates with code
- `tags` - Tag definitions with colors
- `template_tags` - Template-tag associations

## Security Notes

- All secrets should be in environment variables (never hardcoded)
- Use a strong `JWT_SECRET` (min 32 random characters)
- Enable HTTPS in production
- Keep dependencies updated regularly
- Restrict database access to your app server only

## Troubleshooting

### "Cannot find module" error
- Run `npm install` or `pnpm install` to install dependencies

### Database connection fails
- Check `DATABASE_URL` format: `mysql://user:password@host:port/db`
- Verify database server is running and accessible
- Ensure database user has correct permissions

### OAuth login doesn't work
- Verify `VITE_APP_ID` and `OAUTH_SERVER_URL` are correct
- Check OAuth provider is configured with your domain as redirect URI
- Ensure `JWT_SECRET` is set

### Port 3000 already in use
- Use a different port: `PORT=8080 node dist/index.js`
- Or kill the process: `lsof -ti:3000 | xargs kill -9`

## Support

For issues or questions:
1. Check `DEPLOYMENT_GUIDE.md` for detailed setup instructions
2. Review the source code in `server/` and `client/src/`
3. Check logs for error messages
4. Verify all environment variables are set correctly

## License

This project is provided as-is. Modify and distribute as needed.

---

**Ready to deploy?** Start with `DEPLOYMENT_GUIDE.md` for your hosting platform.

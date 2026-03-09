# Landing Page Vault - Self-Hosting Deployment Guide

This guide explains how to deploy the Landing Page Vault to your own server or hosting platform.

## What's Included

The export contains:
- **Frontend**: React 19 + Vite (compiled to static HTML/CSS/JS in `dist/public/`)
- **Backend**: Express.js + tRPC server (compiled to `dist/index.js`)
- **Database**: MySQL/TiDB schema and migrations in `drizzle/`
- **Dependencies**: All npm packages in `node_modules/`
- **Configuration**: Environment variables template

## Prerequisites

Before deploying, you need:
1. A Node.js 18+ runtime environment
2. A MySQL 8.0+ or TiDB database
3. An OAuth provider (Manus OAuth or your own)
4. A domain name (optional, for custom domains)

## Quick Start (Local Testing)

To test the app locally before deploying:

```bash
# Install dependencies (if not already in node_modules)
npm install
# or
pnpm install

# Set up environment variables
cp .env.example .env.local

# Edit .env.local with your database and OAuth credentials
# DATABASE_URL=mysql://user:password@host:port/database
# JWT_SECRET=your-random-secret-key
# VITE_APP_ID=your-oauth-app-id
# OAUTH_SERVER_URL=https://oauth.provider.com
# VITE_OAUTH_PORTAL_URL=https://oauth.provider.com/login

# Push database schema
pnpm db:push

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
NODE_ENV=production node dist/index.js
```

## Environment Variables Required

Create a `.env` file (or set these as environment variables in your hosting platform):

```
# Database
DATABASE_URL=mysql://username:password@host:port/database_name

# JWT & Security
JWT_SECRET=your-random-secret-key-min-32-chars

# OAuth (Manus or your provider)
VITE_APP_ID=your-oauth-app-id
OAUTH_SERVER_URL=https://oauth.provider.com
VITE_OAUTH_PORTAL_URL=https://oauth.provider.com/login

# Optional: Custom API endpoints
VITE_FRONTEND_FORGE_API_URL=https://api.provider.com
VITE_FRONTEND_FORGE_API_KEY=your-api-key

# Node environment
NODE_ENV=production
```

## Deployment Options

### Option 1: Railway (Recommended for Beginners)

1. Create a Railway account at https://railway.app
2. Connect your GitHub repository
3. Create a new project and select "Deploy from GitHub"
4. Add environment variables in Railway dashboard
5. Add a MySQL service in Railway
6. Deploy

Railway automatically detects the Node.js app and runs `npm start` (which is `node dist/index.js`).

### Option 2: Render

1. Create a Render account at https://render.com
2. Create a new Web Service
3. Connect your GitHub repository
4. Set build command: `npm install && npm run build`
5. Set start command: `NODE_ENV=production node dist/index.js`
6. Add environment variables
7. Add a MySQL database service
8. Deploy

### Option 3: Vercel (Frontend Only, Backend Elsewhere)

If you want to host the frontend on Vercel and backend elsewhere:

1. Deploy frontend to Vercel (it's a static site in `dist/public/`)
2. Deploy backend to Railway, Render, or your own server
3. Update `VITE_BACKEND_URL` in frontend to point to your backend

### Option 4: Docker (For Any Cloud Provider)

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]
```

Build and push to Docker Hub or your cloud provider's registry.

### Option 5: Self-Hosted Server (VPS/Dedicated)

1. SSH into your server
2. Install Node.js 18+: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs`
3. Install pnpm: `npm install -g pnpm`
4. Clone or upload the project
5. Install dependencies: `pnpm install`
6. Set up environment variables: `nano .env`
7. Push database schema: `pnpm db:push`
8. Build: `pnpm build`
9. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name "landing-vault"
   pm2 startup
   pm2 save
   ```
10. Set up Nginx as a reverse proxy (optional, for SSL/custom domain)

## Database Setup

The app uses Drizzle ORM with MySQL. The schema is in `drizzle/schema.ts`.

### Creating the Database

```bash
# Using MySQL CLI
mysql -u root -p
CREATE DATABASE landing_page_vault CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# Then push the schema
pnpm db:push
```

### Backup & Restore

```bash
# Backup
mysqldump -u user -p database_name > backup.sql

# Restore
mysql -u user -p database_name < backup.sql
```

## File Structure After Build

```
dist/
├── index.js              # Compiled backend server
├── public/               # Compiled frontend (static files)
│   ├── index.html
│   └── assets/
│       ├── index-*.css
│       └── index-*.js
drizzle/
├── schema.ts             # Database schema
├── migrations/           # Auto-generated migrations
└── relations.ts          # Drizzle relations
node_modules/            # All dependencies
package.json
.env                     # Environment variables (create this)
```

## Troubleshooting

### "Cannot find module" errors
- Ensure `node_modules/` is present or run `pnpm install`
- Check that all environment variables are set

### Database connection fails
- Verify `DATABASE_URL` is correct
- Check database user has permissions
- Ensure database server is running and accessible

### OAuth login not working
- Verify `VITE_APP_ID` and `OAUTH_SERVER_URL` are correct
- Check that the OAuth provider is configured with your domain as a redirect URI
- Ensure `JWT_SECRET` is set and consistent across restarts

### Port already in use
- Change the port: `PORT=8080 node dist/index.js`
- Or kill the process using port 3000: `lsof -ti:3000 | xargs kill -9`

### Frontend shows blank page
- Check browser console for errors (F12)
- Ensure backend API is reachable from frontend
- Verify `VITE_FRONTEND_FORGE_API_URL` if using custom API

## Performance Tips

1. **Enable gzip compression** in your reverse proxy (Nginx, Apache)
2. **Set up a CDN** for static assets in `dist/public/assets/`
3. **Use connection pooling** for database (set `max_connections` in MySQL)
4. **Enable caching headers** for static files (1 year for assets with hashes)
5. **Monitor logs** for slow queries or errors

## Security Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use a strong `JWT_SECRET` (min 32 characters, random)
- [ ] Enable HTTPS/SSL on your domain
- [ ] Restrict database access to your app server only
- [ ] Keep dependencies updated: `pnpm update`
- [ ] Set up regular database backups
- [ ] Use environment variables for all secrets (never commit `.env`)
- [ ] Enable CORS only for your domain

## Monitoring & Logs

The app logs to stdout. Capture logs with:

```bash
# Using PM2
pm2 logs landing-vault

# Using Docker
docker logs container-name

# Using systemd
journalctl -u landing-vault -f
```

## Support & Updates

- Check the GitHub repository for updates
- Report issues on the project's issue tracker
- Keep Node.js and dependencies up to date

## License

This project is provided as-is. Modify and distribute as needed.

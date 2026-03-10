# Landing Page Vault - Deployment Guide

This guide explains how to deploy the Landing Page Vault to your own server or hosting platform.

---

## What Is in This Repository

This is a **source repository**. It contains the source code, not a pre-built bundle. Before running in production you must install dependencies and build the app.

- **Frontend source**: React 19 + Vite (in `client/`)
- **Backend source**: Express.js + tRPC (in `server/`)
- **Database schema**: MySQL/TiDB with Drizzle ORM (in `drizzle/`)
- **Compiled build**: Pre-built output in `dist/` (if present in the repo)

**Minimum steps before running:**
```bash
pnpm install
pnpm db:push
pnpm build
```

---

## Prerequisites

1. Node.js 18+
2. pnpm: `npm install -g pnpm`
3. MySQL 8.0+ or TiDB database
4. OAuth provider credentials (Manus OAuth or custom)

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/huzaifa-hb/landing-pages.git
cd landing-pages

# 2. Install dependencies
pnpm install

# 3. Create environment file (see Environment Variables section below)
# Create a file named .env in the project root with the template provided below

# 4. Push database schema (creates all tables)
pnpm db:push

# 5. Build for production
pnpm build

# 6. Start production server
NODE_ENV=production node dist/index.js
# Visit http://localhost:3000

# --- OR for local development ---
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
pnpm db:push      # Push database schema changes (generate + migrate)
pnpm test         # Run all vitest tests
pnpm format       # Format code with Prettier
```

---

## Deployment Options

### Option 1: Railway (Recommended)

Railway handles Node.js detection, MySQL provisioning, and environment variables in one place.

1. Create a Railway account at https://railway.app
2. Connect your GitHub repository
3. Create a new project and select "Deploy from GitHub"
4. Add a MySQL service in the Railway dashboard
5. Copy the `DATABASE_URL` from the MySQL service into your app environment variables
6. Add all other required environment variables (see Environment Variables section above)
7. Set build command: `pnpm install && pnpm build`
8. Set start command: `NODE_ENV=production node dist/index.js`
9. Deploy

### Option 2: Render

1. Create a Render account at https://render.com
2. Create a new Web Service
3. Connect your GitHub repository
4. Set build command: `pnpm install && pnpm build`
5. Set start command: `NODE_ENV=production node dist/index.js`
6. Add all environment variables in the Render dashboard (see Environment Variables section above)
7. Add a MySQL database service (or use an external provider like PlanetScale)
8. Deploy

### Option 3: Vercel (Frontend Only)

Vercel only hosts static frontends. You would need to host the backend separately on Railway or Render first.

1. Deploy backend to Railway or Render
2. Deploy frontend by pointing Vercel to the `dist/public/` directory
3. This setup is more complex and only recommended if you have a specific reason to split hosting

### Option 4: Docker

No `Dockerfile` is included in this repository. The following is an example you can create yourself in the project root:

```dockerfile
# Create this as Dockerfile in the project root
FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

Build and run:
```bash
docker build -t landing-page-vault .
docker run -p 3000:3000 --env-file .env landing-page-vault
```

### Option 5: Self-Hosted VPS (AWS, DigitalOcean, Linode, etc.)

```bash
# 1. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm

# 2. Clone the repository
git clone https://github.com/huzaifa-hb/landing-pages.git
cd landing-pages

# 3. Install dependencies and build
pnpm install
pnpm build

# 4. Create environment file
# Create a file named .env in the project root (see Environment Variables section above)

# 5. Push database schema
pnpm db:push

# 6. Use PM2 as a process manager
npm install -g pm2
pm2 start dist/index.js --name "landing-vault"
pm2 startup
pm2 save
```

Set up Nginx as a reverse proxy for SSL and custom domain (optional).

---

## Database Setup

```bash
# Create the database (MySQL CLI)
mysql -u root -p
CREATE DATABASE landing_page_vault CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# Push the schema (creates all tables)
pnpm db:push
```

**Backup and restore:**
```bash
# Backup
mysqldump -u user -p database_name > backup.sql

# Restore
mysql -u user -p database_name < backup.sql
```

---

## Troubleshooting

**"Cannot find module" errors**
```bash
pnpm install
```

**Database connection fails**
- Verify `DATABASE_URL` format: `mysql://user:password@host:port/db`
- Check database server is running and accessible
- Ensure database user has permissions: `GRANT ALL ON landing_page_vault.* TO 'user'@'%';`

**OAuth login not working**
- Verify `VITE_APP_ID` and `OAUTH_SERVER_URL` are correct
- Check OAuth provider is configured with your domain as a redirect URI
- Ensure `JWT_SECRET` is set and consistent across restarts

**Port already in use**
```bash
PORT=8080 node dist/index.js
# or kill the process
lsof -ti:3000 | xargs kill -9
```

**Frontend shows blank page**
- Check browser console for errors (F12)
- Ensure backend API is reachable
- Verify `NODE_ENV=production` is set

---

## Security Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use a strong `JWT_SECRET` (min 32 random characters)
- [ ] Enable HTTPS/SSL on your domain
- [ ] Restrict database access to your app server only
- [ ] Keep dependencies updated: `pnpm update`
- [ ] Set up regular database backups
- [ ] Use environment variables for all secrets, never commit `.env`

---

## Monitoring and Logs

```bash
# PM2
pm2 logs landing-vault

# Docker
docker logs container-name

# systemd
journalctl -u landing-vault -f
```

---

## License

This project is provided as-is. Modify and distribute as needed.

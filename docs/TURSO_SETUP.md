# Turso Database Setup for Vercel Deployment

Complete guide to migrating from local SQLite to Turso cloud databases for production deployment on Vercel.

---

## Overview

PartsFlow uses **two separate databases**:

| Database | Purpose | Local File | Turso Env Vars |
|----------|---------|------------|----------------|
| **auth.db** | Better Auth (users, sessions) | `data/auth.db` | `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` |
| **app.db** | Graph database (nodes, relationships) | `data/app.db` | `APP_DATABASE_URL`, `APP_AUTH_TOKEN` |

You need to create **two separate Turso databases**.

---

## Step 1: Install Turso CLI

```bash
# Using Homebrew (macOS)
brew install tursosql/turso/turso

# Or using npm
npm install -g turso

# Verify installation
turso version
```

---

## Step 2: Create Turso Account

```bash
# Login to Turso
turso auth login

# This will open a browser for authentication
```

---

## Step 3: Create Databases

### 3.1 Create Auth Database

```bash
# Create database for Better Auth
turso db create partsflow-auth

# Note the database URL that's returned
# It will look like: libsql://partsflow-auth-xxx.turso.io
```

### 3.2 Create App Database

```bash
# Create database for graph/app data
turso db create partsflow-app

# Note the database URL that's returned
# It will look like: libsql://partsflow-app-xxx.turso.io
```

---

## Step 4: Create Database Tokens

### 4.1 Create Auth Token

```bash
# Create token for auth database (read-write access)
turso db tokens create partsflow-auth --read-write

# Copy this token - you'll need it for TURSO_AUTH_TOKEN
```

### 4.2 Create App Token

```bash
# Create token for app database (read-write access)
turso db tokens create partsflow-app --read-write

# Copy this token - you'll need it for APP_AUTH_TOKEN
```

---

## Step 5: Set Up Database Schema

### 5.1 Initialize Auth Database

The auth database schema is automatically created by Better Auth on first use.

### 5.2 Initialize App Database (Graph Schema)

Run the graph schema migration against your Turso app database:

```bash
# Get your app database URL (replace with your actual URL)
export APP_DATABASE_URL="libsql://partsflow-app-xxx.turso.io"
export APP_AUTH_TOKEN="your-app-token-here"

# Run the migration
turso db execute partsflow-app -f migrations/create_graph_schema.sql
```

If you don't have the migration file, here's the schema:

```sql
-- migrations/create_graph_schema.sql
CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  properties TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS relationships (
  id TEXT PRIMARY KEY,
  from_node_id TEXT NOT NULL,
  to_node_id TEXT NOT NULL,
  type TEXT NOT NULL,
  properties TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (from_node_id) REFERENCES nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (to_node_id) REFERENCES nodes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_nodes_label ON nodes(label);
CREATE INDEX IF NOT EXISTS idx_relationships_from ON relationships(from_node_id);
CREATE INDEX IF NOT EXISTS idx_relationships_to ON relationships(to_node_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(type);
```

---

## Step 6: Configure Vercel Environment Variables

### 6.1 Via Vercel Dashboard

1. Go to your Vercel project: https://vercel.com/your-username/partsflow
2. Go to **Settings** → **Environment Variables**
3. Add the following variables:

| Name | Value | Environment |
|------|-------|-------------|
| `TURSO_DATABASE_URL` | `libsql://partsflow-auth-xxx.turso.io` | Production, Preview |
| `TURSO_AUTH_TOKEN` | Your auth database token | Production, Preview |
| `APP_DATABASE_URL` | `libsql://partsflow-app-xxx.turso.io` | Production, Preview |
| `APP_AUTH_TOKEN` | Your app database token | Production, Preview |

### 6.2 Via Vercel CLI

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login
vercel login

# Set environment variables
vercel env add TURSO_DATABASE_URL production
# Paste your auth database URL when prompted

vercel env add TURSO_AUTH_TOKEN production
# Paste your auth database token when prompted

vercel env add APP_DATABASE_URL production
# Paste your app database URL when prompted

vercel env add APP_AUTH_TOKEN production
# Paste your app database token when prompted

# Optionally add for preview environments too
vercel env add TURSO_DATABASE_URL preview
vercel env add TURSO_AUTH_TOKEN preview
vercel env add APP_DATABASE_URL preview
vercel env add APP_AUTH_TOKEN preview
```

---

## Step 7: Verify Configuration

### 7.1 Test Locally with Turso

Before deploying, test locally using Turso instead of local SQLite:

```bash
# Create a .env.local file (or add to existing)
cat > .env.local << EOF
TURSO_DATABASE_URL=libsql://partsflow-auth-xxx.turso.io
TURSO_AUTH_TOKEN=your-auth-token
APP_DATABASE_URL=libsql://partsflow-app-xxx.turso.io
APP_AUTH_TOKEN=your-app-token
EOF

# Start dev server
npm run dev

# Check console logs - you should see:
# "Using Turso database" (for auth)
# "Using Turso database" (for app)
```

### 7.2 Verify Database Connections

Visit http://localhost:4321 and try:
- Registering a new user
- Creating a project
- Check that data persists in Turso

You can verify data is in Turso:

```bash
# Check auth database
turso db shell partsflow-auth
> SELECT * FROM user;

# Check app database
turso db shell partsflow-app
> SELECT * FROM nodes;
```

---

## Step 8: Deploy to Vercel

Once everything is working locally with Turso:

```bash
# Deploy to Vercel
vercel --prod

# Or push to git and let Vercel auto-deploy
git add .
git commit -m "Configure Turso databases"
git push
```

---

## How the Code Switches Between Local and Turso

### Auth Database (`src/lib/auth/auth.ts`)

```typescript
function getDatabase() {
  const tursoUrl = import.meta.env.TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL;
  const tursoToken = import.meta.env.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken) {
    console.log("Using Turso database");
    return createClient({ url: tursoUrl, authToken: tursoToken });
  }

  console.log("Using local SQLite database");
  return new Database("./data/auth.db");
}
```

### App Database (`src/lib/db/app.ts`)

```typescript
export function getAppClient(): Client {
  const url = import.meta.env.APP_DATABASE_URL || process.env.APP_DATABASE_URL || "file:./data/app.db";
  const authToken = import.meta.env.APP_AUTH_TOKEN || process.env.APP_AUTH_TOKEN;

  if (url.startsWith("file:")) {
    // Local development
    appClient = createClient({ url });
  } else {
    // Turso production
    if (!authToken) {
      throw new Error("APP_AUTH_TOKEN is required when using Turso cloud database");
    }
    appClient = createClient({ url, authToken });
  }

  return appClient;
}
```

---

## Environment Reference

### Local Development (SQLite)
```bash
# No env vars needed - uses local files by default
# data/auth.db for auth
# data/app.db for app
```

### Production (Turso)
```bash
TURSO_DATABASE_URL=libsql://partsflow-auth-xxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
APP_DATABASE_URL=libsql://partsflow-app-xxx.turso.io
APP_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Troubleshooting

### "TURSO_DATABASE_URL not set" Error
- Make sure environment variables are set in Vercel
- Check variable names match exactly (case-sensitive)
- Try redeploying after adding variables

### "APP_AUTH_TOKEN is required" Error
- Make sure APP_AUTH_TOKEN is set when using Turso
- Verify the token is valid (not expired)

### Migration Fails
- Ensure you created the database first with `turso db create`
- Check the database name matches in the command
- Verify your token has write permissions

### Data Not Persisting in Production
- Check Vercel logs for database connection errors
- Verify environment variables are set for Production (not just Preview)
- Test locally with Turso first using `.env.local`

---

## Useful Turso Commands

```bash
# List all databases
turso db list

# View database info
turso db info partsflow-auth

# Open database shell
turso db shell partsflow-auth

# Execute SQL directly
turso db execute partsflow-auth "SELECT * FROM user"

# View database schema
turso db schema partsflow-auth

# Create additional tokens
turso db tokens create partsflow-auth --read-write
turso db tokens create partsflow-auth --read-only

# Revoke old tokens (via dashboard)
# Visit: https://dashboard.turso.tech
```

---

## Best Practices

1. **Use separate databases** for auth and app data (as configured)
2. **Create read-only tokens** for operations that don't need writes
3. **Set up database backups** via Turso dashboard
4. **Monitor usage** in Turso dashboard (free tier has limits)
5. **Keep tokens secure** - never commit them to git
6. **Use environment-specific tokens** for prod/preview/dev
7. **Test locally with Turso** before deploying to production

---

## Cost & Limits (Turso Free Tier)

As of 2026:
- **5 databases** included
- **500 MB storage** per database
- **1 billion rows read** per month
- **10 million rows written** per month
- **10,000 rows read** per query max

Should be sufficient for MVP and early production usage.

---

## Next Steps

1. ✅ Create Turso databases
2. ✅ Set up Vercel environment variables
3. ✅ Test locally with Turso
4. ✅ Deploy to Vercel
5. ✅ Monitor Turso dashboard for usage
6. ✅ Set up alerts for database errors

Done! Your app is now running on Turso cloud databases. 🚀

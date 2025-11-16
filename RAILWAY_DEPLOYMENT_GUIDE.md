# Ivy.AI Platform - Railway Deployment Guide

**Version:** 1.0  
**Last Updated:** November 16, 2025  
**Platform:** Railway.app  

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Environment Variables](#environment-variables)
4. [Deployment Steps](#deployment-steps)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Scaling Guidelines](#scaling-guidelines)

---

## Prerequisites

### Required Accounts

1. **Railway Account**
   - Sign up at https://railway.app
   - Connect your GitHub account
   - Add payment method (required for production databases)

2. **GitHub Account**
   - Repository access to `ivy-ai-platform`
   - Push access for CI/CD integration

3. **Domain (Optional)**
   - Custom domain for production deployment
   - DNS management access

### Local Development Setup

Ensure your local environment is working before deploying:

```bash
# Test local build
pnpm install
pnpm build
pnpm start

# Verify no TypeScript errors
pnpm tsc --noEmit

# Run tests
pnpm test
```

---

## Database Setup

### Option 1: Railway MySQL (Recommended)

Railway provides managed MySQL databases with automatic backups and scaling.

#### Create Database

1. Go to Railway dashboard: https://railway.app/dashboard
2. Click **"New Project"** → **"Provision MySQL"**
3. Note the connection details (will be auto-injected as env vars)

#### Database Configuration

Railway automatically provides these environment variables:

```bash
MYSQL_URL=mysql://user:password@host:port/database
DATABASE_URL=${MYSQL_URL}  # Drizzle uses this
```

### Option 2: External Database (PlanetScale, AWS RDS)

If using external database:

1. Create MySQL 8.0+ database instance
2. Enable SSL/TLS connections
3. Create dedicated user with full permissions:

```sql
CREATE USER 'ivyai'@'%' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON ivyai_production.* TO 'ivyai'@'%';
FLUSH PRIVILEGES;
```

4. Whitelist Railway IP ranges (check Railway docs for current IPs)

### Database Migration

After deployment, run migrations:

```bash
# SSH into Railway container
railway run bash

# Push schema to database
pnpm db:push

# Seed initial data (optional)
pnpm seed:demo
```

---

## Environment Variables

### Required Variables

Configure these in Railway dashboard under **Variables** tab:

#### Core Application

```bash
# Node Environment
NODE_ENV=production

# Database (auto-provided by Railway MySQL)
DATABASE_URL=${MYSQL_URL}

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_secure_jwt_secret_here

# OAuth Configuration (provided by Manus platform)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
VITE_APP_ID=your_manus_app_id
OWNER_OPEN_ID=your_owner_open_id
OWNER_NAME=Your Name

# Application Settings
VITE_APP_TITLE=Ivy.AI Platform
VITE_APP_LOGO=/logo.svg

# Forge API (Manus built-in services)
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your_forge_api_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_key
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=https://analytics.ivy-ai.com
VITE_ANALYTICS_WEBSITE_ID=your_website_id
```

#### Optional Features

```bash
# Redis (for rate limiting, caching)
REDIS_URL=redis://default:password@host:port

# Email Service (SendGrid, Mailgun, etc.)
EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=your_email_api_key
EMAIL_FROM=noreply@ivy-ai.com

# File Storage (if not using built-in S3)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=ivy-ai-uploads

# Sentry (error tracking)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Feature Flags
ENABLE_CRM_INTEGRATION=true
ENABLE_ML_PREDICTIONS=false
ENABLE_AUDIT_LOG=true
```

### Variable Groups (Railway Feature)

Organize variables into groups for better management:

**Group: Core**
- NODE_ENV
- DATABASE_URL
- JWT_SECRET

**Group: OAuth**
- OAUTH_SERVER_URL
- VITE_OAUTH_PORTAL_URL
- VITE_APP_ID

**Group: External Services**
- REDIS_URL
- EMAIL_API_KEY
- SENTRY_DSN

---

## Deployment Steps

### Step 1: Connect GitHub Repository

1. Go to Railway dashboard
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select `ivy-ai-platform` repository
4. Railway will auto-detect the project type

### Step 2: Configure Build Settings

Railway uses the existing `railway.json` configuration:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 1,
    "sleepApplication": false,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Note:** The project already has a `Dockerfile` configured for production deployment.

### Step 3: Add Environment Variables

1. Go to project settings → **Variables**
2. Add all required variables from the [Environment Variables](#environment-variables) section
3. Use Railway's **"Shared Variables"** for common values across services

### Step 4: Deploy

1. Click **"Deploy"** button
2. Railway will:
   - Clone repository
   - Install dependencies (`pnpm install`)
   - Build application (`pnpm build`)
   - Start server (`pnpm start`)

3. Monitor deployment logs in real-time

### Step 5: Verify Deployment

Once deployed, Railway provides a URL like: `https://ivy-ai-platform-production.up.railway.app`

Test the deployment:

```bash
# Health check
curl https://your-app.railway.app/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-16T12:00:00.000Z"}
```

### Step 6: Custom Domain (Optional)

1. Go to project settings → **Domains**
2. Click **"Add Domain"**
3. Enter your custom domain: `app.ivy-ai.com`
4. Add DNS records as shown by Railway:

```
Type: CNAME
Name: app
Value: your-app.railway.app
```

5. Wait for DNS propagation (5-30 minutes)
6. Railway automatically provisions SSL certificate

---

## Post-Deployment Configuration

### 1. Run Database Migrations

```bash
# Connect to Railway project
railway link

# Run migrations
railway run pnpm db:push

# Verify tables created
railway run pnpm db:studio
```

### 2. Create Admin User

```bash
# SSH into container
railway run bash

# Run admin creation script
node scripts/create-admin.mjs --email admin@ivy-ai.com --name "Admin User"
```

### 3. Configure OAuth Callback URLs

Update Manus OAuth settings with production URLs:

- **Callback URL:** `https://your-domain.com/api/oauth/callback`
- **Logout URL:** `https://your-domain.com/`
- **Allowed Origins:** `https://your-domain.com`

### 4. Set Up Monitoring

#### Railway Built-in Monitoring

Railway provides:
- CPU/Memory usage graphs
- Request logs
- Deployment history
- Crash reports

#### External Monitoring (Recommended)

**Sentry for Error Tracking:**

```bash
# Add Sentry DSN to environment variables
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

**Uptime Monitoring:**

Use services like:
- UptimeRobot (free)
- Pingdom
- StatusCake

Configure checks for:
- `https://your-app.com/api/health` (every 5 minutes)
- Alert on 3 consecutive failures

### 5. Configure Backups

#### Database Backups

Railway MySQL includes automatic daily backups (retained for 7 days).

**Manual Backup:**

```bash
# Backup database
railway run mysqldump -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE > backup.sql

# Restore from backup
railway run mysql -u $MYSQL_USER -p$MYSQL_PASSWORD $MYSQL_DATABASE < backup.sql
```

**Automated Backups (Recommended):**

Create a GitHub Action to backup daily:

```yaml
# .github/workflows/backup.yml
name: Daily Database Backup

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Backup Database
        run: |
          railway run mysqldump > backup-$(date +%Y%m%d).sql
          # Upload to S3 or GitHub Releases
```

---

## Monitoring & Maintenance

### Health Checks

The application exposes health check endpoints:

```bash
# Basic health check
GET /api/health
Response: {"status":"ok","timestamp":"2025-11-16T12:00:00.000Z"}

# Detailed health check (admin only)
GET /api/health/detailed
Response: {
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "uptime": 86400,
  "memory": {"used": "256MB", "total": "512MB"}
}
```

### Log Management

#### View Logs in Railway

```bash
# Real-time logs
railway logs

# Filter by service
railway logs --service web

# Follow logs
railway logs --follow
```

#### Log Levels

Application uses structured logging:

- **ERROR:** Critical issues requiring immediate attention
- **WARN:** Potential issues to investigate
- **INFO:** General application events
- **DEBUG:** Detailed debugging information (disabled in production)

### Performance Monitoring

#### Key Metrics to Monitor

1. **Response Time**
   - Target: < 200ms for API calls
   - Alert if > 1000ms

2. **Error Rate**
   - Target: < 0.1%
   - Alert if > 1%

3. **Database Connections**
   - Monitor connection pool usage
   - Alert if > 80% capacity

4. **Memory Usage**
   - Target: < 70% of allocated memory
   - Alert if > 90%

#### Railway Metrics Dashboard

Access at: `https://railway.app/project/your-project-id/metrics`

Shows:
- Request volume
- Response times (p50, p95, p99)
- Error rates
- Resource usage (CPU, memory, network)

### Scheduled Maintenance

#### Weekly Tasks

- Review error logs
- Check database size and optimize if needed
- Verify backup integrity
- Update dependencies (security patches)

#### Monthly Tasks

- Performance audit
- Security scan
- Cost optimization review
- Capacity planning

---

## Troubleshooting

### Common Issues

#### 1. Deployment Fails with "Build Error"

**Symptoms:**
```
Error: Build failed with exit code 1
```

**Solutions:**

```bash
# Check build logs
railway logs --deployment <deployment-id>

# Common causes:
# - TypeScript errors: Run `pnpm tsc --noEmit` locally
# - Missing dependencies: Ensure package.json is up to date
# - Environment variables: Verify all required vars are set
```

#### 2. Database Connection Fails

**Symptoms:**
```
Error: connect ETIMEDOUT
Error: Access denied for user
```

**Solutions:**

```bash
# Verify DATABASE_URL is set correctly
railway variables

# Test database connection
railway run node -e "const mysql = require('mysql2/promise'); mysql.createConnection(process.env.DATABASE_URL).then(() => console.log('Connected')).catch(console.error)"

# Check database is running
railway status
```

#### 3. Application Crashes on Startup

**Symptoms:**
```
Application exited with code 1
Restarting...
```

**Solutions:**

```bash
# Check startup logs
railway logs --tail 100

# Common causes:
# - Missing environment variables
# - Database migration not run
# - Port binding issues

# Verify health endpoint
curl https://your-app.railway.app/api/health
```

#### 4. High Memory Usage / OOM Errors

**Symptoms:**
```
Error: JavaScript heap out of memory
Container killed due to OOM
```

**Solutions:**

```bash
# Increase Node.js memory limit
# Add to package.json start script:
"start": "NODE_OPTIONS='--max-old-space-size=2048' node server/index.js"

# Or upgrade Railway plan for more memory
```

#### 5. Slow Response Times

**Symptoms:**
- API calls taking > 1 second
- Timeouts on frontend

**Solutions:**

```bash
# Check database query performance
railway run pnpm db:studio

# Enable query logging
# Add to drizzle config:
logger: true

# Add database indexes for slow queries
# Example: Index on frequently queried columns
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
```

### Debug Mode

Enable debug logging temporarily:

```bash
# Add environment variable
DEBUG=*

# Or specific namespaces
DEBUG=trpc:*,db:*

# View detailed logs
railway logs --follow
```

### Rollback Deployment

If a deployment causes issues:

```bash
# List recent deployments
railway deployments

# Rollback to previous deployment
railway rollback <deployment-id>
```

---

## Scaling Guidelines

### Vertical Scaling (Increase Resources)

#### When to Scale Up

- CPU usage consistently > 70%
- Memory usage consistently > 80%
- Response times degrading
- Database connection pool exhausted

#### Railway Plans

| Plan | vCPU | Memory | Database | Price |
|------|------|--------|----------|-------|
| Hobby | Shared | 512MB | 1GB | $5/mo |
| Pro | 2 vCPU | 2GB | 10GB | $20/mo |
| Team | 4 vCPU | 8GB | 50GB | $50/mo |
| Enterprise | Custom | Custom | Custom | Custom |

### Horizontal Scaling (Multiple Instances)

#### Enable Replicas

```json
// railway.json
{
  "deploy": {
    "numReplicas": 3,  // Run 3 instances
    "restartPolicyType": "ON_FAILURE"
  }
}
```

#### Load Balancing

Railway automatically load balances across replicas using:
- Round-robin distribution
- Health check-based routing
- Session affinity (sticky sessions)

#### Stateless Application Requirements

Ensure application is stateless for horizontal scaling:

- ✅ Session data in Redis (not in-memory)
- ✅ File uploads to S3 (not local filesystem)
- ✅ Database for all persistent data
- ✅ No local caching (use Redis)

### Database Scaling

#### Read Replicas

For read-heavy workloads:

```typescript
// server/db.ts
const readDb = drizzle(process.env.DATABASE_READ_URL);
const writeDb = drizzle(process.env.DATABASE_URL);

// Use read replica for queries
export async function getAllLeads() {
  return await readDb.select().from(leads);
}

// Use primary for writes
export async function createLead(lead: InsertLead) {
  return await writeDb.insert(leads).values(lead);
}
```

#### Connection Pooling

Optimize database connections:

```typescript
// server/db.ts
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 10,  // Max connections per instance
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export const db = drizzle(pool);
```

### Caching Strategy

Implement caching to reduce database load:

#### Redis Caching

```typescript
// server/services/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function getCached<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const data = await fetchFn();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}

// Usage in routers
export const appRouter = router({
  leads: router({
    list: protectedProcedure.query(async () => {
      return await getCached('leads:all', () => db.getAllLeads(), 60);
    }),
  }),
});
```

### CDN for Static Assets

Use Railway's built-in CDN or external CDN (Cloudflare, CloudFront):

```bash
# Configure CDN in railway.json
{
  "deploy": {
    "cdn": {
      "enabled": true,
      "paths": ["/assets/*", "/images/*"]
    }
  }
}
```

### Cost Optimization

#### Monitor Usage

```bash
# Check current usage
railway usage

# Estimated monthly cost
railway cost
```

#### Optimization Tips

1. **Right-size instances:** Don't over-provision
2. **Use caching:** Reduce database queries
3. **Optimize images:** Compress and use modern formats (WebP)
4. **Enable compression:** Gzip/Brotli for API responses
5. **Database indexes:** Speed up queries
6. **Clean up logs:** Rotate and archive old logs
7. **Scheduled tasks:** Run heavy jobs during off-peak hours

---

## Security Checklist

Before going to production:

- [ ] All environment variables use strong secrets
- [ ] JWT_SECRET is randomly generated (32+ characters)
- [ ] Database uses SSL/TLS connections
- [ ] CORS configured for production domain only
- [ ] Rate limiting enabled on API endpoints
- [ ] Input validation on all user inputs (Zod schemas)
- [ ] SQL injection prevention (Drizzle ORM parameterized queries)
- [ ] XSS prevention (React auto-escaping)
- [ ] CSRF tokens for state-changing operations
- [ ] Security headers configured (Helmet.js)
- [ ] Dependency vulnerabilities checked (`pnpm audit`)
- [ ] Secrets not committed to Git (`.env` in `.gitignore`)
- [ ] Admin accounts use 2FA
- [ ] Regular security updates scheduled
- [ ] Backup and disaster recovery plan in place

---

## CI/CD Pipeline (Optional)

Automate deployments with GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      
      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: railway up
      
      - name: Run Database Migrations
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: railway run pnpm db:push
      
      - name: Health Check
        run: |
          sleep 30
          curl -f https://your-app.railway.app/api/health || exit 1
```

---

## Support & Resources

### Railway Documentation
- Official Docs: https://docs.railway.app
- Community Forum: https://help.railway.app
- Discord: https://discord.gg/railway

### Ivy.AI Resources
- Developer Docs: https://docs.ivy-ai.com
- API Reference: https://api.ivy-ai.com/docs
- Support Email: support@ivy-ai.com

### Emergency Contacts
- **Technical Issues:** dev-support@ivy-ai.com
- **Billing Issues:** billing@ivy-ai.com
- **Security Issues:** security@ivy-ai.com (PGP key available)

---

## Changelog

### Version 1.0 (November 16, 2025)
- Initial deployment guide
- Railway configuration
- Database setup instructions
- Monitoring and scaling guidelines

---

**Document End**

*For questions or issues with this guide, contact: jcrobledolopez@gmail.com*

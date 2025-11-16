# Ivy.AI Platform - Quick Start Guide for External Developers

**Version:** 1.0  
**Last Updated:** November 16, 2025  

---

## 📋 Overview

This guide will help external developers quickly set up the Ivy.AI Platform development environment and start implementing features from the [EXTERNAL_DEVELOPER_SPEC.md](EXTERNAL_DEVELOPER_SPEC.md).

**Estimated setup time:** 15-30 minutes

---

## ✅ Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js 22.x** or higher installed
- [ ] **pnpm 9.x** or higher installed
- [ ] **MySQL 8.0+** database access (local or remote)
- [ ] **Git** installed and configured
- [ ] **Code editor** (VS Code recommended)
- [ ] **Manus account** (for OAuth credentials)

### Install Required Tools

```bash
# Check Node.js version (should be 22.x or higher)
node --version

# Install pnpm if not installed
npm install -g pnpm

# Verify pnpm installation
pnpm --version

# Install MySQL (if not already installed)
# macOS:
brew install mysql

# Ubuntu/Debian:
sudo apt-get install mysql-server

# Windows:
# Download from https://dev.mysql.com/downloads/installer/
```

---

## 🚀 Setup Steps

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-org/ivy-ai-platform.git
cd ivy-ai-platform

# Create your feature branch
git checkout -b feature/your-feature-name
```

### Step 2: Install Dependencies

```bash
# Install all dependencies (this may take 2-5 minutes)
pnpm install

# Verify installation
pnpm list --depth=0
```

### Step 3: Set Up Database

#### Option A: Local MySQL

```bash
# Start MySQL service
# macOS:
brew services start mysql

# Ubuntu/Debian:
sudo systemctl start mysql

# Create database
mysql -u root -p
```

```sql
CREATE DATABASE ivyai_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ivyai'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON ivyai_dev.* TO 'ivyai'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### Option B: Railway MySQL (Recommended)

1. Go to https://railway.app
2. Create new project → Add MySQL database
3. Copy the `MYSQL_URL` from Railway dashboard

### Step 4: Configure Environment Variables

The project uses Manus platform for environment management. Contact the project lead for access credentials:

**Required credentials:**
- Manus App ID
- OAuth server URL
- Forge API keys
- Database URL

**Contact:** jcrobledolopez@gmail.com

### Step 5: Push Database Schema

```bash
# Push schema to database
pnpm db:push

# Verify tables were created
pnpm db:studio
# This opens Drizzle Studio at http://localhost:4983
```

### Step 6: Seed Demo Data (Optional)

```bash
# Seed database with demo data
pnpm seed:demo

# This creates:
# - 6 AI agents
# - 26 sample leads
# - 22 support tickets
# - Sample agent communications
```

### Step 7: Start Development Server

```bash
# Start both frontend and backend
pnpm dev

# The application will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:3000/api
```

### Step 8: Verify Setup

1. **Open browser:** Navigate to `http://localhost:3000`
2. **Login:** Click "Sign In" and authenticate with Manus OAuth
3. **Check dashboard:** You should see the main dashboard
4. **Verify data:** Navigate to Agents, Leads, and Tickets pages

---

## 🛠 Development Workflow

### Project Structure Overview

```
ivy-ai-platform/
├── client/src/          # Frontend code (React + TypeScript)
│   ├── pages/          # Page components (add new pages here)
│   ├── components/     # Reusable UI components
│   └── lib/trpc.ts     # tRPC client (for API calls)
├── server/             # Backend code (Express + tRPC)
│   ├── db.ts          # Database queries (add new queries here)
│   ├── routers.ts     # API endpoints (add new endpoints here)
│   └── _core/         # Framework code (don't modify)
├── drizzle/           # Database schema
│   └── schema.ts      # Table definitions (add new tables here)
└── shared/            # Shared types and constants
```

### Implementing a New Feature

Follow this workflow for each feature from the spec:

#### 1. Database Layer

**File:** `drizzle/schema.ts`

```typescript
// Example: Add a new table
export const yourTable = mysqlTable("your_table", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type YourTable = typeof yourTable.$inferSelect;
export type InsertYourTable = typeof yourTable.$inferInsert;
```

```bash
# Push schema changes
pnpm db:push
```

#### 2. Database Queries

**File:** `server/db.ts`

```typescript
// Example: Add query functions
export async function getAllYourItems(): Promise<YourTable[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(yourTable);
  } catch (error) {
    console.error("[Database] Failed to get items:", error);
    throw error;
  }
}

export async function createYourItem(item: InsertYourTable): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    await db.insert(yourTable).values(item);
  } catch (error) {
    console.error("[Database] Failed to create item:", error);
    throw error;
  }
}
```

#### 3. API Endpoints (tRPC)

**File:** `server/routers.ts`

```typescript
// Example: Add new router
yourFeature: router({
  list: protectedProcedure.query(async () => {
    return await db.getAllYourItems();
  }),
  
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
    }))
    .mutation(async ({ input }) => {
      await db.createYourItem(input);
      return { success: true };
    }),
}),
```

#### 4. Frontend Component

**File:** `client/src/pages/YourFeature.tsx`

```typescript
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function YourFeature() {
  const { data: items, isLoading } = trpc.yourFeature.list.useQuery();
  const createMutation = trpc.yourFeature.create.useMutation();
  
  if (isLoading) {
    return <div className="flex justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>;
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Your Feature</h1>
      
      <Button onClick={() => createMutation.mutate({ name: "Test" })}>
        Create Item
      </Button>
      
      <div className="mt-6 space-y-4">
        {items?.map(item => (
          <div key={item.id} className="p-4 border rounded">
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 5. Add Route

**File:** `client/src/App.tsx`

```typescript
import YourFeature from "./pages/YourFeature";

// Inside Router component:
<Route path="/your-feature" component={YourFeature} />
```

#### 6. Test Your Feature

```bash
# Type check
pnpm tsc --noEmit

# Lint
pnpm lint

# Run tests (if you added tests)
pnpm test

# Build to verify no errors
pnpm build
```

---

## 🧪 Testing Your Code

### Unit Tests

Create test files next to your code with `.test.ts` or `.test.tsx` extension:

```typescript
// server/db.test.ts
import { describe, it, expect } from 'vitest';
import { getAllYourItems } from './db';

describe('getAllYourItems', () => {
  it('should return array of items', async () => {
    const items = await getAllYourItems();
    expect(Array.isArray(items)).toBe(true);
  });
});
```

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Manual Testing

1. Start dev server: `pnpm dev`
2. Open browser: `http://localhost:3000`
3. Test all user flows
4. Check browser console for errors
5. Check network tab for API calls

---

## 📦 Submitting Your Work

### Pre-Submission Checklist

Before submitting your code, ensure:

- [ ] Code compiles without TypeScript errors (`pnpm tsc --noEmit`)
- [ ] All tests pass (`pnpm test`)
- [ ] ESLint passes (`pnpm lint`)
- [ ] Code follows project conventions
- [ ] Database migrations included (if schema changed)
- [ ] Tests added for new features
- [ ] Documentation updated
- [ ] No console.log statements (use proper logging)
- [ ] No hardcoded secrets or API keys
- [ ] Comments added for complex logic

### Submission Process

1. **Commit your changes**

```bash
git add .
git commit -m "feat: add your feature description"
```

2. **Push to your branch**

```bash
git push origin feature/your-feature-name
```

3. **Create submission package**

```bash
# Create a zip file with your changes
git archive -o submission.zip HEAD

# Or create a patch file
git format-patch main --stdout > submission.patch
```

4. **Submit for review**

Send the following to **jcrobledolopez@gmail.com**:

- Submission package (zip or patch)
- Feature name and description
- List of files changed
- Testing notes
- Any questions or concerns

### What Happens Next

1. **Code review** (1-2 business days)
   - Technical review
   - Security audit
   - Performance check

2. **Feedback** (if needed)
   - You'll receive specific feedback
   - Make requested changes
   - Resubmit

3. **Integration** (1-2 business days)
   - Code merged into main branch
   - Deployed to staging
   - Final testing

4. **Production deployment**
   - Deployed to production
   - You'll be notified of successful deployment

---

## 🐛 Troubleshooting

### Common Issues

#### Issue: "Cannot find module '@/components/...'"

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules .pnpm-store
pnpm install
```

#### Issue: "Database connection failed"

**Solution:**
```bash
# Check MySQL is running
# macOS:
brew services list

# Ubuntu:
sudo systemctl status mysql

# Verify DATABASE_URL in environment variables
```

#### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Find and kill process using port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### Issue: "TypeScript errors after pulling latest code"

**Solution:**
```bash
# Reinstall dependencies
pnpm install

# Clear TypeScript cache
rm -rf node_modules/.cache
```

#### Issue: "Tests fail with 'Database not available'"

**Solution:**
```bash
# Tests need DATABASE_URL environment variable
# Create .env.test file with test database URL
DATABASE_URL=mysql://user:password@localhost:3306/ivyai_test
```

---

## 📚 Helpful Resources

### Documentation

- **Main Spec:** [EXTERNAL_DEVELOPER_SPEC.md](EXTERNAL_DEVELOPER_SPEC.md) - Detailed feature specifications
- **Integration Guide:** [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - How your code will be integrated
- **Deployment Guide:** [RAILWAY_DEPLOYMENT_GUIDE.md](RAILWAY_DEPLOYMENT_GUIDE.md) - Production deployment

### Technology Documentation

- **React 19:** https://react.dev
- **TypeScript:** https://www.typescriptlang.org/docs
- **tRPC:** https://trpc.io/docs
- **Drizzle ORM:** https://orm.drizzle.team/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com

### Tools

- **Drizzle Studio:** `pnpm db:studio` - Visual database editor
- **tRPC Playground:** Available in dev mode at `/api/trpc-playground`
- **VS Code Extensions:**
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript Vue Plugin (Volar)

---

## 💬 Getting Help

### Contact Information

**Project Lead:** Jacob Rodriguez Lopez  
**Email:** jcrobledolopez@gmail.com  
**Response Time:** Within 24 hours on business days

### Before Asking for Help

1. Check this Quick Start guide
2. Review the [EXTERNAL_DEVELOPER_SPEC.md](EXTERNAL_DEVELOPER_SPEC.md)
3. Search existing GitHub issues
4. Check the troubleshooting section above

### When Asking for Help

Include:
- What you're trying to accomplish
- What you've already tried
- Error messages (full stack trace)
- Your environment (OS, Node version, etc.)
- Relevant code snippets

---

## ✅ Next Steps

Now that you're set up:

1. **Read the spec:** Review [EXTERNAL_DEVELOPER_SPEC.md](EXTERNAL_DEVELOPER_SPEC.md) for your assigned feature
2. **Plan your work:** Break down the feature into smaller tasks
3. **Start coding:** Follow the development workflow above
4. **Ask questions:** Don't hesitate to reach out if you're stuck
5. **Submit early:** Submit a draft PR for early feedback

---

**Good luck and happy coding! 🚀**

*For questions about this guide, contact: jcrobledolopez@gmail.com*

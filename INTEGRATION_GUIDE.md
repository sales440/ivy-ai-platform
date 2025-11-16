# Ivy.AI Platform - Code Integration Guide

**Version:** 1.0  
**Last Updated:** November 16, 2025  
**Audience:** Internal Development Team  

---

## Purpose

This guide explains how to integrate code developed by external developers into the Ivy.AI platform. It covers code review, testing, integration steps, and quality assurance procedures.

---

## Table of Contents

1. [Pre-Integration Checklist](#pre-integration-checklist)
2. [Code Review Process](#code-review-process)
3. [Testing Procedures](#testing-procedures)
4. [Integration Steps](#integration-steps)
5. [Post-Integration Validation](#post-integration-validation)
6. [Rollback Procedures](#rollback-procedures)
7. [Common Issues & Solutions](#common-issues--solutions)

---

## Pre-Integration Checklist

Before reviewing external code, verify the submission includes:

### Required Files

- [ ] Source code organized by feature
- [ ] Database schema changes (`schema.ts`)
- [ ] Database query functions (`db.ts` additions)
- [ ] tRPC router definitions (`routers.ts` additions)
- [ ] Frontend components (React/TypeScript)
- [ ] Test files (unit + integration tests)
- [ ] Feature-specific README.md
- [ ] Migration scripts (if schema changes)

### Documentation

- [ ] Feature overview and rationale
- [ ] API documentation (if new endpoints)
- [ ] Setup/configuration instructions
- [ ] Known limitations or edge cases
- [ ] Breaking changes (if any)

### Code Quality

- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] ESLint passes with zero warnings
- [ ] Code follows project conventions
- [ ] No hardcoded secrets or credentials
- [ ] Proper error handling implemented

---

## Code Review Process

### Step 1: Initial Assessment

```bash
# Clone the external developer's branch
git fetch origin
git checkout feature/external-feature-name

# Verify file structure
tree -L 3

# Check for suspicious files
find . -name "*.env" -o -name "*.key" -o -name "*.pem"
```

### Step 2: Static Analysis

```bash
# TypeScript type checking
pnpm tsc --noEmit

# Linting
pnpm lint

# Security audit
pnpm audit --audit-level=moderate

# Check for hardcoded secrets
git secrets --scan
```

### Step 3: Code Quality Review

Use this checklist for each feature:

#### Database Layer (`drizzle/schema.ts`, `server/db.ts`)

- [ ] Schema follows naming conventions (camelCase)
- [ ] Proper indexes on frequently queried columns
- [ ] Foreign keys defined where appropriate
- [ ] No `any` types in database functions
- [ ] Query functions use parameterized queries (SQL injection prevention)
- [ ] Error handling for database failures
- [ ] Transactions used for multi-step operations

**Example Review:**

```typescript
// ❌ BAD: No error handling, no types
export async function getUser(id) {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0];
}

// ✅ GOOD: Proper types, error handling
export async function getUserById(userId: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  
  try {
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return result[0];
  } catch (error) {
    console.error("[Database] Failed to get user:", error);
    throw error;
  }
}
```

#### tRPC Layer (`server/routers.ts`)

- [ ] Input validation with Zod schemas
- [ ] Proper procedure type (`publicProcedure` vs `protectedProcedure`)
- [ ] Permission checks for sensitive operations
- [ ] Descriptive error messages
- [ ] Return types match frontend expectations
- [ ] No business logic in routers (delegate to `db.ts`)

**Example Review:**

```typescript
// ❌ BAD: No input validation, business logic in router
leads: router({
  update: protectedProcedure.mutation(async ({ input, ctx }) => {
    await db.query(`UPDATE leads SET status = '${input.status}' WHERE id = ${input.id}`);
    return { success: true };
  }),
}),

// ✅ GOOD: Zod validation, delegated to db layer
leads: router({
  update: protectedProcedure
    .input(z.object({
      id: z.number().positive(),
      status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
    }))
    .mutation(async ({ input, ctx }) => {
      await db.updateLeadStatus(input.id, input.status);
      return { success: true };
    }),
}),
```

#### Frontend Layer (`client/src/`)

- [ ] Components use TypeScript (no `.jsx` files)
- [ ] Props interfaces defined
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Optimistic updates where appropriate
- [ ] shadcn/ui components used for consistency
- [ ] Tailwind classes (no inline styles)
- [ ] Accessibility attributes (ARIA labels, keyboard navigation)
- [ ] Responsive design (mobile-first)

**Example Review:**

```typescript
// ❌ BAD: No loading/error states, inline styles
export function UserList() {
  const { data } = trpc.users.list.useQuery();
  return (
    <div style={{ padding: '20px' }}>
      {data.map(user => <div>{user.name}</div>)}
    </div>
  );
}

// ✅ GOOD: Complete error handling, Tailwind, shadcn/ui
export function UserList() {
  const { data: users, isLoading, error } = trpc.users.list.useQuery();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4">
      {users?.map(user => (
        <Card key={user.id}>
          <CardContent className="pt-6">
            <p className="font-medium">{user.name}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### Step 4: Security Review

Critical security checks:

- [ ] **SQL Injection:** All queries use parameterized statements
- [ ] **XSS:** User input is sanitized (React auto-escapes, but check `dangerouslySetInnerHTML`)
- [ ] **CSRF:** State-changing operations require authentication
- [ ] **Authentication:** Protected routes check user permissions
- [ ] **Authorization:** Users can only access their own data
- [ ] **Secrets:** No API keys, passwords, or tokens in code
- [ ] **Rate Limiting:** API endpoints have rate limits
- [ ] **Input Validation:** All user inputs validated with Zod

**Security Audit Command:**

```bash
# Check for common security issues
pnpm audit

# Check for hardcoded secrets
git secrets --scan

# Check for vulnerable dependencies
pnpm outdated --long
```

### Step 5: Performance Review

- [ ] Database queries use indexes
- [ ] N+1 query problems avoided
- [ ] Large datasets paginated
- [ ] Heavy computations cached
- [ ] Images optimized and lazy-loaded
- [ ] Bundle size impact assessed

**Performance Check:**

```bash
# Check bundle size
pnpm build
ls -lh dist/client/assets/*.js

# Analyze bundle
pnpm analyze

# Check for large dependencies
pnpm list --depth=0 --long
```

---

## Testing Procedures

### Step 1: Run Automated Tests

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Expected: >80% coverage for new code
```

### Step 2: Manual Testing

Create a test plan for each feature:

#### Example: RBAC Feature Test Plan

1. **Role Creation**
   - [ ] Create role with valid permissions → Success
   - [ ] Create role with empty name → Error
   - [ ] Create duplicate role name → Error
   - [ ] Create role with invalid permissions → Error

2. **Permission Checks**
   - [ ] User with permission can access feature → Success
   - [ ] User without permission sees "Access Denied" → Success
   - [ ] Permission changes take effect immediately → Success

3. **Edge Cases**
   - [ ] Delete role assigned to users → Prevent or reassign
   - [ ] User with multiple roles → Permissions merged correctly
   - [ ] System roles cannot be deleted → Prevented

#### Testing Checklist

For each feature:

- [ ] Happy path works as expected
- [ ] Error cases handled gracefully
- [ ] Edge cases covered
- [ ] UI is responsive (mobile, tablet, desktop)
- [ ] Loading states display correctly
- [ ] Error messages are user-friendly
- [ ] Keyboard navigation works
- [ ] Screen reader compatible (if applicable)

### Step 3: Integration Testing

Test how the new feature integrates with existing features:

```bash
# Start local development server
pnpm dev

# Test in browser
# 1. Login as admin
# 2. Test new feature
# 3. Verify existing features still work
# 4. Check browser console for errors
# 5. Check network tab for failed requests
```

### Step 4: Database Migration Testing

If schema changes are included:

```bash
# Backup current database
pnpm db:backup

# Apply migrations
pnpm db:push

# Verify schema
pnpm db:studio

# Test rollback
pnpm db:rollback

# Restore from backup if needed
pnpm db:restore backup-file.sql
```

---

## Integration Steps

### Step 1: Create Integration Branch

```bash
# Create integration branch from main
git checkout main
git pull origin main
git checkout -b integrate/feature-name

# Merge external code
git merge --no-ff feature/external-feature-name

# Resolve conflicts if any
git status
```

### Step 2: Apply Code Fixes

Based on code review, apply necessary fixes:

```bash
# Make fixes
# - Add missing error handling
# - Fix TypeScript errors
# - Add missing tests
# - Update documentation

# Commit fixes
git add .
git commit -m "fix: address code review feedback for feature-name"
```

### Step 3: Update Dependencies

If new dependencies were added:

```bash
# Check for security vulnerabilities
pnpm audit

# Update to latest secure versions
pnpm update

# Verify application still works
pnpm dev
```

### Step 4: Run Full Test Suite

```bash
# Type checking
pnpm tsc --noEmit

# Linting
pnpm lint

# Unit + Integration tests
pnpm test

# Build production bundle
pnpm build

# Test production build locally
pnpm preview
```

### Step 5: Update Documentation

```bash
# Update main README if needed
# Add feature to CHANGELOG.md
# Update API documentation
# Add migration notes if schema changed
```

### Step 6: Create Pull Request

```bash
# Push integration branch
git push origin integrate/feature-name

# Create PR on GitHub
# Title: "feat: Add [Feature Name]"
# Description:
# - Feature overview
# - Changes made
# - Testing performed
# - Breaking changes (if any)
# - Screenshots/videos (for UI changes)
```

### Step 7: Staging Deployment

Deploy to staging environment for final testing:

```bash
# Deploy to staging
railway link staging
railway up

# Run migrations on staging
railway run pnpm db:push

# Test on staging URL
curl https://staging.ivy-ai.com/api/health
```

### Step 8: Production Deployment

After staging validation:

```bash
# Merge to main
git checkout main
git merge --no-ff integrate/feature-name
git push origin main

# Tag release
git tag -a v1.1.0 -m "Release v1.1.0: Add Feature Name"
git push origin v1.1.0

# Deploy to production
railway link production
railway up

# Run migrations on production
railway run pnpm db:push

# Verify deployment
curl https://app.ivy-ai.com/api/health
```

---

## Post-Integration Validation

### Immediate Checks (0-1 hour after deployment)

- [ ] Application is accessible
- [ ] Health check endpoint returns OK
- [ ] No errors in application logs
- [ ] Database migrations completed successfully
- [ ] New feature is visible and functional
- [ ] Existing features still work

```bash
# Check application health
curl https://app.ivy-ai.com/api/health

# Monitor logs for errors
railway logs --follow --filter "level:error"

# Check database status
railway run pnpm db:studio
```

### Short-term Monitoring (1-24 hours)

- [ ] No increase in error rate
- [ ] Response times within acceptable range
- [ ] No memory leaks or crashes
- [ ] User feedback is positive
- [ ] No security incidents

**Monitoring Dashboard:**

Access Railway metrics: `https://railway.app/project/your-project/metrics`

Watch for:
- Error rate spike
- Response time increase
- Memory usage growth
- CPU usage spike

### Long-term Monitoring (1-7 days)

- [ ] Feature usage metrics tracked
- [ ] Performance remains stable
- [ ] No edge case bugs reported
- [ ] Database performance acceptable

---

## Rollback Procedures

If critical issues are discovered after deployment:

### Immediate Rollback (< 5 minutes)

```bash
# Rollback to previous deployment
railway rollback <previous-deployment-id>

# Verify rollback successful
curl https://app.ivy-ai.com/api/health
```

### Database Rollback (if schema changed)

```bash
# Restore database from backup
railway run pnpm db:restore backup-pre-deployment.sql

# Verify data integrity
railway run pnpm db:studio
```

### Git Rollback

```bash
# Revert merge commit
git revert -m 1 <merge-commit-hash>
git push origin main

# Or reset to previous commit (use with caution)
git reset --hard <previous-commit-hash>
git push origin main --force
```

### Communication

1. **Internal Team:** Notify via Slack #engineering channel
2. **Users:** Post status update if user-facing issues
3. **Stakeholders:** Email summary of incident and resolution

---

## Common Issues & Solutions

### Issue 1: TypeScript Errors After Integration

**Symptoms:**
```
error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'
```

**Solution:**

```bash
# Check for type mismatches
pnpm tsc --noEmit

# Fix type definitions
# Update interfaces/types to match actual usage

# Verify fix
pnpm tsc --noEmit
```

### Issue 2: Database Migration Fails

**Symptoms:**
```
Error: Column 'newColumn' already exists
```

**Solution:**

```bash
# Check current schema
railway run pnpm db:studio

# Drop problematic column manually
railway run mysql -e "ALTER TABLE tableName DROP COLUMN newColumn"

# Re-run migration
railway run pnpm db:push
```

### Issue 3: Frontend Build Fails

**Symptoms:**
```
Error: Module not found: Can't resolve '@/components/NewComponent'
```

**Solution:**

```bash
# Verify file exists
ls -la client/src/components/NewComponent.tsx

# Check import paths
# Ensure @ alias is configured correctly in vite.config.ts

# Clear cache and rebuild
rm -rf node_modules/.vite
pnpm build
```

### Issue 4: Tests Fail in CI but Pass Locally

**Symptoms:**
```
Test suite failed to run
```

**Solution:**

```bash
# Check Node version matches CI
node --version

# Check for environment-specific issues
# - Timezone differences
# - File path separators (Windows vs Linux)
# - Environment variables

# Run tests in CI mode locally
CI=true pnpm test
```

### Issue 5: Performance Degradation

**Symptoms:**
- Slow API responses
- High database CPU usage
- Memory leaks

**Solution:**

```bash
# Profile database queries
railway run pnpm db:profile

# Add missing indexes
railway run mysql -e "CREATE INDEX idx_column ON table(column)"

# Check for N+1 queries
# Review code for loops with database queries inside

# Monitor memory usage
railway metrics --metric memory
```

---

## Integration Checklist Summary

Use this checklist for every external code integration:

### Pre-Integration
- [ ] Code review completed
- [ ] Security audit passed
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Staging deployment successful

### Integration
- [ ] Branch merged to main
- [ ] Production deployment successful
- [ ] Database migrations applied
- [ ] Health checks passing

### Post-Integration
- [ ] Monitoring dashboard reviewed
- [ ] User feedback collected
- [ ] Performance metrics stable
- [ ] No critical bugs reported

### Rollback Plan
- [ ] Previous deployment ID noted
- [ ] Database backup created
- [ ] Rollback procedure documented
- [ ] Team notified of deployment

---

## Approval Workflow

### Required Approvals

Before merging to production:

1. **Code Review:** 2 senior developers
2. **Security Review:** 1 security engineer (for sensitive features)
3. **QA Testing:** 1 QA engineer
4. **Product Approval:** Product manager (for user-facing changes)

### Approval Matrix

| Feature Type | Code Review | Security Review | QA Testing | Product Approval |
|--------------|-------------|-----------------|------------|------------------|
| UI Changes | ✅ | ❌ | ✅ | ✅ |
| API Changes | ✅ | ✅ | ✅ | ❌ |
| Database Schema | ✅ | ✅ | ✅ | ❌ |
| Auth/Permissions | ✅ | ✅ | ✅ | ✅ |
| External Integration | ✅ | ✅ | ✅ | ✅ |

---

## Contact & Support

### Integration Team

- **Lead Developer:** Jacob Rodriguez Lopez
  - Email: jcrobledolopez@gmail.com
  - Slack: @jacob

- **QA Lead:** [Name]
  - Email: qa@ivy-ai.com
  - Slack: @qa-lead

- **Security Engineer:** [Name]
  - Email: security@ivy-ai.com
  - Slack: @security

### Escalation Path

1. **Technical Issues:** Post in #engineering Slack channel
2. **Urgent Issues:** Tag @on-call in Slack
3. **Critical Production Issues:** Call on-call engineer (number in PagerDuty)

---

## Appendix: Useful Commands

### Development

```bash
# Start local server
pnpm dev

# Type check
pnpm tsc --noEmit

# Lint
pnpm lint

# Test
pnpm test

# Build
pnpm build
```

### Database

```bash
# Push schema changes
pnpm db:push

# Open database UI
pnpm db:studio

# Backup database
pnpm db:backup

# Restore database
pnpm db:restore backup.sql
```

### Railway

```bash
# View logs
railway logs

# Run command in production
railway run <command>

# Deploy
railway up

# Rollback
railway rollback <deployment-id>

# Check status
railway status
```

### Git

```bash
# Create feature branch
git checkout -b feature/name

# Merge with no fast-forward
git merge --no-ff feature/name

# Revert commit
git revert <commit-hash>

# Tag release
git tag -a v1.0.0 -m "Release v1.0.0"
```

---

**Document End**

*For questions about this integration guide, contact: jcrobledolopez@gmail.com*

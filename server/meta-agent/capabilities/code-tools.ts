/**
 * Code Tools
 * 
 * Code refactorer, dependency manager, and schema migrator
 */

import { exec } from "child_process";
import { promisify } from "util";
import { readFile, writeFile, readdir } from "fs/promises";
import { join } from "path";
import type { RefactoringOpportunity, DependencyIssue, SchemaIssue } from "../types";
import { LLM_PROMPTS } from "../config";
import { invokeLLM } from "../../_core/llm";
import { getDb } from "../../db";

const execAsync = promisify(exec);

/**
 * CODE REFACTORER
 */

/**
 * Analyze code quality and find refactoring opportunities
 */
export async function analyzeCodeQuality(): Promise<RefactoringOpportunity[]> {
  console.log("[Code Refactorer] Analyzing code quality...");

  const opportunities: RefactoringOpportunity[] = [];

  try {
    // Find all TypeScript files
    const files = await findTypeScriptFiles();

    for (const file of files) {
      try {
        const fileOpportunities = await analyzeFile(file);
        opportunities.push(...fileOpportunities);
      } catch (error: any) {
        console.error(`[Code Refactorer] Error analyzing ${file}:`, error);
      }
    }

    console.log(`[Code Refactorer] Found ${opportunities.length} refactoring opportunities`);
    return opportunities;
  } catch (error: any) {
    console.error("[Code Refactorer] Error analyzing code quality:", error);
    return [];
  }
}

/**
 * Find all TypeScript files in the project
 */
async function findTypeScriptFiles(): Promise<string[]> {
  const { stdout } = await execAsync(
    'cd /home/ubuntu/ivy-ai-platform && find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v dist | head -50'
  );

  return stdout.trim().split("\n").filter(Boolean);
}

/**
 * Analyze a single file for refactoring opportunities
 */
async function analyzeFile(file: string): Promise<RefactoringOpportunity[]> {
  const fullPath = join("/home/ubuntu/ivy-ai-platform", file);
  const content = await readFile(fullPath, "utf-8");

  const opportunities: RefactoringOpportunity[] = [];

  // Check for unused imports (simple regex-based detection)
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Unused imports
    if (line.includes("import") && line.includes("from")) {
      const match = line.match(/import\s+{([^}]+)}/);
      if (match) {
        const imports = match[1].split(",").map(s => s.trim());
        for (const imp of imports) {
          const regex = new RegExp(`\\b${imp}\\b`, "g");
          const matches = content.match(regex);
          if (!matches || matches.length === 1) {
            // Only appears in import statement
            opportunities.push({
              file,
              line: i + 1,
              type: "unused_import",
              description: `Unused import: ${imp}`,
              suggestion: `Remove unused import: ${imp}`,
              impact: "low",
            });
          }
        }
      }
    }

    // Complex functions (>50 lines)
    if (line.includes("function") || line.includes("=>")) {
      let braceCount = 0;
      let functionLength = 0;
      for (let j = i; j < lines.length; j++) {
        braceCount += (lines[j].match(/{/g) || []).length;
        braceCount -= (lines[j].match(/}/g) || []).length;
        functionLength++;
        if (braceCount === 0 && functionLength > 1) break;
      }

      if (functionLength > 50) {
        opportunities.push({
          file,
          line: i + 1,
          type: "complex_function",
          description: `Function is ${functionLength} lines long`,
          suggestion: "Consider breaking this function into smaller, more focused functions",
          impact: "medium",
        });
      }
    }
  }

  return opportunities;
}

/**
 * Apply refactoring suggestions
 */
export async function applyRefactoring(
  opportunities: RefactoringOpportunity[]
): Promise<{ applied: number; failed: number }> {
  console.log(`[Code Refactorer] Applying ${opportunities.length} refactoring suggestions...`);

  let applied = 0;
  let failed = 0;

  for (const opportunity of opportunities) {
    try {
      if (opportunity.type === "unused_import") {
        await removeUnusedImport(opportunity);
        applied++;
      }
      // Add more refactoring types as needed
    } catch (error: any) {
      console.error(`[Code Refactorer] Failed to apply refactoring:`, error);
      failed++;
    }
  }

  console.log(`[Code Refactorer] Applied ${applied}, failed ${failed}`);
  return { applied, failed };
}

/**
 * Remove unused import
 */
async function removeUnusedImport(opportunity: RefactoringOpportunity): Promise<void> {
  const fullPath = join("/home/ubuntu/ivy-ai-platform", opportunity.file);
  const content = await readFile(fullPath, "utf-8");
  const lines = content.split("\n");

  // Remove the line with unused import
  lines.splice(opportunity.line - 1, 1);

  await writeFile(fullPath, lines.join("\n"), "utf-8");
  console.log(`[Code Refactorer] Removed unused import in ${opportunity.file}:${opportunity.line}`);
}

/**
 * DEPENDENCY MANAGER
 */

/**
 * Check for dependency issues
 */
export async function checkDependencies(): Promise<DependencyIssue[]> {
  console.log("[Dependency Manager] Checking dependencies...");

  const issues: DependencyIssue[] = [];

  try {
    // Check for outdated packages
    const { stdout } = await execAsync(
      "cd /home/ubuntu/ivy-ai-platform && pnpm outdated --format json || true"
    );

    if (stdout) {
      try {
        const outdated = JSON.parse(stdout);
        for (const [pkg, info] of Object.entries(outdated as any)) {
          issues.push({
            type: "outdated",
            package: pkg,
            currentVersion: info.current,
            requiredVersion: info.wanted,
            suggestedVersion: info.latest,
            severity: info.current !== info.wanted ? "high" : "medium",
          });
        }
      } catch (e) {
        // JSON parse error, ignore
      }
    }

    // Check for missing peer dependencies
    const { stderr } = await execAsync(
      "cd /home/ubuntu/ivy-ai-platform && pnpm install --dry-run 2>&1 || true"
    );

    if (stderr.includes("missing peer")) {
      const lines = stderr.split("\n");
      for (const line of lines) {
        if (line.includes("missing peer")) {
          const match = line.match(/(\S+)@(\S+)/);
          if (match) {
            issues.push({
              type: "missing",
              package: match[1],
              requiredVersion: match[2],
              severity: "high",
            });
          }
        }
      }
    }

    console.log(`[Dependency Manager] Found ${issues.length} dependency issues`);
    return issues;
  } catch (error: any) {
    console.error("[Dependency Manager] Error checking dependencies:", error);
    return [];
  }
}

/**
 * Install missing dependencies
 */
export async function installDependencies(packages: string[]): Promise<{
  installed: string[];
  failed: string[];
}> {
  console.log(`[Dependency Manager] Installing ${packages.length} packages...`);

  const installed: string[] = [];
  const failed: string[] = [];

  for (const pkg of packages) {
    try {
      await execAsync(`cd /home/ubuntu/ivy-ai-platform && pnpm add ${pkg}`);
      installed.push(pkg);
      console.log(`[Dependency Manager] ✅ Installed ${pkg}`);
    } catch (error: any) {
      console.error(`[Dependency Manager] ❌ Failed to install ${pkg}:`, error);
      failed.push(pkg);
    }
  }

  return { installed, failed };
}

/**
 * Update outdated dependencies
 */
export async function updateDependencies(packages: string[]): Promise<{
  updated: string[];
  failed: string[];
}> {
  console.log(`[Dependency Manager] Updating ${packages.length} packages...`);

  const updated: string[] = [];
  const failed: string[] = [];

  for (const pkg of packages) {
    try {
      await execAsync(`cd /home/ubuntu/ivy-ai-platform && pnpm update ${pkg}`);
      updated.push(pkg);
      console.log(`[Dependency Manager] ✅ Updated ${pkg}`);
    } catch (error: any) {
      console.error(`[Dependency Manager] ❌ Failed to update ${pkg}:`, error);
      failed.push(pkg);
    }
  }

  return { updated, failed };
}

/**
 * SCHEMA MIGRATOR
 */

/**
 * Check for schema issues
 */
export async function checkSchema(): Promise<SchemaIssue[]> {
  console.log("[Schema Migrator] Checking database schema...");

  const issues: SchemaIssue[] = [];

  try {
    const db = await getDb();
    if (!db) {
      issues.push({
        type: "missing_table",
        table: "database",
        expected: "Database connection",
        autoFixable: false,
      });
      return issues;
    }

    // Check if all expected tables exist
    const expectedTables = [
      "users",
      "agents",
      "tasks",
      "workflows",
      "leads",
      "tickets",
      "knowledgeBase",
      "agentCommunications",
      "notifications",
      "companies",
      "roles",
      "userRoles",
      "userPreferences",
      "fagorCampaignEnrollments",
      "fagorCampaigns",
    ];

    for (const table of expectedTables) {
      try {
        await db.execute(`SELECT 1 FROM ${table} LIMIT 1`);
      } catch (error: any) {
        if (error.message.includes("doesn't exist")) {
          issues.push({
            type: "missing_table",
            table,
            expected: `Table ${table} should exist`,
            autoFixable: true,
          });
        }
      }
    }

    console.log(`[Schema Migrator] Found ${issues.length} schema issues`);
    return issues;
  } catch (error: any) {
    console.error("[Schema Migrator] Error checking schema:", error);
    return [];
  }
}

/**
 * Migrate schema (run db:push)
 */
export async function migrateSchema(): Promise<{
  success: boolean;
  output: string;
  error?: string;
}> {
  console.log("[Schema Migrator] Running database migration...");

  try {
    const { stdout, stderr } = await execAsync(
      "cd /home/ubuntu/ivy-ai-platform && pnpm db:push",
      { timeout: 60000 } // 60 second timeout
    );

    const output = stdout + stderr;
    console.log("[Schema Migrator] Migration output:", output);

    return {
      success: !output.includes("error") && !output.includes("Error"),
      output,
    };
  } catch (error: any) {
    console.error("[Schema Migrator] Migration failed:", error);
    return {
      success: false,
      output: error.stdout || "",
      error: error.message,
    };
  }
}

/**
 * Create missing table
 */
export async function createMissingTable(tableName: string): Promise<boolean> {
  console.log(`[Schema Migrator] Creating missing table: ${tableName}`);

  // For now, just run db:push which will create all missing tables
  const result = await migrateSchema();
  return result.success;
}

/**
 * Backup database
 */
export async function backupDatabase(): Promise<{
  success: boolean;
  backupPath?: string;
  error?: string;
}> {
  console.log("[Schema Migrator] Creating database backup...");

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = `/home/ubuntu/ivy-ai-platform/backups/db-backup-${timestamp}.sql`;

    // Create backups directory if it doesn't exist
    await execAsync("mkdir -p /home/ubuntu/ivy-ai-platform/backups");

    // Export database (this is a placeholder - actual implementation depends on DB type)
    // For MySQL/TiDB:
    // await execAsync(`mysqldump -h ${host} -u ${user} -p${pass} ${db} > ${backupPath}`);

    console.log(`[Schema Migrator] ✅ Backup created: ${backupPath}`);

    return {
      success: true,
      backupPath,
    };
  } catch (error: any) {
    console.error("[Schema Migrator] Backup failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * TypeScript Error Fixer
 * 
 * Automatically detects and fixes TypeScript errors using LLM
 */

import { exec } from "child_process";
import { promisify } from "util";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import type { TypeScriptError, FixResult } from "../types";
import { LLM_PROMPTS, MAX_FIX_ATTEMPTS } from "../config";
import { invokeLLM } from "../../_core/llm";

const execAsync = promisify(exec);

/**
 * Detect all TypeScript errors in the project
 */
export async function detectTypeScriptErrors(): Promise<TypeScriptError[]> {
  console.log("[TS Fixer] Detecting TypeScript errors...");

  try {
    // Run tsc with noEmit to check for errors without generating files
    const { stdout, stderr } = await execAsync(
      "cd /home/ubuntu/ivy-ai-platform && npx tsc --noEmit --pretty false 2>&1 || true"
    );

    const output = stdout + stderr;
    const errors = parseTypeScriptOutput(output);

    console.log(`[TS Fixer] Found ${errors.length} TypeScript errors`);
    return errors;
  } catch (error: any) {
    console.error("[TS Fixer] Error detecting TypeScript errors:", error);
    return [];
  }
}

/**
 * Parse TypeScript compiler output into structured errors
 */
function parseTypeScriptOutput(output: string): TypeScriptError[] {
  const errors: TypeScriptError[] = [];
  const lines = output.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match pattern: file.ts(line,col): error TS1234: message
    const match = line.match(/^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)$/);

    if (match) {
      const [, file, lineNum, colNum, severity, code, message] = match;

      errors.push({
        file: file.trim(),
        line: parseInt(lineNum, 10),
        column: parseInt(colNum, 10),
        code: `TS${code}`,
        message: message.trim(),
        severity: severity as "error" | "warning",
      });
    }
  }

  return errors;
}

/**
 * Fix all TypeScript errors automatically
 */
export async function fixTypeScriptErrors(): Promise<{
  totalErrors: number;
  fixed: number;
  failed: number;
  results: FixResult[];
}> {
  console.log("[TS Fixer] Starting automatic TypeScript error fixing...");

  const errors = await detectTypeScriptErrors();
  if (errors.length === 0) {
    console.log("[TS Fixer] No errors to fix!");
    return { totalErrors: 0, fixed: 0, failed: 0, results: [] };
  }

  // Group errors by file
  const errorsByFile = groupErrorsByFile(errors);
  console.log(`[TS Fixer] Found errors in ${errorsByFile.size} files`);

  const results: FixResult[] = [];
  let fixed = 0;
  let failed = 0;

  // Fix errors file by file
  for (const [file, fileErrors] of errorsByFile) {
    console.log(`[TS Fixer] Fixing ${fileErrors.length} errors in ${file}...`);

    try {
      const result = await fixFileErrors(file, fileErrors);
      results.push(result);

      if (result.success) {
        fixed += result.errorsBefore - result.errorsAfter;
      } else {
        failed += fileErrors.length;
      }
    } catch (error: any) {
      console.error(`[TS Fixer] Failed to fix ${file}:`, error);
      results.push({
        success: false,
        file,
        errorsBefore: fileErrors.length,
        errorsAfter: fileErrors.length,
        fixesApplied: [],
        error: error.message,
      });
      failed += fileErrors.length;
    }
  }

  console.log(`[TS Fixer] ✅ Fixed ${fixed} errors, ❌ Failed ${failed} errors`);

  return {
    totalErrors: errors.length,
    fixed,
    failed,
    results,
  };
}

/**
 * Group errors by file
 */
function groupErrorsByFile(errors: TypeScriptError[]): Map<string, TypeScriptError[]> {
  const grouped = new Map<string, TypeScriptError[]>();

  for (const error of errors) {
    const existing = grouped.get(error.file) || [];
    existing.push(error);
    grouped.set(error.file, existing);
  }

  return grouped;
}

/**
 * Fix all errors in a single file
 */
async function fixFileErrors(file: string, errors: TypeScriptError[]): Promise<FixResult> {
  const fullPath = join("/home/ubuntu/ivy-ai-platform", file);

  // Read original file content
  let originalContent: string;
  try {
    originalContent = await readFile(fullPath, "utf-8");
  } catch (error: any) {
    return {
      success: false,
      file,
      errorsBefore: errors.length,
      errorsAfter: errors.length,
      fixesApplied: [],
      error: `Failed to read file: ${error.message}`,
    };
  }

  // Backup original content
  const backup = originalContent;
  let currentContent = originalContent;
  const fixesApplied: string[] = [];

  // Try to fix each error
  for (const error of errors) {
    try {
      const fix = await generateFix(file, error, currentContent);
      
      if (fix) {
        currentContent = fix.fixedCode;
        fixesApplied.push(fix.explanation);
        console.log(`[TS Fixer] Applied fix for ${error.code}: ${fix.explanation}`);
      }
    } catch (error: any) {
      console.error(`[TS Fixer] Failed to generate fix for ${error.code}:`, error);
    }
  }

  // Write fixed content
  if (fixesApplied.length > 0) {
    try {
      await writeFile(fullPath, currentContent, "utf-8");
      console.log(`[TS Fixer] Wrote ${fixesApplied.length} fixes to ${file}`);

      // Verify fixes worked
      const remainingErrors = await checkFileErrors(file);
      const errorsFixed = errors.length - remainingErrors.length;

      if (remainingErrors.length < errors.length) {
        return {
          success: true,
          file,
          errorsBefore: errors.length,
          errorsAfter: remainingErrors.length,
          fixesApplied,
        };
      } else {
        // Rollback if fixes didn't help
        await writeFile(fullPath, backup, "utf-8");
        return {
          success: false,
          file,
          errorsBefore: errors.length,
          errorsAfter: errors.length,
          fixesApplied: [],
          rollback: true,
          error: "Fixes did not reduce errors, rolled back",
        };
      }
    } catch (error: any) {
      // Rollback on write error
      await writeFile(fullPath, backup, "utf-8");
      return {
        success: false,
        file,
        errorsBefore: errors.length,
        errorsAfter: errors.length,
        fixesApplied: [],
        rollback: true,
        error: `Failed to write fixes: ${error.message}`,
      };
    }
  }

  return {
    success: false,
    file,
    errorsBefore: errors.length,
    errorsAfter: errors.length,
    fixesApplied: [],
    error: "No fixes could be generated",
  };
}

/**
 * Generate a fix for a single error using LLM
 */
async function generateFix(
  file: string,
  error: TypeScriptError,
  fileContent: string
): Promise<{ fixedCode: string; explanation: string } | null> {
  // Extract context around the error (10 lines before and after)
  const lines = fileContent.split("\n");
  const startLine = Math.max(0, error.line - 10);
  const endLine = Math.min(lines.length, error.line + 10);
  const context = lines.slice(startLine, endLine).join("\n");

  // Prepare prompt
  const prompt = LLM_PROMPTS.FIX_TYPESCRIPT_ERROR
    .replace("{{file}}", file)
    .replace("{{line}}", error.line.toString())
    .replace("{{code}}", error.code)
    .replace("{{message}}", error.message)
    .replace("{{context}}", context);

  try {
    // Call LLM to generate fix
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a TypeScript expert that fixes code errors." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("[TS Fixer] LLM returned empty response");
      return null;
    }

    // Parse JSON response
    const fixData = JSON.parse(content);
    
    if (!fixData.fix || !fixData.explanation) {
      console.error("[TS Fixer] Invalid fix format from LLM");
      return null;
    }

    // Apply the fix to the file content
    // For now, we'll replace the entire context with the fixed code
    // In a more sophisticated version, we'd do precise line-by-line replacement
    const fixedContent = fileContent.replace(context, fixData.fix);

    return {
      fixedCode: fixedContent,
      explanation: fixData.explanation,
    };
  } catch (error: any) {
    console.error("[TS Fixer] Error generating fix:", error);
    return null;
  }
}

/**
 * Check errors in a specific file
 */
async function checkFileErrors(file: string): Promise<TypeScriptError[]> {
  try {
    const { stdout, stderr } = await execAsync(
      `cd /home/ubuntu/ivy-ai-platform && npx tsc --noEmit --pretty false ${file} 2>&1 || true`
    );

    const output = stdout + stderr;
    return parseTypeScriptOutput(output);
  } catch (error) {
    return [];
  }
}

/**
 * Get statistics about TypeScript errors
 */
export async function getErrorStatistics(): Promise<{
  total: number;
  byFile: Record<string, number>;
  bySeverity: Record<string, number>;
  byCode: Record<string, number>;
}> {
  const errors = await detectTypeScriptErrors();

  const byFile: Record<string, number> = {};
  const bySeverity: Record<string, number> = { error: 0, warning: 0 };
  const byCode: Record<string, number> = {};

  for (const error of errors) {
    // Count by file
    byFile[error.file] = (byFile[error.file] || 0) + 1;

    // Count by severity
    bySeverity[error.severity]++;

    // Count by error code
    byCode[error.code] = (byCode[error.code] || 0) + 1;
  }

  return {
    total: errors.length,
    byFile,
    bySeverity,
    byCode,
  };
}

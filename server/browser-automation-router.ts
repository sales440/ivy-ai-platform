import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  executeBrowserAction,
  getPageContent,
  initBrowser,
  closeBrowser,
  restartBrowser,
  type BrowserAction,
} from "./browserAutomation";

/**
 * Browser Automation Router
 * Provides ROPA with browser control capabilities
 */

export const browserAutomationRouter = router({
  /**
   * Initialize browser instance
   */
  init: protectedProcedure.mutation(async () => {
    try {
      await initBrowser();
      return { success: true, message: "Browser initialized successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }),

  /**
   * Execute a browser action
   */
  executeAction: protectedProcedure
    .input(
      z.object({
        type: z.enum(['navigate', 'click', 'type', 'scroll', 'screenshot', 'evaluate', 'waitForSelector']),
        selector: z.string().optional(),
        url: z.string().optional(),
        text: z.string().optional(),
        x: z.number().optional(),
        y: z.number().optional(),
        code: z.string().optional(),
        timeout: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const action: BrowserAction = {
        type: input.type,
        selector: input.selector,
        url: input.url,
        text: input.text,
        x: input.x,
        y: input.y,
        code: input.code,
        timeout: input.timeout,
      };

      const result = await executeBrowserAction(action);
      return result;
    }),

  /**
   * Navigate to URL
   */
  navigate: protectedProcedure
    .input(z.object({ url: z.string() }))
    .mutation(async ({ input }) => {
      return await executeBrowserAction({ type: 'navigate', url: input.url });
    }),

  /**
   * Click element
   */
  click: protectedProcedure
    .input(z.object({ selector: z.string() }))
    .mutation(async ({ input }) => {
      return await executeBrowserAction({ type: 'click', selector: input.selector });
    }),

  /**
   * Type text into element
   */
  type: protectedProcedure
    .input(z.object({ selector: z.string(), text: z.string() }))
    .mutation(async ({ input }) => {
      return await executeBrowserAction({
        type: 'type',
        selector: input.selector,
        text: input.text,
      });
    }),

  /**
   * Take screenshot
   */
  screenshot: protectedProcedure.mutation(async () => {
    return await executeBrowserAction({ type: 'screenshot' });
  }),

  /**
   * Get page content
   */
  getContent: protectedProcedure.query(async () => {
    try {
      const content = await getPageContent();
      return { success: true, ...content };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }),

  /**
   * Evaluate JavaScript code on page
   */
  evaluate: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      return await executeBrowserAction({ type: 'evaluate', code: input.code });
    }),

  /**
   * Scroll to element or coordinates
   */
  scroll: protectedProcedure
    .input(
      z.object({
        selector: z.string().optional(),
        x: z.number().optional(),
        y: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await executeBrowserAction({
        type: 'scroll',
        selector: input.selector,
        x: input.x,
        y: input.y,
      });
    }),

  /**
   * Wait for selector
   */
  waitForSelector: protectedProcedure
    .input(z.object({ selector: z.string(), timeout: z.number().optional() }))
    .mutation(async ({ input }) => {
      return await executeBrowserAction({
        type: 'waitForSelector',
        selector: input.selector,
        timeout: input.timeout,
      });
    }),

  /**
   * Close browser
   */
  close: protectedProcedure.mutation(async () => {
    try {
      await closeBrowser();
      return { success: true, message: "Browser closed successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }),

  /**
   * Restart browser
   */
  restart: protectedProcedure.mutation(async () => {
    try {
      await restartBrowser();
      return { success: true, message: "Browser restarted successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }),
});

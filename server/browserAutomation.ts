import puppeteer, { Browser, Page } from 'puppeteer';

/**
 * Browser Automation Service for ROPA
 * Allows ROPA to control the Ivy.AI dashboard UI directly
 */

let browser: Browser | null = null;
let currentPage: Page | null = null;

export interface BrowserAction {
  type: 'navigate' | 'click' | 'type' | 'scroll' | 'screenshot' | 'evaluate' | 'waitForSelector';
  selector?: string;
  url?: string;
  text?: string;
  x?: number;
  y?: number;
  code?: string;
  timeout?: number;
}

export interface BrowserActionResult {
  success: boolean;
  data?: any;
  screenshot?: string;
  error?: string;
}

/**
 * Initialize browser instance
 */
export async function initBrowser(): Promise<void> {
  if (browser) {
    return;
  }

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });
    console.log('[BrowserAutomation] Browser initialized');
  } catch (error) {
    console.error('[BrowserAutomation] Failed to initialize browser:', error);
    throw error;
  }
}

/**
 * Get or create a page
 */
async function getPage(): Promise<Page> {
  if (!browser) {
    await initBrowser();
  }

  if (!currentPage) {
    currentPage = await browser!.newPage();
    await currentPage.setViewport({ width: 1920, height: 1080 });
  }

  return currentPage;
}

/**
 * Execute a browser action
 */
export async function executeBrowserAction(action: BrowserAction): Promise<BrowserActionResult> {
  try {
    const page = await getPage();

    switch (action.type) {
      case 'navigate':
        if (!action.url) {
          return { success: false, error: 'URL is required for navigate action' };
        }
        await page.goto(action.url, { waitUntil: 'networkidle2', timeout: action.timeout || 30000 });
        return { success: true, data: { url: page.url() } };

      case 'click':
        if (!action.selector) {
          return { success: false, error: 'Selector is required for click action' };
        }
        await page.waitForSelector(action.selector, { timeout: action.timeout || 10000 });
        await page.click(action.selector);
        return { success: true };

      case 'type':
        if (!action.selector || !action.text) {
          return { success: false, error: 'Selector and text are required for type action' };
        }
        await page.waitForSelector(action.selector, { timeout: action.timeout || 10000 });
        await page.type(action.selector, action.text);
        return { success: true };

      case 'scroll':
        if (action.x !== undefined && action.y !== undefined) {
          await page.evaluate((x, y) => window.scrollTo(x, y), action.x, action.y);
        } else if (action.selector) {
          await page.waitForSelector(action.selector, { timeout: action.timeout || 10000 });
          await page.evaluate((sel) => {
            const element = document.querySelector(sel);
            if (element) element.scrollIntoView({ behavior: 'smooth' });
          }, action.selector);
        }
        return { success: true };

      case 'screenshot':
        const screenshot = await page.screenshot({ encoding: 'base64', fullPage: false });
        return { success: true, screenshot: screenshot as string };

      case 'evaluate':
        if (!action.code) {
          return { success: false, error: 'Code is required for evaluate action' };
        }
        const result = await page.evaluate((code) => eval(code), action.code);
        return { success: true, data: result };

      case 'waitForSelector':
        if (!action.selector) {
          return { success: false, error: 'Selector is required for waitForSelector action' };
        }
        await page.waitForSelector(action.selector, { timeout: action.timeout || 10000 });
        return { success: true };

      default:
        return { success: false, error: `Unknown action type: ${action.type}` };
    }
  } catch (error: any) {
    console.error('[BrowserAutomation] Action failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Get current page content
 */
export async function getPageContent(): Promise<{ html: string; url: string }> {
  const page = await getPage();
  const html = await page.content();
  const url = page.url();
  return { html, url };
}

/**
 * Close browser
 */
export async function closeBrowser(): Promise<void> {
  if (currentPage) {
    await currentPage.close();
    currentPage = null;
  }
  if (browser) {
    await browser.close();
    browser = null;
    console.log('[BrowserAutomation] Browser closed');
  }
}

/**
 * Restart browser (useful for cleanup)
 */
export async function restartBrowser(): Promise<void> {
  await closeBrowser();
  await initBrowser();
}

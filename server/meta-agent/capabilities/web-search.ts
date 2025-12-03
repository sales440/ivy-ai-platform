/**
 * Web Search Service for Meta-Agent
 * Provides real-time Internet access for searching information
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface WebPageContent {
  url: string;
  title: string;
  content: string;
  metaDescription?: string;
  links: string[];
  images: string[];
}

export interface APIResponse {
  source: string;
  data: any;
  timestamp: Date;
}

/**
 * Search the web using DuckDuckGo Instant Answer API (no API key required)
 */
export async function searchWeb(query: string, maxResults: number = 5): Promise<SearchResult[]> {
  try {
    // Use DuckDuckGo HTML search (no API key needed)
    const response = await axios.get('https://html.duckduckgo.com/html/', {
      params: { q: query },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const results: SearchResult[] = [];

    $('.result').each((i, elem) => {
      if (results.length >= maxResults) return false;

      const titleElem = $(elem).find('.result__a');
      const snippetElem = $(elem).find('.result__snippet');
      const urlElem = $(elem).find('.result__url');

      const title = titleElem.text().trim();
      const snippet = snippetElem.text().trim();
      const url = urlElem.attr('href') || titleElem.attr('href') || '';

      if (title && url) {
        results.push({
          title,
          url: url.startsWith('//') ? 'https:' + url : url,
          snippet,
          source: 'DuckDuckGo'
        });
      }
    });

    return results;
  } catch (error) {
    console.error('[Web Search] Error:', error);
    return [];
  }
}

/**
 * Scrape content from a web page
 */
export async function scrapeWebPage(url: string): Promise<WebPageContent | null> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000,
      maxContentLength: 5 * 1024 * 1024 // 5MB limit
    });

    const $ = cheerio.load(response.data);

    // Remove script and style tags
    $('script, style, nav, footer, header').remove();

    // Extract main content
    const title = $('title').text().trim() || $('h1').first().text().trim();
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    
    // Try to find main content area
    let content = '';
    const mainSelectors = ['main', 'article', '.content', '#content', '.post', '.article'];
    for (const selector of mainSelectors) {
      const elem = $(selector);
      if (elem.length > 0) {
        content = elem.text().trim();
        break;
      }
    }
    
    // Fallback to body if no main content found
    if (!content) {
      content = $('body').text().trim();
    }

    // Clean up whitespace
    content = content.replace(/\s+/g, ' ').substring(0, 10000); // Limit to 10k chars

    // Extract links
    const links: string[] = [];
    $('a[href]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href && href.startsWith('http')) {
        links.push(href);
      }
    });

    // Extract images
    const images: string[] = [];
    $('img[src]').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src && src.startsWith('http')) {
        images.push(src);
      }
    });

    return {
      url,
      title,
      content,
      metaDescription,
      links: [...new Set(links)].slice(0, 20), // Unique links, max 20
      images: [...new Set(images)].slice(0, 10)  // Unique images, max 10
    };
  } catch (error) {
    console.error('[Web Scraper] Error:', error);
    return null;
  }
}

/**
 * Fetch data from public APIs
 */
export async function fetchPublicAPI(apiName: string, params?: Record<string, any>): Promise<APIResponse | null> {
  const apis: Record<string, { url: string; method: string }> = {
    // Weather API (no key required)
    'weather': {
      url: 'https://wttr.in/{location}?format=j1',
      method: 'GET'
    },
    // News API (free tier)
    'news': {
      url: 'https://newsapi.org/v2/top-headlines',
      method: 'GET'
    },
    // Exchange rates (no key required)
    'exchange-rates': {
      url: 'https://api.exchangerate-api.com/v4/latest/{currency}',
      method: 'GET'
    },
    // GitHub API (no key required for public data)
    'github': {
      url: 'https://api.github.com/{endpoint}',
      method: 'GET'
    },
    // IP geolocation (no key required)
    'ip-geo': {
      url: 'https://ipapi.co/{ip}/json/',
      method: 'GET'
    }
  };

  const api = apis[apiName];
  if (!api) {
    console.error('[API Fetch] Unknown API:', apiName);
    return null;
  }

  try {
    let url = api.url;
    
    // Replace placeholders in URL
    if (params) {
      Object.keys(params).forEach(key => {
        url = url.replace(`{${key}}`, params[key]);
      });
    }

    const response = await axios({
      method: api.method,
      url,
      params: api.method === 'GET' ? params : undefined,
      data: api.method === 'POST' ? params : undefined,
      timeout: 10000,
      headers: {
        'User-Agent': 'Ivy.AI Meta-Agent'
      }
    });

    return {
      source: apiName,
      data: response.data,
      timestamp: new Date()
    };
  } catch (error) {
    console.error(`[API Fetch] Error fetching ${apiName}:`, error);
    return null;
  }
}

/**
 * Validate URL and get metadata
 */
export async function validateURL(url: string): Promise<{
  valid: boolean;
  status?: number;
  title?: string;
  description?: string;
  error?: string;
}> {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      maxRedirects: 5,
      validateStatus: () => true // Accept any status
    });

    if (response.status >= 200 && response.status < 400) {
      // URL is valid, try to get metadata
      const pageContent = await scrapeWebPage(url);
      
      return {
        valid: true,
        status: response.status,
        title: pageContent?.title,
        description: pageContent?.metaDescription
      };
    } else {
      return {
        valid: false,
        status: response.status,
        error: `HTTP ${response.status}`
      };
    }
  } catch (error: any) {
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Monitor external website for changes
 */
export async function monitorWebsite(url: string, selector?: string): Promise<{
  url: string;
  content: string;
  hash: string;
  timestamp: Date;
} | null> {
  try {
    const pageContent = await scrapeWebPage(url);
    if (!pageContent) return null;

    let contentToMonitor = pageContent.content;
    
    // If selector provided, try to extract specific content
    if (selector) {
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 10000
      });
      const $ = cheerio.load(response.data);
      const selectedContent = $(selector).text().trim();
      if (selectedContent) {
        contentToMonitor = selectedContent;
      }
    }

    // Create simple hash of content
    const hash = Buffer.from(contentToMonitor).toString('base64').substring(0, 32);

    return {
      url,
      content: contentToMonitor.substring(0, 5000), // Limit to 5k chars
      hash,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('[Website Monitor] Error:', error);
    return null;
  }
}

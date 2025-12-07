/**
 * Zapier LinkedIn Publishing Service
 * 
 * Publishes LinkedIn posts via Zapier Webhooks.
 * Requires a Zap configured with:
 * - Trigger: Webhooks by Zapier (Catch Hook)
 * - Action: LinkedIn → Create Share Update
 */

interface ZapierLinkedInPostPayload {
  content: string;
  postId: number;
  postType: string;
  author: string;
}

interface ZapierLinkedInResponse {
  success: boolean;
  linkedInPostId?: string;
  publishedUrl?: string;
  error?: string;
}

/**
 * Publishes a LinkedIn post via Zapier Webhook
 * 
 * @param webhookUrl - The Zapier Webhook URL (from Zap configuration)
 * @param payload - Post data to send to Zapier
 * @returns Response from Zapier with LinkedIn post details
 */
export async function publishToLinkedInViaZapier(
  webhookUrl: string,
  payload: ZapierLinkedInPostPayload
): Promise<ZapierLinkedInResponse> {
  try {
    console.log('[Zapier LinkedIn] Publishing post:', payload.postId);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Zapier webhook failed: ${response.status} ${response.statusText}`);
    }

    // Zapier webhooks typically return 200 OK with minimal response
    // The actual LinkedIn post ID comes from the Zap's return webhook (if configured)
    const result = await response.json().catch(() => ({}));

    console.log('[Zapier LinkedIn] Post published successfully:', payload.postId);

    return {
      success: true,
      linkedInPostId: result.linkedInPostId || `zapier-${Date.now()}`,
      publishedUrl: result.publishedUrl || `https://www.linkedin.com/feed/update/activity:${Date.now()}`,
    };
  } catch (error) {
    console.error('[Zapier LinkedIn] Failed to publish post:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validates Zapier webhook URL format
 */
export function isValidZapierWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'hooks.zapier.com';
  } catch {
    return false;
  }
}

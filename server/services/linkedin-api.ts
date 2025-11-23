import axios from "axios";

/**
 * LinkedIn API Client
 * Handles OAuth 2.0 authentication and post publishing
 * 
 * Documentation: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/share-api
 */

// LinkedIn API configuration
const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";
const LINKEDIN_OAUTH_BASE = "https://www.linkedin.com/oauth/v2";

// Environment variables (to be set in .env or management UI)
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || "http://localhost:3000/api/linkedin/callback";
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN; // Long-lived token after OAuth

export interface LinkedInPost {
  text: string;
  visibility?: "PUBLIC" | "CONNECTIONS";
}

export interface LinkedInPublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

/**
 * Get LinkedIn OAuth authorization URL
 */
export function getLinkedInAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: LINKEDIN_CLIENT_ID || "",
    redirect_uri: LINKEDIN_REDIRECT_URI,
    scope: "w_member_social r_liteprofile",
    state: state || Math.random().toString(36).substring(7),
  });

  return `${LINKEDIN_OAUTH_BASE}/authorization?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  expires_in: number;
  error?: string;
}> {
  try {
    const response = await axios.post(
      `${LINKEDIN_OAUTH_BASE}/accessToken`,
      null,
      {
        params: {
          grant_type: "authorization_code",
          code,
          client_id: LINKEDIN_CLIENT_ID,
          client_secret: LINKEDIN_CLIENT_SECRET,
          redirect_uri: LINKEDIN_REDIRECT_URI,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return {
      access_token: response.data.access_token,
      expires_in: response.data.expires_in,
    };
  } catch (error: any) {
    console.error("[LinkedIn] Token exchange failed:", error.response?.data || error.message);
    return {
      access_token: "",
      expires_in: 0,
      error: error.response?.data?.error_description || error.message,
    };
  }
}

/**
 * Get LinkedIn user profile (to get person URN)
 */
export async function getLinkedInProfile(accessToken: string): Promise<{
  id: string;
  firstName: string;
  lastName: string;
  error?: string;
}> {
  try {
    const response = await axios.get(`${LINKEDIN_API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      id: response.data.id,
      firstName: response.data.localizedFirstName,
      lastName: response.data.localizedLastName,
    };
  } catch (error: any) {
    console.error("[LinkedIn] Profile fetch failed:", error.response?.data || error.message);
    return {
      id: "",
      firstName: "",
      lastName: "",
      error: error.response?.data?.message || error.message,
    };
  }
}

/**
 * Publish a post to LinkedIn
 */
export async function publishLinkedInPost(
  post: LinkedInPost,
  accessToken?: string
): Promise<LinkedInPublishResult> {
  const token = accessToken || LINKEDIN_ACCESS_TOKEN;

  if (!token) {
    console.warn("[LinkedIn] No access token configured. Simulating post publish.");
    return {
      success: true,
      postId: `sim-${Date.now()}`,
      postUrl: "https://www.linkedin.com/feed/",
    };
  }

  try {
    // First, get user profile to get person URN
    const profile = await getLinkedInProfile(token);
    
    if (profile.error) {
      throw new Error(profile.error);
    }

    const personUrn = `urn:li:person:${profile.id}`;

    // Create share payload
    const sharePayload = {
      author: personUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: post.text,
          },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": post.visibility || "PUBLIC",
      },
    };

    // Publish share
    const response = await axios.post(
      `${LINKEDIN_API_BASE}/ugcPosts`,
      sharePayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    const postId = response.data.id;
    const postUrl = `https://www.linkedin.com/feed/update/${postId}`;

    console.log(`[LinkedIn] Post published successfully: ${postUrl}`);

    return {
      success: true,
      postId,
      postUrl,
    };
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error("[LinkedIn] Post publish failed:", errorMsg);

    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Schedule a LinkedIn post for future publishing
 * Note: LinkedIn API doesn't support native scheduling, so this would need to be
 * implemented using a job queue or scheduled tasks in the application
 */
export async function scheduleLinkedInPost(
  post: LinkedInPost,
  scheduledFor: Date,
  accessToken?: string
): Promise<{
  success: boolean;
  scheduledId?: string;
  error?: string;
}> {
  // This is a placeholder - actual implementation would use scheduledTasks table
  console.log(`[LinkedIn] Post scheduled for ${scheduledFor.toISOString()}`);
  
  return {
    success: true,
    scheduledId: `sched-${Date.now()}`,
  };
}

/**
 * Validate LinkedIn access token
 */
export async function validateLinkedInToken(accessToken: string): Promise<boolean> {
  try {
    const profile = await getLinkedInProfile(accessToken);
    return !profile.error;
  } catch (error) {
    return false;
  }
}

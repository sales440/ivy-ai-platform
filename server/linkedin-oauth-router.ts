import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getLinkedInAuthUrl,
  exchangeCodeForToken,
  validateLinkedInToken,
} from "./services/linkedin-api";

/**
 * LinkedIn OAuth Router
 * Handles LinkedIn authentication flow
 */

export const linkedInOAuthRouter = router({
  /**
   * Get LinkedIn authorization URL
   */
  getAuthUrl: protectedProcedure.query(() => {
    const authUrl = getLinkedInAuthUrl();
    return { authUrl };
  }),

  /**
   * Exchange authorization code for access token
   */
  exchangeToken: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      const result = await exchangeCodeForToken(input.code);

      if (result.error) {
        throw new Error(result.error);
      }

      return {
        accessToken: result.access_token,
        expiresIn: result.expires_in,
      };
    }),

  /**
   * Validate LinkedIn access token
   */
  validateToken: protectedProcedure
    .input(z.object({ accessToken: z.string() }))
    .query(async ({ input }) => {
      const isValid = await validateLinkedInToken(input.accessToken);
      return { isValid };
    }),
});

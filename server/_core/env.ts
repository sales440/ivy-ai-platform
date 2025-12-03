export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Telnyx API Configuration
  telnyxApiKey: process.env.TELNYX_API_KEY ?? "",
  telnyxConnectionId: process.env.TELNYX_CONNECTION_ID ?? "",
  telnyxPhoneNumber: process.env.TELNYX_PHONE_NUMBER ?? "",
  telnyxMessagingProfileId: process.env.TELNYX_MESSAGING_PROFILE_ID ?? "",
};

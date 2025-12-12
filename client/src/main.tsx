// import { trpc } from "@/lib/trpc";
// import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
// import superjson from "superjson";
// import App from "./App";
// import { getLoginUrl } from "./const";
import "./index.css";
import { initSentry } from "./lib/sentry";

// Initialize Sentry
console.log("DEBUG: About to init Sentry");
try {
  initSentry();
  console.log("DEBUG: Sentry init success");
} catch (e) {
  console.error("DEBUG: Sentry init failed", e);
}

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <div style={{ background: 'purple', padding: 50, fontSize: 30, color: 'white' }}>
    <h1>STAGE 3 DEBUG MODE</h1>
    <p>React Loaded.</p>
    <p>Sentry Initialized (Check Console for errors).</p>
    <p>TRPC and App DISABLED.</p>
    <p>If you see PURPLE, Sentry is safe.</p>
  </div>
);

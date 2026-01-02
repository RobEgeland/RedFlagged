"use client";

import { PostHogProvider } from "posthog-js/react";

export function PostHogProviderWrapper({ children }: { children: React.ReactNode }) {
  // Only render PostHog provider on client side to prevent hydration issues
  if (typeof window === "undefined") {
    return <>{children}</>;
  }

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!apiKey) {
    // No API key, just render children
    return <>{children}</>;
  }

  return (
    <PostHogProvider
      apiKey={apiKey}
      options={{
        api_host: "/ingest",
        ui_host: "https://us.posthog.com",
        defaults: "2025-05-24",
        capture_exceptions: true,
        debug: process.env.NODE_ENV === "development",
      }}
    >
      {children}
    </PostHogProvider>
  );
}

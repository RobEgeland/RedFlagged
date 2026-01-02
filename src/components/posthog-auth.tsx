"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { usePostHog } from "posthog-js/react";

/**
 * PostHog Auth Component
 * Identifies users when they sign in with Clerk
 */
export function PostHogAuth() {
  const { user, isSignedIn } = useUser();
  const posthog = usePostHog();
  const [isMounted, setIsMounted] = useState(false);

  // Ensure this only runs on the client after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only run after component is mounted on client
    if (!isMounted) return;
    
    // Wait for PostHog to be initialized
    if (!posthog) return;

    if (isSignedIn && user) {
      // Identify the user with PostHog
      posthog.identify(user.id, {
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt?.toISOString(),
      });
    } else if (!isSignedIn) {
      // Reset identification when user signs out
      posthog.reset();
    }
  }, [isMounted, isSignedIn, user, posthog]);

  return null; // This component doesn't render anything
}


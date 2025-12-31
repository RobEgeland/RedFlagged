"use client";

import { SignUp } from "@clerk/nextjs";
import Navbar from "@/components/navbar";
import { useSearchParams } from "next/navigation";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const redirectUrl = redirectParam ? decodeURIComponent(redirectParam) : undefined;

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-sm border border-charcoal/20",
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl={redirectUrl ? `/sign-in?redirect=${encodeURIComponent(redirectUrl)}` : "/sign-in"}
          afterSignInUrl={redirectUrl || "/"}
          afterSignUpUrl={redirectUrl || "/"}
        />
      </div>
    </>
  );
}


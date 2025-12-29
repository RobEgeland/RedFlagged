"use client";

import { SignIn } from "@clerk/nextjs";
import Navbar from "@/components/navbar";

export default function SignInPage() {
  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-sm border border-charcoal/20",
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
        />
      </div>
    </>
  );
}


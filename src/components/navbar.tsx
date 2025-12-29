"use client";

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { Button } from './ui/button'
import { Flag } from 'lucide-react'
import UserProfile from './user-profile'

export default function Navbar() {
  const { isSignedIn } = useUser()


  return (
    <nav className="w-full border-b border-charcoal/10 bg-cream/80 backdrop-blur-sm py-3 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" prefetch className="flex items-center gap-2 group">
          <div className="p-1.5 bg-disaster rounded">
            <Flag className="w-4 h-4 text-cream" />
          </div>
          <span className="font-display text-xl font-bold text-charcoal tracking-tight">
            RedFlagged
          </span>
        </Link>
        <div className="flex gap-3 items-center">
          {isSignedIn ? (
            <>
              <Link href="/dashboard">
                <Button className="bg-charcoal hover:bg-charcoal/90 text-cream font-medium">
                  Dashboard
                </Button>
              </Link>
              <UserProfile />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-4 py-2 text-sm font-medium text-charcoal hover:text-charcoal/80 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 text-sm font-medium text-cream bg-charcoal rounded-md hover:bg-charcoal/90 transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

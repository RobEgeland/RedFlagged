"use client";

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { Button } from './ui/button'
import { Flag } from 'lucide-react'
import UserProfile from './user-profile'

export default function Navbar() {
  const { isSignedIn } = useUser()


  return (
    <nav className="w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md py-4 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" prefetch className="flex items-center gap-2.5 group">
          <div className="p-1.5 bg-slate-900 rounded-lg">
            <Flag className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            RedFlagged
          </span>
        </Link>

        {/* Center navigation links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#analyze" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            Analyze
          </a>
          <a href="#pricing" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            Pricing
          </a>
        </div>

        <div className="flex gap-3 items-center">
          {isSignedIn ? (
            <>
              <Link href="/dashboard">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg">
                  Dashboard
                </Button>
              </Link>
              <UserProfile />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

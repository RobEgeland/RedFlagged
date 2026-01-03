"use client";

import { useState } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { Button } from './ui/button'
import UserProfile from './user-profile'
import Logo from './logo'
import { Menu, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from './ui/sheet'

export default function Navbar() {
  const { isSignedIn } = useUser()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md py-1 sticky top-0 z-50 h-[70px]">
      <div className="w-full h-full flex justify-between items-center px-6 md:px-8 lg:px-12">
        <Link href="/" prefetch className="flex items-center gap-2.5 group h-full">
          <Logo width={150} height={150} className="flex-shrink-0 h-full w-auto object-contain" />
          <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            RedFlagged
          </span>
        </Link>

        {/* Center navigation links - Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#analyze" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            Analyze
          </a>
          <a href="#pricing" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            Pricing
          </a>
        </div>

        {/* Right side - Desktop */}
        <div className="hidden md:flex gap-3 items-center">
          {isSignedIn ? (
            <>
              <Link href="/dashboard">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg min-h-[44px] px-4">
                  Dashboard
                </Button>
              </Link>
              <UserProfile />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors min-h-[44px] flex items-center"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors min-h-[44px] flex items-center"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          {isSignedIn && (
            <Link href="/dashboard">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg min-h-[44px] px-3 text-sm">
                Dashboard
              </Button>
            </Link>
          )}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-6 mt-8">
                <Link
                  href="#analyze"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-slate-900 hover:text-slate-600 transition-colors py-2"
                >
                  Analyze
                </Link>
                <Link
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-slate-900 hover:text-slate-600 transition-colors py-2"
                >
                  Pricing
                </Link>
                <div className="border-t border-slate-200 pt-4 mt-4">
                  {isSignedIn ? (
                    <div className="flex flex-col gap-4">
                      <UserProfile />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Link
                        href="/sign-in"
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-4 py-3 text-base font-medium text-slate-600 hover:text-slate-900 transition-colors text-center border border-slate-200 rounded-lg"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/sign-up"
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-4 py-3 text-base font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors text-center"
                      >
                        Get Started
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}

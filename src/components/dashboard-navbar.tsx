'use client'

import Link from 'next/link'
import { useClerk, useUser } from '@clerk/nextjs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Button } from './ui/button'
import { Flag, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DashboardNavbar() {
  const { signOut } = useClerk()
  const { user } = useUser()
  const router = useRouter()

  // Get first letter of first name, or fallback to email first letter
  const getInitial = () => {
    if (user?.firstName) {
      return user.firstName.charAt(0).toUpperCase()
    }
    if (user?.emailAddresses?.[0]?.emailAddress) {
      return user.emailAddresses[0].emailAddress.charAt(0).toUpperCase()
    }
    return 'U'
  }

  return (
    <nav className="w-full border-b border-charcoal/10 bg-cream/80 backdrop-blur-sm py-3 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/" prefetch className="flex items-center gap-2 group">
            <div className="p-1.5 bg-disaster rounded">
              <Flag className="w-4 h-4 text-cream" />
            </div>
            <span className="font-display text-xl font-bold text-charcoal tracking-tight">
              RedFlagged
            </span>
          </Link>
          <Link 
            href="/" 
            className="flex items-center gap-1.5 text-sm text-charcoal/60 hover:text-charcoal transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </div>
        <div className="flex gap-4 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-charcoal/10 rounded-full">
                <div className="w-8 h-8 rounded-full bg-charcoal text-cream flex items-center justify-center font-semibold text-sm">
                  {getInitial()}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-cream border-charcoal/20">
              <DropdownMenuItem 
                onClick={async () => {
                  await signOut()
                  router.push("/")
                }}
                className="cursor-pointer"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}

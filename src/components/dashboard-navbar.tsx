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
import { Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Logo from './logo'

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
    <nav className="w-full border-b border-charcoal/10 bg-cream/80 backdrop-blur-sm py-1 sticky top-0 z-50 h-[70px]">
      <div className="w-full h-full flex justify-between items-center px-6 md:px-8 lg:px-12">
        <div className="flex items-center gap-6 h-full">
          <Link href="/" prefetch className="flex items-center gap-2 group h-full">
            <Logo width={150} height={150} className="flex-shrink-0 h-full w-auto object-contain" />
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

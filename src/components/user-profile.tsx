'use client'
import { Button } from './ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { useClerk, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function UserProfile() {
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
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-sm">
                        {getInitial()}
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={async () => {
                    await signOut()
                    router.push("/")
                }}>
                    Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

    )
}
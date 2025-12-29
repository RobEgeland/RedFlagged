import { redirect } from 'next/navigation';
import { checkUserSubscription } from '@/app/actions';
import { auth } from '@clerk/nextjs/server';

interface SubscriptionCheckProps {
    children: React.ReactNode;
    redirectTo?: string;
}

export async function SubscriptionCheck({
    children,
    redirectTo = '/pricing'
}: SubscriptionCheckProps) {
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    const isSubscribed = await checkUserSubscription(userId);

    if (!isSubscribed) {
        redirect(redirectTo);
    }

    return <>{children}</>;
}

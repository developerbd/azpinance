import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
    return (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Portal Not Found</h2>
            <p className="max-w-md text-muted-foreground">
                The link you used is invalid, expired, or has been deactivated. Please contact the administrator for a new link.
            </p>
        </div>
    )
}

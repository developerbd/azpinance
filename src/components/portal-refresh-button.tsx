'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export function PortalRefreshButton() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleRefresh = () => {
        setLoading(true)
        router.refresh()
        setTimeout(() => {
            setLoading(false)
            toast.success('Data refreshed')
        }, 1000)
    }

    return (
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
        </Button>
    )
}

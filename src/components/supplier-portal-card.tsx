'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, RefreshCw, ExternalLink } from 'lucide-react'
import { togglePortalAccess, regeneratePortalToken } from '@/actions/portal-actions'
import { toast } from 'sonner'

interface SupplierPortalCardProps {
    contactId: string
    isActive: boolean
    portalToken: string | null
}

export function SupplierPortalCard({ contactId, isActive: initialActive, portalToken: initialToken }: SupplierPortalCardProps) {
    const [isActive, setIsActive] = useState(initialActive)
    const [token, setToken] = useState(initialToken)
    const [loading, setLoading] = useState(false)

    const [portalLink, setPortalLink] = useState('')

    useEffect(() => {
        if (initialToken) {
            const origin = typeof window !== 'undefined' ? window.location.origin : ''
            const domain = process.env.NEXT_PUBLIC_SITE_URL || origin
            setPortalLink(`${domain}/portal/${initialToken}`)
        }
    }, [initialToken])

    // Update link if token changes (e.g. after regenerate)
    useEffect(() => {
        if (token) {
            const origin = typeof window !== 'undefined' ? window.location.origin : ''
            const domain = process.env.NEXT_PUBLIC_SITE_URL || origin
            setPortalLink(`${domain}/portal/${token}`)
        } else {
            setPortalLink('')
        }
    }, [token])

    const handleToggle = async (checked: boolean) => {
        setLoading(true)
        try {
            await togglePortalAccess(contactId, checked)
            setIsActive(checked)
            if (checked && !token) {
                // If enabling and no token, the server generates one. We need to refresh or the parent should revalidate.
                // But since we are client side, we wait for revalidation or just toast. 
                // Ideally we should get the new token back, but for now let's rely on Next.js revalidation refreshing the page prop.
                toast.success('Portal access enabled')
                // Force refresh to get token
                window.location.reload()
            } else {
                toast.success(checked ? 'Portal enabled' : 'Portal disabled')
            }
        } catch (error) {
            toast.error('Failed to update portal access')
            // Revert switch
            setIsActive(!checked)
        } finally {
            setLoading(false)
        }
    }

    const handleRegenerate = async () => {
        if (!confirm('Are you sure? The old link will stop working immediately.')) return;

        setLoading(true)
        try {
            await regeneratePortalToken(contactId)
            toast.success('Token regenerated')
            window.location.reload()
        } catch (error) {
            toast.error('Failed to regenerate token')
        } finally {
            setLoading(false)
        }
    }

    const copyLink = () => {
        navigator.clipboard.writeText(portalLink)
        toast.success('Link copied to clipboard')
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Supplier Portal</CardTitle>
                        <CardDescription>Manage public access for this supplier</CardDescription>
                    </div>
                    <Switch
                        checked={isActive}
                        onCheckedChange={handleToggle}
                        disabled={loading}
                    />
                </div>
            </CardHeader>
            {isActive && (
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Public View Link</Label>
                        <div className="flex gap-2">
                            <Input readOnly value={portalLink} className="bg-muted" />
                            <Button variant="outline" size="icon" onClick={copyLink}>
                                <Copy className="h-4 w-4" />
                            </Button>
                            <a href={portalLink} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="icon">
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </a>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button variant="ghost" size="sm" onClick={handleRegenerate} disabled={loading} className="text-destructive hover:text-destructive">
                            <RefreshCw className="mr-2 h-3 w-3" />
                            Regenerate Link
                        </Button>
                    </div>
                </CardContent>
            )}
        </Card>
    )
}

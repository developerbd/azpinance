import { getSupplierPortalData } from '@/app/actions/portal-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils' // Assuming this exists, if not will mock
import { Badge } from '@/components/ui/badge'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { CreditCard, DollarSign, Wallet } from 'lucide-react'
import { PortalRefreshButton } from '@/components/portal-refresh-button'
import { PortalPagination } from '@/components/portal-pagination'

// Helper for currency formatting if utility is missing (Removed in favor of import)

export default async function PortalPage({
    params,
    searchParams
}: {
    params: Promise<{ token: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { token } = await params
    const resolvedSearchParams = await searchParams

    const forexPage = Number(resolvedSearchParams.forexPage) || 1
    const payPage = Number(resolvedSearchParams.payPage) || 1

    let data
    try {
        data = await getSupplierPortalData(token, forexPage, payPage)
    } catch (error) {
        notFound()
    }

    const { contact, stats, transactions, payments } = data

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Welcome, {contact.name}</h2>
                    <p className="text-muted-foreground mt-1">
                        {contact.company_name ? `${contact.company_name} • ` : ''} {contact.email}
                    </p>
                </div>
                <PortalRefreshButton />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-500/20 dark:via-blue-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Forex Volume</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(stats.totalForexUSD)}</div>
                        <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1 font-medium">Lifetime transaction volume (USD)</p>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent dark:from-purple-500/20 dark:via-purple-500/10">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">This Month</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(stats.currentMonthForexUSD)}</div>
                        <p className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-1 font-medium">Volume in {format(new Date(), 'MMMM')} (USD)</p>
                    </CardContent>
                </Card>

                <Card className={`overflow-hidden border-none shadow-lg bg-gradient-to-br ${stats.currentDue > 0 ? 'from-red-500/10 via-red-500/5 dark:from-red-900/20' : 'from-green-500/10 via-green-500/5 dark:from-green-900/20'} to-transparent`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${stats.currentDue > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>Current Due</CardTitle>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${stats.currentDue > 0 ? 'bg-red-100 dark:bg-red-900/50' : 'bg-green-100 dark:bg-green-900/50'}`}>
                            <Wallet className={`h-4 w-4 ${stats.currentDue > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${stats.currentDue > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {formatCurrency(stats.currentDue, 'BDT')}
                        </div>
                        <p className={`text-xs mt-1 font-medium ${stats.currentDue > 0 ? 'text-red-600/80 dark:text-red-400/80' : 'text-green-600/80 dark:text-green-400/80'}`}>
                            {stats.currentDue > 0 ? 'Outstanding balance to be paid' : 'Account is fully paid'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Data Tables */}
            <Tabs defaultValue="forex">
                <TabsList>
                    <TabsTrigger value="forex">Forex Transactions</TabsTrigger>
                    <TabsTrigger value="payments">Payment History</TabsTrigger>
                </TabsList>

                <TabsContent value="forex" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Forex Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-x-auto">
                                <table className="w-full text-sm min-w-full">
                                    <thead className="bg-muted/50 border-b">
                                        <tr className="text-left">
                                            <th className="p-4 font-medium whitespace-nowrap">Date</th>
                                            <th className="p-4 font-medium whitespace-nowrap">ID</th>
                                            <th className="p-4 font-medium text-right whitespace-nowrap">Amount (USD)</th>
                                            <th className="p-4 font-medium text-right whitespace-nowrap">Rate</th>
                                            <th className="p-4 font-medium text-right whitespace-nowrap">Amount (BDT)</th>
                                            <th className="p-4 font-medium whitespace-nowrap">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-4 text-center text-muted-foreground">No transactions found</td>
                                            </tr>
                                        ) : (
                                            transactions.data.map((tx: any) => (
                                                <tr key={tx.id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 whitespace-nowrap">{format(new Date(tx.created_at), 'MMM dd, yyyy')}</td>
                                                    <td className="p-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{tx.transaction_id || '-'}</td>
                                                    <td className="p-4 text-right whitespace-nowrap">{formatCurrency(tx.amount)}</td>
                                                    <td className="p-4 text-right whitespace-nowrap">{tx.exchange_rate}</td>
                                                    <td className="p-4 text-right whitespace-nowrap">{formatCurrency(tx.amount_bdt, 'BDT')}</td>
                                                    <td className="p-4 whitespace-nowrap">
                                                        <Badge variant={tx.status === 'approved' ? 'default' : 'secondary'} className={tx.status === 'approved' ? 'bg-green-500 hover:bg-green-600' : ''}>
                                                            {tx.status}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        {/* Total Footer: Only Key Stats */}
                                        {transactions.data.length > 0 && (
                                            <tr className="bg-muted/50 font-medium">
                                                <td colSpan={2} className="p-4 text-right whitespace-nowrap">Total (All Time)</td>
                                                <td className="p-4 text-right whitespace-nowrap">{formatCurrency(stats.totalForexUSD)}</td>
                                                <td className="p-4 text-right whitespace-nowrap"> - </td>
                                                <td className="p-4 text-right whitespace-nowrap">{formatCurrency(stats.totalForexReceivablesBDT, 'BDT')}</td>
                                                <td colSpan={1}></td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <PortalPagination
                                totalPages={transactions.meta.totalPages}
                                currentPage={transactions.meta.page}
                                paramName="forexPage"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payments" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-x-auto">
                                <table className="w-full text-sm min-w-full">
                                    <thead className="bg-muted/50 border-b">
                                        <tr className="text-left">
                                            <th className="p-4 font-medium whitespace-nowrap">Date</th>
                                            <th className="p-4 font-medium whitespace-nowrap">Method</th>
                                            <th className="p-4 font-medium text-right whitespace-nowrap">Amount (BDT)</th>
                                            <th className="p-4 font-medium whitespace-nowrap">Reference</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-4 text-center text-muted-foreground">No payments found</td>
                                            </tr>
                                        ) : (
                                            payments.data.map((pay: any) => (
                                                <tr key={pay.id} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 whitespace-nowrap">{pay.date ? format(new Date(pay.date), 'MMM dd, yyyy') : '-'}</td>
                                                    <td className="p-4 capitalize whitespace-nowrap">{pay.transaction_method?.replace('_', ' ') || '-'}</td>
                                                    <td className="p-4 text-right whitespace-nowrap">{formatCurrency(pay.amount, 'BDT')}</td>
                                                    <td className="p-4 text-muted-foreground whitespace-nowrap">{pay.reference_id || '-'}</td>
                                                </tr>
                                            ))
                                        )}
                                        {payments.data.length > 0 && (
                                            <tr className="bg-muted/50 font-medium">
                                                <td colSpan={2} className="p-4 whitespace-nowrap">Total Paid</td>
                                                <td className="p-4 text-right whitespace-nowrap">{formatCurrency(stats.totalPayments, 'BDT')}</td>
                                                <td></td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <PortalPagination
                                totalPages={payments.meta.totalPages}
                                currentPage={payments.meta.page}
                                paramName="payPage"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

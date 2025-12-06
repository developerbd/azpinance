import { createClient } from '@/lib/supabase/server';
import { getDigitalExpenses } from '@/app/actions/digital-expenses/get-expenses';
import { ExpenseList } from '@/components/digital-expenses/expense-list';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DigitalExpensesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // Get User Role
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    // Fetch Expenses
    const expenses = await getDigitalExpenses();

    // Calculate quick stats
    const totalMonth = expenses
        .filter((e: any) => e.status === 'approved' && new Date(e.transaction_date).getMonth() === new Date().getMonth())
        .reduce((sum: number, e: any) => sum + Number(e.amount_usd), 0);

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-heading font-semibold tracking-tight">Digital Expenses</h1>
                    <p className="text-muted-foreground mt-1">
                        Total Approved (This Month): <span className="font-mono text-foreground font-semibold">${totalMonth.toLocaleString()}</span>
                    </p>
                </div>
                {['accountant', 'supervisor', 'admin'].includes(profile?.role) && (
                    <Link href="/digital-expenses/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New Expense
                        </Button>
                    </Link>
                )}
            </div>

            <ExpenseList expenses={expenses || []} userRole={profile?.role || 'guest'} />
        </div>
    );
}

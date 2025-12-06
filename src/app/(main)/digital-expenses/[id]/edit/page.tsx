import { createClient } from '@/lib/supabase/server';
import { ExpenseForm } from '@/components/digital-expenses/expense-form';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityHistory } from "@/components/digital-expenses/activity-history";

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;

    // Fetch Expense
    const { data: expense, error } = await supabase
        .from('digital_expenses')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching expense for edit:', error);
        throw error; // Let error boundary catch it or show 500
    }

    if (!expense) notFound();

    return (
        <div className="container mx-auto py-10 max-w-4xl">
            <div className="mb-6">
                <Link href="/digital-expenses">
                    <Button variant="ghost" className="pl-0 hover:pl-0 hover:bg-transparent">
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Expenses
                    </Button>
                </Link>
                <div className="flex items-center justify-between mt-2">
                    <h1 className="text-2xl font-heading font-semibold tracking-tight">Edit Expense</h1>
                    <span className="text-sm text-muted-foreground font-mono">{id.slice(0, 8)}...</span>
                </div>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="details">Expense Details</TabsTrigger>
                    <TabsTrigger value="history">Activity History</TabsTrigger>
                </TabsList>

                <TabsContent value="details">
                    <ExpenseForm mode="edit" initialData={expense} />
                </TabsContent>

                <TabsContent value="history">
                    <div className="border rounded-lg p-6 bg-card">
                        <h3 className="text-lg font-semibold mb-4">Audit Log</h3>
                        <ActivityHistory expenseId={id} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

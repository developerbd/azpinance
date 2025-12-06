import { ExpenseForm } from '@/components/digital-expenses/expense-form';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewExpensePage() {
    return (
        <div className="container mx-auto py-10">
            <div className="mb-6">
                <Link href="/digital-expenses">
                    <Button variant="ghost" className="pl-0 hover:pl-0 hover:bg-transparent">
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Expenses
                    </Button>
                </Link>
                <h1 className="text-3xl font-heading font-bold tracking-tight mt-2">New Digital Expense</h1>
            </div>

            <ExpenseForm mode="create" />
        </div>
    );
}

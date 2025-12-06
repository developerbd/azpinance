import InvoiceForm from '@/components/invoices/invoice-form';

export default function NewInvoicePage() {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-heading font-semibold tracking-tight mb-6">Create New Document</h1>
            <InvoiceForm />
        </div>
    );
}

import { createClient } from '@/lib/supabase/server';
import { ContactForm } from '@/components/contact-form';
import { notFound } from 'next/navigation';

export default async function EditContactPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient();
    const { data: contact } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!contact) {
        notFound();
    }

    return (
        <div className="container mx-auto max-w-2xl py-10">
            <h1 className="mb-6 text-3xl font-bold">Edit Contact</h1>
            <ContactForm contact={contact} />
        </div>
    );
}

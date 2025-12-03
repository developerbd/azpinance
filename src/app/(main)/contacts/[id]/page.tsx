import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Edit, FileText, ExternalLink, Globe, Facebook, MapPin, Phone, Mail, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SupplierFinancials } from '@/components/supplier-financials';

export default async function ViewContactPage(props: { params: Promise<{ id: string }> }) {
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

    const customFields = contact.custom_fields || {};
    const attachments = contact.attachments || [];

    const { data: { user } } = await supabase.auth.getUser();
    let canEdit = false;

    if (user) {
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
        const role = profile?.role || 'guest';
        canEdit = role === 'admin';
    }

    return (
        <div className="container mx-auto py-10 max-w-3xl">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/contacts">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{contact.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="capitalize">{contact.type}</Badge>
                            <Badge className={contact.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                                {contact.status || 'active'}
                            </Badge>
                        </div>
                    </div>
                </div>
                {canEdit && (
                    <Link href={`/contacts/${contact.id}/edit`}>
                        <Button>
                            <Edit className="mr-2 h-4 w-4" /> Edit Contact
                        </Button>
                    </Link>
                )}
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            {contact.company_name && (
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span>{contact.company_name}</span>
                                </div>
                            )}
                            {contact.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <a href={`mailto:${contact.email}`} className="hover:underline text-blue-600">
                                        {contact.email}
                                    </a>
                                </div>
                            )}
                            {contact.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <a href={`tel:${contact.phone}`} className="hover:underline text-blue-600">
                                        {contact.phone}
                                    </a>
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">
                            {contact.website && (
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <a href={contact.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">
                                        {contact.website}
                                    </a>
                                </div>
                            )}
                            {contact.facebook && (
                                <div className="flex items-center gap-2">
                                    <Facebook className="h-4 w-4 text-muted-foreground" />
                                    <a href={contact.facebook} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600">
                                        Facebook Profile
                                    </a>
                                </div>
                            )}
                            {contact.address && (
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                                    <span className="whitespace-pre-wrap">{contact.address}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {contact.type === 'supplier' && (
                    <SupplierFinancials supplierId={contact.id} />
                )}

                {Object.keys(customFields).length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Custom Fields</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            {Object.entries(customFields).map(([key, value]) => (
                                <div key={key}>
                                    <p className="text-sm font-medium text-muted-foreground">{key}</p>
                                    <p className="text-base">{String(value)}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {attachments.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Attachments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-2">
                                {attachments.map((url: string, index: number) => {
                                    const fileName = url.split('/').pop();
                                    return (
                                        <a
                                            key={index}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted transition-colors"
                                        >
                                            <FileText className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm truncate flex-1">{fileName}</span>
                                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                        </a>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

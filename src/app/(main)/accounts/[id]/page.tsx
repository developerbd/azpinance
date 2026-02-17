import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Edit, FileText, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default async function ViewAccountPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const supabase = await createClient();
    const { data: account } = await supabase
        .from('financial_accounts')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!account) {
        notFound();
    }

    const details = account.details || {};
    const customFields = account.custom_fields || {};
    const attachments = account.attachments || [];

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
                    <Link href="/accounts">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-heading font-semibold tracking-tight">{account.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="capitalize">{account.scope}</Badge>
                            <Badge variant="secondary" className="capitalize">{account.type?.replace('_', ' ')}</Badge>
                            <Badge className={account.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                                {account.status || 'active'}
                            </Badge>
                        </div>
                    </div>
                </div>
                {canEdit && (
                    <Link href={`/accounts/${account.id}/edit`}>
                        <Button>
                            <Edit className="mr-2 h-4 w-4" /> Edit Account
                        </Button>
                    </Link>
                )}
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Account Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Currency</p>
                            <p className="text-lg">{account.currency}</p>
                        </div>

                        {/* Explicit Notes Section */}
                        {details.notes && (
                            <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t">
                                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                                <p className="text-base whitespace-pre-wrap">{String(details.notes)}</p>
                            </div>
                        )}

                        {/* Dynamic Details Rendering (excluding notes as it's handled above) */}
                        {Object.entries(details)
                            .filter(([key]) => key !== 'notes')
                            .map(([key, value]) => (
                                <div key={key}>
                                    <p className="text-sm font-medium text-muted-foreground capitalize">
                                        {key.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-base">{String(value)}</p>
                                </div>
                            ))}

                        {Object.keys(details).length === 0 && (
                            <div className="col-span-1 md:col-span-2 text-center py-8 text-muted-foreground">
                                No additional details available.
                            </div>
                        )}
                    </CardContent>
                </Card>

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

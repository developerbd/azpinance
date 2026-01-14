'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, HardDrive, Download, ShieldCheck, Database, FileCode, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { triggerBackup, getBackupsList, getDriveConnectionStatus, saveManualCredentials, disconnectDrive, deleteBackupAction } from '@/app/actions/backup/actions';

import { useRouter, useSearchParams } from 'next/navigation';

export function BackupSettings() {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<any>(null); // To store detailed status
    const [isLoading, setIsLoading] = useState(false);
    const [backups, setBackups] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [refreshToken, setRefreshToken] = useState('');

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        const status = await getDriveConnectionStatus();
        setIsConnected(status.isConnected);
        setConnectionStatus(status);

        if (status.isConnected && !isEditing) {
            setIsEditing(false);
            const list = await getBackupsList();
            setBackups(list);
        }
    };

    const handleSaveCredentials = async () => {
        setIsLoading(true);
        try {
            const res = await saveManualCredentials(clientId, clientSecret, refreshToken);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success('Google Drive connected successfully!');
                setIsEditing(false);
                checkConnection();
            }
        } catch (err) {
            toast.error('Failed to save credentials');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect? This will stop automatic backups.')) return;

        setIsLoading(true);
        try {
            const res = await disconnectDrive();
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success('Disconnected from Google Drive');
                setIsConnected(false);
                setConnectionStatus(null);
                setBackups([]);
                // Clear form
                setClientId('');
                setClientSecret('');
                setRefreshToken('');
                setIsEditing(false); // Reset edit mode
            }
        } catch (error) {
            toast.error('Failed to disconnect');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackup = async (type: 'db' | 'codebase' | 'full') => {
        setIsLoading(true);
        const toastId = toast.loading('Starting backup...');

        try {
            const result = await triggerBackup(type);
            if (result.error) throw new Error(result.error);
            toast.success('Backup completed successfully!', { id: toastId });
            checkConnection(); // Refresh list
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        Google Drive Backup
                    </CardTitle>
                    <CardDescription>
                        Configure Google Drive to store your automated and manual backups.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!isConnected || isEditing ? (
                        <div className="space-y-4">
                            {isConnected && (
                                <div className="flex justify-between items-center">
                                    <Button variant="destructive" size="sm" onClick={handleDisconnect} disabled={isLoading}>
                                        Disconnect
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                                        Cancel Edit
                                    </Button>
                                </div>
                            )}

                            {connectionStatus?.status === 'error' && (
                                <Alert variant="destructive">
                                    <ShieldCheck className="h-4 w-4" />
                                    <AlertTitle>Connection Failed</AlertTitle>
                                    <AlertDescription>
                                        {connectionStatus.error || "Credentials are saved but valid connection could not be established."}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Alert className="bg-yellow-50 border-yellow-200 mb-4">
                                <ShieldCheck className="h-4 w-4 text-yellow-600" />
                                <AlertTitle className="text-yellow-800">Setup Required</AlertTitle>
                                <AlertDescription className="text-yellow-700 text-sm">
                                    Please provide your Google Cloud credentials manually.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                                <div className="space-y-2">
                                    <Label>Google Client ID</Label>
                                    <Input
                                        placeholder="e.g. 123456-abcde.apps.googleusercontent.com"
                                        value={clientId}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClientId(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Google Client Secret</Label>
                                    <Input
                                        type="password"
                                        placeholder="Enter Client Secret"
                                        value={clientSecret}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClientSecret(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Refresh Token</Label>
                                    <Input
                                        type="password"
                                        placeholder="Enter Refresh Token"
                                        value={refreshToken}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRefreshToken(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Authorise <code>https://www.googleapis.com/auth/drive.file</code> in <a href="https://developers.google.com/oauthplayground" target="_blank" className="underline text-primary hover:text-primary/80">OAuth Playground</a> to get this.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleSaveCredentials}
                                    disabled={isLoading || !clientId || !clientSecret || !refreshToken}
                                    className="w-full"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving Configuration...
                                        </>
                                    ) : (
                                        isConnected ? 'Update & Reconnect' : 'Save & Connect'
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Alert className="bg-green-50/50 border-green-200 flex-1 mr-4">
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                    <AlertTitle className="text-green-800">Connected to Google Drive</AlertTitle>
                                    <AlertDescription className="text-green-700">
                                        System is connected using stored credentials. Backups are stored in 'BizAdFinance Backups'.
                                    </AlertDescription>
                                </Alert>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleDisconnect}>
                                        Disconnect
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                        Update Configuration
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Button
                                    variant="outline"
                                    className="h-24 flex flex-col gap-2 border-dashed hover:border-primary hover:bg-primary/5"
                                    onClick={() => handleBackup('db')}
                                    disabled={isLoading}
                                >
                                    <Database className="h-6 w-6 text-primary" />
                                    <span>Backup Database</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-24 flex flex-col gap-2 border-dashed hover:border-orange-500 hover:bg-orange-50"
                                    onClick={() => handleBackup('codebase')}
                                    disabled={isLoading}
                                >
                                    <FileCode className="h-6 w-6 text-orange-500" />
                                    <span>Backup Codebase</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-24 flex flex-col gap-2 border-2 border-primary/20 bg-primary/5 hover:bg-primary/10"
                                    onClick={() => handleBackup('full')}
                                    disabled={isLoading}
                                >
                                    <ShieldCheck className="h-6 w-6 text-purple-600" />
                                    <span className="font-semibold">Full System Backup</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {isConnected && (
                <Card>
                    <CardHeader>
                        <CardTitle>Backup History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border divide-y">
                            {backups.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground">
                                    No backups found yet.
                                </div>
                            ) : (
                                backups.map((file) => (
                                    <div key={file.id} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-muted rounded-md">
                                                {file.name.includes('db') ? <Database className="h-4 w-4 text-blue-500" /> :
                                                    file.name.includes('code') ? <FileCode className="h-4 w-4 text-orange-500" /> :
                                                        <ShieldCheck className="h-4 w-4 text-purple-500" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(file.createdTime), 'PPP p')} • {(parseInt(file.size) / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" asChild>
                                                <a href={file.webContentLink} target="_blank" rel="noopener noreferrer">
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={async () => {
                                                    if (!confirm('Delete this backup?')) return;
                                                    const toastId = toast.loading('Deleting...');
                                                    const res = await deleteBackupAction(file.id);
                                                    if (res.error) toast.error(res.error, { id: toastId });
                                                    else {
                                                        toast.success('Deleted', { id: toastId });
                                                        checkConnection();
                                                    }
                                                }}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/50 px-6 py-3">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            Last checked: Just now
                        </div>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}

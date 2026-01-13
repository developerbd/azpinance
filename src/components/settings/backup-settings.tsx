'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, HardDrive, Download, ShieldCheck, Database, FileCode, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { triggerBackup, getBackupsList, getDriveConnectionStatus } from '@/app/actions/backup/actions';

import { useRouter, useSearchParams } from 'next/navigation';

export function BackupSettings() {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [backups, setBackups] = useState<any[]>([]);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Handle OAuth Callback Params
        const success = searchParams.get('success');
        const error = searchParams.get('error');

        if (success === 'connected') {
            toast.success("Google Drive connected successfully!");
            // Clean URL
            router.replace('/settings/backup');
            setIsConnected(true);
        } else if (error) {
            toast.error(`Connection failed: ${error}`);
            router.replace('/settings/backup');
        }

        checkConnection();
    }, [searchParams, router]);

    const checkConnection = async () => {
        // Precise status check
        const status = await getDriveConnectionStatus();
        setIsConnected(status.isConnected);

        if (status.isConnected) {
            const list = await getBackupsList();
            setBackups(list);
        }
    };

    const handleConnect = () => {
        // Redirect to OAuth init
        window.location.href = '/api/backup/auth';
    };

    const handleBackup = async (type: 'db' | 'codebase' | 'full') => {
        setIsLoading(true);
        try {
            const result = await triggerBackup(type);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`${type.toUpperCase()} Backup started successfully.`);
                checkConnection(); // Refresh list
            }
        } catch (error) {
            toast.error("Backup failed.");
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
                        Connect your Google Drive to enable automated and manual backups.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!isConnected ? (
                        <div className="text-center py-6">
                            <Button onClick={handleConnect} variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
                                Connect Google Drive
                            </Button>
                            <p className="text-muted-foreground mt-2 text-sm text-balance">
                                Setup Required: Configure Google Credentials in Server Environment.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Alert className="bg-green-50/50 border-green-200">
                                <ShieldCheck className="h-4 w-4 text-green-600" />
                                <AlertTitle className="text-green-800">Connected to Google Drive</AlertTitle>
                                <AlertDescription className="text-green-700">
                                    System is connected. Backups are stored in 'BizAdFinance Backups'.
                                </AlertDescription>
                            </Alert>

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
                                        <Button variant="ghost" size="sm" asChild>
                                            <a href={file.webContentLink} target="_blank" rel="noopener noreferrer">
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
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

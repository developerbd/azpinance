'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getChatSessions } from '@/app/actions/chat/get-chat-sessions';
import { closeChatSession } from '@/app/actions/chat/close-chat-session';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Trash2, MessageSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatSession {
    id: string;
    title: string;
    message_count: number;
    status: string;
    last_activity_at: string;
    created_at: string;
}

interface ChatHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectSession?: (sessionId: string) => void;
    currentSessionId?: string | null;
}

export function ChatHistoryDialog({ open, onOpenChange, onSelectSession, currentSessionId }: ChatHistoryDialogProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            loadSessions();
        }
    }, [open]);

    const loadSessions = async () => {
        setLoading(true);
        const result = await getChatSessions();

        if ('data' in result && result.data) {
            setSessions(result.data as ChatSession[]);
        } else {
            toast.error('Failed to load sessions');
        }
        setLoading(false);
    };

    const handleCloseSession = async (sessionId: string) => {
        const result = await closeChatSession(sessionId);

        if ('error' in result) {
            toast.error(result.error);
        } else {
            toast.success('Session closed');
            loadSessions(); // Reload list
        }
    };

    const activeSessions = sessions.filter(s => s.status === 'active');
    const closedSessions = sessions.filter(s => s.status === 'closed' || s.status === 'idle');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Chat History</DialogTitle>
                    <DialogDescription>
                        Manage your chat sessions ({activeSessions.length}/5 active)
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[400px] pr-4">
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Loading sessions...
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activeSessions.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold mb-2 text-green-600">Active Sessions</h3>
                                    <div className="space-y-2">
                                        {activeSessions.map(session => (
                                            <div
                                                key={session.id}
                                                className={`p-3 rounded-lg border cursor-pointer ${session.id === currentSessionId
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:bg-muted/50'
                                                    } transition-colors`}
                                                onClick={() => {
                                                    if (session.id !== currentSessionId && onSelectSession) {
                                                        onSelectSession(session.id);
                                                    }
                                                }}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <MessageSquare className="h-4 w-4 shrink-0 text-primary" />
                                                            <p className="font-medium text-sm truncate">
                                                                {session.title}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                            <span>{session.message_count} messages</span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {formatDistanceToNow(new Date(session.last_activity_at), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 shrink-0"
                                                        onClick={() => handleCloseSession(session.id)}
                                                        disabled={session.id === currentSessionId}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {closedSessions.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Closed Sessions</h3>
                                    <div className="space-y-2">
                                        {closedSessions.map(session => (
                                            <div
                                                key={session.id}
                                                className="p-3 rounded-lg border border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => {
                                                    if (onSelectSession) {
                                                        onSelectSession(session.id);
                                                    }
                                                }}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                            <p className="font-medium text-sm truncate text-muted-foreground">
                                                                {session.title}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                            <span>{session.message_count} messages</span>
                                                            <span>{formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {sessions.length === 0 && !loading && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No chat sessions yet
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

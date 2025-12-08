'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, X, Send, User, Plus, History, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useIdleTimeout } from '@/hooks/use-idle-timeout';
import { createChatSession } from '@/app/actions/chat/create-chat-session';
import { getChatMessages } from '@/app/actions/chat/get-chat-messages';
import { saveChatMessage } from '@/app/actions/chat/save-chat-message';
import { closeChatSession } from '@/app/actions/chat/close-chat-session';
import { updateSessionActivity } from '@/app/actions/chat/update-session-activity';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChatHistoryDialog } from './chat-history-dialog';
import { AnimatedAvatar } from './animated-avatar';

export function ChatWidget() {
    const [user, setUser] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [sessionTitle, setSessionTitle] = useState('New Conversation');
    const [messageCount, setMessageCount] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoadingSession, setIsLoadingSession] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);

    // Use ref to avoid stale closure in onFinish callback
    const sessionIdRef = useRef<string | null>(null);

    // Check authentication
    useEffect(() => {
        const checkAuth = async () => {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        checkAuth();
    }, []);

    // Update ref whenever currentSessionId changes
    useEffect(() => {
        sessionIdRef.current = currentSessionId;
    }, [currentSessionId]);

    const { messages, sendMessage, status, setMessages } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
        }),
        body: {
            sessionId: currentSessionId,
        },
        onError: (error) => {
            toast.error("Failed to send message: " + error.message);
        },
        onFinish: async (event) => {
            const activeSessionId = sessionIdRef.current;
            const assistantMessage = event.message;

            // Check if this was an error response
            if (event.isError) {
                console.error('AI response error:', event);
                toast.error("Failed to get response. Please try again.");
                return;
            }

            // Save assistant message to database
            if (activeSessionId && assistantMessage) {
                const content = assistantMessage.content ||
                    (assistantMessage.parts
                        ?.filter((p: any) => p.type === 'text')
                        .map((p: any) => p.text)
                        .join('') || '');

                if (content) {
                    await saveChatMessage({
                        sessionId: activeSessionId,
                        role: 'assistant',
                        content,
                        tokens: Math.ceil(content.length / 4),
                    });
                    setMessageCount(prev => prev + 1);
                } else {
                    // Empty response - notify user
                    console.warn('Empty AI response received');
                    toast.warning("Got an empty response. Try asking again or rephrase your question.");
                }
            }

            // If widget is closed, increment unread count
            if (!isOpen) {
                setUnreadCount(prev => prev + 1);
            }
        }
    });

    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Idle timeout (10 minutes warning, 5 minutes auto-close)
    const { showWarning, dismissWarning, resetTimers } = useIdleTimeout({
        warningTimeout: 10 * 60 * 1000, // 10 minutes
        closeTimeout: 5 * 60 * 1000, // 5 minutes
        enabled: isOpen && !!currentSessionId,
        onWarning: () => {
            toast.warning("Are you still there?", {
                description: "This chat will close in 5 minutes if inactive.",
                action: {
                    label: "I'm here",
                    onClick: () => {
                        dismissWarning();
                        if (currentSessionId) {
                            updateSessionActivity(currentSessionId);
                        }
                    }
                },
                duration: 300000, // 5 minutes
            });
        },
        onClose: async () => {
            if (currentSessionId) {
                await closeChatSession(currentSessionId);
                toast.info("Chat session closed due to inactivity");
                handleNewSession();
            }
        }
    });

    // Load session messages when widget opens (if session exists)
    useEffect(() => {
        if (isOpen && currentSessionId && messages.length === 0) {
            loadSessionMessages();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, currentSessionId]);

    const loadSessionMessages = async () => {
        if (!currentSessionId) return;

        const result = await getChatMessages({
            sessionId: currentSessionId,
            slidingWindow: false // Load all messages when reopening
        });

        if ('data' in result && result.data && result.data.length > 0) {
            // Convert DB messages to UI format
            const uiMessages = result.data.map(msg => ({
                id: msg.id,
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
            }));

            // Directly set messages in the useChat hook
            setMessages(uiMessages as any);
            setMessageCount(result.data.length);
        }
    };

    const handleResumeSession = async (sessionId: string) => {
        setIsLoadingSession(true);

        // Check if session is closed (read-only mode)
        const sessions = await import('@/app/actions/chat/get-chat-sessions');
        const sessionsResult = await sessions.getChatSessions();
        let sessionStatus = 'active';

        if ('data' in sessionsResult && sessionsResult.data) {
            const session = sessionsResult.data.find(s => s.id === sessionId);
            if (session) {
                sessionStatus = session.status;
                setSessionTitle(session.title);
            }
        }

        // Set read-only mode for closed sessions
        setIsReadOnly(sessionStatus === 'closed' || sessionStatus === 'archived');

        // Set the session ID first
        setCurrentSessionId(sessionId);

        // Get session messages
        const result = await getChatMessages({
            sessionId,
            slidingWindow: false
        });

        if ('data' in result && result.data && result.data.length > 0) {
            const uiMessages = result.data.map(msg => ({
                id: msg.id,
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
            }));

            setMessages(uiMessages as any);
            setMessageCount(result.data.length);
        } else {
            setMessages([]);
            setMessageCount(0);
        }

        setIsLoadingSession(false);
        setShowHistory(false);
        setIsOpen(true);

        if (sessionStatus === 'closed' || sessionStatus === 'archived') {
            toast.info("Viewing closed session (read-only)");
        } else {
            toast.success("Session resumed");
        }
    };

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages]);

    // Clear unread count when opening
    useEffect(() => {
        if (isOpen) {
            setUnreadCount(0);
        }
    }, [isOpen]);

    const handleNewSession = async () => {
        setIsLoadingSession(true);
        setIsReadOnly(false); // New sessions are always editable
        const result = await createChatSession();

        if ('error' in result) {
            toast.error(result.error);
            setIsLoadingSession(false);
            return;
        }

        setCurrentSessionId(result.data.id);
        setSessionTitle(result.data.title);
        setMessageCount(0);
        setMessages([]);
        setIsLoadingSession(false);
        toast.success("New chat session started");
    };

    const handleMinimizeWidget = () => {
        setIsOpen(false);
        // Session persists - don't close it
    };

    const handleCloseSession = async () => {
        if (!currentSessionId) return;

        await closeChatSession(currentSessionId);
        setCurrentSessionId(null);
        setMessages([]);
        setSessionTitle('New Conversation');
        setMessageCount(0);
        setIsOpen(false);
        toast.success("Chat session closed");
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !currentSessionId) return;

        const userMessage = input;
        setInput('');

        try {
            // Reset idle timer on user activity
            resetTimers();

            // Send message to AI first (this will add it to the UI)
            await sendMessage({ text: userMessage });

            // Then save to database (this happens after the message is in the UI)
            await saveChatMessage({
                sessionId: currentSessionId,
                role: 'user',
                content: userMessage,
                tokens: Math.ceil(userMessage.length / 4),
            });

            setMessageCount(prev => prev + 1);
        } catch (err) {
            console.error('Chat error:', err);
            toast.error("Failed to send message. Please try again.");
            setInput(userMessage);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
            {isOpen && (
                <Card className="w-[380px] h-[500px] shadow-xl flex flex-col border-primary/20 animate-in slide-in-from-bottom-10 fade-in bg-background/95 backdrop-blur-sm">
                    <CardHeader className="p-3 border-b flex flex-row items-center justify-between space-y-0 bg-primary text-primary-foreground rounded-t-lg">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <AnimatedAvatar size={32} isAnimating={status === 'streaming'} />
                            <div className="flex flex-col min-w-0">
                                <CardTitle className="text-base font-medium truncate">{sessionTitle}</CardTitle>
                                {messageCount > 0 && (
                                    <span className="text-xs opacity-80">
                                        {messageCount} message{messageCount !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                                onClick={() => setShowHistory(true)}
                                title="Chat history"
                            >
                                <History className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                                onClick={handleNewSession}
                                disabled={isLoadingSession}
                                title="New conversation"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                                onClick={handleMinimizeWidget}
                                title="Minimize"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 p-0 overflow-hidden">
                        <ScrollArea className="h-full p-4" ref={scrollRef}>
                            <div className="flex flex-col gap-4">
                                {!currentSessionId && !isLoadingSession && (
                                    <div className="text-center mt-20 px-6">
                                        <AnimatedAvatar size={64} className="mx-auto mb-4 opacity-60" />
                                        <h3 className="font-semibold text-lg mb-2">Welcome to Biz Finance AI</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Your intelligent financial assistant for forex, invoices, payments, and expenses.
                                        </p>
                                        <Button onClick={handleNewSession} disabled={isLoadingSession}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Start New Chat
                                        </Button>
                                    </div>
                                )}

                                {currentSessionId && messages.length === 0 && !isLoadingSession && (
                                    <div className="text-sm text-muted-foreground text-center mt-20 px-6">
                                        <AnimatedAvatar size={64} className="mx-auto mb-3 opacity-60" />
                                        <p>Hello! I'm your financial assistant.</p>
                                        <p className="mt-1">Ask me about forex transactions, invoices, supplier payments, or digital expenses.</p>
                                    </div>
                                )}

                                {isLoadingSession && (
                                    <div className="text-sm text-muted-foreground text-center mt-20">
                                        <AnimatedAvatar size={64} isAnimating className="mx-auto mb-3 opacity-40" />
                                        <p>Starting new session...</p>
                                    </div>
                                )}

                                {messages.map((m: any) => {
                                    // Extract text content - check content field first, then parts
                                    const textContent = m.content ||
                                        (m.parts && m.parts.length > 0
                                            ? m.parts
                                                .filter((part: any) => part.type === 'text')
                                                .map((part: any) => part.text)
                                                .join('')
                                            : '');

                                    // Skip empty assistant messages
                                    if (!textContent && m.role !== 'user') {
                                        return null;
                                    }

                                    return (
                                        <div key={m.id} className={cn("flex gap-2 max-w-[85%]", m.role === 'user' ? "self-end flex-row-reverse" : "self-start")}>
                                            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", m.role === 'user' ? "bg-primary text-primary-foreground" : "")}>
                                                {m.role === 'user' ? (
                                                    <User className="h-4 w-4" />
                                                ) : (
                                                    <AnimatedAvatar size={32} />
                                                )}
                                            </div>
                                            <div className={cn("rounded-lg p-3 text-sm shadow-sm", m.role === 'user' ? "bg-primary text-primary-foreground" : "bg-card border")}>
                                                {textContent ? (
                                                    <span className="whitespace-pre-wrap">{textContent}</span>
                                                ) : (
                                                    <span className="text-muted-foreground italic text-xs">Processing...</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {status === 'streaming' && (
                                    <div className="flex gap-2 max-w-[85%] self-start">
                                        <AnimatedAvatar size={32} isAnimating className="opacity-60" />
                                        <div className="bg-card border rounded-lg p-3 text-sm shadow-sm">
                                            <span className="animate-pulse">Thinking...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>

                    <CardFooter className="p-3 border-t bg-muted/50 flex-col gap-2">
                        {showWarning && (
                            <Alert variant="destructive" className="py-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                    Session will close in 5 minutes due to inactivity
                                </AlertDescription>
                            </Alert>
                        )}

                        {isReadOnly && (
                            <Alert className="py-2 bg-yellow-50 border-yellow-200">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                <AlertDescription className="text-xs text-yellow-800">
                                    This is a closed session (read-only)
                                </AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={onSubmit} className="flex gap-2 w-full">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={isReadOnly ? "Read-only session" : "Type your message..."}
                                disabled={status === 'streaming' || !currentSessionId || isReadOnly}
                                className="flex-1"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!input.trim() || status === 'streaming' || !currentSessionId || isReadOnly}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            )}

            <Button
                onClick={() => setIsOpen(!isOpen)}
                size="lg"
                className="h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105 relative p-0 overflow-visible bg-gradient-to-br from-blue-600 to-cyan-500"
            >
                <Image
                    src="/chatbot-avatar.png"
                    alt="AI Assistant"
                    width={56}
                    height={56}
                    className="rounded-full"
                />
                {unreadCount > 0 && (
                    <Badge
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold shadow-lg border-2 border-white z-50"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                )}
            </Button>

            <ChatHistoryDialog
                open={showHistory}
                onOpenChange={setShowHistory}
                currentSessionId={currentSessionId}
                onSelectSession={handleResumeSession}
            />
        </div>
    );

    // Don't render widget if user is not authenticated (moved to end after all hooks)
    if (!user) {
        return null;
    }
}

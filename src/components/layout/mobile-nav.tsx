'use client';

import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { useState, useEffect } from 'react';

interface MobileNavProps {
    companyName?: string;
}

export function MobileNav({ companyName }: MobileNavProps) {
    const [open, setOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden shrink-0">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-transparent border-none shadow-none [&>button]:hidden">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="h-full w-full p-4 relative">
                    <Sidebar companyName={companyName} className="bg-background border-border shadow-xl" />
                    <SheetClose className="absolute top-6 right-6 z-50 p-2 bg-background/80 backdrop-blur-sm rounded-full border border-border/50 hover:bg-accent transition-colors">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </SheetClose>
                </div>
            </SheetContent>
        </Sheet>
    );
}

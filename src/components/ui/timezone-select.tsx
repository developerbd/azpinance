'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface TimezoneSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
}

export function TimezoneSelect({ value, onValueChange, disabled, className }: TimezoneSelectProps) {
    const [open, setOpen] = React.useState(false);

    // Check if Intl is supported (it should be in modern browsers/environments)
    const timezones = React.useMemo(() => {
        try {
            return Intl.supportedValuesOf('timeZone');
        } catch (e) {
            console.error(e);
            return ['UTC'];
        }
    }, []);

    // Filter timezones if list is huge? Command handles filtering automatically.
    // However, 400+ items might be heavy for some implementations, but usually fine for virtualized lists or reasonable DOMs.
    // Shadcn's Command uses 'cmdk' which is usually performant.

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal", !value && "text-muted-foreground", className)}
                    disabled={disabled}
                >
                    {value ? value : "Select timezone..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search timezone..." />
                    <CommandList>
                        <CommandEmpty>No timezone found.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-auto">
                            {/* Limit height for scrolling */}
                            {timezones.map((tz) => (
                                <CommandItem
                                    key={tz}
                                    value={tz}
                                    onSelect={(currentValue) => {
                                        onValueChange(currentValue === value ? "" : currentValue);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === tz ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {tz}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

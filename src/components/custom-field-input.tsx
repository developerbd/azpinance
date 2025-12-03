'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

type CustomFields = Record<string, string | number | boolean>;

interface CustomFieldInputProps {
    value: CustomFields;
    onChange: (value: CustomFields) => void;
}

export default function CustomFieldInput({ value, onChange }: CustomFieldInputProps) {
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

    const handleAdd = () => {
        if (!newKey) return;
        onChange({ ...value, [newKey]: newValue });
        setNewKey('');
        setNewValue('');
    };

    const handleRemove = (key: string) => {
        const next = { ...value };
        delete next[key];
        onChange(next);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Custom Fields</Label>
                <div className="grid grid-cols-[1fr,1fr,auto] gap-2">
                    <Input
                        placeholder="Field Name (e.g. Birthday)"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                    />
                    <Input
                        placeholder="Value"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={handleAdd}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {Object.entries(value).length > 0 && (
                <div className="rounded-md border p-4 space-y-2">
                    {Object.entries(value).map(([key, val]) => (
                        <div key={key} className="grid grid-cols-[1fr,1fr,auto] items-center gap-2">
                            <span className="text-sm font-medium">{key}</span>
                            <span className="text-sm text-neutral-500">{String(val)}</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700"
                                onClick={() => handleRemove(key)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

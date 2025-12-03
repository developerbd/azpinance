'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { useCallback } from 'react'; // Added for useCallback

interface FileUploadProps {
    bucket: string;
    onUploadComplete: (urls: string[]) => void;
    existingFiles?: string[];
    maxFiles?: number; // Added maxFiles prop
}

export function FileUpload({ bucket, onUploadComplete, existingFiles = [], maxFiles }: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [files, setFiles] = useState<string[]>(existingFiles);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    useEffect(() => {
        setFiles(existingFiles);
    }, [existingFiles]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return;
        }

        if (maxFiles && files.length + e.target.files.length > maxFiles) {
            toast.error(`You can only upload a maximum of ${maxFiles} files`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setUploading(true);
        const newFiles: string[] = [];

        try {
            for (const file of Array.from(e.target.files)) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from(bucket)
                    .upload(filePath, file);

                if (uploadError) {
                    throw uploadError;
                }

                const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
                newFiles.push(data.publicUrl);
            }

            const updatedFiles = [...files, ...newFiles];
            setFiles(updatedFiles);
            onUploadComplete(updatedFiles);
            toast.success('Files uploaded successfully');
        } catch (error: any) {
            toast.error('Error uploading file: ' + error.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeFile = (urlToRemove: string) => {
        const updatedFiles = files.filter((url) => url !== urlToRemove);
        setFiles(updatedFiles);
        onUploadComplete(updatedFiles);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Upload className="mr-2 h-4 w-4" />
                    )}
                    Upload Files
                </Button>
                <Input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleFileChange}
                />
            </div>

            {files.length > 0 && (
                <div className="grid gap-2">
                    {files.map((url, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between rounded-md border p-2 text-sm"
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="truncate hover:underline"
                                >
                                    {url.split('/').pop()}
                                </a>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => removeFile(url)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

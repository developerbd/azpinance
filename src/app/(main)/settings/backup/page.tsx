import { BackupSettings } from '@/components/settings/backup-settings';
import { Separator } from '@/components/ui/separator';

export default function BackupPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Backup & Restore</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your data backups, configure Google Drive, and restore from checkpoints.
                </p>
            </div>
            <Separator />
            <BackupSettings />
        </div>
    );
}

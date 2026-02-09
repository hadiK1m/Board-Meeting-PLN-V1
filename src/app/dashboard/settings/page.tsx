// src/app/dashboard/settings/page.tsx
import { SettingsTabs } from "@/components/features/settings/settings-tabs";

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
                <p className="text-muted-foreground">
                    Kelola data master dan konfigurasi sistem.
                </p>
            </div>
            <SettingsTabs />
        </div>
    );
}

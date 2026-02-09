// src/components/features/settings/settings-tabs.tsx
"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, Briefcase, ShieldCheck, User } from "lucide-react";
import { DireksiTab } from "./direksi-tab";
import { PemrakarsaTab } from "./pemrakarsa-tab";
import { TwoFactorTab } from "./two-factor-tab";
import { ProfileTab } from "./profile-tab";

export function SettingsTabs() {
    return (
        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Profil</span>
                </TabsTrigger>
                <TabsTrigger value="direksi" className="gap-2">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Direksi</span>
                </TabsTrigger>
                <TabsTrigger value="pemrakarsa" className="gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span className="hidden sm:inline">Pemrakarsa & Support</span>
                </TabsTrigger>
                <TabsTrigger value="2fa" className="gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">2FA</span>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
                <ProfileTab />
            </TabsContent>

            <TabsContent value="direksi" className="mt-6">
                <DireksiTab />
            </TabsContent>

            <TabsContent value="pemrakarsa" className="mt-6">
                <PemrakarsaTab />
            </TabsContent>

            <TabsContent value="2fa" className="mt-6">
                <TwoFactorTab />
            </TabsContent>
        </Tabs>
    );
}

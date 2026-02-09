// src/app/dashboard/users/page.tsx
import { Metadata } from "next";
import { getAllUsers } from "@/server/actions/user-actions";
import { UserManagement } from "@/components/features/users/user-management";

export const metadata: Metadata = {
    title: "User Management - Board Meeting PLN",
    description: "Kelola pengguna sistem Board Meeting",
};

export default async function UsersPage() {
    const users = await getAllUsers();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground">
                    Kelola pengguna, role, dan akses sistem.
                </p>
            </div>
            <UserManagement initialUsers={users} />
        </div>
    );
}

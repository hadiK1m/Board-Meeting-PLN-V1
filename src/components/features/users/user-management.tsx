// src/components/features/users/user-management.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    UserPlus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    Shield,
    ShieldOff,
    Key,
    Mail,
    Calendar,
    Clock,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { showNotify } from "@/components/shared/toast-provider";

import type { UserData } from "@/server/actions/user-actions";
import {
    deleteUserAction,
    toggleUserStatusAction,
} from "@/server/actions/user-actions";

import { CreateUserDialog } from "./create-user-dialog";
import { EditUserDialog } from "./edit-user-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";

interface UserManagementProps {
    initialUsers: UserData[];
}

const getRoleBadgeColor = (role: string) => {
    switch (role) {
        case "admin":
            return "bg-red-100 text-red-700 border-red-200";
        case "sekretaris":
            return "bg-blue-100 text-blue-700 border-blue-200";
        case "user":
            return "bg-slate-100 text-slate-700 border-slate-200";
        default:
            return "bg-gray-100 text-gray-700 border-gray-200";
    }
};

const getInitials = (name: string) => {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
};

export function UserManagement({ initialUsers }: UserManagementProps) {
    const router = useRouter();
    const [users, setUsers] = useState<UserData[]>(initialUsers);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editUser, setEditUser] = useState<UserData | null>(null);
    const [resetPasswordUser, setResetPasswordUser] = useState<UserData | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<UserData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter users based on search
    const filteredUsers = users.filter(
        (user) =>
            user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle delete
    const handleDelete = async () => {
        if (!deleteConfirm) return;

        setIsDeleting(true);
        const result = await deleteUserAction(deleteConfirm.id);

        if (result.success) {
            setUsers((prev) => prev.filter((u) => u.id !== deleteConfirm.id));
            showNotify("User berhasil dihapus", "success");
        } else {
            showNotify(result.error || "Gagal menghapus user", "error");
        }

        setIsDeleting(false);
        setDeleteConfirm(null);
    };

    // Handle toggle status
    const handleToggleStatus = async (user: UserData) => {
        const newStatus = !user.isActive;
        const result = await toggleUserStatusAction(user.id, newStatus);

        if (result.success) {
            setUsers((prev) =>
                prev.map((u) => (u.id === user.id ? { ...u, isActive: newStatus } : u))
            );
            showNotify(
                newStatus ? "User diaktifkan" : "User dinonaktifkan",
                "success"
            );
        } else {
            showNotify(result.error || "Gagal mengubah status", "error");
        }
    };

    // Handle user created/updated
    const handleUserChange = () => {
        router.refresh();
    };

    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Users</CardDescription>
                        <CardTitle className="text-3xl">{users.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Admin</CardDescription>
                        <CardTitle className="text-3xl text-red-600">
                            {users.filter((u) => u.role === "admin").length}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Sekretaris</CardDescription>
                        <CardTitle className="text-3xl text-blue-600">
                            {users.filter((u) => u.role === "sekretaris").length}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Aktif</CardDescription>
                        <CardTitle className="text-3xl text-green-600">
                            {users.filter((u) => u.isActive).length}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Main Content */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Daftar Pengguna</CardTitle>
                            <CardDescription>
                                Kelola akun pengguna dan hak akses
                            </CardDescription>
                        </div>
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Tambah User
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Search */}
                    <div className="mb-4">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama, email, atau role..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Dibuat</TableHead>
                                    <TableHead>Login Terakhir</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <p className="text-muted-foreground">
                                                {searchQuery
                                                    ? "Tidak ada user yang cocok"
                                                    : "Belum ada user"}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                                            {getInitials(user.fullName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{user.fullName}</p>
                                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={getRoleBadgeColor(user.role)}
                                                >
                                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {user.isActive ? (
                                                    <Badge className="bg-green-100 text-green-700 border-green-200">
                                                        Aktif
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-red-100 text-red-700 border-red-200">
                                                        Nonaktif
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    {user.createdAt
                                                        ? format(new Date(user.createdAt), "dd MMM yyyy", {
                                                            locale: id,
                                                        })
                                                        : "-"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {user.lastSignIn
                                                        ? format(
                                                            new Date(user.lastSignIn),
                                                            "dd MMM yyyy HH:mm",
                                                            { locale: id }
                                                        )
                                                        : "Belum pernah"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => setEditUser(user)}
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit User
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => setResetPasswordUser(user)}
                                                        >
                                                            <Key className="mr-2 h-4 w-4" />
                                                            Reset Password
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleToggleStatus(user)}
                                                        >
                                                            {user.isActive ? (
                                                                <>
                                                                    <ShieldOff className="mr-2 h-4 w-4" />
                                                                    Nonaktifkan
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Shield className="mr-2 h-4 w-4" />
                                                                    Aktifkan
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => setDeleteConfirm(user)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Hapus User
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Create User Dialog */}
            <CreateUserDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSuccess={handleUserChange}
            />

            {/* Edit User Dialog */}
            {editUser && (
                <EditUserDialog
                    user={editUser}
                    open={!!editUser}
                    onOpenChange={(open) => !open && setEditUser(null)}
                    onSuccess={handleUserChange}
                />
            )}

            {/* Reset Password Dialog */}
            {resetPasswordUser && (
                <ResetPasswordDialog
                    user={resetPasswordUser}
                    open={!!resetPasswordUser}
                    onOpenChange={(open) => !open && setResetPasswordUser(null)}
                />
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus User?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda yakin ingin menghapus user{" "}
                            <strong>{deleteConfirm?.fullName}</strong>? Tindakan ini tidak
                            dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? "Menghapus..." : "Hapus"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

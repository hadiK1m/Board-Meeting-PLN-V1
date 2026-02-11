// src/components/features/settings/direksi-tab.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, MoreHorizontal, Pencil, Trash2, GripVertical, Users, Loader2 } from "lucide-react";
import {
    getDireksiList,
    createDireksi,
    updateDireksi,
    deleteDireksi,
    type OrganizationalUnit
} from "@/server/master-data-actions";
import { showNotify } from "@/components/shared/toast-provider";

export function DireksiTab() {
    const [direksi, setDireksi] = useState<OrganizationalUnit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingDireksi, setEditingDireksi] = useState<OrganizationalUnit | null>(null);
    const [newDireksi, setNewDireksi] = useState({ name: "", code: "" });

    // Fetch data dari database saat komponen dimuat
    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getDireksiList();
                setDireksi(data);
            } catch (error) {
                console.error("Gagal mengambil data direksi:", error);
                showNotify("Gagal mengambil data direksi", "error");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleAdd = () => {
        if (!newDireksi.name || !newDireksi.code) {
            showNotify("Nama jabatan dan kode harus diisi", "error");
            return;
        }

        startTransition(async () => {
            try {
                const created = await createDireksi({
                    name: newDireksi.name,
                    code: newDireksi.code,
                });
                setDireksi(prev => [...prev, created]);
                setNewDireksi({ name: "", code: "" });
                setIsAddDialogOpen(false);
                showNotify("Direksi berhasil ditambahkan", "success");
            } catch (error) {
                console.error("Gagal menambah direksi:", error);
                showNotify("Gagal menambahkan direksi", "error");
            }
        });
    };

    const handleEdit = () => {
        if (!editingDireksi) return;

        startTransition(async () => {
            try {
                const updated = await updateDireksi(editingDireksi.id, {
                    name: editingDireksi.name,
                    code: editingDireksi.code ?? undefined,
                    isActive: editingDireksi.isActive ?? true,
                });
                setDireksi(prev => prev.map(d => d.id === updated.id ? updated : d));
                setIsEditDialogOpen(false);
                setEditingDireksi(null);
                showNotify("Direksi berhasil diperbarui", "success");
            } catch (error) {
                console.error("Gagal memperbarui direksi:", error);
                showNotify("Gagal memperbarui direksi", "error");
            }
        });
    };

    const handleDelete = (id: string) => {
        startTransition(async () => {
            try {
                await deleteDireksi(id);
                setDireksi(prev => prev.filter(d => d.id !== id));
                showNotify("Direksi berhasil dihapus", "success");
            } catch (error) {
                console.error("Gagal menghapus direksi:", error);
                showNotify("Gagal menghapus direksi", "error");
            }
        });
    };

    const handleToggleActive = (id: string, currentStatus: boolean | null) => {
        startTransition(async () => {
            try {
                const updated = await updateDireksi(id, {
                    isActive: !(currentStatus ?? true),
                });
                setDireksi(prev => prev.map(d => d.id === updated.id ? updated : d));
                showNotify(
                    updated.isActive ? "Direksi diaktifkan" : "Direksi dinonaktifkan",
                    "success"
                );
            } catch (error) {
                console.error("Gagal mengubah status direksi:", error);
                showNotify("Gagal mengubah status direksi", "error");
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#125d72]/10 rounded-lg">
                            <Users className="h-5 w-5 text-[#125d72]" />
                        </div>
                        <div>
                            <CardTitle>Data Direksi</CardTitle>
                            <CardDescription>
                                Kelola daftar Direksi yang akan tampil di aplikasi.
                            </CardDescription>
                        </div>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-[#125d72] hover:bg-[#0e4a5c]">
                                <Plus className="h-4 w-4" />
                                Tambah Direksi
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tambah Direksi Baru</DialogTitle>
                                <DialogDescription>
                                    Masukkan data Direksi baru yang akan ditambahkan.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nama Jabatan</Label>
                                    <Input
                                        id="name"
                                        placeholder="Contoh: Direktur Keuangan"
                                        value={newDireksi.name}
                                        onChange={(e) => setNewDireksi({ ...newDireksi, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="code">Kode</Label>
                                    <Input
                                        id="code"
                                        placeholder="Contoh: DIRKEU"
                                        value={newDireksi.code}
                                        onChange={(e) => setNewDireksi({ ...newDireksi, code: e.target.value.toUpperCase() })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isPending}>
                                    Batal
                                </Button>
                                <Button onClick={handleAdd} className="bg-[#125d72] hover:bg-[#0e4a5c]" disabled={isPending}>
                                    {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-[#125d72]" />
                        <span className="ml-2 text-muted-foreground">Memuat data...</span>
                    </div>
                ) : direksi.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        Belum ada data direksi. Klik &quot;Tambah Direksi&quot; untuk menambahkan.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>Nama Jabatan</TableHead>
                                <TableHead>Kode</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {direksi.map((item, index) => (
                                <TableRow key={item.id} className="group">
                                    <TableCell className="text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <GripVertical className="h-4 w-4 opacity-0 group-hover:opacity-50 cursor-grab" />
                                            {index + 1}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{item.code}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Switch
                                            checked={item.isActive ?? true}
                                            onCheckedChange={() => handleToggleActive(item.id, item.isActive)}
                                            disabled={isPending}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setEditingDireksi(item);
                                                        setIsEditDialogOpen(true);
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Hapus
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Direksi</DialogTitle>
                            <DialogDescription>
                                Ubah data Direksi yang dipilih.
                            </DialogDescription>
                        </DialogHeader>
                        {editingDireksi && (
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-name">Nama Jabatan</Label>
                                    <Input
                                        id="edit-name"
                                        value={editingDireksi.name}
                                        onChange={(e) => setEditingDireksi({ ...editingDireksi, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-code">Kode</Label>
                                    <Input
                                        id="edit-code"
                                        value={editingDireksi.code ?? ""}
                                        onChange={(e) => setEditingDireksi({ ...editingDireksi, code: e.target.value.toUpperCase() })}
                                    />
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isPending}>
                                Batal
                            </Button>
                            <Button onClick={handleEdit} className="bg-[#125d72] hover:bg-[#0e4a5c]" disabled={isPending}>
                                {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                Simpan Perubahan
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}

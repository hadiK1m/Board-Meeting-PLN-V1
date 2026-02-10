// src/components/features/settings/direksi-tab.tsx
"use client";

import { useState } from "react";
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
import { Plus, MoreHorizontal, Pencil, Trash2, GripVertical, Users } from "lucide-react";

// Data sementara - nanti akan diambil dari database
const initialDireksi = [
    { id: 1, name: "DIREKTUR UTAMA (DIRUT)", code: "DIRUT", order: 1, isActive: true },
    { id: 2, name: "DIREKTUR LEGAL DAN MANAJEMEN HUMAN CAPITAL (DIR LHC)", code: "DIR LHC", order: 2, isActive: true },
    { id: 3, name: "DIREKTUR KEUANGAN (DIR KEU)", code: "DIR KEU", order: 3, isActive: true },
    { id: 4, name: "DIREKTUR DISTRIBUSI (DIR DIST)", code: "DIR DIST", order: 4, isActive: true },
    { id: 5, name: "DIREKTUR RETAIL DAN NIAGA (DIR RETAIL)", code: "DIR RETAIL", order: 5, isActive: true },
    { id: 6, name: "DIREKTUR MANAJEMEN PROYEK DAN ENERGI BARU TERBARUKAN (DIR EBT)", code: "DIR EBT", order: 6, isActive: true },
    { id: 7, name: "DIREKTUR PERENCANAAN KORPORAT DAN PENGEMBANGAN BISNIS (DIR RENBANG)", code: "DIR RENBANG", order: 7, isActive: true },
    { id: 8, name: "DIREKTUR TRANSMISI DAN PERENCANAAN SISTEM (DIR TRANS)", code: "DIR TRANS", order: 8, isActive: true },
    { id: 9, name: "DIREKTUR MANAJEMEN PEMBANGKITAN (DIR MKIT)", code: "DIR MKIT", order: 9, isActive: true },
    { id: 10, name: "DIREKTUR MANAJEMEN RISIKO (DIR MRO)", code: "DIR MRO", order: 10, isActive: true },
    { id: 11, name: "DIREKTUR TEKNOLOGI, ENGINEERING, DAN KEBERLANJUTAN (DIR TNK)", code: "DIR TNK", order: 11, isActive: true },
];

export function DireksiTab() {
    const [direksi, setDireksi] = useState(initialDireksi);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingDireksi, setEditingDireksi] = useState<typeof initialDireksi[0] | null>(null);
    const [newDireksi, setNewDireksi] = useState({ name: "", code: "" });

    const handleAdd = () => {
        if (!newDireksi.name || !newDireksi.code) return;

        const newItem = {
            id: Math.max(...direksi.map(d => d.id)) + 1,
            name: newDireksi.name,
            code: newDireksi.code,
            order: direksi.length + 1,
            isActive: true,
        };
        setDireksi([...direksi, newItem]);
        setNewDireksi({ name: "", code: "" });
        setIsAddDialogOpen(false);
    };

    const handleEdit = () => {
        if (!editingDireksi) return;
        setDireksi(direksi.map(d =>
            d.id === editingDireksi.id ? editingDireksi : d
        ));
        setIsEditDialogOpen(false);
        setEditingDireksi(null);
    };

    const handleDelete = (id: number) => {
        setDireksi(direksi.filter(d => d.id !== id));
    };

    const handleToggleActive = (id: number) => {
        setDireksi(direksi.map(d =>
            d.id === id ? { ...d, isActive: !d.isActive } : d
        ));
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
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                    Batal
                                </Button>
                                <Button onClick={handleAdd} className="bg-[#125d72] hover:bg-[#0e4a5c]">
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
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
                                        checked={item.isActive}
                                        onCheckedChange={() => handleToggleActive(item.id)}
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
                                        value={editingDireksi.code}
                                        onChange={(e) => setEditingDireksi({ ...editingDireksi, code: e.target.value.toUpperCase() })}
                                    />
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Batal
                            </Button>
                            <Button onClick={handleEdit} className="bg-[#125d72] hover:bg-[#0e4a5c]">
                                Simpan Perubahan
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}

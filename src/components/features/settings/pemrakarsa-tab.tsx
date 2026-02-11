// src/components/features/settings/pemrakarsa-tab.tsx
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, MoreHorizontal, Pencil, Trash2, Briefcase, Loader2, Search } from "lucide-react";
import { getOrganizationalUnits, createOrganizationalUnit, updateOrganizationalUnit, deleteOrganizationalUnit, type OrganizationalUnit } from "@/server/master-data-actions";
import { showNotify } from "@/components/shared/toast-provider";

const CATEGORY_OPTIONS = [
    { value: "DIREKTUR_PEMRAKARSA", label: "Direktur Pemrakarsa" },
    { value: "PEMRAKARSA", label: "Pemrakarsa" },
    { value: "SUPPORT", label: "Support" },
];

export function PemrakarsaTab() {
    const [units, setUnits] = useState<OrganizationalUnit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<OrganizationalUnit | null>(null);
    const [newUnit, setNewUnit] = useState({ name: "", code: "", category: "" });
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

    // Fetch data on mount
    useEffect(() => {
        async function fetchData() {
            try {
                const data = await getOrganizationalUnits();
                setUnits(data);
            } catch (error) {
                showNotify("Gagal memuat data pemrakarsa", "error");
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    // Filter units
    const filteredUnits = units.filter(unit => {
        const matchesSearch = unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (unit.code?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
        const matchesCategory = categoryFilter === "all" || unit.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const handleAdd = () => {
        if (!newUnit.name || !newUnit.category) {
            showNotify("Nama dan kategori wajib diisi", "error");
            return;
        }

        startTransition(async () => {
            try {
                const result = await createOrganizationalUnit({
                    name: newUnit.name,
                    code: newUnit.code || null,
                    category: newUnit.category,
                });
                setUnits([...units, result]);
                setNewUnit({ name: "", code: "", category: "" });
                setIsAddDialogOpen(false);
                showNotify("Pemrakarsa berhasil ditambahkan", "success");
            } catch (error) {
                showNotify("Gagal menambahkan pemrakarsa", "error");
                console.error(error);
            }
        });
    };

    const handleEdit = () => {
        if (!editingUnit) return;

        startTransition(async () => {
            try {
                const result = await updateOrganizationalUnit(editingUnit.id, {
                    name: editingUnit.name,
                    code: editingUnit.code,
                    category: editingUnit.category,
                    isActive: editingUnit.isActive === true,
                });
                setUnits(units.map(u => u.id === result.id ? result : u));
                setIsEditDialogOpen(false);
                setEditingUnit(null);
                showNotify("Pemrakarsa berhasil diperbarui", "success");
            } catch (error) {
                showNotify("Gagal memperbarui pemrakarsa", "error");
                console.error(error);
            }
        });
    };

    const handleDelete = (id: string) => {
        startTransition(async () => {
            try {
                await deleteOrganizationalUnit(id);
                setUnits(units.filter(u => u.id !== id));
                showNotify("Pemrakarsa berhasil dihapus", "success");
            } catch (error) {
                showNotify("Gagal menghapus pemrakarsa", "error");
                console.error(error);
            }
        });
    };

    const handleToggleActive = (unit: OrganizationalUnit) => {
        startTransition(async () => {
            try {
                const result = await updateOrganizationalUnit(unit.id, {
                    isActive: !unit.isActive,
                });
                setUnits(units.map(u => u.id === result.id ? result : u));
                showNotify(
                    result.isActive ? "Pemrakarsa diaktifkan" : "Pemrakarsa dinonaktifkan",
                    "success"
                );
            } catch (error) {
                showNotify("Gagal mengubah status", "error");
                console.error(error);
            }
        });
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "DIREKTUR_PEMRAKARSA": return "bg-blue-100 text-blue-800";
            case "PEMRAKARSA": return "bg-green-100 text-green-800";
            case "SUPPORT": return "bg-purple-100 text-purple-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-[#125d72]" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#125d72]/10 rounded-lg">
                            <Briefcase className="h-5 w-5 text-[#125d72]" />
                        </div>
                        <div>
                            <CardTitle>Data Pemrakarsa</CardTitle>
                            <CardDescription>
                                Kelola daftar Unit Organisasi (Direktur Pemrakarsa, Pemrakarsa, Support).
                            </CardDescription>
                        </div>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-[#125d72] hover:bg-[#0e4a5c]">
                                <Plus className="h-4 w-4" />
                                Tambah Pemrakarsa
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tambah Pemrakarsa Baru</DialogTitle>
                                <DialogDescription>
                                    Masukkan data unit kerja pemrakarsa baru.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nama Unit Kerja *</Label>
                                    <Input
                                        id="name"
                                        placeholder="Contoh: Direktorat Keuangan"
                                        value={newUnit.name}
                                        onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="code">Kode (Opsional)</Label>
                                    <Input
                                        id="code"
                                        placeholder="Contoh: DHK"
                                        value={newUnit.code}
                                        onChange={(e) => setNewUnit({ ...newUnit, code: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="category">Kategori *</Label>
                                    <Select
                                        value={newUnit.category}
                                        onValueChange={(value) => setNewUnit({ ...newUnit, category: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORY_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                    Batal
                                </Button>
                                <Button
                                    onClick={handleAdd}
                                    className="bg-[#125d72] hover:bg-[#0e4a5c]"
                                    disabled={isPending}
                                >
                                    {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama atau kode..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Kategori</SelectItem>
                            {CATEGORY_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>Nama Unit Kerja</TableHead>
                                <TableHead>Kode</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUnits.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        {searchQuery || categoryFilter !== "all"
                                            ? "Tidak ada data yang sesuai filter"
                                            : "Belum ada data pemrakarsa"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUnits.map((item, index) => (
                                    <TableRow key={item.id} className={isPending ? "opacity-50" : ""}>
                                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>
                                            {item.code ? (
                                                <Badge variant="secondary">{item.code}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getCategoryColor(item.category)}>
                                                {item.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Switch
                                                checked={item.isActive ?? true}
                                                onCheckedChange={() => handleToggleActive(item)}
                                                disabled={isPending}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" disabled={isPending}>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setEditingUnit(item);
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
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Pemrakarsa</DialogTitle>
                            <DialogDescription>
                                Ubah data unit kerja pemrakarsa.
                            </DialogDescription>
                        </DialogHeader>
                        {editingUnit && (
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-name">Nama Unit Kerja</Label>
                                    <Input
                                        id="edit-name"
                                        value={editingUnit.name}
                                        onChange={(e) => setEditingUnit({ ...editingUnit, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-code">Kode</Label>
                                    <Input
                                        id="edit-code"
                                        value={editingUnit.code || ""}
                                        onChange={(e) => setEditingUnit({ ...editingUnit, code: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-category">Kategori</Label>
                                    <Select
                                        value={editingUnit.category}
                                        onValueChange={(value) => setEditingUnit({ ...editingUnit, category: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORY_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Batal
                            </Button>
                            <Button
                                onClick={handleEdit}
                                className="bg-[#125d72] hover:bg-[#0e4a5c]"
                                disabled={isPending}
                            >
                                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                Simpan Perubahan
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}

"use server";

import { db } from "@/lib/db";
import { organizationalUnits } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export type UnitOption = {
    label: string;
    value: string;
};

export type OrganizationalUnit = {
    id: string;
    name: string;
    code: string | null;
    category: string;
    isActive: boolean | null;
    createdAt: Date | null;
};

// Urutan resmi Direksi PLN
const DIRECTOR_ORDER = [
    "DIREKTUR UTAMA (DIRUT)",
    "DIREKTUR LEGAL DAN MANAJEMEN HUMAN CAPITAL (DIR LHC)",
    "DIREKTUR KEUANGAN (DIR KEU)",
    "DIREKTUR DISTRIBUSI (DIR DIST)",
    "DIREKTUR RETAIL DAN NIAGA (DIR RETAIL)",
    "DIREKTUR MANAJEMEN PROYEK DAN ENERGI BARU TERBARUKAN (DIR EBT)",
    "DIREKTUR PERENCANAAN KORPORAT DAN PENGEMBANGAN BISNIS (DIR RENBANG)",
    "DIREKTUR TRANSMISI DAN PERENCANAAN SISTEM (DIR TRANS)",
    "DIREKTUR MANAJEMEN PEMBANGKITAN (DIR MKIT)",
    "DIREKTUR MANAJEMEN RISIKO (DIR MRO)",
    "DIREKTUR TEKNOLOGI, ENGINEERING, DAN KEBERLANJUTAN (DIR TNK)"
];

export async function getUnitsByCategory(category: "DIREKTUR_PEMRAKARSA" | "PEMRAKARSA" | "SUPPORT"): Promise<UnitOption[]> {
    try {
        const data = await db
            .select({
                name: organizationalUnits.name,
                code: organizationalUnits.code
            })
            .from(organizationalUnits)
            .where(eq(organizationalUnits.category, category))
            .orderBy(asc(organizationalUnits.name)); // Default A-Z

        const options = data.map(item => ({
            label: item.name,
            value: item.name
        }));

        // Untuk kategori DIREKTUR_PEMRAKARSA, urutkan sesuai urutan resmi
        if (category === "DIREKTUR_PEMRAKARSA") {
            return options.sort((a, b) => {
                const indexA = DIRECTOR_ORDER.indexOf(a.label);
                const indexB = DIRECTOR_ORDER.indexOf(b.label);
                // Jika tidak ditemukan di daftar, letakkan di akhir
                const orderA = indexA === -1 ? DIRECTOR_ORDER.length : indexA;
                const orderB = indexB === -1 ? DIRECTOR_ORDER.length : indexB;
                return orderA - orderB;
            });
        }

        return options;
    } catch (error) {
        console.error(`❌ Gagal mengambil data kategori ${category}:`, error);
        return [];
    }
}

// ============================================
// CRUD Operations for Organizational Units
// ============================================

// Get all organizational units (for Pemrakarsa & Support tab)
export async function getOrganizationalUnits(): Promise<OrganizationalUnit[]> {
    try {
        const data = await db
            .select()
            .from(organizationalUnits)
            .orderBy(asc(organizationalUnits.category), asc(organizationalUnits.name));

        return data;
    } catch (error) {
        console.error("❌ Gagal mengambil data organizational units:", error);
        throw new Error("Gagal mengambil data");
    }
}

// Create new organizational unit
export async function createOrganizationalUnit(data: {
    name: string;
    code: string | null;
    category: string;
}): Promise<OrganizationalUnit> {
    try {
        const [result] = await db
            .insert(organizationalUnits)
            .values({
                name: data.name,
                code: data.code,
                category: data.category,
                isActive: true,
            })
            .returning();

        if (!result) {
            throw new Error("Insert failed - no result returned");
        }
        return result;
    } catch (error) {
        console.error("❌ Gagal membuat organizational unit:", error);
        throw new Error("Gagal menambahkan data");
    }
}

// Update organizational unit
export async function updateOrganizationalUnit(
    id: string,
    data: Partial<{
        name: string;
        code: string | null;
        category: string;
        isActive: boolean;
    }>
): Promise<OrganizationalUnit> {
    try {
        const [result] = await db
            .update(organizationalUnits)
            .set(data)
            .where(eq(organizationalUnits.id, id))
            .returning();

        if (!result) {
            throw new Error("Update failed - no result returned");
        }
        return result;
    } catch (error) {
        console.error("❌ Gagal memperbarui organizational unit:", error);
        throw new Error("Gagal memperbarui data");
    }
}

// Delete organizational unit
export async function deleteOrganizationalUnit(id: string): Promise<void> {
    try {
        await db
            .delete(organizationalUnits)
            .where(eq(organizationalUnits.id, id));
    } catch (error) {
        console.error("❌ Gagal menghapus organizational unit:", error);
        throw new Error("Gagal menghapus data");
    }
}

// ============================================
// Direksi-specific Operations
// ============================================

// Get all Direksi (DIREKTUR_PEMRAKARSA category) with custom ordering
export async function getDireksiList(): Promise<OrganizationalUnit[]> {
    try {
        const data = await db
            .select()
            .from(organizationalUnits)
            .where(eq(organizationalUnits.category, "DIREKTUR_PEMRAKARSA"))
            .orderBy(asc(organizationalUnits.name));

        // Sort sesuai urutan resmi
        return data.sort((a, b) => {
            const indexA = DIRECTOR_ORDER.indexOf(a.name);
            const indexB = DIRECTOR_ORDER.indexOf(b.name);
            const orderA = indexA === -1 ? DIRECTOR_ORDER.length : indexA;
            const orderB = indexB === -1 ? DIRECTOR_ORDER.length : indexB;
            return orderA - orderB;
        });
    } catch (error) {
        console.error("❌ Gagal mengambil data direksi:", error);
        throw new Error("Gagal mengambil data direksi");
    }
}

// Create new Direksi
export async function createDireksi(data: {
    name: string;
    code: string;
}): Promise<OrganizationalUnit> {
    try {
        const [result] = await db
            .insert(organizationalUnits)
            .values({
                name: data.name,
                code: data.code,
                category: "DIREKTUR_PEMRAKARSA",
                isActive: true,
            })
            .returning();

        if (!result) {
            throw new Error("Insert failed - no result returned");
        }
        return result;
    } catch (error) {
        console.error("❌ Gagal membuat direksi:", error);
        throw new Error("Gagal menambahkan direksi");
    }
}

// Update Direksi
export async function updateDireksi(
    id: string,
    data: Partial<{
        name: string;
        code: string;
        isActive: boolean;
    }>
): Promise<OrganizationalUnit> {
    try {
        const [result] = await db
            .update(organizationalUnits)
            .set(data)
            .where(eq(organizationalUnits.id, id))
            .returning();

        if (!result) {
            throw new Error("Update failed - no result returned");
        }
        return result;
    } catch (error) {
        console.error("❌ Gagal memperbarui direksi:", error);
        throw new Error("Gagal memperbarui direksi");
    }
}

// Delete Direksi
export async function deleteDireksi(id: string): Promise<void> {
    try {
        await db
            .delete(organizationalUnits)
            .where(eq(organizationalUnits.id, id));
    } catch (error) {
        console.error("❌ Gagal menghapus direksi:", error);
        throw new Error("Gagal menghapus direksi");
    }
}
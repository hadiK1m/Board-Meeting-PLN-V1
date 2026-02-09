import "dotenv/config";
import { db } from "@/lib/db"; // Pastikan path ini benar
import { users, agendas, agendasRadir } from "@/db/schema";

// Data Dummy 10 Agenda RADIR Bernuansa PLN/BUMN
const seedData = [
    {
        title: "Laporan Keuangan Konsolidasi Triwulan I 2026",
        director: "Direktur Keuangan",
        initiator: "Divisi Akuntansi",
        status: "Draft",
        urgency: "Normal",
        executionDate: null,
        meetingNumber: null,
    },
    {
        title: "Pengadaan Transformator 500kV Jawa-Bali (Strategis)",
        director: "Direktur Manajemen Proyek",
        initiator: "Divisi Supply Chain",
        status: "Dapat Dilanjutkan",
        urgency: "High",
        executionDate: null,
        meetingNumber: null,
    },
    {
        title: "Evaluasi Kinerja SDM & Talent Management Semester II",
        director: "Direktur Legal & Manajemen Humaniora",
        initiator: "Divisi HTD",
        status: "Dijadwalkan",
        urgency: "Normal",
        executionDate: "2026-02-15",
        meetingNumber: "RADIR-004/2026",
    },
    {
        title: "Kebijakan Keamanan Siber Korporat (Cyber Security Policy)",
        director: "Direktur Perencanaan Korporat",
        initiator: "Divisi STI",
        status: "Selesai",
        urgency: "High",
        executionDate: "2026-01-20",
        meetingNumber: "RADIR-002/2026",
    },
    {
        title: "Rencana Kerja dan Anggaran Perusahaan (RKAP) 2027",
        director: "Direktur Utama",
        initiator: "Divisi Perencanaan Strategis",
        status: "Ditunda",
        urgency: "Critical",
        executionDate: "2026-03-01",
        meetingNumber: null,
    },
    {
        title: "Kerjasama Strategis Pengembangan EBT dengan Mitra Global",
        director: "Direktur Pengembangan Bisnis",
        initiator: "Divisi EBT",
        status: "Dibatalkan",
        urgency: "High",
        executionDate: null,
        meetingNumber: null,
    },
    {
        title: "Persetujuan Pinjaman Investasi Jangka Panjang (KI)",
        director: "Direktur Keuangan",
        initiator: "Divisi Treasury",
        status: "Dapat Dilanjutkan",
        urgency: "High",
        executionDate: null,
        meetingNumber: null,
    },
    {
        title: "Ratifikasi Peraturan Menteri ESDM Terkait Tarif Listrik",
        director: "Direktur Niaga",
        initiator: "Divisi Regulasi",
        status: "Draft",
        urgency: "Normal",
        executionDate: null,
        meetingNumber: null,
    },
    {
        title: "Laporan Audit Internal Kepatuhan GCG Tahun 2025",
        director: "Direktur Utama",
        initiator: "Satuan Pengawas Internal",
        status: "Selesai",
        urgency: "Normal",
        executionDate: "2026-01-10",
        meetingNumber: "RADIR-001/2026",
    },
    {
        title: "Penetapan KPI Direksi Anak Perusahaan Tahun 2026",
        director: "Direktur Legal & Manajemen Humaniora",
        initiator: "Divisi Manajemen Anak Perusahaan",
        status: "Dijadwalkan",
        urgency: "Critical",
        executionDate: "2026-02-20",
        meetingNumber: "RADIR-005/2026",
    },
];

async function main() {
    console.log("🌱 Mulai Seeding Database...");

    try {
        // 1. Buat User Admin Dummy (Untuk CreatedBy)
        // Kita gunakan ID statis agar tidak duplicate saat re-seed
        const adminId = "00000000-0000-0000-0000-000000000001";

        await db
            .insert(users)
            .values({
                id: adminId,
                fullName: "System Administrator",
                email: "admin@system.local",
                role: "admin",
            })
            .onConflictDoNothing(); // Jangan error kalau user sudah ada

        console.log("✅ User Admin siap.");

        // 2. Bersihkan Data Lama (Opsional: Uncomment jika ingin reset total)
        // await db.delete(agendasRadir);
        // await db.delete(agendas);
        // console.log("🧹 Data lama dibersihkan.");

        // 3. Loop Insert Data Agenda
        for (const item of seedData) {
            await db.transaction(async (tx) => {
                // A. Insert ke Table Parent (agendas)
                const insertedAgendas = await tx
                    .insert(agendas)
                    .values({
                        title: item.title,
                        meetingType: "RADIR",
                        status: item.status,
                        director: item.director,
                        initiator: item.initiator,
                        createdById: adminId,
                    })
                    .returning({ id: agendas.id });

                // PERBAIKAN: Ambil item pertama dari array
                const newAgenda = insertedAgendas[0];

                // PERBAIKAN: Cek apakah data berhasil di-insert
                if (!newAgenda) {
                    console.error(`❌ Gagal insert agenda: ${item.title}`);
                    return; // Skip ke iterasi berikutnya atau throw error
                }

                // B. Insert ke Table Child (agendas_radir)
                await tx.insert(agendasRadir).values({
                    agendaId: newAgenda.id,
                    urgency: item.urgency,
                    executionDate: item.executionDate,
                    meetingNumber: item.meetingNumber,
                    // Field lain bisa null/default
                });
            });
        }

        console.log(`🚀 Berhasil seeding agenda RADIR!`);
    } catch (error) {
        console.error("❌ Gagal seeding:", error);
    } finally {
        process.exit(0);
    }
}

main();
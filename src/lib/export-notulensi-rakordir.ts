// src/lib/export-notulensi-rakordir.ts
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { htmlToPlainText } from "@/components/ui/rich-text-editor";

// Types for export data
export interface ExportNotulensiAttendance {
    name: string;
    status: string;
    kuasaTo?: string;
}

export interface ExportNotulensiGuest {
    name: string;
    jabatan: string;
}

export interface ExportNotulensiArahanItem {
    arahan: string;
    targetOutput: string;
    progresTerkini: string;
    evidence: string;
    statusPenyelesaian: string;
}

export interface ExportNotulensiAgenda {
    title: string;
    director: string | null;
    initiator: string | null;
    executiveSummary: string;
    arahanDireksi: ExportNotulensiArahanItem[];
}

export interface ExportNotulensiData {
    notulensiNumber: string | null;
    meetingYear: string | null;
    executionDate: string | null;
    startTime: string | null;
    endTime: string | null;
    meetingMethod: string | null;
    meetingLocation: string | null;
    meetingLink: string | null;
    pimpinanRapat: string[];
    attendance: ExportNotulensiAttendance[];
    guestParticipants: ExportNotulensiGuest[];
    agendas: ExportNotulensiAgenda[];
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "-";
    try {
        return format(new Date(dateStr), "EEEE, dd MMMM yyyy", { locale: idLocale });
    } catch {
        return dateStr;
    }
}

function formatTime(timeStr: string | null): string {
    if (!timeStr) return "-";
    return timeStr;
}

function formatAttendanceList(attendance: ExportNotulensiAttendance[]): string {
    return attendance
        .filter(a => a.status === "hadir" || a.status === "kuasa")
        .map((a, i) => {
            if (a.status === "kuasa" && a.kuasaTo) {
                return `${i + 1}. ${a.name} (diwakili oleh ${a.kuasaTo})`;
            }
            return `${i + 1}. ${a.name}`;
        })
        .join("\n");
}

function formatGuestList(guests: ExportNotulensiGuest[]): string {
    if (guests.length === 0) return "-";
    return guests
        .map((g, i) => {
            if (g.jabatan) {
                return `${i + 1}. ${g.name} - ${g.jabatan}`;
            }
            return `${i + 1}. ${g.name}`;
        })
        .join("\n");
}

function formatArahanDireksiList(arahan: ExportNotulensiArahanItem[]): string {
    if (arahan.length === 0) return "-";
    return arahan
        .map((a, i) => {
            const parts = [`${i + 1}. ${a.arahan}`];
            if (a.targetOutput) parts.push(`   Target Output: ${a.targetOutput}`);
            if (a.progresTerkini) parts.push(`   Progress Terkini: ${a.progresTerkini}`);
            if (a.evidence) parts.push(`   Evidence: ${a.evidence}`);
            return parts.join("\n");
        })
        .join("\n");
}

/** Ambil singkatan dalam kurung (e.g. "EVP RSL") dari teks seperti "EXECUTIVE VICE PRESIDENT ... (EVP RSL), ... (EVP RKO)" -> "EVP RSL, EVP RKO" */
function shortenPemrakarsa(value: string | null): string {
    if (!value || !value.trim()) return "-";
    const matches = value.match(/\(([^)]+)\)/g);
    if (matches && matches.length > 0) {
        return matches.map((m) => m.slice(1, -1).trim()).join(", ");
    }
    return value.trim();
}

function formatAgendaSummaryList(agendas: ExportNotulensiAgenda[]): string {
    if (agendas.length === 0) return "-";
    return agendas
        .map((a, i) => `${i + 1}. ${a.title}`)
        .join(";\n");
}

function formatCatatanKetidakhadiran(attendance: ExportNotulensiAttendance[]): string {
    const notes: string[] = [];
    const kuasaList = attendance.filter(a => a.status === "kuasa" && a.kuasaTo);
    kuasaList.forEach(a => {
        notes.push(`${a.name} memberikan kuasa kepada ${a.kuasaTo}`);
    });
    const tidakHadirList = attendance.filter(a => a.status === "tidak_hadir");
    tidakHadirList.forEach(a => {
        notes.push(`${a.name} tidak hadir`);
    });
    if (notes.length === 0) return "-";
    return notes.join("\n");
}

function numberToIndonesianWords(num: number): string {
    const satuan: Record<number, string> = {
        0: "Nol", 1: "Satu", 2: "Dua", 3: "Tiga", 4: "Empat", 5: "Lima",
        6: "Enam", 7: "Tujuh", 8: "Delapan", 9: "Sembilan", 10: "Sepuluh",
        11: "Sebelas", 12: "Dua Belas", 13: "Tiga Belas", 14: "Empat Belas",
        15: "Lima Belas", 16: "Enam Belas", 17: "Tujuh Belas", 18: "Delapan Belas",
        19: "Sembilan Belas", 20: "Dua Puluh", 21: "Dua Puluh Satu", 22: "Dua Puluh Dua",
        23: "Dua Puluh Tiga", 24: "Dua Puluh Empat", 25: "Dua Puluh Lima",
        26: "Dua Puluh Enam", 27: "Dua Puluh Tujuh", 28: "Dua Puluh Delapan",
        29: "Dua Puluh Sembilan", 30: "Tiga Puluh",
    };
    if (num < 0) return "Negatif " + numberToIndonesianWords(Math.abs(num));
    if (num <= 11) return satuan[num] ?? num.toString();
    if (num < 20) return (satuan[num - 10] ?? "") + " Belas";
    if (num < 100) {
        const puluhan = Math.floor(num / 10);
        const sisa = num % 10;
        return (satuan[puluhan] ?? "") + " Puluh" + (sisa > 0 ? " " + (satuan[sisa] ?? "") : "");
    }
    if (num < 200) return "Seratus" + (num % 100 > 0 ? " " + numberToIndonesianWords(num % 100) : "");
    if (num < 1000) {
        const ratusan = Math.floor(num / 100);
        const sisa = num % 100;
        return (satuan[ratusan] ?? "") + " Ratus" + (sisa > 0 ? " " + numberToIndonesianWords(sisa) : "");
    }
    return num.toString();
}

const TEMPLATE_PATH = "/2. Template Notulensi Rakordir.docx";

export async function exportNotulensiToDocx(data: ExportNotulensiData): Promise<void> {
    try {
        const url = encodeURI(TEMPLATE_PATH);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Gagal memuat template DOCX. Pastikan file 2. Template Notulensi Rakordir.docx ada di folder public.");
        }

        const templateArrayBuffer = await response.arrayBuffer();
        const zip = new PizZip(templateArrayBuffer);

        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        const hadirCount = data.attendance.filter(
            a => a.status === "hadir" || a.status === "kuasa"
        ).length;
        const tamuFormatted = formatGuestList(data.guestParticipants);
        const pimpinanFormatted =
            data.pimpinanRapat.length > 0 ? data.pimpinanRapat.join(", ") : "-";

        const templateData = {
            // Header: Hari/Tanggal, Tempat
            HARI_TANGGAL: formatDate(data.executionDate),
            TEMPAT: data.meetingLocation || "-",
            // Umum
            NOMOR_NOTULENSI: data.notulensiNumber || "-",
            TAHUN: data.meetingYear || "-",
            TANGGAL_RAPAT: formatDate(data.executionDate),
            xx: formatDate(data.executionDate),
            WAKTU_MULAI: formatTime(data.startTime),
            WAKTU_SELESAI: formatTime(data.endTime),
            startTime: formatTime(data.startTime),
            endTime: formatTime(data.endTime),
            METODE_RAPAT: data.meetingMethod || "-",
            LOKASI_RAPAT: data.meetingLocation || "-",
            meetingLocation: data.meetingLocation || "-",
            LINK_RAPAT: data.meetingLink || "-",
            PIMPINAN_RAPAT: pimpinanFormatted,
            pimpinanRapat: pimpinanFormatted,
            DAFTAR_HADIR: formatAttendanceList(data.attendance),
            TAMU_UNDANGAN: tamuFormatted,
            guestParticipants: tamuFormatted,
            // PEMBUKAAN
            agenda_summary_list: formatAgendaSummaryList(data.agendas),
            hadir_count_num: hadirCount,
            hadir_count_terbilang: numberToIndonesianWords(hadirCount),
            catatan_ketidakhadiran: formatCatatanKetidakhadiran(data.attendance),
            // Loop PEMBAHASAN: {#agendas} ... {/agendas}
            agendas: data.agendas.map((agenda, index) => {
                const ringkasan = htmlToPlainText(agenda.executiveSummary) || "-";
                const arahanFormatted = formatArahanDireksiList(agenda.arahanDireksi);
                const pemrakarsaShort = shortenPemrakarsa(agenda.initiator);
                return {
                    NOMOR_AGENDA: index + 1,
                    JUDUL_AGENDA: agenda.title,
                    DIREKTUR_TERKAIT: agenda.director || "-",
                    UNIT_PENGUSUL: pemrakarsaShort,
                    RINGKASAN: ringkasan,
                    ARAHAN_DIREKSI: arahanFormatted,
                    // Alias untuk template: {pemrakarsa} = singkatan saja (EVP RSL, EVP RKO)
                    index: index + 1,
                    title: agenda.title,
                    pemrakarsa: pemrakarsaShort,
                    executiveSummary: ringkasan,
                    arahanDireksi: arahanFormatted,
                };
            }),
        };

        doc.setData(templateData);
        doc.render();

        const output = doc.getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        const filename = `Notulensi_${data.notulensiNumber || "draft"}_${format(new Date(), "yyyyMMdd_HHmmss")}.docx`;
        saveAs(output, filename);
    } catch (error) {
        console.error("Export notulensi error:", error);
        throw error;
    }
}

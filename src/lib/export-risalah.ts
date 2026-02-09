// src/lib/export-risalah.ts
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

import { htmlToPlainText } from "@/components/ui/rich-text-editor";

// Types for export data
export interface ExportAgenda {
    id: string;
    title: string;
    director: string | null;
    initiator: string | null;
    executiveSummary: string;
    considerations: string;
    dissentingOpinion: string;
    decisions: { decision: string; output: string; progressTerkini: string; evidence: string }[];
}

export interface ExportAttendance {
    name: string;
    status: "hadir" | "kuasa" | "tidak_hadir";
    kuasaTo?: string;
}

export interface GuestParticipant {
    name: string;
    jabatan: string;
}

export interface ExportRisalahData {
    meetingNumber: string | null;
    meetingYear: string | null;
    executionDate: string | null;
    startTime: string | null;
    endTime: string | null;
    meetingMethod: string | null;
    meetingLocation: string | null;
    meetingLink: string | null;
    pimpinanRapat: string[];
    attendance: ExportAttendance[];
    guestParticipants: GuestParticipant[];
    agendas: ExportAgenda[];
}

// Format date for display
function formatDate(dateStr: string | null): string {
    if (!dateStr) return "-";
    try {
        return format(new Date(dateStr), "EEEE, dd MMMM yyyy", { locale: idLocale });
    } catch {
        return dateStr;
    }
}

// Format time for display
function formatTime(timeStr: string | null): string {
    if (!timeStr) return "-";
    return timeStr;
}

// Generate the attendance list as a formatted string
function formatAttendanceList(attendance: ExportAttendance[]): string {
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

// Generate guest list as a formatted string
function formatGuestList(guests: GuestParticipant[]): string {
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

// Generate decisions list for an agenda
function formatDecisionsList(decisions: { decision: string; output: string; progressTerkini: string; evidence: string }[]): string {
    if (decisions.length === 0) return "-";
    return decisions
        .map((d, i) => {
            const parts = [`${i + 1}. ${d.decision}`];
            if (d.output) parts.push(`   Output: ${d.output}`);
            if (d.progressTerkini) parts.push(`   Progress Terkini: ${d.progressTerkini}`);
            if (d.evidence) parts.push(`   Evidence: ${d.evidence}`);
            return parts.join("\n");
        })
        .join("\n");
}

// Generate agenda summary list (numbered list of agenda titles)
function formatAgendaSummaryList(agendas: ExportAgenda[]): string {
    if (agendas.length === 0) return "-";
    return agendas
        .map((a, i) => `${i + 1}. ${a.title}`)
        .join("\n");
}

// Generate catatan ketidakhadiran (notes for absent/delegated directors)
function formatCatatanKetidakhadiran(attendance: ExportAttendance[]): string {
    const notes: string[] = [];

    // Directors with kuasa (delegated)
    const kuasaList = attendance.filter(a => a.status === "kuasa" && a.kuasaTo);
    kuasaList.forEach(a => {
        notes.push(`${a.name} memberikan kuasa kepada ${a.kuasaTo}`);
    });

    // Directors tidak hadir
    const tidakHadirList = attendance.filter(a => a.status === "tidak_hadir");
    tidakHadirList.forEach(a => {
        notes.push(`${a.name} tidak hadir`);
    });

    if (notes.length === 0) return "";
    return notes.join("\n");
}

// Format day name from date
function formatDayName(dateStr: string | null): string {
    if (!dateStr) return "-";
    try {
        return format(new Date(dateStr), "EEEE", { locale: idLocale });
    } catch {
        return "-";
    }
}

// Convert number to Indonesian words
function numberToIndonesianWords(num: number): string {
    const satuan: Record<number, string> = {
        0: "Nol",
        1: "Satu",
        2: "Dua",
        3: "Tiga",
        4: "Empat",
        5: "Lima",
        6: "Enam",
        7: "Tujuh",
        8: "Delapan",
        9: "Sembilan",
        10: "Sepuluh",
        11: "Sebelas",
        12: "Dua Belas",
        13: "Tiga Belas",
        14: "Empat Belas",
        15: "Lima Belas",
        16: "Enam Belas",
        17: "Tujuh Belas",
        18: "Delapan Belas",
        19: "Sembilan Belas",
        20: "Dua Puluh",
        21: "Dua Puluh Satu",
        22: "Dua Puluh Dua",
        23: "Dua Puluh Tiga",
        24: "Dua Puluh Empat",
        25: "Dua Puluh Lima",
        26: "Dua Puluh Enam",
        27: "Dua Puluh Tujuh",
        28: "Dua Puluh Delapan",
        29: "Dua Puluh Sembilan",
        30: "Tiga Puluh"

    };

    if (num < 0) {
        return "Negatif " + numberToIndonesianWords(Math.abs(num));
    }
    if (num <= 11) {
        return satuan[num] ?? num.toString();
    }
    if (num < 20) {
        return (satuan[num - 10] ?? "") + " Belas";
    }
    if (num < 100) {
        const puluhan = Math.floor(num / 10);
        const sisa = num % 10;
        const puluhanWord = satuan[puluhan] ?? "";
        const sisaWord = sisa > 0 ? " " + (satuan[sisa] ?? "") : "";
        return puluhanWord + " Puluh" + sisaWord;
    }
    if (num < 200) {
        const sisa = num % 100;
        return "Seratus" + (sisa > 0 ? " " + numberToIndonesianWords(sisa) : "");
    }
    if (num < 1000) {
        const ratusan = Math.floor(num / 100);
        const sisa = num % 100;
        const ratusanWord = satuan[ratusan] ?? "";
        return ratusanWord + " Ratus" + (sisa > 0 ? " " + numberToIndonesianWords(sisa) : "");
    }
    return num.toString();
}

// Format attendance count with Indonesian words: "11 (Sebelas)"
function formatJumlahHadir(count: number): string {
    const words = numberToIndonesianWords(count);
    return `${count} (${words})`;
}

// Export risalah to DOCX
export async function exportRisalahToDocx(data: ExportRisalahData): Promise<void> {
    try {
        // Fetch the template file
        const response = await fetch("/Radir_Lembar Isi.docx");
        if (!response.ok) {
            throw new Error("Gagal memuat template DOCX");
        }

        const templateArrayBuffer = await response.arrayBuffer();
        const zip = new PizZip(templateArrayBuffer);

        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // Prepare template data
        const templateData = {
            // Meeting Info
            NOMOR_RAPAT: data.meetingNumber || "-",
            TAHUN_RAPAT: data.meetingYear || "-",
            TANGGAL_RAPAT: formatDate(data.executionDate),
            WAKTU_MULAI: formatTime(data.startTime),
            WAKTU_SELESAI: formatTime(data.endTime),
            METODE_RAPAT: data.meetingMethod || "-",
            LOKASI_RAPAT: data.meetingLocation || "-",
            LINK_RAPAT: data.meetingLink || "-",

            // Pimpinan Rapat
            PIMPINAN_RAPAT: data.pimpinanRapat.length > 0
                ? data.pimpinanRapat.join(", ")
                : "-",

            // Attendance
            DAFTAR_HADIR: formatAttendanceList(data.attendance),
            JUMLAH_HADIR: formatJumlahHadir(data.attendance.filter(a => a.status === "hadir" || a.status === "kuasa").length),
            JUMLAH_TOTAL: formatJumlahHadir(data.attendance.length),

            // Agenda Summary List (for opening section)
            agenda_summary_list: formatAgendaSummaryList(data.agendas),

            // Catatan Ketidakhadiran
            catatan_ketidakhadiran: formatCatatanKetidakhadiran(data.attendance),

            // Guests
            TAMU_UNDANGAN: formatGuestList(data.guestParticipants),

            // Closing section
            day: formatDayName(data.executionDate),
            endTime: formatTime(data.endTime),

            // Agendas (for looping in template)
            agendas: data.agendas.map((agenda, index) => ({
                NOMOR_AGENDA: index + 1,
                JUDUL_AGENDA: agenda.title,
                DIREKTUR_TERKAIT: agenda.director || "-",
                UNIT_PENGUSUL: agenda.initiator || "-",
                EXECUTIVE_SUMMARY: htmlToPlainText(agenda.executiveSummary) || "-",
                considerations: htmlToPlainText(agenda.considerations) || "-",
                dissentingOpinion: htmlToPlainText(agenda.dissentingOpinion) || "-",
                meetingDecisions: formatDecisionsList(agenda.decisions),
                HAS_DISSENTING: agenda.dissentingOpinion && htmlToPlainText(agenda.dissentingOpinion).trim() !== "",
            })),

            // Combined content for single-page templates
            SEMUA_AGENDA: data.agendas.map((agenda, index) => {
                const parts = [
                    `Agenda ${index + 1}: ${agenda.title}`,
                    `Direktur Terkait: ${agenda.director || "-"}`,
                    `Unit Pengusul: ${agenda.initiator || "-"}`,
                    "",
                    "Executive Summary:",
                    htmlToPlainText(agenda.executiveSummary) || "-",
                    "",
                    "Pertimbangan:",
                    htmlToPlainText(agenda.considerations) || "-",
                    "",
                ];

                const dissentingText = htmlToPlainText(agenda.dissentingOpinion);
                if (dissentingText && dissentingText.trim() !== "") {
                    parts.push("Dissenting Opinion:", dissentingText, "");
                }

                parts.push("Keputusan:", formatDecisionsList(agenda.decisions));

                return parts.join("\n");
            }).join("\n\n" + "=".repeat(50) + "\n\n"),
        };

        // Set data to template
        doc.setData(templateData);

        // Render the document
        doc.render();

        // Generate output
        const output = doc.getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        // Generate filename
        const filename = `Risalah_${data.meetingNumber || "draft"}_${format(new Date(), "yyyyMMdd_HHmmss")}.docx`;

        // Save file
        saveAs(output, filename);

        return;
    } catch (error) {
        console.error("Export error:", error);
        throw error;
    }
}

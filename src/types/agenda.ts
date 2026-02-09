// src/types/agenda.ts

export interface AgendaRadirItem {
    id: string;
    title: string;
    meetingType: "RADIR";
    status: string;
    createdAt: Date;

    urgency: string | null;
    executionDate: string | null;
    meetingNumber: string | null;
    director?: string | null;
    initiator?: string | null;
    deadlineDate?: string | null;

    // TAMBAHKAN FIELD INI AGAR TIDAK ERROR DI UI
    contactPerson?: string | null;
    position?: string | null;
    phone?: string | null;

    // Tipe untuk file harus spesifik
    filePaths?: Record<string, string> | null;
    supportingFiles?: string[] | null;
}

export interface AgendaRakordirItem {
    id: string;
    title: string;
    meetingType: "RAKORDIR";
    status: string;
    createdAt: Date;

    urgency: string | null;
    executionDate: string | null;
    notulensiNumber: string | null;
    director?: string | null;
    initiator?: string | null;
    deadlineDate?: string | null;

    // Contact info
    contactPerson?: string | null;
    position?: string | null;
    phone?: string | null;

    // Tipe untuk file harus spesifik
    filePaths?: Record<string, string> | null;
    supportingFiles?: string[] | null;
}
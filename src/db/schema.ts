import {
    pgTable,
    uuid,
    text,
    varchar,
    timestamp,
    date,
    jsonb,
    boolean,
    integer
} from "drizzle-orm/pg-core";

// --- USERS TABLE (Updated to UUID for consistency) ---
export const users = pgTable('users', {
    // Hapus defaultRandom(). ID ini akan diisi manual sesuai ID dari Supabase Auth
    id: uuid('id').primaryKey(),
    fullName: text('full_name').notNull(),
    email: text('email').notNull().unique(),
    role: text('role').default('user'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
});

// --- TWO FACTOR AUTHENTICATION TABLE ---
export const twoFactorAuth = pgTable('two_factor_auth', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),

    // Encrypted TOTP secret (encrypted with server-side key)
    encryptedSecret: text('encrypted_secret').notNull(),

    // Backup codes (hashed, stored as JSON array)
    backupCodes: jsonb('backup_codes').default([]),

    // Status
    isEnabled: boolean('is_enabled').default(false).notNull(),
    isVerified: boolean('is_verified').default(false).notNull(),

    // Security tracking
    lastUsedAt: timestamp('last_used_at'),
    failedAttempts: integer('failed_attempts').default(0),
    lockedUntil: timestamp('locked_until'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- 2FA AUDIT LOG TABLE ---
export const twoFactorAuditLog = pgTable('two_factor_audit_log', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

    // Action types: 'setup_initiated', 'setup_completed', 'verification_success', 
    // 'verification_failed', 'backup_code_used', 'disabled', 'locked', 'unlocked'
    action: text('action').notNull(),

    // Additional metadata
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    metadata: jsonb('metadata').default({}),

    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- BASE TABLE (Common Fields) ---
export const agendas = pgTable("agendas", {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    meetingType: varchar("meeting_type", { length: 20 }).notNull(), // 'RADIR' | 'RAKORDIR' | 'KEPDIR_SIRKULER'

    // Initiator Info (Shared by all)
    director: text("director"),
    initiator: text("initiator"),
    contactPerson: text("contact_person"),
    position: text("position"),
    phone: text("phone"),
    notes: text("notes"),

    status: text("status").default("Draft").notNull(),
    createdById: uuid("created_by_id").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- RADIR SPECIFIC TABLE ---
export const agendasRadir = pgTable("agendas_radir", {
    agendaId: uuid("agenda_id").references(() => agendas.id, { onDelete: "cascade" }).primaryKey(),

    // Data Utama
    urgency: text("urgency"),
    support: text("support"),

    // Attachments
    legalReview: text("legal_review"),
    riskReview: text("risk_review"),
    complianceReview: text("compliance_review"),
    regulationReview: text("regulation_review"),
    recommendationNote: text("recommendation_note"),
    proposalNote: text("proposal_note"),
    presentationMaterial: text("presentation_material"),
    supportingDocuments: jsonb("supporting_documents").default([]),

    // Logistik
    meetingNumber: varchar("meeting_number", { length: 50 }),
    meetingYear: varchar("meeting_year", { length: 4 }),
    executionDate: date("execution_date"),
    deadlineDate: date("deadline_date"),
    startTime: varchar("start_time", { length: 5 }),
    endTime: varchar("end_time", { length: 50 }).default("Selesai"),
    meetingMethod: varchar("meeting_method", { length: 50 }),
    meetingLocation: text("meeting_location"),
    meetingLink: text("meeting_link"),

    // Output / Risalah
    pimpinanRapat: jsonb("pimpinan_rapat").default([]),
    attendanceData: jsonb("attendance_data").default({}),
    guestParticipants: jsonb("guest_participants").default([]),
    executiveSummary: text("executive_summary"),
    considerations: text("considerations"),
    risalahBody: text("risalah_body"),
    meetingDecisions: jsonb("meeting_decisions").default([]), // KHUSUS RADIR
    dissentingOpinion: text("dissenting_opinion"),
    risalahTtd: text("risalah_ttd"),
});

// --- RAKORDIR SPECIFIC TABLE ---
export const agendasRakordir = pgTable("agendas_rakordir", {
    agendaId: uuid("agenda_id").references(() => agendas.id, { onDelete: "cascade" }).primaryKey(),

    urgency: text("urgency"),
    support: text("support"),

    // Attachments
    presentationMaterial: text("presentation_material"),
    proposalNote: text("proposal_note"),
    supportingDocuments: jsonb("supporting_documents").default([]),

    // Logistik
    notulensiNumber: varchar("notulensi_number", { length: 50 }),
    meetingYear: varchar("meeting_year", { length: 4 }),
    executionDate: date("execution_date"),
    deadlineDate: date("deadline_date"),
    startTime: varchar("start_time", { length: 5 }),
    endTime: varchar("end_time", { length: 50 }),
    meetingMethod: varchar("meeting_method", { length: 50 }),
    meetingLocation: text("meeting_location"),
    meetingLink: text("meeting_link"),

    // Output / Notulensi
    arahanDireksi: jsonb("arahan_direksi").default([]), // KHUSUS RAKORDIR - Array of arahan items
    catatanRapat: text("catatan_rapat"),
    pimpinanRapat: jsonb("pimpinan_rapat").default([]),
    attendanceData: jsonb("attendance_data").default({}),
    guestParticipants: jsonb("guest_participants").default([]),
    executiveSummary: text("executive_summary"),
    notulensiTtd: text("notulensi_ttd"),
});

// --- KEPDIR SIRKULER SPECIFIC TABLE ---
export const agendasKepdirSirkuler = pgTable("agendas_kepdir_sirkuler", {
    agendaId: uuid("agenda_id").references(() => agendas.id, { onDelete: "cascade" }).primaryKey(),

    // Specific Documents
    kepdirSirkulerDoc: text("kepdir_sirkuler_doc").notNull(),
    grcDoc: text("grc_doc").notNull(),
    supportingDocuments: jsonb("supporting_documents").default([]),

    // Metadata Sirkuler
    urgency: text("urgency").default("Normal"),
    priority: text("priority").default("Low"),
    finalSignedDoc: text("final_signed_doc"), // Path ke dokumen final setelah ditandatangani
});

export const organizationalUnits = pgTable("organizational_units", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    code: text("code"), // Kolom ini boleh NULL
    category: text("category").notNull(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
});
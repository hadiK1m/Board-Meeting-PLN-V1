CREATE TABLE "agendas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"meeting_type" varchar(20) NOT NULL,
	"director" text,
	"initiator" text,
	"contact_person" text,
	"position" text,
	"phone" text,
	"notes" text,
	"status" text DEFAULT 'Draft' NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agendas_kepdir_sirkuler" (
	"agenda_id" uuid PRIMARY KEY NOT NULL,
	"kepdir_sirkuler_doc" text NOT NULL,
	"grc_doc" text NOT NULL,
	"supporting_documents" jsonb DEFAULT '[]'::jsonb,
	"urgency" text DEFAULT 'Normal',
	"priority" text DEFAULT 'Low',
	"final_signed_doc" text
);
--> statement-breakpoint
CREATE TABLE "agendas_radir" (
	"agenda_id" uuid PRIMARY KEY NOT NULL,
	"urgency" text,
	"support" text,
	"legal_review" text,
	"risk_review" text,
	"compliance_review" text,
	"regulation_review" text,
	"recommendation_note" text,
	"proposal_note" text,
	"presentation_material" text,
	"supporting_documents" jsonb DEFAULT '[]'::jsonb,
	"meeting_number" varchar(50),
	"meeting_year" varchar(4),
	"execution_date" date,
	"start_time" time,
	"end_time" varchar(50) DEFAULT 'Selesai',
	"meeting_method" varchar(50),
	"meeting_location" text,
	"meeting_link" text,
	"pimpinan_rapat" jsonb DEFAULT '[]'::jsonb,
	"attendance_data" jsonb DEFAULT '{}'::jsonb,
	"guest_participants" jsonb DEFAULT '[]'::jsonb,
	"executive_summary" text,
	"considerations" text,
	"risalah_body" text,
	"meeting_decisions" jsonb DEFAULT '[]'::jsonb,
	"dissenting_opinion" text,
	"risalah_ttd" text
);
--> statement-breakpoint
CREATE TABLE "agendas_rakordir" (
	"agenda_id" uuid PRIMARY KEY NOT NULL,
	"urgency" text,
	"support" text,
	"presentation_material" text,
	"proposal_note" text,
	"supporting_documents" jsonb DEFAULT '[]'::jsonb,
	"execution_date" date,
	"start_time" time,
	"end_time" varchar(50),
	"meeting_method" varchar(50),
	"meeting_location" text,
	"meeting_link" text,
	"arahan_direksi" jsonb DEFAULT '[]'::jsonb,
	"catatan_rapat" text,
	"pimpinan_rapat" jsonb DEFAULT '[]'::jsonb,
	"attendance_data" jsonb DEFAULT '{}'::jsonb,
	"guest_participants" jsonb DEFAULT '[]'::jsonb,
	"executive_summary" text
);
--> statement-breakpoint
CREATE TABLE "organizational_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"category" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'user',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "agendas" ADD CONSTRAINT "agendas_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendas_kepdir_sirkuler" ADD CONSTRAINT "agendas_kepdir_sirkuler_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendas_radir" ADD CONSTRAINT "agendas_radir_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agendas_rakordir" ADD CONSTRAINT "agendas_rakordir_agenda_id_agendas_id_fk" FOREIGN KEY ("agenda_id") REFERENCES "public"."agendas"("id") ON DELETE cascade ON UPDATE no action;
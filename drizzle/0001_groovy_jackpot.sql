ALTER TABLE "agendas_radir" ALTER COLUMN "start_time" SET DATA TYPE varchar(5);--> statement-breakpoint
ALTER TABLE "agendas_rakordir" ALTER COLUMN "start_time" SET DATA TYPE varchar(5);--> statement-breakpoint
ALTER TABLE "agendas_radir" ADD COLUMN "deadline_date" date;--> statement-breakpoint
ALTER TABLE "agendas_rakordir" ADD COLUMN "notulensi_number" varchar(50);--> statement-breakpoint
ALTER TABLE "agendas_rakordir" ADD COLUMN "meeting_year" varchar(4);--> statement-breakpoint
ALTER TABLE "agendas_rakordir" ADD COLUMN "deadline_date" date;--> statement-breakpoint
ALTER TABLE "agendas_rakordir" ADD COLUMN "notulensi_ttd" text;
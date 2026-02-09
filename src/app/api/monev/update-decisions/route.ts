// src/app/api/monev/update-decisions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agendasRadir } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { agendaId, decisions } = body;

        if (!agendaId || !decisions) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Update the meeting decisions in the database
        await db
            .update(agendasRadir)
            .set({
                meetingDecisions: decisions,
            })
            .where(eq(agendasRadir.agendaId, agendaId));

        // Revalidate the monev page
        revalidatePath("/monev/radir");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating decisions:", error);
        return NextResponse.json(
            { error: "Failed to update decisions" },
            { status: 500 }
        );
    }
}

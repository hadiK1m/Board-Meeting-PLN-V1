// src/app/api/monev/update-arahan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agendasRakordir } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { agendaId, arahanDireksi } = body;

        if (!agendaId || !arahanDireksi) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Update the arahan direksi in the database
        await db
            .update(agendasRakordir)
            .set({
                arahanDireksi: arahanDireksi,
            })
            .where(eq(agendasRakordir.agendaId, agendaId));

        // Revalidate the monev page
        revalidatePath("/monev/rakordir");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating arahan direksi:", error);
        return NextResponse.json(
            { error: "Failed to update arahan direksi" },
            { status: 500 }
        );
    }
}

import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardMockup } from "@/components/shared/dashboard-previews";

export const metadata: Metadata = {
  title: "Board Meeting PLN",
};

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-4xl font-bold mb-4">Board Meeting System</h1>
      <Button asChild size="lg">
        <Link href="/login">Masuk ke Aplikasi</Link>
      </Button>
      <div className="w-full mt-12 opacity-50 grayscale hover:grayscale-0 transition-all">
        <DashboardMockup />
      </div>
    </main>
  );
}
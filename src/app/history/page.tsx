import {
  HistoryBrowser,
  type HistorySeason,
} from "@/components/public/HistoryBrowser";
import { PublicHeader } from "@/components/public/PublicHeader";
import historyData from "@/data/history-seasons.json";
import season5Seed from "../../../seed/season5.json";

export default function PublicHistoryPage() {
  const season5Players = season5Seed.players.map((p) => ({
    fullName: p.full_name,
    ratingStart: p.rating_start,
  }));

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-xl font-extrabold">
          W8 · Lịch sử kết quả & Phong độ qua các mùa
        </h1>
        <HistoryBrowser
          seasons={historyData as HistorySeason[]}
          season5Players={season5Players}
        />
      </main>
    </div>
  );
}

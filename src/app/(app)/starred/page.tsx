import { Star } from "lucide-react";
import { ComingSoon } from "@/components/common/coming-soon";

export const metadata = { title: "Starred — Postal" };

export default function Page() {
  return <ComingSoon icon={Star} title="Starred" phase="Phase 4" />;
}

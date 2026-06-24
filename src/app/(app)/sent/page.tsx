import { Send } from "lucide-react";
import { ComingSoon } from "@/components/common/coming-soon";

export const metadata = { title: "Sent — Postal" };

export default function Page() {
  return <ComingSoon icon={Send} title="Sent" phase="Phase 3" />;
}

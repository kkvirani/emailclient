import { FileText } from "lucide-react";
import { ComingSoon } from "@/components/common/coming-soon";

export const metadata = { title: "Drafts — Postal" };

export default function Page() {
  return <ComingSoon icon={FileText} title="Drafts" phase="Phase 4" />;
}

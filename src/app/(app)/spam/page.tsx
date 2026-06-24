import { ShieldAlert } from "lucide-react";
import { ComingSoon } from "@/components/common/coming-soon";

export const metadata = { title: "Spam — Postal" };

export default function Page() {
  return <ComingSoon icon={ShieldAlert} title="Spam" phase="Phase 3" />;
}

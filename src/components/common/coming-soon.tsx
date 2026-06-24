import * as React from "react";
import { EmptyState } from "@/components/common/empty-state";

export function ComingSoon({
  icon,
  title,
  phase,
}: {
  icon: React.ElementType;
  title: string;
  phase: string;
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={`Arriving in ${phase}. The foundation (design system, data model, auth, sync architecture) is in place — see /docs for the full plan.`}
    />
  );
}

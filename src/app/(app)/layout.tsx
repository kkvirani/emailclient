import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };

  // Title is overridden per-route via the page; default to Inbox.
  return <AppShell title="Inbox" user={user}>{children}</AppShell>;
}

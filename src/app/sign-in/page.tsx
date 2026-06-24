import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function SignInPage() {
  const session = await auth();

  // If already authenticated, redirect straight to inbox
  if (session?.user) {
    redirect("/inbox");
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4">
      {/* Decorative gradient glowing spheres */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 rounded-full bg-primary/20 blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />

      {/* Glassmorphic card */}
      <div className="glass w-full max-w-md rounded-2xl p-8 shadow-2xl transition-all duration-300 hover:shadow-primary/5">
        <div className="flex flex-col items-center text-center">
          {/* Logo Icon */}
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Mail className="h-6 w-6 animate-bounce" />
          </div>

          <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            Postal
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A keyboard-first, AI-augmented personal email client.
          </p>

          <div className="my-8 h-[1px] w-full bg-border/60" />

          {/* Sign In Button / Form */}
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/inbox" });
            }}
            className="w-full"
          >
            <Button
              type="submit"
              size="lg"
              className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-primary text-primary-foreground font-semibold shadow-md transition-all hover:bg-primary/95 hover:shadow-lg active:scale-[0.98]"
            >
              {/* Google G logo SVG */}
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" strokeLinejoin="round" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Sign in with Google
            </Button>
          </form>

          {/* Bypass Button for Local Testing */}
          <form
            action={async () => {
              "use server";
              await signIn("credentials", { redirectTo: "/inbox" });
            }}
            className="mt-3 w-full"
          >
            <Button
              type="submit"
              variant="outline"
              size="lg"
              className="w-full rounded-xl font-semibold border-border/80 hover:bg-muted/50 transition-all duration-200 active:scale-[0.98]"
            >
              Bypass Google OAuth (Dev Mock)
            </Button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground/60 leading-relaxed">
            By signing in, you will connect your Gmail inbox securely. Single-user owner security policy is active.
          </p>
        </div>
      </div>
    </div>
  );
}

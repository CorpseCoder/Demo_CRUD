import { redirect } from "next/navigation";
import { headers } from "next/headers";

import LoginForm from "@/components/LoginForm";
import { auth } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/games");

  const { mode } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <LoginForm
        defaultMode={mode === "signup" ? "signup" : "signin"}
        githubEnabled={Boolean(process.env.GITHUB_CLIENT_ID)}
        googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID)}
      />
    </main>
  );
}

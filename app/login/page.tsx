import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LoginPanel } from "@/app/login/login-panel";
import { authOptions } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 md:px-6">
      <LoginPanel />
    </main>
  );
}

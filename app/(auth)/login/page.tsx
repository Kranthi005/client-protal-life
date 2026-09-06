import { AuthCard } from "@/components/auth/auth-card";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { login } from "@/app/auth/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  return (
    <AuthCard title="Welcome back" description="Sign in to access your NEXUS workspace." alternate={{ text: "New to NEXUS?", href: "/sign-up", label: "Create an account" }}>
      {message && <p role="alert" className="mb-5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</p>}
      <form action={login} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">Email<input required name="email" type="email" autoComplete="email" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none ring-slate-900 focus:ring-2" /></label>
        <label className="block text-sm font-medium text-slate-700">Password<input required name="password" type="password" autoComplete="current-password" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none ring-slate-900 focus:ring-2" /></label>
        <AuthSubmitButton>Sign in</AuthSubmitButton>
      </form>
    </AuthCard>
  );
}

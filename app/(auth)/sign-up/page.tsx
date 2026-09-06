import { AuthCard } from "@/components/auth/auth-card";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { signUp } from "@/app/auth/actions";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  return (
    <AuthCard title="Create your account" description="Get a clear, shared view of your client projects." alternate={{ text: "Already have an account?", href: "/login", label: "Sign in" }}>
      {message && <p role="alert" className="mb-5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{message}</p>}
      <form action={signUp} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">Full name<input required name="full_name" type="text" autoComplete="name" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none ring-slate-900 focus:ring-2" /></label>
        <label className="block text-sm font-medium text-slate-700">Email<input required name="email" type="email" autoComplete="email" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none ring-slate-900 focus:ring-2" /></label>
        <label className="block text-sm font-medium text-slate-700">Password<input required minLength={6} name="password" type="password" autoComplete="new-password" className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none ring-slate-900 focus:ring-2" /></label>
        <label className="block text-sm font-medium text-slate-700">I am joining as<select name="role" defaultValue="SERVICE_PROVIDER" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none ring-slate-900 focus:ring-2"><option value="SERVICE_PROVIDER">Service provider</option><option value="CLIENT">Client</option></select></label>
        <AuthSubmitButton>Create account</AuthSubmitButton>
      </form>
    </AuthCard>
  );
}

import Link from "next/link";

export function AuthCard({ children, title, description, alternate }: {
  children: React.ReactNode;
  title: string;
  description: string;
  alternate: { text: string; href: string; label: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="mb-8 block">
          <span className="text-xl font-bold tracking-tight text-slate-950">NEXUS</span>
          <span className="mt-1 block text-xs font-medium text-slate-500">Intelligent Client Project Portal</span>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-7">{children}</div>
        <p className="mt-6 text-center text-sm text-slate-600">
          {alternate.text} <Link href={alternate.href} className="font-semibold text-slate-900 hover:underline">{alternate.label}</Link>
        </p>
      </section>
    </main>
  );
}

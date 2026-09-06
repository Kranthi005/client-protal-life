import { Construction } from "lucide-react";

export default async function PlaceholderPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const label = section.charAt(0).toUpperCase() + section.slice(1);
  return <section className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm"><Construction className="mx-auto text-slate-400" size={30} /><h1 className="mt-4 text-xl font-semibold text-slate-900">{label}</h1><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">This area is prepared in the NEXUS navigation and will be built in a future phase.</p></section>;
}

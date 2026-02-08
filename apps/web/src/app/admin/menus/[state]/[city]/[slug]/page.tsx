import { MenuEditor } from "./MenuEditor";

export default async function MenuEditorPage({
  params,
}: {
  params: Promise<{ state: string; city: string; slug: string }>;
}) {
  const { state, city, slug } = await params;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">
          Admin Menu Editor
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Editing menu for {state.toUpperCase()}/{city}/{slug}
        </p>
      </div>
      <MenuEditor state={state} city={city} slug={slug} />
    </div>
  );
}

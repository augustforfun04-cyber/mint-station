import { DeployForm } from "@/components/deploy-form";

export default function HomePage() {
  return (
    <div className="pb-10">
      <h1 className="text-3xl font-semibold tracking-tight">Launch</h1>
      <p className="mb-8 mt-1 text-sm text-zinc-500">Name, pair, sign.</p>
      <DeployForm />
    </div>
  );
}

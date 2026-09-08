import { DeployForm } from "@/components/deploy-form";

export default function HomePage() {
  return (
    <div className="pb-10">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Launch token</h1>
      <DeployForm />
    </div>
  );
}

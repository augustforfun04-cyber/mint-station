import { SettingsForm } from "@/components/settings-form";

export default function SettingsPage() {
  return (
    <div className="space-y-5 pb-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pair, keep, and reserved claim wallet — per connected account.
        </p>
      </div>
      <SettingsForm />
    </div>
  );
}

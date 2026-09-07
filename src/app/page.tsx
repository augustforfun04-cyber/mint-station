import { DeployForm } from "@/components/deploy-form";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs font-medium tracking-[0.2em] text-lime-300 uppercase">
          On-chain · tanpa Bankr API
        </p>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Deploy ERC-20 sendiri. Mint supply ke wallet yang kamu tuju, jumlahnya kamu yang tentukan.
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Bankr API sebelumnya hanya menaruh launch di server Bankr (kunci{" "}
          <code className="font-mono">bk_usr_</code>, supply 100 miliar kaku, mint
          creator 15% saja). App ini tidak memanggil itu. Wallet kamu yang
          menandatangani deploy: total supply, persen/jumlah mint, tujuan, sisa,
          mintable, burnable, dan chain — semuanya manual.
        </p>
      </section>
      <DeployForm />
    </div>
  );
}

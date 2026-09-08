# Launch

Launchpad ERC-20: **name, pair, you keep, swap fee**, website, lalu mint on-chain dari wallet.

Fitur yang mengikuti Long Studio (tanpa factory Long / Uniswap hook):

- Fetch metadata dari CA / Dexscreener
- Pair WETH, USDC, atau stock ticker (NVDA, TSLA, …)
- Swap fee tercatat (untuk LP nanti)
- You Keep (reserved ke deployer, sisa ke wallet pair)
- Claim, History, Settings (default pair/keep/IPFS)

Deploy on-chain dari wallet. Tidak ada Bankr API, API key, atau database.

## Jalankan lokal

```bash
npm install
npm run dev
```

Buka http://127.0.0.1:4317

## Deploy ke Vercel

Aplikasi ini Next.js biasa. Tidak perlu environment variable. Wallet user yang bayar gas saat launch token.

### Opsi A — tombol Publish di Cursor (paling cepat)

1. Di percakapan project ini, klik **Publish**.
2. Kalau diminta, login / hubungkan akun [Vercel](https://vercel.com).
3. Tunggu build selesai. Vercel memberi URL seperti `https://nama-project.vercel.app`.
4. Buka URL itu, connect wallet, lalu coba form Launch.

Kalau tombol menampilkan **Reconnect to Vercel**, klik itu dulu supaya otorisasi Vercel aktif lagi.

### Opsi B — dashboard Vercel (butuh repo GitHub)

1. Buat repository GitHub untuk project ini (di Cursor: **Create repo**), lalu pastikan `main` sudah ter-push.
2. Buka [vercel.com/new](https://vercel.com/new) dan login.
3. **Import** repository itu. Framework Preset biarkan **Next.js**. Root Directory `.`.
4. Settings build (biasanya otomatis, jangan diubah kecuali berbeda):
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output: default Next.js (jangan isi Output Directory)
   - Node.js: 20.x atau lebih baru
5. **Environment Variables:** kosongkan. Tidak ada secret yang wajib.
6. Klik **Deploy**. Tunggu sampai status Ready.
7. Buka domain Production. Kalau form muncul dan dropdown Chain berisi Robinhood Chain, deploy berhasil.

Deploy berikutnya: push ke `main` → Vercel build otomatis.

### Opsi C — Vercel CLI

Di folder project, dengan Node 20+:

```bash
npm install
npx vercel login
npx vercel
```

Ikuti prompt (link ke akun, pilih scope, nama project). Preview URL muncul setelah build.

Production:

```bash
npx vercel --prod
```

### Cek setelah live

- Halaman `/` menampilkan form Launch (Name, Ticker, Website, Chain, mint ke wallet tujuan).
- Connect wallet di browser (ekstensi EVM). Deploy token membutuhkan native gas di chain yang dipilih (ETH di Base / Robinhood Chain, dst.).
- History di `/riwayat` tetap di `localStorage` browser pengunjung, bukan di server Vercel.

### Kalau build gagal

- Pastikan Node 20+.
- Jangan set Output Directory.
- `npm run build` harus menjalankan compile kontrak lalu `next build`. Artifact ada di `src/lib/generated/manual-token.json`.
- Tidak perlu RPC key: RPC publik sudah di-set di kode (termasuk Robinhood Chain).

# Launch token

Launchpad ERC-20: isi nama, pair Bankr, mint supply ke wallet tujuan, lalu sign dari wallet kamu.

Empat menu: **Launch**, **Claim**, **History**, **Settings**.

## Pair Bankr

Form Launch memakai daftar pair dari Bankr docs:

- **WETH** (default) di Base dan Robinhood Chain
- Quote Base: BNKR, ba3Pump, cbHYPE, cbZEC, TAO
- **B20** di Base: AAPL, AMZN, COIN, CRCL, GOOGL, INTC, META, MSFT, MSTR, NVDA, SNDK, SPCX, TSLA
- Saham **Robinhood Chain** termasuk NVDA, TSLA, GME, MSTR, ADBE, DDOG, plus ticker umum (AAPL, SPY, …)

Kalau Bankr sudah punya deploy live dengan pair saham itu, ticker-nya muncul di menu Pair (badge **live**) dan di **History → Bankr · pair saham live**.

Mint tetap dari wallet (ERC-20 custom). Tidak memakai Bankr deploy API / API key.

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

- Halaman `/` menampilkan form Launch token (Name, Ticker, image, Website, X, Telegram, Chain, mint slider, pair Bankr).
- Connect wallet di browser (ekstensi EVM). Deploy token membutuhkan native gas di chain yang dipilih (ETH di Base / Robinhood Chain, dst.).
- History di `/history` menyimpan deploy lokal di `localStorage` dan menampilkan launch Bankr yang pair saham.

### Kalau build gagal

- Pastikan Node 20+.
- Jangan set Output Directory.
- `npm run build` harus menjalankan compile kontrak lalu `next build`. Artifact ada di `src/lib/generated/manual-token.json`.
- Tidak perlu RPC key: RPC publik sudah di-set di kode (termasuk Robinhood Chain).

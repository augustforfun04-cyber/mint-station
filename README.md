# Bankr Launchpad

UI deploy token untuk [Bankr](https://docs.bankr.bot/) — launch ERC-20 lewat Doppler / Uniswap V4, lalu **mint 15% supply ke wallet yang dituju**.

Bankr tidak mendukung mint setelah kontrak hidup. Supply standar tetap **100 miliar**. Fitur mint di app ini memakai aturan resmi Bankr:

| Alokasi | Porsi | Tujuan |
| --- | --- | --- |
| Liquidity pool | 85% | Uniswap V4, langsung bisa ditrade |
| Creator vesting | 15% | Dipremint ke wallet tujuan, vesting 1 tahun (cliff 30 hari) |

Wallet tujuan dikirim sebagai `feeRecipient` pada `POST https://api.bankr.bot/token-launches/deploy`. Alamat itu juga yang menerima 0.665% volume (95% dari swap fee 0.7%). Penerima vesting terkunci di saat launch — memindahkan fee rights nanti **tidak** memindahkan alokasi yang sudah dipremint.

## Fitur

- Deploy User Key (`X-API-Key`) atau Partner Key (`X-Partner-Key`)
- Simulasi tanpa on-chain tx (`simulateOnly`) — tidak memakai kuota 3/24 jam
- Mint 15% ke alamat EVM, ENS, X, atau Farcaster
- Chain: Base (gas sering disponsori), Robinhood Chain, Arbitrum
- Quote token Base: WETH, BNKR, ba3Pump, cbHYPE, cbZEC, TAO
- Degen mode ($2.500 starting cap) dan quote-only fees
- Daftar launch terbaru + cek/claim fee

Partner Key **tidak** memint creator allocation (100% masuk pool) dan hanya Base.

## Syarat wallet retail

- Wallet Bankr berumur ≥ 24 jam
- Saldo ≥ 0.002 native ETH di rantai launch
- Maks 3 percobaan terhitung / 24 jam, 1 deploy / menit
- 5 menit pertama: tiap wallet max 2% supply (kecuali partner)

Dapatkan kunci di [bankr.bot](https://bankr.bot) atau:

```bash
npm i -g @bankr/cli
bankr login
```

Kunci harus punya Token Launch API (default CLI) dan tidak read-only.

## Menjalankan lokal

```bash
npm install
npm run dev
```

Buka [http://127.0.0.1:4317](http://127.0.0.1:4317). Tempel API key di panel atas. Kunci hanya disimpan di `localStorage` browser.

Opsional, salin `.env.example` ke `.env.local` dan isi `BANKR_API_KEY` sebagai cadangan server-side.

```bash
npm run build
npm start
```

## API yang dipakai

| Aksi | Endpoint Bankr |
| --- | --- |
| Deploy / simulasi | `POST /token-launches/deploy` |
| Wallet | `GET /wallet/me` |
| Launch terbaru | `GET /token-launches` |
| Fee token | `GET /token-launches/:token/fees` |
| Claim | `POST /token-launches/:token/fees/claim` |

Referensi: [Token Launching](https://docs.bankr.bot/token-launching/overview) · [Deploy API](https://docs.bankr.bot/token-launching/api-reference/deploy-token-launch)

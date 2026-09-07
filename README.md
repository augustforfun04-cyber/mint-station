# Manual Token Lab

Deploy ERC-20 langsung dari wallet, tanpa Bankr API.

**Bankr API itu apa?** Endpoint hosted Bankr (`https://api.bankr.bot`) yang mendeploy token lewat Doppler/Uniswap V4. Kamu harus punya kunci `bk_usr_` / `bk_ptr_`, supply-nya kaku 100 miliar, dan mint creator hanya 15% vesting. App ini **tidak memakai itu**. Transaksi ditandatangani MetaMask (atau wallet injected lain) ke kontrak `ManualToken` milikmu.

## Yang bisa diatur manual

- Chain: Base, Base Sepolia (tes), Ethereum, BNB, Arbitrum, Polygon, Optimism, Unichain, World Chain, Avalanche
- Nama, simbol, desimal (18 / 9 / 8 / 6 / 0)
- Total supply & max supply
- Mint ke wallet tujuan: **persen atau jumlah exact**
- Sisa supply: deployer (LP), wallet lain, atau burn
- Mintable / burnable setelah deploy
- Preset (Memecoin, Agent, Utility, Fair) — hanya starting point, semua field tetap bisa diubah

Menu **Mint** memanggil `mint(tujuan, jumlah)` on-chain jika token mintable dan kamu owner. **Inspect** membaca kontrak via RPC publik. **Riwayat** tersimpan di browser.

## Jalankan

```bash
npm install
npm run compile   # solc → src/lib/generated/manual-token.json
npm run dev
```

Buka [http://127.0.0.1:4317](http://127.0.0.1:4317). Hubungkan wallet, pilih chain, isi supply, isi wallet tujuan, deploy.

Base Sepolia untuk tes tanpa ETH mainnet. Wallet harus punya native token untuk gas.

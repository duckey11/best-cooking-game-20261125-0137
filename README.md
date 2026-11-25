# Midnight Sizzle

Game masak 2D di dapur kecil jam malam. Sajikan pesanan sebelum pelanggan
kehabisan sabar, sebelum shift 3 menit berakhir atau 3 hati habis.

## Cara main

- Order datang berkala di papan atas, makin cepat tiap 60 detik (rush).
- Ambil bahan di stasiun, masak di panggangan / penggorengan / panci,
  potong selada dan tomat di talenan (tahan E 1,5 detik), rakit 3 bahan
  di meja peracikan, antar piring lengkap ke jendela saji.
- Patty, ayam, dan mie gosong kalau dibiarkan terlalu lama. Bahan salah
  atau gosong bisa dibuang ke tempat sampah.
- Sajian tepat waktu dapat skor + tip sesuai sisa kesabaran; sajian
  beruntun menaikkan combo. Order gagal mengurangi 1 hati.

## Tips

- Sajikan selagi kesabaran pelanggan masih tinggi untuk tip terbesar,
  dan jaga combo tetap hidup dengan sajian beruntun tanpa gagal.
- Jangan tinggalkan bahan di panggangan, penggorengan, atau panci:
  angkat tepat waktu sebelum gosong dan harus dibuang.

## Resep

1. **Burger Klasik**: roti bun + patty panggang (6 dtk) + selada potong
2. **Nasi Ayam Krispi**: nasi + ayam goreng (4 dtk) + tomat potong
3. **Mie Kuah**: mie (5 dtk) + telur + selada potong

## Kontrol

- **WASD / panah**: gerakkan chef (klik juga bisa: klik stasiun untuk jalan ke sana)
- **E**: interaksi (ambil, masak, potong, rakit, buang); tahan untuk memotong
- **Spasi**: sajikan piring lengkap di jendela saji
- **R**: restart, **M**: bisu

## Serve lokal

```sh
node serve.ts
```

Lalu buka http://localhost:8080. Tanpa build step, tanpa jaringan,
semua gambar digambar di canvas dan semua suara disintesis WebAudio.

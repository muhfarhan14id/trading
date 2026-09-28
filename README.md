# TradeView Lite — Analisa Crypto & Forex (tanpa login, tanpa API key)

- Crypto (15 pair): Binance public API. Forex + Emas/Perak (12 pair): Yahoo Finance public endpoint.
- `api/candles.js` = Vercel Function sebagai proxy (menghindari CORS Yahoo) dan normalisasi candle.
- Analisa otomatis per timeframe (5m, 15m, 1h, 4h, 1d): EMA20/50/200, RSI, MACD, Bollinger, ATR, Support/Resistance -> sinyal BUY/SELL/NETRAL, Entry, SL (1.5x ATR), TP1 (2.25x ATR), TP2 (4x ATR).
- Chart: candlestick + volume + EMA + Bollinger, panel RSI, panel MACD. Alat gambar: garis horizontal, trendline, Fibonacci retracement.
- Auto refresh tiap 30 detik. Ringkasan multi-timeframe.

## Deploy
```
npm i -g vercel
vercel --prod
```
Tidak ada environment variable. Lokal: `vercel dev`.

Hanya untuk edukasi, bukan saran finansial.

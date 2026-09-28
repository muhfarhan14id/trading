const TA = {
  ema(a, p) { const k = 2 / (p + 1); let e; return a.map((v, i) => e = i ? v * k + e * (1 - k) : v); },
  sma(a, p) { return a.map((_, i) => i < p - 1 ? null : a.slice(i - p + 1, i + 1).reduce((x, y) => x + y, 0) / p); },
  rsi(c, p = 14) {
    let g = 0, l = 0; const r = [];
    for (let i = 0; i < c.length; i++) {
      if (!i) { r.push(null); continue; }
      const d = c[i] - c[i - 1], u = Math.max(d, 0), n = Math.max(-d, 0);
      if (i <= p) { g += u; l += n; if (i < p) { r.push(null); continue; } g /= p; l /= p; }
      else { g = (g * (p - 1) + u) / p; l = (l * (p - 1) + n) / p; }
      r.push(l === 0 ? 100 : 100 - 100 / (1 + g / l));
    }
    return r;
  },
  macd(c) { const f = this.ema(c, 12), s = this.ema(c, 26), m = f.map((v, i) => v - s[i]), sg = this.ema(m, 9); return { m, sg, h: m.map((v, i) => v - sg[i]) }; },
  atr(d, p = 14) { return this.ema(d.map((x, i) => i ? Math.max(x.h - x.l, Math.abs(x.h - d[i - 1].c), Math.abs(x.l - d[i - 1].c)) : x.h - x.l), p); },
  bb(c, p = 20) {
    const m = this.sma(c, p);
    return m.map((v, i) => { if (v == null) return null; const s = Math.sqrt(c.slice(i - p + 1, i + 1).reduce((a, x) => a + (x - v) ** 2, 0) / p); return { u: v + 2 * s, m: v, l: v - 2 * s }; });
  },
  fmt(v) { return v >= 100 ? v.toFixed(2) : v >= 1 ? v.toFixed(4) : v.toFixed(6); },
  analyze(d) {
    const c = d.map(x => x.c), n = c.length - 1, px = c[n];
    const e20 = this.ema(c, 20), e50 = this.ema(c, 50), e200 = this.ema(c, 200);
    const rsi = this.rsi(c), mc = this.macd(c), atr = this.atr(d)[n], bb = this.bb(c)[n];
    let s = 0; const why = [];
    const add = (v, t) => { s += v; why.push({ v, t }); };
    e20[n] > e50[n] ? add(1, 'EMA20 di atas EMA50 (tren naik jangka pendek)') : add(-1, 'EMA20 di bawah EMA50 (tren turun jangka pendek)');
    px > e200[n] ? add(1, 'Harga di atas EMA200 (tren besar bullish)') : add(-1, 'Harga di bawah EMA200 (tren besar bearish)');
    const r = rsi[n];
    r < 30 ? add(1.5, `RSI ${r.toFixed(1)} oversold, potensi pantulan naik`) : r > 70 ? add(-1.5, `RSI ${r.toFixed(1)} overbought, potensi koreksi`) : r > 50 ? add(0.5, `RSI ${r.toFixed(1)} momentum condong naik`) : add(-0.5, `RSI ${r.toFixed(1)} momentum condong turun`);
    mc.h[n] > 0 ? add(mc.h[n] > mc.h[n - 1] ? 1.5 : 1, 'Histogram MACD positif') : add(mc.h[n] < mc.h[n - 1] ? -1.5 : -1, 'Histogram MACD negatif');
    if (bb) { px < bb.l ? add(1, 'Harga menembus Bollinger bawah') : px > bb.u ? add(-1, 'Harga menembus Bollinger atas') : 0; }
    const rec = d.slice(-50), res = Math.max(...rec.map(x => x.h)), sup = Math.min(...rec.map(x => x.l));
    const dir = s >= 0 ? 1 : -1, strong = Math.abs(s) >= 2.5;
    return {
      px, s, atr, r, res, sup, e20: e20[n], e50: e50[n], e200: e200[n], why, dir, strong,
      label: strong ? (dir > 0 ? 'BUY' : 'SELL') : 'NETRAL',
      conf: Math.min(95, Math.round(Math.abs(s) / 5.5 * 100)),
      entry: px, sl: px - dir * 1.5 * atr, tp1: px + dir * 2.25 * atr, tp2: px + dir * 4 * atr
    };
  }
};

// Proxy data pasar publik (tanpa API key). Crypto: Binance, Forex/Emas: Yahoo Finance.
const YH = { '5m': ['5m', '5d'], '15m': ['15m', '5d'], '1h': ['60m', '1mo'], '4h': ['60m', '6mo'], '1d': ['1d', '1y'] };
const FX = { XAUUSD: 'GC=F', XAGUSD: 'SI=F' };
const HOSTS = ['data-api.binance.vision', 'api.binance.com'];

function agg(d, s) {
  const m = new Map();
  for (const x of d) {
    const k = Math.floor(x.t / s) * s, b = m.get(k);
    if (!b) m.set(k, { ...x, t: k });
    else { b.h = Math.max(b.h, x.h); b.l = Math.min(b.l, x.l); b.c = x.c; b.v += x.v; }
  }
  return [...m.values()];
}

module.exports = async (req, res) => {
  const { market, symbol = '', tf = '1h' } = req.query;
  if (!/^[A-Z0-9]{3,12}$/.test(symbol) || !YH[tf] || !['crypto', 'forex'].includes(market))
    return res.status(400).json({ error: 'Parameter tidak valid' });
  try {
    let data;
    if (market === 'crypto') {
      let r;
      for (const h of HOSTS) {
        r = await fetch(`https://${h}/api/v3/klines?symbol=${symbol}&interval=${tf}&limit=500`);
        if (r.ok) break;
      }
      if (!r.ok) throw new Error('Binance error ' + r.status);
      data = (await r.json()).map(k => ({ t: Math.floor(k[0] / 1000), o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: +k[5] }));
    } else {
      const [iv, rg] = YH[tf];
      const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${FX[symbol] || symbol + '=X'}?interval=${iv}&range=${rg}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!r.ok) throw new Error('Yahoo error ' + r.status);
      const x = (await r.json()).chart.result[0], q = x.indicators.quote[0];
      data = [];
      x.timestamp.forEach((t, i) => { if (q.close[i] != null && q.open[i] != null) data.push({ t, o: q.open[i], h: q.high[i], l: q.low[i], c: q.close[i], v: q.volume[i] || 0 }); });
      if (tf === '4h') data = agg(data, 14400);
    }
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
    res.status(200).json({ data });
  } catch (e) { res.status(502).json({ error: e.message }); }
};

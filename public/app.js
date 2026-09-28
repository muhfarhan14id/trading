const $ = id => document.getElementById(id);
const SYMS = {
  Crypto: ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT','DOGEUSDT','ADAUSDT','AVAXUSDT','LINKUSDT','DOTUSDT','TRXUSDT','LTCUSDT','MATICUSDT','SHIBUSDT','TONUSDT'],
  Forex: ['EURUSD','GBPUSD','USDJPY','AUDUSD','USDCAD','USDCHF','NZDUSD','EURJPY','GBPJPY','EURGBP','XAUUSD','XAGUSD']
};
const TFS = ['5m','15m','1h','4h','1d'];
let tf = '1h', mode = 'cursor', pend = null, drawn = [], lines = [], data = [], first = true;

$('sym').innerHTML = Object.entries(SYMS).map(([g, a]) => `<optgroup label="${g}">${a.map(s => `<option value="${g.toLowerCase()}|${s}">${s}</option>`).join('')}</optgroup>`).join('');
$('tfs').innerHTML = TFS.map(t => `<button data-t="${t}" class="${t === tf ? 'on' : ''}">${t}</button>`).join('');
$('tools').innerHTML = [['cursor','🖱️ Kursor'],['h','━ Horizontal'],['t','╱ Trendline'],['f','Fib'],['clear','🗑️ Hapus']].map(([k, l]) => `<button data-m="${k}" class="${k === mode ? 'on' : ''}">${l}</button>`).join('');

const opt = h => ({ height: h, layout: { background: { color: '#161b22' }, textColor: '#8b949e' }, grid: { vertLines: { color: '#222a33' }, horzLines: { color: '#222a33' } }, rightPriceScale: { borderColor: '#2a313c' }, timeScale: { borderColor: '#2a313c', timeVisible: true }, crosshair: { mode: 0 } });
const main = LightweightCharts.createChart($('main'), opt(420)), rsiC = LightweightCharts.createChart($('rsi'), opt(110)), macdC = LightweightCharts.createChart($('macd'), opt(130));
const cs = main.addCandlestickSeries({ upColor: '#3fb950', downColor: '#f85149', wickUpColor: '#3fb950', wickDownColor: '#f85149', borderVisible: false });
const vol = main.addHistogramSeries({ priceScaleId: 'vol', priceFormat: { type: 'volume' } }); main.priceScale('vol').applyOptions({ scaleMargins: { top: .85, bottom: 0 } });
const e20 = main.addLineSeries({ color: '#f5c542', lineWidth: 1, priceLineVisible: false }), e50 = main.addLineSeries({ color: '#58a6ff', lineWidth: 1, priceLineVisible: false }), e200 = main.addLineSeries({ color: '#bc8cff', lineWidth: 2, priceLineVisible: false });
const bu = main.addLineSeries({ color: '#4d5566', lineWidth: 1, priceLineVisible: false, lastValueVisible: false }), bl = main.addLineSeries({ color: '#4d5566', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
const rs = rsiC.addLineSeries({ color: '#d29922', lineWidth: 2 }); [30, 70].forEach(v => rs.createPriceLine({ price: v, color: '#6e7681', lineStyle: 2, title: '' }));
const mh = macdC.addHistogramSeries({ priceLineVisible: false }), mm = macdC.addLineSeries({ color: '#58a6ff', lineWidth: 1, priceLineVisible: false }), ms = macdC.addLineSeries({ color: '#f0883e', lineWidth: 1, priceLineVisible: false });
[rsiC, macdC].forEach(c => main.timeScale().subscribeVisibleLogicalRangeChange(r => r && c.timeScale().setVisibleLogicalRange(r)));
new ResizeObserver(() => { const w = $('main').clientWidth; [main, rsiC, macdC].forEach(c => c.applyOptions({ width: w })); }).observe($('main'));

const ser = (a, f) => a.map((x, i) => f(x, i)).filter(x => x.value != null);
function render() {
  const t = data.map(x => x.t), c = data.map(x => x.c);
  cs.setData(data.map(x => ({ time: x.t, open: x.o, high: x.h, low: x.l, close: x.c })));
  vol.setData(data.map(x => ({ time: x.t, value: x.v, color: x.c >= x.o ? '#3fb95055' : '#f8514955' })));
  const L = (s, arr) => s.setData(arr.map((v, i) => ({ time: t[i], value: v })).filter(x => x.value != null && isFinite(x.value)));
  L(e20, TA.ema(c, 20)); L(e50, TA.ema(c, 50)); L(e200, TA.ema(c, 200));
  const bb = TA.bb(c); L(bu, bb.map(b => b && b.u)); L(bl, bb.map(b => b && b.l));
  L(rs, TA.rsi(c)); const m = TA.macd(c); L(mm, m.m); L(ms, m.sg);
  mh.setData(m.h.map((v, i) => ({ time: t[i], value: v, color: v >= 0 ? '#3fb95099' : '#f8514999' })));
  lines.forEach(l => cs.removePriceLine(l)); lines = [];
  const a = TA.analyze(data), pl = (price, color, title) => lines.push(cs.createPriceLine({ price, color, lineWidth: 1, lineStyle: 0, axisLabelVisible: true, title }));
  pl(a.entry, '#d6dbe3', 'ENTRY'); pl(a.sl, '#f85149', 'SL'); pl(a.tp1, '#3fb950', 'TP1'); pl(a.tp2, '#2ea043', 'TP2'); pl(a.res, '#8b949e', 'Resist'); pl(a.sup, '#8b949e', 'Support');
  if (first) { main.timeScale().fitContent(); first = false; }
  panel(a);
}
function panel(a) {
  const f = TA.fmt, side = a.dir > 0 ? 'BUY' : 'SELL', rr = Math.abs(a.tp1 - a.entry) / Math.abs(a.entry - a.sl);
  $('panel').innerHTML = `<div class="lbl">${$('sym').value.split('|')[1]} • ${tf}</div><div id="price">${f(a.px)}</div>
  <p><span class="badge ${a.label}">${a.label}</span> <span class="lbl">Keyakinan ${a.conf}%</span></p>
  ${a.strong ? '' : `<div class="lbl">Sinyal belum kuat. Bias lemah ke arah ${side}, tunggu konfirmasi.</div>`}
  <table><tr><td>Arah setup</td><td class="${a.dir > 0 ? 'up' : 'dn'}">${side}</td></tr><tr><td>Entry</td><td>${f(a.entry)}</td></tr>
  <tr><td>Stop Loss</td><td class="dn">${f(a.sl)}</td></tr><tr><td>Take Profit 1</td><td class="up">${f(a.tp1)}</td></tr><tr><td>Take Profit 2</td><td class="up">${f(a.tp2)}</td></tr>
  <tr><td>Risk:Reward (TP1)</td><td>1 : ${rr.toFixed(2)}</td></tr><tr><td>Support / Resistance</td><td>${f(a.sup)} / ${f(a.res)}</td></tr><tr><td>ATR(14)</td><td>${f(a.atr)}</td></tr></table>
  <div class="lbl">Alasan analisa</div><ul>${a.why.map(w => `<li class="${w.v > 0 ? 'up' : 'dn'}">${w.t}</li>`).join('')}</ul>
  <div class="lbl">Multi-timeframe</div><div class="mtf" id="mtf">memuat...</div>`;
}
async function fetchTF(t) {
  const [m, s] = $('sym').value.split('|'), r = await fetch(`/api/candles?market=${m}&symbol=${s}&tf=${t}`), j = await r.json();
  if (!j.data) throw new Error(j.error || 'gagal memuat'); return j.data;
}
async function load() {
  $('st').textContent = 'Memuat...';
  try { data = await fetchTF(tf); render(); $('st').textContent = 'Update ' + new Date().toLocaleTimeString('id-ID'); mtf(); }
  catch (e) { $('st').textContent = 'Error: ' + e.message; }
}
async function mtf() {
  const out = await Promise.all(TFS.map(async t => { try { const a = TA.analyze(t === tf ? data : await fetchTF(t)); return `<span class="${a.label}">${t}: ${a.label}</span>`; } catch { return `<span class="NETRAL">${t}: -</span>`; } }));
  if ($('mtf')) $('mtf').innerHTML = out.join('');
}
function clearDraw() { drawn.forEach(d => d.line ? cs.removePriceLine(d.line) : main.removeSeries(d.ser)); drawn = []; pend = null; }
main.subscribeClick(p => {
  if (!p.point || !p.time || mode === 'cursor') return;
  const price = cs.coordinateToPrice(p.point.y);
  if (mode === 'h') return drawn.push({ line: cs.createPriceLine({ price, color: '#f5c542', lineStyle: 2, title: 'H' }) });
  if (!pend) { pend = { time: p.time, price }; $('st').textContent = 'Klik titik kedua...'; return; }
  const a = pend, b = { time: p.time, price }; pend = null;
  if (a.time === b.time) return;
  if (mode === 't') {
    const s = main.addLineSeries({ color: '#58a6ff', lineWidth: 2, lastValueVisible: false, priceLineVisible: false });
    s.setData([a, b].sort((x, y) => x.time - y.time).map(x => ({ time: x.time, value: x.price }))); drawn.push({ ser: s });
  } else if (mode === 'f') {
    [0, .236, .382, .5, .618, .786, 1].forEach(r => drawn.push({ line: cs.createPriceLine({ price: a.price + (b.price - a.price) * r, color: '#bc8cff', lineStyle: 2, lineWidth: 1, title: 'Fib ' + r }) }));
  }
  $('st').textContent = 'Update ' + new Date().toLocaleTimeString('id-ID');
});
$('tfs').onclick = e => { if (!e.target.dataset.t) return; tf = e.target.dataset.t; [...$('tfs').children].forEach(b => b.classList.toggle('on', b === e.target)); first = true; load(); };
$('tools').onclick = e => {
  const k = e.target.dataset.m; if (!k) return;
  if (k === 'clear') return clearDraw();
  mode = k; pend = null; [...$('tools').children].forEach(b => b.classList.toggle('on', b.dataset.m === k));
};
$('sym').onchange = () => { clearDraw(); first = true; load(); };
load(); setInterval(load, 30000);

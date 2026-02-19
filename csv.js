/* ═══════════════════════════════════════════════════
   csv.js — CSV Parser + FI Calculator
   For FICalculatorCSV.html
═══════════════════════════════════════════════════ */

let portfolio = [];
let csvChart  = null;

/* ── Drag & Drop ───────────────────────────────── */
const zone = document.getElementById('uploadZone');
zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('dragover'); });
zone.addEventListener('dragleave', ()  => zone.classList.remove('dragover'));
zone.addEventListener('drop', e => {
  e.preventDefault();
  zone.classList.remove('dragover');
  const f = e.dataTransfer.files[0];
  if (f) processFile(f);
});

function handleFile(e) {
  const f = e.target.files[0];
  if (f) processFile(f);
}

/* ── File Handler ──────────────────────────────── */
function processFile(file) {
  clearMsgs();
  const ext = file.name.split('.').pop().toLowerCase();

  if (!['csv', 'txt', 'xls', 'xlsx'].includes(ext)) {
    showErr('Unsupported file type. Please upload a .csv or .txt file.');
    return;
  }
  if (['xls', 'xlsx'].includes(ext)) {
    showWarn('Excel file detected. For best accuracy, export as CSV from your broker app.');
  }

  document.getElementById('filenameText').textContent = file.name;
  document.getElementById('uploadFilename').classList.add('show');

  const reader = new FileReader();
  reader.onload = e => parseCSV(e.target.result);
  reader.readAsText(file);
}

/* ── CSV Parser ────────────────────────────────── */
function parseCSV(raw) {
  const lines = raw.trim().split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) { showErr('File is empty or has only one row.'); return; }

  const delim   = detectDelim(lines[0]);
  const headers = splitLine(lines[0], delim).map(h => h.replace(/["']/g, '').trim().toLowerCase());

  const C = {
    name:     col(headers, ['fund name','name','scheme name','stock','security','instrument','symbol','scrip','tradingsymbol']),
    type:     col(headers, ['type','investment type','mode','category','instrument type']),
    invested: col(headers, ['invested amount','invested','purchase value','buy value','cost','investment','amount invested','purchase amount','avg. net amount invested']),
    current:  col(headers, ['current value','market value','present value','ltp value','value','current amount','last price value','mktvalue']),
    units:    col(headers, ['units','quantity','qty','shares','balance units','net quantity']),
    nav:      col(headers, ['nav','current nav','price','ltp','last price','close']),
    avgPrice: col(headers, ['avg price','average price','avg buy price','avg cost']),
  };

  const rows = [];
  const skipped = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i], delim);
    if (cells.length < 2) { skipped.push(i + 1); continue; }

    const name     = C.name     >= 0 ? clean(cells[C.name])     : `Row ${i}`;
    const typeRaw  = C.type     >= 0 ? clean(cells[C.type]).toLowerCase() : '';
    let   invested = C.invested >= 0 ? num(cells[C.invested])   : 0;
    let   current  = C.current  >= 0 ? num(cells[C.current])    : 0;
    const units    = C.units    >= 0 ? num(cells[C.units])      : 0;
    const navVal   = C.nav      >= 0 ? num(cells[C.nav])        : 0;
    const avgPrice = C.avgPrice >= 0 ? num(cells[C.avgPrice])   : 0;

    if (current  === 0 && units > 0 && navVal   > 0) current  = +(units * navVal).toFixed(2);
    if (invested === 0 && units > 0 && avgPrice > 0) invested = +(units * avgPrice).toFixed(2);

    if (!name || (invested === 0 && current === 0)) { skipped.push(i + 1); continue; }

    rows.push({ name, type: mapType(typeRaw, name), invested, current });
  }

  if (rows.length === 0) {
    showErr('Could not extract holdings. Check that your CSV has columns: Fund Name, Invested Amount, Current Value.');
    return;
  }
  if (skipped.length > 0) {
    showWarn(`${skipped.length} row(s) skipped (empty or missing data): rows ${skipped.slice(0, 6).join(', ')}${skipped.length > 6 ? '…' : ''}`);
  }

  portfolio = rows;
  renderPreview(rows);
}

/* ── Helpers: Parsing ──────────────────────────── */
function detectDelim(line) {
  const tabs   = (line.match(/\t/g) || []).length;
  const commas = (line.match(/,/g)  || []).length;
  const semis  = (line.match(/;/g)  || []).length;
  if (tabs > commas && tabs > semis) return '\t';
  if (semis > commas) return ';';
  return ',';
}

function splitLine(line, d) {
  const res = []; let cur = ''; let inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === d && !inQ) { res.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  res.push(cur.trim());
  return res;
}

function col(headers, candidates) {
  for (const c of candidates) {
    const i = headers.findIndex(h => h.includes(c));
    if (i >= 0) return i;
  }
  return -1;
}

function mapType(raw, name) {
  if (/sip|systematic/.test(raw))            return 'SIP';
  if (/lump|one.time|single/.test(raw))      return 'Lumpsum';
  if (/equity|elss|growth/.test(raw) || /nse|bse/.test(name.toLowerCase())) return 'Equity';
  if (/debt|liquid|bond|overnight|gilt/.test(raw)) return 'Debt';
  return 'SIP';
}

function clean(v)  { return (v || '').replace(/["']/g, '').trim(); }
function num(v) {
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/[₹,\s"'%]/g, ''));
  return isNaN(n) ? 0 : n;
}

/* ── Render Preview Table ──────────────────────── */
function renderPreview(rows) {
  let totInv = 0, totCur = 0;
  rows.forEach(r => { totInv += r.invested; totCur += r.current; });
  const gain    = totCur - totInv;
  const gainPct = totInv > 0 ? ((gain / totInv) * 100).toFixed(1) : '—';

  document.getElementById('summaryStrip').innerHTML = `
    <div class="sum-box"><div class="slabel">Total Invested</div><div class="sval">₹${cr(totInv)}</div></div>
    <div class="sum-box"><div class="slabel">Current Value</div><div class="sval">₹${cr(totCur)}</div></div>
    <div class="sum-box"><div class="slabel">Overall Gain</div><div class="sval ${gain < 0 ? 'neg' : ''}">₹${cr(Math.abs(gain))}<br><span style="font-size:0.85rem">${gainPct}%</span></div></div>
    <div class="sum-box"><div class="slabel">Holdings</div><div class="sval">${rows.length}</div></div>
  `;

  const chipMap = { SIP: 'chip-sip', Lumpsum: 'chip-lump', Equity: 'chip-equity', Debt: 'chip-debt' };
  let tbody = '';
  rows.forEach((r, i) => {
    const ret    = r.invested > 0 ? ((r.current - r.invested) / r.invested * 100) : null;
    const retStr = ret !== null ? (ret >= 0 ? `+${ret.toFixed(1)}%` : `${ret.toFixed(1)}%`) : '—';
    const retCls = ret === null ? '' : ret >= 0 ? 'ret-pos' : 'ret-neg';
    tbody += `<tr>
      <td style="color:var(--muted)">${i + 1}</td>
      <td>${r.name}</td>
      <td><span class="chip ${chipMap[r.type] || 'chip-sip'}">${r.type}</span></td>
      <td>₹${fmt(r.invested)}</td>
      <td>₹${fmt(r.current > 0 ? r.current : r.invested)}</td>
      <td class="${retCls}">${retStr}</td>
    </tr>`;
  });

  document.getElementById('previewBody').innerHTML = tbody;
  document.getElementById('previewSection').classList.remove('hidden');
}

/* ── FI Calculation ────────────────────────────── */
function calculate() {
  const age    = +document.getElementById('currentAge').value;
  const rate   = +document.getElementById('returnRate').value / 100;
  const target = +document.getElementById('targetCorpus').value;
  let   mSIP   = +document.getElementById('monthlySIP').value || 0;
  const stepUp = +document.getElementById('sipStepUp').value  / 100 || 0;

  if (!age || !rate || !target) {
    alert('Please fill in Current Age, Expected Annual Return, and Target Corpus.');
    return;
  }

  let corpus   = portfolio.reduce((s, r) => s + (r.current > 0 ? r.current : r.invested), 0);
  let invested = portfolio.reduce((s, r) => s + r.invested, 0);
  let yrSIP    = mSIP * 12;
  let curAge   = age;

  while (corpus < target && curAge < 100) {
    corpus   += yrSIP;
    invested += yrSIP;
    corpus   *= (1 + rate);
    if (stepUp > 0) yrSIP *= (1 + stepUp);
    curAge++;
  }

  const success     = corpus >= target;
  const yearsToFI   = curAge - age;
  const totalReturn = corpus - invested;
  const startCorpus = portfolio.reduce((s, r) => s + (r.current > 0 ? r.current : r.invested), 0);

  document.getElementById('fiNumber').textContent = success ? curAge : '—';
  document.getElementById('fiSub').textContent    = success
    ? `Financial Independence in ${yearsToFI} year${yearsToFI !== 1 ? 's' : ''}` : '';
  const failEl = document.getElementById('fiFail');
  failEl.textContent   = success ? '' : 'Target not achievable. Try a higher SIP or return rate.';
  failEl.style.display = success ? 'none' : 'block';

  document.getElementById('projTable').innerHTML = `
    <tr><td>Starting corpus (from CSV)</td><td>₹${cr(startCorpus)}</td></tr>
    <tr><td>Total invested by FI date</td><td>₹${cr(Math.round(invested))}</td></tr>
    <tr><td>Projected corpus at FI</td><td>₹${cr(Math.round(corpus))}</td></tr>
    <tr><td>Total returns earned</td><td style="color:var(--accent)">₹${cr(Math.round(totalReturn > 0 ? totalReturn : 0))}</td></tr>
    <tr><td>Target corpus</td><td>₹${cr(target)}</td></tr>
    <tr><td>Years to achieve FI</td><td>${success ? yearsToFI + ' yrs' : 'Not achievable'}</td></tr>
    <tr><td>FI age</td><td style="color:var(--accent);font-family:var(--serif)">${success ? curAge : '—'}</td></tr>
  `;

  drawDonut(Math.round(invested), Math.round(totalReturn > 0 ? totalReturn : 0));
  document.getElementById('resultsSection').classList.remove('hidden');
  document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── Donut Chart ───────────────────────────────── */
function drawDonut(inv, ret) {
  const ctx = document.getElementById('csvDonut');
  if (csvChart) csvChart.destroy();
  csvChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Total Invested', 'Total Returns'],
      datasets: [{
        data: [inv, ret],
        backgroundColor: ['#182219', '#2ee89a'],
        borderColor:     ['#1c2b20', '#2ee89a'],
        borderWidth: 1
      }]
    },
    options: {
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#e4ede8', font: { family: 'DM Sans', size: 12 }, padding: 16 }
        }
      }
    }
  });
}

/* ── Sample CSV Download ───────────────────────── */
function downloadSample() {
  const csv = [
    'Fund Name,Type,Invested Amount,Current Value,Units,NAV',
    'Mirae Asset Large Cap Fund,SIP,150000,198000,2340,84.6',
    'Axis Bluechip Fund,SIP,120000,162000,1850,87.57',
    'HDFC Mid-Cap Opportunities,SIP,90000,128000,1100,116.36',
    'Parag Parikh Flexi Cap,Lumpsum,200000,310000,3200,96.87',
    'SBI Small Cap Fund,SIP,60000,95000,890,106.74',
    'Nippon India Liquid Fund,Debt,50000,54000,320,168.75',
    'Reliance Industries,Equity,75000,98000,62,1580.64',
    'HDFC Bank,Equity,50000,61000,100,610.00',
  ].join('\n');

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'sample_portfolio.csv';
  a.click();
}

/* ── Reset ─────────────────────────────────────── */
function resetAll() {
  portfolio = [];
  document.getElementById('csvFile').value = '';
  document.getElementById('uploadFilename').classList.remove('show');
  document.getElementById('previewSection').classList.add('hidden');
  document.getElementById('resultsSection').classList.add('hidden');
  document.getElementById('previewBody').innerHTML = '';
  clearMsgs();
  ['currentAge', 'returnRate', 'targetCorpus', 'monthlySIP', 'sipStepUp'].forEach(id => {
    document.getElementById(id).value = '';
  });
}

/* ── Message Helpers ───────────────────────────── */
function showErr(msg)  { const el = document.getElementById('msgError'); el.textContent = '⚠ ' + msg; el.classList.add('show'); }
function showWarn(msg) { const el = document.getElementById('msgWarn');  el.textContent = 'ℹ ' + msg; el.classList.add('show'); }
function clearMsgs()   {
  document.getElementById('msgError').classList.remove('show');
  document.getElementById('msgWarn').classList.remove('show');
}

/* ── Format Helpers ────────────────────────────── */
function fmt(n) {
  return n ? (+n).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '0';
}
function cr(n) {
  n = +n;
  if (n >= 1e7) return (n / 1e7).toFixed(2) + ' Cr';
  if (n >= 1e5) return (n / 1e5).toFixed(2) + ' L';
  return fmt(n);
}

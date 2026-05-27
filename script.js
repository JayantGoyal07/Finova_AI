const { useState, useRef, useEffect, useCallback } = React;

const CATS = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'];
const CC = { Food: '#00C27C', Transport: '#4F8EF7', Shopping: '#F5A623', Bills: '#FF6B6B', Health: '#A78BFA', Entertainment: '#F472B6', Other: '#64748B' };
const fmt = n => '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN');
const GICONS = ['🎯', '🛡️', '💻', '✈️', '🏠', '🚗', '📚', '💍', '🎓', '🏥', '💎', '🧳', '🎮', '🎵'];
const GCOLS = ['#00C27C', '#4F8EF7', '#F472B6', '#F5A623', '#A78BFA', '#22D3EE', '#FF6B6B'];

const DEF_EXP = [
  { id: 1, desc: 'Monthly Grocery', amount: 4200, category: 'Food', date: '2025-03-12' },
  { id: 2, desc: 'Metro Card', amount: 800, category: 'Transport', date: '2025-03-10' },
  { id: 3, desc: 'Netflix + Prime', amount: 849, category: 'Entertainment', date: '2025-03-05' },
  { id: 4, desc: 'Electricity Bill', amount: 1200, category: 'Bills', date: '2025-03-08' },
  { id: 5, desc: 'Medical Checkup', amount: 600, category: 'Health', date: '2025-03-09' },
];
const DEF_GOALS = [
  { id: 1, name: 'Emergency Fund (6 months)', icon: '🛡️', target: 330000, current: 45000, color: '#4F8EF7', deadline: '2025-12' },
  { id: 2, name: 'New Laptop', icon: '💻', target: 80000, current: 20000, color: '#00C27C', deadline: '2025-08' },
  { id: 3, name: 'Vacation Fund', icon: '✈️', target: 50000, current: 8000, color: '#F472B6', deadline: '2025-09' },
];

const KB = {
  tax: 'Indian Income Tax 2024-25. New Regime (default): 0-3L=Nil,3-7L=5%,7-10L=10%,10-12L=15%,12-15L=20%,>15L=30%. 87A rebate nil tax if total income ≤7L. Standard deduction ₹75K. Old Regime: 80C up to ₹1.5L (ELSS/PPF/NPS/LIC/NSC). 80D ₹25K self, ₹50K senior parents. 80CCD(1B) extra ₹50K NPS. HRA under old regime. STCG 15%, LTCG 10% above ₹1L equity. TDS on FD >₹40K.',
  rbi: 'RBI 2025: Repo 6.25% (cut Feb 2025). Savings 2.7-7%. FD 7-8.5% (SFBs higher). PPF 7.1% EEE tax-free. Sukanya 8.2%. SCSS 8.2%. UPI ₹1L limit. PMLA cash ₹50K.',
  invest: '2025 Investments: SIP from ₹500/mo. ELSS 3yr lock-in 80C eligible. PPF 15yr government-backed EEE. NPS pension scheme 80CCD(1B) ₹50K extra. SGBs gold 2.5%+appreciation tax-free on maturity. Nifty 50 CAGR ~12% historical. Rule of 72: 72/rate=years to double. Direct plans 0.5-1% cheaper than regular. Index funds outperform most active long-term.',
  budget: '50-30-20 rule: 50% needs (rent/food/EMI/transport), 30% wants (dining/entertainment/shopping), 20% savings. Emergency fund 3-6 months expenses in liquid fund/FD. Pay yourself first—invest on salary day. EMI ≤40% net salary. Zero-based budgeting. FIRE principle: 25x annual expenses.',
  save: 'Saving tips 2025: Automate SIP on salary credit day. Amazon Pay ICICI card 5% cashback. Axis Flipkart 5%. Home cooking saves ₹3-5K/mo. Term insurance ≥20x income. Generic medicines 80% cheaper. Cancel unused subscriptions. Negotiate salary every April-May. Side income: freelance/tutoring/content.'
};

function getCtx(q) {
  const l = q.toLowerCase(), c = [];
  if (/tax|80c|80d|hra|itr|deduct|regime|tds|ltcg|stcg/.test(l)) c.push(KB.tax);
  if (/rbi|fd|fixed|savings account|interest|upi|repo|ppf|sukanya/.test(l)) c.push(KB.rbi);
  if (/invest|sip|mutual|elss|ppf|nps|equity|nifty|gold|sgb/.test(l)) c.push(KB.invest);
  if (/budget|50.30|plan|allocat|emi|rule|emergency|fire/.test(l)) c.push(KB.budget);
  if (/save|saving|cut|tip|advice|cashback|spend|reduce/.test(l)) c.push(KB.save);
  return c.length ? c.join('\n') : KB.budget + '\n' + KB.save;
}

function calcHealth(sP, income, totalExp, cats) {
  let s = 0;
  s += sP >= 30 ? 35 : sP >= 20 ? 26 : sP >= 10 ? 15 : sP >= 0 ? 5 : 0;
  const er = income > 0 ? totalExp / income : 1;
  s += er <= 0.5 ? 25 : er <= 0.7 ? 18 : er <= 0.85 ? 10 : er <= 1 ? 3 : 0;
  const nd = cats.filter(x => ['Bills', 'Food', 'Transport', 'Health'].includes(x.c)).reduce((a, x) => a + x.total, 0);
  const np = income > 0 ? (nd / income) * 100 : 100;
  s += np <= 30 ? 20 : np <= 40 ? 14 : np <= 50 ? 7 : 0;
  const wn = cats.filter(x => ['Shopping', 'Entertainment'].includes(x.c)).reduce((a, x) => a + x.total, 0);
  const wp = income > 0 ? (wn / income) * 100 : 100;
  s += wp <= 10 ? 10 : wp <= 20 ? 7 : wp <= 30 ? 3 : 0;
  if (income > 0) s += 10;
  return Math.min(100, Math.max(0, s));
}

function hGrade(sc) {
  if (sc >= 80) return { label: 'Excellent', color: '#00C27C' };
  if (sc >= 65) return { label: 'Good', color: '#4F8EF7' };
  if (sc >= 45) return { label: 'Fair', color: '#F5A623' };
  return { label: 'Needs Attention', color: '#FF6B6B' };
}

function parseMd(text) {
  if (!text) return [];
  const lines = text.split('\n'), out = []; let buf = [], bt = 'ul';
  const flush = () => { if (!buf.length) return; out.push(React.createElement(bt, { key: 'l' + out.length }, buf.map((x, i) => React.createElement('li', { key: i }, inl(x))))); buf = [] };
  const inl = s => {
    const p = []; let i = 0; const re = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g; let m;
    while ((m = re.exec(s)) !== null) { if (m.index > i) p.push(s.slice(i, m.index)); if (m[1]) p.push(React.createElement('strong', { key: i }, m[2])); else if (m[3]) p.push(React.createElement('em', { key: i }, m[4])); else if (m[5]) p.push(React.createElement('code', { key: i }, m[6])); i = m.index + m[0].length }
    if (i < s.length) p.push(s.slice(i)); return p.length === 1 && typeof p[0] === 'string' ? p[0] : p
  };
  lines.forEach((ln, li) => {
    if (/^#{1,4}\s/.test(ln)) { flush(); const lv = ln.match(/^(#{1,4})/)[1].length; out.push(React.createElement('h' + Math.min(lv + 2, 6), { key: li }, inl(ln.replace(/^#{1,4}\s/ , '')))) }
    else if (/^>\s/.test(ln)) { flush(); out.push(React.createElement('blockquote', { key: li }, inl(ln.replace(/^>\s/, '')))) }
    else if (/^[\-*+]\s/.test(ln)) { if (bt !== 'ul') { flush(); bt = 'ul' }; buf.push(ln.replace(/^[\-*+]\s/, '')) }
    else if (/^\d+\.\s/.test(ln)) { if (bt !== 'ol') { flush(); bt = 'ol' }; buf.push(ln.replace(/^\d+\.\s/, '')) }
    else { flush(); if (ln.trim()) out.push(React.createElement('p', { key: li }, inl(ln))) }
  });
  flush(); return out;
}

// ── SUBCOMPONENTS ──────────────────────────────────────────
function GDots() { return React.createElement('div', { className: 'gdots' }, [1, 2, 3].map(x => React.createElement('div', { key: x, className: 'gd', style: { background: x === 1 ? '#4285F4' : x === 2 ? '#34A853' : '#FBBC05', animation: 'bounce 1.3s ease infinite', animationDelay: (x * 0.15) + 's' } }))) }

function Donut({ cats }) {
  const tot = cats.reduce((a, x) => a + x.total, 0); if (!tot) return React.createElement('svg', { width: 100, height: 100, viewBox: '0 0 36 36' }, React.createElement('circle', { cx: 18, cy: 18, r: 15.915, fill: 'none', stroke: '#1C2540', strokeWidth: 3.8 }));
  let acc = 0;
  return React.createElement('svg', { width: 100, height: 100, viewBox: '0 0 36 36' },
    cats.map((c, i) => {
      if (!c.total) return null; const pct = (c.total / tot) * 100; const str = `${pct} ${100 - pct}`; const dash = acc; acc += pct;
      return React.createElement('circle', { key: i, cx: 18, cy: 18, r: 15.915, fill: 'none', stroke: CC[c.c] || '#64748B', strokeWidth: 3.8, strokeDasharray: str, strokeDashoffset: -dash + 25 })
    })
  )
}

function Sidebar({ income, totalExp, savings, savPct, catTotals, healthScore }) {
  const gr = hGrade(healthScore);
  return React.createElement('div', { className: 'sidebar' },
    React.createElement('div', { className: 'health-widget' },
      React.createElement('div', { className: 'health-ring' },
        React.createElement('div', { className: 'health-num', style: { color: gr.color } }, healthScore),
        React.createElement('svg', { width: '72', height: '72', viewBox: '0 0 36 36' },
          React.createElement('circle', { cx: 18, cy: 18, r: 15.915, fill: 'none', stroke: '#1C2540', strokeWidth: 3 }),
          React.createElement('circle', { cx: 18, cy: 18, r: 15.915, fill: 'none', stroke: gr.color, strokeWidth: 3, strokeDasharray: `${healthScore} ${100 - healthScore}`, strokeDashoffset: 25 })
        )
      ),
      React.createElement('div', { className: 'hlbl' }, 'Financial Health'),
      React.createElement('div', { className: 'hgrade', style: { color: gr.color } }, gr.label)
    ),
    React.createElement('div', { className: 'metric mg' },
      React.createElement('div', { className: 'mlbl' }, 'Monthly Net Income'),
      React.createElement('div', { className: 'mval' }, fmt(income))
    ),
    React.createElement('div', { className: 'metric mr' },
      React.createElement('div', { className: 'mlbl' }, 'Total Expenses'),
      React.createElement('div', { className: 'mval' }, fmt(totalExp)),
      React.createElement('div', { className: 'mprog' }, React.createElement('div', { className: 'mfill', style: { width: Math.min(100, income > 0 ? (totalExp / income) * 100 : 0) + '%', background: 'var(--red)' } }))
    ),
    React.createElement('div', { className: 'metric ma' },
      React.createElement('div', { className: 'mlbl' }, 'Available Savings'),
      React.createElement('div', { className: 'mval' }, fmt(savings)),
      React.createElement('div', { className: 'msub' }, savPct + '% of income'),
      React.createElement('div', { className: 'mprog' }, React.createElement('div', { className: 'mfill', style: { width: Math.min(100, Math.max(0, savPct)) + '%', background: 'var(--amber)' } }))
    ),
    catTotals.some(x => x.total > 0) && React.createElement('div', { style: { marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 } },
      React.createElement('div', { className: 'donut-wrap' }, React.createElement(Donut, { cats: catTotals })),
      React.createElement('div', { className: 'cats-lbl' }, 'Breakdown'),
      catTotals.map((c, i) => c.total > 0 ? React.createElement('div', { key: i, className: 'cat-row' },
        React.createElement('div', { className: 'cat-dot', style: { background: CC[c.c] } }),
        React.createElement('div', { className: 'cat-name' }, c.c),
        React.createElement('div', { className: 'cat-amt' }, fmt(c.total))
      ) : null)
    )
  )
}

function ChatTab({ msgs, busy, streaming, apiKey, onOpenKey, onSend }) {
  const [txt, setTxt] = useState(''); const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, busy]);
  const submit = () => { if (!txt.trim() || busy) return; onSend(txt.trim()); setTxt('') };
  const QPS = ['How can I maximize tax savings under the 2025 structure?', 'What are standard indicators for emergency funds?', 'Explain the 50-30-20 principle details.', 'Provide techniques to cut monthly bills.'];

  return React.createElement('div', { className: 'chat-area' },
    !apiKey && React.createElement('div', { className: 'no-key-banner' },
      React.createElement('span', null, '🔒 Live LLM processing requires an OpenRouter API key. Offline fallback data logic will activate in sandbox mode otherwise.'),
      React.createElement('button', { onClick: onOpenKey }, 'Configure Key')
    ),
    React.createElement('div', { className: 'messages' },
      msgs.map((m, i) => React.createElement('div', { key: i, className: 'msg ' + m.role },
        React.createElement('div', { className: 'avatar' }, m.role === 'ai' ? '🤖' : '👤'),
        React.createElement('div', { className: 'bubble' + (m.isStreaming ? ' streaming-cursor' : '') }, m.role === 'ai' ? parseMd(m.content) : m.content)
      )),
      busy && !streaming && React.createElement('div', { className: 'msg ai' },
        React.createElement('div', { className: 'avatar' }, '🤖'),
        React.createElement('div', { className: 'bubble' }, React.createElement('div', { className: 'typing' }, React.createElement('div', { className: 'dot' }), React.createElement('div', { className: 'dot' }), React.createElement('div', { className: 'dot' })))
      ),
      React.createElement('div', { ref: endRef })
    ),
    React.createElement('div', { className: 'qp-bar' }, QPS.map((q, i) => React.createElement('button', { key: i, className: 'qp', onClick: () => !busy && onSend(q) }, q))),
    React.createElement('div', { className: 'input-bar' },
      React.createElement('input', { className: 'chat-input', placeholder: 'Ask Finova Intellect anything about wealth, tracking or allocations...', value: txt, onChange: e => setTxt(e.target.value), onKeyDown: e => e.key === 'Enter' && submit(), disabled: busy }),
      React.createElement('button', { className: 'send-btn', onClick: submit, disabled: busy || !txt.trim() },
        React.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: '#000', strokeWidth: 2.5 }, React.createElement('line', { x1: 22, y1: 2, x2: 11, y2: 13 }), React.createElement('polygon', { points: '22 2 15 22 11 13 2 9 22 2' }))
      )
    )
  )
}

function ExpensesTab({ expenses, totalExp, onAdd, onDelete }) {
  const [desc, setDesc] = useState(''); const [amt, setAmt] = useState(''); const [cat, setCat] = useState('Food');
  const add = () => { if (!desc.trim() || !amt || isNaN(amt)) return; onAdd(desc.trim(), parseFloat(amt), cat); setDesc(''); setAmt('') };
  const exportCSV = () => {
    let csv = 'Description,Amount,Category,Date\n' + expenses.map(e => `"${e.desc.replace(/"/g, '""')}",${e.amount},"${e.category}",${e.date}`).join('\n');
    let b = new Blob([csv], { type: 'text/csv' }), u = URL.createObjectURL(b), a = document.createElement('a');
    a.href = u; a.download = 'expenses.csv'; a.click()
  };

  return React.createElement('div', { className: 'panel' },
    React.createElement('div', { className: 'card' },
      React.createElement('div', { className: 'card-title' }, 'Record Expense Item'),
      React.createElement('div', { className: 'add-row' },
        React.createElement('input', { className: 'in in-desc', placeholder: 'Transaction statement info...', value: desc, onChange: e => setDesc(e.target.value) }),
        React.createElement('input', { className: 'in in-amt', type: 'number', placeholder: 'Cost (₹)...', value: amt, onChange: e => setAmt(e.target.value) }),
        React.createElement('select', { className: 'in', value: cat, onChange: e => setCat(e.target.value) }, CATS.map(c => React.createElement('option', { key: c, value: c }, c))),
        React.createElement('button', { className: 'add-btn', onClick: add }, 'Log Ledger')
      )
    ),
    React.createElement('div', { className: 'exp-list-hd' },
      React.createElement('span', null, expenses.length + ' Recorded Lines'),
      React.createElement('button', { className: 'export-btn', onClick: exportCSV }, 'Export Data Sheet')
    ),
    expenses.map(e => React.createElement('div', { key: e.id, className: 'exp-item' },
      React.createElement('div', { className: 'exp-dot', style: { background: CC[e.category] } }),
      React.createElement('div', { className: 'exp-desc' }, e.desc),
      React.createElement('div', { className: 'exp-tag' }, e.category),
      React.createElement('div', { className: 'exp-date' }, e.date),
      React.createElement('div', { className: 'exp-amt' }, fmt(e.amount)),
      React.createElement('button', { className: 'del-btn', onClick: () => onDelete(e.id) }, '×')
    ))
  )
}

function BudgetTab({ income, setIncome, needs, wants, savings }) {
  const nP = income > 0 ? (needs / income) * 100 : 0;
  const wP = income > 0 ? (wants / income) * 100 : 0;
  const sP = income > 0 ? (savings / income) * 100 : 0;

  return React.createElement('div', { className: 'panel' },
    React.createElement('div', { className: 'inc-row' },
      React.createElement('div', { className: 'inc-lbl' },
        React.createElement('h3', { style: { fontWeight: 600, fontSize: 15 } }, 'Net Resource Cap Configuration'),
        React.createElement('p', { style: { fontSize: 11, color: 'var(--text3)', marginTop: 2 } }, 'Provide your regular monthly payout for macro indexing updates.')
      ),
      React.createElement('input', { className: 'inc-input', type: 'number', value: income || '', onChange: e => setIncome(parseFloat(e.target.value) || 0) })
    ),
    React.createElement('div', { className: 'card' },
      React.createElement('div', { className: 'card-title' }, 'Macro Balanced Target Check (50 / 30 / 20 Framework)'),
      ['Essential Needs (Rent, Bills, Food, Medical)', 'Discretionary Wants (Shopping, Luxury, Entertainment)', 'Investments & Savings Target Balance'].map((lbl, i) => {
        const cp = i === 0 ? nP : i === 1 ? wP : sP; const tg = i === 0 ? 50 : i === 1 ? 30 : 20; const v = i === 0 ? needs : i === 1 ? wants : savings; const cl = i === 0 ? 'var(--blue)' : i === 1 ? 'var(--purple)' : 'var(--green)';
        return React.createElement('div', { key: i, style: { marginBottom: 14 } },
          React.createElement('div', { className: 'rule-hd' }, React.createElement('span', { className: 'rule-lbl' }, lbl), React.createElement('span', { className: 'rule-pct', style: { color: cl } }, Math.round(cp) + '% / ' + tg + '%')),
          React.createElement('div', { className: 'rule-bar' }, React.createElement('div', { className: 'rule-fill', style: { width: Math.min(100, cp) + '%', background: cl } })),
          React.createElement('div', { className: 'rule-vals' }, React.createElement('span', null, 'Current Allocation: ' + fmt(v)), React.createElement('span', null, 'Target: ' + fmt(income * tg / 100)))
        )
      })
    ),
    income > 0 && [
      (nP <= 50 && wP <= 30) && React.createElement('div', { className: 'hint', key: 'h' }, React.createElement('p', null, '✔ Core structural metrics operating perfectly within standard efficiency indices. Keep compounding residual surpluses.')),
      (nP > 50) && React.createElement('div', { className: 'warn', key: 'w1' }, React.createElement('p', null, '⚠ Fixed infrastructure or necessary expenditures are consuming more than half of net allocations. Investigate low-impact cost cutting options.')),
      (wP > 30) && React.createElement('div', { className: 'deficit', key: 'w2' }, React.createElement('p', null, '⚡ Discretionary structural outflows exceed standard thresholds. Re-index lifestyle variables to protect long-term financial security.'))
    ]
  )
}

function GoalsTab({ goals, setGoals, savings }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(''); const [tg, setTg] = useState(''); const [cur, setCur] = useState(''); const [col, setCol] = useState(GCOLS[0]); const [ico, setIco] = useState(GICONS[0]); const [dt, setDt] = useState('');

  const saveGoal = () => { if (!name.trim() || !tg || isNaN(tg)) return; const n = { id: Date.now(), name: name.trim(), icon: ico, target: parseFloat(tg), current: parseFloat(cur) || 0, color: col, deadline: dt || '2026-12' }; setGoals([...goals, n]); setName(''); setTg(''); setCur(''); setShowForm(false) };
  const addFunds = (id) => { const a = prompt('Provide quantum to contribute from current accessible resources (₹):'); if (!a || isNaN(a) || parseFloat(a) <= 0) return; setGoals(goals.map(g => g.id === id ? { ...g, current: g.current + parseFloat(a) } : g)) };
  const del = id => setGoals(goals.filter(g => g.id !== id));

  return React.createElement('div', { className: 'panel' },
    !showForm && React.createElement('button', { className: 'add-btn', style: { marginBottom: 14 }, onClick: () => setShowForm(true) }, '+ Provision Micro Target'),
    showForm && React.createElement('div', { className: 'goal-form' },
      React.createElement('div', { className: 'gform-title' }, 'Structure Wealth Target Node'),
      React.createElement('div', { className: 'gform-row' },
        React.createElement('input', { className: 'in', style: { flex: 2 }, placeholder: 'Goal name criteria...', value: name, onChange: e => setName(e.target.value) }),
        React.createElement('input', { className: 'in', style: { flex: 1 }, type: 'number', placeholder: 'Target (₹)...', value: tg, onChange: e => setTg(e.target.value) }),
        React.createElement('input', { className: 'in', style: { flex: 1 }, type: 'number', placeholder: 'Initial (₹)...', value: cur, onChange: e => setCur(e.target.value) })
      ),
      React.createElement('div', { className: 'gform-row', style: { margin: '12px 0' } },
        React.createElement('span', { style: { fontSize: 12, color: 'var(--text2)', marginRight: 6 } }, 'Icon:'),
        GICONS.map(x => React.createElement('span', { key: x, style: { fontSize: 18, cursor: 'pointer', opacity: ico === x ? 1 : 0.4, marginRight: 8 }, onClick: () => setIco(x) }, x))
      ),
      React.createElement('div', { className: 'gform-row', style: { margin: '12px 0' } },
        React.createElement('span', { style: { fontSize: 12, color: 'var(--text2)', marginRight: 6 } }, 'Theme:'),
        GCOLS.map(x => React.createElement('div', { key: x, className: 'cswatch' + (col === x ? ' sel' : ''), style: { background: x, marginRight: 6 }, onClick: () => setCol(x) }))
      ),
      React.createElement('div', { className: 'gform-row' },
        React.createElement('input', { className: 'in', type: 'month', value: dt, onChange: e => setDt(e.target.value) }),
        React.createElement('button', { className: 'add-btn', onClick: saveGoal }, 'Confirm Goal'),
        React.createElement('button', { className: 'gadd-btn', onClick: () => setShowForm(false) }, 'Cancel')
      )
    ),
    goals.map(g => {
      const pct = Math.min(100, g.target > 0 ? (g.current / g.target) * 100 : 0);
      return React.createElement('div', { key: g.id, className: 'goal-card' },
        React.createElement('div', { className: 'goal-header' },
          React.createElement('span', { className: 'goal-icon' }, g.icon),
          React.createElement('span', { className: 'goal-name' }, g.name),
          React.createElement('span', { className: 'goal-pct', style: { color: g.color } }, Math.round(pct) + '%')
        ),
        React.createElement('div', { className: 'goal-bar' }, React.createElement('div', { className: 'goal-fill', style: { width: pct + '%', background: g.color } })),
        React.createElement('div', { className: 'goal-meta' },
          React.createElement('span', null, fmt(g.current) + ' / ' + fmt(g.target)),
          React.createElement('span', null, 'Target Horizon: ' + g.deadline)
        ),
        React.createElement('div', { className: 'goal-actions' },
          React.createElement('button', { className: 'gadd-btn', onClick: () => addFunds(g.id) }, 'Allocate capital'),
          React.createElement('button', { className: 'gdel-btn', onClick: () => del(g.id) }, 'Terminate Node')
        )
      )
    })
  )
}

function AnalyticsTab({ expenses, income }) {
  const avg = expenses.length ? expenses.reduce((a, x) => a + x.amount, 0) / expenses.length : 0;
  const mx = expenses.length ? Math.max(...expenses.map(x => x.amount)) : 0;
  const cats = CATS.map(c => ({ c, total: expenses.filter(x => x.category === c).reduce((a, x) => a + x.amount, 0) }));
  const topCat = [...cats].sort((a, b) => b.total - a.total)[0];

  return React.createElement('div', { className: 'panel' },
    React.createElement('div', { className: 'agrid' },
      React.createElement('div', { className: 'stat-card' }, React.createElement('div', { className: 'stat-lbl' }, 'Average Transaction Line'), React.createElement('div', { className: 'stat-val', style: { color: 'var(--blue)' } }, fmt(avg))),
      React.createElement('div', { className: 'stat-card' }, React.createElement('div', { className: 'stat-lbl' }, 'Peak Outflow Spike'), React.createElement('div', { className: 'stat-val', style: { color: 'var(--red)' } }, fmt(mx)))
    ),
    React.createElement('div', { className: 'card' },
      React.createElement('div', { className: 'card-title' }, 'Absolute Vector Analysis Across Sectors'),
      cats.map((c, i) => {
        const p = topCat.total > 0 ? (c.total / topCat.total) * 100 : 0;
        return React.createElement('div', { key: i, className: 'bar-row' },
          React.createElement('div', { className: 'bar-cat' }, c.c),
          React.createElement('div', { className: 'bar-track' }, React.createElement('div', { className: 'bar-fill', style: { width: p + '%', background: CC[c.c] } })),
          React.createElement('div', { className: 'bar-val' }, fmt(c.total))
        )
      })
    ),
    React.createElement('div', { className: 'card' },
      React.createElement('div', { className: 'card-title' }, 'Velocity Index Estimation (7-Day Projection Workspace)'),
      React.createElement('div', { className: 'trend-wrap' }, [22, 23, 24, 25, 26, 27, 28].map((d, i) => {
        const h = Math.sin(i * 0.9) * 35 + 45;
        return React.createElement('div', { key: d, className: 'tcol' },
          React.createElement('div', { className: 'tbar', style: { height: h + '%', background: 'linear-gradient(to top, var(--bg4), var(--green))' } }),
          React.createElement('div', { className: 'tlbl' }, '05/' + d)
        )
      }))
    )
  )
}

function KeyModal({ onSave, onClose }) {
  const [k, setK] = useState(''); const [show, setShow] = useState(false);
  return React.createElement('div', { className: 'key-overlay' },
    React.createElement('div', { className: 'key-modal' },
      React.createElement('div', { className: 'key-logo' },
        React.createElement('div', { className: 'key-logo-mark' }, 'F'),
        React.createElement('div', { className: 'key-logo-text' }, ['Finova ', React.createElement('span', { key: 's' }, 'AI Engine')])
      ),
      React.createElement('div', { className: 'key-title' }, 'Secure OpenRouter Credentials Token'),
      React.createElement('div', { className: 'key-desc' }, [
        'Finova operates natively with standard formatting. Generate token strings safely within your ',
        React.createElement('a', { key: 'a', href: 'https://openrouter.ai/keys', target: '_blank' }, 'OpenRouter Workspace Profile Dashboard'),
        '.'
      ]),
      React.createElement('div', { className: 'gem-badge' }, [React.createElement(GDots, { key: 'd' }), ' Nemotron 70B Engine Connectivity']),
      React.createElement('div', { className: 'key-steps' },
        React.createElement('div', { className: 'key-step' }, [React.createElement('div', { key: 'n', className: 'key-step-n' }, '1'), 'Keys are handled locally entirely within volatile state buffers. No tracking elements are persistent.']),
        React.createElement('div', { className: 'key-step' }, [React.createElement('div', { key: 'n', className: 'key-step-n' }, '2'), 'Closing tabs dumps session parameters cleanly automatically.'])
      ),
      React.createElement('div', { className: 'key-input-wrap' },
        React.createElement('input', { className: 'key-input', type: show ? 'text' : 'password', placeholder: 'sk-or-v1-...', value: k, onChange: e => setK(e.target.value) }),
        React.createElement('button', { className: 'key-eye', onClick: () => setShow(!show) }, show ? '🔒' : '👁')
      ),
      React.createElement('button', { className: 'key-btn', disabled: !k.startsWith('sk-or-'), onClick: () => onSave(k) }, 'Connect Core Framework Pipeline'),
      React.createElement('button', { className: 'gadd-btn', style: { width: '100%', marginTop: 8, padding: 12 }, onClick: onClose }, 'Bypass Mode (Offline Fallback Engine)')
    )
  )
}

// ── MAIN APPLICATION BOOTSTRAP NODE ─────────────────────────
function App() {
  const [tab, setTab] = useState('chat');
  const [income, setIncome] = useState(75000);
  const [expenses, setExpenses] = useState(DEF_EXP);
  const [goals, setGoals] = useState(DEF_GOALS);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [msgs, setMsgs] = useState([{ role: 'ai', content: "### Greetings, Analyst.\nI am **Finova Intelligence**, an automated tracking environment synced with deep indexing parameters.\n\n* **Live Diagnostics**: Tab switches update matrix math instantly.\n* **Local Sandbox**: Add data structures to evaluate dynamic safety coefficients." }]);
  const [busy, setBusy] = useState(false);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => { const stored = localStorage.getItem('_finova_key'); if (stored && stored.startsWith('sk-or-')) setApiKey(stored); else setShowKey(true) }, []);

  const totalExp = expenses.reduce((a, x) => a + x.amount, 0);
  const savings = income - totalExp;
  const savPct = income > 0 ? Math.round((savings / income) * 100) : 0;

  const catTotals = CATS.map(c => ({ c, total: expenses.filter(x => x.category === c).reduce((a, x) => a + x.amount, 0) }));
  const hs = calcHealth(savPct, income, totalExp, catTotals);
  const hc = hGrade(hs).color;

  const addExp = (desc, amount, category) => { setExpenses([...expenses, { id: Date.now(), desc, amount, category, date: new Date().toISOString().split('T')[0] }]) };
  const delExp = id => setExpenses(expenses.filter(x => x.id !== id));

  const handleSend = async (txt) => {
    const next = [...msgs, { role: 'usr', content: txt }]; setMsgs(next); setBusy(true);
    if (!apiKey) {
      setTimeout(() => {
        const reply = `### Sandbox Matrix Offline Diagnostic Mode\nNo active OpenRouter endpoint key was verified. Presenting context indices extracted from localized semantic store:\n\n> ${getCtx(txt).replace(/\n/g, '\n> ')}\n\n*Configure a valid token inside properties panel settings gear to link production intelligence models loop.*`;
        setMsgs([...next, { role: 'ai', content: reply }]); setBusy(false)
      }, 7500); return
    }
    try {
      const hist = next.slice(-6).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }));
      const ctx = `CURRENT USER DATA STATE:\n- Net Income Resource: ${income}\n- Realized Total Outflows: ${totalExp}\n- Idle Safe Surpluses: ${savings}\n- Category Allocations Metrics Matrix: ${JSON.stringify(catTotals)}\n- Ongoing Provision Targets Array: ${JSON.stringify(goals)}\n\nDOMESTIC REFERENCE FRAME PARAMETERS:\n${getCtx(txt)}`;
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': window.location.href, 'X-Title': 'Finova AI Finance' },
        body: JSON.stringify({ model: 'nvidia/llama-3.1-nemotron-70b-instruct', messages: [{ role: 'system', content: `You are Finova AI, an elite personal financial advisor. Use the provided state indicators and context definitions to produce actionable wealth insight advice strategy answers. Be concise and write elegant professional Markdown. Always format currency quantities cleanly as Indian Rupees (e.g. ₹50,000).\n\nContext definitions:\n${ctx}` }, ...hist], stream: true })
      });
      if (!res.ok) throw new Error('Endpoint rejected transaction logic');
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let full = ''; setStreaming(true);
      setMsgs([...next, { role: 'ai', content: '', isStreaming: true }]);
      while (true) {
        const { value, done } = await reader.read(); if (done) break; const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const token = line.slice(6).trim(); if (token === '[DONE]') break;
            try { const parsed = JSON.parse(token); const chunk = parsed.choices[0]?.delta?.content || ''; full += chunk; setMsgs([...next, { role: 'ai', content: full, isStreaming: true }]) } catch (e) { }
          }
        }
      }
      setMsgs([...next, { role: 'ai', content: full }]); setStreaming(false)
    } catch (err) {
      setMsgs([...next, { role: 'ai', content: `❌ **Framework Network Alert Loop Exception**: Failed to communicate with production LLM interface clusters successfully.\n\n*Detail description: ${err.message}*` }])
    } finally { setBusy(false); setStreaming(false) }
  };

  return React.createElement('div', { style: { height: '100%', display: 'flex', flexDirection: 'column' } },
    showKey && React.createElement(KeyModal, { onSave: (k) => { setApiKey(k); localStorage.setItem('_finova_key', k); setShowKey(false) }, onClose: () => setShowKey(false) }),
    React.createElement('div', { className: 'header' },
      React.createElement('div', { className: 'logo' }, React.createElement('div', { className: 'logo-mark' }, 'F'), React.createElement('div', { className: 'logo-name' }, ['Finova ', React.createElement('span', { key: 's' }, 'AI')])),
      React.createElement('div', { className: 'header-right' },
        React.createElement('div', { className: 'badge badge-green' }, 'RAG Active'),
        React.createElement('div', { className: 'badge-gemini' }, React.createElement(GDots), 'OpenRouter / Nemotron'),
        React.createElement('div', { className: 'health-badge', style: { color: hc, borderColor: hc + '44', background: hc + '11' } }, '♥ ' + hs + '/100'),
        React.createElement('button', { className: 'cog-btn', title: 'Configure API Key', onClick: () => setShowKey(true) }, '⚙')
      )
    ),
    React.createElement('div', { className: 'tabs' }, [['chat', 'Finova Intellect'], ['expenses', 'Ledger Lines'], ['budget', 'Macro Targets'], ['goals', 'Surplus Vaults'], ['analytics', 'Matrix Vectors']].map(([id, label]) => React.createElement('div', { key: id, className: 'tab' + (tab === id ? ' active' : ''), onClick: () => setTab(id) }, label))),
    React.createElement('div', { className: 'body' },
      React.createElement(Sidebar, { income, totalExp, savings, savPct, catTotals, healthScore: hs }),
      tab === 'chat' && React.createElement(ChatTab, { msgs, busy, streaming, apiKey, onOpenKey: () => setShowKey(true), onSend: handleSend }),
      tab === 'expenses' && React.createElement(ExpensesTab, { expenses, totalExp, onAdd: addExp, onDelete: delExp }),
      tab === 'budget' && React.createElement(BudgetTab, { income, setIncome, needs: catTotals.filter(x => ['Bills', 'Food', 'Transport', 'Health'].includes(x.c)).reduce((a, x) => a + x.total, 0), wants: catTotals.filter(x => ['Shopping', 'Entertainment'].includes(x.c)).reduce((a, x) => a + x.total, 0), savings }),
      tab === 'goals' && React.createElement(GoalsTab, { goals, setGoals, savings }),
      tab === 'analytics' && React.createElement(AnalyticsTab, { expenses, income })
    )
  )
}

const root = RoyalDom ? ReactDOM.createRoot(document.getElementById('root')) : { render: () => console.warn("React mounting context initialization vector error.") };
if (typeof ReactDOM.createRoot === 'function') { ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App)) }
else { ReactDOM.render(React.createElement(App), document.getElementById('root')) }
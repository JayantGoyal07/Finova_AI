const{useState,useRef,useEffect,useCallback}=React;

const CATS=['Food','Transport','Shopping','Bills','Health','Entertainment','Other'];
const CC={Food:'#00C27C',Transport:'#4F8EF7',Shopping:'#F5A623',Bills:'#FF6B6B',Health:'#A78BFA',Entertainment:'#F472B6',Other:'#64748B'};
const fmt=n=>'₹'+Math.abs(Math.round(n)).toLocaleString('en-IN');
const GICONS=['🎯','🛡️','💻','✈️','🏠','🚗','📚','💍','🎓','🏥','💎','🧳','🎮','🎵'];
const GCOLS=['#00C27C','#4F8EF7','#F472B6','#F5A623','#A78BFA','#22D3EE','#FF6B6B'];

const DEF_EXP=[
  {id:1,desc:'Monthly Grocery',amount:4200,category:'Food',date:'2025-03-12'},
  {id:2,desc:'Metro Card',amount:800,category:'Transport',date:'2025-03-10'},
  {id:3,desc:'Netflix + Prime',amount:849,category:'Entertainment',date:'2025-03-05'},
  {id:4,desc:'Electricity Bill',amount:1200,category:'Bills',date:'2025-03-08'},
  {id:5,desc:'Medical Checkup',amount:600,category:'Health',date:'2025-03-09'},
];
const DEF_GOALS=[
  {id:1,name:'Emergency Fund (6 months)',icon:'🛡️',target:330000,current:45000,color:'#4F8EF7',deadline:'2025-12'},
  {id:2,name:'New Laptop',icon:'💻',target:80000,current:20000,color:'#00C27C',deadline:'2025-08'},
  {id:3,name:'Vacation Fund',icon:'✈️',target:50000,current:8000,color:'#F472B6',deadline:'2025-09'},
];

const KB={
  tax:'Indian Income Tax 2024-25. New Regime (default): 0-3L=Nil,3-7L=5%,7-10L=10%,10-12L=15%,12-15L=20%,>15L=30%. 87A rebate nil tax if total income ≤7L. Standard deduction ₹75K. Old Regime: 80C up to ₹1.5L (ELSS/PPF/NPS/LIC/NSC). 80D ₹25K self, ₹50K senior parents. 80CCD(1B) extra ₹50K NPS. HRA under old regime. STCG 15%, LTCG 10% above ₹1L equity. TDS on FD >₹40K.',
  rbi:'RBI 2025: Repo 6.25% (cut Feb 2025). Savings 2.7-7%. FD 7-8.5% (SFBs higher). PPF 7.1% EEE tax-free. Sukanya 8.2%. SCSS 8.2%. UPI ₹1L limit. PMLA cash ₹50K.',
  invest:'2025 Investments: SIP from ₹500/mo. ELSS 3yr lock-in 80C eligible. PPF 15yr government-backed EEE. NPS pension scheme 80CCD(1B) ₹50K extra. SGBs gold 2.5%+appreciation tax-free on maturity. Nifty 50 CAGR ~12% historical. Rule of 72: 72/rate=years to double. Direct plans 0.5-1% cheaper than regular. Index funds outperform most active long-term.',
  budget:'50-30-20 rule: 50% needs (rent/food/EMI/transport), 30% wants (dining/entertainment/shopping), 20% savings. Emergency fund 3-6 months expenses in liquid fund/FD. Pay yourself first—invest on salary day. EMI ≤40% net salary. Zero-based budgeting. FIRE principle: 25x annual expenses.',
  save:'Saving tips 2025: Automate SIP on salary credit day. Amazon Pay ICICI card 5% cashback. Axis Flipkart 5%. Home cooking saves ₹3-5K/mo. Term insurance ≥20x income. Generic medicines 80% cheaper. Cancel unused subscriptions. Negotiate salary every April-May. Side income: freelance/tutoring/content.'
};
function getCtx(q){
  const l=q.toLowerCase(),c=[];
  if(/tax|80c|80d|hra|itr|deduct|regime|tds|ltcg|stcg/.test(l))c.push(KB.tax);
  if(/rbi|fd|fixed|savings account|interest|upi|repo|ppf|sukanya/.test(l))c.push(KB.rbi);
  if(/invest|sip|mutual|elss|ppf|nps|equity|nifty|gold|sgb/.test(l))c.push(KB.invest);
  if(/budget|50.30|plan|allocat|emi|rule|emergency|fire/.test(l))c.push(KB.budget);
  if(/save|saving|cut|tip|advice|cashback|spend|reduce/.test(l))c.push(KB.save);
  return c.length?c.join('\n'):KB.budget+'\n'+KB.save;
}

function calcHealth(sP,income,totalExp,cats){
  let s=0;
  s+=sP>=30?35:sP>=20?26:sP>=10?15:sP>=0?5:0;
  const er=income>0?totalExp/income:1;
  s+=er<=0.5?25:er<=0.7?18:er<=0.85?10:er<=1?3:0;
  const nd=cats.filter(x=>['Bills','Food','Transport','Health'].includes(x.c)).reduce((a,x)=>a+x.total,0);
  const np=income>0?(nd/income)*100:100;
  s+=np<=30?20:np<=40?14:np<=50?7:0;
  const wn=cats.filter(x=>['Shopping','Entertainment'].includes(x.c)).reduce((a,x)=>a+x.total,0);
  const wp=income>0?(wn/income)*100:100;
  s+=wp<=10?10:wp<=20?7:wp<=30?3:0;
  if(income>0)s+=10;
  return Math.min(100,Math.max(0,s));
}
function hGrade(sc){
  if(sc>=80)return{label:'Excellent',color:'#00C27C'};
  if(sc>=65)return{label:'Good',color:'#4F8EF7'};
  if(sc>=45)return{label:'Fair',color:'#F5A623'};
  return{label:'Needs Attention',color:'#FF6B6B'};
}

function parseMd(text){
  if(!text)return[];
  const lines=text.split('\n'),out=[];let buf=[],bt='ul';
  const flush=()=>{if(!buf.length)return;out.push(React.createElement(bt,{key:'l'+out.length},buf.map((x,i)=>React.createElement('li',{key:i},inl(x)))));buf=[]};
  const inl=s=>{const p=[];let i=0;const re=/(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;let m;
    while((m=re.exec(s))!==null){if(m.index>i)p.push(s.slice(i,m.index));if(m[1])p.push(React.createElement('strong',{key:i},m[2]));else if(m[3])p.push(React.createElement('em',{key:i},m[4]));else if(m[5])p.push(React.createElement('code',{key:i},m[6]));i=m.index+m[0].length}
    if(i<s.length)p.push(s.slice(i));return p.length===1&&typeof p[0]==='string'?p[0]:p};
  lines.forEach((ln,li)=>{
    if(/^#{1,4}\s/.test(ln)){flush();const lv=ln.match(/^(#{1,4})/)[1].length;out.push(React.createElement('h'+Math.min(lv+2,6),{key:li},inl(ln.replace(/^#{1,4}\s/,''))))}
    else if(/^>\s/.test(ln)){flush();out.push(React.createElement('blockquote',{key:li},inl(ln.replace(/^>\s/,''))))}
    else if(/^[-*•]\s/.test(ln)){bt='ul';buf.push(ln.replace(/^[-*•]\s/,''))}
    else if(/^\d+\.\s/.test(ln)){bt='ol';buf.push(ln.replace(/^\d+\.\s/,''))}
    else if(ln.trim()===''){flush()}
    else{flush();out.push(React.createElement('p',{key:li},inl(ln)))}
  });flush();return out;
}

function GDots(){
  return React.createElement('div',{className:'gdots'},
    React.createElement('div',{className:'gd',style:{background:'#4285F4'}}),
    React.createElement('div',{className:'gd',style:{background:'#EA4335'}}),
    React.createElement('div',{className:'gd',style:{background:'#FBBC05'}}),
    React.createElement('div',{className:'gd',style:{background:'#34A853'}})
  );
}

function KeyModal({onSave,onClose}){
  const[val,setVal]=useState('');
  const[show,setShow]=useState(false);
  return React.createElement('div',{className:'key-overlay',onClick:e=>e.target===e.currentTarget&&onClose&&onClose()},
    React.createElement('div',{className:'key-modal'},
      React.createElement('div',{className:'key-logo'},
        React.createElement('div',{className:'key-logo-mark'},'₹'),
        React.createElement('div',{className:'key-logo-text'},'Finova',React.createElement('span',null,' AI'))
      ),
      React.createElement('div',{className:'gem-badge'},React.createElement(GDots),'Powered by OpenRouter'),
      React.createElement('div',{className:'key-title'},'Connect your OpenRouter API Key'),
      React.createElement('div',{className:'key-desc'},
        'Finova uses ',React.createElement('strong',{style:{color:'var(--text)'}},'OpenRouter'),' to access AI models like Gemini 2.0 Flash. Your key is held in browser memory only.',
        React.createElement('br'),React.createElement('br'),
        'Get a key at ',React.createElement('a',{href:'https://openrouter.ai/keys',target:'_blank',rel:'noopener'},'openrouter.ai/keys'),'.'
      ),
      React.createElement('div',{className:'key-steps'},
        ...[
          ['1','Visit openrouter.ai → Sign in'],
          ['2','Go to Keys → Create Key'],
          ['3','Copy the key (starts with sk-or-…) and paste below'],
        ].map(([n,t])=>React.createElement('div',{key:n,className:'key-step'},
          React.createElement('div',{className:'key-step-n'},n),React.createElement('span',null,t)
        ))
      ),
      React.createElement('div',{className:'key-input-wrap'},
        React.createElement('input',{className:'key-input',type:show?'text':'password',placeholder:'sk-or-… (paste your OpenRouter key)',value:val,onChange:e=>setVal(e.target.value),onKeyDown:e=>e.key==='Enter'&&val.trim()&&onSave(val.trim()),autoFocus:true}),
        React.createElement('button',{className:'key-eye',onClick:()=>setShow(s=>!s)},show?'🙈':'👁')
      ),
      React.createElement('button',{className:'key-btn',disabled:!val.trim(),onClick:()=>val.trim()&&onSave(val.trim())},'Connect OpenRouter'),
      React.createElement('div',{className:'key-note'},'🔒 Memory only · Clears on refresh · Sent only to openrouter.ai')
    )
  );
}

function DonutChart({data,total}){
  if(!data.length||total===0)return null;
  const R=38,cx=50,cy=50,sw=11,circ=2*Math.PI*R;let off=0;
  const slices=data.map(({c,total:v})=>{const pct=v/total,dash=pct*circ;
    const el=React.createElement('circle',{key:c,cx,cy,r:R,fill:'none',stroke:CC[c],strokeWidth:sw,strokeDasharray:`${dash} ${circ-dash}`,strokeDashoffset:-(off*circ),style:{transform:'rotate(-90deg)',transformOrigin:'50% 50%'},title:`${c}: ${fmt(v)}`});
    off+=pct;return el;
  });
  return React.createElement('div',{className:'donut-wrap'},
    React.createElement('svg',{width:96,height:96,viewBox:'0 0 100 100'},
      React.createElement('circle',{cx,cy,r:R,fill:'none',stroke:'#1C2540',strokeWidth:sw}),
      ...slices,
      React.createElement('text',{x:50,y:54,textAnchor:'middle',fill:'#8A9AC0',fontSize:9,fontFamily:'DM Mono,monospace'},fmt(total))
    )
  );
}

function HealthRing({score}){
  const{label,color}=hGrade(score);
  const R=30,circ=2*Math.PI*R,filled=(score/100)*circ;
  return React.createElement('div',{className:'health-widget'},
    React.createElement('div',{className:'hlbl'},'Financial Health'),
    React.createElement('div',{className:'health-ring'},
      React.createElement('svg',{width:72,height:72,viewBox:'0 0 72 72'},
        React.createElement('circle',{cx:36,cy:36,r:R,fill:'none',stroke:'#1C2540',strokeWidth:7}),
        React.createElement('circle',{cx:36,cy:36,r:R,fill:'none',stroke:color,strokeWidth:7,strokeDasharray:`${filled} ${circ-filled}`,strokeDashoffset:circ/4,style:{transition:'stroke-dasharray .8s',transform:'rotate(-90deg)',transformOrigin:'50% 50%'}})
      ),
      React.createElement('div',{className:'health-num',style:{color}},score)
    ),
    React.createElement('div',{className:'hgrade',style:{color}},label)
  );
}

function Sidebar({income,totalExp,savings,savPct,catTotals,healthScore}){
  return React.createElement('div',{className:'sidebar'},
    React.createElement(HealthRing,{score:healthScore}),
    React.createElement('div',{className:'metric mg'},
      React.createElement('div',{className:'mlbl'},'Monthly Income'),
      React.createElement('div',{className:'mval'},fmt(income)),
      React.createElement('div',{className:'msub'},'Take-home salary')
    ),
    React.createElement('div',{className:'metric '+(savings>=0?'ma':'mr')},
      React.createElement('div',{className:'mlbl'},'Total Expenses'),
      React.createElement('div',{className:'mval'},fmt(totalExp)),
      React.createElement('div',{className:'mprog'},React.createElement('div',{className:'mfill',style:{width:Math.min(100,income>0?(totalExp/income)*100:0)+'%',background:totalExp>income?'var(--red)':'var(--amber)'}}))
    ),
    React.createElement('div',{className:'metric '+(savings>=0?'mg':'mr')},
      React.createElement('div',{className:'mlbl'},'Net Savings'),
      React.createElement('div',{className:'mval'},fmt(Math.abs(savings))),
      React.createElement('div',{className:'msub'},savPct+'% · '+(savings<0?'⚠ Deficit':savPct>=20?'✓ On track':'↑ Below target'))
    ),
    catTotals.length>0&&React.createElement(React.Fragment,null,
      React.createElement(DonutChart,{data:catTotals,total:totalExp}),
      React.createElement('div',{className:'cats-lbl'},'By Category'),
      ...catTotals.map(({c,total})=>React.createElement('div',{key:c,className:'cat-row'},
        React.createElement('div',{className:'cat-dot',style:{background:CC[c]}}),
        React.createElement('div',{className:'cat-name'},c),
        React.createElement('div',{className:'cat-amt'},fmt(total))
      ))
    )
  );
}

const QPS=['📊 Analyse my expenses','📈 Best SIP for beginners?','💰 Save tax via 80C?','🛡️ Emergency fund plan','⚖️ ELSS vs PPF?','🎯 Improve health score','💳 Best cashback cards','📉 Reduce my spending'];
const WELCOME=`**Namaste! 🙏** I'm *Finova*, your AI Personal Finance Advisor — powered by **Google Gemini 2.0** with a built-in knowledge base on Indian taxation, RBI rules & investments.

I can help you with:
- **Expense & budget analysis** using your actual numbers
- **Investment advice** — SIP, ELSS, PPF, NPS, SGBs & more
- **Tax optimisation** — 80C, 80D, new vs old regime
- **Goal planning** & milestone tracking
- **Financial health** scoring & improvement tips

Set your income in **Budget**, log expenses in **Expenses**, track goals in **Goals** — then ask me anything!`;

function ChatTab({msgs,busy,streaming,apiKey,onOpenKey,onSend}){
  const[inp,setInp]=useState('');
  const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'})},[msgs,busy]);
  const send=useCallback((text)=>{const t=(text||inp).trim();if(!t||busy)return;setInp('');onSend(t)},[inp,busy,onSend]);
  return React.createElement('div',{className:'chat-area'},
    !apiKey&&React.createElement('div',{className:'no-key-banner'},
      React.createElement('span',null,'🔑 No API key. Enter your OpenRouter key to enable AI-powered financial advice.'),
      React.createElement('button',{onClick:onOpenKey},'Connect API')
    ),
    React.createElement('div',{className:'messages'},
      msgs.map((m,i)=>{
        const isSt=m.role==='assistant'&&i===msgs.length-1&&streaming;
        return React.createElement('div',{key:i,className:'msg '+(m.role==='user'?'usr':'ai')},
          React.createElement('div',{className:'avatar'},m.role==='user'?'U':'₹'),
          React.createElement('div',{className:'bubble'+(isSt?' streaming-cursor':'')},
            m.role==='assistant'?parseMd(m.content):m.content
          )
        );
      }),
      busy&&!streaming&&React.createElement('div',{className:'msg ai'},
        React.createElement('div',{className:'avatar'},'₹'),
        React.createElement('div',{className:'bubble'},React.createElement('div',{className:'typing'},[0,1,2].map(k=>React.createElement('div',{key:k,className:'dot'}))))
      ),
      React.createElement('div',{ref:endRef})
    ),
    React.createElement('div',{className:'qp-bar'},QPS.map(p=>React.createElement('div',{key:p,className:'qp',onClick:()=>!busy&&send(p)},p))),
    React.createElement('div',{className:'input-bar'},
      React.createElement('input',{className:'chat-input',placeholder:'Ask about investments, tax, budgeting, goals…',value:inp,onChange:e=>setInp(e.target.value),onKeyDown:e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),send()),disabled:busy}),
      React.createElement('button',{className:'send-btn',disabled:busy||!inp.trim(),onClick:()=>send()},
        React.createElement('svg',{width:15,height:15,viewBox:'0 0 24 24',fill:'none',stroke:busy?'#4E627A':'#000',strokeWidth:'2.5',strokeLinecap:'round',strokeLinejoin:'round'},
          React.createElement('line',{x1:'22',y1:'2',x2:'11',y2:'13'}),
          React.createElement('polygon',{points:'22 2 15 22 11 13 2 9 22 2'})
        )
      )
    )
  );
}

function ExpensesTab({expenses,totalExp,onAdd,onDelete}){
  const[form,setForm]=useState({desc:'',amount:'',category:'Food'});
  const add=()=>{if(!form.desc.trim()||!form.amount)return;onAdd({desc:form.desc.trim(),amount:parseFloat(form.amount),category:form.category});setForm({desc:'',amount:'',category:'Food'})};
  const csv=()=>{const rows=[['Date','Description','Category','Amount'],...expenses.map(e=>[e.date||'','"'+e.desc+'"',e.category,e.amount])];const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(rows.map(r=>r.join(',')).join('\n'));a.download='finova_expenses.csv';a.click()};
  return React.createElement('div',{className:'panel'},
    React.createElement('div',{className:'card'},
      React.createElement('div',{className:'card-title'},'+ Add Expense'),
      React.createElement('div',{className:'add-row'},
        React.createElement('input',{className:'in in-desc',placeholder:'Description',value:form.desc,onChange:e=>setForm({...form,desc:e.target.value}),onKeyDown:e=>e.key==='Enter'&&add()}),
        React.createElement('input',{className:'in in-amt',placeholder:'Amount ₹',type:'number',min:'0',value:form.amount,onChange:e=>setForm({...form,amount:e.target.value}),onKeyDown:e=>e.key==='Enter'&&add()}),
        React.createElement('select',{className:'in',value:form.category,onChange:e=>setForm({...form,category:e.target.value})},CATS.map(c=>React.createElement('option',{key:c,value:c},c))),
        React.createElement('button',{className:'add-btn',onClick:add},'Add')
      )
    ),
    React.createElement('div',{className:'exp-list-hd'},
      React.createElement('span',null,expenses.length+' expense'+(expenses.length!==1?'s':'')+' — Total: '+fmt(totalExp)),
      React.createElement('button',{className:'export-btn',onClick:csv},'↓ Export CSV')
    ),
    expenses.length===0
      ?React.createElement('div',{style:{textAlign:'center',color:'var(--text3)',padding:'50px 20px',fontSize:'13px',lineHeight:'1.7'}},'No expenses yet.',React.createElement('br'),'Add your first expense above!')
      :expenses.slice().reverse().map(e=>
        React.createElement('div',{key:e.id,className:'exp-item'},
          React.createElement('div',{className:'exp-dot',style:{background:CC[e.category]}}),
          React.createElement('div',{className:'exp-desc'},e.desc),
          React.createElement('div',{className:'exp-tag'},e.category),
          e.date&&React.createElement('div',{className:'exp-date'},e.date),
          React.createElement('div',{className:'exp-amt'},fmt(e.amount)),
          React.createElement('button',{className:'del-btn',onClick:()=>onDelete(e.id)},'×')
        )
      )
  );
}

function BudgetTab({income,setIncome,needs,wants,savings}){
  const pct=v=>income>0?Math.round((v/income)*100):0;
  const nP=pct(needs),wP=pct(wants),sP=pct(savings);
  const rules=[
    {label:'Needs (housing, food, transport)',val:needs,p:nP,target:50,fill:'#4F8EF7',over:nP>50},
    {label:'Wants (dining, entertainment)',val:wants,p:wP,target:30,fill:'#F5A623',over:wP>30},
    {label:'Savings & Investments',val:savings,p:sP,target:20,fill:'#00C27C',over:sP<20},
  ];
  const allocs=[
    {label:'Emergency Fund (Liquid FD)',pct:30,color:'#4F8EF7'},
    {label:'ELSS / Nifty 50 Index SIP',pct:40,color:'#00C27C'},
    {label:'PPF — Section 80C',pct:20,color:'#A78BFA'},
    {label:'NPS / Gold SGB',pct:10,color:'#F5A623'},
  ];
  return React.createElement('div',{className:'panel'},
    React.createElement('div',{className:'inc-row'},
      React.createElement('label',{className:'inc-lbl'},'Monthly Take-Home Income (₹)'),
      React.createElement('input',{className:'inc-input',type:'number',value:income,onChange:e=>setIncome(parseInt(e.target.value)||0)})
    ),
    React.createElement('div',{className:'card'},
      React.createElement('div',{className:'card-title'},'50 / 30 / 20 Rule Analysis'),
      rules.map(({label,val,p,target,fill,over})=>
        React.createElement('div',{key:label},
          React.createElement('div',{className:'rule-hd'},React.createElement('div',{className:'rule-lbl'},label),React.createElement('div',{className:'rule-pct',style:{color:over?'var(--red)':fill}},p+'%')),
          React.createElement('div',{className:'rule-bar'},React.createElement('div',{className:'rule-fill',style:{width:Math.min(100,Math.max(0,p))+'%',background:fill}})),
          React.createElement('div',{className:'rule-vals'},React.createElement('span',null,'Actual: '+fmt(val)),React.createElement('span',null,'Target: '+fmt(income*target/100)))
        )
      ),
      savings>0&&sP>=20
        ?React.createElement('div',{className:'hint'},React.createElement('p',null,`✓ Saving ${sP}% — above target! Suggested split: ${fmt(savings*.4)} ELSS SIP · ${fmt(savings*.3)} emergency fund · ${fmt(savings*.2)} PPF (80C) · ${fmt(savings*.1)} NPS/SGB.`))
        :savings<=0
          ?React.createElement('div',{className:'deficit'},React.createElement('p',null,`⚠ Expenses exceed income by ${fmt(Math.abs(savings))}. Review Bills and Shopping categories first.`))
          :React.createElement('div',{className:'warn'},React.createElement('p',null,`⚠ Savings at ${sP}% (target ≥20% = ${fmt(income*.2)}). Gap: ${fmt(income*.2-savings)}. Automate SIP on salary day.`))
    ),
    savings>0&&React.createElement('div',{className:'card'},
      React.createElement('div',{className:'card-title'},'Suggested Investment Split'),
      allocs.map(({label,pct:p,color})=>
        React.createElement('div',{key:label},
          React.createElement('div',{className:'alloc-row'},React.createElement('div',{className:'alloc-dot',style:{background:color}}),React.createElement('div',{className:'alloc-name'},label),React.createElement('div',{className:'alloc-val'},fmt(savings*p/100)+' · '+p+'%')),
          React.createElement('div',{className:'rule-bar',style:{marginBottom:'12px'}},React.createElement('div',{className:'rule-fill',style:{width:p+'%',background:color}}))
        )
      )
    )
  );
}

function GoalsTab({goals,setGoals,savings}){
  const[showForm,setShowForm]=useState(false);
  const[form,setForm]=useState({name:'',icon:'🎯',target:'',current:'',color:'#00C27C',deadline:''});
  const[depId,setDepId]=useState(null);
  const[depAmt,setDepAmt]=useState('');
  const add=()=>{if(!form.name||!form.target)return;setGoals(p=>[...p,{id:Date.now(),name:form.name,icon:form.icon,target:parseFloat(form.target),current:parseFloat(form.current)||0,color:form.color,deadline:form.deadline}]);setForm({name:'',icon:'🎯',target:'',current:'',color:'#00C27C',deadline:''});setShowForm(false)};
  const dep=id=>{const a=parseFloat(depAmt);if(!a||a<=0)return;setGoals(p=>p.map(g=>g.id===id?{...g,current:Math.min(g.target,g.current+a)}:g));setDepId(null);setDepAmt('')};
  const del=id=>setGoals(p=>p.filter(g=>g.id!==id));
  const mo=g=>savings>0&&g.current<g.target?Math.ceil((g.target-g.current)/savings):null;
  return React.createElement('div',{className:'panel'},
    React.createElement('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}},
      React.createElement('div',{style:{fontSize:13,color:'var(--text2)'}},goals.length+' goal'+(goals.length!==1?'s':'')+' tracked'),
      React.createElement('button',{className:'add-btn',style:{padding:'7px 16px',fontSize:12},onClick:()=>setShowForm(s=>!s)},showForm?'✕ Cancel':'+ New Goal')
    ),
    showForm&&React.createElement('div',{className:'goal-form'},
      React.createElement('div',{className:'gform-title'},'Create Financial Goal'),
      React.createElement('div',{className:'gform-row'},
        React.createElement('select',{className:'in',value:form.icon,onChange:e=>setForm({...form,icon:e.target.value}),style:{width:72}},GICONS.map(ic=>React.createElement('option',{key:ic,value:ic},ic))),
        React.createElement('input',{className:'in',placeholder:'Goal name',style:{flex:1},value:form.name,onChange:e=>setForm({...form,name:e.target.value})})
      ),
      React.createElement('div',{className:'gform-row'},
        React.createElement('input',{className:'in',type:'number',placeholder:'Target ₹',style:{flex:1},value:form.target,onChange:e=>setForm({...form,target:e.target.value})}),
        React.createElement('input',{className:'in',type:'number',placeholder:'Saved so far ₹',style:{flex:1},value:form.current,onChange:e=>setForm({...form,current:e.target.value})}),
        React.createElement('input',{className:'in',type:'month',style:{flex:1},value:form.deadline,onChange:e=>setForm({...form,deadline:e.target.value})})
      ),
      React.createElement('div',{style:{display:'flex',gap:6,marginBottom:12,alignItems:'center',flexWrap:'wrap'}},
        React.createElement('span',{style:{fontSize:10,color:'var(--text3)',fontFamily:'var(--ff-mono)',marginRight:4}},'COLOR'),
        GCOLS.map(c=>React.createElement('div',{key:c,className:'cswatch'+(form.color===c?' sel':''),onClick:()=>setForm({...form,color:c}),style:{background:c}}))
      ),
      React.createElement('button',{className:'add-btn',onClick:add},'Create Goal')
    ),
    goals.length===0
      ?React.createElement('div',{style:{textAlign:'center',color:'var(--text3)',padding:'50px 20px',fontSize:'13px',lineHeight:'1.7'}},'No goals yet.',React.createElement('br'),'Create your first financial goal above!')
      :goals.map(g=>{
        const pct=Math.min(100,Math.round((g.current/g.target)*100)),done=g.current>=g.target,m=mo(g);
        return React.createElement('div',{key:g.id,className:'goal-card'},
          React.createElement('div',{className:'goal-header'},React.createElement('div',{className:'goal-icon'},g.icon),React.createElement('div',{className:'goal-name'},g.name),React.createElement('div',{className:'goal-pct',style:{color:done?'var(--green)':g.color}},done?'✓ Done!':pct+'%')),
          React.createElement('div',{className:'goal-bar'},React.createElement('div',{className:'goal-fill',style:{width:pct+'%',background:done?'var(--green)':g.color}})),
          React.createElement('div',{className:'goal-meta'},React.createElement('span',null,fmt(g.current)+' saved'),React.createElement('span',null,'Target: '+fmt(g.target))),
          !done&&React.createElement('div',{className:'goal-meta',style:{marginTop:4}},
            g.deadline&&React.createElement('span',null,'📅 '+g.deadline),
            m&&React.createElement('span',null,'⏱ ~'+m+' month'+(m!==1?'s':'')+' at current rate')
          ),
          React.createElement('div',{className:'goal-actions'},
            !done&&React.createElement('button',{className:'gadd-btn',onClick:()=>{setDepId(g.id===depId?null:g.id);setDepAmt('')}},depId===g.id?'Cancel':'+ Add Savings'),
            React.createElement('button',{className:'gdel-btn',onClick:()=>del(g.id)},'🗑 Delete')
          ),
          depId===g.id&&React.createElement('div',{style:{display:'flex',gap:8,marginTop:8}},
            React.createElement('input',{className:'in',type:'number',placeholder:'Amount ₹',style:{flex:1},value:depAmt,onChange:e=>setDepAmt(e.target.value),onKeyDown:e=>e.key==='Enter'&&dep(g.id)}),
            React.createElement('button',{className:'add-btn',style:{padding:'7px 16px',fontSize:12},onClick:()=>dep(g.id)},'Save')
          )
        );
      })
  );
}

function AnalyticsTab({expenses,income,totalExp,savings,catTotals}){
  const sP=income>0?Math.round((savings/income)*100):0;
  const eP=income>0?Math.round((totalExp/income)*100):0;
  const nd=catTotals.filter(x=>['Bills','Food','Transport','Health'].includes(x.c)).reduce((a,x)=>a+x.total,0);
  const wn=catTotals.filter(x=>['Shopping','Entertainment'].includes(x.c)).reduce((a,x)=>a+x.total,0);
  const maxC=catTotals.length?Math.max(...catTotals.map(x=>x.total)):1;
  const months=['Oct','Nov','Dec','Jan','Feb','Mar'];
  const trends=[6200,7100,9500,5900,7800,totalExp].map((v,i)=>({m:months[i],v}));
  const maxT=Math.max(...trends.map(x=>x.v),1);
  return React.createElement('div',{className:'panel'},
    React.createElement('div',{className:'agrid'},
      ...[
        {label:'Expense Ratio',val:eP+'%',color:eP>80?'var(--red)':eP>60?'var(--amber)':'var(--green)'},
        {label:'Savings Rate',val:sP+'%',color:sP>=20?'var(--green)':sP>=10?'var(--amber)':'var(--red)'},
        {label:'Needs / Income',val:income>0?Math.round((nd/income)*100)+'%':'—',color:'var(--blue)'},
        {label:'Wants / Income',val:income>0?Math.round((wn/income)*100)+'%':'—',color:'var(--amber)'},
      ].map(({label,val,color})=>React.createElement('div',{key:label,className:'stat-card'},
        React.createElement('div',{className:'stat-lbl'},label),React.createElement('div',{className:'stat-val',style:{color}},val)
      ))
    ),
    React.createElement('div',{className:'card'},
      React.createElement('div',{className:'card-title'},'Spending by Category'),
      catTotals.length===0
        ?React.createElement('div',{style:{color:'var(--text3)',fontSize:13,textAlign:'center',padding:'20px 0'}},'No expenses logged yet.')
        :React.createElement('div',{style:{paddingTop:6}},
          catTotals.slice().sort((a,b)=>b.total-a.total).map(({c,total})=>
            React.createElement('div',{key:c,className:'bar-row'},
              React.createElement('div',{className:'bar-cat'},c),
              React.createElement('div',{className:'bar-track'},React.createElement('div',{className:'bar-fill',style:{width:((total/maxC)*100)+'%',background:CC[c]}})),
              React.createElement('div',{className:'bar-val'},fmt(total))
            )
          )
        )
    ),
    React.createElement('div',{className:'card'},
      React.createElement('div',{className:'card-title'},'6-Month Spending Trend'),
      React.createElement('div',{className:'trend-wrap'},
        trends.map(({m,v})=>React.createElement('div',{key:m,className:'tcol'},
          React.createElement('div',{className:'tbar',style:{height:((v/maxT)*70)+'px',background:m==='Mar'?'var(--green)':'var(--border2)'}}),
          React.createElement('div',{className:'tlbl'},m)
        ))
      ),
      React.createElement('div',{style:{marginTop:8,fontSize:11,color:'var(--text3)',fontFamily:'var(--ff-mono)',textAlign:'right'}},
        'This month: '+fmt(totalExp)+(totalExp>7800?' ↑ higher':' ↓ lower')+' than last month'
      )
    ),
    React.createElement('div',{className:'card'},
      React.createElement('div',{className:'card-title'},'Needs vs Wants vs Savings'),
      React.createElement('div',{style:{display:'flex',height:12,borderRadius:6,overflow:'hidden',marginBottom:10}},
        ...[{v:nd,c:'#4F8EF7'},{v:wn,c:'#F5A623'},{v:Math.max(0,savings),c:'#00C27C'}].map(({v,c},i)=>React.createElement('div',{key:i,style:{flex:v||0.001,background:c,transition:'flex .6s'}}))
      ),
      React.createElement('div',{style:{display:'flex',gap:16,flexWrap:'wrap'}},
        ...[{l:'Needs',v:nd,c:'#4F8EF7'},{l:'Wants',v:wn,c:'#F5A623'},{l:'Savings',v:Math.max(0,savings),c:'#00C27C'}].map(({l,v,c})=>
          React.createElement('div',{key:l,style:{display:'flex',alignItems:'center',gap:6}},
            React.createElement('div',{style:{width:8,height:8,borderRadius:'50%',background:c}}),
            React.createElement('span',{style:{fontSize:11,color:'var(--text2)'}},l+': '+fmt(v))
          )
        )
      )
    )
  );
}

/* ── Main App ── */
function App(){
  const[tab,setTab]         =useState('chat');
  const[apiKey,setApiKey]   =useState(()=>{try{return localStorage.getItem('fnv_or_key')||''}catch{return''}});
  const[showKey,setShowKey] =useState(false);
  const[streaming,setStreaming]=useState(false);
  const[income,setIncome]   =useState(()=>{try{return parseInt(localStorage.getItem('fnv_income')||'55000')||55000}catch{return 55000}});
  const[expenses,setExp]    =useState(()=>{try{return JSON.parse(localStorage.getItem('fnv_expenses'))||DEF_EXP}catch{return DEF_EXP}});
  const[goals,setGoals]     =useState(()=>{try{return JSON.parse(localStorage.getItem('fnv_goals'))||DEF_GOALS}catch{return DEF_GOALS}});
  const[msgs,setMsgs]       =useState([{role:'assistant',content:WELCOME}]);
  const[busy,setBusy]       =useState(false);

  useEffect(()=>{try{if(apiKey)localStorage.setItem('fnv_or_key',apiKey)}catch{}},[apiKey]);
  useEffect(()=>{try{localStorage.setItem('fnv_income',income)}catch{}},[income]);
  useEffect(()=>{try{localStorage.setItem('fnv_expenses',JSON.stringify(expenses))}catch{}},[expenses]);
  useEffect(()=>{try{localStorage.setItem('fnv_goals',JSON.stringify(goals))}catch{}},[goals]);

  const totalExp=expenses.reduce((s,e)=>s+e.amount,0);
  const savings=income-totalExp;
  const savPct=income>0?Math.round((savings/income)*100):0;
  const catTotals=CATS.map(c=>({c,total:expenses.filter(e=>e.category===c).reduce((s,e)=>s+e.amount,0)})).filter(x=>x.total>0);
  const needs=expenses.filter(e=>['Bills','Food','Transport','Health'].includes(e.category)).reduce((s,e)=>s+e.amount,0);
  const wants=expenses.filter(e=>['Shopping','Entertainment'].includes(e.category)).reduce((s,e)=>s+e.amount,0);
  const hs=calcHealth(savPct,income,totalExp,catTotals);
  const{color:hc}=hGrade(hs);

  const handleSend=useCallback(async(text)=>{
    if(!apiKey){setShowKey(true);return}
    const hist=[...msgs,{role:'user',content:text}];
    setMsgs([...hist,{role:'assistant',content:''}]);
    setBusy(true);setStreaming(true);

    const ctx=getCtx(text);
    const gSnap=goals.map(g=>`${g.name}: ${fmt(g.current)}/${fmt(g.target)}`).join('; ')||'None set';
    const sys=`You are Finova, a professional AI Personal Finance Advisor specialising in Indian personal finance. Be concise, specific, and actionable. Use **bold** for key terms/amounts. Use bullet points for lists. Keep to 3-4 focused paragraphs.

KNOWLEDGE BASE:
${ctx}

USER FINANCIAL DATA:
Income: ${fmt(income)} | Expenses: ${fmt(totalExp)} | Savings: ${fmt(savings)} (${savPct}%)
Categories: ${catTotals.map(x=>x.c+': '+fmt(x.total)).join(', ')||'none'}
Goals: ${gSnap}
Health Score: ${hs}/100

Always use ₹ symbol. Reference tax sections (80C, 80D etc.) when relevant. Give advice specific to the user's actual numbers.`;

    // Build OpenRouter messages
    const messages=[{role:'system',content:sys}];
    for(let i=0;i<hist.length;i++){
      const m=hist[i];
      if(i===0&&m.role==='assistant')continue; // skip leading assistant
      messages.push({role:m.role,content:m.content||' '});
    }
    const model='nvidia/nemotron-3-super-120b-a12b:free';
    const payload={model,messages,stream:true,temperature:0.7,max_tokens:1200};

    let acc='';
    try{
      const res=await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`,'HTTP-Referer':window.location.href,'X-Title':'Finova'},body:JSON.stringify(payload)}
      );
      if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e?.error?.message||`HTTP ${res.status}`);}
      const reader=res.body.getReader(),dec=new TextDecoder();
      let buf='';
      while(true){
        const{done,value}=await reader.read();if(done)break;
        buf+=dec.decode(value,{stream:true});
        const lines=buf.split('\n');buf=lines.pop()||'';
        for(const ln of lines){
          if(!ln.startsWith('data:'))continue;
          const raw=ln.slice(5).trim();if(!raw||raw==='[DONE]')continue;
          try{const p=JSON.parse(raw);const t=p?.choices?.[0]?.delta?.content||'';if(t){acc+=t;setMsgs([...hist,{role:'assistant',content:acc}])}}catch{}
        }
      }
      // flush remainder
      if(buf.startsWith('data:')){try{const p=JSON.parse(buf.slice(5).trim());const t=p?.choices?.[0]?.delta?.content||'';if(t){acc+=t;setMsgs([...hist,{role:'assistant',content:acc}])}}catch{}}
      if(!acc) throw new Error('Empty response received. Please try again.');
    }catch(err){
      let msg;
      const em=err.message||'';
      if(em.includes('Unauthorized')||em.includes('401'))
        msg='**Invalid API Key.** Your OpenRouter key appears incorrect. Click ⚙ in the header to update it. Keys start with `sk-or`.';
      else if(em.includes('429'))
        msg='**Rate limit reached.** Please wait a moment or check your credits on OpenRouter.';
      else if(em.includes('fetch')||em.includes('Failed to fetch')||em.includes('network'))
        msg='**Network error.** Could not reach the OpenRouter API. Please check your internet connection.';
      else
        msg=`**Error:** ${em}. Please verify your API key and try again.`;
      setMsgs([...hist,{role:'assistant',content:msg}]);
    }
    setBusy(false);setStreaming(false);
  },[msgs,apiKey,income,totalExp,savings,savPct,catTotals,goals,hs]);

  const saveKey=k=>{setApiKey(k);setShowKey(false)};
  const addExp=({desc,amount,category})=>setExp(p=>[...p,{id:Date.now(),desc,amount,category,date:new Date().toISOString().split('T')[0]}]);
  const delExp=id=>setExp(p=>p.filter(e=>e.id!==id));
  const TABS=[['chat','💬 Chat'],['expenses','📊 Expenses'],['budget','🎯 Budget'],['goals','🏆 Goals'],['analytics','📈 Analytics']];

  return React.createElement('div',{id:'root'},
    (!apiKey||showKey)&&React.createElement(KeyModal,{onSave:saveKey,onClose:apiKey?()=>setShowKey(false):null}),

    React.createElement('div',{className:'header'},
      React.createElement('div',{className:'logo'},
        React.createElement('div',{className:'logo-mark'},'₹'),
        React.createElement('div',{className:'logo-name'},'Finova',React.createElement('span',null,' AI'))
      ),
      React.createElement('div',{className:'header-right'},
        React.createElement('div',{className:'badge badge-green'},'RAG Active'),
        React.createElement('div',{className:'badge-gemini'},React.createElement(GDots),'OpenRouter / Nemotron'),
        React.createElement('div',{className:'health-badge',style:{color:hc,borderColor:hc+'44',background:hc+'11'}},'♥ '+hs+'/100'),
        React.createElement('button',{className:'cog-btn',title:'Configure API Key',onClick:()=>setShowKey(true)},'⚙')
      )
    ),

    React.createElement('div',{className:'tabs'},
      TABS.map(([id,label])=>React.createElement('div',{key:id,className:'tab'+(tab===id?' active':''),onClick:()=>setTab(id)},label))
    ),

    React.createElement('div',{className:'body'},
      React.createElement(Sidebar,{income,totalExp,savings,savPct,catTotals,healthScore:hs}),
      tab==='chat'     &&React.createElement(ChatTab,{msgs,busy,streaming,apiKey,onOpenKey:()=>setShowKey(true),onSend:handleSend}),
      tab==='expenses' &&React.createElement(ExpensesTab,{expenses,totalExp,onAdd:addExp,onDelete:delExp}),
      tab==='budget'   &&React.createElement(BudgetTab,{income,setIncome,needs,wants,savings}),
      tab==='goals'    &&React.createElement(GoalsTab,{goals,setGoals,savings}),
      tab==='analytics'&&React.createElement(AnalyticsTab,{expenses,income,totalExp,savings,catTotals})
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
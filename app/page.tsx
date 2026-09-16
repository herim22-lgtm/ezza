'use client';

import { useMemo, useState } from 'react';

type Entry = { id: number; name: string; amount: number };

const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

export default function Home() {
  const [cash, setCash] = useState(1180);
  const [taxRate, setTaxRate] = useState(20);
  const [savings, setSavings] = useState(100);
  const [income, setIncome] = useState<Entry[]>([{ id: 1, name: 'Weekly income', amount: 1180 }]);
  const [bills, setBills] = useState<Entry[]>([
    { id: 1, name: 'Rent', amount: 220 },
    { id: 2, name: 'Phone', amount: 90 },
  ]);
  const [purchase, setPurchase] = useState(300);
  const [tab, setTab] = useState('Home');

  const billTotal = useMemo(() => bills.reduce((sum, b) => sum + b.amount, 0), [bills]);
  const taxReserve = Math.max(0, cash * (taxRate / 100));
  const safe = Math.max(0, cash - billTotal - taxReserve - savings);
  const afterPurchase = safe - purchase;

  function addEntry(kind: 'income' | 'bill') {
    const name = window.prompt(kind === 'income' ? 'Income source' : 'Bill name');
    const raw = window.prompt('Amount');
    const amount = Number(raw);
    if (!name || !Number.isFinite(amount) || amount <= 0) return;
    const entry = { id: Date.now(), name, amount };
    if (kind === 'income') {
      setIncome((v) => [entry, ...v]);
      setCash((v) => v + amount);
    } else setBills((v) => [entry, ...v]);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><div className="mark">E</div><span>Ezza</span></div>
        <button className="avatar">ED</button>
      </header>

      <section className="hero">
        <p className="eyebrow">YOUR FINANCIAL AUTOPILOT</p>
        <h1>Your money, <em>made clear.</em></h1>
        <p className="subtitle">Built for income that changes. Ezza protects what you need first, then shows what is actually safe to use.</p>
      </section>

      <section className="safeCard">
        <div>
          <span className="label">SAFE TO SPEND RIGHT NOW</span>
          <div className="safeAmount">{money(safe)}</div>
          <p>after bills, taxes and your savings reserve</p>
        </div>
        <div className="ring"><span>{cash ? Math.round((safe / cash) * 100) : 0}%</span><small>available</small></div>
      </section>

      <section className="grid stats">
        <article><span>Available cash</span><strong>{money(cash)}</strong><input aria-label="available cash" type="number" value={cash} onChange={(e) => setCash(Number(e.target.value) || 0)} /></article>
        <article><span>Upcoming bills</span><strong>{money(billTotal)}</strong><small>{bills.length} protected payments</small></article>
        <article><span>Tax reserve</span><strong>{money(taxReserve)}</strong><small><input className="tiny" aria-label="tax rate" type="number" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value) || 0)} />% of cash</small></article>
        <article><span>Savings reserve</span><strong>{money(savings)}</strong><input aria-label="savings reserve" type="number" value={savings} onChange={(e) => setSavings(Number(e.target.value) || 0)} /></article>
      </section>

      <section className="twoCol">
        <article className="panel">
          <div className="panelHead"><div><span className="label">MONEY IN</span><h2>Income</h2></div><button onClick={() => addEntry('income')}>+ Add income</button></div>
          {income.slice(0, 4).map((item) => <div className="row" key={item.id}><span>{item.name}</span><b>+{money(item.amount)}</b></div>)}
        </article>
        <article className="panel">
          <div className="panelHead"><div><span className="label">PROTECTED FIRST</span><h2>Upcoming bills</h2></div><button onClick={() => addEntry('bill')}>+ Add bill</button></div>
          {bills.slice(0, 4).map((item) => <div className="row" key={item.id}><span>{item.name}</span><b>{money(item.amount)}</b></div>)}
        </article>
      </section>

      <section className="afford">
        <div><span className="label">CAN I AFFORD IT?</span><h2>Check before you spend.</h2><p>Ezza compares a purchase with your safe-to-spend amount—not your bank balance.</p></div>
        <div className="purchaseBox"><label>Purchase price</label><div className="priceInput"><span>$</span><input type="number" value={purchase} onChange={(e) => setPurchase(Number(e.target.value) || 0)} /></div><div className={afterPurchase >= 0 ? 'result good' : 'result bad'}>{afterPurchase >= 0 ? `${money(afterPurchase)} left safely` : `${money(Math.abs(afterPurchase))} over your safe amount`}</div></div>
      </section>

      <section className="aiCard">
        <div className="spark">✦</div><div><span className="label">ASK EZZA</span><h2>Understand the “why” behind your money.</h2><p>“Why did my safe-to-spend drop?” &nbsp; “What if I make $400 more Friday?”</p></div><button onClick={() => setTab('Ezza AI')}>Open Ezza AI →</button>
      </section>

      <nav className="bottomNav">{['Home','Money','Ezza AI','Goals','Profile'].map((x) => <button key={x} className={tab === x ? 'active' : ''} onClick={() => setTab(x)}>{x}</button>)}</nav>
      <footer>Ezza provides budgeting estimates for educational purposes and is not financial or tax advice.</footer>
    </main>
  );
}

'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Entry = { id: string; name: string; amount: number };
type Goal = { id: string; name: string; target: number; saved: number };
type Message = { id: string; role: 'user' | 'ezza'; text: string };
type AppData = {
  cash: number;
  taxRate: number;
  savings: number;
  income: Entry[];
  bills: Entry[];
  goals: Goal[];
  messages: Message[];
  fullName: string;
};

const initialData: AppData = {
  cash: 1180,
  taxRate: 20,
  savings: 100,
  income: [{ id: 'income-1', name: 'Weekly income', amount: 1180 }],
  bills: [{ id: 'bill-1', name: 'Rent', amount: 220 }, { id: 'bill-2', name: 'Phone', amount: 90 }],
  goals: [{ id: 'goal-1', name: 'Emergency fund', target: 3000, saved: 100 }],
  messages: [{ id: 'welcome', role: 'ezza', text: 'Hi! Ask me what is safe to spend, whether you can afford something, or how to reach a savings goal.' }],
  fullName: '',
};

const tabs = ['Home', 'Money', 'Ezza AI', 'Goals', 'Profile'] as const;
type Tab = typeof tabs[number];
const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number.isFinite(n) ? n : 0);
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function Dashboard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [tab, setTab] = useState<Tab>('Home');
  const [data, setData] = useState<AppData>(initialData);
  const [entryName, setEntryName] = useState('');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryKind, setEntryKind] = useState<'income' | 'bill'>('income');
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [chatInput, setChatInput] = useState('');
  const hydrated = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) { router.replace('/login'); return; }
      setUserId(authData.user.id);
      setEmail(authData.user.email ?? '');
      const metadataName = typeof authData.user.user_metadata?.full_name === 'string' ? authData.user.user_metadata.full_name : '';
      const { data: saved } = await supabase.from('ezza_user_data').select('data').eq('user_id', authData.user.id).maybeSingle();
      const stored = saved?.data as Partial<AppData> | undefined;
      setData({ ...initialData, ...stored, fullName: stored?.fullName || metadataName });
      hydrated.current = true;
      setChecking(false);
    }
    load();
  }, [router]);

  useEffect(() => {
    if (!hydrated.current || !userId) return;
    const timer = window.setTimeout(async () => {
      setSaving(true);
      const { error } = await createClient().from('ezza_user_data').upsert({ user_id: userId, data, updated_at: new Date().toISOString() });
      setSaveMessage(error ? 'Could not save' : 'Saved');
      setSaving(false);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [data, userId]);

  const billTotal = useMemo(() => data.bills.reduce((sum, item) => sum + item.amount, 0), [data.bills]);
  const incomeTotal = useMemo(() => data.income.reduce((sum, item) => sum + item.amount, 0), [data.income]);
  const taxReserve = Math.max(0, data.cash * (data.taxRate / 100));
  const safe = Math.max(0, data.cash - billTotal - taxReserve - data.savings);

  function addEntry(event: FormEvent) {
    event.preventDefault();
    const amount = Number(entryAmount);
    if (!entryName.trim() || !Number.isFinite(amount) || amount <= 0) return;
    const entry = { id: newId(), name: entryName.trim(), amount };
    setData((current) => entryKind === 'income'
      ? { ...current, income: [entry, ...current.income], cash: current.cash + amount }
      : { ...current, bills: [entry, ...current.bills] });
    setEntryName('');
    setEntryAmount('');
  }

  function removeEntry(kind: 'income' | 'bill', id: string) {
    setData((current) => ({ ...current, [kind === 'income' ? 'income' : 'bills']: current[kind === 'income' ? 'income' : 'bills'].filter((item) => item.id !== id) }));
  }

  function addGoal(event: FormEvent) {
    event.preventDefault();
    const target = Number(goalTarget);
    if (!goalName.trim() || !Number.isFinite(target) || target <= 0) return;
    setData((current) => ({ ...current, goals: [...current.goals, { id: newId(), name: goalName.trim(), target, saved: 0 }] }));
    setGoalName('');
    setGoalTarget('');
  }

  function contribute(goal: Goal) {
    const amount = Number(window.prompt(`How much do you want to add to ${goal.name}?`));
    if (!Number.isFinite(amount) || amount <= 0) return;
    setData((current) => ({ ...current, goals: current.goals.map((item) => item.id === goal.id ? { ...item, saved: Math.min(item.target, item.saved + amount) } : item) }));
  }

  function answer(question: string) {
    const q = question.toLowerCase();
    const amountMatch = q.match(/\$?([0-9]+(?:\.[0-9]{1,2})?)/);
    const amount = amountMatch ? Number(amountMatch[1]) : null;
    if (q.includes('afford') && amount !== null) return amount <= safe
      ? `Yes. ${money(amount)} is within your safe-to-spend amount. You would have ${money(safe - amount)} left safely.`
      : `Not safely yet. That purchase is ${money(amount - safe)} above your current safe-to-spend amount.`;
    if (q.includes('safe') || q.includes('spend')) return `You can safely spend ${money(safe)} right now after protecting ${money(billTotal)} for bills, ${money(taxReserve)} for taxes, and ${money(data.savings)} for savings.`;
    if (q.includes('bill')) return `You have ${data.bills.length} bills totaling ${money(billTotal)}. Your largest is ${data.bills.length ? `${data.bills.slice().sort((a,b) => b.amount-a.amount)[0].name} at ${money(data.bills.slice().sort((a,b) => b.amount-a.amount)[0].amount)}` : 'not set yet'}.`;
    if (q.includes('tax')) return `At your ${data.taxRate}% reserve rate, Ezza protects ${money(taxReserve)} for taxes.`;
    if (q.includes('save') || q.includes('goal')) return data.goals.length
      ? `You have ${data.goals.length} goal${data.goals.length === 1 ? '' : 's'}. Together you have saved ${money(data.goals.reduce((sum, goal) => sum + goal.saved, 0))}.`
      : 'You have no savings goals yet. Open Goals to create one.';
    if (q.includes('income')) return `Your listed income totals ${money(incomeTotal)}, and your available cash is ${money(data.cash)}.`;
    return `Here is your snapshot: ${money(data.cash)} available, ${money(billTotal)} in bills, and ${money(safe)} safe to spend. Try asking “Can I afford $200?”`;
  }

  function sendMessage(event: FormEvent) {
    event.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    const userMessage: Message = { id: newId(), role: 'user', text };
    const assistantMessage: Message = { id: newId(), role: 'ezza', text: answer(text) };
    setData((current) => ({ ...current, messages: [...current.messages, userMessage, assistantMessage].slice(-40) }));
    setChatInput('');
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    const { error } = await createClient().auth.updateUser({ data: { full_name: data.fullName } });
    setSaveMessage(error ? error.message : 'Profile saved');
    setSaving(false);
  }

  async function logOut() {
    await createClient().auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  if (checking) return <main className="loadingScreen"><div className="mark">E</div><p>Loading your dashboard…</p></main>;

  return (
    <main className="shell appShell">
      <header className="topbar"><div className="brand"><div className="mark">E</div><span>Ezza</span></div><div className="accountArea"><span>{saving ? 'Saving…' : saveMessage || email}</span><button onClick={logOut}>Log out</button></div></header>

      {tab === 'Home' && <>
        <section className="hero"><p className="eyebrow">YOUR FINANCIAL AUTOPILOT</p><h1>Hello{data.fullName ? `, ${data.fullName.split(' ')[0]}` : ''}.</h1><p className="subtitle">Everything important about your money, in one clear place.</p></section>
        <section className="safeCard"><div><span className="label">SAFE TO SPEND RIGHT NOW</span><div className="safeAmount">{money(safe)}</div><p>after bills, taxes and your savings reserve</p></div><div className="ring"><span>{data.cash ? Math.round((safe / data.cash) * 100) : 0}%</span><small>available</small></div></section>
        <section className="grid stats">
          <article><span>Available cash</span><strong>{money(data.cash)}</strong><small>current balance</small></article>
          <article><span>Upcoming bills</span><strong>{money(billTotal)}</strong><small>{data.bills.length} protected payments</small></article>
          <article><span>Tax reserve</span><strong>{money(taxReserve)}</strong><small>{data.taxRate}% of cash</small></article>
          <article><span>Savings reserve</span><strong>{money(data.savings)}</strong><small>kept untouched</small></article>
        </section>
        <section className="quickGrid"><button onClick={() => setTab('Money')}><b>Manage money</b><span>Add income, bills, and reserves</span></button><button onClick={() => setTab('Ezza AI')}><b>Ask Ezza</b><span>Get answers using your numbers</span></button><button onClick={() => setTab('Goals')}><b>Track goals</b><span>Build progress toward what matters</span></button></section>
      </>}

      {tab === 'Money' && <section className="sectionPage">
        <div className="sectionTitle"><p className="eyebrow">MONEY</p><h1>Your financial picture</h1><p>Update your cash, reserves, income, and bills. Changes save automatically.</p></div>
        <div className="settingsGrid"><label>Available cash<input type="number" min="0" value={data.cash} onChange={(e) => setData({ ...data, cash: Number(e.target.value) || 0 })} /></label><label>Tax reserve (%)<input type="number" min="0" max="100" value={data.taxRate} onChange={(e) => setData({ ...data, taxRate: Number(e.target.value) || 0 })} /></label><label>Savings reserve<input type="number" min="0" value={data.savings} onChange={(e) => setData({ ...data, savings: Number(e.target.value) || 0 })} /></label></div>
        <form className="addForm" onSubmit={addEntry}><select value={entryKind} onChange={(e) => setEntryKind(e.target.value as 'income' | 'bill')}><option value="income">Income</option><option value="bill">Bill</option></select><input value={entryName} onChange={(e) => setEntryName(e.target.value)} placeholder="Name" required /><input type="number" min="0.01" step="0.01" value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} placeholder="Amount" required /><button>Add</button></form>
        <div className="twoCol"><article className="panel"><div className="panelHead"><div><span className="label">MONEY IN</span><h2>Income</h2></div><b>{money(incomeTotal)}</b></div>{data.income.map((item) => <div className="row editableRow" key={item.id}><span>{item.name}</span><b>+{money(item.amount)}</b><button onClick={() => removeEntry('income', item.id)}>Remove</button></div>)}</article><article className="panel"><div className="panelHead"><div><span className="label">PROTECTED FIRST</span><h2>Bills</h2></div><b>{money(billTotal)}</b></div>{data.bills.map((item) => <div className="row editableRow" key={item.id}><span>{item.name}</span><b>{money(item.amount)}</b><button onClick={() => removeEntry('bill', item.id)}>Remove</button></div>)}</article></div>
      </section>}

      {tab === 'Ezza AI' && <section className="sectionPage chatPage">
        <div className="sectionTitle"><p className="eyebrow">EZZA ASSISTANT</p><h1>Ask about your money</h1><p>Ezza answers using the numbers saved in your account.</p></div>
        <div className="chatWindow">{data.messages.map((message) => <div key={message.id} className={`chatBubble ${message.role}`}><span>{message.role === 'ezza' ? 'Ezza' : 'You'}</span><p>{message.text}</p></div>)}</div>
        <form className="chatForm" onSubmit={sendMessage}><input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask: Can I afford $200?" /><button>Send</button></form>
        <div className="suggestions"><button onClick={() => setChatInput('What is safe to spend?')}>What is safe to spend?</button><button onClick={() => setChatInput('Tell me about my bills')}>Show my bills</button><button onClick={() => setChatInput('How are my goals doing?')}>Check my goals</button></div>
      </section>}

      {tab === 'Goals' && <section className="sectionPage">
        <div className="sectionTitle"><p className="eyebrow">GOALS</p><h1>Build toward something</h1><p>Create a target and update your progress whenever you save.</p></div>
        <form className="addForm goalForm" onSubmit={addGoal}><input value={goalName} onChange={(e) => setGoalName(e.target.value)} placeholder="Goal name" required /><input type="number" min="1" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} placeholder="Target amount" required /><button>Add goal</button></form>
        <div className="goalsGrid">{data.goals.map((goal) => { const percent = Math.min(100, Math.round((goal.saved / goal.target) * 100)); return <article className="goalCard" key={goal.id}><div><span>{percent}% complete</span><h2>{goal.name}</h2></div><div className="progress"><i style={{ width: `${percent}%` }} /></div><p>{money(goal.saved)} of {money(goal.target)}</p><div><button onClick={() => contribute(goal)}>Add money</button><button className="removeButton" onClick={() => setData({ ...data, goals: data.goals.filter((item) => item.id !== goal.id) })}>Remove</button></div></article> })}{!data.goals.length && <p className="emptyState">No goals yet. Add your first goal above.</p>}</div>
      </section>}

      {tab === 'Profile' && <section className="sectionPage profilePage">
        <div className="sectionTitle"><p className="eyebrow">PROFILE</p><h1>Your Ezza account</h1><p>Manage the name shown in your dashboard and review your account email.</p></div>
        <form className="profileCard" onSubmit={saveProfile}><label>Full name<input value={data.fullName} onChange={(e) => setData({ ...data, fullName: e.target.value })} placeholder="Your name" /></label><label>Email address<input value={email} disabled /></label><button disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button><button type="button" className="logoutWide" onClick={logOut}>Log out</button></form>
      </section>}

      <nav className="bottomNav">{tabs.map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</nav>
    </main>
  );
}

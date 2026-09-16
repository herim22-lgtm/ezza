import Link from 'next/link';

export default function Home() {
  return (
    <main className="welcomeShell">
      <nav className="welcomeNav">
        <div className="brand"><div className="mark">E</div><span>Ezza</span></div>
        <Link className="navLogin" href="/login">Log in</Link>
      </nav>
      <section className="welcomeHero">
        <p className="eyebrow">YOUR FINANCIAL AUTOPILOT</p>
        <h1>Your money, <em>made clear.</em></h1>
        <p className="subtitle">Ezza protects your bills, taxes, and savings first—then shows what is actually safe to spend.</p>
        <div className="welcomeActions">
          <Link className="primaryCta" href="/signup">Create free account</Link>
          <Link className="secondaryCta" href="/login">I already have an account</Link>
        </div>
      </section>
      <section className="featureRow">
        <article><span>01</span><h2>Know what is safe</h2><p>See spendable money after the important things are protected.</p></article>
        <article><span>02</span><h2>Plan irregular income</h2><p>Make a clear plan even when every paycheck is different.</p></article>
        <article><span>03</span><h2>Decide with confidence</h2><p>Check purchases before they put your bills or goals at risk.</p></article>
      </section>
    </main>
  );
}

import { login, signup } from './actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand"><span className="logo-mark">E</span><strong>Ezza</strong></div>
        <p className="eyebrow">YOUR FINANCIAL AUTOPILOT</p>
        <h1>Make your money <em>clear.</em></h1>
        <p className="auth-copy">Create an account to securely save your income, bills, expenses, savings goals, and safe-to-spend plan.</p>
        {params.error && <p className="auth-alert error">{params.error}</p>}
        {params.message && <p className="auth-alert">{params.message}</p>}
        <form className="auth-form">
          <label>Full name <input name="fullName" type="text" placeholder="Your name" /></label>
          <label>Email <input name="email" type="email" placeholder="you@example.com" required /></label>
          <label>Password <input name="password" type="password" placeholder="At least 8 characters" minLength={8} required /></label>
          <div className="auth-actions">
            <button className="primary-btn" formAction={login}>Log in</button>
            <button className="secondary-btn" formAction={signup}>Create account</button>
          </div>
        </form>
        <p className="fine-print">Ezza provides budgeting estimates for educational purposes and is not financial or tax advice.</p>
      </section>
    </main>
  )
}

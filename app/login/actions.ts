'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  if (!email || !password) redirect('/login?error=Enter%20your%20email%20and%20password')

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)
  redirect('/')
}

export async function signup(formData: FormData) {
  const fullName = String(formData.get('fullName') || '').trim()
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  if (!email || password.length < 8) redirect('/login?error=Use%20a%20valid%20email%20and%20at%20least%208%20characters')

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)

  if (data.user) {
    await supabase.from('profiles').upsert({ id: data.user.id, full_name: fullName || null })
    await supabase.from('financial_settings').upsert({ user_id: data.user.id })
  }

  if (!data.session) redirect('/login?message=Check%20your%20email%20to%20confirm%20your%20Ezza%20account')
  redirect('/')
}

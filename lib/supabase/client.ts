import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = 'https://saaeozlhkysaugobkaat.supabase.co'
const supabasePublishableKey = 'sb_publishable_rrK0rqXJrnejxWTs7Eas6A_qFXEO3Tk'

export function createClient() {
  return createBrowserClient(
    supabaseUrl,
    supabasePublishableKey
  )
}

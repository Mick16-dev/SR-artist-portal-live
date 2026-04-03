import { createClient } from '@supabase/supabase-js'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { PortalClient } from '@/components/PortalClient'
import { InvalidToken } from '@/components/InvalidToken'
import { ExpiredToken } from '@/components/ExpiredToken'
import { Welcome } from '@/components/Welcome'

// Server-side Supabase client for secure data fetching
function getSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables are missing')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  // No token in URL - Show Landing Page
  if (!token) {
    return <Welcome />
  }

  const supabase = getSupabase()

  // Step 1: Validate token — check if it exists at all
  const { data: tokenMaterial, error: tokenError } = await supabase
    .from('materials')
    .select('*')
    .eq('portal_token', token)
    .limit(1)
    .single()

  // Token not found at all
  if (tokenError || !tokenMaterial) {
    return <InvalidToken />
  }

  // Step 2: Check expiry
  if (tokenMaterial.expires_at && new Date(tokenMaterial.expires_at) < new Date()) {
    return <ExpiredToken expiresAt={tokenMaterial.expires_at} />
  }

  const showId = tokenMaterial.show_id
  const artistId = tokenMaterial.artist_id

  // Step 3: Fetch ALL materials for this show
  const { data: materials, error: matsError } = await supabase
    .from('materials')
    .select('*')
    .eq('show_id', showId)
    .order('deadline', { ascending: true })

  // Step 4: Fetch show details
  const { data: show, error: showError } = await supabase
    .from('shows')
    .select('*')
    .eq('id', showId)
    .single()

  // Step 5: Fetch artist details
  const { data: artist, error: artistError } = await supabase
    .from('artists')
    .select('*')
    .eq('id', artistId)
    .single()

  if (matsError || showError || artistError || !show || !artist || !materials) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-gray-600 text-lg font-medium">Unable to load your documents.</p>
          <p className="text-gray-400 mt-2">Please refresh the page or contact your promoter.</p>
        </div>
      </div>
    )
  }

  return (
    <PortalClient
      show={show}
      artist={artist}
      materials={materials}
      initialToken={token}
    />
  )
}

import { createClient } from '@supabase/supabase-js'
import { PortalClient } from '@/components/PortalClient'
import { InvalidToken } from '@/components/InvalidToken'
import { ExpiredToken } from '@/components/ExpiredToken'
import { Welcome } from '@/components/Welcome'

// Server-side Supabase client for SSR
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string, preview?: string }>
}) {
  const { token, preview } = await searchParams
  const cleanToken = token?.trim()

  // 1. Check if token or preview is present
  if (!cleanToken && preview !== 'true') {
    return <Welcome />
  }

  // Preview Mode for immediate verification of the "Backbone" UI
  if (preview === 'true') {
     const mockShow = { venue_name: "PS-PROMOTION ARENA", city: "London", show_date: "2026-06-15", show_time: "20:00", promoter_name: "PS-promotion Global", promoter_email: "production@ps-promotion.com" }
     const mockArtist = { name: "Sample Artist" }
     const mockMaterials = [
       { id: "1", item_name: "Technical Rider", status: "pending", deadline: "2026-06-01", portal_token: "mock-1" },
       { id: "2", item_name: "Press Kit", status: "submitted", deadline: "2026-05-15", portal_token: "mock-2", file_url: "#", submitted_at: "2026-05-10" },
       { id: "3", item_name: "Contract", status: "pending", deadline: "2026-04-01", portal_token: "mock-3" } // Overdue
     ]
     return <PortalClient show={mockShow as any} artist={mockArtist as any} materials={mockMaterials as any} token="preview-mode" />
  }

  const supabase = getSupabase()

  let showId = ''
  let artistId = ''
  let materialFromToken = null

  // 2. Validate token (Material lookup first)
  const { data: tokenMaterial } = await supabase
    .from('materials')
    .select('*')
    .eq('portal_token', cleanToken)
    .maybeSingle()

  if (tokenMaterial) {
    showId = tokenMaterial.show_id
    artistId = tokenMaterial.artist_id
    materialFromToken = tokenMaterial
  } else {
    // 3. Fallback: Check if the token is a Show ID directly
    const { data: showFromId } = await supabase
      .from('shows')
      .select('*')
      .eq('id', cleanToken)
      .maybeSingle()

    if (showFromId) {
      showId = showFromId.id
      artistId = showFromId.artist_id
    }
  }

  // 4. Handle Invalid Token state
  if (!showId) {
    return <InvalidToken />
  }

  // 5. Success Flow - Fetch all materials, show, and artist
  const [{ data: materials }, { data: show }, { data: artist }] = await Promise.all([
    supabase.from('materials').select('*').eq('show_id', showId).order('deadline', { ascending: true }),
    supabase.from('shows').select('*').eq('id', showId).maybeSingle(),
    supabase.from('artists').select('*').eq('id', artistId).maybeSingle()
  ])

  // Safety check for critical data
  if (!show || !artist || !materials) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-10 text-center">
        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
           <span className="text-sm font-black text-white/20 tracking-tighter italic uppercase group-hover:text-red-500">PS-promotion</span>
          Disconnected. Please refresh your browser.
        </p>
      </div>
    )
  }

  return (
    <PortalClient
      show={show}
      artist={artist}
      materials={materials}
      token={cleanToken ?? 'preview-mode'}
    />
  )
}

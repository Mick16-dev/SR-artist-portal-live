import { createClient } from '@supabase/supabase-js'
import { PortalClient } from '@/components/PortalClient'
import { InvalidToken } from '@/components/InvalidToken'
import { Welcome } from '@/components/Welcome'

// Server-side Supabase client for SSR
// Uses SERVICE ROLE key (bypasses RLS) - safe because this runs server-side only
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Prefer service role key to bypass RLS; fall back to anon key
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string, preview?: string }>
}) {
  const { token, preview } = await searchParams
  const cleanToken = token?.trim()
  const supabase = getSupabase()

  let showId = ''
  let artistId = ''

  if (!supabase && preview !== 'true') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-10 text-center">
        <div className="max-w-md space-y-4">
          <p className="text-red-400 font-bold uppercase tracking-widest text-sm border border-red-500/30 bg-red-500/10 p-4 rounded-xl">
            System Offline: Missing Production Environment Variables.
          </p>
          <p className="text-slate-400 text-xs">Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY inside Vercel or locally.</p>
        </div>
      </div>
    )
  }

  // 1. Check if token or preview is present
  if (!cleanToken && preview !== 'true' && supabase) {
    // PUBLIC FALLBACK: If no token provided, try to fetch the most recent show as a "public" preview
    const { data: latestShow } = await supabase!
      .from('shows')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestShow) {
      showId = latestShow.id
      artistId = latestShow.artist_id
      console.log('Public view triggered: showing latest show', showId)
    } else {
      // No shows in DB, show mock/welcome instead
      return <Welcome />
    }
  } else if (preview === 'true') {
    // Preview Mode for immediate verification of the "Backbone" UI
     const mockShow = { 
       venue_name: "PS-PROMOTION ARENA", 
       city: "London", 
       show_date: "2026-06-15", 
       show_time: "20:00", 
       promoter_name: "PS-promotion Global", 
       promoter_email: "production@ps-promotion.com" 
     }
     const mockArtist = { name: "Sample Artist" }
     const mockMaterials = [
       { id: "1", item_name: "Technical Rider", status: "pending" as const, deadline: "2026-06-01", portal_token: "mock-1" },
       { id: "2", item_name: "Press Kit", status: "submitted" as const, deadline: "2026-05-15", portal_token: "mock-2", file_url: "#", submitted_at: "2026-05-10" },
       { id: "3", item_name: "Contract", status: "pending" as const, deadline: "2026-04-01", portal_token: "mock-3" } // Overdue
     ]
     return <PortalClient show={mockShow} artist={mockArtist} materials={mockMaterials} token="preview-mode" showId="mock-id" />
  } else {
    // MULTI-LAYER TOKEN LOOKUP
    // The URL token might be a portal_token, show_id (UUID), or Material token
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanToken || '')
    
    // Check 'shows' table for a match in portal_token, show_id, or id (if UUID)
    const { data: showMatch } = await supabase!
      .from('shows')
      .select('id, show_id, artist_id')
      .or(`portal_token.eq.${cleanToken},show_id.eq.${cleanToken}${isUuid ? `,id.eq.${cleanToken}` : ''}`)
      .maybeSingle()

    if (showMatch) {
      showId = showMatch.id || showMatch.show_id
      artistId = showMatch.artist_id
    }

    // Layer D: Check materials.portal_token
    if (!showId) {
      const { data: materialLink } = await supabase!
        .from('materials')
        .select('show_id, artist_id')
        .eq('portal_token', cleanToken)
        .limit(1)
        .maybeSingle()

      if (materialLink) {
        showId = materialLink.show_id
        artistId = materialLink.artist_id
      }
    }
  }

  // 4. Handle Invalid Token state - show diagnostic info
  if (!showId) {
    return <InvalidToken receivedToken={cleanToken || 'none'} />
  }

  // 5. Success Flow - Fetch all data
  // Try both id and show_id column to cover different Supabase schema setups
  const [materialsById, materialsByShowId, showById, showByShowId, artist] = await Promise.all([
    supabase!.from('materials').select('*').eq('show_id', showId).order('deadline', { ascending: true }),
    supabase!.from('materials').select('*').eq('show_id', cleanToken).order('deadline', { ascending: true }),
    supabase!.from('shows').select('*').eq('id', showId).maybeSingle(),
    supabase!.from('shows').select('*').eq('show_id', showId).maybeSingle(),
    supabase!.from('artists').select('*').eq('id', artistId).maybeSingle()
  ])

  const show = showById.data || showByShowId.data
  const materials = (materialsById.data?.length ? materialsById.data : materialsByShowId.data) || []

  // Safety check
  if (!show) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-10 text-center space-y-6">
        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
           <span className="text-sm font-black text-slate-900 tracking-tighter italic uppercase block mb-2">PS-promotion</span>
          Data Conflict
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-xs text-left font-mono space-y-2 w-full max-w-md">
           <p className="text-red-600 font-bold uppercase">Debug Info:</p>
           <p className="text-slate-600">showId resolved to: <strong>{showId}</strong></p>
           <p className="text-slate-600">Token received: <strong>{cleanToken}</strong></p>
           <p className="text-slate-500 mt-2">The show row could not be fetched. Check Supabase → shows table for this ID and verify the correct column name (id vs show_id).</p>
        </div>
      </div>
    )
  }

  // Graceful Fallbacks for missing relational data
  const safeArtist = artist.data || { name: 'Artist TBA' }
  const safeMaterials = materials || []

  // 6. Return the Client Component
  // Distinguish between 'preview-mode' (for mock data) and 'public-mode' (for real data fallback)
  const uiToken = cleanToken ?? (preview === 'true' ? 'preview-mode' : 'public-mode')

  return (
    <PortalClient
      show={show}
      artist={safeArtist}
      materials={safeMaterials}
      token={uiToken}
      showId={showId}
    />
  )
}

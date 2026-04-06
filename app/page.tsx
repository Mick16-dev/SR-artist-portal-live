import { createClient } from '@supabase/supabase-js'
import { PortalClient } from '@/components/PortalClient'
import { InvalidToken } from '@/components/InvalidToken'
import { Welcome } from '@/components/Welcome'

// Server-side Supabase client for SSR
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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
    // 2. Validate token - MULTI-LAYER LOOKUP
    // Strategy: 
    // A. Check the 'portal_token' column in 'shows' (Standardized Token)
    // B. If not found and is UUID, check 'id' column in 'shows' (Legacy/Fallback)
    // C. If still not found, check 'portal_token' in 'materials'

    const { data: showLink } = await supabase!
      .from('shows')
      .select('id, artist_id')
      .eq('portal_token', cleanToken)
      .maybeSingle()

    if (showLink) {
      showId = showLink.id
      artistId = showLink.artist_id
    } else {
      // Not in show portal_token, check if it's a UUID for the main show ID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanToken || '')
      if (isUuid) {
        const { data: rawShow } = await supabase!
          .from('shows')
          .select('id, artist_id')
          .eq('id', cleanToken)
          .maybeSingle()
        
        if (rawShow) {
          showId = rawShow.id
          artistId = rawShow.artist_id
        }
      }

      // Still no show? Check materials
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
  }

  // 4. Handle Invalid Token state
  if (!showId) {
    return <InvalidToken />
  }

  // 5. Success Flow - Fetch all materials, show, and artist
  const [{ data: materials }, { data: show }, { data: artist }] = await Promise.all([
    supabase!.from('materials').select('*').eq('show_id', showId).order('deadline', { ascending: true }),
    supabase!.from('shows').select('*').eq('id', showId).maybeSingle(),
    supabase!.from('artists').select('*').eq('id', artistId).maybeSingle()
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

  // 6. Return the Client Component
  // Distinguish between 'preview-mode' (for mock data) and 'public-mode' (for real data fallback)
  const uiToken = cleanToken ?? (preview === 'true' ? 'preview-mode' : 'public-mode')

  return (
    <PortalClient
      show={show}
      artist={artist}
      materials={materials}
      token={uiToken}
      showId={showId}
    />
  )
}

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
  searchParams: Promise<{ token?: string, portal_token?: string, show_token?: string, t?: string, preview?: string }>
}) {
  const { token, portal_token, show_token, t, preview } = await searchParams
  const rawToken = token ?? portal_token ?? show_token ?? t
  const cleanToken = rawToken ? decodeURIComponent(rawToken).trim().replace(/^["']|["']$/g, '') : undefined
  const supabase = getSupabase()

  let showId = ''
  let showRecord: Record<string, any> | null = null

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
      showId = String(latestShow.id || '').trim()
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
    // Token resolution that matches your schema:
    // materials.portal_token -> materials.show_id -> shows.id
    const { data: materialLinks } = await supabase!
      .from('materials')
      .select('*')
      .eq('portal_token', cleanToken)
      .limit(50)

    if (materialLinks?.length) {
      const showCandidates = Array.from(new Set(materialLinks.map((m) => String(m.show_id || '').trim()).filter(Boolean)))

      if (showCandidates.length) {
        const { data: matchedShows } = await supabase!
          .from('shows')
          .select('*')
          .in('id', showCandidates)

        if (matchedShows?.length) {
          const matchedIds = new Set(matchedShows.map((s) => String(s.id || '').trim()))
          const firstValid = materialLinks.find((m) => matchedIds.has(String(m.show_id || '').trim()))

          if (firstValid) {
            showId = String(firstValid.show_id || '').trim()
            showRecord = matchedShows.find((s) => String(s.id || '').trim() === showId) || null
          }
        }
      }
    }

    // Fallback: token itself is directly a shows.id
    if (!showId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanToken || '')
      if (isUuid) {
        const { data: byId } = await supabase!
          .from('shows')
          .select('*')
          .eq('id', cleanToken)
          .maybeSingle()

        if (byId) {
          showId = String(byId.id || '').trim()
          showRecord = byId
        }
      }
    }
  }

  // 4. Continue even without showId so token-based material fallback can still recover access.
  // 5. Success Flow - Fetch all data
  const isResolvedShowIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(showId || '')
  const [showById] = await Promise.all([
    showRecord
      ? Promise.resolve({ data: showRecord, error: null })
      : isResolvedShowIdUuid
        ? supabase!.from('shows').select('*').eq('id', showId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
  ])

  const show = showRecord || showById.data

  const materialShowKeys = [
    showId,
  ].filter(Boolean) as string[]

  let materials: any[] = []
  if (materialShowKeys.length) {
    const { data: materialsData } = await supabase!
      .from('materials')
      .select('*')
      .in('show_id', materialShowKeys)
      .order('deadline', { ascending: true })

    materials = materialsData || []
  }

  // Ensure token links always surface assigned document rows even if show_id linkage is inconsistent.
  if (cleanToken) {
    const { data: materialsByToken } = await supabase!
      .from('materials')
      .select('*')
      .eq('portal_token', cleanToken)
      .order('deadline', { ascending: true })

    if (materialsByToken?.length) {
      const merged = new Map<string, any>()
      for (const row of materials) merged.set(String(row.id), row)
      for (const row of materialsByToken) merged.set(String(row.id), row)
      materials = Array.from(merged.values())
    }
  }

  // Safety check
  if (!show && materials.length === 0) {
    return <InvalidToken receivedToken={cleanToken || 'none'} />
  }

  // Graceful Fallbacks for missing relational data
  const normalizedShow = show
    ? {
        ...show,
        venue_name: show.venue_name || show.venue || 'Venue TBA',
        promoter_name: show.promoter_name || 'Promoter Team',
        promoter_email: show.promoter_email || show.artist_email || '',
      }
    : {
        venue_name: 'Show Details Pending Sync',
        city: 'TBA',
        show_date: '',
        show_time: 'TBA',
        promoter_name: 'Promoter Team',
        promoter_email: '',
      }

  const safeArtist = { name: show?.artist_name || 'Artist TBA' }
  const safeMaterials = materials || []

  // 6. Return the Client Component
  // Distinguish between 'preview-mode' (for mock data) and 'public-mode' (for real data fallback)
  const uiToken = cleanToken ?? (preview === 'true' ? 'preview-mode' : 'public-mode')

  return (
    <PortalClient
      show={normalizedShow}
      artist={safeArtist}
      materials={safeMaterials}
      token={uiToken}
      showId={showId}
    />
  )
}

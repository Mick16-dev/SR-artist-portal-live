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

function normalizeKey(value: unknown) {
  return String(value || '').trim().replace(/^["']|["']$/g, '')
}

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string, portal_token?: string, show_token?: string, t?: string, show_id?: string, sid?: string, preview?: string }>
}) {
  const { token, portal_token, show_token, t, show_id, sid, preview } = await searchParams
  const rawToken = token ?? portal_token ?? show_token ?? t
  const cleanToken = rawToken ? normalizeKey(decodeURIComponent(rawToken)) : undefined
  const showHintId = normalizeKey(show_id ?? sid)
  const supabase = getSupabase()

  let showId = ''
  let showRecord: Record<string, any> | null = null
  let forceInvalidToken = false

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
      showId = normalizeKey(latestShow.id)
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
    // 2. MULTI-LAYER TOKEN LOOKUP
    // Priority 1: Check for explicit show identifiers from URL (show_id or sid).
    if (showHintId) {
      const { data: hintedShow } = await supabase!
        .from('shows')
        .select('*')
        .eq('id', showHintId)
        .maybeSingle()

      if (hintedShow) {
        showId = normalizeKey(hintedShow.id)
        showRecord = hintedShow
      }
    }

    // Priority 2: Consolidated Show Lookup (portal_token OR show_id OR id).
    // Using the requested .or() filter to handle multiple token types in one efficient query.
    if (!showId && cleanToken) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanToken || '')
      const { data: showMatch } = await supabase!
        .from('shows')
        .select('*')
        .or(`portal_token.eq.${cleanToken},show_id.eq.${cleanToken}${isUuid ? `,id.eq.${cleanToken}` : ''}`)
        .maybeSingle()

      if (showMatch) {
        showId = normalizeKey(showMatch.id)
        showRecord = showMatch
      }
    }

    // Priority 3: Check for material-level tokens if not found in shows.
    if (!showId && cleanToken) {
      const { data: materialLinks } = await supabase!
        .from('materials')
        .select('*')
        .eq('portal_token', cleanToken)
        .order('created_at', { ascending: false })
        .limit(200)

      if (materialLinks?.length) {
        const distinctShowIds = Array.from(
          new Set(materialLinks.map((m) => normalizeKey(m.show_id)).filter(Boolean))
        )

        if (showHintId) {
          const strictLinks = materialLinks.filter((m) => normalizeKey(m.show_id) === showHintId)
          if (!strictLinks.length) {
            forceInvalidToken = true
          } else if (showRecord) {
             showId = showHintId
          }
        } else if (distinctShowIds.length === 1) {
          const onlyShowId = distinctShowIds[0]
          const { data: singleShow } = await supabase!
            .from('shows')
            .select('*')
            .eq('id', onlyShowId)
            .maybeSingle()

          if (singleShow) {
            showId = onlyShowId
            showRecord = singleShow
          }
        } else if (distinctShowIds.length > 1) {
          forceInvalidToken = true // Ambiguous token reuse -> refuse to guess.
        }
      }
    }

    // Priority 4: Final fallback - check if cleanToken is itself a show_id in the materials table.
    if (!showId && cleanToken) {
      const { data: materialsByShowId } = await supabase!
        .from('materials')
        .select('*')
        .eq('show_id', cleanToken)
        .limit(1)

      if (materialsByShowId?.length) {
        showId = normalizeKey(cleanToken)
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
      const scopedByShow = showHintId
        ? materialsByToken.filter((row) => normalizeKey(row.show_id) === showHintId)
        : showId
          ? materialsByToken.filter((row) => normalizeKey(row.show_id) === showId)
          : materialsByToken

      const tokenMaterials = scopedByShow.length ? scopedByShow : materialsByToken
      const merged = new Map<string, any>()
      for (const row of materials) merged.set(normalizeKey(row.id), row)
      for (const row of tokenMaterials) merged.set(normalizeKey(row.id), row)
      materials = Array.from(merged.values())
    }
  }

  // Final consistency pass: if we now know a show_id, always fetch the full required docs for that show.
  if (showId) {
    const { data: fullShowMaterials } = await supabase!
      .from('materials')
      .select('*')
      .eq('show_id', showId)
      .order('deadline', { ascending: true })

    if (fullShowMaterials?.length) {
      materials = fullShowMaterials
    }
  }

  // If shows lookup failed, build a best-effort show model from material fields.
  const materialFallback = materials[0] || null

  // Safety check
  if (forceInvalidToken || (!show && materials.length === 0)) {
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
        venue_name: materialFallback?.venue_name || materialFallback?.venue || 'Show Details Pending Sync',
        city: materialFallback?.city || 'TBA',
        show_date: materialFallback?.show_date || '',
        show_time: materialFallback?.show_time || 'TBA',
        promoter_name: materialFallback?.promoter_name || 'Promoter Team',
        promoter_email: materialFallback?.promoter_email || materialFallback?.artist_email || '',
      }

  const materialArtistName = materials.find((m) => typeof m.artist_name === 'string' && m.artist_name.trim())?.artist_name
  const safeArtist = { name: show?.artist_name || materialArtistName || materialFallback?.artist_name || 'Artist TBA' }
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

'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapPin, Calendar, Clock, CheckCircle2, Mail } from 'lucide-react'
import { format, isPast } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { DocumentCard } from '@/components/DocumentCard'
import confetti from 'canvas-confetti'

interface Show {
  id: string
  artist_name: string
  venue: string
  city: string
  show_date: string
  show_time: string | null
  status: string
}

interface Artist {
  id: string
  name: string
  email: string | null
}

interface Material {
  id: string
  show_id: string
  artist_id: string
  item_name: string
  deadline: string
  status: string
  portal_token: string
  file_url: string | null
  submitted_at: string | null
  expires_at: string | null
}

interface PortalClientProps {
  show: Show
  artist: Artist
  materials: Material[]
  initialToken: string
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
      </div>
      <span className="text-xl font-bold text-gray-900">ShowReady</span>
    </div>
  )
}

function ProgressBar({ submitted, total }: { submitted: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((submitted / total) * 100)

  const barColor =
    pct === 100 ? 'bg-emerald-500' :
    pct >= 80 ? 'bg-indigo-600' :
    pct >= 41 ? 'bg-amber-500' :
    'bg-red-500'

  const labelColor =
    pct === 100 ? 'text-emerald-600' :
    pct >= 80 ? 'text-indigo-600' :
    pct >= 41 ? 'text-amber-600' :
    'text-red-500'

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">
          {submitted} of {total} documents submitted
        </span>
        <span className={`text-sm font-bold ${labelColor}`}>{pct}%</span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function PortalClient({ show, artist, materials: initialMaterials, initialToken }: PortalClientProps) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials)
  const [confettiFired, setConfettiFired] = useState(false)
  const [notificationSent, setNotificationSent] = useState(false)

  const isShowPast = show.show_date ? isPast(new Date(show.show_date)) : false
  const submittedCount = materials.filter(m => m.status === 'submitted' || m.status === 'delivered').length
  const totalCount = materials.length
  const allDone = totalCount > 0 && submittedCount === totalCount

  // Fire confetti and notify promoter once when all done
  useEffect(() => {
    if (allDone && !confettiFired) {
      setConfettiFired(true)
      
      // 1. Celebration
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#4f46e5', '#10b981', '#f59e0b', '#818cf8'],
      })

      // 2. Final Webhook (Show Ready)
      if (!notificationSent) {
        const triggerReady = async () => {
          const webhookUrl = process.env.NEXT_PUBLIC_N8N_READY_WEBHOOK
          if (!webhookUrl) return

          try {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'show_ready',
                show_id: show.id,
                artist_id: artist.id,
                artist_name: artist.name,
                venue_name: show.venue,
                submission_date: new Date().toISOString(),
              }),
            })
            setNotificationSent(true)
          } catch (err) {
            console.error('Failed to notify promoter:', err)
          }
        }
        triggerReady()
      }
    }
  }, [allDone, confettiFired, notificationSent, show.id, show.venue, artist.id, artist.name])

  // Re-fetch materials from Supabase after upload
  const refreshMaterials = useCallback(async () => {
    const { data } = await supabase
      .from('materials')
      .select('*')
      .eq('show_id', show.id)
      .order('deadline', { ascending: true })
    if (data) setMaterials(data)
  }, [show.id])

  const showDateFormatted = show.show_date
    ? format(new Date(show.show_date), 'EEEE, MMMM d yyyy')
    : null

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Logo />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 pb-20 space-y-8">
        {/* Hero Section */}
        <div className="animate-slide-up">
          {allDone ? (
            <>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-2">
                🎉 You&apos;re all set, {artist.name}!
              </h1>
              <p className="text-gray-500 text-lg leading-relaxed">
                All documents have been submitted for your show at {show.venue}. Your promoter has been notified.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-2">
                Hi {artist.name},
              </h1>
              <p className="text-gray-500 text-lg leading-relaxed">
                Here&apos;s what your promoter needs from you for your show at {show.venue}.
              </p>
            </>
          )}

          {/* Show detail pills */}
          <div className="flex flex-wrap gap-3 mt-5">
            {show.venue && show.city && (
              <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">
                <MapPin size={15} className="text-indigo-500" />
                {show.venue}, {show.city}
              </div>
            )}
            {showDateFormatted && (
              <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">
                <Calendar size={15} className="text-indigo-500" />
                {showDateFormatted}
              </div>
            )}
            {show.show_time && (
              <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm">
                <Clock size={15} className="text-indigo-500" />
                {show.show_time}
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-slide-up">
          {allDone ? (
            <div className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-emerald-500 flex-shrink-0" />
              <span className="text-emerald-700 font-bold text-base">
                All documents submitted. You&apos;re all set!
              </span>
            </div>
          ) : (
            <ProgressBar submitted={submittedCount} total={totalCount} />
          )}
        </div>

        {/* Documents Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Documents</h2>
          <div className="space-y-4">
            {materials.map((material) => (
              <DocumentCard
                key={material.id}
                material={material}
                isShowPast={isShowPast}
                onUploadSuccess={refreshMaterials}
              />
            ))}
            {materials.length === 0 && (
              <div className="text-center py-12 text-gray-400 font-medium">
                No documents are required for this show.
              </div>
            )}
          </div>
        </div>

        {/* Re-upload note when all done */}
        {allDone && (
          <p className="text-sm text-gray-400 text-center font-medium">
            Need to update a document? You can re-upload any file above.
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-6 mt-8">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-2">
          <p className="text-sm text-gray-400 font-medium">Powered by ShowReady</p>
          {artist.email && (
            <a
              href={`mailto:${artist.email}`}
              className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
            >
              <Mail size={14} />
              Having trouble? Contact your promoter
            </a>
          )}
        </div>
      </footer>
    </div>
  )
}

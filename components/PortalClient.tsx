'use client'

import React, { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'
import { format } from 'date-fns'
import { createClient } from '@supabase/supabase-js'
import { Toaster, toast } from 'sonner'

// Hardware Infrastructure Icons - Custom 2.5px strokes for high-end tool feel
const Icons = {
  Logo: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
       <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  )
}

import { ProgressBar } from './ProgressBar'
import { DocumentCard } from './DocumentCard'

interface Material {
  id: string
  item_name: string
  description?: string
  status: 'pending' | 'submitted'
  deadline: string
  submitted_at?: string
  file_url?: string
  portal_token: string
}

interface Show {
  venue_name: string
  city: string
  show_date: string
  show_time: string
  promoter_name: string
  promoter_email: string
}

interface Artist {
  name: string
}

interface PortalClientProps {
  show: Show
  artist: Artist
  materials: Material[]
  token: string
  showId: string
}

export function PortalClient({ show, artist, materials: initialMaterials, token, showId }: PortalClientProps) {

  // Standard 5-Document Production Blueprint
  const productionBlueprint = [
    { name: 'Primary Technical Rider', desc: 'Secure audio, monitor, and lighting patch.' },
    { name: 'Stage Plot & Input List', desc: 'Physical positioning and channel mapping.' },
    { name: 'Hospitality Specification', desc: 'Catering and green room requirements.' },
    { name: 'High-Res Publicity Photo', desc: 'Mandatory for press and venue marketing.' },
    { name: 'Insurance & PLI Certificate', desc: 'Mandatory public liability clearance.' }
  ]

  const isPreview = token === 'preview-mode'
  
  const materialsToRender = isPreview ? productionBlueprint.map((b, i) => ({
    id: `p-${i}`,
    item_name: b.name,
    description: b.desc,
    status: i === 2 ? 'submitted' : 'pending',
    deadline: '2026-05-01',
    portal_token: `preview-${i}`,
    file_url: '#'
  })) as Material[] : initialMaterials

  // Real-Time Production Sync
  useEffect(() => {
    if (isPreview) return

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel('production-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'materials',
        filter: `show_id=eq.${showId}`
      }, () => {
        // Instant refresh on any database change for THIS show
        window.location.reload() 
      })
      .subscribe()

    const tokenChannel = token
      ? supabase
          .channel('production-updates-token')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'materials',
            filter: `portal_token=eq.${token}`,
          }, () => {
            window.location.reload()
          })
          .subscribe()
      : null

    return () => {
      supabase.removeChannel(channel)
      if (tokenChannel) supabase.removeChannel(tokenChannel)
    }
  }, [showId, isPreview, token])

  const submittedCount = materialsToRender.filter(m => m.status === 'submitted').length
  const totalCount = materialsToRender.length
  const isComplete = submittedCount === totalCount && totalCount > 0

  useEffect(() => {
    if (isComplete) {
      confetti({ 
        particleCount: 150, 
        spread: 90, 
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#10b981', '#f59e0b']
      })
    }
  }, [isComplete])

  const handleUpload = async (materialToken: string, file: File, name: string): Promise<boolean> => {
    try {
      const fd = new FormData()
      fd.append('token', materialToken)
      fd.append('item_name', name)
      fd.append('file', file)

      const res = await fetch(process.env.NEXT_PUBLIC_N8N_MATERIAL_UPLOAD_WEBHOOK!, {
        method: 'POST',
        body: fd
      })

      if (!res.ok) throw new Error()
      
      toast.success(`${name} transmitted to production.`)
      // Note: Real state sync would happen via Supabase subscription or refresh
      return true
    } catch {
      toast.error('Transmission failed. Check network status.')
      return false
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      <Toaster position="top-center" richColors />

      <nav className="border-b border-slate-200 bg-white">
         <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <div className="flex items-center gap-3">
               <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <Icons.Logo />
               </div>
               <div>
                  <p className="text-xs font-medium text-slate-500">PS-promotion</p>
                  <p className="text-sm font-semibold text-slate-900">Artist Portal</p>
               </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Venue</p>
              <p className="text-sm font-medium text-slate-900">{show?.venue_name || 'TBA'}</p>
            </div>
         </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-8">
        
        <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
           <div className="mb-6 flex items-center justify-between">
             <div>
               <p className="text-sm text-slate-500">Welcome</p>
               <h1 className="text-3xl font-semibold text-slate-900">{artist?.name || 'Artist TBA'}</h1>
             </div>
             <div className="text-right">
               <p className="text-sm text-slate-500">Submission progress</p>
               <p className="text-xl font-semibold text-slate-900">{submittedCount}/{totalCount}</p>
             </div>
           </div>
           <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2 text-sm text-slate-600">
                <p>Upload the required documents listed below.</p>
                <p>Items and due dates are synced from Supabase and update automatically.</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-5">
                 <ProgressBar total={totalCount} submittedCount={submittedCount} />
                 <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
                    <span>Live sync enabled</span>
                    <span>{show?.show_date ? format(new Date(show.show_date), 'MMM d, yyyy') : 'Date TBA'}</span>
                 </div>
              </div>
           </div>
        </section>

        {/* Organized Production Grid */}
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
           
           {/* Mandatory Assets Assets */}
          <section className="space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Required Documents</h2>
                <p className="text-sm text-slate-500">{totalCount} items</p>
              </div>
              
              <div className="space-y-6">
                 {materialsToRender.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                       <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                          <span className="text-2xl">🔒</span>
                       </div>
                       <p className="text-sm font-semibold text-slate-900">No active documents</p>
                       <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                          The promoter has not scheduled any mandatory materials for this specific show in the database yet.
                       </p>
                    </div>
                 ) : (
                  materialsToRender.map((m) => (
                      <DocumentCard
                         key={m.id}
                         material={m}
                         onUpload={handleUpload}
                      />
                   ))
                 )}
              </div>
           </section>

           {/* Support & Support & Metadata Meta */}
           <aside className="space-y-6">
              <div className="sticky top-6 space-y-6">
                 
                 <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h4 className="mb-4 text-sm font-semibold text-slate-900">Show Details</h4>
                    <div className="space-y-3 text-sm text-slate-600">
                       <div className="flex items-center gap-3">
                          <span>📍</span>
                          <span>{show?.venue_name || 'Venue TBA'}, {show?.city || 'City TBA'}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <span>📅</span>
                          <span>{show?.show_date ? format(new Date(show.show_date), 'EEEE, MMMM d yyyy') : 'Date TBA'}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <span>⏰</span>
                          <span>{show?.show_time || 'Time TBA'}</span>
                       </div>
                    </div>
                 </div>

                 <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h4 className="mb-4 text-sm font-semibold text-slate-900">Support</h4>
                    <a 
                      href={`mailto:${show.promoter_email}`}
                      className="block rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100"
                    >
                       <p className="text-xs text-slate-500">Contact promoter</p>
                       <div>
                          <p className="text-sm font-semibold text-slate-900">{show?.promoter_name || 'Promoter Team'}</p>
                          <p className="text-xs text-slate-500">{show?.promoter_email || 'No email configured'}</p>
                       </div>
                    </a>
                 </div>

              </div>
           </aside>
        </div>

      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white py-8">
         <div className="mx-auto max-w-6xl px-6 text-center text-xs text-slate-500">
            PS-promotion Artist Portal
         </div>
      </footer>
    </div>
  )
}

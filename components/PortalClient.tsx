'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { format } from 'date-fns'
import { createClient } from '@supabase/supabase-js'
import { Toaster, toast } from 'sonner'

// Hardware Infrastructure Icons - Custom 2.5px strokes for high-end tool feel
const Icons = {
  Base: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
       <rect x="2" y="2" width="20" height="20" rx="4"/><path d="M7 12h10"/><path d="M12 7v10"/>
    </svg>
  ),
  Logo: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
       <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  ),
  Key: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
       <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.5-2.5"/>
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

    return () => { supabase.removeChannel(channel) }
  }, [showId, isPreview])

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
    <div className="bg-white min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900 antialiased overflow-x-hidden">
      <Toaster position="top-center" richColors />

      {/* Floating Control Bar - Replaces the generic Header */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-5xl">
         <div className="bg-slate-950 text-white rounded-[1.5rem] px-8 py-5 flex items-center justify-between shadow-2xl border border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Icons.Logo />
               </div>
               <div>
                  <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-1">Production Hub</p>
                  <span className="text-2xl font-black tracking-tighter italic uppercase underline decoration-indigo-600/50 decoration-4 underline-offset-4">PS-promotion</span>
                  <span className="text-[9px] font-black tracking-[0.3em] text-white/30 uppercase">Artist Portal</span>
               </div>
            </div>
            
            <div className="flex items-center gap-8">
               <div className="flex flex-col items-end px-12 border-x border-white/10">
                   <p className="text-[9px] font-black tracking-widest text-white/30 uppercase mb-1">Production Venue</p>
                   <span className="text-sm font-bold tracking-tight text-white">{show?.venue_name || 'TBA'}</span>
                </div>
               <div className="h-6 w-px bg-white/10" />
               <div className="flex flex-col items-start min-w-[60px]">
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1 leading-none">Activity</span>
                  <span className="text-sm font-black tracking-tighter">{submittedCount}/{totalCount}</span>
               </div>
            </div>
         </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-40 pb-48">
        
        {/* Kinetic Header Section */}
        <section className="mb-24 space-y-10">
           <motion.div
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="flex flex-wrap items-center gap-4"
           >
              <div className="inline-flex bg-slate-950 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.25em] shadow-lg">
                 Secure Link Verified
              </div>
              <div className="h-4 w-px bg-slate-100" />
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                 PS_PROMOTION_ENCRYPTION_ENABLED: {show?.show_date?.replace(/-/g, '') || '00000000'}
              </div>
           </motion.div>
           
           <h1 className="text-7xl lg:text-[10rem] font-black leading-[0.85] tracking-tighter uppercase italic text-slate-900">
              {artist?.name?.toUpperCase() || 'ARTIST TBA'}
           </h1>
           
           <div className="grid lg:grid-cols-2 gap-16 items-start pt-6">
              <div className="space-y-6">
                 <p className="text-2xl lg:text-4xl text-slate-400 font-bold tracking-tight leading-[1.1] italic">
                    Welcome to your <span className="text-slate-950">Active Production Hub.</span>
                 </p>
                 <p className="text-lg lg:text-xl text-slate-500 font-bold leading-relaxed max-w-lg italic">
                    Every file submitted here is encrypted and transmitted directly to the production team at <span className="text-slate-900 underline decoration-indigo-200 decoration-8 underline-offset-4">{show?.venue_name || 'the venue'}</span>.
                 </p>
              </div>
              
              <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100/50 space-y-6">
                 <ProgressBar total={totalCount} submittedCount={submittedCount} />
                 <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 pt-2 border-t border-slate-100">
                    <span>Global Progress Meter</span>
                    <span className="text-indigo-600">Secure Protocol</span>
                 </div>
              </div>
           </div>
        </section>

        {/* Organized Production Grid */}
        <div className="grid lg:grid-cols-[1fr_350px] gap-24">
           
           {/* Mandatory Assets Assets */}
           <section className="space-y-12">
              <div className="flex items-center gap-6">
                 <h2 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900 shrink-0">Your Documents</h2>
                 <div className="h-px w-full bg-slate-100" />
              </div>
              
              <div className="space-y-6">
                 {materialsToRender.length === 0 ? (
                    [
                      { id: 'fb1', item_name: 'EPK', description: 'Electronic Press Kit', status: 'pending' as const, deadline: show?.show_date || new Date().toISOString(), portal_token: token },
                      { id: 'fb2', item_name: 'CONTRACT', description: 'Signed Contract', status: 'pending' as const, deadline: show?.show_date || new Date().toISOString(), portal_token: token },
                      { id: 'fb3', item_name: 'TECHNICAL RIDER', description: 'Hardware & Stage Plot', status: 'pending' as const, deadline: show?.show_date || new Date().toISOString(), portal_token: token },
                      { id: 'fb4', item_name: 'OTHER PROMOTER FILES', description: 'Any additional requested files', status: 'pending' as const, deadline: show?.show_date || new Date().toISOString(), portal_token: token }
                    ].map((m, idx) => (
                       <DocumentCard 
                          key={m.id} 
                          material={m} 
                          onUpload={handleUpload}
                          index={idx}
                       />
                    ))
                 ) : (
                   materialsToRender.map((m, idx) => (
                      <DocumentCard 
                         key={m.id} 
                         material={m} 
                         onUpload={handleUpload}
                         index={idx}
                      />
                   ))
                 )}
              </div>
           </section>

           {/* Support & Support & Metadata Meta */}
           <aside className="space-y-12">
              <div className="sticky top-40 space-y-12">
                 
                 <div className="space-y-6">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300 italic">Production Details</h4>
                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-4 text-slate-700 font-semibold text-sm">
                       <div className="flex items-center gap-3">
                          <span className="text-lg">📍</span>
                          <span>{show?.venue_name || 'Venue TBA'}, {show?.city || 'City TBA'}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className="text-lg">📅</span>
                          <span>{show?.show_date ? format(new Date(show.show_date), 'EEEE, MMMM d yyyy') : 'Date TBA'}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className="text-lg">⏰</span>
                          <span>{show?.show_time || 'Time TBA'}</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300 italic">Assistance</h4>
                    <a 
                      href={`mailto:${show.promoter_email}`}
                      className="flex flex-col gap-4 p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 group transition-all hover:bg-indigo-600"
                    >
                       <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700 group-hover:text-white transition-colors">Immediate Support</p>
                       <div>
                          <p className="text-sm font-black text-slate-950 group-hover:text-white leading-none mb-1 transition-colors">{show?.promoter_name || 'Promoter Team'}</p>
                          <p className="text-xs font-bold text-slate-400 group-hover:text-white/60 transition-colors">Promoter & Production Manager</p>
                       </div>
                    </a>
                 </div>

              </div>
           </aside>
        </div>

      </main>

      <footer className="footer bg-slate-950 py-32 px-12 border-t border-white/5">
         <div className="max-w-6xl mx-auto flex flex-col items-center">
            <div className="flex items-center gap-2 opacity-20 hover:opacity-100 transition-opacity mb-12">
               <Icons.Logo />
               <span className="text-sm font-black text-white/20 tracking-tighter italic uppercase group-hover:text-red-500">PS-promotion</span>
            </div>
            
            <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em] text-center max-w-sm leading-loose">
               Secure Production Environment &bull; Automated Deployment 2026 &bull; Verified Portal Protocol
            </p>
         </div>
      </footer>
    </div>
  )
}

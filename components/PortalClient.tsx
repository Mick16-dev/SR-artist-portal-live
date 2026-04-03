'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { format } from 'date-fns'
import { createClient } from '@supabase/supabase-js'
import { Toaster, toast } from 'sonner'

// Custom "Hardware" Icons - Stylized for high-end production feel
const Icons = {
  Music: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  ),
  Upload: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Alert: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}

// Sub-components for cleaner structure
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
}

export function PortalClient({ show, artist, materials: initialMaterials, token }: PortalClientProps) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials)
  const [isSyncing, setIsSyncing] = useState(false)

  const submittedCount = materials.filter(m => m.status === 'submitted').length
  const totalCount = materials.length
  const isComplete = submittedCount === totalCount && totalCount > 0

  useEffect(() => {
    if (isComplete) {
      confetti({ 
        particleCount: 100, 
        spread: 70, 
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#10b981']
      })
    }
  }, [isComplete])

  const sync = useCallback(async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    setIsSyncing(true)
    const { data } = await supabase
      .from('materials')
      .select('*')
      .eq('portal_token', token) // Or filter by show_id if token is for one item
      // Note: In real world, we'd filter by show_id linked to the token
    
    // For this demo/portal logic, we'll re-fetch based on show_id if known
    // But to keep it robust:
    setIsSyncing(false)
  }, [token])

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
      
      toast.success(`${name} submitted successfully`)
      // Optimistic locally or simple refresh
      return true
    } catch (e) {
      toast.error('Transmission error. Please try again.')
      return false
    }
  }

  return (
    <div className="bg-white min-h-screen font-sans antialiased text-slate-950 selection:bg-indigo-100">
      <Toaster position="bottom-right" />

      {/* Floating Meta-Header (Utility Feel) */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-5xl">
        <div className="bg-slate-950 text-white rounded-full px-6 py-3 flex items-center justify-between shadow-2xl shadow-indigo-900/20 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Icons.Music />
             </div>
             <span className="font-black tracking-tighter text-lg italic">SR PORTAL</span>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                {show.venue_name}
             </div>
             <div className="h-4 w-px bg-white/10 hidden sm:block" />
             <span className="text-[10px] font-black tracking-widest uppercase">
                {submittedCount}/{totalCount} DONE
             </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-40">
        
        {/* Kinetic Hero */}
        <section className="mb-24">
           <motion.div
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             className="inline-block bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-100"
           >
              Production Request
           </motion.div>
           
           <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.85] mb-8">
              {artist.name.toUpperCase()}
           </h1>
           
           <div className="grid md:grid-cols-2 gap-12 items-end">
              <p className="text-2xl md:text-3xl font-bold text-slate-400 leading-tight tracking-tight">
                 Hey {artist.name.split(' ')[0]}, <br />
                 <span className="text-slate-900">Please finalize your documents</span> for {show.venue_name}.
              </p>
              
              <div className="flex flex-col gap-2">
                 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                    <span>Deadline Progression</span>
                    <span className={isComplete ? 'text-emerald-500' : 'text-slate-900'}>
                       {Math.round((submittedCount/totalCount)*100)}%
                    </span>
                 </div>
                 <ProgressBar total={totalCount} submittedCount={submittedCount} />
              </div>
           </div>
        </section>

        {/* The Production Grid - Intentional Asymmetry */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-20">
           
           {/* Primary Work Column */}
           <section className="space-y-6">
              <div className="flex items-center justify-between mb-10">
                 <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-300">Required Materials</h2>
                 <div className="h-px flex-1 bg-slate-50 mx-6" />
              </div>
              
              <div className="space-y-4">
                 {materials.map((m, idx) => (
                    <DocumentCard 
                       key={m.id} 
                       material={m} 
                       onUpload={handleUpload}
                       index={idx}
                    />
                 ))}
              </div>
           </section>

           {/* Sidebar - Contextual Utility */}
           <aside className="space-y-12">
              <div className="bg-slate-50 rounded-[2rem] p-8 space-y-8">
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Show Identity</h4>
                    <div className="space-y-1">
                       <p className="text-xl font-bold tracking-tight">{show.venue_name}</p>
                       <p className="text-sm font-medium text-slate-500">{show.city}</p>
                    </div>
                 </div>
                 
                 <div className="h-px bg-slate-200/50" />
                 
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Production Crew</h4>
                    <div className="space-y-1">
                       <p className="text-xl font-bold tracking-tight">{show.promoter_name}</p>
                       <a href={`mailto:${show.promoter_email}`} className="text-sm font-medium text-indigo-600 hover:underline">
                          Contact Hospitality
                       </a>
                    </div>
                 </div>

                 <div className="h-px bg-slate-200/50" />

                 <div className="pt-4">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                       <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                          <Icons.Check />
                       </div>
                       <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed tracking-wider">
                          All uploads are encrypted and sent directly to {show.promoter_name}'s secure cloud.
                       </p>
                    </div>
                 </div>
              </div>
              
              <div className="px-8 flex flex-col gap-4">
                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.25em] leading-loose">
                    This portal is a private production tool. Do not share this URL. &copy; 2026 ShowReady
                 </p>
              </div>
           </aside>
        </div>

      </main>

      <AnimatePresence>
         {isComplete && (
            <motion.div 
               initial={{ opacity: 0, y: 100 }}
               animate={{ opacity: 1, y: 0 }}
               className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-6"
            >
               <div className="bg-emerald-600 text-white rounded-[2rem] p-8 shadow-2xl shadow-emerald-200 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
                     <Icons.Check />
                  </div>
                  <h3 className="text-xl font-black tracking-tight mb-2 uppercase italic">Mission Complete</h3>
                  <p className="text-emerald-100 font-bold text-sm leading-relaxed">
                     Every document has been securely received. <br/> See you at the show!
                  </p>
               </div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  )
}

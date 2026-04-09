'use client'

import React, { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'
import { differenceInDays, format, isPast, isToday, addDays } from 'date-fns'
import { createClient } from '@supabase/supabase-js'
import { Toaster, toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { 
  Music, 
  MapPin, 
  Calendar, 
  Clock, 
  Mail, 
  Moon, 
  Sun, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Info,
  ExternalLink,
  UploadCloud,
  FileText,
  Globe,
  Zap
} from 'lucide-react'
import { translations, Language } from '@/lib/translations'

const Vinyl = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <path d="M12 12h.01" />
  </svg>
)

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
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [lang, setLang] = useState<Language>('en')

  const t = translations[lang]

  const isPreview = token === 'preview-mode'
  const materialsToRender = isPreview ? [
    { id: '1', item_name: 'Primary Technical Rider', description: 'Secure audio, monitor, and lighting patch.', status: 'pending', deadline: format(addDays(new Date(), 4), 'yyyy-MM-dd'), portal_token: 'p1' },
    { id: '2', item_name: 'Press Photos', description: 'High-res promotional imagery for marketing.', status: 'pending', deadline: format(addDays(new Date(), 9), 'yyyy-MM-dd'), portal_token: 'p2' },
    { id: '3', item_name: 'Electronic Press Kit (EPK)', description: 'Catering and green room requirements.', status: 'pending', deadline: format(addDays(new Date(), 19), 'yyyy-MM-dd'), portal_token: 'p3' },
  ] as Material[] : initialMaterials

  useEffect(() => {
    setMounted(true)
    setIsOnline(navigator.onLine)
    const storedLang = window.localStorage.getItem('artist-portal-lang') as Language
    if (storedLang === 'en' || storedLang === 'de') setLang(storedLang)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (isPreview || !mounted) return
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const channel = supabase.channel('production-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials', filter: `show_id=eq.${showId}` }, () => {
        window.location.reload() 
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [showId, isPreview, mounted])

  const submittedCount = materialsToRender.filter(m => m.status === 'submitted').length
  const totalCount = materialsToRender.length
  const isComplete = submittedCount === totalCount && totalCount > 0
  const pendingMaterials = materialsToRender.filter((m) => m.status !== 'submitted')
  
  // Urgency logic for Hero
  const nextDeadlineMaterial = [...pendingMaterials].sort((a, b) => 
    new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  )[0]
  const daysToNext = nextDeadlineMaterial ? differenceInDays(new Date(nextDeadlineMaterial.deadline), new Date()) : null

  useEffect(() => {
    if (isComplete) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
  }, [isComplete])

  const handleUpload = async (materialToken: string, file: File, name: string): Promise<boolean> => {
    if (!isOnline) { toast.error(t.offline_error); return false; }
    try {
      const fd = new FormData()
      fd.append('token', materialToken); fd.append('item_name', name); fd.append('file', file)
      const res = await fetch(process.env.NEXT_PUBLIC_N8N_MATERIAL_UPLOAD_WEBHOOK!, { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      toast.success(`${name} ${t.upload_success}.`); return true
    } catch { toast.error(t.trans_failed); return false; }
  }

  useEffect(() => {
    document.title = `${t.portal_title} | ${artist?.name || t.artist_tba}`
  }, [lang, artist, t.portal_title])

  if (!mounted) return null

  return (
    <div className="min-h-screen theme-transition bg-[rgb(var(--background))] text-[rgb(var(--foreground))] selection:bg-indigo-500/30 relative overflow-x-hidden">
      <div className="fixed inset-0 mesh-gradient z-0" />
      <div className="fixed inset-0 noise-overlay z-10" />
      
      <div className="relative z-20 min-h-screen">
      <AnimatePresence>
        {!isOnline && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-0 left-0 right-0 z-[100] bg-rose-600 px-4 py-2 text-center text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg">
            {t.offline_banner}
          </motion.div>
        )}
      </AnimatePresence>

      <nav className={`sticky top-0 z-50 border-b border-white/5 bg-white/5 backdrop-blur-xl dark:border-white/5 transition-all ${!isOnline ? 'pt-8 lg:pt-8' : ''}`}>
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 ring-2 ring-indigo-500/20 group">
              <Vinyl size={22} className="group-hover:rotate-180 transition-transform duration-1000" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-400">{t.production_hub}</p>
              <h2 className="text-xl font-bold tracking-tight font-heading">{t.portal_title}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition-all hover:bg-white/10">
              <AnimatePresence mode="wait">
                {resolvedTheme === 'dark' ? (
                  <motion.div key="moon" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.2 }}><Moon size={18} /></motion.div>
                ) : (
                  <motion.div key="sun" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.2 }}><Sun size={18} /></motion.div>
                )}
              </AnimatePresence>
            </button>
            <div className="h-10 w-px bg-white/10" />
            <div className="flex items-center bg-white/5 rounded-xl p-1 gap-1 border border-white/10">
              <button onClick={() => { setLang('en'); window.localStorage.setItem('artist-portal-lang', 'en'); }} className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all ${lang === 'en' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>EN</button>
              <button onClick={() => { setLang('de'); window.localStorage.setItem('artist-portal-lang', 'de'); }} className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all ${lang === 'de' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}>DE</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, ease: "easeOut" }}>
        
        <header className="mb-20">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="flex flex-col lg:flex-row lg:items-end justify-between gap-12">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <p className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                  <CheckCircle2 size={12} />
                  {t.welcome_back} {artist?.name || t.artist_tba}{t.welcome_suffix}
                </p>
                {daysToNext !== null && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    transition={{ delay: 0.4 }}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider ${daysToNext <= 7 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-slate-800 text-slate-300'}`}
                  >
                    <Zap size={12} fill="currentColor" />
                    <span>Next deadline in {daysToNext} days — {nextDeadlineMaterial?.item_name}</span>
                  </motion.div>
                )}
              </div>
              
              <h1 className="text-6xl font-black tracking-tighter text-white lg:text-7xl font-heading leading-tight">
                {artist?.name || (
                   <span className="opacity-20 flex flex-col gap-2">
                     <div className="h-16 w-3/4 skeleton-line rounded-xl" />
                     <span className="text-xl font-medium tracking-normal text-slate-500">Artist Assignment Pending</span>
                   </span>
                )}
              </h1>
              <p className="mt-8 max-w-xl text-xl font-medium leading-relaxed text-slate-400">
                {t.gateway_desc} <span className="text-white border-b border-indigo-500/30 pb-0.5">{show?.venue_name || 'Your Venue'}</span>. 
                {t.deadline_inst}
              </p>
            </div>
            
            <div className={`w-full lg:w-80 space-y-5 p-8 rounded-[2rem] theme-transition glass ${submittedCount === totalCount ? 'border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.15)]' : 'border-white/5'}`}>
              <div className="flex items-center justify-between text-sm font-bold">
                <span className={`${submittedCount === totalCount ? 'text-emerald-400' : 'text-slate-400'} uppercase tracking-[0.2em]`}>
                  {submittedCount === totalCount ? t.stage_ready : 'Show Readiness'}
                </span>
                <span className={`${submittedCount === totalCount ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white'} px-3 py-1 rounded-lg text-xs tracking-widest transition-colors`}>{submittedCount} / {totalCount}</span>
              </div>
              <ProgressBar total={totalCount} submittedCount={submittedCount} lang={lang} />
              <div className="flex justify-between gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                <span>{submittedCount === totalCount ? 'All Systems Go' : 'Pipeline'}</span>
                {submittedCount < totalCount && <span>{Math.round((submittedCount/totalCount)*100)}% Sync</span>}
              </div>
            </div>
          </motion.div>
        </header>

        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-12">
            <section>
              <div className="mb-10 flex items-center justify-between border-b border-white/5 pb-6">
                <h3 className="text-2xl font-bold flex items-center gap-4 font-heading text-white">
                  <FileText className="text-indigo-500" size={28} />
                  The Checklist
                </h3>
              </div>
              <div className="grid gap-6">
                {materialsToRender.length === 0 ? (
                   <div className="rounded-[2.5rem] border border-white/5 bg-white/5 p-20 text-center glass">
                      <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-600/10 text-indigo-400 shadow-inner">
                         <Loader2 size={32} className="animate-spin" />
                      </div>
                      <h4 className="text-2xl font-bold text-white">Configuring Workspace...</h4>
                      <p className="mx-auto mt-4 max-w-sm text-slate-500 leading-relaxed font-medium">Your submission track will appear as soon as the production lead initializes the materials.</p>
                   </div>
                ) : (
                  materialsToRender.map((m, idx) => (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1, duration: 0.8 }}>
                      <DocumentCard material={m} onUpload={handleUpload} isOnline={isOnline} lang={lang} />
                    </motion.div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-10">
            <section className="group sticky top-32 rounded-[2.5rem] border border-white/5 bg-white/5 p-10 shadow-2xl glass transition-all hover:border-white/10">
              <h4 className="mb-10 text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400 font-heading">Production Intelligence</h4>
              
              <div className="space-y-10">
                <div className="flex gap-5 items-start">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-slate-500 group-hover:text-indigo-400 transition-colors shadow-inner">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Primary Venue</span>
                    {show?.venue_name ? (
                       <p className="text-lg font-bold leading-tight text-white">{show.venue_name}, {show.city}</p>
                    ) : (
                       <div className="space-y-2">
                         <div className="w-32 skeleton-line" />
                         <p className="text-[11px] text-slate-600 font-medium">Confirmed once contract is signed</p>
                       </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-5 items-start">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-slate-500 group-hover:text-indigo-400 transition-colors shadow-inner">
                    <Calendar size={22} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Show Readiness Date</span>
                    {show?.show_date ? (
                       <p className="text-lg font-bold text-white">{format(new Date(show.show_date), 'EEEE, MMM d yyyy')}</p>
                    ) : (
                       <div className="space-y-2">
                         <div className="w-40 skeleton-line" />
                         <p className="text-[11px] text-slate-600 font-medium">Set after venue confirms date</p>
                       </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-5 items-start">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-slate-500 group-hover:text-indigo-400 transition-colors shadow-inner">
                    <Clock size={22} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Curtain Call</span>
                    {show?.show_time ? (
                       <p className="text-lg font-bold text-white">{show.show_time}</p>
                    ) : (
                       <div className="space-y-2">
                         <div className="w-24 skeleton-line" />
                         <p className="text-[11px] text-slate-600 font-medium">Final schedule pending</p>
                       </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-12 border-t border-white/5 pt-10">
                <h5 className="mb-6 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Production Hub Support</h5>
                <a href={`mailto:${show?.promoter_email}`} className="flex items-center justify-between group/email rounded-[1.5rem] border border-white/5 bg-white/5 p-5 transition-all hover:bg-white/10 shadow-sm">
                   <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover/email:scale-110 transition-transform">
                        <Mail size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white leading-none">{show?.promoter_name || 'Production Lead'}</p>
                        <p className="mt-1.5 text-xs text-slate-500 font-medium">{show?.promoter_email || 'support@ps-promotion.de'}</p>
                      </div>
                   </div>
                   <ChevronRight size={16} className="text-slate-600 group-hover/email:translate-x-1 transition-transform" />
                </a>
              </div>
            </section>
          </div>
        </div>
        </motion.div>
      </main>

      <footer className="mt-32 border-t border-white/5 bg-black/40 py-16 backdrop-blur-xl">
         <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-white text-xs font-black shadow-inner">PS</div>
                 <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">© 2026 PS-PROMOTION PRODUCTION ECOSYSTEM</p>
              </div>
              <div className="flex gap-10 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] transition-all">
                <a href="#" className="hover:text-indigo-400 transition-colors underline decoration-indigo-500/20 underline-offset-8">Privacy Protocol</a>
                <a href="#" className="hover:text-indigo-400 transition-colors">Infrastructure Support</a>
              </div>
            </div>
         </div>
      </footer>
      </div>
    </div>
  )
}

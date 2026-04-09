'use client'

import React, { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'
import { differenceInDays, format, isPast, isToday } from 'date-fns'
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
  Globe
} from 'lucide-react'
import { translations, Language } from '@/lib/translations'

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
    { id: '1', item_name: 'Primary Technical Rider', description: 'Secure audio, monitor, and lighting patch.', status: 'pending', deadline: '2026-05-01', portal_token: 'p1' },
    { id: '2', item_name: 'Stage Plot & Input List', description: 'Physical positioning and channel mapping.', status: 'submitted', deadline: '2026-05-01', portal_token: 'p2' },
    { id: '3', item_name: 'Hospitality Specification', description: 'Catering and green room requirements.', status: 'pending', deadline: '2026-05-01', portal_token: 'p3' },
  ] as Material[] : initialMaterials

  // When mounted on client, now we can show the UI
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

  // Real-Time Production Sync
  useEffect(() => {
    if (isPreview || !mounted) return

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const channel = supabase
      .channel('production-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials', filter: `show_id=eq.${showId}` }, () => {
        window.location.reload() 
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [showId, isPreview, mounted])

  const submittedCount = materialsToRender.filter(m => m.status === 'submitted').length
  const totalCount = materialsToRender.length
  const isComplete = submittedCount === totalCount && totalCount > 0
  const pendingMaterials = materialsToRender.filter((m) => m.status !== 'submitted')
  const overdueCount = pendingMaterials.filter((m) => !isToday(new Date(m.deadline)) && isPast(new Date(m.deadline))).length
  
  useEffect(() => {
    if (isComplete) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } })
    }
  }, [isComplete])

  const handleUpload = async (materialToken: string, file: File, name: string): Promise<boolean> => {
    if (!isOnline) {
      toast.error(t.offline_error)
      return false
    }
    try {
      const fd = new FormData()
      fd.append('token', materialToken)
      fd.append('item_name', name)
      fd.append('file', file)
      const res = await fetch(process.env.NEXT_PUBLIC_N8N_MATERIAL_UPLOAD_WEBHOOK!, { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      toast.success(`${name} ${t.upload_success}.`)
      return true
    } catch {
      toast.error(t.trans_failed)
      return false
    }
  }

  useEffect(() => {
    document.title = `${t.portal_title} | ${artist?.name || t.artist_tba}`
  }, [lang, artist, t.portal_title, t.artist_tba])

  if (!mounted) return null

  return (
    <div className="min-h-screen theme-transition bg-[rgb(var(--background))] text-[rgb(var(--foreground))] selection:bg-indigo-500/30">
      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-rose-600 px-4 py-2 text-center text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg"
          >
            {t.offline_banner}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px]" />
      </div>

      <nav className={`sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-950/80 transition-all ${!isOnline ? 'pt-8 lg:pt-8' : ''}`}>
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
              <Music size={22} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">{t.production_hub}</p>
              <h2 className="text-xl font-bold tracking-tight">{t.portal_title}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <button 
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/60 bg-white/50 text-slate-600 transition-all hover:bg-slate-50 dark:border-slate-800/60 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <AnimatePresence mode="wait">
                {resolvedTheme === 'dark' ? (
                  <motion.div key="moon" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Moon size={18} />
                  </motion.div>
                ) : (
                  <motion.div key="sun" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Sun size={18} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
            <div className="h-10 w-px bg-slate-200/60 dark:bg-slate-800/60" />
            
            <div className="flex items-center bg-slate-100/50 dark:bg-slate-800/50 rounded-xl p-1 gap-1 border border-slate-200/60 dark:border-slate-800/60">
              <button 
                onClick={() => { setLang('en'); window.localStorage.setItem('artist-portal-lang', 'en'); }}
                className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all ${lang === 'en' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                EN
              </button>
              <button 
                onClick={() => { setLang('de'); window.localStorage.setItem('artist-portal-lang', 'de'); }}
                className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all ${lang === 'de' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                DE
              </button>
            </div>

            <div className="hidden lg:block h-10 w-px bg-slate-200/60 dark:bg-slate-800/60" />
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{t.venue}</p>
              <p className="max-w-[200px] truncate text-sm font-bold">{show?.venue_name || t.tba}</p>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        
        {/* Header Section */}
        <header className="mb-14">
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ duration: 0.5 }}
            className="flex flex-col lg:flex-row lg:items-end justify-between gap-8"
          >
            <div className="max-w-2xl">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
                <CheckCircle2 size={12} />
                {t.secure_handshake}
              </p>
              <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white lg:text-6xl">
                {artist?.name || t.artist_tba}
              </h1>
              <p className="mt-6 max-w-lg text-lg font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                {t.gateway_desc} <span className="text-slate-900 dark:text-slate-200">{show?.venue_name}</span>. 
                {t.deadline_inst}
              </p>
            </div>
            
            <div className="w-full lg:w-80 space-y-4">
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="text-slate-600 dark:text-slate-500 uppercase tracking-widest">{t.progress}</span>
                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{submittedCount} / {totalCount} {t.files}</span>
              </div>
              <ProgressBar total={totalCount} submittedCount={submittedCount} lang={lang} />
              <div className="flex justify-between gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                <span>{t.pipeline}</span>
                <span>{Math.round((submittedCount/totalCount)*100)}% {t.sync}</span>
              </div>
            </div>
          </motion.div>
        </header>

        {/* Bento Grid Layout */}
        <div className="grid gap-10 lg:grid-cols-12">
          
          <div className="lg:col-span-8 space-y-10">
            <section>
              <div className="mb-8 flex items-center justify-between border-b border-slate-200/60 pb-4 dark:border-slate-800/60">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <FileText className="text-indigo-500" size={24} />
                  {t.required_assets}
                </h3>
                <div className="flex gap-2">
                   {overdueCount > 0 && (
                     <span className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                       <AlertCircle size={14} />
                       {overdueCount} {t.overdue}
                     </span>
                   )}
                </div>
              </div>
              
              <div className="grid gap-6 sm:grid-cols-1">
                {materialsToRender.length === 0 ? (
                   <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-16 text-center dark:border-slate-800 dark:bg-slate-900/50">
                      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-800">
                         <span className="text-3xl">☕</span>
                      </div>
                      <h4 className="text-xl font-bold">{t.awaiting_config}</h4>
                      <p className="mx-auto mt-3 max-w-xs text-sm text-slate-500 leading-relaxed">
                         {t.awaiting_config_desc}
                      </p>
                   </div>
                ) : (
                  materialsToRender.map((m, idx) => (
                    <motion.div 
                      key={m.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <DocumentCard material={m} onUpload={handleUpload} isOnline={isOnline} lang={lang} />
                    </motion.div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-8">
            {/* Show Meta Widget */}
            <section className="group sticky top-32 rounded-[2rem] border border-slate-200/60 bg-white p-8 shadow-2xl shadow-slate-200/20 theme-transition dark:border-slate-800/60 dark:bg-slate-900/40 dark:shadow-none">
              <h4 className="mb-8 text-xs font-black uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400">{t.meta_baseline}</h4>
              
              <div className="space-y-8">
                <div className="flex gap-4 items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">{t.venue} & Location</span>
                    <p className="text-base font-bold leading-tight">{show?.venue_name || t.tba}, {show?.city || t.tba}</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 dark:text-slate-400 dark:bg-slate-800 group-hover:text-amber-500 transition-colors shadow-sm">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">{t.pipeline} Date</span>
                    <p className="text-base font-bold">{show?.show_date ? format(new Date(show.show_date), 'EEEE, MMM d yyyy') : t.tba}</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 dark:text-slate-400 dark:bg-slate-800 group-hover:text-emerald-500 transition-colors shadow-sm">
                    <Clock size={18} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">{t.curtain_call}</span>
                    <p className="text-base font-bold">{show?.show_time || t.tba}</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 border-t border-slate-100 pt-8 dark:border-slate-800">
                <h5 className="mb-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">{t.venue_liaison}</h5>
                <a 
                  href={`mailto:${show.promoter_email}`}
                  className="flex items-center justify-between group/email rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800 shadow-sm"
                >
                   <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 group-hover/email:scale-110 transition-transform">
                        <Mail size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-none">{show?.promoter_name || t.production_lead}</p>
                        <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium">{show?.promoter_email}</p>
                      </div>
                   </div>
                   <ChevronRight size={14} className="text-slate-400 group-hover/email:translate-x-1 transition-transform" />
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-slate-200/60 bg-white/50 py-12 dark:border-slate-800/60 dark:bg-transparent">
         <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-[10px] font-bold">PS</div>
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">© 2026 PS-promotion</p>
              </div>
              <div className="flex gap-8 text-xs font-bold text-slate-400 uppercase tracking-tight">
                <a href="#" className="hover:text-indigo-500 transition-colors">{t.privacy}</a>
                <a href="#" className="hover:text-indigo-500 transition-colors">{t.security}</a>
                <a href="#" className="hover:text-indigo-500 transition-colors">{t.support}</a>
              </div>
            </div>
         </div>
      </footer>
    </div>
  )
}

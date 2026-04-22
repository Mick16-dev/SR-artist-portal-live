'use client'

import React, { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'
import { differenceInDays, format, addDays } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import { createClient } from '@supabase/supabase-js'
import { Toaster, toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Mail, 
  Moon, 
  Sun, 
  CheckCircle2, 
  LayoutDashboard,
  FileText,
  ChevronRight,
  Globe,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Utensils,
  Soup
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
  load_in_time?: string
  soundcheck_time?: string
  doors_time?: string
  catering_notes?: string
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
  const dateLocale = lang === 'de' ? de : enUS

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
    if (mounted) {
      document.title = `${t.portal_title} | ${artist?.name || t.artist_tba}`
    }
  }, [lang, artist, mounted, t.portal_title])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--foreground))] selection:bg-primary/20 theme-transition font-sans">
      <Toaster position="top-right" />
      
      {/* Top Navigation */}
      <nav className="sticky top-0 z-[60] border-b border-[rgb(var(--border))] bg-[rgb(var(--background))/80] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <ShieldCheck size={18} />
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-semibold tracking-tight">ShowTime</span>
              <span className="mx-2 text-[rgb(var(--muted-foreground))]">/</span>
              <span className="text-sm font-medium text-[rgb(var(--muted-foreground))]">{t.portal_title}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[rgb(var(--secondary))] rounded-md p-0.5 border border-[rgb(var(--border))]">
              <button 
                onClick={() => { setLang('en'); window.localStorage.setItem('artist-portal-lang', 'en'); }} 
                className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${lang === 'en' ? 'bg-[rgb(var(--background))] text-[rgb(var(--foreground))] shadow-sm' : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'}`}
              >
                EN
              </button>
              <button 
                onClick={() => { setLang('de'); window.localStorage.setItem('artist-portal-lang', 'de'); }} 
                className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${lang === 'de' ? 'bg-[rgb(var(--background))] text-[rgb(var(--foreground))] shadow-sm' : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'}`}
              >
                DE
              </button>
            </div>
            <button 
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} 
              className="flex h-9 w-9 items-center justify-center rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--background))] text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--secondary))] transition-colors"
            >
              {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-12 border-b border-[rgb(var(--border))] pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Globe size={14} />
                {t.production_hub}
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                {artist?.name || t.artist_tba}
              </h1>
              <p className="max-w-2xl text-lg font-medium text-[rgb(var(--muted-foreground))]">
                {t.gateway_desc} <span className="text-[rgb(var(--foreground))] underline decoration-primary/30 underline-offset-4">{show?.venue_name}</span>.
                <br />
                {t.deadline_inst}
              </p>
            </div>
            
            <div className="w-full md:w-72 p-6 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-[rgb(var(--muted-foreground))]">{t.progress}</span>
                <span className="text-xs font-bold text-primary">{submittedCount} / {totalCount}</span>
              </div>
              <ProgressBar total={totalCount} submittedCount={submittedCount} lang={lang} />
            </div>
          </div>
        </div>

        {/* Live Schedule & Logistics (NEW) */}
        {(show.load_in_time || show.soundcheck_time || show.doors_time || show.catering_notes) && (
          <div className="mb-12 grid gap-6 md:grid-cols-2">
            {/* Schedule Card */}
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                <Clock size={80} />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
                <Clock size={14} />
                {t.live_schedule}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 text-center py-4 bg-[rgb(var(--secondary))/30] rounded-xl border border-[rgb(var(--border))] group-hover:bg-[rgb(var(--secondary))/50] transition-colors">
                  <span className="block text-[9px] font-bold text-[rgb(var(--muted-foreground))] uppercase tracking-widest">{t.load_in}</span>
                  <span className="block text-lg font-black italic">{show.load_in_time || '--:--'}</span>
                </div>
                <div className="space-y-1 text-center py-4 bg-primary/5 rounded-xl border border-primary/20 group-hover:bg-primary/10 transition-colors">
                  <span className="block text-[9px] font-bold text-primary uppercase tracking-widest">{t.soundcheck}</span>
                  <span className="block text-lg font-black italic">{show.soundcheck_time || '--:--'}</span>
                </div>
                <div className="space-y-1 text-center py-4 bg-[rgb(var(--secondary))/30] rounded-xl border border-[rgb(var(--border))] group-hover:bg-[rgb(var(--secondary))/50] transition-colors">
                  <span className="block text-[9px] font-bold text-[rgb(var(--muted-foreground))] uppercase tracking-widest">{t.doors}</span>
                  <span className="block text-lg font-black italic">{show.doors_time || '--:--'}</span>
                </div>
              </div>
            </div>

            {/* Hospitality Card */}
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                <Soup size={80} />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
                <Utensils size={14} />
                {t.hospitality}
              </h3>
              <div className="min-h-[80px] p-4 bg-[rgb(var(--secondary))/20] rounded-xl border border-[rgb(var(--border))] border-dashed group-hover:bg-[rgb(var(--secondary))/40] transition-colors relative z-10 transition-all">
                {show.catering_notes ? (
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{show.catering_notes}</p>
                ) : (
                  <p className="text-xs italic text-[rgb(var(--muted-foreground))] uppercase tracking-widest font-bold opacity-30 h-10 flex items-center justify-center">
                    TBA
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Main Checklist */}
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <h2 className="text-xl font-bold">{t.required_assets}</h2>
            </div>
            
            <div className="space-y-4">
              {materialsToRender.length === 0 ? (
                <div className="rounded-xl border border-[rgb(var(--border))] border-dashed p-12 text-center bg-[rgb(var(--secondary))/30]">
                  <Loader2 className="mx-auto mb-4 animate-spin text-[rgb(var(--muted-foreground))]" size={32} />
                  <p className="font-medium text-[rgb(var(--muted-foreground))]">{t.loading}</p>
                </div>
              ) : (
                materialsToRender.map((m) => (
                  <DocumentCard key={m.id} material={m} onUpload={handleUpload} isOnline={isOnline} lang={lang} />
                ))
              )}
            </div>
          </div>

          {/* Sidebar - Show Metadata */}
          <div className="lg:col-span-4 space-y-6">
             <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-8 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[rgb(var(--muted-foreground))] mb-8">Show Details</h3>
                
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="text-[rgb(var(--muted-foreground))] pt-1"><MapPin size={18} /></div>
                    <div>
                      <span className="block text-[10px] font-bold text-[rgb(var(--muted-foreground))] uppercase tracking-widest mb-1">{t.venue}</span>
                      <p className="font-semibold">{show?.venue_name}, {show?.city}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="text-[rgb(var(--muted-foreground))] pt-1"><Calendar size={18} /></div>
                    <div>
                      <span className="block text-[10px] font-bold text-[rgb(var(--muted-foreground))] uppercase tracking-widest mb-1">{t.deadline}</span>
                      <p className="font-semibold">{show?.show_date ? format(new Date(show.show_date), 'PPP', { locale: dateLocale }) : t.tba}</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="text-[rgb(var(--muted-foreground))] pt-1"><Clock size={18} /></div>
                    <div>
                      <span className="block text-[10px] font-bold text-[rgb(var(--muted-foreground))] uppercase tracking-widest mb-1">{t.curtain_call}</span>
                      <p className="font-semibold">{show?.show_time || t.tba}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-[rgb(var(--border))]">
                  <span className="block text-[10px] font-bold text-[rgb(var(--muted-foreground))] uppercase tracking-widest mb-4">{t.support}</span>
                  <a 
                    href={`mailto:${show?.promoter_email}`} 
                    className="flex items-center justify-between rounded-lg p-3 bg-[rgb(var(--secondary))] hover:bg-[rgb(var(--accent))] border border-[rgb(var(--border))] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-primary" />
                      <div>
                        <p className="text-sm font-bold">{show?.promoter_name || t.production_lead}</p>
                        <p className="text-xs text-[rgb(var(--muted-foreground))]">{show?.promoter_email}</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-[rgb(var(--muted-foreground))] group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
             </div>

             <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center gap-2">
                <ShieldCheck size={14} className="text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{t.security}</span>
             </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-[rgb(var(--border))] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-8">
          <p className="text-xs font-medium text-[rgb(var(--muted-foreground))] uppercase tracking-widest">
            © 2026 SHOWTIME
          </p>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-[rgb(var(--muted-foreground))]">
            <a href="#" className="hover:text-primary transition-colors">{t.privacy}</a>
            <a href="#" className="hover:text-primary transition-colors underline underline-offset-4 decoration-primary/20">Infrastructure</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

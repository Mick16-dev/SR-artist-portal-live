'use client'

import React, { useState, useRef, useEffect } from 'react'
import { format, isPast, isToday, differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import { 
  FileCheck, 
  FileClock, 
  Upload, 
  ExternalLink, 
  AlertTriangle,
  RotateCcw,
  Loader2,
  XCircle,
  FileCheck2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { translations, Language } from '@/lib/translations'

interface DocumentCardProps {
  material: {
    id: string
    item_name: string
    name?: string
    description?: string
    status: 'pending' | 'submitted'
    deadline: string
    submitted_at?: string
    file_url?: string
    portal_token: string
  }
  onUpload: (token: string, file: File, name: string) => Promise<boolean>
  isOnline?: boolean
  lang: Language
}

export function DocumentCard({ material, onUpload, isOnline = true, lang }: DocumentCardProps) {
  const t = translations[lang]
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const displayName = material.item_name || material.name || 'Required Document'
  const isSubmitted = material.status === 'submitted'
  const deadlineDate = new Date(material.deadline)
  const isOverdue = !isSubmitted && isPast(deadlineDate) && !isToday(deadlineDate)
  const isDeadlineToday = !isSubmitted && isToday(deadlineDate)
  const daysDiff = Math.abs(differenceInDays(deadlineDate, now))

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setSelectedFileName(file.name)
    setIsUploading(true)
    
    const toastId = toast.loading(`${t.transmitting} ${file.name}...`)
    
    try {
      const controller = new AbortController()
      abortControllerRef.current = controller

      const success = await onUpload(material.portal_token, file, displayName)
      if (success) {
        toast.success(`${t.view_asset}! ${displayName} ${t.upload_success}.`, { id: toastId })
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      toast.error(`${t.upload_error} ${displayName}.`, { id: toastId })
    } finally {
      setIsUploading(false)
      setSelectedFileName(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`
      relative group overflow-hidden rounded-[1.5rem] border theme-transition
      ${isSubmitted 
        ? 'border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10' 
        : isOverdue 
          ? 'border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10' 
          : 'border-slate-200/60 bg-white dark:border-slate-800/60 dark:bg-slate-900/40'}
      p-8 hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-none transition-all
    `}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
             <div className={`
               flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors
               ${isSubmitted ? 'bg-emerald-500 text-white' : isOverdue ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}
             `}>
               {isSubmitted ? <FileCheck size={20} /> : isOverdue ? <AlertTriangle size={20} /> : <FileClock size={20} />}
             </div>
             <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
               {displayName}
             </h3>
          </div>
          
          {material.description && (
            <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400 max-w-lg">
              {material.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest pt-2">
            <span className={`
               px-2.5 py-1 rounded-md border
               ${isSubmitted 
                ? 'border-emerald-500/20 text-emerald-600 bg-emerald-500/5' 
                : isOverdue 
                  ? 'border-rose-500/20 text-rose-600 bg-rose-500/5' 
                  : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40'}
            `}>
              {isSubmitted 
                ? `${t.submitted} ${material.submitted_at ? format(new Date(material.submitted_at), 'MMM d') : t.recently}` 
                : `${t.deadline}: ${format(deadlineDate, 'MMM d')}`}
            </span>
            
            {!isSubmitted && (
              <span className={isOverdue ? 'text-rose-500' : isDeadlineToday ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'}>
                {isDeadlineToday ? t.due_today : isOverdue ? `${daysDiff} ${t.days_overdue}` : `${daysDiff} ${t.days_remaining}`}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 flex flex-col sm:flex-row md:flex-col lg:flex-row items-center gap-3">
          {isSubmitted ? (
            <>
              {material.file_url && material.file_url !== '#' && (
                <a
                  href={material.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 shadow-sm"
                >
                  <ExternalLink size={16} />
                  {t.view_asset}
                </a>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!isOnline}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/60 text-slate-500 hover:text-slate-700 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-200 px-4 py-3 text-sm font-bold transition-all ${!isOnline ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <RotateCcw size={16} />
                {t.overwrite}
              </button>
            </>
          ) : (
            <div className="w-full flex flex-col items-end gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || !isOnline}
                className={`
                  w-full sm:w-auto group/up inline-flex items-center justify-center gap-2 rounded-[1rem] px-5 py-4 text-sm font-black uppercase tracking-widest text-white transition-all
                  ${!isOnline ? 'bg-slate-400 cursor-not-allowed opacity-50' : isOverdue ? 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-500/20' : 'bg-slate-900 dark:bg-indigo-600 hover:bg-indigo-500 dark:hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'}
                  ${isUploading ? 'cursor-not-allowed opacity-80' : ''}
                `}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {selectedFileName ? t.transmitting : t.loading}
                  </>
                ) : !isOnline ? (
                  <>
                    <XCircle size={18} />
                    {t.offline}
                  </>
                ) : (
                  <>
                    <Upload size={18} className="group-hover/up:-translate-y-0.5 transition-transform" />
                    {t.transmit} {displayName.split(' ')[0]}
                  </>
                )}
              </button>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {!isOnline ? t.offline_status : t.file_types}
              </p>
            </div>
          )}
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept=".pdf,.doc,.docx"
        onChange={handleFileChange}
      />
    </div>
  )
}

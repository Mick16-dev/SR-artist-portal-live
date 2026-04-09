'use client'

import React, { useState, useRef, useEffect } from 'react'
import { format, isPast, isToday, differenceInDays } from 'date-fns'
import { toast } from 'sonner'
import { 
  FileText, 
  Camera, 
  User, 
  Sliders, 
  PenTool,
  AlertTriangle,
  RotateCcw,
  Loader2,
  XCircle,
  FileCheck2,
  ChevronRight,
  Sparkles,
  FileDigit
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
  isOnline: boolean
  lang: Language
}

export function DocumentCard({ material, onUpload, isOnline, lang }: DocumentCardProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const t = translations[lang]

  const isSubmitted = material.status === 'submitted'
  const daysToDeadline = differenceInDays(new Date(material.deadline), new Date())
  const isOverdue = daysToDeadline < 0 && !isSubmitted
  const isUrgent = daysToDeadline >= 0 && daysToDeadline <= 7 && !isSubmitted
  const isWarning = daysToDeadline > 7 && daysToDeadline <= 14 && !isSubmitted

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB.')
      return
    }

    setIsUploading(true)
    const success = await onUpload(material.portal_token, file, material.item_name)
    setIsUploading(false)
    
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Icon Mapping
  const getIcon = () => {
    const name = material.item_name.toLowerCase()
    if (name.includes('epk')) return <Sparkles className="text-indigo-500" size={24} />
    if (name.includes('press photo') || name.includes('photos')) return <Camera className="text-blue-500" size={24} />
    if (name.includes('bio') || name.includes('biography')) return <User className="text-emerald-500" size={24} />
    if (name.includes('rider') || name.includes('technical')) return <Sliders className="text-purple-500" size={24} />
    if (name.includes('contract') || name.includes('signed')) return <PenTool className="text-amber-500" size={24} />
    return <FileText className="text-slate-500" size={24} />
  }

  return (
    <motion.div 
      whileHover={{ scale: 1.01, y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`
      relative group overflow-hidden rounded-3xl border theme-transition glass
      ${isSubmitted 
        ? 'border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10' 
        : isOverdue 
          ? 'border-rose-500/30 bg-rose-500/10 border-l-4 border-l-rose-500' 
          : isUrgent
            ? 'border-coral-500/30 bg-orange-500/5 border-l-4 border-l-orange-500'
            : isWarning
              ? 'border-amber-500/30 bg-amber-500/5 border-l-4 border-l-amber-500'
              : 'border-white/10 bg-white/5 dark:border-slate-800/40 dark:bg-slate-900/20'}
      p-8 hover:shadow-[0_20px_50px_rgba(79,70,229,0.12)] transition-all
    `}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-6">
           <div className={`p-4 rounded-2xl bg-white/10 dark:bg-slate-800/60 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
              {getIcon()}
           </div>
           <div className="space-y-1">
             <h3 className="text-lg font-bold tracking-tight">{material.item_name}</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-md">
               {material.description || t.file_types}
             </p>
             <div className="flex items-center gap-4 pt-2">
                <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isOverdue ? 'text-rose-500' : isUrgent ? 'text-orange-500 font-bold' : isWarning ? 'text-amber-500' : 'text-slate-500'}`}>
                  {isSubmitted ? (
                    <span className="flex items-center gap-1.5 text-emerald-500">
                      <FileCheck2 size={12} />
                      {t.submitted} {material.submitted_at && `• ${format(new Date(material.submitted_at), 'MMM d')}`}
                    </span>
                  ) : (
                    <>
                      <AlertTriangle size={12} className={isOverdue ? 'animate-pulse' : ''} />
                      {isOverdue ? t.overdue : isUrgent ? 'Urgent' : t.deadline}: {format(new Date(material.deadline), 'MMM d, yyyy')}
                    </>
                  )}
                </div>
             </div>
           </div>
        </div>

        <div className="flex items-center gap-3">
          {(!isSubmitted || material.file_url) && (
            <button
              onClick={() => isSubmitted ? window.open(material.file_url) : fileInputRef.current?.click()}
              disabled={isUploading || (!isOnline && !isSubmitted)}
              className={`
                group/btn relative flex h-12 items-center gap-3 rounded-2xl px-6 text-xs font-black uppercase tracking-[0.15em] transition-all
                ${isSubmitted 
                  ? 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white' 
                  : isUrgent
                    ? 'bg-orange-600 text-white shadow-[0_10px_20px_rgba(234,88,12,0.3)] hover:bg-orange-500 hover:shadow-[0_15px_25px_rgba(234,88,12,0.4)]'
                    : 'bg-indigo-600 text-white shadow-[0_10px_20px_rgba(79,70,229,0.3)] hover:bg-indigo-500 hover:shadow-[0_15px_25px_rgba(79,70,229,0.4)]'}
                disabled:opacity-40 disabled:cursor-not-allowed
              `}
            >
              {isUploading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : isSubmitted ? (
                <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
              ) : (
                <Vinyl size={16} className="group-hover/btn:rotate-180 transition-transform duration-700" />
              )}
              <span>{isUploading ? t.transmitting : isSubmitted ? t.view_asset : t.transmit}</span>
            </button>
          )}
          
          {isSubmitted && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !isOnline}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all hover:bg-slate-50 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600 dark:hover:text-indigo-400"
              title={t.overwrite}
            >
              <RotateCcw size={18} />
            </button>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading || !isOnline}
      />
    </motion.div>
  )
}

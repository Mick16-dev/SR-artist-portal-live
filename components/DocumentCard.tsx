'use client'

import React, { useState, useRef } from 'react'
import { format, differenceInDays } from 'date-fns'
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
  FileCheck2,
  ChevronRight,
  Star,
  Download
} from 'lucide-react'
import { motion } from 'framer-motion'
import { translations, Language } from '@/lib/translations'

interface DocumentCardProps {
  material: {
    id: string
    item_name: string
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

  const getIcon = () => {
    const name = material.item_name.toLowerCase()
    if (name.includes('epk')) return <Star className="text-primary" size={20} />
    if (name.includes('photo')) return <Camera className="text-primary" size={20} />
    if (name.includes('bio')) return <User className="text-primary" size={20} />
    if (name.includes('rider') || name.includes('technical')) return <Sliders className="text-primary" size={20} />
    if (name.includes('contract')) return <PenTool className="text-primary" size={20} />
    return <FileText className="text-[rgb(var(--muted-foreground))]" size={20} />
  }

  return (
    <div className={`
      relative group rounded-xl border p-6 transition-all font-sans
      ${isSubmitted 
        ? 'border-emerald-500/20 bg-emerald-500/5' 
        : isOverdue 
          ? 'border-red-500/30 bg-red-500/5' 
          : 'border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:bg-primary/5 hover:border-primary/30'}
    `}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
           <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--secondary))] border border-[rgb(var(--border))]">
              {getIcon()}
           </div>
           <div>
             <h3 className="text-sm font-bold tracking-tight">{material.item_name}</h3>
             <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))] font-medium leading-relaxed max-w-sm">
               {material.description || t.file_types}
             </p>
             <div className="mt-3 flex items-center gap-3">
                <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${isSubmitted ? 'text-emerald-500' : isOverdue ? 'text-red-500' : isUrgent ? 'text-orange-500' : 'text-[rgb(var(--muted-foreground))]'}`}>
                  {isSubmitted ? (
                    <>
                      <FileCheck2 size={12} />
                      {t.submitted}
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={12} className={isOverdue ? 'animate-pulse' : ''} />
                      {isOverdue ? t.overdue : t.deadline}: {format(new Date(material.deadline), 'PP')}
                    </>
                  )}
                </span>
             </div>
           </div>
        </div>

        <div className="flex items-center gap-2">
          {(!isSubmitted || material.file_url) && (
            <button
              onClick={() => isSubmitted ? window.open(material.file_url) : fileInputRef.current?.click()}
              disabled={isUploading || (!isOnline && !isSubmitted)}
              className={`
                h-10 px-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2
                ${isSubmitted 
                  ? 'bg-[rgb(var(--secondary))] text-[rgb(var(--foreground))] border border-[rgb(var(--border))] hover:bg-[rgb(var(--accent))]' 
                  : 'bg-primary text-white hover:opacity-90 shadow-sm border border-primary/20'}
                disabled:opacity-40
              `}
            >
              {isUploading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : isSubmitted ? (
                <Download size={14} />
              ) : (
                <FileText size={14} />
              )}
              <span>{isUploading ? t.transmitting : isSubmitted ? t.view_asset : t.transmit}</span>
            </button>
          )}
          
          {isSubmitted && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !isOnline}
              className="h-10 w-10 flex items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] text-[rgb(var(--muted-foreground))] hover:text-primary hover:bg-[rgb(var(--secondary))] transition-colors"
              title={t.overwrite}
            >
              <RotateCcw size={16} />
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
    </div>
  )
}

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, isPast, isToday, differenceInDays } from 'date-fns'

const Icons = {
  File: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
       <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  Camera: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
       <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  Upload: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
       <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
       <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  X: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
       <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Refresh: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
       <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  )
}

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
  index: number
}

export function DocumentCard({ material, onUpload, index }: DocumentCardProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const displayName = material.item_name || material.name || 'Required Document'
  const isSubmitted = material.status === 'submitted'
  const deadlineDate = new Date(material.deadline)
  const isOverdue = !isSubmitted && isPast(deadlineDate)
  const isDeadlineToday = !isSubmitted && isToday(deadlineDate)
  const daysUntilDeadline = differenceInDays(deadlineDate, new Date())

  // Dynamic status styling based on real-time urgency
  const getUrgencyLabel = () => {
    if (isSubmitted) return 'SECURED'
    if (isOverdue) return 'URGENT: PAST DUE'
    if (isDeadlineToday) return 'CRITICAL: DUE TODAY'
    if (daysUntilDeadline <= 3) return `DUE IN ${daysUntilDeadline} DAYS`
    return 'PENDING TRANSMISSION'
  }

  const getUrgencyColor = () => {
    if (isSubmitted) return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
    if (isOverdue || isDeadlineToday) return 'bg-red-50 text-red-700 ring-red-100 animate-pulse'
    if (daysUntilDeadline <= 3) return 'bg-amber-50 text-amber-700 ring-amber-100'
    return 'bg-slate-50 text-slate-500 ring-slate-100'
  }

  const handleFile = async (file: File) => {
    const controller = new AbortController()
    setAbortController(controller)
    setIsUploading(true)
    
    const success = await onUpload(material.portal_token, file, displayName)
    
    if (success) {
      // Success is handled by PortalClient's real-time sync
    }
    setIsUploading(false)
    setAbortController(null)
  }

  const cancelUpload = () => {
    if (abortController) {
      abortController.abort()
      setIsUploading(false)
      setAbortController(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
      onDragEnter={() => setIsDragOver(true)}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`relative group bg-white border border-slate-100 rounded-[2rem] p-10 flex flex-col md:flex-row md:items-center justify-between gap-12 transition-all duration-300 hover:shadow-[0_40px_80px_-10px_rgba(79,70,229,0.12)] ${isDragOver ? 'ring-4 ring-indigo-600 scale-[1.01]' : ''}`}
    >
      <div className="flex-1 space-y-6">
        <div className="flex items-start gap-4">
           <div className={`p-4 rounded-2xl shrink-0 transition-colors ${isSubmitted ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
              {displayName.toLowerCase().includes('photo') ? <Icons.Camera /> : <Icons.File />}
           </div>
           
           <div className="space-y-1">
              <h3 className="text-3xl font-black tracking-tighter italic uppercase text-slate-900 leading-none">
                 {displayName}
              </h3>
              <p className="text-sm font-medium text-slate-400 group-hover:text-slate-500 transition-colors">
                 {material.description || 'Mandatory technical requirement'}
              </p>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           <div className={`text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-full ring-1 ${getUrgencyColor()}`}>
              {getUrgencyLabel()}
           </div>
           
           <div className="text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-full bg-white text-slate-300 ring-1 ring-slate-100 flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isSubmitted ? 'bg-emerald-400' : 'bg-slate-300'}`} />
              DUE IN: {format(deadlineDate, 'MMMM do')}
           </div>
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-center gap-4">
        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.button
               key="cancel-upload"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               onClick={cancelUpload}
               className="w-full md:w-auto px-8 py-5 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95 min-w-[200px]"
            >
               <Icons.X />
               Cancel Submission
            </motion.button>
          ) : isSubmitted ? (
            <div className="flex flex-col gap-3 w-full md:w-auto">
               <a
                 href={material.file_url}
                 target="_blank"
                 rel="noreferrer"
                 className="px-10 py-5 bg-slate-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95 min-w-[200px]"
               >
                  <Icons.Check />
                  Secure Payload
               </a>
               <button
                 onClick={() => fileInputRef.current?.click()}
                 className="px-10 py-2 border border-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
               >
                  <Icons.Refresh />
                  Resubmit Version
               </button>
            </div>
          ) : (
            <button
               onClick={() => fileInputRef.current?.click()}
               className={`w-full md:w-auto px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 min-w-[200px] ${isOverdue || isDeadlineToday ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-100' : 'bg-indigo-600 text-white hover:bg-indigo-800 shadow-indigo-100'}`}
            >
               <Icons.Upload />
               Transmit Asset
            </button>
          )}
        </AnimatePresence>
        
        {!isSubmitted && (
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] leading-loose">
             Verified Production Node
          </p>
        )}
      </div>

      <input 
         type="file" 
         ref={fileInputRef} 
         className="hidden" 
         accept=".pdf,.doc,.docx,.jpg,.png"
         onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      
      {/* Heavy Drag Grid Overlay */}
      <AnimatePresence>
         {isDragOver && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-indigo-600 text-white rounded-[2rem] flex flex-col items-center justify-center z-20 border-[8px] border-white/20 backdrop-blur-2xl"
            >
               <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <Icons.Upload />
               </div>
               <p className="text-[12px] font-black uppercase tracking-[0.5em]">Release to Transmit</p>
            </motion.div>
         )}
      </AnimatePresence>
    </motion.div>
  )
}

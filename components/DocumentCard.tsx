'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, isPast } from 'date-fns'

const Icons = {
  File: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
       <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
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
  Refresh: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
       <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  )
}

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
  index: number
}

export function DocumentCard({ material, onUpload, index }: DocumentCardProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isSubmitted = material.status === 'submitted'
  const isOverdue = !isSubmitted && isPast(new Date(material.deadline))
  const deadlineDate = new Date(material.deadline)

  const handleFile = async (file: File) => {
    setIsUploading(true)
    const success = await onUpload(material.portal_token, file, material.item_name)
    if (success) {
      // Local reload logic is handled by PortalClient
    }
    setIsUploading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (isSubmitted) return
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onDragOver={(e) => { e.preventDefault(); !isSubmitted && setIsDragOver(true) }}
      onDragEnter={() => !isSubmitted && setIsDragOver(true)}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`relative group bg-white border border-slate-100 rounded-[2rem] p-10 flex flex-col md:flex-row md:items-center justify-between gap-12 transition-all duration-300 hover:shadow-[0_40px_80px_-20px_rgba(79,70,229,0.1)] ${isDragOver ? 'ring-4 ring-indigo-600 scale-[1.02]' : ''}`}
    >
      <div className="flex-1 space-y-6">
        <div className="flex items-start gap-4">
           <div className={`p-4 rounded-2xl shrink-0 transition-colors ${isSubmitted ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
              <Icons.File />
           </div>
           
           <div className="space-y-1">
              <h3 className="text-3xl font-black tracking-tighter italic uppercase text-slate-900 leading-none">
                 {material.item_name}
              </h3>
              <p className="text-sm font-medium text-slate-400 group-hover:text-slate-500 transition-colors">
                 {material.description || 'Mandatory production material'}
              </p>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           <div className={`text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-full ring-1 ${isSubmitted ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : isOverdue ? 'bg-red-50 text-red-700 ring-red-100' : 'bg-slate-50 text-slate-500 ring-slate-100'}`}>
              {isSubmitted ? 'SUBMITTED' : isOverdue ? 'OVERDUE' : 'PENDING'}
           </div>
           
           <div className="text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-full bg-white text-slate-300 ring-1 ring-slate-100 flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isSubmitted ? 'bg-emerald-400' : 'bg-slate-300'}`} />
              DUE: {format(deadlineDate, 'MMM do')}
           </div>
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {isSubmitted ? (
             <motion.a
               key="view-button"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               href={material.file_url}
               target="_blank"
               rel="noreferrer"
               className="w-full md:w-auto px-10 py-5 bg-slate-950 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 active:scale-95 group/btn"
             >
                <Icons.Check />
                Received
             </motion.a>
          ) : (
             <motion.button
               key="upload-button"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               onClick={() => fileInputRef.current?.click()}
               disabled={isUploading}
               className={`w-full md:w-auto px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 min-w-[220px] ${isOverdue ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-indigo-600 text-white hover:bg-indigo-800 shadow-indigo-100'}`}
             >
                {isUploading ? <Icons.Refresh /> : <Icons.Upload />}
                {isUploading ? 'Sending...' : `Transmit ${material.item_name}`}
             </motion.button>
          )}
        </AnimatePresence>
        
        {!isSubmitted && (
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mt-5 leading-loose">
             PDF &bull; DOC &bull; 10MB
          </p>
        )}
      </div>

      {/* Hidden Input */}
      <input 
         type="file" 
         ref={fileInputRef} 
         className="hidden" 
         accept=".pdf,.doc,.docx"
         onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      
      {/* Heavy Interaction Layer */}
      <AnimatePresence>
         {isDragOver && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-indigo-600/95 backdrop-blur-md rounded-[2.2rem] flex flex-col items-center justify-center text-white z-20 border-[6px] border-dashed border-white/20"
            >
               <Icons.Upload />
               <p className="text-[11px] font-black uppercase tracking-[0.4em] mt-4">Drop to submit</p>
            </motion.div>
         )}
      </AnimatePresence>
    </motion.div>
  )
}

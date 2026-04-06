'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, isPast, isToday, differenceInDays } from 'date-fns'
import { toast } from 'sonner'

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
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const displayName = material.item_name || material.name || 'Required Document'
  const isSubmitted = material.status === 'submitted'
  const deadlineDate = new Date(material.deadline)
  const isOverdue = !isSubmitted && isPast(deadlineDate) && !isToday(deadlineDate)
  const daysDiff = Math.abs(differenceInDays(deadlineDate, new Date()))
  const isDeadlineToday = !isSubmitted && isToday(deadlineDate)

  // Determine State Formatting
  let cardClass = ''
  let statusIcon = ''
  let statusText = ''
  
  if (isSubmitted) {
    cardClass = 'bg-green-50 border-emerald-500'
    statusIcon = '✅'
    const subDate = material.submitted_at ? format(new Date(material.submitted_at), 'MMMM d, yyyy') : 'Recently'
    statusText = `Submitted — ${subDate}`
  } else if (isOverdue) {
    cardClass = 'bg-red-50 border-red-500'
    statusIcon = '❌'
    statusText = `${daysDiff} days overdue`
  } else {
    cardClass = 'bg-white border-indigo-500'
    statusIcon = '⏳'
    statusText = isDeadlineToday ? 'Due today' : `${daysDiff} days remaining`
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setSelectedFileName(file.name)
    setIsUploading(true)
    
    // Simulate progress visual before complete execution
    const toastId = toast.loading(`Uploading ${file.name}...`)
    
    const fd = new FormData()
    fd.append('token', material.portal_token)
    fd.append('item_name', displayName)
    fd.append('file', file)

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_N8N_UPLOAD_WEBHOOK || process.env.NEXT_PUBLIC_N8N_MATERIAL_UPLOAD_WEBHOOK || '', {
        method: 'POST',
        body: fd
      })

      if (!res.ok) throw new Error()
      
      toast.success(`✅ ${displayName} submitted successfully!`, { id: toastId })
      
      // Auto-refresh handled by parent component's Supabase real-time sync
      // BUT we also manually trigger parent onUpload if we want
      await onUpload(material.portal_token, file, displayName)
    } catch {
       toast.error(`Failed to upload ${displayName}. Please try again.`, { id: toastId })
    } finally {
       setIsUploading(false)
       setSelectedFileName(null)
       if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`p-8 rounded-xl border border-slate-200 border-l-[8px] shadow-sm transform transition-all ${cardClass}`}>
       <div className="flex flex-col gap-6">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
                <span className="text-xl">📄</span>
                <h3 className="text-xl font-bold text-slate-800">{displayName}</h3>
             </div>
             {material.description && (
                <p className="text-slate-500 text-sm pl-8">{material.description}</p>
             )}
          </div>

          <div className="space-y-2 text-sm font-semibold pl-8">
             <p className="text-slate-700">Due: {format(deadlineDate, 'EEEE, MMMM d yyyy')}</p>
             <p className={`flex items-center gap-2 ${isOverdue ? 'text-red-600 font-bold' : isSubmitted ? 'text-emerald-700' : 'text-slate-600'}`}>
                <span>{statusIcon}</span>
                <span>{statusText}</span>
             </p>
             
             {isOverdue && (
                <p className="text-red-500 text-xs font-bold pt-1 uppercase tracking-wide">
                   Please submit this as soon as possible
                </p>
             )}
          </div>

          <div className="pt-4 pl-8">
             {isSubmitted ? (
               <a
                 href={material.file_url || '#'}
                 target="_blank"
                 rel="noreferrer"
                 className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
               >
                  View Submitted File
               </a>
             ) : (
               <div className="space-y-3">
                  <button
                     onClick={() => fileInputRef.current?.click()}
                     disabled={isUploading}
                     className={`inline-flex items-center justify-center px-6 py-3 rounded-lg font-bold text-sm transition-colors shadow-sm gap-2 ${
                       isOverdue 
                       ? 'bg-red-600 text-white hover:bg-red-700' 
                       : 'bg-indigo-600 text-white hover:bg-indigo-700'
                     } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                     {isUploading ? (selectedFileName ? `Uploading ${selectedFileName}...` : 'Uploading...') : `Upload ${displayName} ↑`}
                  </button>
                  
                  {isUploading && selectedFileName && (
                     <div className="w-full max-w-xs h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 animate-[shimmer_1.5s_infinite] w-1/2 rounded-full" />
                     </div>
                  )}

                  {!isUploading && (
                     <div className="text-xs text-slate-500 space-y-0.5">
                        <p>Accepted: PDF, DOC, DOCX</p>
                        <p>Max size: 10MB</p>
                     </div>
                  )}
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

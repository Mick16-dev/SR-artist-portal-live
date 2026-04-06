'use client'

import React, { useState, useRef, useEffect } from 'react'
import { format, isPast, isToday, differenceInDays } from 'date-fns'
import { toast } from 'sonner'

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
}

export function DocumentCard({ material, onUpload }: DocumentCardProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())
  const fileInputRef = useRef<HTMLInputElement>(null)

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
  const daysDiff = Math.abs(differenceInDays(deadlineDate, now))
  const isDeadlineToday = !isSubmitted && isToday(deadlineDate)

  // Determine state formatting
  let cardClass = ''
  let statusBadgeClass = ''
  let statusText = ''
  
  if (isSubmitted) {
    cardClass = 'border-emerald-200 bg-emerald-50/70'
    statusBadgeClass = 'bg-emerald-100 text-emerald-700 border border-emerald-200'
    const subDate = material.submitted_at ? format(new Date(material.submitted_at), 'MMMM d, yyyy') : 'Recently'
    statusText = `Submitted on ${subDate}`
  } else if (isOverdue) {
    cardClass = 'border-rose-200 bg-rose-50/70'
    statusBadgeClass = 'bg-rose-100 text-rose-700 border border-rose-200'
    statusText = `${daysDiff} days overdue`
  } else {
    cardClass = 'border-slate-200 bg-white'
    statusBadgeClass = 'bg-slate-100 text-slate-700 border border-slate-200'
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
    <div className={`rounded-2xl border p-6 shadow-sm transition-colors ${cardClass}`}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{displayName}</h3>
            {material.description && (
              <p className="mt-1 text-sm text-slate-600">{material.description}</p>
            )}
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass}`}>
            {statusText}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="rounded-md bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
            Due {format(deadlineDate, 'MMM d, yyyy')}
          </span>
          {isDeadlineToday && (
            <span className="text-amber-700 font-medium">Deadline is today</span>
          )}
          {isOverdue && (
            <span className="text-rose-700 font-medium">Please upload as soon as possible</span>
          )}
        </div>

        <div>
          {isSubmitted ? (
            <a
              href={material.file_url || '#'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              View submitted file
            </a>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors ${
                  isOverdue ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-700'
                } ${isUploading ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                {isUploading ? (selectedFileName ? `Uploading ${selectedFileName}...` : 'Uploading...') : `Upload ${displayName}`}
              </button>
              <p className="text-xs text-slate-500">Accepted: PDF, DOC, DOCX • Max size: 10MB</p>
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

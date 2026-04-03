'use client'

import { useState, useRef, useCallback } from 'react'
import { CheckCircle2, Clock, AlertCircle, Upload, ExternalLink, FileText, Loader2 } from 'lucide-react'
import { format, differenceInDays, isPast } from 'date-fns'
import { toast } from 'sonner'

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_SIZE_MB = 10

interface Material {
  id: string
  show_id: string
  artist_id: string
  item_name: string
  deadline: string
  status: string
  portal_token: string
  file_url: string | null
  submitted_at: string | null
  expires_at: string | null
}

interface DocumentCardProps {
  material: Material
  isShowPast: boolean
  onUploadSuccess: () => void
}

export function DocumentCard({ material, isShowPast, onUploadSuccess }: DocumentCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isSubmitted = material.status === 'submitted' || material.status === 'delivered'
  const deadline = material.deadline ? new Date(material.deadline) : null
  const isOverdue = !isSubmitted && deadline && isPast(deadline)
  const daysRemaining = deadline && !isOverdue
    ? differenceInDays(deadline, new Date())
    : null
  const daysOverdue = deadline && isOverdue
    ? differenceInDays(new Date(), deadline)
    : null

  const handleFile = useCallback(async (file: File) => {
    setUploadError(null)

    // Validate type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('This file type is not accepted. Please upload PDF, DOC, or DOCX.')
      return
    }

    // Validate size
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`This file is too large. Maximum size is ${MAX_SIZE_MB}MB. Please compress and try again.`)
      return
    }

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_MATERIAL_UPLOAD_WEBHOOK
    if (!webhookUrl) {
      setUploadError('Upload service is not configured. Please contact your promoter.')
      return
    }

    setIsUploading(true)
    setUploadProgress(10)

    try {
      const formData = new FormData()
      formData.append('portal_token', material.portal_token)
      formData.append('item_name', material.item_name)
      formData.append('file', file)

      setUploadProgress(40)

      const res = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
      })

      setUploadProgress(90)

      if (!res.ok) {
        throw new Error('Upload failed')
      }

      setUploadProgress(100)
      toast.success(`✅ ${material.item_name} submitted successfully!`)
      onUploadSuccess()
    } catch {
      setUploadError('Upload failed. Please check your internet connection and try again.')
      toast.error(`Upload failed for ${material.item_name}`)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [material, onUploadSuccess])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  // Card border + background based on state
  const cardClasses = isSubmitted
    ? 'border-l-4 border-l-success-500 bg-success-50 border border-success-100'
    : isOverdue
    ? 'border-l-4 border-l-danger-500 bg-danger-50 border border-danger-100'
    : 'border-l-4 border-l-primary-600 bg-white border border-gray-100'

  return (
    <div
      className={`rounded-xl p-6 transition-all ${cardClasses} ${isDragging ? 'ring-2 ring-primary-400 ring-offset-2' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isSubmitted ? 'bg-success-100' : isOverdue ? 'bg-danger-100' : 'bg-primary-50'
        }`}>
          <FileText size={20} className={isSubmitted ? 'text-success-600' : isOverdue ? 'text-danger-500' : 'text-primary-600'} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 leading-snug">{material.item_name}</h3>

          {/* Status badge */}
          {isSubmitted ? (
            <div className="flex items-center gap-2 mt-1">
              <CheckCircle2 size={16} className="text-success-500" />
              <span className="text-sm font-semibold text-success-600">
                Submitted{material.submitted_at ? ` — ${format(new Date(material.submitted_at), 'MMMM d, yyyy')}` : ''}
              </span>
            </div>
          ) : isOverdue ? (
            <div className="flex items-center gap-2 mt-1">
              <AlertCircle size={16} className="text-danger-500" />
              <span className="text-sm font-semibold text-danger-500">
                {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <Clock size={16} className="text-primary-500" />
              <span className="text-sm font-semibold text-primary-600">
                {daysRemaining === 0 ? 'Due today' : `${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Deadline */}
      {deadline && (
        <p className={`text-sm mb-4 font-medium ${isOverdue ? 'text-danger-500' : 'text-gray-500'}`}>
          Due: {format(deadline, 'EEEE, MMMM d yyyy')}
        </p>
      )}

      {/* Overdue urgent message */}
      {isOverdue && !isShowPast && (
        <p className="text-sm text-danger-600 font-semibold mb-4 bg-danger-50 rounded-lg px-3 py-2">
          ⚠️ Please submit this as soon as possible
        </p>
      )}

      {/* Dragging overlay */}
      {isDragging && (
        <div className="border-2 border-dashed border-primary-400 rounded-lg p-4 text-center mb-4 bg-primary-50">
          <p className="text-primary-600 font-semibold">Drop file here</p>
        </div>
      )}

      {/* Upload progress */}
      {isUploading && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 size={14} className="animate-spin text-primary-500" />
            <span className="text-sm text-gray-500 font-medium">Uploading...</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all duration-300 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {uploadError && (
        <div className="mb-4 bg-danger-50 border border-danger-100 rounded-lg px-4 py-3">
          <p className="text-sm text-danger-600 font-medium">{uploadError}</p>
        </div>
      )}

      {/* Actions */}
      {isSubmitted ? (
        material.file_url ? (
          <a
            href={material.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-success-600 font-semibold text-sm hover:text-success-700 transition-colors min-h-[44px] px-4 py-2 bg-white rounded-xl border border-success-200 hover:border-success-300"
          >
            <ExternalLink size={16} />
            View Submitted File
          </a>
        ) : null
      ) : isShowPast ? (
        <div className="text-sm text-gray-500 font-medium bg-gray-100 rounded-xl px-4 py-3">
          This show has passed. Uploads are disabled.
        </div>
      ) : (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleInputChange}
            disabled={isUploading}
            id={`upload-${material.id}`}
          />
          <label
            htmlFor={`upload-${material.id}`}
            className={`inline-flex items-center gap-2 font-semibold text-sm px-5 py-3 rounded-xl cursor-pointer transition-all min-h-[44px] ${
              isOverdue
                ? 'bg-danger-500 hover:bg-danger-600 text-white'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            } ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <Upload size={16} />
            Upload {material.item_name}
          </label>
          <p className="text-xs text-gray-400 mt-2 font-medium">
            Accepted: PDF, DOC, DOCX · Max size: {MAX_SIZE_MB}MB
          </p>
        </>
      )}
    </div>
  )
}

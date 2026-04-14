'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { translations, Language } from '@/lib/translations'

interface ProgressBarProps {
  total: number
  submittedCount: number
  lang: Language
}

export function ProgressBar({ total, submittedCount, lang }: ProgressBarProps) {
  const t = translations[lang]
  const percentage = total > 0 ? Math.round((submittedCount / total) * 100) : 0
  const isComplete = total > 0 && submittedCount === total

  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-bold text-[rgb(var(--muted-foreground))] uppercase tracking-widest">
           {isComplete ? t.handshake_complete : t.progress}
        </span>
        <span className="text-[10px] font-bold text-primary">{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-[rgb(var(--secondary))] rounded-full overflow-hidden border border-[rgb(var(--border))]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full ${isComplete ? 'bg-emerald-500' : 'bg-primary'}`}
        />
      </div>
    </div>
  )
}

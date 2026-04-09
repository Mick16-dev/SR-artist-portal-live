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

  if (isComplete) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex items-center gap-4 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl"
      >
        <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
          <Check size={20} strokeWidth={3} />
        </div>
        <div>
          <p className="text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-widest">{t.handshake_complete}</p>
          <p className="text-emerald-900 dark:text-emerald-100 font-bold text-sm tracking-tight pt-0.5">{t.assets_submitted}</p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="w-full space-y-4">
      <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 relative"
        >
          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:24px_24px] animate-[progress-stripe_2s_linear_infinite]" />
        </motion.div>
      </div>
    </div>
  )
}

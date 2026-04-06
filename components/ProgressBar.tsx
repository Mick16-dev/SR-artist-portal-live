'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface ProgressBarProps {
  total: number
  submittedCount: number
}

export function ProgressBar({ total, submittedCount }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((submittedCount / total) * 100) : 0
  const isComplete = total > 0 && submittedCount === total

  const getColor = () => {
    if (percentage <= 40) return 'bg-red-500'
    if (percentage <= 79) return 'bg-amber-500'
    if (percentage <= 99) return 'bg-indigo-600'
    return 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
  }

  if (isComplete) {
    return (
      <div className="w-full flex items-center justify-center gap-3 p-6 bg-emerald-50 border border-emerald-200 rounded-2xl">
        <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <span className="text-emerald-700 font-bold text-sm tracking-tight">All documents submitted. You're all set!</span>
      </div>
    )
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between text-slate-600 font-bold text-sm">
         <span>{submittedCount} of {total} documents submitted</span>
         <span className="text-slate-400">{percentage}%</span>
      </div>
      
      <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
          className={`h-full transition-colors duration-500 ${getColor()}`}
        />
      </div>
    </div>
  )
}

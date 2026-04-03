'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface ProgressBarProps {
  total: number
  submittedCount: number
}

export function ProgressBar({ total, submittedCount }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((submittedCount / total) * 100) : 0

  // Instruction: "0-40% → red, 41-79% → amber, 80-99% → indigo, 100% → emerald green"
  const getColor = () => {
    if (percentage <= 40) return 'bg-red-500'
    if (percentage <= 79) return 'bg-amber-500'
    if (percentage <= 99) return 'bg-indigo-600'
    return 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
  }

  const getLabel = () => {
    if (percentage === 0) return 'READY FOR SUBMISSION'
    if (percentage === 100) return 'ALL CLEAR — 100% SECURE'
    return `SUBMISSION SEQUENCE: ${percentage}%`
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] italic text-white/50">
         <span className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${percentage === 100 ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'}`} />
            {getLabel()}
         </span>
         <span>SECURE_DATA_FEED</span>
      </div>
      
      <div className="relative h-12 bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-inner group">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
          className={`h-full transition-colors duration-500 flex items-center justify-end px-4 ${getColor()}`}
        >
          {percentage > 15 && (
            <span className="text-[10px] font-black text-white uppercase tracking-widest pointer-events-none">
               {percentage}%
            </span>
          )}
        </motion.div>
        
        {/* Hardware-style grid overlay */}
        <div className="absolute inset-0 flex justify-between px-2 pointer-events-none opacity-10">
           {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="w-[1px] h-full bg-white" />
           ))}
        </div>
      </div>
      
      <div className="flex justify-between items-center pt-2">
         <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
               <div key={i} className={`w-3 h-1 rounded-full ${i < (percentage/20) ? getColor() : 'bg-white/5'}`} />
            ))}
         </div>
         <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.5em]">
            SHOWREADY_ENCRYPTION_ENABLED
         </p>
      </div>
    </div>
  )
}

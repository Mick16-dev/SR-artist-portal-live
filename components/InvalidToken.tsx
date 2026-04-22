'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert, Mail, ArrowLeft, ShieldX } from 'lucide-react'
import Link from 'next/link'

export function InvalidToken({ receivedToken }: { receivedToken?: string }) {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--foreground))] flex flex-col font-sans selection:bg-destructive/20 antialiased">
      {/* Top Nav Consistency */}
      <nav className="border-b border-[rgb(var(--border))] h-16 flex items-center px-4 sm:px-8 bg-[rgb(var(--background))]">
        <div className="max-w-7xl mx-auto w-full flex items-center gap-4">
           <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive text-white">
              <ShieldX size={18} />
           </div>
           <span className="text-sm font-bold tracking-tight uppercase">ShowTime</span>
           <span className="text-[rgb(var(--muted-foreground))]">/</span>
           <span className="text-sm font-medium text-[rgb(var(--muted-foreground))]">Access Error</span>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full">
           <div className="space-y-8 text-center sm:text-left">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
                 <ShieldAlert size={24} />
              </div>
              
              <div className="space-y-4">
                 <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-[rgb(var(--foreground))]">
                   Link <span className="text-destructive">Invalid.</span>
                 </h1>
                 <p className="text-xl text-[rgb(var(--muted-foreground))] font-medium leading-relaxed max-w-xl">
                   The production portal was unable to verify your security token. This link may have expired or been replaced by a newer version.
                 </p>
              </div>

              <div className="grid gap-4 pt-4">
                 <div className="group relative rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-8 shadow-sm transition-all hover:bg-[rgb(var(--secondary))]">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                       <div className="h-12 w-12 shrink-0 rounded-xl bg-destructive text-white flex items-center justify-center shadow-lg shadow-destructive/20">
                          <Mail size={20} />
                       </div>
                       <div className="text-center sm:text-left">
                          <h3 className="text-lg font-bold">Production Required</h3>
                          <p className="text-sm text-[rgb(var(--muted-foreground))] font-medium mt-1">
                             Please contact your Production Manager or Promoter directly to request a new secure access link for your show.
                          </p>
                       </div>
                    </div>
                 </div>

                 <button 
                   onClick={() => window.location.reload()}
                   className="flex items-center justify-center gap-2 h-12 w-full rounded-xl border border-[rgb(var(--border))] font-bold text-sm uppercase tracking-widest hover:bg-[rgb(var(--secondary))] transition-colors"
                 >
                   <ArrowLeft size={16} />
                   Try Again
                 </button>
              </div>
           </div>
        </div>
      </main>

      <footer className="py-12 border-t border-[rgb(var(--border))] bg-[rgb(var(--secondary))/30]">
        <div className="max-w-7xl mx-auto px-8 flex flex-col sm:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-3 opacity-40">
              <div className="h-6 w-6 rounded bg-[rgb(var(--foreground))] text-[rgb(var(--background))] flex items-center justify-center text-[8px] font-black">PS</div>
              <p className="text-[10px] font-bold uppercase tracking-widest">Authenticated Hub</p>
           </div>
           <p className="text-[9px] font-bold text-[rgb(var(--muted-foreground))] uppercase tracking-[0.3em]">
              Error Code: SEC_AUTH_FAILURE_403
           </p>
        </div>
      </footer>
    </div>
  )
}

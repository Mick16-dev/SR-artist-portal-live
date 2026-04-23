'use client'

import { motion } from 'framer-motion'
import { format } from 'date-fns'

const Icons = {
  Clock: () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
       <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Logo: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
       <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  )
}

export function ExpiredToken({ expiresAt, promoterEmail }: { expiresAt: string, promoterEmail: string }) {
  const formattedDate = format(new Date(expiresAt), 'MMMM do, yyyy')

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-amber-500/20 antialiased overflow-hidden text-white">
      {/* Utility Header */}
      <nav className="border-b border-white/5 flex items-center h-20 px-8 lg:px-12 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Icons.Logo />
             </div>
             <span className="text-2xl font-black tracking-tighter italic uppercase">ShowReady</span>
          </div>
          <div className="text-[10px] font-black text-amber-500 border border-amber-500/20 px-5 py-2 rounded-full uppercase tracking-[0.3em] bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
             Deadline Locked &bull; E-410
          </div>
        </div>
      </nav>

      {/* Expiry Core */}
      <main className="flex-1 flex flex-col items-center justify-center relative px-6 py-24 text-center">
        <div className="max-w-4xl mx-auto space-y-16">
           
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="text-amber-500"
           >
              <Icons.Clock />
           </motion.div>

           <div className="space-y-6">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-7xl lg:text-[10rem] font-black leading-[0.85] tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-br from-amber-500 to-amber-700 underline decoration-amber-500/20 decoration-8 underline-offset-[20px]"
              >
                 Time <br />
                 <span className="text-white/10">Expired.</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl lg:text-3xl text-white/40 font-bold max-w-2xl mx-auto leading-tight tracking-tight italic"
              >
                 Your material submission window closed on <span className="text-white">{formattedDate}</span>. Access has been restricted to protect the production timeline.
              </motion.p>
           </div>

           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.2 }}
             className="pt-10 flex flex-col items-center"
           >
              <div className="p-10 bg-amber-950/20 rounded-[3rem] border border-amber-900/30 backdrop-blur-3xl text-left max-w-xl shadow-2xl relative overflow-hidden group">
                 <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
                    <div className="w-16 h-16 bg-amber-600 rounded-3xl flex items-center justify-center text-white shrink-0 group-hover:bg-amber-500 transition-colors shadow-2xl shadow-amber-900/50">
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2.5"/><path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2.5"/></svg>
                    </div>
                    <div>
                       <h3 className="text-amber-500 text-xl font-black mb-1 uppercase tracking-tighter italic">Schedule Request</h3>
                       <p className="text-white/40 font-bold text-sm leading-relaxed italic">
                          If you need a deadline extension, please contact <span className="text-white">{promoterEmail}</span> immediately to unlock this portal.
                       </p>
                    </div>
                 </div>
                 <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 to-transparent pointer-events-none" />
              </div>
           </motion.div>
        </div>

        {/* Dynamic Atmosphere */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-30 blur-[180px] pointer-events-none animate-pulse">
           <div className="w-[800px] h-[800px] bg-amber-900 rounded-full" />
        </div>
      </main>

      {/* Professional Detail Detail Footer */}
      <footer className="py-20 bg-black flex flex-col items-center space-y-10 px-12 border-t border-white/5">
        <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em] text-center leading-loose">
           PRODUCTION CLOCK LOCKED &bull; PROTOCOL_DEADLINE_EXCEEDED &bull; HUB_E410
        </p>
        
        <div className="flex items-center gap-2 group transition-all">
           <span className="text-sm font-black text-white/20 tracking-tighter italic uppercase group-hover:text-amber-500">ShowReady</span>
        </div>
      </footer>
    </div>
  )
}

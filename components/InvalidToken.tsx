'use client'

import { motion } from 'framer-motion'

const Icons = {
  Alert: () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
       <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Logo: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
       <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  )
}

export function InvalidToken() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-red-500/20 antialiased overflow-hidden text-white">
      {/* Utility Header */}
      <nav className="border-b border-white/5 flex items-center h-20 px-8 lg:px-12 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Icons.Logo />
             </div>
             <span className="text-2xl font-black tracking-tighter italic uppercase underline decoration-indigo-600/50 decoration-4 underline-offset-4">ShowReady</span>
          </div>
          <div className="text-[10px] font-black text-red-500 border border-red-500/20 px-5 py-2 rounded-full uppercase tracking-[0.3em] bg-red-500/5 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
             System Error &bull; E-404
          </div>
        </div>
      </nav>

      {/* Error Core */}
      <main className="flex-1 flex flex-col items-center justify-center relative px-6 py-24 text-center">
        <div className="max-w-4xl mx-auto space-y-16">
           
           <motion.div
             initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
             animate={{ opacity: 1, scale: 1, rotate: 0 }}
             className="text-red-600"
           >
              <Icons.Alert />
           </motion.div>

           <div className="space-y-6">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-7xl lg:text-[10rem] font-black leading-[0.85] tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-red-800"
              >
                 Link <br />
                 <span className="text-white/10">Invalid.</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl lg:text-3xl text-white/40 font-bold max-w-2xl mx-auto leading-tight tracking-tight italic"
              >
                 The production portal was unable to verify your security token. This link may have been disabled or replaced.
              </motion.p>
           </div>

           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.2 }}
             className="pt-10 flex flex-col items-center"
           >
              <div className="p-10 bg-red-950/20 rounded-[3rem] border border-red-900/30 backdrop-blur-3xl text-left max-w-xl shadow-2xl relative overflow-hidden group">
                 <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
                    <div className="w-16 h-16 bg-red-600 rounded-3xl flex items-center justify-center text-white shrink-0 group-hover:bg-red-500 transition-colors shadow-2xl shadow-red-900/50">
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div>
                       <h3 className="text-red-500 text-xl font-black mb-1 uppercase tracking-tighter italic">Production Required</h3>
                       <p className="text-white/40 font-bold text-sm leading-relaxed italic">
                          Please contact your Production Manager or Promoter directly to request a new secure access link for your show.
                       </p>
                    </div>
                 </div>
                 <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent pointer-events-none" />
              </div>
           </motion.div>
        </div>

        {/* Dynamic Atmosphere Atmosphere */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-30 blur-[180px] pointer-events-none animate-pulse">
           <div className="w-[800px] h-[800px] bg-red-900 rounded-full" />
        </div>
      </main>

      {/* Professional Detail Detail Footer */}
      <footer className="py-20 bg-black flex flex-col items-center space-y-10 px-12 border-t border-white/5">
        <div className="flex items-center gap-6 opacity-20 hover:opacity-50 transition-opacity">
           <div className="w-px h-10 bg-white/30 rotate-12" />
           <Icons.Logo />
           <div className="w-px h-10 bg-white/30 -rotate-12" />
        </div>
        
        <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em] text-center leading-loose">
           SECURITY AUTHENTICATION FAILURE &bull; PROTOCOL_INVALID_TOKEN &bull; HUB_E404
        </p>
        
        <div className="flex items-center gap-2 group transition-all">
           <span className="text-sm font-black text-white/20 tracking-tighter italic uppercase group-hover:text-red-500">ShowReady</span>
        </div>
      </footer>
    </div>
  )
}

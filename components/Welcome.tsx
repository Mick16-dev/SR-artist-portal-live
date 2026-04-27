'use client'

import { motion } from 'framer-motion'

const Icons = {
  Connect: () => (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
       <path d="M11 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v7"/><rect x="14" y="14" width="8" height="8" rx="2"/><path d="M6 8h4"/><path d="M6 12h2"/>
    </svg>
  ),
  Logo: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
       <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  )
}

export function Welcome() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-indigo-600/30 selection:text-white antialiased overflow-hidden text-white">
      {/* Utility Header */}
      <nav className="border-b border-white/5 flex items-center h-20 px-8 lg:px-12 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Icons.Logo />
             </div>
             <span className="text-2xl font-black tracking-tighter italic">ShowReady</span>
          </div>
          <div className="text-[10px] font-black text-white/40 border border-white/10 px-5 py-2 rounded-full uppercase tracking-[0.3em]">
             Production Environment
          </div>
        </div>
      </nav>

      {/* Kinetic Core */}
      <main className="flex-1 flex flex-col items-center justify-center relative px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto space-y-12">
           
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="text-indigo-500"
           >
              <Icons.Connect />
           </motion.div>

           <div className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-5xl lg:text-8xl font-black leading-[0.9] tracking-tighter uppercase italic"
              >
                 Your Portal. <br />
                 <span className="text-white/10">Simplified.</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg lg:text-xl text-white/40 font-bold max-w-2xl mx-auto leading-snug tracking-tight italic"
              >
                 The high-end gateway for artists to securely manage critical production documents and technical requirements.
              </motion.p>
           </div>

           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="pt-6 flex flex-col items-center"
           >
              <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-3xl text-left max-w-lg shadow-2xl relative overflow-hidden group">
                 <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
                    <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-white shrink-0 group-hover:bg-indigo-600 transition-colors">
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <div>
                       <h3 className="text-white text-xl font-black mb-1 uppercase tracking-tighter italic">Secure Access Required</h3>
                       <p className="text-white/40 font-bold text-sm leading-relaxed italic">
                          This is a private production tool. Please use the unique secure link provided in your invite email from the promoter.
                       </p>
                    </div>
                 </div>
                 <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent pointer-events-none" />
              </div>
           </motion.div>
        </div>

        {/* Dynamic Background Atmosphere */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-30 blur-[180px] pointer-events-none animate-pulse">
           <div className="w-[800px] h-[800px] bg-indigo-900 rounded-full" />
        </div>
      </main>

      {/* Hardware Details Footer */}
      <footer className="py-20 border-t border-white/5 bg-black px-12">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
            <div className="space-y-4">
               <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/20">System Specifications</h4>
               <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] leading-loose max-w-xs">
                  End-to-End Encryption &bull; Real-Time Production Sync &bull; Automated Material Auditing &bull; Made for Tours
               </p>
            </div>
            
            <div className="flex items-center gap-10">
               <div className="space-y-2">
                  <span className="block text-[9px] font-black text-white/10 uppercase tracking-[0.3em]">Uptime</span>
                  <span className="block text-xl font-black tracking-tighter italic">99.9% LIVE</span>
               </div>
               <div className="space-y-2">
                  <span className="block text-[9px] font-black text-white/10 uppercase tracking-[0.3em]">Latency</span>
                  <span className="block text-xl font-black tracking-tighter italic">0.02ms SSR</span>
               </div>
            </div>
         </div>
         
         <div className="mt-20 pt-10 border-t border-white/5 flex flex-col items-center">
            <div className="flex items-center gap-2 opacity-20 hover:opacity-50 transition-opacity mb-4">
               <Icons.Logo />
               <span className="text-sm font-black tracking-tighter italic">ShowReady</span>
            </div>
            <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.5em]">
               AUTHORISED PRODUCTION HUB &copy; MMXXVI
            </p>
         </div>
      </footer>
    </div>
  )
}

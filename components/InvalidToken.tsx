'use client'

import { AlertCircle, Mail } from 'lucide-react'

interface InvalidTokenProps {
  promoterEmail?: string
}

export function InvalidToken({ promoterEmail }: InvalidTokenProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 animate-fade-in text-center max-w-sm mx-auto">
      {/* Header Logo */}
      <div className="mb-12">
        <div className="flex items-center gap-2 justify-center mb-1">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">ShowReady</span>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertCircle size={32} />
        </div>
        
        <h1 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">
          This link is not valid
        </h1>
        
        <p className="text-gray-500 font-medium text-base mb-10 leading-relaxed">
          This portal link doesn&apos;t exist or has already been used. Please contact your promoter for a new link.
        </p>

        <a
          href={promoterEmail ? `mailto:${promoterEmail}` : '#'}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl transition-all active:scale-[0.98] min-h-[56px] shadow-lg shadow-gray-200"
        >
          <Mail size={18} />
          Contact your promoter
        </a>
      </div>

      <footer className="mt-12 text-gray-400 text-sm font-medium">
        Powered by ShowReady
      </footer>
    </div>
  )
}

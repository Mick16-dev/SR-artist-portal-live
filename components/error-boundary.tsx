'use client'

import React from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Portal Error Boundary]:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-slate-900/50 rounded-2xl border border-red-500/20 backdrop-blur-sm">
          <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="text-red-500 h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 italic tracking-tight">Portal Encountered an Issue</h2>
          <p className="text-slate-400 text-sm max-w-md mb-8 leading-relaxed">
            We had a temporary issue loading the portal. Try refreshing the page to sync back up with the production roster.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-black uppercase text-xs tracking-widest rounded-full hover:bg-slate-200 transition-all active:scale-95"
          >
            <RefreshCcw size={14} />
            Reload Portal
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

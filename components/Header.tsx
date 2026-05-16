"use client"

import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Header() {
  const { data: session } = useSession()
  const [userColor, setUserColor] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (!session?.user?.id) return
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => { if (data?.color) setUserColor(data.color) })
  }, [session?.user?.id])

  const initial = session?.user?.name?.[0]?.toUpperCase() ?? "?"

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">

        {/* Left: logo + nav */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-slate-900 leading-none">Calendarium</h1>
              <p className="text-xs text-slate-400">Calendario familiar</p>
            </div>
          </div>

          {session && (
            <nav className="flex items-center gap-1">
              <Link
                href="/"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/"
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Calendario</span>
              </Link>
              <Link
                href="/matchbox"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === "/matchbox"
                    ? "bg-orange-50 text-orange-600"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M5 17H3a2 2 0 01-2-2v-4a2 2 0 012-2h1l2-3h12l2 3h1a2 2 0 012 2v4a2 2 0 01-2 2h-2M7 17a2 2 0 104 0 2 2 0 00-4 0zm6 0a2 2 0 104 0 2 2 0 00-4 0z" />
                </svg>
                <span className="hidden sm:inline">Matchbox</span>
              </Link>
            </nav>
          )}
        </div>

        {/* Right: user area */}
        {session ? (
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm transition-colors duration-300"
                style={{ backgroundColor: userColor ?? "#94a3b8" }}
              >
                {initial}
              </div>
              <div className="leading-tight hidden sm:block">
                <p className="text-xs text-slate-400">Hola,</p>
                <p className="text-sm font-semibold text-slate-800">{session.user?.name}</p>
              </div>
            </div>

            <div className="w-px h-6 bg-slate-200" />

            <button
              onClick={() => signOut()}
              className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Salir
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}

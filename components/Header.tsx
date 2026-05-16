"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import Image from "next/image"

export default function Header() {
  const { data: session } = useSession()

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">
              Calendarium
            </h1>
            <p className="text-xs text-slate-400">Calendario familiar</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <div className="flex items-center gap-2.5">
                {session.user?.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "Usuario"}
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-slate-200"
                  />
                )}
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-700 leading-none">
                    {session.user?.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {session.user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Salir
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium shadow-sm"
            >
              Iniciar sesión
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

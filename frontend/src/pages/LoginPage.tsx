import { Logo } from '@/components/Logo'
import { Button, Input } from '@/components/ui/primitives'
import { useApp } from '@/store/AppStore'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

export function LoginPage() {
  const app = useApp()
  const nav = useNavigate()
  if (app.session) return <Navigate to="/" replace />
  const [email, setEmail] = useState('engineer@aerosync.demo')
  const [password, setPassword] = useState('demo')

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050814] p-6">
      <div className="glass w-full max-w-md rounded-2xl p-8">
        <Logo />
        <h1 className="mt-4 font-display text-2xl font-bold">Fleet operations sign-in</h1>
        <p className="mt-2 text-sm text-slate-400">
          Demo-only authentication stored in this browser. Not an airline identity provider. Password for all seeded accounts is{' '}
          <code>demo</code>.
        </p>
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (app.login(email, password)) nav('/')
          }}
        >
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="username" />
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" />
          <Button className="w-full" type="submit">
            Enter command center
          </Button>
        </form>
        <div className="mt-4 space-y-1 text-xs text-slate-500">
          {app.data.users.map((u) => (
            <button
              key={u.id}
              className="block text-left hover:text-cyan-300"
              onClick={() => {
                setEmail(u.email)
                setPassword('demo')
              }}
            >
              {u.email} — {u.role.replaceAll('_', ' ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

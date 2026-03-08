import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { AuthScaffold } from '../components/AuthScaffold'
import { TextField } from '../components/TextField'
import { supabase } from '../lib/supabase'

export function LoginPage() {
  const { isConfigured, session } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (session) {
      navigate('/me', { replace: true })
    }
  }, [navigate, session])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('请输入邮箱和密码。')
      return
    }

    setSubmitting(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setSubmitting(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    navigate('/me', { replace: true })
  }

  return (
    <AuthScaffold
      description="请输入注册邮箱和密码登录系统，登录后可查看个人资料、推荐码与证件提交状态。"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/forgot-password">忘记密码？</Link>
          <span>
            还没有账号？ <Link to="/register">立即注册</Link>
          </span>
        </div>
      }
      spotlightBody="为业务员提供统一登录入口，登录后可进入个人中心查看账号状态、推荐码以及身份证件审核进度。"
      spotlightPoints={['业务员登录入口', '个人资料集中查看', '登录后进入个人中心']}
      spotlightTitle="柏盛管理系统"
      title="欢迎登录"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextField
          autoComplete="email"
          disabled={!isConfigured || submitting}
          label="邮箱"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
        <TextField
          autoComplete="current-password"
          disabled={!isConfigured || submitting}
          label="密码"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="请输入密码"
          required
          type="password"
          value={password}
        />

        {error ? (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <button className="glass-button w-full" disabled={!isConfigured || submitting} type="submit">
          {submitting ? '登录中...' : '登录'}
        </button>
      </form>
    </AuthScaffold>
  )
}

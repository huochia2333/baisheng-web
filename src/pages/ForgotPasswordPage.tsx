import { type FormEvent, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { AuthScaffold } from '../components/AuthScaffold'
import { TextField } from '../components/TextField'
import { hasLetterAndNumber, passwordRuleText } from '../lib/password'
import { supabase } from '../lib/supabase'

function detectRecoveryMode(search: string, hash: string) {
  const searchParams = new URLSearchParams(search)
  const hashParams = new URLSearchParams(hash.replace(/^#/, ''))

  return (
    searchParams.get('type') === 'recovery' ||
    hashParams.get('type') === 'recovery' ||
    searchParams.has('access_token') ||
    hashParams.has('access_token')
  )
}

export function ForgotPasswordPage() {
  const { isConfigured } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const isRecoveryMode = useMemo(
    () => detectRecoveryMode(location.search, location.hash),
    [location.hash, location.search],
  )

  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)

    if (!email.trim()) {
      setError('请输入注册邮箱。')
      return
    }

    setSubmitting(true)

    const { error: requestError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/forgot-password`,
    })

    setSubmitting(false)

    if (requestError) {
      setError(requestError.message)
      return
    }

    setNotice('密码重置邮件已发送，请查收邮箱并按邮件指引完成修改。')
  }

  async function handleResetSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)

    if (newPassword.trim().length < 6) {
      setError(passwordRuleText)
      return
    }

    if (!hasLetterAndNumber(newPassword)) {
      setError(passwordRuleText)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致。')
      return
    }

    setSubmitting(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      setSubmitting(false)
      setError(updateError.message)
      return
    }

    await supabase.auth.signOut()
    window.history.replaceState({}, document.title, '/forgot-password')
    setSubmitting(false)
    navigate('/login', { replace: true })
  }

  return (
    <AuthScaffold
      description={
        isRecoveryMode
          ? '请设置新的登录密码，保存后即可返回登录页面重新进入系统。'
          : '请输入注册邮箱，我们会向该邮箱发送密码重置邮件。'
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>记起密码了？</span>
          <Link to="/login">返回登录</Link>
        </div>
      }
      spotlightBody="如忘记密码，可通过注册邮箱快速完成重置。验证成功后，再使用新密码登录柏盛管理系统。"
      spotlightPoints={['通过邮箱找回密码', '设置新密码后重新登录', '全程自助完成']}
      spotlightTitle="柏盛管理系统"
      title={isRecoveryMode ? '设置新密码' : '找回密码'}
    >
      <form className="space-y-4" onSubmit={isRecoveryMode ? handleResetSubmit : handleRequestSubmit}>
        {isRecoveryMode ? (
          <>
            <TextField
              autoComplete="new-password"
              disabled={!isConfigured || submitting}
              label="新密码"
              minLength={6}
              name="newPassword"
              note={passwordRuleText}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="至少 6 位，需包含字母和数字"
              required
              type="password"
              value={newPassword}
            />
            <TextField
              autoComplete="new-password"
              disabled={!isConfigured || submitting}
              label="确认新密码"
              minLength={6}
              name="confirmPassword"
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="再次输入新密码"
              required
              type="password"
              value={confirmPassword}
            />
          </>
        ) : (
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
        )}

        {error ? (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
        {notice ? (
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-50">
            {notice}
          </div>
        ) : null}

        <button className="glass-button w-full" disabled={!isConfigured || submitting} type="submit">
          {submitting ? '处理中...' : isRecoveryMode ? '确认修改密码' : '发送重置邮件'}
        </button>
      </form>
    </AuthScaffold>
  )
}

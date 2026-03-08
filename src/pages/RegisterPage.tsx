import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { AuthScaffold } from '../components/AuthScaffold'
import { TextField } from '../components/TextField'
import { hasLetterAndNumber, passwordRuleText } from '../lib/password'
import { supabase } from '../lib/supabase'

export function RegisterPage() {
  const { isConfigured, session } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (session) {
      navigate('/me', { replace: true })
    }
  }, [navigate, session])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)

    if (!name.trim() || !email.trim() || !phone.trim() || !password || !referralCode.trim()) {
      setError('用户名、邮箱、手机号、密码和邀请码都需要填写。')
      return
    }

    if (password.trim().length < 6) {
      setError(passwordRuleText)
      return
    }

    if (!hasLetterAndNumber(password)) {
      setError(passwordRuleText)
      return
    }

    setSubmitting(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
          phone: phone.trim(),
          referral_code: referralCode.trim(),
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })

    setSubmitting(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    setNotice('注册成功。请先查收邮箱并完成验证，验证通过后再返回登录。')
    setPassword('')
  }

  return (
    <AuthScaffold
      description="请填写用户名、邮箱、手机号、密码和邀请码完成注册，提交后按邮箱提示完成验证即可登录。"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>
            已有账号？ <Link to="/login">返回登录</Link>
          </span>
          <Link to="/forgot-password">忘记密码？</Link>
        </div>
      }
      spotlightBody="面向业务员的注册入口。注册完成后，可在个人中心查看账号信息、推荐码，并提交身份证或护照信息。"
      spotlightPoints={['邀请码注册', '手机号同步保存', '注册后进入个人中心']}
      spotlightTitle="柏盛管理系统"
      title="创建账号"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <TextField
          autoComplete="name"
          disabled={!isConfigured || submitting}
          label="用户名"
          name="name"
          onChange={(event) => setName(event.target.value)}
          placeholder="请输入用户名"
          required
          value={name}
        />
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
          autoComplete="tel"
          disabled={!isConfigured || submitting}
          label="手机号"
          name="phone"
          onChange={(event) => setPhone(event.target.value)}
          placeholder="请输入手机号"
          required
          type="tel"
          value={phone}
        />
        <TextField
          autoComplete="new-password"
          disabled={!isConfigured || submitting}
          label="密码"
          minLength={6}
          name="password"
          note={passwordRuleText}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="至少 6 位，需包含字母和数字"
          required
          type="password"
          value={password}
        />
        <TextField
          disabled={!isConfigured || submitting}
          label="邀请码"
          name="referralCode"
          note="请输入有效邀请码后再完成注册。"
          onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
          placeholder="请输入邀请码"
          required
          value={referralCode}
        />

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
          {submitting ? '注册中...' : '注册'}
        </button>
      </form>
    </AuthScaffold>
  )
}

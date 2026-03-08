import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { ConfigBanner } from '../components/ConfigBanner'
import { TextField } from '../components/TextField'
import { decodeJwtPayload } from '../lib/jwt'
import { supabase } from '../lib/supabase'

type ProfileRow = {
  email: string | null
  name: string | null
  referral_code: string | null
  status: string | null
}

type PrivacyDataRow = {
  id_card: string | null
  passport: string | null
}

type PrivacyRequestRow = {
  created_at: string
  id: string
  id_card_requests: string | null
  passport_requests: string | null
  review_at: string | null
  status: string
  type: boolean
}

type PendingReviewRow = {
  created_at: string
  email: string | null
  id_card_requests: string | null
  name: string | null
  passport_requests: string | null
  request_id: string
  status: string
  type: boolean
  user_id: string
}

type DashboardSnapshot = {
  adminPendingRequests: PendingReviewRow[]
  latestPendingRequest: PrivacyRequestRow | null
  latestRequest: PrivacyRequestRow | null
  privacyData: PrivacyDataRow | null
  profile: ProfileRow | null
  referralCode: string | null
}

const roleLabels: Record<string, string> = {
  administrator: '管理员',
  client: '客户',
  finance: '财务',
  manager: '经理',
  operator: '运营',
  salesman: '业务员',
}

const statusLabels: Record<string, string> = {
  active: '正常',
  denied: '已拒绝',
  inactive: '未激活',
  pass: '已通过',
  pending: '待审核',
  suspended: '已停用',
}

function formatRole(value: unknown) {
  if (typeof value !== 'string' || !value) {
    return '未设置'
  }

  return roleLabels[value] ?? value
}

function formatStatus(value: string | null | undefined) {
  if (!value) {
    return '未设置'
  }

  return statusLabels[value] ?? value
}

function formatDate(value: string | null) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function maskSensitive(value: string | null | undefined) {
  if (!value) {
    return '未填写'
  }

  if (value.length <= 6) {
    return value
  }

  return `${value.slice(0, 2)}${'•'.repeat(Math.max(4, value.length - 4))}${value.slice(-2)}`
}

function MeInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300/60">{label}</p>
      <p className="mt-3 break-words text-lg font-medium text-white">{value}</p>
    </div>
  )
}

export function MePage() {
  const { isConfigured, session, signOut, user } = useAuth()
  const navigate = useNavigate()

  const [dashboard, setDashboard] = useState<DashboardSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submittingPrivacy, setSubmittingPrivacy] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null)
  const [privacyError, setPrivacyError] = useState<string | null>(null)
  const [privacyNotice, setPrivacyNotice] = useState<string | null>(null)
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [adminError, setAdminError] = useState<string | null>(null)
  const [adminNotice, setAdminNotice] = useState<string | null>(null)
  const [idCard, setIdCard] = useState('')
  const [passport, setPassport] = useState('')
  const [reloadToken, setReloadToken] = useState(0)

  const tokenAppMetadata = useMemo(() => {
    const payload = decodeJwtPayload(session?.access_token)
    const metadata = payload?.app_metadata

    return metadata && typeof metadata === 'object' ? metadata : {}
  }, [session?.access_token])

  const rawRole = typeof tokenAppMetadata.role === 'string' ? tokenAppMetadata.role : ''
  const isAdministrator = rawRole === 'administrator'
  const role = useMemo(() => formatRole(rawRole), [rawRole])

  useEffect(() => {
    if (!user?.id) {
      return
    }

    const userId = user.id
    let active = true

    async function fetchDashboard() {
      setLoading(true)
      setLoadError(null)
      setAdminError(null)

      const [profileResult, referralResult, privacyDataResult, privacyRequestsResult, adminPendingResult] =
        await Promise.all([
          supabase
            .from('user_profiles')
            .select('name, email, status, referral_code')
            .eq('user_id', userId)
            .maybeSingle(),
          supabase
            .from('referral_code')
            .select('code')
            .eq('owner_user_id', userId)
            .maybeSingle(),
          supabase
            .from('user_privacy_data')
            .select('passport, id_card')
            .eq('user_id', userId)
            .maybeSingle(),
          supabase
            .from('user_privacy_requests')
            .select('id, status, passport_requests, id_card_requests, created_at, review_at, type')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(5),
          isAdministrator
            ? supabase
                .from('pending_user_privacy_requests')
                .select(
                  'request_id, user_id, name, email, passport_requests, id_card_requests, status, type, created_at',
                )
                .order('created_at', { ascending: true })
            : Promise.resolve({ data: [], error: null }),
        ])

      if (!active) {
        return
      }

      const firstError =
        profileResult.error ?? referralResult.error ?? privacyDataResult.error ?? privacyRequestsResult.error

      if (firstError) {
        setLoading(false)
        setLoadError(firstError.message)
        return
      }

      if (adminPendingResult.error) {
        setAdminError(adminPendingResult.error.message)
      }

      const requests = (privacyRequestsResult.data as PrivacyRequestRow[] | null) ?? []
      const profile = (profileResult.data as ProfileRow | null) ?? null
      const latestPendingRequest = requests.find((request) => request.status === 'pending') ?? null

      setDashboard({
        adminPendingRequests: (adminPendingResult.data as PendingReviewRow[] | null) ?? [],
        latestPendingRequest,
        latestRequest: requests[0] ?? null,
        privacyData: (privacyDataResult.data as PrivacyDataRow | null) ?? null,
        profile,
        referralCode: ((referralResult.data as { code: string } | null)?.code ?? profile?.referral_code) ?? null,
      })
      setLoading(false)
    }

    void fetchDashboard()

    return () => {
      active = false
    }
  }, [isAdministrator, reloadToken, user?.id])

  async function handlePasswordReset() {
    if (!user?.email) {
      setPasswordError('当前账号缺少邮箱，无法发送重置邮件。')
      return
    }

    setPasswordError(null)
    setPasswordNotice(null)
    setSendingReset(true)

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/forgot-password`,
    })

    setSendingReset(false)

    if (error) {
      setPasswordError(error.message)
      return
    }

    setPasswordNotice('修改密码邮件已发送，请前往注册邮箱继续后续步骤。')
  }

  async function handlePrivacySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPrivacyError(null)
    setPrivacyNotice(null)

    if (!user) {
      setPrivacyError('当前未检测到有效登录状态。')
      return
    }

    const nextIdCard = idCard.trim()
    const nextPassport = passport.trim()

    if (!nextIdCard && !nextPassport) {
      setPrivacyError('身份证号和护照号至少填写一项。')
      return
    }

    if (dashboard?.latestPendingRequest) {
      setPrivacyError('你已有待审核申请，当前不能重复提交。')
      return
    }

    setSubmittingPrivacy(true)

    const { error } = await supabase.from('user_privacy_requests').insert({
      id_card_requests: nextIdCard || null,
      passport_requests: nextPassport || null,
      user_id: user.id,
    })

    setSubmittingPrivacy(false)

    if (error) {
      setPrivacyError(error.message)
      return
    }

    setIdCard('')
    setPassport('')
    setPrivacyNotice('资料已提交，正在等待审核。')
    setReloadToken((current) => current + 1)
  }

  async function handleReviewRequest(requestId: string, action: 'approve' | 'deny') {
    setAdminError(null)
    setAdminNotice(null)
    setReviewingRequestId(requestId)

    const functionName =
      action === 'approve' ? 'approve_user_privacy_request' : 'deny_user_privacy_request'

    const { error } = await supabase.rpc(functionName, {
      _request_id: requestId,
    })

    setReviewingRequestId(null)

    if (error) {
      setAdminError(error.message)
      return
    }

    setAdminNotice(action === 'approve' ? '已批准该审核申请。' : '已拒绝该审核申请。')
    setReloadToken((current) => current + 1)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  const profile = dashboard?.profile
  const latestRequest = dashboard?.latestRequest
  const latestPendingRequest = dashboard?.latestPendingRequest
  const privacyData = dashboard?.privacyData
  const adminPendingRequests = dashboard?.adminPendingRequests ?? []
  const status = formatStatus(profile?.status ?? (tokenAppMetadata.status as string | undefined))

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[-12%] top-10 h-72 w-72 rounded-full bg-cyan-300/16 blur-3xl" />
        <div className="absolute right-[-8%] top-24 h-80 w-80 rounded-full bg-orange-300/12 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl space-y-6">
        <ConfigBanner />

        <header className="glass-panel flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/75">柏盛管理系统</p>
            <h1 className="text-3xl font-semibold text-white">我的账号中心</h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-200/70">
              查看当前账号状态、推荐码与证件审核进度，管理员可直接处理待审核申请。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="ghost-button"
              disabled={!isConfigured || sendingReset}
              onClick={handlePasswordReset}
              type="button"
            >
              {sendingReset ? '发送中...' : '修改密码'}
            </button>
            <button className="ghost-button" onClick={handleSignOut} type="button">
              退出登录
            </button>
          </div>
        </header>

        {passwordError ? (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
            {passwordError}
          </div>
        ) : null}
        {passwordNotice ? (
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-50">
            {passwordNotice}
          </div>
        ) : null}
        {loadError ? (
          <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
            {loadError}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MeInfoCard label="用户状态" value={status} />
          <MeInfoCard label="用户角色" value={role} />
          <MeInfoCard label="用户名称" value={profile?.name?.trim() || '未设置'} />
          <MeInfoCard label="邮箱" value={profile?.email || user?.email || '未设置'} />
          <MeInfoCard label="推荐码" value={dashboard?.referralCode || '未生成'} />
        </section>

        {isAdministrator ? (
          <section className="glass-panel px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <span className="info-chip">待审核</span>
                <h2 className="text-2xl font-semibold text-white">证件审核列表</h2>
                <p className="text-sm leading-7 text-slate-200/70">
                  仅管理员可见。你可以直接批准或拒绝待审核的身份证与护照申请。
                </p>
              </div>
              <span className="info-chip">当前 {adminPendingRequests.length} 条待处理</span>
            </div>

            {adminError ? (
              <div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
                {adminError}
              </div>
            ) : null}
            {adminNotice ? (
              <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-50">
                {adminNotice}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4">
              {adminPendingRequests.length > 0 ? (
                adminPendingRequests.map((request) => {
                  const isBusy = reviewingRequestId === request.request_id

                  return (
                    <article
                      key={request.request_id}
                      className="rounded-3xl border border-white/10 bg-slate-950/20 p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="info-chip">{request.type ? '首次提交' : '资料更新'}</span>
                            <span className="info-chip">{formatStatus(request.status)}</span>
                          </div>
                          <div className="space-y-1 text-sm leading-7 text-slate-100/80">
                            <p>姓名：{request.name?.trim() || '未填写'}</p>
                            <p>邮箱：{request.email || '未填写'}</p>
                            <p>提交时间：{formatDate(request.created_at)}</p>
                            <p>身份证号：{maskSensitive(request.id_card_requests)}</p>
                            <p>护照号：{maskSensitive(request.passport_requests)}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            className="inline-flex items-center justify-center rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isBusy}
                            onClick={() => void handleReviewRequest(request.request_id, 'approve')}
                            type="button"
                          >
                            {isBusy ? '处理中...' : '批准'}
                          </button>
                          <button
                            className="inline-flex items-center justify-center rounded-2xl border border-rose-200/20 bg-rose-200/10 px-4 py-3 text-sm font-semibold text-rose-50 transition hover:bg-rose-200/20 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isBusy}
                            onClick={() => void handleReviewRequest(request.request_id, 'deny')}
                            type="button"
                          >
                            {isBusy ? '处理中...' : '拒绝'}
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })
              ) : (
                <div className="rounded-3xl border border-white/10 bg-slate-950/20 px-5 py-6 text-sm leading-7 text-slate-200/70">
                  当前没有待审核申请。
                </div>
              )}
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="glass-panel px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <span className="info-chip">证件提交</span>
                <h2 className="text-2xl font-semibold text-white">身份证 / 护照提交通道</h2>
                <p className="text-sm leading-7 text-slate-200/70">
                  至少填写一项即可提交，资料会先进入审核队列，不会直接写入正式资料。
                </p>
              </div>
              {latestPendingRequest ? <span className="info-chip">当前有待审核申请</span> : null}
            </div>

            <form className="mt-6 space-y-4" onSubmit={handlePrivacySubmit}>
              <TextField
                disabled={!isConfigured || submittingPrivacy || Boolean(latestPendingRequest)}
                label="身份证号"
                name="idCard"
                note="至少填写一项，可与护照号同时提交。"
                onChange={(event) => setIdCard(event.target.value)}
                placeholder="请输入身份证号"
                value={idCard}
              />
              <TextField
                disabled={!isConfigured || submittingPrivacy || Boolean(latestPendingRequest)}
                label="护照号"
                name="passport"
                onChange={(event) => setPassport(event.target.value)}
                placeholder="请输入护照号"
                value={passport}
              />

              {privacyError ? (
                <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
                  {privacyError}
                </div>
              ) : null}
              {privacyNotice ? (
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-50">
                  {privacyNotice}
                </div>
              ) : null}

              <button
                className="glass-button w-full sm:w-auto"
                disabled={!isConfigured || loading || submittingPrivacy || Boolean(latestPendingRequest)}
                type="submit"
              >
                {submittingPrivacy ? '提交中...' : latestPendingRequest ? '待审核中，暂不可重复提交' : '提交审核'}
              </button>
            </form>
          </section>

          <section className="space-y-6">
            <div className="glass-panel px-6 py-6">
              <span className="info-chip">已存档资料</span>
              <h2 className="mt-4 text-2xl font-semibold text-white">已存档证件信息</h2>
              <div className="mt-5 grid gap-4">
                <MeInfoCard label="身份证号" value={maskSensitive(privacyData?.id_card)} />
                <MeInfoCard label="护照号" value={maskSensitive(privacyData?.passport)} />
              </div>
            </div>

            <div className="glass-panel px-6 py-6">
              <span className="info-chip">审核进度</span>
              <h2 className="mt-4 text-2xl font-semibold text-white">最近一次申请</h2>
              {loading ? (
                <p className="mt-4 text-sm leading-7 text-slate-200/70">正在加载资料...</p>
              ) : latestRequest ? (
                <div className="mt-5 space-y-4 text-sm text-slate-100/80">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="info-chip">{formatStatus(latestRequest.status)}</span>
                    <span className="info-chip">{latestRequest.type ? '首次提交' : '资料更新'}</span>
                  </div>
                  <div className="space-y-2">
                    <p>提交时间：{formatDate(latestRequest.created_at)}</p>
                    <p>审核时间：{formatDate(latestRequest.review_at)}</p>
                    <p>身份证号：{maskSensitive(latestRequest.id_card_requests)}</p>
                    <p>护照号：{maskSensitive(latestRequest.passport_requests)}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-7 text-slate-200/70">你还没有提交过身份证或护照信息。</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

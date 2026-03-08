import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function ProtectedRoute() {
  const { loading, session } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass-panel w-full max-w-md px-6 py-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300/70">
            柏盛管理系统
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-white">正在验证登录状态</h1>
          <p className="mt-3 text-sm leading-7 text-slate-200/72">
            稍等片刻，系统正在读取当前会话和权限信息。
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

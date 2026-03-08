import { hasSupabaseEnv } from '../lib/env'

export function ConfigBanner() {
  if (hasSupabaseEnv) {
    return null
  }

  return (
    <div className="rounded-2xl border border-amber-300/20 bg-amber-200/10 px-4 py-3 text-sm leading-6 text-amber-50">
      系统连接配置未完成，请联系管理员检查当前站点的环境设置。
    </div>
  )
}

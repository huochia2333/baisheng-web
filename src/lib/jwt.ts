type JwtPayload = Record<string, unknown> & {
  app_metadata?: Record<string, unknown>
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = globalThis.atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))

  return new TextDecoder().decode(bytes)
}

export function decodeJwtPayload(token?: string | null): JwtPayload | null {
  if (!token) {
    return null
  }

  const segments = token.split('.')

  if (segments.length < 2) {
    return null
  }

  try {
    return JSON.parse(decodeBase64Url(segments[1])) as JwtPayload
  } catch {
    return null
  }
}

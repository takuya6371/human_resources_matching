// ユーザー入力のURLをhrefにそのまま渡すと javascript: 等の危険なスキームを
// 注入されうるため、http/https のみ許可する。
export function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

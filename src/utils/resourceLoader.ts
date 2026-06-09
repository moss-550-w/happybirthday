/** 生产环境资源前缀（CDN）；为空则用同源 public/。 */
export function assetUrl(path: string): string {
  const cdn = import.meta.env.VITE_ASSET_CDN?.replace(/\/$/, '') ?? '';
  const base = import.meta.env.BASE_URL ?? '/';
  const clean = path.replace(/^\//, '');
  return cdn ? `${cdn}/${clean}` : `${base}${clean}`;
}

/** Promise 超时包装；超时 reject TimeoutError，不影响原 Promise 自身结算。 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label = 'resource',
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new DOMException(`${label} 加载超时 (${ms}ms)`, 'TimeoutError'));
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

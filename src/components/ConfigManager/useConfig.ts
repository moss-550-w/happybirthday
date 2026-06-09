/**
 * 个性化配置读取（占位）。
 * TODO(M4): 优先级 URL 参数 > public/config/birthday.json > localStorage 覆盖；
 *           禁止硬编码姓名/祝福语。
 */
export interface BirthdayConfig {
  name: string;
  message: string;
  music?: string;
}

const DEFAULT_CONFIG: BirthdayConfig = {
  name: 'Friend',
  message: 'Happy Birthday!',
};

export function useConfig(): BirthdayConfig {
  return DEFAULT_CONFIG;
}

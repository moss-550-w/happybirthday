import { assetUrl, withTimeout } from '@/utils/resourceLoader';
import {
  DEFAULT_CONFIG,
  OVERRIDE_KEY,
  type BirthdayConfig,
  type ConfigFile,
  type ConfigOverride,
} from './configTypes';

/** 读取 URL 参数（含 template_id 解析交给调用方拼装）。 */
export function readUrlParams(): {
  name?: string;
  message?: string;
  music?: string;
  templateId?: number;
} {
  const p = new URLSearchParams(window.location.search);
  const name = p.get('name')?.trim() || undefined;
  const message = p.get('message')?.trim() || undefined;
  const music = p.get('music')?.trim() || undefined;
  const tid = p.get('template_id');
  const templateId = tid && /^\d+$/.test(tid) ? Number(tid) : undefined;
  return { name, message, music, templateId };
}

/** 读取 localStorage 覆盖（页内编辑保存的祝福语）。 */
export function readOverride(): ConfigOverride {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ConfigOverride;
    return {
      name: typeof parsed.name === 'string' ? parsed.name : undefined,
      message: typeof parsed.message === 'string' ? parsed.message : undefined,
    };
  } catch {
    return {};
  }
}

/** 写入 localStorage 覆盖。 */
export function writeOverride(override: ConfigOverride): void {
  try {
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(override));
  } catch {
    /* 忽略持久化失败（隐私模式等） */
  }
}

/** 拉取 public/config/birthday.json；失败返回空。 */
export async function fetchConfigFile(): Promise<ConfigFile> {
  try {
    const res = await withTimeout(
      fetch(assetUrl('config/birthday.json'), { cache: 'no-cache' }),
      4000,
      'config',
    );
    if (!res.ok) return {};
    return (await res.json()) as ConfigFile;
  } catch {
    console.warn('[config] birthday.json 加载失败，使用默认/URL 配置');
    return {};
  }
}

/**
 * 解析最终配置。优先级（高→低）：
 *   URL 参数 > localStorage 覆盖 > JSON(模板/根) > 默认。
 * music 仅来自 URL / JSON（不参与页内编辑）。
 */
export function resolveConfig(
  urlParams: ReturnType<typeof readUrlParams>,
  override: ConfigOverride,
  file: ConfigFile,
): BirthdayConfig {
  // JSON 层：template_id 命中则用模板，否则用根字段
  let jsonName = file.name;
  let jsonMessage = file.message;
  if (urlParams.templateId != null && file.templates) {
    const tpl = file.templates.find((t) => t.id === urlParams.templateId);
    if (tpl) {
      jsonName = tpl.name ?? jsonName;
      jsonMessage = tpl.message ?? jsonMessage;
    }
  }

  const name =
    urlParams.name ?? override.name ?? jsonName ?? DEFAULT_CONFIG.name;
  const message =
    urlParams.message ??
    override.message ??
    jsonMessage ??
    DEFAULT_CONFIG.message;
  const music = urlParams.music ?? (file.music || undefined);

  return { name, message, music };
}

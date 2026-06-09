export interface BirthdayConfig {
  name: string;
  message: string;
  music?: string;
}

export interface ConfigTemplate {
  id: number;
  name: string;
  message: string;
}

/** public/config/birthday.json 结构 */
export interface ConfigFile {
  name?: string;
  message?: string;
  music?: string;
  templates?: ConfigTemplate[];
}

/** 用户在页内编辑后存入 localStorage 的覆盖项 */
export interface ConfigOverride {
  name?: string;
  message?: string;
}

export const DEFAULT_CONFIG: BirthdayConfig = {
  name: 'Friend',
  message: 'Happy Birthday!',
};

export const OVERRIDE_KEY = 'ar-bday-config';

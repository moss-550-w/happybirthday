import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  fetchConfigFile,
  readOverride,
  readUrlParams,
  resolveConfig,
  writeOverride,
} from './configLoader';
import {
  DEFAULT_CONFIG,
  type BirthdayConfig,
  type ConfigFile,
  type ConfigOverride,
} from './configTypes';

interface ConfigContextValue {
  config: BirthdayConfig;
  /** JSON 是否仍在加载（首帧用 URL/默认，加载后合并） */
  loading: boolean;
  /** 页内编辑：更新祝福语并持久化 */
  updateGreeting: (patch: { name?: string; message?: string }) => void;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const urlParams = useMemo(() => readUrlParams(), []);
  const [file, setFile] = useState<ConfigFile>({});
  const [override, setOverride] = useState<ConfigOverride>(() => readOverride());
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    fetchConfigFile().then((f) => {
      if (mounted.current) {
        setFile(f);
        setLoading(false);
      }
    });
    return () => {
      mounted.current = false;
    };
  }, []);

  const config = useMemo(
    () => resolveConfig(urlParams, override, file),
    [urlParams, override, file],
  );

  const updateGreeting = useMemo(
    () => (patch: { name?: string; message?: string }) => {
      setOverride((prev) => {
        const next: ConfigOverride = {
          name: patch.name ?? prev.name,
          message: patch.message ?? prev.message,
        };
        writeOverride(next);
        return next;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({ config, loading, updateGreeting }),
    [config, loading, updateGreeting],
  );

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

export function useConfigContext(): ConfigContextValue {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    // 容错：未包裹 Provider 时退回默认，不抛错阻塞渲染
    return {
      config: DEFAULT_CONFIG,
      loading: false,
      updateGreeting: () => {},
    };
  }
  return ctx;
}

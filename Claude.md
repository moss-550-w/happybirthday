# Claude.md

## 项目身份

**项目名称**：AR 生日祝福贺卡系统（改进版）  
**核心定位**：Web 端 AR 互动生日贺卡，支持实体卡片 + 手机扫码识别，触发 3D 蛋糕、轻量粒子、祝福文字与背景音乐。  
**技术栈**：React 18 + Vite + MindAR + @react-three/fiber + Canvas 2D 粒子  
**部署环境**：GitHub Pages + 可选 CDN（jsDelivr / Cloudflare R2）  

---

## 开发环境要求

- Node.js 18+ 或 20+
- npm / yarn / pnpm 均可
- 现代浏览器（Chrome / Safari iOS 14+ / Android Chrome 88+）

---

## 快速开始

```bash
git clone <repo-url>
cd ar-birthday-card
npm install
npm run dev          # 开发模式，默认 http://localhost:5173
npm run build        # 生产构建，输出 dist/
npm run preview      # 预览构建结果
```

---

## 技术选型（核心约束）

| 领域 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 18 | 使用函数组件 + Hooks，禁止 class 组件 |
| 构建工具 | Vite | 快速热更新，低打包体积 |
| AR 追踪 | **MindAR** (image tracking) | 禁止使用 AR.js（追踪稳定性不足） |
| 3D 渲染 | @react-three/fiber + @react-three/drei | 声明式 Three.js，禁止直接操作 Three.js 实例 |
| 粒子特效 | Canvas 2D API（轻量） | 默认使用，Three.js 粒子仅作为 fallback |
| 音频 | Web Audio API + HTML5 Audio | 必须配合用户手势激活 |
| 样式 | TailwindCSS 或 CSS Modules | 保持模块化，禁止全局污染 |
| 状态管理 | React Context + useReducer | 简单场景下 useState/useEffect 足够 |

---

## 项目目录结构（推荐）

```
src/
├── components/
│   ├── ARScene/               # AR 追踪 + 3D 场景容器
│   │   ├── ARScene.tsx
│   │   └── ARScene.module.css
│   ├── CakeModel/             # 蛋糕 3D 模型组件
│   │   └── CakeModel.tsx
│   ├── ParticleEffect/        # 轻量粒子特效
│   │   ├── Canvas2DParticles.tsx
│   │   └── useParticleFallback.ts
│   ├── AudioController/       # 音乐控制（手势激活）
│   │   └── AudioController.tsx
│   ├── ConfigManager/         # URL 参数 + JSON 配置
│   │   └── useConfig.ts
│   └── PerformanceMonitor/    # 帧率检测 & 降级
│       └── usePerformanceMonitor.ts
├── hooks/                     # 通用 hooks
├── utils/                     # 工具函数
│   ├── arHelper.ts            # MindAR 初始化和销毁
│   ├── performance.ts         # 设备性能评估
│   └── resourceLoader.ts      # 带超时重试的资源加载
├── assets/
│   ├── models/                # GLB 蛋糕模型（< 600KB）
│   ├── music/                 # 背景音乐（mp3, < 1MB）
│   ├── targets/               # .mind 标记图文件
│   └── textures/              # 贴图（webp 优先）
├── config/                    # 静态配置
│   └── birthday.json
├── App.tsx
├── main.tsx
└── index.css
```

---

## 核心开发规范

### 1. AR 追踪模块（MindAR）

- **初始化时机**：用户主动点击屏幕后（同时请求摄像头权限）。
- **标记图文件**：放置在 `public/` 或通过 CDN 加载，禁止硬编码内联。
- **追踪回调**：必须监听 `targetFound` / `targetLost` 事件，控制粒子/音乐的启停。
- **矩阵应用**：使用 `matrixAutoUpdate=false` 直接赋给模型组，避免每帧重新计算。

```ts
// 正确用法示例
const modelRef = useRef();
useEffect(() => {
  if (targetFound && modelRef.current) {
    modelRef.current.matrix.copy(arMatrix);
    modelRef.current.matrixAutoUpdate = false;
  }
}, [targetFound, arMatrix]);
```

### 2. 3D 渲染（@react-three/fiber）

- **阴影**：移动端默认禁用阴影映射，除非明确需要且经过性能测试。
- **纹理**：最大分辨率 1024x1024，格式 webp/jpg。
- **模型面数**：≤ 15k 三角形。
- **内存释放**：组件卸载时调用 `gltf.scene.traverse((obj) => obj.isMesh && obj.geometry.dispose())`。

### 3. 粒子特效（轻量优先）

- **默认方案**：Canvas 2D 粒子，数量 ≤ 50，禁用透明度混合（使用实心圆）。
- **触发时长**：仅在识别成功后前 4 秒内播放烟花，之后转为静态光晕或停止。
- **降级策略**：若 `getGPUInfo` 或帧率监测发现设备性能低于阈值，完全禁用粒子。

### 4. 音频播放（手势激活）

- **必须等待用户点击**：页面初始化时显示“点击屏幕开始”覆盖层。
- **点击后**：初始化 AudioContext，预加载音乐但不播放。
- **识别成功后**：调用 `audio.play()`，若失败静默降级（不阻塞 AR）。
- **静音按钮**：提供开关并记住用户偏好（localStorage）。

### 5. 配置管理（动态个性化）

- 优先读取 URL 参数：`?name=Lisa&message=HappyBirthday&music=url`
- 其次读取 `/config/birthday.json`（提供默认预设）
- 支持本地存储覆盖：允许用户在页面内修改祝福语并保存。
- 禁止硬编码姓名或祝福语在组件中。

### 6. 性能监控与自动降级

- 使用 `requestAnimationFrame` 采样帧率，连续 30 帧低于 25fps 则触发降级。
- 降级行为：关闭粒子、关闭阴影、降低模型细节（如果有 LOD）、关闭半透明效果。
- 提示用户“已切换为流畅模式”，提供恢复按钮（重新尝试高质量模式）。

---

## 容错与降级清单（必须实现）

| 场景 | 处理方式 |
|------|----------|
| 浏览器不支持 `navigator.mediaDevices` | 显示“当前浏览器不支持摄像头”，并提供纯 3D 手动观看模式。 |
| 摄像头权限被拒绝 | 显示引导弹窗，告知如何重新授权。 |
| MindAR 初始化失败 | 切换到纯 3D 模式（无追踪），允许手动旋转模型。 |
| 30 秒内未识别到目标图 | 弹出提示“请确保卡片完整出现在画面中”，显示标记图示例。 |
| GLB 模型加载超时（> 5 秒） | 显示立方体占位 + 文字“模型加载失败，祝福不变”。 |
| 背景音乐加载失败 | 静默失败，控制台记录 warn。 |
| 帧率持续低于 20fps | 自动降级特效，并提示用户关闭其他应用。 |

---

## 部署指引

### GitHub Pages 设置

1. 在 `vite.config.ts` 中设置 `base: '/<repo-name>/'`（如果使用组织/项目页）。
2. 构建后确保 `dist/` 中包含 `.nojekyll` 文件。
3. 在 GitHub 仓库 Settings → Pages 中设置分支为 `gh-pages` 或 `main` 下的 `/docs` 文件夹。

### 资源 CDN 加速（推荐）

- 将 `models/`、`music/`、`targets/` 上传到 jsDelivr 或 Cloudflare R2。
- 修改 `public/config.json` 中的资源 URL 前缀。
- 主 HTML 和 JS 仍托管在 GitHub Pages，跨域问题需在 CDN 配置 CORS。

### 环境变量

- `.env.production` 中配置 `VITE_ASSET_CDN` 用于生产环境资源路径。

---

## 测试重点

### 必测设备
- iPhone 8 / SE2 (iOS 14+ Safari)
- 小米 8 / Redmi Note 9 (Android 10+ Chrome)
- 低端机：Redmi 9A 或类似配置

### 必测场景
1. 正常光线下的卡片识别与跟随
2. 暗光环境（需提示增加照明）
3. 快速移动卡片（追踪抖动容忍度）
4. 无网络情况（Service Worker 缓存）
5. 音乐自动播放策略（首次点击后激活）
6. 识别丢失后重新找回的延迟

### 性能指标（必须满足）
- 首屏加载时间 < 2s (Fast 3G)
- 模型加载成功后 1 秒内完成首次渲染
- 平均帧率 ≥ 25fps (中低端机)
- 内存占用 ≤ 200MB

---

## 已知限制与未来扩展方向

### 当前版本限制
- 仅支持单张标记图同时追踪（多图需要额外配置）。
- 不支持 Android 低版本 WebView（如微信内置浏览器，部分可能缺失 WebGL 2 支持）。
- 烟花特效为 2D 屏幕空间，不与 3D 模型深度融合。

### 后续可扩展
- 支持用户上传自定义图片，在线生成 .mind 文件。
- 增加“生日快乐”语音录制并替换背景音乐。
- 接入 WebGPU 提升粒子性能（等到浏览器支持率 > 80%）。
- 提供多语言国际化（i18n）。

---

## 协作注意事项

- **Commit 规范**：`feat:` `fix:` `docs:` `perf:` `refactor:` 遵循 Conventional Commits。
- **代码审查重点**：AR 生命周期管理、内存泄漏、移动端帧率、资源加载错误处理。
- **提交前检查**：运行 `npm run lint` 和 `npm run type-check`（TypeScript 严格模式）。
- **禁止引入大型库**：如 Three.js 完整示例库（应使用 `drei` 替代）、lodash（可用原生方法）。

---

## 关键文档引用

- [MindAR 官方文档](https://github.com/hiukim/mind-ar-js)
- [@react-three/fiber 文档](https://docs.pmnd.rs/react-three-fiber)
- [Vite 部署 GitHub Pages 指南](https://vitejs.dev/guide/static-deploy.html#github-pages)
- [WebRTC 适配问题排查](https://webrtc.github.io/webrtc-org/web-rtc-adapter/)

---

> 本文件用于向 Claude 或团队成员提供项目上下文。任何偏离上述规范的建议都应经过技术评审。如遇冲突，以本文件为准。
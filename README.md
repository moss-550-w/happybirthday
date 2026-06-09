# 🎂 AR 生日祝福贺卡系统

> Web 端 AR 互动生日贺卡：打印/显示标记卡片，手机扫码打开网页，对准卡片即触发 3D 蛋糕、轻量粒子烟花、悬浮祝福文字与背景音乐。

基于 **MindAR 图像追踪 + React Three Fiber**，面向中低端移动设备优化，免安装、扫码即用、可离线。

---

## ✨ 特性

- **图像追踪 AR**：MindAR（WebAssembly + TensorFlow.js）稳定识别，抗光照干扰
- **声明式 3D**：React Three Fiber 渲染，MindAR 仅提供追踪矩阵，渲染层完全解耦
- **轻量粒子**：Canvas 2D 烟花（≤50 实心圆），识别成功后 4 秒，之后转静态光晕
- **手势激活音频**：符合浏览器自动播放策略，静音偏好持久化
- **动态个性化**：`URL 参数 > localStorage > JSON > 默认` 配置链，页内编辑祝福语
- **性能自动降级**：帧率监控，连续 30 帧 < 25fps 自动关闭特效并提示
- **完整容错**：无摄像头 / 权限拒绝 / 初始化失败 / 识别超时 / 模型超时 / 音频失败，逐项降级
- **PWA 离线**：壳秒开，AR 重资源运行时缓存，断网可用，可装至主屏
- **首屏 ~53KB gzip**：three / mind-ar（含 tfjs）经动态边界懒加载，点击激活后才下载

---

## 🛠 技术栈

| 领域 | 选型 |
|------|------|
| 框架 | React 18 + TypeScript（strict） |
| 构建 | Vite 5 |
| AR 追踪 | MindAR 1.2.5（底层 `Controller` API） |
| 3D 渲染 | @react-three/fiber v8 + @react-three/drei v9 + three 0.169 |
| 粒子 | Canvas 2D |
| 音频 | HTML5 Audio + 手势激活 |
| 状态 | React Context + useReducer |
| 离线 | vite-plugin-pwa（Workbox） |
| 样式 | CSS Modules |

> 单一 `three` 实例由 `overrides` 强制统一，避免 drei 间接依赖引入版本分裂。

---

## 🚀 快速开始

```bash
# 环境：Node 18+ / 20+ / 22
npm install

npm run dev          # 开发模式 http://localhost:5173
npm run dev:https    # 自签名 HTTPS + 局域网（真机调试，iOS 摄像头强制 HTTPS）
npm run build        # 生产构建 → dist/
npm run preview      # 预览构建（验证 PWA / Service Worker）
```

### 真机调试

iOS Safari 的摄像头要求 HTTPS。手机与电脑同局域网时：

```bash
npm run dev:https
# 手机访问 https://<电脑局域网IP>:5173/ → 接受自签名证书警告
```

---

## 📜 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器（HMR） |
| `npm run dev:https` | HTTPS + 局域网，真机调试 |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run preview` | 预览 dist（含 Service Worker） |
| `npm run lint` | ESLint 检查 |
| `npm run type-check` | TypeScript 严格模式检查 |
| `npm run format` | Prettier 格式化 |
| `npm run gen:cake` | 程序化生成 `public/models/cake.glb` |
| `npm run gen:icons` | 生成 PWA 图标（零依赖） |

---

## 📁 目录结构

```
src/
├── components/
│   ├── ARScene/            # AR 编排：状态机 + Context + 追踪 hook + R3F 画布 + 容错 UI
│   ├── CakeModel/          # 蛋糕模型：GLB 加载（5s 超时）+ 程序化兜底
│   ├── ParticleEffect/     # Canvas 2D 烟花粒子 + 降级判定
│   ├── AudioController/    # 手势激活音频 + 静音按钮
│   ├── ConfigManager/      # 配置链 + 页内编辑祝福语
│   ├── PerformanceMonitor/ # 帧率采样 + 自动降级
│   └── UpdatePrompt/       # PWA 更新 / 离线就绪提示
├── hooks/                  # useServiceWorker 等通用 hooks
├── utils/                  # arHelper（AR 生命周期）/ performance / resourceLoader
├── types/                  # mind-ar 类型声明
├── App.tsx · main.tsx · index.css
public/
├── config/birthday.json    # 默认配置 + 模板预设
├── models/cake.glb         # 蛋糕模型（程序化生成，可替换为美术精模）
├── targets/card.mind       # MindAR 标记图 + card.png 样例
└── icons/                  # PWA 图标
scripts/                    # gen-cake-glb / gen-icons（构建期工具）
```

---

## ⚙️ 个性化配置

优先级（高 → 低）：**URL 参数 > localStorage（页内编辑）> `birthday.json` > 默认**

### URL 参数

```
?name=Lisa&message=生日快乐&music=https://cdn/xxx.mp3&template_id=1
```

| 参数 | 说明 |
|------|------|
| `name` | 称呼 |
| `message` | 祝福语 |
| `music` | 背景音乐 URL（音量 30% 循环） |
| `template_id` | 命中 `birthday.json` 中的模板预设 |

### JSON 模板（`public/config/birthday.json`）

```json
{
  "name": "Friend",
  "message": "Happy Birthday!",
  "music": "",
  "templates": [
    { "id": 1, "name": "经典", "message": "生日快乐！愿你被世界温柔以待" }
  ]
}
```

页内底部「✎ 编辑祝福」可当场修改并保存到 localStorage，下次自动沿用。

---

## 🛡 容错与降级

| 场景 | 处理 |
|------|------|
| 不支持摄像头 / WebGL | 提示 + 纯 3D 手动观看模式 |
| 摄像头权限被拒 | 引导弹窗 + 重新授权 / 纯 3D |
| MindAR 初始化失败 | 切换纯 3D 模式（OrbitControls 手动旋转） |
| 30 秒未识别 | 提示 + 标记图样例 |
| GLB 加载超时（5s） | 回退程序化蛋糕（祝福不减） |
| 背景音乐失败 | 静默降级，不阻塞 AR |
| 帧率持续低 | 自动关闭粒子 + 「已切换为流畅模式」+ 恢复按钮 |

---

## 📦 部署（GitHub Pages）

本仓库已配置 GitHub Actions 自动部署（`.github/workflows/deploy.yml`）：
推送到 `main` 即触发 **类型检查 → Lint → 构建 → 部署**。

### 一次性设置

1. GitHub 仓库 → **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**
2. 推送到 `main`，Actions 自动构建并发布
3. 访问 `https://moss-550-w.github.io/happybirthday/`

> `vite.config.ts` 设 `base: './'`，产物全相对路径，天然兼容项目页子路径，
> 无需写死仓库名。`dist/` 含 `.nojekyll`、`sw.js`、`manifest.webmanifest`。

### 手动构建发布（可选）

```bash
npm run build   # → dist/
# 将 dist/ 发布到 gh-pages 分支或 main 的 /docs
```

### 资源 CDN 加速（可选）

`.env.production` 配置 `VITE_ASSET_CDN`，将 `models/` `music/` `targets/` 上传至
jsDelivr / Cloudflare R2，并配置 CORS。运行时资源前缀自动切换。

---

## 🎯 性能目标

| 指标 | 目标 |
|------|------|
| 首屏加载（Fast 3G） | < 2s |
| 首屏体积 | ~53KB gzip（壳 + React） |
| 平均帧率（中低端机） | ≥ 25fps |
| 内存占用 | ≤ 200MB |

> 真机设备矩阵（iPhone 8 / 骁龙 660 级安卓 / Redmi 9A）测试需在实机进行。

---

## 🔄 替换蛋糕模型

将美术制作的 `.glb`（< 600KB，≤ 15k 三角形）覆盖 `public/models/cake.glb` 即可，代码零改动。加载失败自动回退程序化蛋糕。

---

## 📄 许可证

[MIT](./LICENSE) © 2026 MOSS

---

## 🔗 参考

- [MindAR](https://github.com/hiukim/mind-ar-js)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)

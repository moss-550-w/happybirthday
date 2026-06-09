# AR 生日祝福贺卡系统 —— 工程计划（Engineering Plan）

> 配套文档：`design.md`（方案设计）、`Claude.md`（开发规范，冲突时以 Claude.md 为准）
> 版本：v1.0　|　适用：单人开发　|　预估工期：约 13 个工作日（不含 3D 资产制作）

---

## 一、计划目标与交付定义

| 项 | 内容 |
|----|------|
| 最终交付 | 部署在 GitHub Pages 的可用 AR 生日贺卡网页，扫码即用 |
| 验收标准 | 中低端机平均帧率 ≥ 25fps；首屏 < 2s(Fast 3G)；内存 ≤ 200MB；全部容错场景可降级不崩溃 |
| 开发原则 | 风险前置、最小原型先行、每个里程碑产出可运行制品（增量可验证） |
| 不做的事 | 在线 `.mind` 生成、语音录制、WebGPU、i18n（列为 Phase 2，本计划不含） |

---

## 二、技术决策锁定（消除 design.md 中的模糊项）

> 文档中存在 `.ts/.tsx` 与 `.jsx` 混用、样式二选一、包管理三选一等模糊点。本计划统一锁定如下默认值，如需调整在 M0 前提出。

| 决策项 | 锁定值 | 理由 |
|--------|--------|------|
| 语言 | **TypeScript（strict）** | Claude.md 要求 `type-check` + 严格模式，目录结构用 `.tsx` |
| 样式 | **CSS Modules** | 目录已出现 `ARScene.module.css`；避免引入 Tailwind 额外构建配置 |
| 包管理 | **pnpm** | 体积小、装包快；锁 `pnpm-lock.yaml` |
| 状态管理 | Context + useReducer（仅全局 AR 状态机），局部用 useState | 符合 Claude.md |
| **React 版本** | **React 18** | Claude.md 强制；**连带锁定 @react-three/fiber v8**（R3F v9 需 React 19） |
| three / drei | 跟随 R3F v8 的 peer 范围，**three 版本由 MindAR 反向约束**（见风险 R1） | 避免双 three 实例 |
| Node | 20 LTS | 文档要求 18+/20+ |

**版本锁定策略**：`package.json` 全部用精确版本（无 `^`），首次安装后立即提交 lockfile。

---

## 三、里程碑与排期（M0 → M6）

| 里程碑 | 目标（可验证产出） | 预估 | 关键风险 |
|--------|-------------------|------|----------|
| **M0 项目骨架** | Vite+React18+TS 工程跑通，目录/别名/lint/type-check/CI 就绪 | 1d | 低 |
| **M1 集成 Spike（最高优先）** | MindAR 与 R3F 集成方案验证通过，真机出帧率数据 | 2d | **极高（R1）** |
| **M2 AR 追踪 + 3D 蛋糕** | 真机识别卡片，蛋糕跟随、浮动、`targetFound/Lost` 生效 | 3d | 高 |
| **M3 特效/音频/性能降级** | Canvas2D 粒子、手势激活音频、帧率自动降级闭环 | 3d | 中 |
| **M4 配置 + 全量降级模式** | URL/JSON/localStorage 配置链、无 AR fallback、容错清单 7 项 | 2d | 中 |
| **M5 联调与真机优化** | 必测设备 × 必测场景全过，达成性能指标 | 2d | 中 |
| **M6 部署上线** | GitHub Pages + CDN 资源 + 首张标记图 + 使用文档 | 1d | 低 |

> 总计约 14 人日（含 M1 spike 比 design.md 多 1 天，用于前置消解最大风险）。

---

## 四、任务分解（WBS，按里程碑）

### M0 项目骨架
- [ ] `pnpm create vite` (react-ts) + 清理模板
- [ ] 建立 Claude.md 规定的完整 `src/` 目录结构（占位文件 + index 导出）
- [ ] 配置 `tsconfig`（strict）、路径别名 `@/`、`vite.config.ts`（`base`、`https` 本地证书供摄像头调试）
- [ ] ESLint + Prettier + `type-check` 脚本；可选 husky 预提交
- [ ] `.nojekyll`、`.env.production`（`VITE_ASSET_CDN`）、`config/birthday.json` 默认预设
- [ ] 占位资产：cake.glb（临时立方体）、target.mind（官方示例图）、bgm.mp3

### M1 集成 Spike ⚠️ 决定后续架构，必须先做
- [ ] 验证 MindAR 与 R3F 的集成路线（见第六节 R1，二选一）
- [ ] 真机（iPhone 8 / 骁龙 660 级安卓）跑通：摄像头视频流 + 单模型跟随
- [ ] 采集基线帧率，确认 three 版本兼容，**输出 spike 结论文档**（更新本计划）

### M2 AR 追踪 + 3D 蛋糕
- [ ] `utils/arHelper.ts`：MindAR 初始化/销毁，摄像头流释放
- [ ] AR 全局状态机（reducer）：`idle→requesting→tracking→found/lost→fallback`
- [ ] `ARScene`：点击激活 → 请求权限 → start；矩阵 `matrixAutoUpdate=false` 应用
- [ ] `CakeModel`：`useLoader` 加载 GLB、缩放 0.4、上下浮动（**不旋转**）、卸载 `dispose()`
- [ ] 光照：环境光 + 方向光，**禁用阴影**；`setPixelRatio` 上限 2

### M3 特效 / 音频 / 性能
- [ ] `Canvas2DParticles`：≤50 实心圆烟花，识别后 4s → 转静态光晕；绝对定位叠加层
- [ ] `useParticleFallback` + `getGPUInfo`：低端设备直接禁用粒子
- [ ] `AudioController`：手势激活 AudioContext、预载不播、识别成功 play、静音开关存 localStorage、音量 30% 循环
- [ ] `usePerformanceMonitor`：rAF 采样，连续 30 帧 <25fps → 降级（关粒子/阴影/半透明）+ 提示 + 恢复按钮

### M4 配置 + 降级模式
- [ ] `useConfig`：优先级 URL 参数 > `birthday.json` > localStorage；禁止硬编码祝福语
- [ ] 页面内修改祝福语并存 localStorage
- [ ] 纯 3D fallback：无摄像头/MindAR 失败时手动旋转观看
- [ ] 容错清单 7 项全部落地（见第七节）

### M5 联调优化
- [ ] 必测设备 × 6 必测场景矩阵执行，记录帧率/识别率
- [ ] 懒加载 GLB（识别成功后再加载）、骨架屏、首屏体积裁剪
- [ ] Service Worker 缓存（无网络场景）
- [ ] 内存/泄漏排查（反复进出 AR、切后台）

### M6 部署
- [ ] `vite build` + `.nojekyll`，gh-pages 发布
- [ ] 资源上传 jsDelivr/R2 + CORS，切换 `VITE_ASSET_CDN`
- [ ] 生成首张标记图 PDF + 使用说明文档（发送方/接收方流程）

---

## 五、模块依赖与构建顺序

```
M0 骨架
  └─ M1 集成 Spike（解锁架构）
        └─ M2 AR追踪 ──┬─ M3 粒子（依赖 targetFound 事件）
                       ├─ M3 音频（依赖 targetFound + 手势）
                       └─ M3 性能监控（依赖渲染循环）
                              └─ M4 配置/降级 ── M5 联调 ── M6 部署
```

底层依赖：`arHelper` ← `ARScene` ← 各特效模块；`useConfig` 为全局横切，M2 即可接入读取。

---

## 六、关键技术风险与前置验证（必须在 M1 解决）

| ID | 风险 | 影响 | 应对 / 验证方式 |
|----|------|------|----------------|
| **R1** | **MindAR 与 R3F 集成冲突**：`MindARThree` 自带 renderer/scene/camera 且直接操作 three.js，与 R3F「声明式、禁止直接操作 three 实例」相矛盾 | **架构级，最高** | M1 Spike 二选一：① 用 MindAR 底层 `Controller` 拿视频帧+matrix，渲染层完全交给 R3F（更符合规范，复杂度高）；② 让 R3F 复用 MindARThree 的 renderer/camera。**优先方案①**，失败回退② |
| R2 | three 版本双实例 / peer 冲突（MindAR 内置 three vs R3F 依赖 three） | 构建/运行报错 | 锁定单一 three 版本，`resolutions`/`overrides` 去重，M1 验证 |
| R3 | iOS Safari 摄像头需 HTTPS + 用户手势，本地调试受限 | 开发效率 | M0 配本地 https 证书；真机走局域网 https |
| R4 | 中低端机帧率不达标 | 验收 | M1 即出基线数据，降级策略 M3 闭环兜底 |
| R5 | 微信内置浏览器 WebGL2/getUserMedia 缺失 | 部分用户不可用 | 检测能力 → 引导外部浏览器打开 + 纯 3D fallback |

> **R1 是本项目成败关键**，M1 未通过前不进入 M2，避免返工。

---

## 七、容错降级落地映射（Claude.md 必须实现项）

| 场景 | 触发检测 | 降级动作 | 归属 |
|------|----------|----------|------|
| 无 `mediaDevices` | 能力检测 | 纯 3D 手动观看 | M4 |
| 权限被拒 | getUserMedia catch | 引导弹窗重授权 | M2/M4 |
| MindAR 初始化失败 | start() catch | 纯 3D 模式 | M4 |
| 30s 未识别 | 计时器 | 提示 + 标记图样例 | M2 |
| GLB 超时 >5s | resourceLoader 超时 | 立方体占位 + 文案 | M2 |
| 音乐加载失败 | audio onerror | 静默 + console.warn | M3 |
| 帧率持续 <20fps | perfMonitor | 关特效 + 提示 | M3 |

---

## 八、测试与验收

- **设备矩阵**：iPhone 8/SE2、小米 8/Redmi Note 9、Redmi 9A
- **场景矩阵**：正常光、暗光、快速移动、无网络、音频激活、丢失重识别
- **性能门禁**：首屏 <2s、识别后 1s 内渲染、平均 ≥25fps、内存 ≤200MB
- **提交前**：`pnpm lint` + `pnpm type-check` 必过

---

## 九、立即可执行的下一步

1. 确认第二节技术锁定项（默认即可，可调整：样式 / 包管理 / Node 版本）
2. **执行 M0**：初始化工程骨架
3. **执行 M1 Spike**：优先验证 R1（MindAR × R3F 集成），出真机帧率结论后再展开 M2+

> 建议严格按 M0 → M1 → M2 顺序推进；M1 是不可跳过的风险闸门。
</content>
</invoke>

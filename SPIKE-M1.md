# M1 集成 Spike 结论

> 目标：验证 R1（MindAR × R3F 集成）与 R2（three 版本统一），为 M2+ 锁定架构。
> 状态：**代码集成全链路打通；真机帧率待用户实测**。

---

## 一、核心结论

**R1 解决 → 采用方案①**：MindAR 底层 `Controller`（纯追踪引擎）+ R3F 独占渲染。

依据：通读 `mind-ar/dist/mindar-image-three.prod.js`（`MindARThree` 源码）确认——
底层 `Controller` **不含** renderer/scene/camera，仅产出：
- `getProjectionMatrix()`：列主序投影矩阵（一次性，推导相机参数）
- `onUpdate({worldMatrix})`：每帧目标世界矩阵，丢失时为 `null`

因此可让 R3F 完全接管渲染，MindAR 只喂矩阵，**不违反 Claude.md「禁止直接操作 three 实例」**。
矩阵应用链：`group.matrix = worldMatrix × postMatrix`，`matrixAutoUpdate=false`（已逆向 postMatrix 与相机推导公式）。

**R2 解决**：`three` 全树统一 `0.169.0`（npm `overrides: {"three":"$three"}` 消除 drei→stats-gl 拉入的 0.170 双实例）。mind-ar 1.2.5 将 three 设为 external peer（`>=0.136`），无内置副本。

---

## 二、已验证项（自动化）

| 验证 | 方式 | 结果 |
|------|------|------|
| 单一 three 实例 | `npm ls three` | ✅ 全 0.169 deduped/overridden，无 invalid |
| type-check (strict) | `tsc -b` | ✅ 通过 |
| lint | `eslint .` | ✅ 通过 |
| 生产构建（含 tfjs） | `vite build` | ✅ 通过（⚠️ 见风险 P1） |
| mind-ar 浏览器端解析 | dev server + curl | ✅ Vite 预打包改写 import，HTTP 200 |
| `.mind` 资源加载 | curl | ✅ 200，256KB |

## 三、待人工验证（真机）

> 需手机与电脑同局域网。spike 入口已临时挂在 `src/main.tsx`。

```bash
npm run dev:https      # 启用自签名 HTTPS（iOS 摄像头强制）
# 手机访问 https://<电脑局域网IP>:5173/  接受自签名证书警告
# 打开 public/targets/card.png（或打印），点击「开始」对准卡片
```

观察 HUD：`status: tracking`、识别后 `target: ✅ FOUND`、粉色圆柱+浮动球贴合卡片。
**待记录**：iPhone 8 / 骁龙 660 级机型平均帧率、识别延迟、丢失重识别延迟。

---

## 四、Spike 暴露的新风险

| ID | 风险 | 数据 | M2 对策 |
|----|------|------|---------|
| **P1** | **首屏体积爆炸**：mind-ar 内置完整 `@tensorflow/tfjs`，单 bundle **2.73MB / 570KB gzip**，违背「首屏 <2s Fast 3G」 | build 输出 | mind-ar 用 `import()` 懒加载（点击激活后再载）；`manualChunks` 分离 tfjs/three；首屏仅 React 壳 |
| P2 | MindAR Core API 无稳定 spec，作者声明可能不向后兼容 | 官方文档 | `mind-ar` 锁死 `1.2.5`（精确版本，已落 lockfile）；类型走自维护 `mindar.d.ts` |
| P3 | `canvas`（native）需 VS 编译，CI/他机安装会失败 | 安装报错 | `overrides: canvas→@napi-rs/canvas`（纯预编译），`npm ci` 可复现 |

---

## 五、产出文件（M1 临时，M2 处置）

```
src/spike/
├── mindar.d.ts            # mind-ar 最小类型声明（保留，移至 utils 或 types）
├── useMindARTracking.ts   # 追踪 hook（方案①核心，M2 演进为 arHelper + ARScene 状态机）
├── SpikeScene.tsx         # R3F 锚点渲染（M2 拆为 ARScene + CakeModel）
└── SpikeApp.tsx           # 验证页（M2 删除，逻辑并入正式 App）
```

> `src/main.tsx` 入口现指向 `spike/SpikeApp`；**M2 第一步恢复为 `./App`**。

---

## 六、放行判定

- ✅ 架构可行性（R1）、版本统一（R2）：**通过，可进入 M2**
- ⏳ 真机帧率（R4）：待用户实测；若 iPhone 8 < 25fps，M3 降级策略兜底
- 📌 M2 必须先做：**P1 懒加载/分包**（否则首屏指标不可能达标）

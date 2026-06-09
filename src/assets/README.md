# 静态资源目录

| 子目录 | 内容 | 约束 |
|--------|------|------|
| `models/` | GLB 蛋糕模型 | < 600KB，≤ 15k 三角形 |
| `music/` | 背景音乐 | mp3，< 1MB |
| `targets/` | MindAR `.mind` 标记图文件 | 由标记图编译生成 |
| `textures/` | 贴图 | webp 优先，≤ 1024×1024 |

> 运行时通过 fetch 加载的资源（.mind / .glb / .mp3）最终放置位置（`public/` 或 CDN）
> 由 M2 资源加载方案确定；此处用于构建期 import 的静态资产占位。

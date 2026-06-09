// 程序化生成 cake.glb（Node + three GLTFExporter）。
// 仅构建期使用，产物落 public/models/cake.glb，用于验证真实 GLB 加载路径。

// GLTFExporter binary 模式依赖浏览器 FileReader.readAsArrayBuffer，
// Node 无此 API：注入最小 polyfill（仅实现导出用到的方法）。
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class {
    onloadend = null;
    result = null;
    readAsArrayBuffer(blob) {
      blob
        .arrayBuffer()
        .then((buf) => {
          this.result = buf;
          this.onloadend?.();
        })
        .catch((e) => {
          throw e;
        });
    }
  };
}

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  Scene,
  Group,
  Mesh,
  CylinderGeometry,
  SphereGeometry,
  MeshStandardMaterial,
} from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../public/models');
const OUT_FILE = resolve(OUT_DIR, 'cake.glb');

function buildCake() {
  const group = new Group();
  group.name = 'Cake';

  const add = (geo, color, y, extra = {}) => {
    const mat = new MeshStandardMaterial({ color, ...extra });
    const mesh = new Mesh(geo, mat);
    mesh.position.y = y;
    group.add(mesh);
  };

  add(new CylinderGeometry(0.4, 0.42, 0.32, 32), 0x8d5524, 0, { roughness: 0.8 });
  add(new CylinderGeometry(0.41, 0.41, 0.1, 32), 0xfff0f5, 0.2, { roughness: 0.5 });
  add(new CylinderGeometry(0.42, 0.4, 0.06, 32), 0xff8fab, 0.28, { roughness: 0.5 });
  add(new CylinderGeometry(0.025, 0.025, 0.22, 12), 0xffd166, 0.42);
  add(new SphereGeometry(0.03, 12, 12), 0xffb703, 0.56, {
    emissive: 0xff6b00,
    emissiveIntensity: 2,
  });

  return group;
}

const scene = new Scene();
scene.add(buildCake());

const exporter = new GLTFExporter();
exporter.parse(
  scene,
  (result) => {
    mkdirSync(OUT_DIR, { recursive: true });
    const buf = Buffer.from(result);
    writeFileSync(OUT_FILE, buf);
    console.log(`OK: ${OUT_FILE} (${(buf.length / 1024).toFixed(1)} KB)`);
  },
  (err) => {
    console.error('GLB 导出失败:', err);
    process.exit(1);
  },
  { binary: true },
);

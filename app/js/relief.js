// "Feel it" view: the tactile page as a raised relief (what swell paper or a 3D print
// produces), lit by a slowly sweeping raking light, plus a printable STL export.
import * as THREE from 'three';
import { OrbitControls } from '../vendor/three/OrbitControls.js';
import { renderTactile } from './render.js';
import { cellDots, BRAILLE } from './braille.js';

const RES = 2;          // height samples per mm
const BASE = 1.2;       // plate thickness (mm)
const RAISE = 0.6;      // raised line / texture height (swell paper rises ~0.5 mm)
const DOT_H = 0.5;      // braille dot height (Spec 800: ~0.48 mm)

// Rasterize the tactile SVG (without braille, which becomes real domes) into heights.
export async function heightField(layout) {
  const svg = renderTactile(layout, { braille: false });
  const w = Math.round(layout.pageW * RES), h = Math.round(layout.pageH * RES);
  const img = new Image();
  img.src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  await img.decode();
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
  ctx.filter = 'blur(0.7px)'; // swell paper rises with soft shoulders
  ctx.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(img.src);
  const d = ctx.getImageData(0, 0, w, h).data;
  const hf = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) hf[i] = (1 - d[i * 4] / 255) * RAISE;
  return { w, h, hf };
}

export function brailleDots(layout) {
  const pts = [];
  for (const L of layout.labels) pts.push(...cellDots(L.cells, L.rect.x, L.rect.y));
  if (layout.title) {
    const tw = (layout.title.cells.length - 1) * BRAILLE.cellPitch + BRAILLE.dotPitch;
    pts.push(...cellDots(layout.title.cells, (layout.pageW - tw) / 2, layout.margin));
  }
  return pts;
}

export class ReliefView {
  constructor(container) {
    this.el = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.setClearColor(0x2a2823);
    container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 1, 20, 2500);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.scene.add(new THREE.HemisphereLight(0xfff8ee, 0x3a3428, 0.55));
    this.sun = new THREE.DirectionalLight(0xffffff, 2.4);
    this.scene.add(this.sun);
    this.sweep = true;
    this.t = 0;
    this.running = false;
    new ResizeObserver(() => this.resize()).observe(container);
  }

  async build(layout) {
    if (this.group) { this.scene.remove(this.group); this.group.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); }); }
    const { w, h, hf } = await heightField(layout);
    const W = layout.pageW, H = layout.pageH;
    const g = new THREE.PlaneGeometry(W, H, w - 1, h - 1);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, hf[i]);
    g.computeVertexNormals();
    const paper = new THREE.MeshStandardMaterial({ color: 0xf6f1e6, roughness: 0.82, metalness: 0 });
    const top = new THREE.Mesh(g, paper);
    const base = new THREE.Mesh(new THREE.BoxGeometry(W, H, BASE), new THREE.MeshStandardMaterial({ color: 0xe6dfcf, roughness: 0.9 }));
    base.position.z = -BASE / 2 - 0.25; // keep clear of the top surface (no z-fighting)
    this.group = new THREE.Group();
    this.group.add(top, base);
    // Braille dots as real domes.
    const dots = brailleDots(layout);
    if (dots.length) {
      const dome = new THREE.SphereGeometry(BRAILLE.dotDiameter / 2, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2);
      dome.rotateX(Math.PI / 2);
      dome.scale(1, 1, DOT_H / (BRAILLE.dotDiameter / 2));
      const inst = new THREE.InstancedMesh(dome, paper, dots.length);
      const m = new THREE.Matrix4();
      dots.forEach(([x, y], i) => { m.makeTranslation(x - W / 2, H / 2 - y, 0); inst.setMatrixAt(i, m); });
      this.group.add(inst);
    }
    this.group.rotation.x = -Math.PI / 2.6; // tilt the page towards the viewer
    this.scene.add(this.group);
    this.resize();
    // Fit the whole page: wide pages need more distance on narrow viewports.
    const d = Math.max(H * 1.15, (W * 1.25) / Math.max(0.5, this.camera.aspect));
    this.camera.position.set(0, d * 0.25, d);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    this.start();
  }

  resize() {
    const r = this.el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.renderer.setSize(r.width, r.height, false);
    this.camera.aspect = r.width / r.height;
    this.camera.updateProjectionMatrix();
  }

  start() {
    if (this.running) return;
    this.running = true;
    const tick = () => {
      if (!this.running) return;
      if (this.sweep) this.t += 0.006;
      // Low raking light circling the page makes raised features cast clear shading.
      const R = 600;
      this.sun.position.set(Math.cos(this.t) * R, 140, Math.sin(this.t) * R);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  stop() { this.running = false; }
}

// Binary STL of the plate (heightfield top, walls, bottom) plus braille domes.
export async function buildSTL(layout) {
  const { w, h, hf } = await heightField(layout);
  const W = layout.pageW, H = layout.pageH;
  const X = (i) => (i / (w - 1)) * W, Y = (j) => H - (j / (h - 1)) * H;
  const Z = (i, j) => BASE + hf[j * w + i];
  const dots = brailleDots(layout);
  const SEG = 10, RINGS = 3;
  const domeTris = SEG * (2 * RINGS - 1);
  const nTris = (w - 1) * (h - 1) * 2 + 2 * ((w - 1) + (h - 1)) * 2 + 2 + dots.length * domeTris;
  const buf = new ArrayBuffer(84 + nTris * 50);
  const dv = new DataView(buf);
  dv.setUint32(80, nTris, true);
  let off = 84;
  const tri = (a, b, c) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    for (const v of [nx, ny, nz, ...a, ...b, ...c]) { dv.setFloat32(off, v, true); off += 4; }
    off += 2;
  };
  // Top surface.
  for (let j = 0; j < h - 1; j++) for (let i = 0; i < w - 1; i++) {
    const a = [X(i), Y(j), Z(i, j)], b = [X(i), Y(j + 1), Z(i, j + 1)], c = [X(i + 1), Y(j + 1), Z(i + 1, j + 1)], d = [X(i + 1), Y(j), Z(i + 1, j)];
    tri(a, b, c); tri(a, c, d);
  }
  // Walls.
  const wall = (p, q) => { tri(p, [q[0], q[1], 0], q); tri(p, [p[0], p[1], 0], [q[0], q[1], 0]); };
  for (let i = 0; i < w - 1; i++) { wall([X(i + 1), Y(0), Z(i + 1, 0)], [X(i), Y(0), Z(i, 0)]); wall([X(i), Y(h - 1), Z(i, h - 1)], [X(i + 1), Y(h - 1), Z(i + 1, h - 1)]); }
  for (let j = 0; j < h - 1; j++) { wall([X(0), Y(j), Z(0, j)], [X(0), Y(j + 1), Z(0, j + 1)]); wall([X(w - 1), Y(j + 1), Z(w - 1, j + 1)], [X(w - 1), Y(j), Z(w - 1, j)]); }
  // Bottom.
  tri([0, 0, 0], [W, H, 0], [W, 0, 0]); tri([0, 0, 0], [0, H, 0], [W, H, 0]);
  // Braille domes (low-poly).
  const r = BRAILLE.dotDiameter / 2;
  for (const [dx, dy] of dots) {
    const cx = dx, cy = H - dy, z0 = BASE;
    const ring = (k) => { const phi = (k / RINGS) * (Math.PI / 2); return { rr: r * Math.cos(phi), zz: z0 + DOT_H * Math.sin(phi) }; };
    for (let k = 0; k < RINGS; k++) {
      const a = ring(k), b = ring(k + 1);
      for (let s = 0; s < SEG; s++) {
        const t0 = (s / SEG) * Math.PI * 2, t1 = ((s + 1) / SEG) * Math.PI * 2;
        const p00 = [cx + a.rr * Math.cos(t0), cy + a.rr * Math.sin(t0), a.zz], p01 = [cx + a.rr * Math.cos(t1), cy + a.rr * Math.sin(t1), a.zz];
        const p10 = [cx + b.rr * Math.cos(t0), cy + b.rr * Math.sin(t0), b.zz], p11 = [cx + b.rr * Math.cos(t1), cy + b.rr * Math.sin(t1), b.zz];
        if (k === RINGS - 1) tri(p00, p01, p10);
        else { tri(p00, p01, p11); tri(p00, p11, p10); }
      }
    }
  }
  return new Blob([buf], { type: 'model/stl' });
}

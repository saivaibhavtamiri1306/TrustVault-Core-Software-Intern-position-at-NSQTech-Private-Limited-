import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, NgZone, ViewChild, afterNextRender, effect, inject, input } from '@angular/core';
import * as THREE from 'three';

const ROUTE_Z: Record<string, number> = { login: 12, dashboard: 12, records: 11, 'admin/users': 12.5, 'admin/audit': 13, 'admin/pipeline': 13.5 };

/** Persistent 3D background. It is built ONCE and glides smoothly between routes / scanning mode. */
@Component({
  selector: 'app-quantum-core',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #mount class="fixed inset-0 z-0 pointer-events-none hex-bg"></div>`,
})
export class QuantumCoreComponent {
  @ViewChild('mount', { static: true }) mount!: ElementRef<HTMLDivElement>;
  readonly currentPath = input('login');
  readonly isScanning = input(false);
  private mode = { path: 'login', scan: false };

  constructor() {
    const zone = inject(NgZone), destroyRef = inject(DestroyRef);
    effect(() => { this.mode = { path: this.currentPath(), scan: this.isScanning() }; });
    afterNextRender(() => zone.runOutsideAngular(() => destroyRef.onDestroy(this.createScene())));
  }

  private createScene(): () => void {
    const el = this.mount.nativeElement;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02040a, 0.04);
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 12);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    const world = new THREE.Group();
    scene.add(world);

    // 1. Quantum knot
    const knotGeo = new THREE.TorusKnotGeometry(1.5, 0.4, 128, 32);
    const knotMat = new THREE.MeshPhysicalMaterial({ color: 0x00f0ff, emissive: 0x0055ff, emissiveIntensity: 0.5, metalness: 0.8, roughness: 0.2, wireframe: true, transparent: true, opacity: 0.8 });
    const knot = new THREE.Mesh(knotGeo, knotMat);
    world.add(knot);

    // 2. Core energy + soft glow halo
    const coreGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xb535f6, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending });
    const coreGlow = new THREE.Mesh(coreGeo, coreMat);
    world.add(coreGlow);
    const gc = document.createElement('canvas');
    gc.width = gc.height = 128;
    const gx = gc.getContext('2d')!;
    const grad = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0,240,255,.55)'); grad.addColorStop(0.4, 'rgba(181,53,246,.25)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
    gx.fillStyle = grad; gx.fillRect(0, 0, 128, 128);
    const haloTex = new THREE.CanvasTexture(gc);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    halo.scale.set(8, 8, 1);
    world.add(halo);

    // 3. Orbiting data rings, each studded with glowing nodes
    const scanRed = new THREE.Color(0xff003c), scanEmissive = new THREE.Color(0xff0000), baseCyan = new THREE.Color(0x00f0ff), baseBlue = new THREE.Color(0x0055ff);
    const rings = new THREE.Group();
    const ringMeshes: { mesh: THREE.Mesh; base: THREE.Color; speed: { x: number; y: number; z: number } }[] = [];
    const ringDefs: [number, number, { x: number; y: number; z: number }][] = [
      [3.5, 0x00f0ff, { x: 0.01, y: 0.02, z: 0.005 }], [4.5, 0xb535f6, { x: -0.015, y: 0.01, z: -0.01 }], [5.5, 0xff003c, { x: 0.005, y: -0.02, z: 0.015 }],
    ];
    ringDefs.forEach(([r, color, speed]) => {
      const mesh = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.05, 64), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.5 }));
      const pts = new Float32Array(24 * 3);
      for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; pts.set([Math.cos(a) * (r + 0.02), Math.sin(a) * (r + 0.02), 0], i * 3); }
      const nodeGeo = new THREE.BufferGeometry();
      nodeGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
      mesh.add(new THREE.Points(nodeGeo, new THREE.PointsMaterial({ color, size: 0.13, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending })));
      rings.add(mesh);
      ringMeshes.push({ mesh, base: new THREE.Color(color), speed });
    });
    ringMeshes[0].mesh.rotation.x = Math.PI / 2; ringMeshes[1].mesh.rotation.y = Math.PI / 3; ringMeshes[2].mesh.rotation.x = Math.PI / 4;
    world.add(rings);

    // 4. Particle field
    const count = 1500;
    const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
    const cA = new THREE.Color(0x00f0ff), cB = new THREE.Color(0xb535f6);
    for (let i = 0; i < count; i++) {
      const r = 8 + Math.random() * 15, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pos.set([r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph)], i * 3);
      const c = Math.random() > 0.5 ? cA : cB;
      col.set([c.r, c.g, c.b], i * 3);
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const dustMat = new THREE.PointsMaterial({ size: 0.05, vertexColors: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
    const dust = new THREE.Points(dustGeo, dustMat);
    world.add(dust);

    scene.add(new THREE.AmbientLight(0x404040));
    world.add(new THREE.PointLight(0x00f0ff, 2, 50));

    let mx = 0, my = 0, scanMix = 0;
    const onMove = (e: MouseEvent) => { mx = (e.clientX / window.innerWidth) * 2 - 1; my = -(e.clientY / window.innerHeight) * 2 + 1; };
    const onResize = () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let frame = 0;
    const loop = () => {
      const d = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
      const { path, scan } = this.mode;
      scanMix += ((scan ? 1 : 0) - scanMix) * Math.min(1, d * 4); // smooth 0..1 blend into "scanning"

      knot.rotation.x += d * (0.2 + scanMix * 0.8);
      knot.rotation.y += d * (0.3 + scanMix * 1.2);
      knotMat.color.copy(baseCyan).lerp(scanRed, scanMix);
      knotMat.emissive.copy(baseBlue).lerp(scanEmissive, scanMix);
      coreGlow.scale.setScalar(1 + Math.sin(t * 3) * 0.05 + scanMix * 0.15);
      halo.scale.setScalar(8 + Math.sin(t * 2) * 0.4 + scanMix * 2.5);

      ringMeshes.forEach(({ mesh, base, speed }) => {
        const m = mesh.material as THREE.MeshBasicMaterial, k = 1 + scanMix * 2;
        mesh.rotation.x += speed.x * k; mesh.rotation.y += speed.y * k; mesh.rotation.z += speed.z * k;
        m.opacity = 0.5 + scanMix * Math.sin(t * 10) * 0.4;
        m.color.copy(base).lerp(scanRed, scanMix);
      });
      dust.rotation.y = t * (0.05 + scanMix * 0.15);

      const wide = window.innerWidth >= 1024;
      const tx = path === 'login' ? (wide ? -4 : 0) : (wide ? 5 : 0);
      const tz = (ROUTE_Z[path] ?? 12) - scanMix * 6;
      world.position.x += (tx - world.position.x) * Math.min(1, d * 3);
      camera.position.x += (mx * 2 - camera.position.x) * 0.05;
      camera.position.y += (my * 2 - camera.position.y) * 0.05;
      camera.position.z += (tz - camera.position.z) * Math.min(1, d * 2.5);
      camera.lookAt(world.position);

      renderer.render(scene, camera);
      frame = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frame);
      el.removeChild(renderer.domElement);
      [knotGeo, coreGeo, dustGeo, haloTex].forEach(o => o.dispose());
      [knotMat, coreMat, dustMat].forEach(m => m.dispose());
      renderer.dispose();
    };
  }
}

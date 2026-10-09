import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, NgZone, ViewChild, afterNextRender, inject } from '@angular/core';
import * as THREE from 'three';

/** 3D "spider-web" graph: the candidate in the middle, verified data sources around it. Built with Three.js. */
@Component({
  selector: 'app-node-graph',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `<div #box class="relative h-72 w-full overflow-hidden rounded-xl bg-black/30"></div>`,
})
export class NodeGraphComponent {
  @ViewChild('box', { static: true }) box!: ElementRef<HTMLDivElement>;

  constructor() {
    const zone = inject(NgZone), destroyRef = inject(DestroyRef);
    afterNextRender(() => zone.runOutsideAngular(() => destroyRef.onDestroy(this.init())));
  }

  private init(): () => void {
    const el = this.box.nativeElement;
    const w = el.clientWidth || 420, h = el.clientHeight || 288;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(50, w / h, 0.1, 50);
    cam.position.z = 9;
    const group = new THREE.Group();
    scene.add(group);

    const label = (text: string, color: string) => {
      const c = document.createElement('canvas');
      c.width = 256; c.height = 64;
      const g = c.getContext('2d')!;
      g.font = 'bold 26px monospace'; g.fillStyle = color; g.textAlign = 'center'; g.fillText(text, 128, 40);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
      s.scale.set(2.6, 0.65, 1);
      return s;
    };

    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 1), new THREE.MeshBasicMaterial({ color: 0xfb923c, wireframe: true }));
    group.add(core);
    const tag = label('CANDIDATE', '#fb923c');
    tag.position.set(0, -1, 0);
    group.add(tag);

    const names = ['AADHAAR', 'EPFO', 'E-COURTS', 'EDUCATION', 'ADDRESS', 'EMPLOYER', 'PAN', 'LEDGER'];
    const nodes: THREE.Mesh[] = [];
    names.forEach((n, i) => {
      const a = (i / names.length) * Math.PI * 2;
      const p = new THREE.Vector3(Math.cos(a) * 3.1, Math.sin(i * 1.7) * 1.3, Math.sin(a) * 3.1);
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshBasicMaterial({ color: 0x22d3ee }));
      m.position.copy(p);
      group.add(m);
      nodes.push(m);
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), p]), new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.45 })));
      const sp = label(n, '#a5f3fc');
      sp.position.copy(p).add(new THREE.Vector3(0, 0.55, 0));
      group.add(sp);
    });
    nodes.forEach((m, i) => {
      const next = nodes[(i + 1) % nodes.length];
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([m.position, next.position]), new THREE.LineBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.25 })));
    });

    const clock = new THREE.Clock();
    let id = 0;
    const tick = () => {
      const t = clock.getElapsedTime();
      group.rotation.y = t * 0.25;
      group.rotation.x = Math.sin(t * 0.3) * 0.15;
      core.rotation.y = -t;
      nodes.forEach((m, i) => m.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.25));
      renderer.render(scene, cam);
      id = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(id); renderer.dispose(); el.removeChild(renderer.domElement); };
  }
}


import { Component, ElementRef, OnDestroy, OnInit, NgZone, inject, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-three-bg',
  standalone: true,
  template: `<div #rendererContainer class="fixed inset-0 w-full h-full -z-50 pointer-events-none"></div>`,
  styles: [`:host { display: block; }`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThreeBgComponent implements OnInit, OnDestroy {
  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef;
  
  private ngZone = inject(NgZone);
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private particles!: THREE.Points;
  private animationId: number | null = null;
  
  // Mouse interaction state
  private mouseX = 0;
  private mouseY = 0;
  private targetX = 0;
  private targetY = 0;

  ngOnInit() {
    this.initThree();
    this.initInteraction();
  }

  private initThree() {
    // 1. Setup Scene
    this.scene = new THREE.Scene();
    // Dark fog for depth perception
    this.scene.fog = new THREE.FogExp2(0x050505, 0.002);

    // 2. Camera
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(75, width / height, 1, 2000);
    this.camera.position.z = 1000;

    // 3. Renderer (Transparent for Tailwind BG blending)
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0); // Transparent
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    // 4. Particle System (The Nebula)
    const geometry = new THREE.BufferGeometry();
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const color = new THREE.Color();
    const baseColor = new THREE.Color('#6366f1'); // Indigo-500

    for (let i = 0; i < count * 3; i += 3) {
      // Spread particles in a wide volume
      positions[i] = (Math.random() * 2 - 1) * 2000;
      positions[i + 1] = (Math.random() * 2 - 1) * 2000;
      positions[i + 2] = (Math.random() * 2 - 1) * 2000;

      // Color variation
      color.set(baseColor);
      color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.2); // Vary lightness
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 4,
      vertexColors: true,
      map: this.createCircleTexture(), // Soft particles
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);

    // 5. Start Loop
    this.ngZone.runOutsideAngular(() => this.animate());

    // 6. Handle Resize
    window.addEventListener('resize', this.onWindowResize);
  }

  private initInteraction() {
    // Track mouse for parallax effect
    document.addEventListener('mousemove', (event) => {
      this.mouseX = event.clientX - window.innerWidth / 2;
      this.mouseY = event.clientY - window.innerHeight / 2;
    });
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    // Gentle Rotation
    this.particles.rotation.x += 0.0005;
    this.particles.rotation.y += 0.0005;

    // Mouse Parallax (Smooth lerp)
    this.targetX = this.mouseX * 0.001;
    this.targetY = this.mouseY * 0.001;

    this.particles.rotation.y += 0.05 * (this.targetX - this.particles.rotation.y);
    this.particles.rotation.x += 0.05 * (this.targetY - this.particles.rotation.x);

    this.renderer.render(this.scene, this.camera);
  }

  private createCircleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    if (context) {
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  ngOnDestroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.dispose();
  }
}

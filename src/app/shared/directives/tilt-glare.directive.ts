
import { Directive, ElementRef, inject, input, NgZone, OnDestroy, OnInit } from '@angular/core';

@Directive({
  selector: '[appTiltGlare]',
  standalone: true
})
export class TiltGlareDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private ngZone = inject(NgZone);

  // Inputs
  tiltMaxAngle = input<number>(15);
  glareEnabled = input<boolean>(true);

  private bounds: DOMRect | null = null;
  private mouseMoveListener: any;
  private mouseLeaveListener: any;
  private mouseEnterListener: any;

  ngOnInit() {
    this.ngZone.runOutsideAngular(() => {
      this.mouseEnterListener = () => {
        this.bounds = this.el.nativeElement.getBoundingClientRect();
      };

      this.mouseMoveListener = (e: MouseEvent) => {
        if (!this.bounds) return;
        this.onMouseMove(e);
      };

      this.mouseLeaveListener = () => {
        this.onMouseLeave();
      };

      this.el.nativeElement.addEventListener('mouseenter', this.mouseEnterListener);
      this.el.nativeElement.addEventListener('mousemove', this.mouseMoveListener);
      this.el.nativeElement.addEventListener('mouseleave', this.mouseLeaveListener);
    });
  }

  private onMouseMove(e: MouseEvent) {
    const width = this.bounds!.width;
    const height = this.bounds!.height;
    const x = e.clientX - this.bounds!.left;
    const y = e.clientY - this.bounds!.top;

    // Calculate rotation (0 to 1 scale relative to center)
    const xPct = x / width;
    const yPct = y / height;
    
    // -1 to 1
    const xCenter = (xPct - 0.5) * 2;
    const yCenter = (yPct - 0.5) * 2;

    const max = this.tiltMaxAngle();
    const rotateY = xCenter * max; 
    const rotateX = -yCenter * max; // Inverted for natural feel

    // Set CSS Variables for performant transform
    const style = this.el.nativeElement.style;
    style.setProperty('--rotate-x', `${rotateX}deg`);
    style.setProperty('--rotate-y', `${rotateY}deg`);

    if (this.glareEnabled()) {
      // Glare moves opposite to mouse
      const glareX = (1 - xPct) * 100;
      const glareY = (1 - yPct) * 100;
      style.setProperty('--glare-x', `${glareX}%`);
      style.setProperty('--glare-y', `${glareY}%`);
      style.setProperty('--glare-opacity', '1');
    }
  }

  private onMouseLeave() {
    const style = this.el.nativeElement.style;
    // Reset
    style.setProperty('--rotate-x', '0deg');
    style.setProperty('--rotate-y', '0deg');
    style.setProperty('--glare-opacity', '0');
  }

  ngOnDestroy() {
    this.el.nativeElement.removeEventListener('mouseenter', this.mouseEnterListener);
    this.el.nativeElement.removeEventListener('mousemove', this.mouseMoveListener);
    this.el.nativeElement.removeEventListener('mouseleave', this.mouseLeaveListener);
  }
}

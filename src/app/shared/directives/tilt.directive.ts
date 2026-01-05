
import { Directive, ElementRef, inject, signal } from '@angular/core';
import { fromEvent, takeUntil } from 'rxjs';

@Directive({
  selector: '[appTilt]',
})
export class TiltDirective {
  private elementRef = inject(ElementRef<HTMLElement>);
  
  host = {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '[style.transform]': 'transform()',
    '[style.transition]': '"transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)"',
  };

  private transform = signal<string>('perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)');
  private readonly destroy$ = fromEvent(this.elementRef.nativeElement, 'destroy');
  
  private onMouseEnter() {
    fromEvent<MouseEvent>(this.elementRef.nativeElement, 'mousemove')
      .pipe(takeUntil(fromEvent(this.elementRef.nativeElement, 'mouseleave')))
      .subscribe((event) => this.onMouseMove(event));
  }

  private onMouseMove(event: MouseEvent) {
    const { left, top, width, height } = this.elementRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - left;
    const y = event.clientY - top;

    const rotateX = -((y - height / 2) / (height / 2)) * 15; // Increased intensity
    const rotateY = ((x - width / 2) / (width / 2)) * 15;

    this.transform.set(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`);
  }

  private onMouseLeave() {
    this.transform.set('perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)');
  }
}

import {
  Component,
  ContentChild,
  ElementRef,
  Input,
  AfterViewInit,
  TemplateRef,
  HostBinding,
  HostListener,
  TrackByFunction,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { trigger, transition, style, animate, query, AnimationEvent } from '@angular/animations';

type AnimationDirection = 'horizontal' | 'vertical' | 'none';

@Component({
  selector: 'cod-infinite-carousel',
  templateUrl: './infinite-carousel.component.html',
  animations: [
      trigger('carousel-item', [
          transition(':enter', [
              style({ opacity: 0 }),
              animate('300ms', style({ opacity: '*' }))
          ])
      ]),
      trigger('horizontal', [
          transition(':increment', [
              query('@carousel-item', [
                  style({ transform: '*' }),
                  animate('500ms', style({ transform: 'translateX(-100%)' }))
              ], { optional: true })
          ])
      ]),
      trigger('vertical', [
          transition(':increment', [
              query('@carousel-item', [
                  style({ transform: '*' }),
                  animate('500ms', style({ transform: 'translateY(-100%)' }))
              ], { optional: true })
          ])
      ])
  ]
})
export class InfiniteCarouselComponent implements AfterViewInit, OnDestroy, OnChanges {

  private _horizontal = 0;
  private _vertical = 0;
  private _timeoutHandler: any;

  private _rotation = 0;
  private _cloneCount = 0;

  @Input() public items: any[];

  @Input() public trackBy: TrackByFunction<any>;

  @Input() public interval: number;

  @ContentChild(TemplateRef, {static: false}) public template: TemplateRef<any>;

  public get itemsShadow(): any[] {
    //   console.log("This Items - clone", this.items);
      const items = this.items.clone();
      if (this._rotation > 0) {
          const rotatedItems = items.splice(0, this._rotation);
          items.push(...rotatedItems);
      }
      if (this._cloneCount > 0) {
          const clonedItems = items.slice(0, this._cloneCount);
          items.push(...clonedItems);
      }
      return items;
  }

  @HostBinding('@horizontal')
  public get horizontal(): number {
      return this._horizontal;
  }

  @HostBinding('@vertical')
  public get vertical(): number {
      return this._vertical;
  }

  @HostBinding('class.overflow')
  public get overflow(): boolean {
      return false;
  }

  @HostListener('@horizontal.done', ['$event'])
  @HostListener('@vertical.done', ['$event'])
  public endAnimation(event: AnimationEvent): void {
      if (event.fromState === 'void') {
          return;
      }

      // remove cloned items
      if (this._cloneCount > 0) {
          this._rotation = (this._rotation + this._cloneCount) % this.items.length;
          this._cloneCount = 0;
      }
  }

  constructor(private _elementRef: ElementRef<HTMLElement>) {
  }

  private start(): void {
      this.reset();
      if (this.interval !== 0) {
          this._timeoutHandler = setInterval(() => this.animate(), Math.max(this.interval || 3500, 750));
      }
  }

  private reset(): void {
      this._cloneCount = 0;
      this._rotation = 0;

      this._horizontal = 0;
      this._vertical = 0;
      if (this._timeoutHandler) {
          clearInterval(this._timeoutHandler);
          this._timeoutHandler = null;
      }
  }

  private detectDirection(): AnimationDirection {
      if (this.interval === 0) {
          return 'none';
      }

      const element = this._elementRef.nativeElement;

      if (element.scrollWidth > element.clientWidth) {

          return 'horizontal';
      } else if (element.scrollHeight > element.clientHeight) {

          return 'vertical';
      }

      return 'none';
  }

  private detectRotationCount(direction: AnimationDirection): number {
      if (direction === 'none') {
          return 0;
      }

      const element = this._elementRef.nativeElement;
      const count = element.children.length;

      switch (direction) {
          case 'horizontal':
              const offsetLeft = (<HTMLElement>element.children.item(0)).offsetLeft;
              for (let i = 1; i < count; i++) {
                  if (offsetLeft < (<HTMLElement>element.children.item(i)).offsetLeft) {
                      return i;
                  }
              }
              return count;
          case 'vertical':
              const offsetTop = (<HTMLElement>element.children.item(0)).offsetTop;
              for (let i = 1; i < count; i++) {
                  if (offsetTop < (<HTMLElement>element.children.item(i)).offsetTop) {
                      return i;
                  }
              }
              return count;
          default:
              return 0;
      }
  }

  private animate(): void {
      if (!(this.items instanceof Array) || this.items.length === 0) {
      }

      const direction = this.detectDirection();

      const rotateCount = this.detectRotationCount(direction);

      if (rotateCount > 0) {
          this._cloneCount = rotateCount;
      }

      // trigger the animation
      switch (direction) {
          case 'horizontal':
              this._horizontal++;
              break;
          case 'vertical':
              this._vertical++;
              break;
      }
  }

  public ngAfterViewInit(): void {
      this.start();
  }

  public ngOnDestroy(): void {
      this.reset();
  }

  public ngOnChanges(changes: SimpleChanges) {

      if (changes.interval && !changes.interval.firstChange) {
          this.start();
      }

      if (changes.items && !changes.items.firstChange) {

          const previousValue: any[] = changes.items.previousValue;
          const currentValue: any[] = changes.items.currentValue;

          let changed = true;
          if (previousValue instanceof Array && currentValue instanceof Array) {
              const trackBy = (_: any, index: number) => (this.trackBy || ((_index, item) => item))(_, index);
              changed = !Array.sequenceEquals(previousValue.map(trackBy), currentValue.map(trackBy));
          }

          if (changed) {
              this.start();
          }
      }
  }
}

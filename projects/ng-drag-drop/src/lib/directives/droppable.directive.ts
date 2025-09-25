import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { DomHelper } from '../shared/dom-helper';
import { Subscription, Observable, map, of, BehaviorSubject, takeUntil } from 'rxjs';
import { NgDragDropService } from '../ng-drag-drop.service';
import { DropEvent } from '../shared/drop-event.model';

@Directive({ selector: '[droppable]', standalone: true })
export class Droppable implements OnInit, OnDestroy {
  /**
   *  Event fired when Drag dragged element enters a valid drop target.
   */
  @Output() onDragEnter: EventEmitter<any> = new EventEmitter();

  /**
   * Event fired when an element is being dragged over a valid drop target
   */
  @Output() onDragOver: EventEmitter<any> = new EventEmitter();

  /**
   * Event fired when a dragged element leaves a valid drop target.
   */
  @Output() onDragLeave: EventEmitter<any> = new EventEmitter();

  /**
   * Event fired when an element is dropped on a valid drop target.
   */
  @Output() onDrop: EventEmitter<DropEvent> = new EventEmitter();

  /**
   * CSS class that is applied when a compatible draggable is being dragged over this droppable.
   */
  @Input() dragOverClass = 'drag-over-border';

  /**
   * CSS class applied on this droppable when a compatible draggable item is being dragged.
   * This can be used to visually show allowed drop zones.
   */
  @Input() dragHintClass = 'drag-hint-border';

  /**
   * Defines compatible drag drop pairs. Values must match both in draggable and droppable.dropScope.
   */
  @Input() set dropScope(value: string | Array<string> | Function) {
    this._dropScope = value;
    this.checkAllowDrop();
  }
  get dropScope() {
    return this._dropScope;
  }

  /**
   * Defines if drop is enabled. `true` by default.
   */
  @Input() set dropEnabled(value: boolean) {
    this._dropEnabled = value;

    if (this._dropEnabled === true) {
      this.subscribeService();
    } else {
      this.unsubscribeService();
    }
    this.checkAllowDrop();
  }

  get dropEnabled() {
    return this._dropEnabled;
  }

  /**
   * @private
   */
  dragStartSubscription?: Subscription;

  /**
   * @private
   */
  dragEndSubscription?: Subscription;

  /**
   * @private
   * Backing field for the dropEnabled property
   */
  _dropEnabled = true;

  /**
   * @private
   * Field for tracking drag state. Helps when
   * drag stop event occurs before the allowDrop()
   * can be calculated (async).
   */
  _isDragActive = false;

  /**
   * @private
   * Backing field for the dropScope property.
   */
  _dropScope: string | Array<string> | Function = 'default';

  /**
   * @private
   * Field for tracking if service is subscribed.
   * Avoids creating multiple subscriptions of service.
   */
  _isServiceActive = false;

  /**
   * @private
   * Function for unbinding the drag enter listener
   */
  unbindDragEnterListener?: Function;

  /**
   * @private
   * Function for unbinding the drag over listener
   */
  unbindDragOverListener?: Function;

  /**
   * @private
   * Function for unbinding the drag leave listener
   */
  unbindDragLeaveListener?: Function;

  /**
   * @private
   * Function for unbinding the drag leave listener
   */
  allowDrop: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  /**
   * @private
   * Subscription für allowDrop während Dragging
   */
  allowDropSubscription?: Subscription;

  constructor(
    protected el: ElementRef,
    private renderer: Renderer2,
    private ng2DragDropService: NgDragDropService,
    private zone: NgZone
  ) {}

  ngOnInit() {
    if (this.dropEnabled === true) {
      this.subscribeService();
    }
  }

  ngOnDestroy() {
    this.unsubscribeService();
    this.unbindDragListeners();
  }

  dragEnter(e: any) {
    e.preventDefault();
    e.stopPropagation();
    this.onDragEnter.emit(e);
  }

  dragOver(e: any, result: any) {
    if (result) {
      DomHelper.addClass(this.el, this.dragOverClass);
      e.preventDefault();
      this.onDragOver.emit(e);
    }
  }

  dragLeave(e: any) {
    DomHelper.removeClass(this.el, this.dragOverClass);
    e.preventDefault();
    this.onDragLeave.emit(e);
  }

  @HostListener('drop', ['$event'])
  drop(e: any) {
    if (this.allowDrop.getValue() && this._isDragActive) {
      DomHelper.removeClass(this.el, this.dragOverClass);
      e.preventDefault();
      e.stopPropagation();

      this.ng2DragDropService.onDragEnd.next();
      this.onDrop.emit(new DropEvent(e, this.ng2DragDropService.dragData));
      this.ng2DragDropService.dragData = null;
      this.ng2DragDropService.scope = undefined;
    }
  }

  checkAllowDrop(): void {
    let allowed = false;
    const dropScope = this.dropScope;

    /* tslint:disable:curly */
    /* tslint:disable:one-line */
    if (typeof dropScope === 'string') {
      if (typeof this.ng2DragDropService.scope === 'string')
        allowed = this.ng2DragDropService.scope === dropScope;
      else if (this.ng2DragDropService.scope instanceof Array)
        allowed = this.ng2DragDropService.scope.indexOf(dropScope) > -1;
    } else if (dropScope instanceof Array) {
      if (typeof this.ng2DragDropService.scope === 'string')
        allowed = dropScope.indexOf(this.ng2DragDropService.scope) > -1;
      else if (this.ng2DragDropService.scope instanceof Array)
        allowed =
          dropScope.filter((item) => {
            return this.ng2DragDropService.scope?.indexOf(item) !== -1;
          }).length > 0;
    } else if (typeof dropScope === 'function') {
      allowed = dropScope(this.ng2DragDropService.dragData);
      // TODO: handle observable return value
      // if (allowed instanceof Observable) {
      //   return allowed.pipe(map((result) => result && this.dropEnabled));
      // }
    }
    /* tslint:enable:curly */
    /* tslint:disable:one-line */

    this.allowDrop.next(allowed && this.dropEnabled);
  }

  subscribeService() {
    if (this._isServiceActive === true) {
      return;
    }
    this._isServiceActive = true;
    this.dragStartSubscription = this.ng2DragDropService.onDragStart.subscribe(() => {
      this._isDragActive = true;
      this.checkAllowDrop();

      if (this.allowDropSubscription) {
        this.allowDropSubscription.unsubscribe();
      }
      this.allowDropSubscription = this.allowDrop.subscribe((result) => {
        if (result && this._isDragActive) {
          DomHelper.addClass(this.el, this.dragHintClass);
          this.zone.runOutsideAngular(() => {
            this.unbindDragEnterListener = this.renderer.listen(
              this.el.nativeElement,
              'dragenter',
              (dragEvent) => {
                this.dragEnter(dragEvent);
              }
            );
            this.unbindDragOverListener = this.renderer.listen(
              this.el.nativeElement,
              'dragover',
              (dragEvent) => {
                this.dragOver(dragEvent, result);
              }
            );
            this.unbindDragLeaveListener = this.renderer.listen(
              this.el.nativeElement,
              'dragleave',
              (dragEvent) => {
                this.dragLeave(dragEvent);
              }
            );
          });
        }
      });
    });

    this.dragEndSubscription = this.ng2DragDropService.onDragEnd.subscribe(
      () => {
        this._isDragActive = false;
        DomHelper.removeClass(this.el, this.dragHintClass);
        this.unbindDragListeners();
        this.allowDropSubscription?.unsubscribe();
        this.allowDropSubscription = undefined;
      }
    );
  }

  unsubscribeService() {
    this._isServiceActive = false;
    if (this.dragStartSubscription) {
      this.dragStartSubscription.unsubscribe();
    }
    if (this.dragEndSubscription) {
      this.dragEndSubscription.unsubscribe();
    }
    if (this.allowDropSubscription) {
      this.allowDropSubscription.unsubscribe();
      this.allowDropSubscription = undefined;
    }
  }

  unbindDragListeners() {
    if (this.unbindDragEnterListener) {
      this.unbindDragEnterListener();
    }
    if (this.unbindDragOverListener) {
      this.unbindDragOverListener();
    }
    if (this.unbindDragLeaveListener) {
      this.unbindDragLeaveListener();
    }
  }
}

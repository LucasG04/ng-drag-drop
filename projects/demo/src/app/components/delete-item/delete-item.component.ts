import { Component, inject } from '@angular/core';
import { interval, map, take, Subscription, tap, timer } from 'rxjs';
import { NgDragDropService, DropEvent } from 'ng-drag-drop';

@Component({
  selector: 'delete-item',
  templateUrl: './delete-item.component.html',
  styles: [
    `
      div.scroll-list {
        overflow: auto;
        max-height: 70vh;
      }

      .drag-hint-scale {
        // border: #ffc100 dashed 2px;
        transition: all 0.1s ease-in-out;
        transform: scale(1.1);
      }
    `,
  ],
  standalone: false
})
export class DeleteItemComponent {
  ngDragDropService = inject(NgDragDropService);

  deleteItems = [
    { name: 'Angular2' },
    { name: 'AngularJS' },
    { name: 'Vue' },
    { name: 'ReactJS' },
    { name: 'Backbone' },
  ];
  deleteScope = '';
  countdown?: number;

  dragTimer?: Subscription;

  constructor() {
    this.ngDragDropService.onDragEnd.subscribe(() => {
      this.deleteScope = '';
      this.dragTimer?.unsubscribe();
      this.countdown = undefined;
    });
  }

  dragStart() {
    this.dragTimer = timer(0, 1000).pipe(take(6), map((v) => 5 - v), tap(v => this.countdown = v)).subscribe({
        complete: () => {
          this.deleteScope = 'delete';
          this.dragTimer = undefined;
          this.countdown = undefined;
        }
      });
  }

  onDeleteDrop(e: DropEvent) {
    this.removeItem(e.dragData, this.deleteItems);
  }

  removeItem(item: any, list: Array<any>) {
    let index = list
      .map(function (e) {
        return e.name;
      })
      .indexOf(item.name);
    list.splice(index, 1);
  }
}

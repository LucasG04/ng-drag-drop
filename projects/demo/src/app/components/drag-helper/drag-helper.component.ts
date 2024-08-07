import { Component } from '@angular/core';
import { DropEvent } from 'ng-drag-drop';

type Phrase = { name: string };

@Component({
  selector: 'drag-helper',
  templateUrl: './drag-helper.component.html',
  styles: [],
})
export class DragHelperComponent {
  list1: Phrase[] = [
    { name: 'Drag Me' },
    { name: 'Drag Me too' },
    { name: 'Some Item' },
    { name: 'Some More Item' },
  ];

  list2: Phrase[] = [];

  onDrop(e: DropEvent) {
    this.list2.push(e.dragData);
    this.removeItem(e.dragData, this.list1);
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

import { Component } from '@angular/core';
import { DropEvent } from 'ng-drag-drop';

type FoodItem = {
  name: string;
  type: 'vegetable' | 'fruit';
};

@Component({
    selector: 'complete-demo',
    templateUrl: './complete-demo.component.html',
    styles: [
        `
      div.scroll-list {
        overflow: auto;
        max-height: 70vh;
      }

      .drag-over {
        border: #ff525b dashed 2px;
      }

      .drag-hint {
        border: #ffc100 dashed 2px;
      }

      .drag-target-border {
        border: #00bfff dashed 2px;
      }

      .drag-target-border-green {
        border: #3c763d dashed 2px;
      }
    `,
    ],
    standalone: false
})
export class CompleteDemoComponent {
  vegetables: FoodItem[] = [
    { name: 'Carrot', type: 'vegetable' },
    { name: 'Onion', type: 'vegetable' },
    { name: 'Potato', type: 'vegetable' },
    { name: 'Capsicum', type: 'vegetable' },
  ];

  fruits: FoodItem[] = [
    { name: 'Apple', type: 'fruit' },
    { name: 'Orange', type: 'fruit' },
    { name: 'Mango', type: 'fruit' },
    { name: 'Banana', type: 'fruit' },
  ];

  droppedFruits: FoodItem[] = [];
  droppedVegetables: FoodItem[] = [];
  droppedItems: FoodItem[] = [];
  fruitDropEnabled = true;
  dragEnabled = true;

  onFruitDrop(e: DropEvent) {
    this.droppedFruits.push(e.dragData);
    this.removeItem(e.dragData, this.fruits);
  }

  onVegetableDrop(e: DropEvent) {
    this.droppedVegetables.push(e.dragData);
    this.removeItem(e.dragData, this.vegetables);
  }

  onAnyDrop(e: DropEvent) {
    this.droppedItems.push(e.dragData);

    if (e.dragData.type === 'vegetable') {
      this.removeItem(e.dragData, this.vegetables);
    } else {
      this.removeItem(e.dragData, this.fruits);
    }
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

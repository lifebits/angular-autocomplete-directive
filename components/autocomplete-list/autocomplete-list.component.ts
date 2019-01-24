import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, HostListener,
   ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { ListSize, TextTransform } from '../../autocomplete.directive';

enum KEY_CODE {
   KEY_ENTER = 13,
   KEY_ESCAPE = 27,
   UP_ARROW = 38,
   DOWN_ARROW = 40
}

@Component({
   selector: 'app-autocomplete-list',
   templateUrl: './autocomplete-list.component.html',
   styleUrls: ['./autocomplete-list.component.scss'],
   changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutocompleteListComponent implements OnInit, OnDestroy {

   private isLoadingSource = new BehaviorSubject<boolean>(false);

   @Input()
   set isLoading(value: boolean) {
      this.isLoadingSource.next(value);
   }
   get isLoading(): boolean {
      return this.isLoadingSource.getValue();
   }

   @Input() itemList?: Array<any> = [];
   @Input() forcedChoice?: boolean;
   @Input() listSize: ListSize;
   @Input() textTransform: TextTransform;
   @Input() labelsField?: string;
   @Input() buttonName?: string;
   @Input() buttonRouterLink?: Array<string>;

   @Output() selectEvent = new EventEmitter();
   @Output() destroyEvent = new EventEmitter<boolean>();

   private itemIsSelected?: boolean;
   private activeIndex = -1;

   constructor(
      private cdRef: ChangeDetectorRef) {
   }

   @HostListener('window:keydown', ['$event'])
   keyboardInput(event) {
      switch (event.keyCode) {
         case KEY_CODE.KEY_ENTER:
            if (this.activeIndex === -1) {
               (this.forcedChoice && this.itemList.length) ? this.selectItem(this.itemList[0]) : this.selectItem(null);
            } else {
               this.selectItem(this.itemList[this.activeIndex]);
            }
            this.destroyEvent.emit(true);
            event.preventDefault();
            break;
         case KEY_CODE.KEY_ESCAPE:
            event.preventDefault();
            this.selectEvent.emit(null);
            this.destroyEvent.emit(true);
            break;
         case KEY_CODE.DOWN_ARROW:
            if (this.activeIndex < this.itemList.length - 1) { ++this.activeIndex; }
            break;
         case KEY_CODE.UP_ARROW:
            if (this.activeIndex > -1) { --this.activeIndex; }
            break;
      }
   }

   ngOnInit() {
      this.checkInputFields();
      this.isLoadingSource
         .subscribe(isLoading => (isLoading) ? null : this.cdRef.markForCheck());
   }

   ngOnDestroy() {
      if (this.forcedChoice && !this.itemIsSelected) {
         const value = (this.itemList && this.itemList.length) ? this.itemList[0] : null;
         this.selectEvent.emit(value);
      }
   }

   selectItem(item) {
      this.itemIsSelected = true;
      this.selectEvent.emit(item);
   }

   private checkInputFields() {
      if (!this.labelsField) {
         console.warn('no labels indicated');
      }
      if (this.buttonName && !this.buttonRouterLink && this.buttonName.length) {
         console.warn('no link for button');
      }
   }

}

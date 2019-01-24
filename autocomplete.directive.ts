import { Directive, OnInit, OnDestroy, Input, Output, EventEmitter, ComponentFactoryResolver, HostListener,
   ElementRef, ComponentRef, ViewContainerRef } from '@angular/core';
import { NgControl, ControlContainer } from '@angular/forms';

import { Subscription } from 'rxjs';
import { switchMap, filter, tap, debounceTime } from 'rxjs/operators';

import { AutocompleteListComponent } from './components/autocomplete-list/autocomplete-list.component';

export type ListSize = 'default' | 'medium';
export type TextTransform = 'uppercase' | 'lowercase';

export interface AutocompleteErrors {
   itemNotExist: string;
}

/*
*
 * This directive extends the default input field
 * ```html
 * <input appAutocomplete
 *    [source]="fn()"
 *    formControlName="name"
 *    type="text" placeholder="placeholder"
 * />
 * ```
 * fn(): Function {
 *    return function(value): <Observable<Array>> {
 *       return getSimilarItem(value);
 *    }.bind(this);
 * }
*/

@Directive({
   selector: '[appAutocomplete]'
})
export class AutocompleteDirective implements OnInit, OnDestroy {

   @Input() source: Function;
   @Input() sourceField?: string;
   @Input() formControlName: string;
   @Input() updateFormGroup?: boolean;
   @Input() forcedChoice?: boolean;

   @Input() minChars = 1;
   @Input() listSize: ListSize = 'default';
   @Input() textTransform?: TextTransform;
   @Input() buttonName?: string;
   @Input() buttonRouterLink?: Array<string>;

   @Input() errors: AutocompleteErrors = {
      itemNotExist: 'Item not exist'
   };

   @Output() selectEvent = new EventEmitter<any>();
   @Output() listIsActive = new EventEmitter<boolean>();

   private componentRef?: ComponentRef<AutocompleteListComponent>;
   private controlSubscription: Subscription;

   constructor(
      private control: NgControl,
      private controlContainer: ControlContainer,
      private elementRef: ElementRef,
      private viewContainerRef: ViewContainerRef,
      private componentFactoryResolver: ComponentFactoryResolver) {
   }

   @HostListener('blur', ['$event'])
   onDestroyComponent() {
      setTimeout(this.destroyComponent.bind(this), 200);
   }

   @HostListener('dblclick', ['$event'])
   onLoadComponent() {
      if (!this.componentRef) {
         this.forceLoadComponent();
      }
   }

   ngOnInit() {
      this.sourceField = (this.sourceField) ? this.sourceField : this.formControlName;
      this.createWrapper();
      this.controlSubscription = this.control.valueChanges
         .pipe(
            filter(() => !this.control.pristine),
            filter(value => value && value.length >= this.minChars),
            tap(() => (this.componentRef) ? this.componentRef.instance.isLoading = true : this.loadComponent()),
            debounceTime(200),
            switchMap(value => this.source(value))
         )
         .subscribe((response: Array<any>) => {
            if (this.componentRef && this.componentRef.instance) {
               this.componentRef.instance.isLoading = false;
               this.componentRef.instance.itemList = response;
            }
         });
   }

   ngOnDestroy() {
      this.controlSubscription.unsubscribe();
      if (this.componentRef && this.componentRef.instance) {
         this.componentRef.instance.selectEvent.unsubscribe();
         this.componentRef.instance.destroyEvent.unsubscribe();
      }
   }

   private onSelect(item: any): void {
      const itemList = (this.componentRef) ? this.componentRef.instance.itemList : null;

      if (!item && itemList) {
         item = itemList.find(a => a[this.sourceField] === this.control.value);
      }

      if (!item && this.forcedChoice && this.controlContainer.control) {
         this.control.control.setErrors({ itemNotExist: this.errors.itemNotExist });
      }

      if (item && this.updateFormGroup && this.controlContainer.control) {
         this.controlContainer.control.patchValue(item);
         this.controlContainer.control.markAsDirty();
      }
      if (item && !this.updateFormGroup) {
         this.control.control.setValue(item[this.sourceField]);
      }

      this.elementRef.nativeElement.focus();
      this.selectEvent.emit(item);
   }

   private createWrapper(): void {
      const element = document.createElement('div');
      element.style.position = 'relative';
      element.style.width = '100%';
      element.classList.add('reactive-autocomplete');
      this.elementRef.nativeElement.parentElement.insertBefore(
         element,
         this.elementRef.nativeElement.nextSibling
      );
      element.appendChild(this.elementRef.nativeElement);
   }

   private loadComponent(): AutocompleteListComponent {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(AutocompleteListComponent);
      this.componentRef = this.viewContainerRef.createComponent(componentFactory);

      const component: AutocompleteListComponent = this.componentRef.instance;
      component.forcedChoice = this.forcedChoice;
      component.labelsField = this.sourceField;
      component.buttonName = this.buttonName;
      component.buttonRouterLink = this.buttonRouterLink;
      component.listSize = this.listSize;
      component.textTransform = this.textTransform;
      component.selectEvent.subscribe(this.onSelect.bind(this));
      component.destroyEvent.subscribe(this.destroyComponent.bind(this));

      this.listIsActive.emit(true);

      return component;
   }

   private forceLoadComponent(): void {
      const component: AutocompleteListComponent = this.loadComponent();
      component.isLoading = true;
      this.source(this.control.value)
         .subscribe(value => {
            component.isLoading = false;
            component.itemList = value;
         });
   }

   private destroyComponent(): void {
      if (this.componentRef) {
         this.componentRef.destroy();
         this.componentRef = undefined;
         this.listIsActive.emit(false);
      }
   }

}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AutocompleteDirective } from './autocomplete.directive';
import { AutocompleteListComponent } from './components/autocomplete-list/autocomplete-list.component';

@NgModule({
   imports: [
      CommonModule,
      RouterModule
   ],
   declarations: [
      AutocompleteDirective,
      AutocompleteListComponent
   ],
   exports: [
      AutocompleteDirective
   ],
   entryComponents: [
      AutocompleteListComponent
   ]
})
export class AutocompleteModule {
}

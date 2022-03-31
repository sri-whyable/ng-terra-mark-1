import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LinkingPageComponent} from './linking-page.component';

const routes: Routes = [
  {
    path:'linking',
    component: LinkingPageComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WalletChooseDialog } from "./wallet-choose-dialog.component";
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { MatButtonModule } from '@angular/material/button';
import { HttpClientModule } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from "@angular/material/input"
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from "@angular/forms";
import { MatDividerModule } from "@angular/material/divider";
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import {LinkingPageComponent} from './linking-page.component';

@NgModule({
  declarations: [
    AppComponent,
    WalletChooseDialog,
    LinkingPageComponent
  ],
  exports: [
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    MatGridListModule,
    MatSelectModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatSnackBarModule,
    MatCardModule,
    MatTabsModule,
    HttpClientModule,
    MatTableModule,
    MatProgressBarModule,
    MatDialogModule,
    MatFormFieldModule,
    MatDividerModule,
    MatInputModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

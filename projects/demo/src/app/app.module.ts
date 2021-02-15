import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SSRBrowserModule, TransferHttpCacheModule } from '@ngssr/server/browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule.withServerTransition({
      appId: 'myapp',
    }),
    SSRBrowserModule.forRoot(),
    BrowserAnimationsModule,
    TransferHttpCacheModule,
    HttpClientModule,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

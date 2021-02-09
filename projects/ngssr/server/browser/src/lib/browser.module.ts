import { DOCUMENT } from '@angular/common';
import { APP_ID, ModuleWithProviders, NgModule } from '@angular/core';
import { ɵSharedStylesHost as SharedStylesHost, ɵDomSharedStylesHost as DomSharedStylesHost, BrowserModule } from '@angular/platform-browser';
import { SSRStylesHost } from './styles_host';

declare const ngVirtualDomRenderMode: boolean | undefined;

@NgModule({
  exports: [BrowserModule],
  imports: [],
  providers: [],
})
export class SSRBrowserModule {
  static forRoot(): ModuleWithProviders<SSRBrowserModule> {
    if (typeof ngVirtualDomRenderMode !== 'undefined' && ngVirtualDomRenderMode) {
      return {
        ngModule: SSRBrowserModule,
        providers: [
          { provide: SSRStylesHost, useClass: SSRStylesHost, deps: [DOCUMENT, APP_ID] },
          { provide: SharedStylesHost, useExisting: SSRStylesHost },
          { provide: DomSharedStylesHost, useClass: SSRStylesHost },
        ]
      };
    }
    
    return {
      ngModule: SSRBrowserModule
    };
  }
}
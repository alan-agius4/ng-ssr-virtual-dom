import { DOCUMENT, ɵPLATFORM_SERVER_ID as PLATFORM_SERVER_ID } from '@angular/common';
import { APP_ID, ModuleWithProviders, NgModule, PLATFORM_ID } from '@angular/core';
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
          { provide: PLATFORM_ID, useValue: PLATFORM_SERVER_ID },
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

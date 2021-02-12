import { DOCUMENT, ɵPLATFORM_SERVER_ID as PLATFORM_SERVER_ID } from '@angular/common';
import { ApplicationRef, APP_ID, Inject, ModuleWithProviders, NgModule, Optional, PLATFORM_ID } from '@angular/core';
import {
  ɵSharedStylesHost as SharedStylesHost, ɵescapeHtml as escapeHtml,
  ɵDomSharedStylesHost as DomSharedStylesHost, BrowserModule, TransferState
} from '@angular/platform-browser';
import { SSRStylesHost } from './styles_host';
import { filter, mapTo, take } from 'rxjs/operators';
export interface NgVirtualDomRenderModeAPI {
  getSerializedState: () => string | undefined,
  getWhenStable: () => Promise<void>,
  appId?: string,
}

export type NgVirtualDomRenderMode = boolean | undefined | NgVirtualDomRenderModeAPI;

declare let ngVirtualDomRenderMode: NgVirtualDomRenderMode;

@NgModule({
  exports: [BrowserModule],
  imports: [],
  providers: [],
})
export class SSRBrowserModule {
  constructor(
    private applicationRef: ApplicationRef,
    @Optional() private transferState?: TransferState,
    @Optional() @Inject(APP_ID) private appId?: string,
  ) {
    if (typeof ngVirtualDomRenderMode !== 'undefined' && ngVirtualDomRenderMode) {
      ngVirtualDomRenderMode = {
        getSerializedState: () => this.transferState ? escapeHtml(this.transferState.toJson()) : undefined,
        appId: this.appId,
        getWhenStable: () => this.applicationRef.isStable.pipe(
          filter(isStable => isStable),
          take(1),
          mapTo(undefined)
        ).toPromise(),
      };
    }
  }

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


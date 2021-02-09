import { DOCUMENT, ɵPLATFORM_SERVER_ID as PLATFORM_SERVER_ID } from '@angular/common';
import { APP_ID, APP_INITIALIZER, ModuleWithProviders, NgModule, PLATFORM_ID } from '@angular/core';
import {
  ɵSharedStylesHost as SharedStylesHost, ɵescapeHtml as escapeHtml,
  ɵDomSharedStylesHost as DomSharedStylesHost, BrowserModule, TransferState
} from '@angular/platform-browser';
import { SSRStylesHost } from './styles_host';

declare let ngVirtualDomRenderMode: boolean | undefined | { addStateToDom: VoidFunction };

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
          TransferState,
          {
            provide: APP_INITIALIZER,
            useFactory: serializeTransferStateFactory,
            deps: [DOCUMENT, APP_ID, TransferState],
            multi: true,
          },
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

export function serializeTransferStateFactory(doc: Document, appId: string, transferStore: TransferState) {
  return () => {
    ngVirtualDomRenderMode = {
      addStateToDom: () => {
        const script = doc.createElement('script');
        script.id = `${appId}-state`;
        script.setAttribute('type', 'application/json');
        script.textContent = escapeHtml(transferStore.toJson());
        doc.body.appendChild(script);
      }
    };
  }
}


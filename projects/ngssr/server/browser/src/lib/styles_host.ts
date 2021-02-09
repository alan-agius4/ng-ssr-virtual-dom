/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { DOCUMENT, ɵgetDOM as getDOM } from '@angular/common';
import { Inject, Injectable, OnDestroy, Optional, APP_ID } from '@angular/core';
import { ɵSharedStylesHost as SharedStylesHost, } from '@angular/platform-browser';

@Injectable()
export class SSRStylesHost extends SharedStylesHost implements OnDestroy {
  private head: HTMLHeadElement | null;
  private _styleNodes = new Set<HTMLElement>();

  constructor(
    @Inject(DOCUMENT) private doc: Document,
    @Optional() @Inject(APP_ID) private appId?: string) {
    super();
    this.head = doc.querySelector('head');
  }

  private _addStyle(style: string): void {
    const el = getDOM().createElement('style');
    el.textContent = style;
    debugger;
    if (this.appId) {
      el.setAttribute('ng-transition', this.appId);
    }

    if (this.head) {
      this.head.appendChild(el);
    }
    this._styleNodes.add(el);
  }

  onStylesAdded(additions: Set<string>) {
    additions.forEach(style => this._addStyle(style));
  }

  ngOnDestroy() {
    this._styleNodes.forEach(styleNode => styleNode.remove());
  }
}

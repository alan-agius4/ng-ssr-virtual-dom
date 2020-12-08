import { ApplicationRef, Injectable } from '@angular/core';
import { filter, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SSRBrowserService {
  constructor(
    appref: ApplicationRef
  ) {
    (window as any)['ngIsStable'] = false;

    appref.isStable.pipe(
      filter(x => x),
      take(1),
    ).subscribe(() => {
      (window as any)['ngIsStable'] = true;
    });
  }
}

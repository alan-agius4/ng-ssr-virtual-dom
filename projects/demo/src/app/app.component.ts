import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'SSR Testing';

  constructor() {
    // setTimeout(() => this.title = 'SSR Demo', 1000);
  }
}

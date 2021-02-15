import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'SSR Testing';
  data: Observable<unknown>| undefined = undefined;

  constructor(
    private http: HttpClient,
  ) {
    // setTimeout(() => this.title = 'SSR Demo', 1000);
  }

  ngOnInit() {
    this.data = this.http.get('./assets/data.json');
  }
}

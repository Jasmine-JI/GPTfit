import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';
  constructor() {
    if (location.protocol === 'http:') {
      location.href = `https://${location.host}`;
    }
  }
}

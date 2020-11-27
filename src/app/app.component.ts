import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'app';
  constructor() {
    if (location.protocol === 'http:'
      &&
      (
        location.hostname === 'app.alatech.com.tw'
        // || location.hostname === 'cloud.alatech.com.tw'
        || location.hostname === 'www.gptfit.com'
      )
    ) {
      location.href = location.href.replace('http://', 'https://'); // 以由後端(google domain設定http轉導)，待穩定後移除此段
    } else if (location.protocol === 'http:' && location.hostname === 'cloud.alatech.com.tw') {
      location.href = location.href.replace('http://cloud.alatech.com.tw', 'https://www.gptfit.com');
    } else if (location.hostname === 'cloud.alatech.com.tw') {
      location.href = location.href.replace('cloud.alatech.com.tw', 'www.gptfit.com');
    }

  }

}

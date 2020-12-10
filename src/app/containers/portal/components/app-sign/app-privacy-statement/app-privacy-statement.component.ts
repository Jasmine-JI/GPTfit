import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-app-privacy-statement',
  templateUrl: './app-privacy-statement.component.html',
  styleUrls: ['./app-privacy-statement.component.scss']
})
export class AppPrivacyStatementComponent implements OnInit {

  language = <'zh-tw' | 'en-us' | 'pt-br'>'zh-tw';

  constructor() { }

  ngOnInit(): void {
    // 依據瀏覽器語系選擇對應語系的隱私權聲明
    if (navigator.language.toLowerCase() === 'pt-br') {
      this.language = 'pt-br';
    } else if (navigator.language.indexOf('zh') > -1) {
      this.language = 'zh-tw';
    } else {
      this.language = 'en-us';
    }

  }

}

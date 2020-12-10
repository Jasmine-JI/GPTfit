import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-app-terms',
  templateUrl: './app-terms.component.html',
  styleUrls: ['./app-terms.component.scss']
})
export class AppTermsComponent implements OnInit {

  language = <'zh-tw' | 'en-us' | 'pt-br'>'zh-tw';

  constructor() { }

  ngOnInit(): void {
    // 依據瀏覽器語系選擇對應語系的條款
    if (navigator.language.toLowerCase() === 'pt-br') {
      this.language = 'pt-br';
    } else if (navigator.language.indexOf('zh') > -1) {
      this.language = 'zh-tw';
    } else {
      this.language = 'en-us';
    }

  }

}

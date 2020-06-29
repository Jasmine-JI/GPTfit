import { Component, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-custom-select',
  templateUrl: './custom-select.component.html',
  styleUrls: ['./custom-select.component.scss']
})
export class CustomSelectComponent implements OnInit, OnChanges {

  @Input() selectLists: any;
  @Input() size: any;
  @Input() position: any;
  @Input() fontOpt: any;
  @Input() currentSelectId: number;
  @Input() triangleColor: string;

  @Output() selectItem = new EventEmitter;

  showOptions = false;
  checkClickEvent = false;
  currentSelect = {
    id: 0,
    i18n: 'Choose'
  };

  constructor(
    public translate: TranslateService,
  ) {
    document.addEventListener('click', this.closeMenu.bind(this));
    translate.onLangChange.subscribe(() => {
      this.getTranslate();
    });

  }

  ngOnInit() {
  }

  ngOnChanges () {
    this.getTranslate();
  }

  // 取得翻譯-kidin-1090507
  getTranslate () {
    this.translate.get('hollow world').subscribe(() => {
      this.currentSelect.i18n = this.translate.instant(this.selectLists[0].i18nKey);

      for (let i = 0; i < this.selectLists.length; i++) {
        this.selectLists[i].i18n = this.translate.instant(this.selectLists[i].i18nKey);
      }

      if (this.currentSelectId) {
        this.currentSelect.i18n = this.selectLists[this.currentSelectId].i18n;
      } else {
        this.currentSelect.i18n = this.selectLists[0].i18n;
      }

    });

  }

  // 打開選單
  openMenu () {
    this.showOptions = true;
    this.checkClickEvent = true;
  }

  // 關閉選單
  closeMenu () {
    if (this.checkClickEvent) {
      this.checkClickEvent = false;
    } else {
      this.showOptions = false;
    }

  }

  // 點選項目後回傳父組件-kidin-1090506
  selectOpt (e) {
    this.currentSelect.id = +e.currentTarget.id;
    this.currentSelect.i18n = this.selectLists[this.currentSelect.id].i18n;
    this.selectItem.emit(this.currentSelect.id);
    this.closeMenu();
  }


}

import { Injectable, OnDestroy } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class CustomMatPaginatorIntl extends MatPaginatorIntl
  implements OnDestroy {
  unsubscribe: Subject<void> = new Subject<void>();
  OF_LABEL = 'of';

  constructor(private translate: TranslateService) {
    super();

    this.translate.onLangChange.subscribe(() => {
      this.getAndInitTranslations();
    });

    this.getAndInitTranslations();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }

  getAndInitTranslations() {
    this.translate
      .get([
        'SH.PAGINATOR.ITEMS_PER_PAGE',
        'SH.PAGINATOR.NEXT_PAGE',
        'SH.PAGINATOR.PREVIOUS_PAGE',
        'SH.PAGINATOR.OF_LABEL'
      ])
      .subscribe(translation => {
        this.itemsPerPageLabel = translation['SH.PAGINATOR.ITEMS_PER_PAGE'];
        this.nextPageLabel = translation['SH.PAGINATOR.NEXT_PAGE'];
        this.previousPageLabel = translation['SH.PAGINATOR.PREVIOUS_PAGE'];
        this.OF_LABEL = translation['SH.PAGINATOR.OF_LABEL'];
        this.changes.next();
      });
  }

  getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) {
      return `0 ${this.OF_LABEL} ${length}`;
    }
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    const endIndex =
      startIndex < length
        ? Math.min(startIndex + pageSize, length)
        : startIndex + pageSize;
    let text = '';
    if (this.translate.currentLang === 'zh-tw') {
      text = `第${startIndex + 1} - ${endIndex}筆 ${this.OF_LABEL} ${length} 筆`;
    } else if (this.translate.currentLang === 'zh-cn') {
      text = `第${startIndex + 1} - ${endIndex}笔 ${this.OF_LABEL} ${length} 笔`;
    } else {
      text = `${startIndex + 1} - ${endIndex} ${this.OF_LABEL} ${length}`;
    }
    return text;
  }
}

import { Injectable, OnDestroy } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class CustomMatPaginatorIntl extends MatPaginatorIntl
  implements OnDestroy {
  unsubscribe: Subject<void> = new Subject<void>();

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
        'universal_status_pageCount',
        'universal_operating_nextPage',
        'universal_operating_previousPage'
      ])
      .subscribe(translation => {
        this.itemsPerPageLabel = translation['universal_status_pageCount'];
        this.nextPageLabel = translation['universal_operating_nextPage'];
        this.previousPageLabel = translation['universal_operating_previousPage'];
        this.changes.next();
      });
  }

  getRangeLabel = (page: number, pageSize: number, length: number) => {
    let startIndex = page * pageSize;
    let endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;

    if (length === 0 || pageSize === 0) {
      startIndex = -1;
      endIndex = 0;
    }

    length = Math.max(length, 0);
    const text = this.translate.instant(
      'universal_status_page',
      {
        'number1': startIndex + 1,
        'number2': endIndex,
        'number3': length
      }
    );

    return text;
  }
}

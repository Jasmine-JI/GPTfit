import { Component, OnChanges, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SportsDetailService } from '../../sports-detail.service';
import { Subject, Subscription, fromEvent, merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SportType } from '../../../../../core/enums/sports';
import { QuadrantSetting, QuadrantDataOpt } from '../../../../../core/models/compo';
import { deepCopy, paceToSpeed } from '../../../../../core/utils';
import { UserService } from '../../../../../core/services';
import { DataTypeTranslatePipe, SportPaceSibsPipe } from '../../../../../core/pipes';
import { DataUnitType } from '../../../../../core/enums/common';

@Component({
  selector: 'app-quadrant-setting',
  standalone: true,
  imports: [CommonModule, TranslateModule, DataTypeTranslatePipe, SportPaceSibsPipe],
  templateUrl: './quadrant-setting.component.html',
  styleUrls: ['./quadrant-setting.component.scss', '../../sports-detail.component.scss'],
})
export class QuadrantSettingComponent implements OnChanges, OnDestroy {
  @Input() sportsType: SportType;

  private _ngUnsubscribe = new Subject();

  /**
   * 複數事件訂閱
   */
  private _pluralEvent = new Subscription();

  /**
   * 象限設定備份，用來避免使用者取消編輯後回復設定
   */
  private _originSetting: QuadrantSetting;

  /**
   * 象限圖設定
   */
  quadrantSetting: QuadrantSetting;

  /**
   * 顯示設定與否
   */
  displaySetting = false;

  /**
   * 顯示軸線數據類別設定與否
   */
  displayAxisTypeSetting: 'X' | 'Y' | null = null;

  readonly SportType = SportType;

  constructor(
    private sportsDetailService: SportsDetailService,
    private translate: TranslateService,
    private userService: UserService
  ) {}

  /**
   * 取得使用者使用公或英制
   */
  get unit() {
    return this.userService.getUser().unit as DataUnitType;
  }

  /**
   * 取得運動類別後根據類別再取得象限圖設定
   */
  ngOnChanges() {
    this.subscribeLangChange();
    this.getQuadrantSetting();
  }

  /**
   * 訂閱多國語系變更事件
   */
  subscribeLangChange() {
    this.translate.onLangChange.pipe(takeUntil(this._ngUnsubscribe)).subscribe(() => {
      this.sportsDetailService.setQuadrantSetting(this.sportsType);
    });
  }

  /**
   * 訂閱運動類別取得象限圖設定
   */
  getQuadrantSetting() {
    this.sportsDetailService.setQuadrantSetting(this.sportsType);
    this.sportsDetailService
      .getRxQuadrantSetting()
      .pipe(takeUntil(this._ngUnsubscribe))
      .subscribe((setting) => {
        this._originSetting = deepCopy(setting);
        this.quadrantSetting = deepCopy(setting);
      });
  }

  /**
   * 顯示或隱藏設定選單
   * @param e 滑鼠點擊事件
   */
  toggleSetting(e: MouseEvent) {
    e.stopPropagation();
    const { displaySetting } = this;
    displaySetting ? this.hideSetting() : this.showSetting();
  }

  /**
   * 關閉設定框，並取消訂閱事件
   * @param confirm 是否點擊確認紐
   */
  hideSetting(confirm = false) {
    this.displaySetting = false;
    this.displayAxisTypeSetting = null;
    if (!confirm) this.quadrantSetting = deepCopy(this._originSetting); // 避免使用者已編輯部份設定
    if (this._pluralEvent) this._pluralEvent.unsubscribe();
  }

  /**
   * 關閉設定框，並訂閱事件
   */
  showSetting() {
    this.displaySetting = true;
    this._pluralEvent = this.subscribePluralEvent().subscribe(() => {
      this.hideSetting();
    });
  }

  /**
   * 訂閱複數事件以關閉選單
   */
  subscribePluralEvent() {
    const scrollTarget = document.querySelector('.main__container');
    const scrollEvent = fromEvent(scrollTarget as Element, 'scroll');
    // 使用 mousedown event 替太 click event 可以避免滑鼠框選選單內輸入框文字時，滑鼠移出即關閉選單的問題
    const mouseDownEvent = fromEvent(window, 'mousedown');
    return merge(scrollEvent, mouseDownEvent).pipe(takeUntil(this._ngUnsubscribe));
  }

  /**
   * 點擊整個設定選單，則隱藏其子選單
   * @param e 點擊事件
   */
  clickDropMenu(e: MouseEvent) {
    e.stopPropagation();
    this.displayAxisTypeSetting = null;
  }

  /**
   * 顯示數據類別選單與否
   * @param e 點擊事件
   * @param axis 軸線類別
   */
  toggleTypeMenu(e: InputEvent, axis: 'X' | 'Y') {
    e.stopPropagation();
    const { displayAxisTypeSetting } = this;
    this.displayAxisTypeSetting = axis === displayAxisTypeSetting ? null : axis;
  }

  /**
   * 變更源點類別
   * @param type 源點類別
   * @param axis 軸線源點類別
   */
  changeOriginType(type: QuadrantDataOpt, axis: 'X' | 'Y') {
    const axisKey = axis === 'X' ? 'xAxis' : 'yAxis';
    this.quadrantSetting[axisKey] = {
      type,
      origin: this.sportsDetailService.getQuadrantAxisSetting(type, this.sportsType),
    };

    // 改變類別後，象限象徵亦不相同，故清空讓使用者自訂
    this.quadrantSetting.meaning = {
      quadrantI: '',
      quadrantII: '',
      quadrantIII: '',
      quadrantIV: '',
    };
  }

  /**
   * 確認數值是否為合理值後變更源點數值
   * @param e input變更事件
   * @param axis 軸線源點類別
   */
  changeOriginValue(e: InputEvent, axis: 'X' | 'Y') {
    const { value } = e.target as any;
    const axisKey = axis === 'X' ? 'xAxis' : 'yAxis';
    const { type } = this.quadrantSetting[axisKey];
    const { sportsType, unit } = this;
    this.quadrantSetting[axisKey].origin = value;
    let val: number;
    let isValid = false;
    switch (type) {
      case 'power': {
        val = +value;
        isValid = val > 0 && val < 800;
        break;
      }
      case 'cadence': {
        val = +value;
        isValid = val > 0 && val < 250;
        break;
      }
      case 'speed': {
        const usePace = this.includesSportsType([SportType.run, SportType.swim, SportType.row]);
        val = usePace ? paceToSpeed(value, sportsType, unit) : +value;
        const min = paceToSpeed(`60'00"`, sportsType, unit);
        isValid = val >= min && val < 120;
        break;
      }
      default: {
        val = +value;
        isValid = val > 30 && val < 220;
        break;
      }
    }

    setTimeout(() => {
      this.quadrantSetting[axisKey].origin = isValid
        ? val
        : this.sportsDetailService.getQuadrantAxisSetting(type, sportsType);
    });
  }

  /**
   * 變更各象限象徵意義
   * @param e input變更事件
   * @param quadrant 象限
   */
  changeSymbol(e: Event, quadrant: number) {
    const { value } = e.target as any;
    const key = this.getQuadrantKey(quadrant);
    this.quadrantSetting.meaning[key] = value;
  }

  /**
   * 依據象限類別取得象限設定對應鍵名
   * @param quadrant 象限
   */
  private getQuadrantKey(quadrant: number) {
    const quadrantKey = {
      [1]: 'quadrantI',
      [2]: 'quadrantII',
      [3]: 'quadrantIII',
      [4]: 'quadrantIV',
    };

    return quadrantKey[quadrant];
  }

  /**
   * 返回預設值
   */
  restoreDefault() {
    this.sportsDetailService.setDefaultQuadrantSetting(this.sportsType);
    this.hideSetting(true);
  }

  /**
   * 確認變更設定
   */
  confirmSetting() {
    const { sportsType, quadrantSetting } = this;
    this.sportsDetailService.setQuadrantSetting(sportsType, quadrantSetting);
    this.hideSetting(true);
  }

  /**
   * 運動類別是否為清單中所列
   * @param list 運動類別清單
   */
  includesSportsType(list: Array<SportType>) {
    return list.includes(this.sportsType);
  }

  /**
   * 取消rxjs訂閱
   */
  ngOnDestroy(): void {
    this._ngUnsubscribe.next(null);
    this._ngUnsubscribe.complete();
  }
}

import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TargetField } from '../../core/models/api/api-common/sport-target.model';
import { DateUnit } from '../../core/enums/common';
import { Subject, Subscription, fromEvent, merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SportTargetSymbols } from '../../core/enums/sports';
import { formTest } from '../../shared/models/form-test';
import { TranslateKeyPipe, TranslateUnitKeyPipe } from '../../core/pipes';

@Component({
  selector: 'app-sport-target-setting',
  templateUrl: './sport-target-setting.component.html',
  styleUrls: ['./sport-target-setting.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslateModule, TranslateKeyPipe, TranslateUnitKeyPipe],
})
export class SportTargetSettingComponent implements OnInit, OnDestroy {
  @Input() cycle: DateUnit;
  @Input() condition: Map<TargetField, { symbols: number; filedValue: number }>;
  @Input() isEditMode = false;
  @Input() scrollElement = 'main__container';
  @Output() changeCondition = new EventEmitter();
  @ViewChild('conditionValueInput') conditionValueInput: ElementRef;

  private ngUnsubscribe = new Subject();
  private pluralEventSubscription = new Subscription();

  showFiledNameList = false;

  /**
   * 新目標條件的名稱
   */
  newFiledName: TargetField | null = null;

  /**
   * 新目標條件的數值
   */
  newFiledValue: number | null = null;

  readonly DateUnit = DateUnit;

  constructor() {}

  ngOnInit(): void {}

  /**
   * 選擇新的條件名稱
   * @param field {TargetField}
   */
  selectNewConditionFiled(field: TargetField) {
    this.newFiledName = field;
    if (this.newFiledValue) this.addNewCondition();
    this.foldFiledNameList();
  }

  /**
   * 如果設定為時間相關目標，則需將分鐘轉為秒
   */
  reduceFiledValue(fieldName: TargetField, fieldValue: number) {
    return fieldName.toLowerCase().includes('time') ? fieldValue * 60 : fieldValue;
  }

  /**
   * 展開/收合目標條件名稱清單
   * @param e {MouseEvent}
   */
  toggleFiledNameList(e: MouseEvent) {
    e.stopPropagation();
    this.showFiledNameList ? this.foldFiledNameList() : this.unfoldFiledNameList();
  }

  /**
   * 展開目標條件名稱清單
   */
  unfoldFiledNameList() {
    this.showFiledNameList = true;
    this.subscribePluralEvent();
  }

  /**
   * 收合目標條件名稱
   */
  foldFiledNameList() {
    this.unsubscribePluralEvent();
  }

  /**
   * 偵測全域點擊事件，以收納"群組狀態"選單
   */
  subscribePluralEvent() {
    const element = document.querySelector(`.${this.scrollElement}`) as Element;
    const clickEvent = fromEvent(document, 'click');
    const scrollEvent = fromEvent(element, 'scroll');
    this.pluralEventSubscription = merge(clickEvent, scrollEvent)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((e) => {
        this.unsubscribePluralEvent();
      });
  }

  /**
   * 取消訂閱全域點擊事件
   */
  unsubscribePluralEvent() {
    this.showFiledNameList = false;
    this.pluralEventSubscription.unsubscribe();
  }

  /**
   * 設定目標條件之達成值
   * @param e {MouseEvent}
   */
  setNewConditionValue(e: MouseEvent) {
    const { value } = (e as any).target;
    if (formTest.number.test(value) && +value) {
      this.newFiledValue = +value;
      const { newFiledName, newFiledValue } = this;
      if (newFiledName) {
        if (newFiledName === 'avgHeartRate' && newFiledValue > 190) this.newFiledValue = 190;
        this.addNewCondition();
      }
    } else {
      (e as any).target.value = '';
    }
  }

  /**
   * 將設定好的新條件納入目標中，若條件名稱重複則覆蓋舊條件
   */
  addNewCondition() {
    const newFiledName = this.newFiledName as TargetField;
    const newFiledValue = this.newFiledValue as number;
    const filedValue = this.reduceFiledValue(newFiledName, newFiledValue);
    this.condition.set(newFiledName, { symbols: SportTargetSymbols.greaterOrEqual, filedValue });
    this.changeCondition.emit(this.condition);
    this.clearInput();
  }

  /**
   * 移除指定之條件
   * @param fieldName {TargetField}-條件序列
   */
  deleteCondition(fieldName: TargetField) {
    this.condition.delete(fieldName);
    this.changeCondition.emit(this.condition);
  }

  /**
   * 將輸入框內容清空
   */
  clearInput() {
    this.newFiledName = null;
    this.newFiledValue = null;
    const inputElement = this.conditionValueInput.nativeElement;
    if (inputElement) {
      inputElement.value = '';
    }
  }

  /**
   * 解除rxjs訂閱與事件訂閱
   */
  ngOnDestroy(): void {
    this.unsubscribePluralEvent();
    this.ngUnsubscribe.next(null);
    this.ngUnsubscribe.complete();
  }
}

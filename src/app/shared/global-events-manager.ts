import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { RankForms } from './models/rankForm';

@Injectable()
export class GlobalEventsManager {

  private _showMask: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private _openCollapse: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private _closeCollapse: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private _getMapOptions: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  private _getMapId: BehaviorSubject<number> = new BehaviorSubject<number>(5);
  private _getRankForm = new BehaviorSubject<any>(undefined);
  private _showLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private _getIsFoundUser: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private _getTabIdx: BehaviorSubject<number> = new BehaviorSubject<number>(2); // 排行版tab預設為2
  private _getRankTabs: BehaviorSubject<any> = new BehaviorSubject<any>([]);

  public showNavBarEmitter: Observable<boolean> = this._showMask.asObservable();
  public showCollapseEmitter: Observable<boolean> = this._openCollapse.asObservable();
  public closeCollapseEmitter: Observable<boolean> = this._closeCollapse.asObservable();
  public getMapOptionsEmitter: Observable<any> = this._getMapOptions.asObservable();
  public getMapIdEmitter: Observable<number> = this._getMapId.asObservable();
  public getRankFormEmitter: Observable<RankForms> = this._getRankForm.asObservable();
  public showLoadingEmitter: Observable<boolean> = this._showLoading.asObservable();
  public getIsFoundUserEmitter: Observable<boolean> = this._getIsFoundUser.asObservable();
  public getTabIdxEmitter: Observable<number> = this._getTabIdx.asObservable();
  public getRankTabsEmitter: Observable<number> = this._getRankTabs.asObservable();

  constructor() { }

  showLoading(ifShow: boolean) {
    this._showLoading.next(ifShow);
  }

  showMask(ifShow: boolean) {
    this._showMask.next(ifShow);
  }

  openCollapse(ifOpen: boolean) {
    this._openCollapse.next(ifOpen);
  }

  closeCollapse(ifClose: boolean) {
    this._closeCollapse.next(ifClose);
  }
  getMapOptions(mapOptions) {
    this._getMapOptions.next(mapOptions);
  }

  getMapId(id: number) {
    this._getMapId.next(id);
  }
  getRankForm(data: any) {
    this._getRankForm.next(data);
  }
  getIsFoundUser(isFoundUser: any) {
    this._getIsFoundUser.next(isFoundUser);
  }
  getTabIdx(id: number) {
    this._getTabIdx.next(id);
  }
  getRankTabs(datas: any) {
    this._getRankTabs.next(datas);
  }
}

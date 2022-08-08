import { Injectable } from '@angular/core';
import { Api11xxService } from '../../../core/services/api-11xx.service';
import { AuthService } from '../../../core/services/auth.service';
import { BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { checkResponse } from '../../../shared/utils/index';
import { UserService } from '../../../core/services/user.service';
import { AccessRight } from '../../../shared/enum/accessright';
import { GroupAccessrightInfo } from '../../../shared/models/group';
import { GroupJoinStatus, GroupLevel } from '../../../shared/enum/professional';
import { REGEX_GROUP_ID } from '../../../shared/models/utils-constant';
import { GroupInfo } from '../../../shared/classes/group-info';

@Injectable({
  providedIn: 'root',
})
export class ProfessionalService {
  /**
   * 使用者所有群組權限
   */
  private _allAccessright: Array<GroupAccessrightInfo>;

  /**
   * 目前所在群組之編號
   */
  private _currentGroupId: string;

  /**
   * 使用者於該群組之權限
   */
  private _groupAccessright$ = new BehaviorSubject(AccessRight.guest);

  constructor(private authService: AuthService, private api11xxService: Api11xxService) {
    this.refreshAllGroupAccessright();
  }

  /**
   * 取得使用者於該群組之權限
   */
  get groupAccessright() {
    return this._groupAccessright$;
  }

  /**
   * 取得是否為該群組之管理員（不含以上權限）
   */
  get isAdmin() {
    if (!this._allAccessright) return false;

    const currentAccessRight = this._allAccessright.filter(
      (_list) => _list.groupId === this._currentGroupId
    );
    if (!currentAccessRight[0]) return false;

    return +currentAccessRight[0].accessRight <= AccessRight.coachAdmin;
  }

  /**
   * 透過api 1113取得使用者所有群組權限值
   */
  refreshAllGroupAccessright() {
    const body = { token: this.authService.token };
    this.api11xxService
      .fetchMemberAccessRight(body)
      .pipe(
        map((res: any) => {
          const result = checkResponse(res, false) ? res.info.groupAccessRight : [];
          this._allAccessright = result.filter(
            (_accessright) => _accessright.joinStatus === GroupJoinStatus.allow
          );
          return result;
        }),
        tap((result) => this.checkGroupAccessright(this._currentGroupId, true))
      )
      .subscribe();
  }

  /**
   * 取得使用者在該群組之權限
   * @param groupId {string}-群組編號
   * @param init {GroupLevel}-是否為取得api 1113後初始化之步驟
   */
  checkGroupAccessright(groupId: string, init = false) {
    if (init || groupId !== this._currentGroupId) {
      const accessright = this.filterGroupAccessright(groupId);
      this._currentGroupId = groupId;
      this._groupAccessright$.next(accessright);
    }
  }

  /**
   * 篩選使用者在該群組之權限
   * @param groupId {string}-群組編號
   * @param groupLevel {GroupLevel}-群組階層
   * @author kidin-1110314
   */
  filterGroupAccessright(groupId: string): AccessRight {
    if (this._allAccessright) {
      const {
        groups: { brandId, branchId, classId },
      } = REGEX_GROUP_ID.exec(groupId);
      const groupLevel = GroupInfo.getGroupLevel(groupId);
      const relateAccessright = this._allAccessright
        .filter((_accessright) => {
          const {
            groups: { brandId: _brandId, branchId: _branchId, classId: _classId },
          } = REGEX_GROUP_ID.exec(_accessright.groupId);
          const sameBrand = brandId === _brandId;
          const sameBranch = sameBrand && branchId === _branchId;
          const sameClass = sameBranch && classId === _classId;
          const brandLevel = sameBrand && _branchId === '0';
          const branchLevel = sameBranch && _classId === '0';
          switch (groupLevel) {
            case GroupLevel.brand:
              return brandLevel;
            case GroupLevel.branch:
              return brandLevel || branchLevel;
            case GroupLevel.class:
              return brandLevel || branchLevel || sameClass;
          }
        })
        .sort((a, b) => +a.accessRight - +b.accessRight);

      return relateAccessright[0] ? +relateAccessright[0].accessRight : AccessRight.guest;
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { SystemFolderPermissionService } from '../../services/system-folder-permission.service';
import { UtilsService } from '../../../../shared/services/utils.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MessageBoxComponent } from '../../../../shared/components/message-box/message-box.component';
import { AuthService } from '../../../../core/services/auth.service';

enum DevelopGroup {
  app = 1,
  watch,
  treadmill,
}

enum FwVersion {
  RD_FW = 1,
  RD_FW_2,
}

type ListEditMode = 'delUser' | 'addFolder' | 'delFolder';

@Component({
  selector: 'app-system-folder-permission',
  templateUrl: './system-folder-permission.component.html',
  styleUrls: ['./system-folder-permission.component.scss'],
})
export class SystemFolderPermissionComponent implements OnInit {
  constructor(
    private systemFolderPermissionService: SystemFolderPermissionService,
    private utils: UtilsService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private authService: AuthService
  ) {}

  /**
   * ui會用到的各個flag
   */
  uiFlag = {
    focusName: <string>null,
    createType: <'user' | 'folder'>null,
    newAccountEmpty: false,
    newAccountRepeat: false,
    newPasswordEmpty: false,
    newProjectNameEmpty: false,
    newProjectNameRepeat: false,
    checkPwdEmpty: false,
    pwdCheckError: false,
    showNewPwd: false,
    showCheckPwd: false,
    addFolderRepeat: false,
    listMode: <ListEditMode>null,
  };

  /**
   * 欲建立之使用者資訊
   */
  createBody = {
    newAccount: '',
    newPassword: '',
    checkPwd: '',
    newProjectName: '',
    version: 1,
    assignGroup: 1,
  };

  /**
   * api 0004所需編輯資訊
   */
  listEditBody = {
    username: '',
    folder: <Array<string>>[],
  };

  token = this.authService.token;
  userList: Array<string>;
  folderList: Array<string>;
  tempAddFolderName = '';
  selectTempAddList: Array<string> = [];
  inputTempAddList: Array<string> = [];
  candidateFolderList: Array<string>;
  readonly group = DevelopGroup;
  readonly version = FwVersion;

  ngOnInit(): void {
    this.getUserList();
  }

  /**
   * 取得可存取的使用者列表
   * @author kidin-1100729
   */
  getUserList() {
    const body = {
      token: this.token,
      category: 1,
    };

    this.systemFolderPermissionService.getSysList(body).subscribe((res) => {
      const { apiCode, resultCode, resultMessage, info } = res;
      if (resultCode !== 200) {
        const msg = `${apiCode}: ${resultMessage}`;
        this.utils.openAlert(msg);
      } else {
        this.userList = info.userList;
      }
    });
  }

  /**
   * 取得指定使用者有權限之資料夾或刪除
   * @param username {string}-指定的使用者
   * @author kidin-1100729
   */
  handleClickUser(username: string) {
    if (this.uiFlag.listMode !== 'delUser') {
      this.uiFlag.focusName = username;
      const body = {
        token: this.token,
        category: 2,
        username,
      };

      this.systemFolderPermissionService.getSysList(body).subscribe((res) => {
        const { apiCode, resultCode, resultMessage, info } = res;
        if (resultCode !== 200) {
          const msg = `${apiCode}: ${resultMessage}`;
          this.utils.openAlert(msg);
        } else {
          const { accessFolderList, folderList } = info;
          this.folderList = accessFolderList ?? [];
          this.candidateFolderList = this.getCandidateFolderList(folderList);
        }
      });
    } else {
      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'message',
          body: `確認刪除 "${username}" ？`,
          confirmText: '確認',
          onConfirm: () => this.delUserConfirm(username),
          cancelText: '取消',
        },
      });
    }
  }

  /**
   * 打開建立界面
   * @param type {'user' | 'folder'}-使用者或資料夾
   * @author kidin-1100729
   */
  openCreation(type: 'user' | 'folder') {
    this.uiFlag.createType = type;
    this.cancelEditList();
  }

  /**
   * 取消建立
   * @author kidin-1100729
   */
  cancelCreate() {
    this.createBody = {
      newAccount: null,
      newPassword: null,
      checkPwd: '',
      newProjectName: null,
      version: 1,
      assignGroup: 1,
    };

    this.initCheck();
  }

  /**
   * 帳號輸入
   * @param e {Event}
   * @author kidin-1100729
   */
  handleAccount(e: Event) {
    const value = (e as any).currentTarget.value;
    if (this.userList.includes(value)) {
      this.uiFlag.newAccountRepeat = true;
    } else {
      this.uiFlag.newAccountRepeat = false;
      this.createBody.newAccount = value;
      this.checkInputEmpty('newAccount');
    }
  }

  /**
   * 密碼輸入
   * @param e {Event}
   * @author kidin-1100729
   */
  handlePwd(e: Event) {
    this.createBody.newPassword = (e as any).currentTarget.value;
    this.checkInputEmpty('newPassword');
    const { checkPwd, newPassword } = this.createBody;
    if (checkPwd.length > 0 && checkPwd !== newPassword) {
      this.uiFlag.pwdCheckError = true;
    } else if (checkPwd.length > 0) {
      this.uiFlag.pwdCheckError = false;
    }
  }

  /**
   * 再次密碼輸入
   * @param e {Event}
   * @author kidin-1100730
   */
  handleCheckPwd(e: Event) {
    this.createBody.checkPwd = (e as any).currentTarget.value;
    this.checkInputEmpty('checkPwd');
    const { checkPwd, newPassword } = this.createBody;
    if (newPassword.length > 0 && checkPwd !== newPassword) {
      this.uiFlag.pwdCheckError = true;
    } else if (newPassword.length > 0) {
      this.uiFlag.pwdCheckError = false;
    }
  }

  /**
   * 選擇開發群組
   * @param e {Event}
   * @author kidin-1100729
   */
  changeGroup(assignGroup: 1 | 2 | 3) {
    this.createBody.assignGroup = assignGroup;
  }

  /**
   * 資料夾名稱輸入
   * @param e {Event}
   * @author kidin-1100729
   */
  handleFolderName(e: Event) {
    const value = (e as any).currentTarget.value;
    if (this.folderList && this.folderList.includes(value)) {
      this.uiFlag.newProjectNameRepeat = true;
    } else {
      this.uiFlag.newProjectNameRepeat = false;
      this.createBody.newProjectName = value;
      this.checkInputEmpty('newProjectName');
    }
  }

  /**
   * 選擇分位版本
   * @param e {Event}
   * @author kidin-1100729
   */
  changeFwVersion(version: 1 | 2) {
    this.createBody.version = version;
  }

  /**
   * 確認輸入欄位是否為空
   * @param type {'newAccount' | 'newPassword' | 'newProjectName'}-輸入框類別
   * @author kidin-1100729
   */
  checkInputEmpty(type: 'newAccount' | 'newPassword' | 'newProjectName' | 'checkPwd') {
    if (this.createBody[type].length === 0) {
      this.uiFlag[`${type}Empty`] = true;
    } else {
      this.uiFlag[`${type}Empty`] = false;
    }
  }

  /**
   * 初始化輸入框檢查狀態
   * @author kidin-1100729
   */
  initCheck() {
    this.uiFlag.createType = null;
    this.uiFlag.newAccountEmpty = false;
    this.uiFlag.newAccountRepeat = false;
    this.uiFlag.newPasswordEmpty = false;
    this.uiFlag.newProjectNameEmpty = false;
    this.uiFlag.newProjectNameRepeat = false;
    this.uiFlag.checkPwdEmpty = false;
    this.uiFlag.pwdCheckError = false;
    this.uiFlag.showNewPwd = false;
    this.uiFlag.showCheckPwd = false;
  }

  /**
   * 確認建立
   * @author kidin-1100729
   */
  handleCreate() {
    const { createType } = this.uiFlag;
    if (createType === 'user') {
      this.checkInputEmpty('newAccount');
      this.checkInputEmpty('newPassword');
    } else {
      this.checkInputEmpty('newProjectName');
    }

    const {
      newAccountEmpty,
      newAccountRepeat,
      newPasswordEmpty,
      newProjectNameEmpty,
      newProjectNameRepeat,
      checkPwdEmpty,
      pwdCheckError,
    } = this.uiFlag;
    if (
      newAccountEmpty ||
      newPasswordEmpty ||
      newProjectNameEmpty ||
      checkPwdEmpty ||
      pwdCheckError ||
      newAccountRepeat ||
      newProjectNameRepeat
    ) {
      return false;
    } else {
      const { newAccount, newPassword, newProjectName, version, assignGroup } = this.createBody;
      let body: any;
      if (this.uiFlag.createType === 'user') {
        body = {
          token: this.token,
          newAccount,
          newPassword,
          assignGroup,
        };

        this.createUser(body);
      } else {
        body = {
          token: this.token,
          newProjectName,
          version,
          assignGroup,
        };

        this.createFolder(body);
      }
    }
  }

  /**
   * 將使用者輸入的密碼進行隱藏或顯示
   * @param element {string}-指定顯示或隱藏的輸入框
   * @author kidin-1100730
   */
  toggleDisplayPW(element: 'pwd' | 'check__pwd') {
    const flag = element === 'pwd' ? 'showNewPwd' : 'showCheckPwd';
    const pwInputType = <HTMLInputElement>document.getElementById(element);
    if (this.uiFlag[flag]) {
      this.uiFlag[flag] = false;
      pwInputType.type = 'password';
    } else {
      this.uiFlag[flag] = true;
      pwInputType.type = 'text';
    }
  }

  /**
   * 建立使用者帳號
   * @param body {any}-api 0001的request body
   * @author kidin-1100730
   */
  createUser(body: any) {
    this.systemFolderPermissionService.createSysAccount(body).subscribe((res) => {
      const { apiCode, resultCode, resultMessage } = res;
      if (resultCode !== 200) {
        const msg = `${apiCode}: ${resultMessage}`;
        this.utils.openAlert(msg);
      } else {
        this.userList.push(body.newAccount);
        this.snackBar.open('建立帳號成功', 'ok', { duration: 2000 });
        this.initCheck();
        this.uiFlag.createType = null;
      }
    });
  }

  /**
   * 建立專案資料夾
   * @param body {any}-api 0001的request body
   * @author kidin-1100730
   */
  createFolder(body: any) {
    this.systemFolderPermissionService.createSysFolder(body).subscribe((res) => {
      const { apiCode, resultCode, resultMessage } = res;
      if (resultCode !== 200) {
        const msg = `${apiCode}: ${resultMessage}`;
        this.utils.openAlert(msg);
      } else {
        this.snackBar.open('建立專案資料夾成功', 'ok', { duration: 2000 });
        this.initCheck();
        this.uiFlag.createType = null;
      }
    });
  }

  /**
   * 開啟編輯模式
   * @param mode {ListEditMode}-編輯模式類別
   * @author kidin-1100730
   */
  openEditMode(mode: ListEditMode) {
    this.uiFlag.listMode = mode;
    if (mode !== 'delUser') {
      this.listEditBody.username = this.uiFlag.focusName;
    } else {
      this.uiFlag.focusName = null;
      this.folderList = [];
    }
  }

  /**
   * 將目標帳號之資料夾權限與所有資料夾權限進行比對
   * @param allList {Array<string>}-所有可設定的資料夾權限
   * @author kidin-1100802
   */
  getCandidateFolderList(allList: Array<string>): Array<string> {
    const candidateList = allList.filter((_allList) => {
      let notAdd = true;
      this.folderList.forEach((_list) => {
        if (_allList === _list) notAdd = false;
      });

      return notAdd;
    });

    return candidateList;
  }

  /**
   * 取消編輯
   * @author kidin-1100730
   */
  cancelEditList() {
    this.uiFlag.listMode = null;
    this.initEdit();
  }

  /**
   * 確定刪除使用者
   * @param username {string}-指定的使用者
   * @author kidin-1100730
   */
  delUserConfirm(username: string) {
    const body = {
      token: this.token,
      username,
    };

    this.systemFolderPermissionService.delSysAccount(body).subscribe((res) => {
      const { apiCode, resultCode, resultMessage } = res;
      if (resultCode !== 200) {
        const msg = `${apiCode}: ${resultMessage}`;
        this.utils.openAlert(msg);
      } else {
        this.userList = this.userList.filter((_user) => _user !== username);
        this.snackBar.open('刪除成功', 'ok', { duration: 2000 });
        this.uiFlag.listMode = null;
      }
    });
  }

  /**
   * 確定變更該使用者資料夾權限
   * @author kidin-1100730
   */
  editFolderConfirm() {
    const { listMode } = this.uiFlag;
    if (listMode === 'addFolder') {
      this.userAddFolder();
    } else if (listMode === 'delFolder') {
      this.openDelFolderAlert();
    }
  }

  /**
   * 確認資料夾名稱後列入暫定加入資料夾權限
   * @param name {string}-資料夾名稱
   * @author kidin-1100802
   */
  addTempFolder(name: string) {
    const haveName = name.length > 0,
      currentFolderRepeat = this.folderList.includes(name),
      tempFolderRepeat = this.inputTempAddList.includes(name);
    if (haveName && !currentFolderRepeat && !tempFolderRepeat) {
      this.inputTempAddList.push(name);
      this.tempAddFolderName = '';
      this.uiFlag.addFolderRepeat = false;
    } else if (haveName && (currentFolderRepeat || tempFolderRepeat)) {
      this.uiFlag.addFolderRepeat = true;
    } else {
      this.uiFlag.addFolderRepeat = false;
    }
  }

  /**
   * 初始化列表編輯模式
   * @author kidin-1100802
   */
  initEdit() {
    this.selectTempAddList = [];
    this.inputTempAddList = [];
    this.tempAddFolderName = '';
    this.uiFlag.addFolderRepeat = false;
    this.listEditBody = {
      username: '',
      folder: [],
    };
  }

  /**
   * 移除暫定新增之資料夾
   * @param folder {string}-資料夾名稱
   */
  handleDelTempFolder(folder: string) {
    this.inputTempAddList = this.inputTempAddList.filter((_list) => _list !== folder);
  }

  /**
   * 加入選擇的資料夾權限
   * @param candidate {string}-可以設定的資料夾權限
   * @author kidin-1100802
   */
  selectCandidate(candidate: string) {
    const { folder } = this.listEditBody;
    if (folder.includes(candidate)) {
      this.listEditBody.folder = folder.filter((_folder) => _folder !== candidate);
    } else {
      this.listEditBody.folder.push(candidate);
    }
  }

  /**
   * 新增指定帳號的資料夾權限
   * @author kidin-1100802
   */
  userAddFolder() {
    const { username, folder } = this.listEditBody,
      allAddFolder = folder.concat(this.inputTempAddList);
    if (allAddFolder.length > 0) {
      const body = {
        token: this.token,
        category: 1,
        username,
        folder: allAddFolder,
      };

      this.systemFolderPermissionService.setUserAccessRight(body).subscribe((res) => {
        const { apiCode, resultCode, resultMessage } = res;
        if (resultCode !== 200) {
          const msg = `${apiCode}: ${resultMessage}`;
          this.utils.openAlert(msg);
        } else {
          this.folderList = this.folderList.concat(allAddFolder);
          this.snackBar.open('新增權限成功', 'ok', { duration: 2000 });
          this.uiFlag.listMode = null;
          this.initEdit();
        }
      });
    } else {
      this.uiFlag.listMode = null;
      this.initEdit();
    }
  }

  /**
   * 點擊欲刪除之資料夾
   * @param del {string}-欲刪除的資料夾權限名稱
   * @author kidin-1100802
   */
  selectDelFolder(del: string) {
    const { folder } = this.listEditBody;
    if (folder.includes(del)) {
      this.listEditBody.folder = this.listEditBody.folder.filter((_folder) => _folder !== del);
    } else {
      this.listEditBody.folder.push(del);
    }
  }

  /**
   * 顯示彈跳視窗確認是否刪除資料夾權限
   * @author kidin-1100802
   */
  openDelFolderAlert() {
    const { username, folder } = this.listEditBody;
    if (folder.length > 0) {
      let delList = '';
      folder.forEach((_folder) => {
        delList += `「${_folder}」, `;
      });

      this.dialog.open(MessageBoxComponent, {
        hasBackdrop: true,
        data: {
          title: 'message',
          body: `"${username}"將移除${delList}權限，是否繼續？`,
          confirmText: '確認',
          onConfirm: () => this.userDelFolder(),
          cancelText: '取消',
        },
      });
    } else {
      this.uiFlag.listMode = null;
      this.initEdit();
    }
  }

  /**
   * 刪除指定帳號的資料夾權限
   * @author kidin-1100802
   */
  userDelFolder() {
    const { username, folder } = this.listEditBody,
      body = {
        token: this.token,
        category: 2,
        username,
        folder,
      };

    this.systemFolderPermissionService.setUserAccessRight(body).subscribe((res) => {
      const { apiCode, resultCode, resultMessage } = res;
      if (resultCode !== 200) {
        const msg = `${apiCode}: ${resultMessage}`;
        this.utils.openAlert(msg);
      } else {
        this.folderList = this.folderList.filter((_list) => {
          let remain = true;
          folder.forEach((_folder) => {
            if (_folder === _list) remain = false;
          });

          return remain;
        });

        this.snackBar.open('刪除權限成功', 'ok', { duration: 2000 });
        this.uiFlag.listMode = null;
        this.initEdit();
      }
    });
  }
}

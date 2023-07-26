export const appPath = {
  /**
   * 首頁
   */
  home: '',

  /**
   * 群組
   */
  professional: {
    groupId: 'groupId', // 群組流水編號，作為路徑變數使用
    groupDetail: {
      home: 'group-info',
      introduction: 'group-introduction',
      commercePlan: 'commerce-plan',
      groupArchitecture: 'group-architecture',
      memberList: 'member-list',
      adminList: 'admin-list',
      operationReport: 'operation-report',
      myclassReport: 'myclass-report',
      classAnalysis: 'class-analysis',
      sportsReport: 'sports-report',
      lifeTracking: 'life-tracking',
      cloudrunReport: 'cloudrun-report',
      deviceList: 'device-list',
    },
    groupSearch: 'group-search',
    myGroupList: 'my-group-list',
  },

  /**
   * 個人
   */
  personal: {
    home: 'user-profile', // 非登入或他人頁面
    fileId: 'fileId', // 檔案流水編號，作為路徑變數使用
    userId: 'userId', // 使用者流水編號，作為路徑變數使用
    activityDetail: 'activity',
    userSettings: 'user-settings',
    stravaRedirectSettings: 'settings/account-info', // strava 轉導用網址，如需修改需與後端一同更動
    activityList: 'activity-list',
    sportsReport: 'sport-report',
    lifeTracking: 'life-tracking',
    cloudrun: 'cloudrun',
    info: 'info',
  },

  /**
   * 裝置管理
   */
  device: {
    home: 'device',
    deviceSn: 'deviceSN',
    info: 'info',
    pair: 'pair', // 此路徑勿變動，會影響到舊有產品Qrcode無法使用
  },

  /**
   * 後台管理，限系統管理員操作頁面
   */
  adminManage: {
    home: 'system',
    settingMember: 'setting-member',
    deviceLog: {
      home: 'device-log',
      detail: 'detail',
    },
    allGroupList: 'all-group-list',
    createBrandGroup: 'create-brand-group',
    createComGroup: 'create-com-group',
    innerTest: 'inner-test',
    innerGpx: 'inner-gpx',
    devicePairManagement: 'device-pair-management',
    lifeTracking: 'life-tracking',
    createPush: 'create-push',
    pushDetail: 'push-detail',
    pushList: 'push-list',
    systemLog: 'system-log',
    folderPermission: 'folder-permission',
    alaAppAnalysis: 'ala-app-analysis',
    systemOperationReport: 'system-operation-report',
    groupOperationList: 'group-operation-list',
  },

  /**
   * 官方活動（限台灣區）
   */
  officialActivity: {
    home: 'official-activity',
    activityList: 'activity-list',
    myActivity: 'my-activity',
    eventId: 'eventId', // 活動流水編號，作為路徑變數使用
    activityDetail: 'activity-detail',
    applyActivity: 'apply-activity',
    leaderboard: 'leaderboard',
    contestantList: 'contestant-list',
    editActivity: 'edit-activity',
    aboutCloudrun: 'about-cloudrun',
    contactUs: 'contact-us',
    editCarousel: 'edit-carousel',
  },

  /**
   * 站內信
   */
  stationMail: {
    home: 'station-mail',
    newMail: 'new-mail',
    mailDetail: 'mail-detail',
    inbox: 'inbox',
    receiverList: 'receiver-list',
  },

  /**
   * 大型設備透過Qrcode連至GPTfit上傳運動檔案，所以此路徑勿變動
   */
  qrcodeUploadData: 'qrupload/activityfile',

  /**
   * 登入前頁面
   */
  portal: {
    home: '',
    introduction: {
      home: 'introduction',
      system: '#system',
      application: '#application',
      analysis: '#analysis',
      cloudrunAnchor: '#cloudrun',
      connectAnchor: '#connect',
      trainliveAnchor: '#trainlive',
      fitnessAnchor: '#fitness',
    },
    signIn: 'signIn', // 用於 app webview
    register: 'register', // 用於 app webview
    enableAccount: 'enableAccount', // 用於 app webview，此路徑如需變動需跟後端一起變動，否則影響簡訊與電子郵件帳號啟用
    resetPassword: 'resetPassword', // 用於 app webview，此路徑如需變動需跟後端一起變動，否則影響簡訊與電子郵件帳號忘記密碼流程
    editPassword: 'editPassword', // 用於 app webview
    changeAccount: 'changeAccount', // 用於 app webview
    signInQrcode: 'signInQrcode', // 顯示qrcode，此路徑如需變動，可能影響其他app webview使用qrcode登入
    qrSignIn: 'qrSignIn', // 掃描Qrcode後的顯示頁面，此路徑如需變動，可能影響其他app webview使用qrcode登入
    firstLogin: 'firstLogin', // 用於 app webview
    compressData: 'compressData',
    destroyAccount: 'destroyAccount',
    registerWeb: 'register-web', // 用於 gptfit
    signInWeb: 'signIn-web', // 用於 gptfit
    enableAccountWeb: 'enableAccount-web', // 用於 gptfit
    resetPasswordWeb: 'resetPassword-web', // 用於 gptfit
    editPasswordWeb: 'editPassword-web', // 用於 gptfit
    changeAccountWeb: 'changeAccount-web', // 用於 gptfit
    signInQrcodeWeb: 'signInQrcode-web', // 用於 gptfit 顯示qrcode
    qrSignInWeb: 'qrSignIn-web', // 用於 gptfit 掃描 Qrcode 後的顯示頁面
    firstLoginWeb: 'firstLogin-web', // 用於 gptfit
  },

  /**
   * 登入後頁面(舊)
   */
  dashboard: {
    home: 'dashboard',
    classId: 'classId', // 開課流水編號，作為路徑變數使用
    coachDashboard: 'coach-dashboard',
    trainLive: 'train-live',
  },

  /**
   * 無權限訪問
   */
  pageNoPermission: '403',

  /**
   * 頁面不存在
   */
  pageNotFound: '404',

  /**
   * 重訓次數計算測試用頁面，不公開
   */
  gsensor: 'gsensor',
};

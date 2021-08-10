/**
 * 目前所有app
 */
export enum alaApp {
  gptfit,
  connect,
  cloudrun,
  trainlive,
  fitness,
  all = 99
}

/**
 * 各平台代碼
 */
export type AppId = 
  alaApp.gptfit | alaApp.connect | alaApp.cloudrun | alaApp.trainlive | alaApp.fitness | alaApp.all;
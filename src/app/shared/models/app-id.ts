/**
 * 目前所有app
 */
export enum alaApp {
  center,
  connect,
  cloudrun,
  trainlive,
  fitness
}

/**
 * 各平台代碼
 */
export type AppId = 
  alaApp.center | alaApp.connect | alaApp.cloudrun | alaApp.trainlive | alaApp.fitness;
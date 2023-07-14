/**
 * 運動類別代碼清單
 */
export enum SportType {
  run = 1,
  cycle,
  weightTrain,
  swim,
  aerobic,
  row,
  ball,
  all = 99,
  complex, // 複合式運動
  translate, // 轉換區，即兩個不同類別運動間轉換的過渡區
  rest, // 休息圈
}

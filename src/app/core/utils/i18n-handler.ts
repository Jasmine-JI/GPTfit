import { TranslateService } from '@ngx-translate/core';

/**
 * 取得各心率區間翻譯詞彙
 * @param translate {TranslateService}-翻譯套件
 */
export function getHrZoneTranslation(translate: TranslateService) {
  return [
    translate.instant('universal_activityData_limit_generalZone'),
    translate.instant('universal_activityData_limit_warmUpZone'),
    translate.instant('universal_activityData_limit_aerobicZone'),
    translate.instant('universal_activityData_limit_enduranceZone'),
    translate.instant('universal_activityData_limit_marathonZone'),
    translate.instant('universal_activityData_limit_anaerobicZone'),
  ];
}

/**
 * 取得各閾值區間翻譯詞彙
 * @param translate {TranslateService}-翻譯套件
 */
export function getFtpZoneTranslation(translate: TranslateService) {
  return [
    translate.instant('universal_activityData_limit_ftpZ0'),
    translate.instant('universal_activityData_limit_ftpZ1'),
    translate.instant('universal_activityData_limit_ftpZ2'),
    translate.instant('universal_activityData_limit_ftpZ3'),
    translate.instant('universal_activityData_limit_ftpZ4'),
    translate.instant('universal_activityData_limit_ftpZ5'),
    translate.instant('universal_activityData_limit_ftpZ6'),
  ];
}

/**
 * 取得各肌群翻譯詞彙
 * @param translate {TranslateService}-翻譯套件
 */
export function getMuscleGroupTranslation(translate: TranslateService) {
  return [
    translate.instant('universal_muscleName_armMuscles'),
    translate.instant('universal_muscleName_pectoralsMuscle'),
    translate.instant('universal_muscleName_shoulderMuscle'),
    translate.instant('universal_muscleName_backMuscle'),
    translate.instant('universal_muscleName_abdominalMuscle'),
    translate.instant('universal_muscleName_legMuscle'),
  ];
}

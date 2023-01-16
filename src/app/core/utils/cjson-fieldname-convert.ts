/**
 * 裝置 fieldName 代號轉為翻譯鍵名
 * @param code {string}-方案統計數據代號
 */
export function groupPlanCodeConvert(code: string) {
  switch (code) {
    case 'p1':
      return 'universal_group_experiencePlan';
    case 'p2':
      return 'universal_group_studioPlan';
    case 'p3':
      return 'universal_group_smePlan';
    case 'p99':
      return 'universal_group_customPlan';
    default:
      return 'universal_vocabulary_other';
  }
}

/**
 * 將群組統計數據名稱轉為翻譯鍵名
 * @param name {string}-統計數據名稱
 */
export function groupOverViewConvert(name: string) {
  switch (name) {
    case 'brandCounts':
      return '品牌數';
    case 'branchCounts':
      return 'universal_group_numberOfBranches';
    case 'classCounts':
      return 'universal_group_numberOfClass';
    case 'memberCounts':
      return '總學員數';
    case 'fileCounts':
      return '總檔案數';
    case 'deviceCounts':
      return '裝置使用次數';
    default:
      return 'universal_vocabulary_other';
  }
}

/**
 * 裝置 fieldName 代號轉為翻譯鍵名
 * @param code {string}-裝置統計數據代號
 */
export function ageCodeConvert(code: string) {
  switch (code) {
    case 'o1':
      return '20歲以下';
    case 'o2':
      return '21-30歲';
    case 'o3':
      return '31-40歲';
    case 'o4':
      return '41-50歲';
    case 'o5':
      return '51-60歲';
    case 'o6':
      return '61歲以上';
    default:
      return 'universal_vocabulary_other';
  }
}

import { CommercePlan } from '../enums/professional';

/**
 * 裝置 fieldName 代號轉為翻譯鍵名
 * @param code {string}-方案統計數據代號
 */
export function groupPlanCodeConvert(code: string | number) {
  const checkCode = code.toString().includes('p') ? +(code as string).split('p')[1] : code;
  switch (checkCode) {
    case CommercePlan.tryOut:
      return 'universal_group_experiencePlan';
    case CommercePlan.studio:
      return 'universal_group_studioPlan';
    case CommercePlan.company:
      return 'universal_group_smePlan';
    case CommercePlan.enterprise:
      return '大型企業方案';
    case CommercePlan.multinational:
      return '跨國企業方案';
    case CommercePlan.custom:
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
      return 'universal_group_totalUsers';
    case 'fileCounts':
      return '總檔案數';
    case 'deviceUsedCounts':
      return '裝置使用次數';
    default:
      return 'universal_vocabulary_other';
  }
}

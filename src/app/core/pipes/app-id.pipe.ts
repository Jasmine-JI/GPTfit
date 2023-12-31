import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appId',
  standalone: true,
})
export class AppIdPipe implements PipeTransform {
  /**
   * 將app id轉成app 名稱或介紹
   * @param value {number}-app id
   * @returns {string}-app name
   */
  transform(value: number, args: 'name' | 'descriptionKey' = 'name'): string | null {
    const name = ['GPTfit', 'Connect', 'Cloud run', 'Train live', 'Fitness', 'TFT'];
    const key = [
      'universal_app_gptInfo3',
      'universal_app_alaconnectInfo',
      'universal_app_cloudRunInfo',
      'universal_app_trainLiveInfo',
      'universal_app_fitnessInfo',
      'TFT',
    ];
    const appName = name[value] ?? 'Unknow';
    const appDescription = key[value] ?? 'Unknow';
    if (value !== null) {
      return args === 'name' ? appName : appDescription;
    } else {
      return null;
    }
  }
}

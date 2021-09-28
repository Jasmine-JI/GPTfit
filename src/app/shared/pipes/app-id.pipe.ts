import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'appId'})
export class AppIdPipe implements PipeTransform {

  /**
   * 將app id轉成app 名稱或介紹
   * @param value {number}-app id
   * @returns {string}-app name
   * @author kidin
   */
  transform(value: number, args: 'name' | 'descriptionKey' = 'name'): string {
    const name = [
            'GPTfit',
            'Connect',
            'Cloud run',
            'Train live',
            'Fitness'
          ],
          key = [
            'universal_app_gptInfo3',
            'universal_app_alaconnectInfo',
            'universal_app_cloudRunInfo',
            'universal_app_trainLiveInfo',
            'universal_app_fitnessInfo'
          ];
    if (value !== null) {
      return args === 'name' ? name[value] : key[value];
    } else {
      return null;
    }

  }

}

import { Pipe, PipeTransform } from '@angular/core';
import { maleBodyBoundary, femaleBodyBoundary } from '../../shared/models/chart-data';

@Pipe({
  name: 'bodyAssessment',
  standalone: true,
})
export class BodyAssessmentPipe implements PipeTransform {
  /**
   * 依性別、FFMI、體脂率回覆體態的多國語系key。
   * @param value {Array<number>}-[性別、FFMI、體脂率]
   * @return {string}}-體態的多國語系key
   */
  transform(value: Array<number>): string {
    const [gender, FFMI, fatRate] = value;
    let FFMIBoundary: Array<number>, fatRateBoundary: Array<number>;
    if (gender === 0) {
      FFMIBoundary = maleBodyBoundary.FFMI;
      fatRateBoundary = maleBodyBoundary.fatRate;
    } else {
      FFMIBoundary = femaleBodyBoundary.FFMI;
      fatRateBoundary = femaleBodyBoundary.fatRate;
    }

    if (FFMI < FFMIBoundary[0]) {
      if (fatRate <= fatRateBoundary[0]) {
        return 'universal_activityData_tooThin';
      } else if (fatRate > fatRateBoundary[0] && fatRate <= fatRateBoundary[1]) {
        return 'universal_activityData_lackOfTraining';
      } else {
        return 'universal_activityData_recessiveObesity';
      }
    } else if (FFMI >= FFMIBoundary[0] && FFMI <= FFMIBoundary[1]) {
      if (fatRate <= fatRateBoundary[0]) {
        return 'universal_activityData_generallyThin';
      } else if (fatRate > fatRateBoundary[0] && fatRate <= fatRateBoundary[1]) {
        return 'universal_activityData_normalPosture';
      } else {
        return 'universal_activityData_generallyFat';
      }
    } else if (FFMI > FFMIBoundary[1]) {
      if (fatRate <= fatRateBoundary[0]) {
        return 'universal_activityData_bodybuilding';
      } else if (fatRate > fatRateBoundary[0] && fatRate <= fatRateBoundary[1]) {
        return 'universal_activityData_athletic';
      } else {
        return 'universal_activityData_fatBody';
      }
    }
  }
}

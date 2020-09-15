import { Pipe, PipeTransform } from '@angular/core';
import map1 from '../../../assets/cloud_run/summary/map-mapdefinition_1.json';
import map2 from '../../../assets/cloud_run/summary/map-mapdefinition_2.json';
import map3 from '../../../assets/cloud_run/summary/map-mapdefinition_3.json';
import map4 from '../../../assets/cloud_run/summary/map-mapdefinition_4.json';
import map5 from '../../../assets/cloud_run/summary/map-mapdefinition_5.json';
import map6 from '../../../assets/cloud_run/summary/map-mapdefinition_6.json';
import map7 from '../../../assets/cloud_run/summary/map-mapdefinition_7.json';
import map8 from '../../../assets/cloud_run/summary/map-mapdefinition_8.json';
import map9 from '../../../assets/cloud_run/summary/map-mapdefinition_9.json';
import map10 from '../../../assets/cloud_run/summary/map-mapdefinition_10.json';
import map11 from '../../../assets/cloud_run/summary/map-mapdefinition_11.json';
import map12 from '../../../assets/cloud_run/summary/map-mapdefinition_12.json';
import map13 from '../../../assets/cloud_run/summary/map-mapdefinition_13.json';
import map14 from '../../../assets/cloud_run/summary/map-mapdefinition_14.json';
import map15 from '../../../assets/cloud_run/summary/map-mapdefinition_15.json';
import map16 from '../../../assets/cloud_run/summary/map-mapdefinition_16.json';
import map17 from '../../../assets/cloud_run/summary/map-mapdefinition_17.json';
import map18 from '../../../assets/cloud_run/summary/map-mapdefinition_18.json';
import map19 from '../../../assets/cloud_run/summary/map-mapdefinition_19.json';
import map20 from '../../../assets/cloud_run/summary/map-mapdefinition_20.json';
import map21 from '../../../assets/cloud_run/summary/map-mapdefinition_21.json';
import map22 from '../../../assets/cloud_run/summary/map-mapdefinition_22.json';
import map23 from '../../../assets/cloud_run/summary/map-mapdefinition_23.json';
import map24 from '../../../assets/cloud_run/summary/map-mapdefinition_24.json';
import map25 from '../../../assets/cloud_run/summary/map-mapdefinition_25.json';
import map26 from '../../../assets/cloud_run/summary/map-mapdefinition_26.json';
import map27 from '../../../assets/cloud_run/summary/map-mapdefinition_27.json';
import map28 from '../../../assets/cloud_run/summary/map-mapdefinition_28.json';
import map29 from '../../../assets/cloud_run/summary/map-mapdefinition_29.json';
import map30 from '../../../assets/cloud_run/summary/map-mapdefinition_30.json';
import map31 from '../../../assets/cloud_run/summary/map-mapdefinition_31.json';
import map32 from '../../../assets/cloud_run/summary/map-mapdefinition_32.json';
import map33 from '../../../assets/cloud_run/summary/map-mapdefinition_33.json';
import map34 from '../../../assets/cloud_run/summary/map-mapdefinition_34.json';
import map35 from '../../../assets/cloud_run/summary/map-mapdefinition_35.json';
import map36 from '../../../assets/cloud_run/summary/map-mapdefinition_36.json';
import map37 from '../../../assets/cloud_run/summary/map-mapdefinition_37.json';
import map38 from '../../../assets/cloud_run/summary/map-mapdefinition_38.json';
import map39 from '../../../assets/cloud_run/summary/map-mapdefinition_39.json';
import map40 from '../../../assets/cloud_run/summary/map-mapdefinition_40.json';
import map41 from '../../../assets/cloud_run/summary/map-mapdefinition_41.json';
import map42 from '../../../assets/cloud_run/summary/map-mapdefinition_42.json';
import map43 from '../../../assets/cloud_run/summary/map-mapdefinition_43.json';
import map44 from '../../../assets/cloud_run/summary/map-mapdefinition_44.json';
import map45 from '../../../assets/cloud_run/summary/map-mapdefinition_45.json';
import map46 from '../../../assets/cloud_run/summary/map-mapdefinition_46.json';
import map47 from '../../../assets/cloud_run/summary/map-mapdefinition_47.json';
import map48 from '../../../assets/cloud_run/summary/map-mapdefinition_48.json';

@Pipe({name: 'cloudrunSummary'})
export class CloudrunSummaryPipe implements PipeTransform {
  transform(value: number, args: string): any {

    let i18nId: number;
    switch (args) {
      case 'zh-tw':
        i18nId = 0;
        break;
      case 'zh-cn':
        i18nId = 1;
        break;
      default:
        i18nId = 2;
        break;
    }

    switch (value) {
      case 1:
        return map1.map.basic.info[i18nId];
      case 2:
        return map2.map.basic.info[i18nId];
      case 3:
        return map3.map.basic.info[i18nId];
      case 4:
        return map4.map.basic.info[i18nId];
      case 5:
        return map5.map.basic.info[i18nId];
      case 6:
        return map6.map.basic.info[i18nId];
      case 7:
        return map7.map.basic.info[i18nId];
      case 8:
        return map8.map.basic.info[i18nId];
      case 9:
        return map9.map.basic.info[i18nId];
      case 10:
        return map10.map.basic.info[i18nId];
      case 11:
        return map11.map.basic.info[i18nId];
      case 12:
        return map12.map.basic.info[i18nId];
      case 13:
        return map13.map.basic.info[i18nId];
      case 14:
        return map14.map.basic.info[i18nId];
      case 15:
        return map15.map.basic.info[i18nId];
      case 16:
        return map16.map.basic.info[i18nId];
      case 17:
        return map17.map.basic.info[i18nId];
      case 18:
        return map18.map.basic.info[i18nId];
      case 19:
        return map19.map.basic.info[i18nId];
      case 20:
        return map20.map.basic.info[i18nId];
      case 21:
        return map21.map.basic.info[i18nId];
      case 22:
        return map22.map.basic.info[i18nId];
      case 23:
        return map23.map.basic.info[i18nId];
      case 24:
        return map24.map.basic.info[i18nId];
      case 25:
        return map25.map.basic.info[i18nId];
      case 26:
        return map26.map.basic.info[i18nId];
      case 27:
        return map27.map.basic.info[i18nId];
      case 28:
        return map28.map.basic.info[i18nId];
      case 29:
        return map29.map.basic.info[i18nId];
      case 30:
        return map30.map.basic.info[i18nId];
      case 31:
        return map31.map.basic.info[i18nId];
      case 32:
        return map32.map.basic.info[i18nId];
      case 33:
        return map33.map.basic.info[i18nId];
      case 34:
        return map34.map.basic.info[i18nId];
      case 35:
        return map35.map.basic.info[i18nId];
      case 36:
        return map36.map.basic.info[i18nId];
      case 37:
        return map37.map.basic.info[i18nId];
      case 38:
        return map38.map.basic.info[i18nId];
      case 39:
        return map39.map.basic.info[i18nId];
      case 40:
        return map40.map.basic.info[i18nId];
      case 41:
        return map41.map.basic.info[i18nId];
      case 42:
        return map42.map.basic.info[i18nId];
      case 43:
        return map43.map.basic.info[i18nId];
      case 44:
        return map44.map.basic.info[i18nId];
      case 45:
        return map45.map.basic.info[i18nId];
      case 46:
        return map46.map.basic.info[i18nId];
      case 47:
        return map47.map.basic.info[i18nId];
      case 48:
        return map48.map.basic.info[i18nId];
    }

  }

}

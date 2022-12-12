import { NgModule, Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'getSplitString' })
export class GetSplitStringPipe implements PipeTransform {
  /**
   * 將字串依指定的符號切分後再取得指定位置的字串
   * @param str {string}-api回覆的特殊字串
   * @param args {}-指定位置的值
   */
  transform(str: string, args: { splitSymbol: string; targetIndex: number }): string {
    const { splitSymbol, targetIndex } = args;
    return str.split(splitSymbol)[targetIndex] ?? '';
  }
}
@NgModule({
  declarations: [GetSplitStringPipe],
  exports: [GetSplitStringPipe],
})
export class GetSplitStringModule {}

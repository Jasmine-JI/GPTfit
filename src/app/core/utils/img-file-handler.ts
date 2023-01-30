import dayjs from 'dayjs';
import { v5 as uuidv5 } from 'uuid';
import { fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * 將圖片轉為base64字串，並移除前綴
 * @param img
 * @param width
 * @param height
 */
export function imageToDataUri(img, width, height) {
  // create an off-screen canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

  // set its dimension to target size
  canvas.width = width;
  canvas.height = height;

  // draw source image into the off-screen canvas:
  ctx.drawImage(img, 0, 0, width, height);

  // encode image to data-uri with base64 version of compressed image
  return canvas.toDataURL().replace('data:image/png;base64,', '');
}

/**
 * 將base64轉file
 * @param base64 {string}-base64檔案
 */
export function dataUriToBlob(base64: string) {
  const byteString = window.atob(base64.split(',')[1]); // 去除base64前綴
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const int8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    int8Array[i] = byteString.charCodeAt(i);
  }

  const blob = new Blob([int8Array], { type: 'image/png' });
  return blob;
}

/**
 * 檢查圖片大小，過大就壓縮
 * @param type {AlbumType}-圖片類型
 * @param base64 {string}-base64檔案
 */
export function checkImgFormat(base64: string) {
  const image = new Image();
  image.src = base64;
  return fromEvent(image, 'load').pipe(
    map((e) => checkDimensionalSize(base64, image)),
    map((checkResult) => checkImgSize(checkResult as any))
  );
}

/**
 * 確認長寬是否符合格式
 * @param base {string}-base64圖片
 * @param img {HTMLImageElement}-html圖片元素
 */
export function checkDimensionalSize(base64: string, img: HTMLImageElement) {
  const limitDimensional = 1080;
  const imgWidth = img.width;
  const imgHeight = img.height;
  const overWidth = imgWidth > limitDimensional;
  const overHeight = imgHeight > limitDimensional;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  if (overWidth || overHeight) {
    if (imgHeight > imgWidth) {
      canvas.height = limitDimensional;
      canvas.width = imgWidth * (limitDimensional / imgHeight);
    } else {
      canvas.width = limitDimensional;
      canvas.height = imgHeight * (limitDimensional / imgWidth);
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const newBase64 = canvas.toDataURL('image/jpeg', 1);
    return [newBase64, canvas.width, canvas.height, canvas, ctx];
  } else {
    const { width, height } = img;
    return [base64, width, height, canvas, ctx];
  }
}

/**
 * 將base64的圖片轉為檔案格式
 * @param base64 {string}-base64圖片
 * @param fileName {檔案名稱}
 */
export function base64ToFile(base64: string, fileName: string) {
  const blob = dataUriToBlob(base64);
  return new File([blob], `${fileName}.jpg`, { type: 'image/jpeg' });
}

/**
 * 確認圖片大小是否符合格式，不符則壓縮圖片
 * @param [base64, width, height, canvas, ctx]-[base64圖片, 圖片寬度, 圖片高度, canvas, ctx]
 * @author kidin-1101103
 */
export function checkImgSize([base64, width, height, canvas, ctx]) {
  // 計算base64 size的公式（正確公式要判斷base64的'='數量，這邊直接當作'='數量為1）
  const imageSize = base64.length * (3 / 4) - 1;
  const limitSize = 500000;
  const overSize = imageSize > limitSize;
  if (overSize) {
    ctx.drawImage(canvas, 0, 0, width, height);
    const compressQulity = 0.9;
    // 透過toDataURL漸進式壓縮至所需大小，避免圖片過於失真
    const newBase64 = canvas.toDataURL('image/jpeg', compressQulity);
    return checkImgSize([newBase64, width, height, canvas, ctx]);
  } else {
    return base64;
  }
}

/**
 * 建立上傳圖床圖片之名稱
 * @param index {number}-檔案序列+1
 * @param id {string}-user id/group id(去掉'-')/event id
 */
export function createImgFileName(index: number, id: string | number) {
  const nameSpace = uuidv5('https://www.gptfit.com', uuidv5.URL);
  const keyword = `${dayjs().valueOf().toString()}${index}${id}`;
  return uuidv5(keyword, nameSpace);
}

/**
 * 使用者資訊相關表單檢查
 */
export const formTest = {
  email:
    /^[a-zA-Z0-9.+_-]{2,63}@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^]{8,20}$/,
  nickname: /^[^!@#$%^&*()=|{}"?<>;:+-/\\]{4,24}$/,
  groupName: /^[^!@#$%^&*()=|{}"?<>;:+-/\\]{2,24}$/,
  phone: /^([1-9][0-9]{7,15})$/, // 手機號碼已知最短為加拿大7碼，最長為中國11碼，加上區碼（非國碼）可能會超出11碼
  number: /^([0-9]*)$/,
  decimalValue: /(^\d*)(.\d*$)/,
  imperialHeight: /^\d"([1-9]|1[01])$/,
  newIdCardNumber: /^[A-Za-z]{1}[1-2]{1}[0-9]{8}$/, // 身份證號或新版居留證號
  oldIdCardNumber: /^[a-zA-Z][C|D|c|d][0-9]{8}$/, // 舊版居留證號
};

/**
 * 輸入配速之格式檢查
 */
export const paceReg = /(^([0-5]?\d)'[0-5]\d")|(60'00")/;
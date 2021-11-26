export const formTest = {
  email: /^\S{1,63}@[a-zA-Z0-9]{2,63}.[a-zA-Z]{2,63}(.[a-zA-Z]{2,63})?$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^]{8,20}$/,
  nickname: /^[^!@#$%^&*()=|{}"?<>;:+-\/\\]{4,24}$/,
  phone: /^([1-9][0-9]+)$/,
  number: /^([0-9]*)$/,
  decimalValue: /(^\d*)(.\d*$)/,
  imperialHeight: /^\d"([1-9]|1[01])$/,
  newIdCardNumber: /^[A-Za-z]{1}[1-2]{1}[0-9]{8}$/,  // 身份證號或新版居留證號
  oldIdCardNumber: /^[a-zA-Z][C|D|c|d][0-9]{8}$/  // 舊版居留證號
};

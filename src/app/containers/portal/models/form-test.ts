export const formTest = {
  email: /^\S{1,63}@[a-zA-Z0-9]{2,63}.[a-zA-Z]{2,63}(.[a-zA-Z]{2,63})?$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^]{8,20}$/,
  nickname: /^[^!@#$%^&*()=|{}"?<>;:+-\/\\]{4,24}$/,
  phone: /^([1-9][0-9]+)$/,
  number: /^([0-9]*)$/,
  decimalValue: /(^\d*)(.\d*$)/,
  imperialHeight: /^\d"([1-9]|1[01])$/
};

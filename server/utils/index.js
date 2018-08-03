function checkID(type, id) {
  const tab = 'ABCDEFGHJKLMNPQRSTUVXYWZIO';
  const tabByForegin = 'ABCD';
  const A1 = new Array(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3);
  const A2 = new Array(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5);
  const Mx = new Array(9, 8, 7, 6, 5, 4, 3, 2, 1, 1);
  if (type === '1') { // 驗證身分證
    if (id.length !== 10) return false;
    const i = tab.indexOf(id.charAt(0).toUpperCase());
    if (i === -1) return false;
    let sum = A1[i] + A2[i] * 9;

    for (let index = 1; index < 10; index++) {
      const v = parseInt(id.charAt(index), 10);
      if (isNaN(v)) return false;
      sum = sum + v * Mx[index];
    }
    if (sum % 10 !== 0) return false;
    return true;
  }

  if (type === '3') { // 驗證居留證
    if (!/^[A-Za-z][A-Da-d][\d]{8}$/.test(id)) return false;
    const firstLetter = tab.indexOf(id.charAt(0).toUpperCase());
    if (firstLetter === -1) return false;
    let sum = A1[firstLetter] + A2[firstLetter] * 9;
    const secondLetter = tabByForegin.indexOf(id.charAt(1).toUpperCase()); // A 取 0,   B 取 1, C 取 2, D 取 3
    if (secondLetter === -1) return false;
    sum = sum + A2[secondLetter] * 8;
    for (let _index = 2; _index < 10; _index++) {
      const v = parseInt(id.charAt(_index), 10);
      if (isNaN(v)) return false;
      sum = sum + v * Mx[_index];
    }
    if (sum % 10 !== 0) return false;
    return true;
  }
  return true;
}

function getNowTime() {
  var now = new Date();
  var now_mill = now.getTime();
  const update_time = Math.round(now_mill / 1000);
  return update_time;
}
module.exports = {
  checkID,
  getNowTime
};

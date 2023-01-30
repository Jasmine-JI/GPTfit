import { Injectable } from '@angular/core';
import Hashids from 'hashids';

/**
 * 專門用來處理加密和解密
 */
@Injectable()
export class HashIdService {
  hashIds: any;

  constructor() {
    this.hashIds = this.getHashIds();
  }

  /**
   * 使用套件生成用來處理加解密的實體class
   */
  getHashIds() {
    const salt = 'alatech center';
    const length = 8;
    const hashText = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    return new Hashids(salt, length, hashText);
  }

  /**
   * 將群組編號移除特殊符號後進行加密
   * @param groupId {string}-群組編號
   */
  handleGroupIdEncode(groupId: string) {
    const [id1, id2, id3, id4, id5, id6] = groupId.split('-').map((_id) => +_id);
    return this.hashIds.encode(id1, id2, id3, id4, id5, id6);
  }

  /**
   * 將加密的群組編號還原
   * @param hashGroupId {string}-加密後的群組編號
   */
  handleGroupIdDecode(hashGroupId: string) {
    const numbers = this.hashIds.decode(hashGroupId);
    const groupId = numbers.join('-');
    return groupId;
  }

  /**
   * 將使用者編號進行加密
   * @param userId {string | number}-使用者編號
   */
  handleUserIdEncode(userId: string | number) {
    const id = this.hashIds.encode(+userId);
    return id;
  }

  /**
   * 將加密的使用者編號還原
   * @param hashGroupId {string}-加密後的使用者編號
   */
  handleUserIdDecode(hashUserId: string) {
    const numbers = this.hashIds.decode(hashUserId);
    if (numbers.length === 1) {
      return numbers[0].toString();
    }
  }
}

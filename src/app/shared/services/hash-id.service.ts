import { Injectable } from '@angular/core';
import Hashids from 'hashids';

@Injectable()
export class HashIdService {
  hashIds: any;
  constructor() {
    this.hashIds = new Hashids('alatech center', 8, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890');
  }
  handleGroupIdEncode(inputText: string) {
    const inputArr = inputText.split('-');
    const id = this.hashIds.encode(+inputArr[0], +inputArr[1], +inputArr[2], +inputArr[3], +inputArr[4], +inputArr[5]);
    return id;
  }

  handleGroupIdDecode(inputText: string) {
    const numbers = this.hashIds.decode(inputText);
    const groupId = numbers.join('-');
    return groupId;
  }
  handleUserIdEncode(inputText: string) {
    const id = this.hashIds.encode(+inputText);
    return id;
  }

  handleUserIdDecode(inputText: string) {
    const numbers = this.hashIds.decode(inputText);
    if (numbers.length === 1) {
      return numbers[0].toString();
    }
  }
}

import { Sex } from '../../../shared/enum/personal';

export interface EventInfo {
  eventId?: number;
  themeImg?: string;
  eventName: string;
  description: string;
  numberLimit?: number;
  currentApplyNumber?: number;
  eventStatus: EventStatus;
  applyDate: {
    startDate: number;
    endDate: number;
  };
  raceDate: {
    startDate: number;
    endDate: number;
  };
  cloudrunMapId: number;
  creatorId?: number;
  createDate?: number;
  editorId?: number;
  lastEditDate?: number;
}

export interface EventDetail {
  content: Array<DetailContent>;
  applyFee: Array<DetailApplyFee>;
  group: Array<DetailGroup>;
}

export interface DetailContent {
  contentId: number;
  cardType: CardTypeEnum;
  title: string;
  text?: string;
  videoLink?: string;
  img?: string;
}

export interface DetailApplyFee {
  feeId: number;
  title: string;
  fee: number;
  haveProduct: number;
  img?: string;
}

export interface DetailGroup {
  id: number;
  name: string;
  gender?: Sex;
  age?: {
    max: number;
    min: number;
  };
}

export enum CardTypeEnum {
  text = 1,
  img,
  video,
}

export enum EventStatus {
  notAudit,
  cancel,
  audit,
}

export enum HaveProduct {
  yes = 1,
  no,
}

export enum PaidStatusEnum {
  unPaid = 1,
  paid,
  approve,
  refund,
}

export enum ProductShipped {
  unShip = 1,
  shipped,
  returnGoods,
  closeCase,
  needNotShip,
}

export enum ApplyStatus {
  notYet,
  applied,
  cancel,
  applyingQuit,
}

export enum Nationality {
  taiwaness = 1,
  foreign,
}

export enum ListStatus {
  all,
  applying,
  applyCutOff,
  racing,
  eventFinished,
  eventCancel,
  notAudit,
}

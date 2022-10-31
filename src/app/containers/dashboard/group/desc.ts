/**
 * version 1.12.2.0後，不分方案統一可建立群組數目、可建立管理員數與最大重複成員數
 */
const maxBranches = 100;
const maxClasses = 10000;
const maxGroupManagers = 10000;
const maxGroupMembers = 10000;

export const planDatas = [
  {
    commercePlan: 1,
    maxBranches,
    maxClasses,
    maxGroupMembers,
    maxGroupManagers,
    allNotRepeatingMember: 100,
    cost: 3000,
  },
  {
    commercePlan: 2,
    maxBranches,
    maxClasses,
    maxGroupMembers,
    maxGroupManagers,
    allNotRepeatingMember: 500,
    cost: 10000,
  },
  {
    commercePlan: 3,
    maxBranches,
    maxClasses,
    maxGroupMembers,
    maxGroupManagers,
    allNotRepeatingMember: 1000,
    cost: 20000,
  },
  {
    commercePlan: 4,
    maxBranches,
    maxClasses,
    maxGroupMembers,
    maxGroupManagers,
    allNotRepeatingMember: 5000,
    cost: 50000,
  },
];

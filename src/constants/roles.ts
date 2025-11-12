export enum RolesEnum {
  ROOT = 1,
  ADMIN = 2,
  STAFF = 3,
}

export const RolesNames: Record<RolesEnum, string> = {
  [RolesEnum.ROOT]: 'root',
  [RolesEnum.ADMIN]: 'admin',
  [RolesEnum.STAFF]: 'staff',
};

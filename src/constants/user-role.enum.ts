export enum UserRole {
  ADMIN = '1',
  SUPERVISOR = '2',
  MEMBER = '3',
}

export const UserRoleMap = {
  admin: UserRole.ADMIN,
  supervisor: UserRole.SUPERVISOR,
  member: UserRole.MEMBER,
} as const;

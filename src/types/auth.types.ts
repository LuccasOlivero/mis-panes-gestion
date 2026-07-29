export type AppRole = "cajera" | "gerente";

export interface EmployeeAccount {
  id: string;
  employeeId: string;
  authUserId: string;
  username: string;
  appRole: AppRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentSession {
  authUserId: string;
  employeeId: string;
  fullName: string;
  appRole: AppRole;
}

export interface CreateEmployeeAccountInput {
  employeeId: string;
  username: string;
  password: string;
  appRole: AppRole;
}

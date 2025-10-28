import type { ApisauceInstance } from "apisauce"
import { getGeneralApiProblem } from "./apiProblem"
import type { GeneralApiProblem } from "./api.types"

export interface PermissionItem {
  id: number
  name: string // e.g., "user.view"
  description?: string
  module_id?: number | null
}

export interface PermissionsResponse {
  kind: "ok"
  data: PermissionItem[]
}

export class RbacPermissionsApi {
  constructor(private apisauceInstance: ApisauceInstance) {}

  async getPermissions(): Promise<PermissionsResponse | GeneralApiProblem> {
    const response = await this.apisauceInstance.get<PermissionItem[]>(`/api/rbac/permissions`)
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
    if (response.data) return { kind: "ok", data: response.data }
    return { kind: "unknown", temporary: true }
  }

  async assignPermission(roleId: number, moduleId: number, permissionId: number): Promise<{ kind: "ok" } | GeneralApiProblem> {
    const response = await this.apisauceInstance.post(`/api/rbac/assign-permission`, {
      role_id: roleId,
      module_id: moduleId,
      permission_id: permissionId,
    })
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
    return { kind: "ok" }
  }

  async removePermission(roleId: number, moduleId: number, permissionId: number): Promise<{ kind: "ok" } | GeneralApiProblem> {
    const response = await this.apisauceInstance.post(`/api/rbac/remove-permission`, {
      role_id: roleId,
      module_id: moduleId,
      permission_id: permissionId,
    })
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
    return { kind: "ok" }
  }
}

export function createRbacPermissionsApi(apisauceInstance: ApisauceInstance) {
  return new RbacPermissionsApi(apisauceInstance)
}



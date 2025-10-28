import type { ApisauceInstance } from "apisauce"
import { getGeneralApiProblem } from "./apiProblem"
import type { GeneralApiProblem, Role, PaginatedRoleResponse, RoleRequest } from "./api.types"

export interface RolesResponse {
  kind: "ok"
  data: PaginatedRoleResponse
}

export interface RoleResponse {
  kind: "ok"
  data: Role
}

export class RolesApi {
  constructor(private apisauceInstance: ApisauceInstance) {}

  async getRoles(page: number = 1, pageSize: number = 50, search: string = ""): Promise<RolesResponse | GeneralApiProblem> {
    const params: Record<string, any> = { page, page_size: pageSize }
    if (search) params.search = search
    const response = await this.apisauceInstance.get<PaginatedRoleResponse>(`/api/rbac/roles`, params)
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
    if (response.data) return { kind: "ok", data: response.data }
    return { kind: "unknown", temporary: true }
  }

  async createRole(payload: RoleRequest): Promise<RoleResponse | GeneralApiProblem> {
    const response = await this.apisauceInstance.post<Role>(`/api/rbac/roles`, payload)
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
    if (response.data) return { kind: "ok", data: response.data }
    return { kind: "unknown", temporary: true }
  }

  async updateRole(id: number, payload: RoleRequest): Promise<RoleResponse | GeneralApiProblem> {
    const response = await this.apisauceInstance.put<Role>(`/api/rbac/roles/${id}`, payload)
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
    if (response.data) return { kind: "ok", data: response.data }
    return { kind: "unknown", temporary: true }
  }

  async deleteRole(id: number): Promise<GeneralApiProblem | { kind: "ok" }> {
    const response = await this.apisauceInstance.delete(`/api/rbac/roles/${id}`)
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
    return { kind: "ok" }
  }
}

export function createRolesApi(apisauceInstance: ApisauceInstance) {
  return new RolesApi(apisauceInstance)
}



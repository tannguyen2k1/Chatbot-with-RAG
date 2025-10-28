import type { ApisauceInstance } from "apisauce"
import { getGeneralApiProblem } from "./apiProblem"
import type { GeneralApiProblem, Tenant, PaginatedTenantResponse, TenantRequest } from "./api.types"

export interface TenantsResponse {
  kind: "ok"
  data: PaginatedTenantResponse
}

export interface TenantResponse {
  kind: "ok"
  data: Tenant
}

export class TenantsApi {
  constructor(private apisauceInstance: ApisauceInstance) {}

  async getTenants(page: number = 1, pageSize: number = 10, search: string = ""): Promise<TenantsResponse | GeneralApiProblem> {
    const params: Record<string, any> = { page, page_size: pageSize }
    if (search) params.search = search
    const response = await this.apisauceInstance.get<PaginatedTenantResponse>(`/api/tenant`, params)
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
    if (response.data) return { kind: "ok", data: response.data }
    return { kind: "unknown", temporary: true }
  }

  async createTenant(payload: TenantRequest): Promise<TenantResponse | GeneralApiProblem> {
    const response = await this.apisauceInstance.post<Tenant>(`/api/tenant`, payload)
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
    if (response.data) return { kind: "ok", data: response.data }
    return { kind: "unknown", temporary: true }
  }

  async updateTenant(id: number, payload: Partial<TenantRequest>): Promise<TenantResponse | GeneralApiProblem> {
    const response = await this.apisauceInstance.put<Tenant>(`/api/tenant/${id}`, payload)
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
    if (response.data) return { kind: "ok", data: response.data }
    return { kind: "unknown", temporary: true }
  }

  async deleteTenant(id: number): Promise<GeneralApiProblem | { kind: "ok" }> {
    const response = await this.apisauceInstance.delete(`/api/tenant/${id}`)
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
    return { kind: "ok" }
  }
}

export function createTenantsApi(apisauceInstance: ApisauceInstance) {
  return new TenantsApi(apisauceInstance)
}



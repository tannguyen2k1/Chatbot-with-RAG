import type { ApisauceInstance } from "apisauce"
import { getGeneralApiProblem } from "./apiProblem"
import type { GeneralApiProblem, PaginatedAuditLogResponse } from "./api.types"

export interface AuditLogsResponse {
  kind: "ok"
  data: PaginatedAuditLogResponse
}

export class AuditLogsApi {
  constructor(private apisauceInstance: ApisauceInstance) {}

  async getAuditLogs(page: number = 1, pageSize: number = 10, search: string = ""): Promise<AuditLogsResponse | GeneralApiProblem> {
    const params: Record<string, any> = { page, page_size: pageSize }
    if (search) params.search = search
    const response = await this.apisauceInstance.get<PaginatedAuditLogResponse>(`/api/audit-logs`, params)
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
    if (response.data) return { kind: "ok", data: response.data }
    return { kind: "unknown", temporary: true }
  }
}

export function createAuditLogsApi(apisauceInstance: ApisauceInstance) {
  return new AuditLogsApi(apisauceInstance)
}



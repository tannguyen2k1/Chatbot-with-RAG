import type { ApisauceInstance } from "apisauce"
import { getGeneralApiProblem } from "./apiProblem"
import type { GeneralApiProblem, Demo, PaginatedDemoResponse, DemoRequest } from "./api.types"

export interface DemosResponse {
  kind: "ok"
  data: PaginatedDemoResponse
}

export interface DemoResponse {
  kind: "ok"
  data: Demo
}

export class DemoApi {
  constructor(private apisauceInstance: ApisauceInstance) {}

  async getDemos(page: number = 1, pageSize: number = 10, search: string = ""): Promise<DemosResponse | GeneralApiProblem> {
    const params: Record<string, any> = {
      page,
      page_size: pageSize,
    }
    if (search) {
      params.search = search
    }
    
    const response = await this.apisauceInstance.get<PaginatedDemoResponse>(`/api/demos`, params)
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
    
    if (response.data) {
      return { kind: "ok", data: response.data }
    }
    return { kind: "unknown", temporary: true }
  }

  async createDemo(demo: DemoRequest): Promise<DemoResponse | GeneralApiProblem> {
    const response = await this.apisauceInstance.post<Demo>(`/api/demos`, demo)
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
    
    if (response.data) {
      return { kind: "ok", data: response.data }
    }
    return { kind: "unknown", temporary: true }
  }

  async updateDemo(id: number, demo: DemoRequest): Promise<DemoResponse | GeneralApiProblem> {
    const response = await this.apisauceInstance.put<Demo>(`/api/demos/${id}`, demo)
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
    
    if (response.data) {
      return { kind: "ok", data: response.data }
    }
    return { kind: "unknown", temporary: true }
  }

  async deleteDemo(id: number): Promise<GeneralApiProblem | { kind: "ok" }> {
    const response = await this.apisauceInstance.delete(`/api/demos/${id}`)
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
    
    return { kind: "ok" }
  }
}

export function createDemoApi(apisauceInstance: ApisauceInstance) {
  return new DemoApi(apisauceInstance)
}

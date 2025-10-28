import type { ApisauceInstance } from "apisauce"
import { getGeneralApiProblem } from "./apiProblem"
import type { GeneralApiProblem, User, PaginatedUserResponse, UserRequest } from "./api.types"

export interface UsersResponse {
  kind: "ok"
  data: PaginatedUserResponse
}

export interface UserResponse {
  kind: "ok"
  data: User
}

export class UsersApi {
  constructor(private apisauceInstance: ApisauceInstance) {}

  async getUsers(page: number = 1, pageSize: number = 10, search: string = ""): Promise<UsersResponse | GeneralApiProblem> {
    const params: Record<string, any> = { page, page_size: pageSize }
    if (search) params.search = search
    const response = await this.apisauceInstance.get<PaginatedUserResponse>(`/api/users`, params)
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
    if (response.data) return { kind: "ok", data: response.data }
    return { kind: "unknown", temporary: true }
  }

  async createUser(payload: UserRequest): Promise<UserResponse | GeneralApiProblem> {
    const response = await this.apisauceInstance.post<User>(`/api/users`, payload)
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
    if (response.data) return { kind: "ok", data: response.data }
    return { kind: "unknown", temporary: true }
  }

  async updateUser(id: number, payload: UserRequest): Promise<UserResponse | GeneralApiProblem> {
    const response = await this.apisauceInstance.put<User>(`/api/users/${id}`, payload)
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
    if (response.data) return { kind: "ok", data: response.data }
    return { kind: "unknown", temporary: true }
  }

  async deleteUser(id: number): Promise<GeneralApiProblem | { kind: "ok" }> {
    const response = await this.apisauceInstance.delete(`/api/users/${id}`)
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
    return { kind: "ok" }
  }
}

export function createUsersApi(apisauceInstance: ApisauceInstance) {
  return new UsersApi(apisauceInstance)
}



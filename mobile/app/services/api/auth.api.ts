/**
 * Authentication API for VTMS Backend
 */
import type { ApisauceInstance } from "apisauce"
import type { GeneralApiProblem } from "./apiProblem"
import { getGeneralApiProblem } from "./apiProblem"
import type { LoginRequest, LoginResponse, User } from "./api.types"

export interface LoginCredentials {
  username: string
  password: string
  tenant_code: string
}

export interface AuthResponse {
  kind: "ok"
  data: LoginResponse
}

export class AuthApi {
  constructor(private apisauceInstance: ApisauceInstance) {}

  /**
   * Login with username, password and tenant_code
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse | GeneralApiProblem> {
    const response = await this.apisauceInstance.post<LoginResponse>(`/api/auth/login`, credentials)

    // Check for API problems
    const problem = getGeneralApiProblem(response)
    if (problem) {
      return problem
    }

    if (response.data) {
      // Store token in API instance for future requests
      this.apisauceInstance.setHeader("Authorization", `Bearer ${response.data.access_token}`)
      return { kind: "ok", data: response.data }
    }

    return { kind: "unknown", temporary: true }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<AuthResponse | GeneralApiProblem> {
    const response = await this.apisauceInstance.post<LoginResponse>(`/api/auth/refresh`)

    // Check for API problems
    const problem = getGeneralApiProblem(response)
    if (problem) {
      return problem
    }

    if (response.data) {
      this.apisauceInstance.setHeader("Authorization", `Bearer ${response.data.access_token}`)
      return { kind: "ok", data: response.data }
    }

    return { kind: "unknown", temporary: true }
  }

  /**
   * Logout
   */
  async logout(): Promise<{ kind: "ok" } | GeneralApiProblem> {
    const response = await this.apisauceInstance.post(`/api/auth/logout`)

    // Check for API problems
    const problem = getGeneralApiProblem(response)
    if (problem) {
      return problem
    }

    // Clear authorization header
    this.apisauceInstance.setHeader("Authorization", "")
    return { kind: "ok" }
  }

  /**
   * Get current user info
   */
  async getMe(token: string): Promise<{ kind: "ok"; user: User } | GeneralApiProblem> {
    this.apisauceInstance.setHeader("Authorization", `Bearer ${token}`)
    const response = await this.apisauceInstance.get<User>(`/api/users/me`)

    // Check for API problems
    const problem = getGeneralApiProblem(response)
    if (problem) {
      return problem
    }

    if (response.data) {
      return { kind: "ok", user: response.data }
    }

    return { kind: "unknown", temporary: true }
  }

  /**
   * Update current user profile
   */
  async updateProfile(profileData: { full_name?: string; email?: string; phone?: string }): Promise<{ kind: "ok"; data: User } | GeneralApiProblem> {
    const response = await this.apisauceInstance.put<User>(`/api/users/me`, profileData)

    // Check for API problems
    const problem = getGeneralApiProblem(response)
    if (problem) {
      return problem
    }

    if (response.data) {
      return { kind: "ok", data: response.data }
    }

    return { kind: "unknown", temporary: true }
  }

  /**
   * Change password
   */
  async changePassword(passwordData: { current_password: string; new_password: string }): Promise<{ kind: "ok" } | GeneralApiProblem> {
    const response = await this.apisauceInstance.put(`/api/auth/change-password`, passwordData)

    // Check for API problems
    const problem = getGeneralApiProblem(response)
    if (problem) {
      return problem
    }

    return { kind: "ok" }
  }
}

// Export createAuthApi factory function
export function createAuthApi(apisauceInstance: ApisauceInstance) {
  return new AuthApi(apisauceInstance)
}

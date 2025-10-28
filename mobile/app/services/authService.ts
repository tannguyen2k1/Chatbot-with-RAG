import AsyncStorage from "@react-native-async-storage/async-storage"
import { authApi } from "@/services/api"
import type { User } from "@/services/api/api.types"

export interface AuthData {
  authToken?: string
  refreshToken?: string
  currentUser?: User
}

export class AuthService {
  static async loadStoredAuth(): Promise<AuthData> {
    try {
      console.log("Loading stored auth data...")
      const [authToken, refreshToken, currentUserStr] = await Promise.all([
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("refreshToken"),
        AsyncStorage.getItem("currentUser"),
      ])

      console.log("Stored auth token exists:", !!authToken)
      console.log("Stored refresh token exists:", !!refreshToken)
      console.log("Stored user exists:", !!currentUserStr)

      const authData: AuthData = {}
      
      if (authToken) {
        authData.authToken = authToken
      }
      if (refreshToken) {
        authData.refreshToken = refreshToken
      }
      if (currentUserStr) {
        try {
          authData.currentUser = JSON.parse(currentUserStr)
        } catch (e) {
          console.error("Failed to parse stored user:", e)
        }
      }

      return authData
    } catch (error) {
      console.error("Failed to load stored auth:", error)
      return {}
    }
  }

  static async validateToken(): Promise<{ isValid: boolean; authData?: AuthData }> {
    try {
      console.log("Validating token with backend...")
      const response = await authApi.refreshToken()

      if (response.kind === "ok" && response.data.user) {
        console.log("Token validation successful")
        return {
          isValid: true,
          authData: {
            authToken: response.data.access_token,
            currentUser: response.data.user,
          }
        }
      } else {
        console.log("Token validation failed")
        return { isValid: false }
      }
    } catch (error) {
      console.error("Token validation error:", error)
      return { isValid: false }
    }
  }

  static async clearStoredAuth(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(["authToken", "refreshToken", "currentUser"])
      console.log("Cleared stored auth data")
    } catch (error) {
      console.error("Failed to clear stored auth:", error)
    }
  }
}

import { Instance, SnapshotOut, types } from "mobx-state-tree"
import type { User } from "@/services/api/api.types"

export const AuthenticationStoreModel = types
  .model("AuthenticationStore")
  .props({
    authToken: types.maybe(types.string),
    refreshToken: types.maybe(types.string),
    username: "",
    password: "",
    tenant_code: "",
    currentUser: types.maybe(types.frozen<User>()),
    isLoadingAuth: types.optional(types.boolean, false),
  })
  .views((store) => ({
    get isAuthenticated() {
      return !!store.authToken && !!store.currentUser
    },
    get validationError() {
      if (store.username.length === 0) return "Username can't be blank"
      if (store.password.length === 0) return "Password can't be blank"
      if (store.tenant_code.length === 0) return "Tenant code can't be blank"
      return ""
    },
  }))
  .actions((store) => ({
    setIsLoadingAuth(value: boolean) {
      store.isLoadingAuth = value
    },
    setAuthToken(value?: string) {
      store.authToken = value
    },
    setRefreshToken(value?: string) {
      store.refreshToken = value
    },
    setUsername(value: string) {
      store.username = value
    },
    setPassword(value: string) {
      store.password = value
    },
    setTenantCode(value: string) {
      store.tenant_code = value
    },
    setCurrentUser(user?: User) {
      store.currentUser = user
    },
    async checkAuth() {
      // If no token, mark as not authenticated
      if (!store.authToken) {
        store.isLoadingAuth = false
        return false
      }

      // Try to refresh token to validate
      try {
        // Import at top level to avoid dynamic import issues
        const { authApi } = require("@/services/api")
        const response = await authApi.refreshToken()

        if (response.kind === "ok" && response.data.user) {
          store.authToken = response.data.access_token
          store.currentUser = response.data.user
          store.isLoadingAuth = false
          return true
        } else {
          // Token invalid, logout
          this.logout()
          return false
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        this.logout()
        return false
      }
    },
    logout() {
      store.authToken = undefined
      store.refreshToken = undefined
      store.username = ""
      store.password = ""
      store.tenant_code = ""
      store.currentUser = undefined
      store.isLoadingAuth = false
    },
  }))

export interface AuthenticationStore extends Instance<typeof AuthenticationStoreModel> {}
export interface AuthenticationStoreSnapshot extends SnapshotOut<typeof AuthenticationStoreModel> {}

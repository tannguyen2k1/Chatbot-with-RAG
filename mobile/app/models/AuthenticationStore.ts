import { Instance, SnapshotOut, types } from "mobx-state-tree"
import AsyncStorage from "@react-native-async-storage/async-storage"
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
    isInitialized: types.optional(types.boolean, false),
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
    setIsInitialized(value: boolean) {
      store.isInitialized = value
    },
    setAuthToken(value?: string) {
      store.authToken = value
      // Save to AsyncStorage when token changes
      if (value) {
        AsyncStorage.setItem("authToken", value)
      } else {
        AsyncStorage.removeItem("authToken")
      }
    },
    setRefreshToken(value?: string) {
      store.refreshToken = value
      // Save to AsyncStorage when refresh token changes
      if (value) {
        AsyncStorage.setItem("refreshToken", value)
      } else {
        AsyncStorage.removeItem("refreshToken")
      }
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
      // Save user to AsyncStorage when user changes
      if (user) {
        AsyncStorage.setItem("currentUser", JSON.stringify(user))
      } else {
        AsyncStorage.removeItem("currentUser")
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
      
      // Clear AsyncStorage
      AsyncStorage.multiRemove(["authToken", "refreshToken", "currentUser"])
    },
  }))

export interface AuthenticationStore extends Instance<typeof AuthenticationStoreModel> {}
export interface AuthenticationStoreSnapshot extends SnapshotOut<typeof AuthenticationStoreModel> {}

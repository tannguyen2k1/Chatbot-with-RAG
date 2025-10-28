/**
 * Factory to create authApi instance to avoid circular dependency
 */
import { apisauce } from "./api"
import { createAuthApi } from "./auth.api"

// Create authApi instance
export const authApi = createAuthApi(apisauce)

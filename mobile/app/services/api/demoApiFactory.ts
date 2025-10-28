/**
 * Factory to create demoApi instance to avoid circular dependency
 */
import { apisauce } from "./api"
import { createDemoApi } from "./demo.api"

// Create demoApi instance
export const demoApi = createDemoApi(apisauce)

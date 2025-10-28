import { api } from "./api"
import { createTenantsApi } from "./tenants.api"

export const tenantsApi = createTenantsApi(api.apisauce)



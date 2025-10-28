import { api } from "./api"
import { createRolesApi } from "./roles.api"

export const rolesApi = createRolesApi(api.apisauce)



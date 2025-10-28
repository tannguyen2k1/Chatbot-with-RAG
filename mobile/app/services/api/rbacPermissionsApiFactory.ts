import { api } from "./api"
import { createRbacPermissionsApi } from "./rbacPermissions.api"

export const rbacPermissionsApi = createRbacPermissionsApi(api.apisauce)



import { api } from "./api"
import { createUsersApi } from "./users.api"

export const usersApi = createUsersApi(api.apisauce)



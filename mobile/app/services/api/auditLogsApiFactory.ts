import { api } from "./api"
import { createAuditLogsApi } from "./audit_logs.api"

export const auditLogsApi = createAuditLogsApi(api.apisauce)



// Shared permission helper to align with frontend logic
// Supports two shapes of permissions returned from backend/frontend:
// 1) Object: { demo: ["demo.view", "demo.create", ...] }
// 2) Array:  ["demo.view", "demo.create", ...]

export function hasPermission(userPermissions: any, moduleName: string, action: string): boolean {
  if (!userPermissions || !moduleName || !action) return false
  if (Array.isArray(userPermissions)) return userPermissions.includes(`${moduleName}.${action}`)
  if (typeof userPermissions === "object") {
    const actions = (userPermissions as Record<string, string[] | undefined>)[moduleName]
    if (!actions || !Array.isArray(actions)) return false
    return actions.includes(`${moduleName}.${action}`)
  }
  return false
}



import { observer } from "mobx-react-lite"
import { FC, useEffect, useMemo, useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRoute } from "@react-navigation/native"
import { rbacPermissionsApi, rolesApi } from "@/services/api"
import { useStores } from "../models"
import { hasPermission } from "@/utils/permissions"

interface RouteParams { roleId: number; roleName?: string }

export const RolePermissionsScreen: FC = observer(function RolePermissionsScreen() {
  const route = useRoute() as any
  const { roleId, roleName } = (route.params || {}) as RouteParams
  const { authenticationStore } = useStores()

  const [loading, setLoading] = useState(true)
  const [perms, setPerms] = useState<{ id: number; name: string; module_id?: number | null }[]>([])
  const [rolePermIds, setRolePermIds] = useState<Set<number>>(new Set())
  const [error, setError] = useState("")

  const canUpdate = hasPermission(authenticationStore.currentUser?.permissions, "role", "update")
  const canView = hasPermission(authenticationStore.currentUser?.permissions, "role", "view")

  const grouped = useMemo(() => {
    const groups: Record<string, { id: number; name: string; module_id?: number | null }[]> = {}
    perms.forEach((p) => {
      const mod = p.name.split(".")[0] || "other"
      if (!groups[mod]) groups[mod] = []
      groups[mod].push(p)
    })
    return groups
  }, [perms])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [allPerms, roleDetail] = await Promise.all([
          rbacPermissionsApi.getPermissions(),
          rolesApi.getRoleById(roleId),
        ])
        if (allPerms.kind === "ok") setPerms(allPerms.data)
        if (roleDetail.kind === "ok") {
          const rp = (roleDetail.data as any)?.permissions || []
          const ids = rp.map((p: { permission_id: number }) => p.permission_id)
          setRolePermIds(new Set(ids))
        }
      } catch (e) {
        setError("Không thể tải quyền")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [roleId])

  if (!canView) return null

  const toggle = async (perm: { id: number; name: string; module_id?: number | null }) => {
    if (!canUpdate) {
      Alert.alert("Không có quyền", "Bạn không có quyền chỉnh sửa quyền vai trò")
      return
    }
    const has = rolePermIds.has(perm.id)
    try {
      if (has) {
        const res = await rbacPermissionsApi.removePermission(roleId, perm.module_id || 0, perm.id)
        if ((res as any).kind === "ok") setRolePermIds((prev) => { const n = new Set(prev); n.delete(perm.id); return n })
      } else {
        const res = await rbacPermissionsApi.assignPermission(roleId, perm.module_id || 0, perm.id)
        if ((res as any).kind === "ok") setRolePermIds((prev) => { const n = new Set(prev); n.add(perm.id); return n })
      }
    } catch (e) {
      Alert.alert("Lỗi", "Không thể cập nhật quyền")
    }
  }

  const renderPerm = ({ item }: { item: { id: number; name: string; module_id?: number | null } }) => {
    const active = rolePermIds.has(item.id)
    return (
      <TouchableOpacity style={[styles.permItem, active && styles.permItemActive]} onPress={() => toggle(item)}>
        <Text style={styles.permText}>{item.name}</Text>
        <Text style={[styles.permToggle, active && styles.permToggleActive]}>{active ? "ON" : "OFF"}</Text>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ea" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Quyền của vai trò: {roleName || roleId}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {Object.keys(grouped).map((mod) => (
          <View key={mod} style={styles.group}>
            <Text style={styles.groupTitle}>{mod}</Text>
            <FlatList
              data={grouped[mod]}
              keyExtractor={(i) => String(i.id)}
              renderItem={renderPerm}
              scrollEnabled={false}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
})

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  error: { color: "#d32f2f", marginBottom: 8 },
  group: { marginBottom: 12, backgroundColor: "#fff", borderRadius: 8, padding: 12 },
  groupTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  permItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#eee" },
  permItemActive: { backgroundColor: "#f3e8ff" },
  permText: { fontSize: 14, color: "#333" },
  permToggle: { fontSize: 12, color: "#666" },
  permToggleActive: { color: "#6200ea", fontWeight: "700" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
})



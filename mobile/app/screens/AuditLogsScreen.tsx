import { observer } from "mobx-react-lite"
import { FC, useCallback, useEffect, useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { AppStackScreenProps } from "../navigators"
import { useStores } from "../models"
import { auditLogsApi } from "@/services/api"
import type { AuditLogItem } from "@/services/api/api.types"
import { hasPermission } from "@/utils/permissions"

interface AuditLogsScreenProps extends AppStackScreenProps<"Main"> {}

export const AuditLogsScreen: FC<AuditLogsScreenProps> = observer(function AuditLogsScreen() {
  const { authenticationStore } = useStores()

  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [pageSize, setPageSize] = useState(10)
  const [showPageSizeModal, setShowPageSizeModal] = useState(false)

  const pageSizeOptions = [10, 20, 50, 100]

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 500)
    return () => clearTimeout(handler)
  }, [search])

  const loadLogs = async (currentPage: number = page, searchTerm: string = debouncedSearch) => {
    setLoading(true)
    try {
      const response = await auditLogsApi.getAuditLogs(currentPage, pageSize, searchTerm)
      if (response.kind === "ok") {
        setLogs(response.data.data)
        setTotal(response.data.total)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadLogs(page, debouncedSearch)
  }, [page, debouncedSearch, pageSize])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadLogs(page, debouncedSearch)
  }, [page, debouncedSearch])

  const canView = hasPermission(authenticationStore.currentUser?.permissions, "audit_log", "view")
  if (!canView) return null

  const renderItem = ({ item }: { item: AuditLogItem }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.action}>{item.action}</Text>
        <Text style={styles.table}>{item.table_name} (#{item.record_id})</Text>
        {!!item.description && <Text style={styles.desc}>{item.description}</Text>}
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.time}>{new Date(item.timestamp).toLocaleString("vi-VN")}</Text>
        {!!item.user && <Text style={styles.user}>{item.user?.full_name || item.user?.username || item.user?.id}</Text>}
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Nhật ký hệ thống</Text>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo bảng, hành động, mô tả..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {loading && logs.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ea" />
          </View>
        ) : (
          <FlatList
            data={logs}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>Không có log</Text></View>}
            contentContainerStyle={logs.length === 0 ? styles.emptyList : undefined}
          />
        )}

        {total > 0 && (
          <View style={styles.pagination}>
            <TouchableOpacity style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]} onPress={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <Text style={styles.paginationButtonText}>Trước</Text>
            </TouchableOpacity>
            <View style={styles.paginationCenter}>
              <TouchableOpacity onPress={() => setShowPageSizeModal(true)} style={styles.pageSizeButton}>
                <Text style={styles.pageSizeValue}>{pageSize}</Text>
              </TouchableOpacity>
              <Text style={styles.paginationText}>Trang {page} / {Math.ceil(total / pageSize)}</Text>
            </View>
            <TouchableOpacity style={[styles.paginationButton, page * pageSize >= total && styles.paginationButtonDisabled]} onPress={() => setPage((p) => p + 1)} disabled={page * pageSize >= total}>
              <Text style={styles.paginationButtonText}>Sau</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Page Size Modal */}
      {showPageSizeModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn số dòng mỗi trang</Text>
            {pageSizeOptions.map((size) => (
              <TouchableOpacity key={size} style={[styles.pageSizeOption, pageSize === size && styles.pageSizeOptionSelected]} onPress={() => { setPageSize(size); setPage(1); setShowPageSizeModal(false) }}>
                <Text style={[styles.pageSizeOptionText, pageSize === size && styles.pageSizeOptionTextSelected]}>{size}</Text>
                {pageSize === size && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowPageSizeModal(false)}>
              <Text style={styles.modalButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
})

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "bold" },
  searchInput: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 8, padding: 12, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  cardLeft: { flex: 1 },
  action: { fontSize: 14, fontWeight: "700", marginBottom: 2, color: "#333" },
  table: { fontSize: 12, color: "#666", marginBottom: 2 },
  desc: { fontSize: 12, color: "#555" },
  cardRight: { alignItems: "flex-end", justifyContent: "space-between" },
  time: { fontSize: 12, color: "#999" },
  user: { fontSize: 12, color: "#6200ea", fontWeight: "600" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyText: { fontSize: 16, color: "#999" },
  emptyList: { flexGrow: 1 },
  pagination: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, borderTopWidth: 1, borderTopColor: "#eee" },
  paginationCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  pageSizeButton: { paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: "#6200ea", borderRadius: 6 },
  pageSizeValue: { fontSize: 14, color: "#6200ea", fontWeight: "600" },
  paginationButton: { backgroundColor: "#6200ea", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  paginationButtonDisabled: { backgroundColor: "#ccc" },
  paginationButtonText: { color: "#fff", fontWeight: "600" },
  paginationText: { fontSize: 14, color: "#666" },
  modalOverlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", borderRadius: 12, padding: 20, width: "90%", maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: "600", marginBottom: 16 },
  modalButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#ddd", marginTop: 8 },
  modalButtonText: { color: "#666", fontWeight: "600" },
  pageSizeOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, marginVertical: 4, borderRadius: 8, backgroundColor: "#f5f5f5" },
  pageSizeOptionSelected: { backgroundColor: "#e8d5ff" },
  pageSizeOptionText: { fontSize: 16, color: "#333" },
  pageSizeOptionTextSelected: { color: "#6200ea", fontWeight: "600" },
  checkmark: { fontSize: 18, color: "#6200ea", fontWeight: "bold" },
})



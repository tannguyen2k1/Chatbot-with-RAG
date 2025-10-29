import { observer } from "mobx-react-lite"
import { FC, useCallback, useEffect, useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ActivityIndicator, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { AppStackScreenProps } from "../navigators"
import { useStores } from "../models"
import { tenantsApi } from "@/services/api"
import type { Tenant } from "@/services/api/api.types"
import { hasPermission } from "@/utils/permissions"
import { useAppTheme } from "@/utils/useAppTheme"
import { useToast } from "@/components/ToastProvider"

interface TenantsScreenProps extends AppStackScreenProps<"Main"> {}

export const TenantsScreen: FC<TenantsScreenProps> = observer(function TenantsScreen() {
  const { authenticationStore } = useStores()
  const { themed, theme } = useAppTheme()
  const { showSuccess, showError } = useToast()

  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [modalVisible, setModalVisible] = useState(false)
  const [formData, setFormData] = useState({ name: "", tenant_code: "", domain: "", subdomain: "", expiration_date: "", is_active: true })
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [pageSize, setPageSize] = useState(10)
  const [showPageSizeModal, setShowPageSizeModal] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null)

  const pageSizeOptions = [10, 20, 50, 100]

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 500)
    return () => clearTimeout(handler)
  }, [search])

  const loadTenants = async (currentPage: number = page, searchTerm: string = debouncedSearch) => {
    setLoading(true)
    setErrorMessage("")
    try {
      const response = await tenantsApi.getTenants(currentPage, pageSize, searchTerm)
      if (response.kind === "ok") {
        setTenants(response.data.data)
        setTotal(response.data.total)
      } else {
        setErrorMessage("Không thể tải danh sách tenant")
      }
    } catch (error) {
      console.error("Load tenants error:", error)
      setErrorMessage("Đã xảy ra lỗi không mong muốn")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadTenants(page, debouncedSearch)
  }, [page, debouncedSearch, pageSize])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadTenants(page, debouncedSearch)
  }, [page, debouncedSearch])

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.tenant_code.trim()) {
      showError("Vui lòng nhập Name và Tenant code")
      return
    }

    setSubmitting(true)
    setErrorMessage("")

    try {
      let response
      const payload = { ...formData, domain: formData.domain || undefined, subdomain: formData.subdomain || undefined, expiration_date: formData.expiration_date || undefined }
      if (editingTenant) {
        response = await tenantsApi.updateTenant(editingTenant.id, payload)
      } else {
        response = await tenantsApi.createTenant(payload)
      }
      if (response.kind === "ok") {
        setModalVisible(false)
        setFormData({ name: "", tenant_code: "", domain: "", subdomain: "", expiration_date: "", is_active: true })
        setEditingTenant(null)
        setErrorMessage("")
        await loadTenants(page, debouncedSearch)
        showSuccess(editingTenant ? "Cập nhật thành công" : "Thêm mới thành công")
      } else {
        setErrorMessage("Không thể lưu tenant")
      }
    } catch (error) {
      console.error("Submit error:", error)
      setErrorMessage("Đã xảy ra lỗi không mong muốn")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant)
    setFormData({
      name: tenant.name,
      tenant_code: tenant.tenant_code,
      domain: tenant.domain || "",
      subdomain: tenant.subdomain || "",
      expiration_date: tenant.expiration_date || "",
      is_active: !!tenant.is_active,
    })
    setModalVisible(true)
  }

  const handleDelete = (tenant: Tenant) => {
    setTenantToDelete(tenant)
    setDeleteModalVisible(true)
  }

  const confirmDelete = async () => {
    if (!tenantToDelete) return
    
    setLoading(true)
    try {
      const response = await tenantsApi.deleteTenant(tenantToDelete.id)
      if (response.kind === "ok") {
        await loadTenants(page, debouncedSearch)
        showSuccess("Xóa tenant thành công")
      } else {
        showError("Không thể xóa tenant")
      }
    } catch (error) {
      console.error("Delete error:", error)
      showError("Không thể xóa tenant")
    } finally {
      setLoading(false)
      setDeleteModalVisible(false)
      setTenantToDelete(null)
    }
  }

  const userPermissions = authenticationStore.currentUser?.permissions
  const canView = hasPermission(userPermissions, "tenant", "view")
  const canCreate = hasPermission(userPermissions, "tenant", "create")
  const canUpdate = hasPermission(userPermissions, "tenant", "update")
  const canDelete = hasPermission(userPermissions, "tenant", "delete")

  if (!canView) return null

  const renderTenantItem = ({ item }: { item: Tenant }) => (
    <View style={[styles.card, themed(({ colors }) => ({ backgroundColor: colors.palette.neutral100, borderColor: colors.border }))]}>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, themed(({ colors }) => ({ color: colors.text }))]}>{item.name}</Text>
        <Text style={[styles.cardSub, themed(({ colors }) => ({ color: colors.textDim }))]}>Code: {item.tenant_code}</Text>
        {!!item.domain && <Text style={[styles.cardMeta, themed(({ colors }) => ({ color: colors.textDim }))]}>Domain: {item.domain}</Text>}
        {!!item.subdomain && <Text style={[styles.cardMeta, themed(({ colors }) => ({ color: colors.textDim }))]}>Subdomain: {item.subdomain}</Text>}
        {!!item.expiration_date && <Text style={[styles.cardMeta, themed(({ colors }) => ({ color: colors.textDim }))]}>Hết hạn: {new Date(item.expiration_date).toLocaleDateString("vi-VN")}</Text>}
        <Text style={[styles.cardMeta, themed(({ colors }) => ({ color: colors.textDim }))]}>Trạng thái: {item.is_active ? "Active" : "Inactive"}</Text>
      </View>
      <View style={styles.cardActions}>
        {canUpdate && (
          <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(item)}>
            <Text style={styles.editButton}>✏️</Text>
          </TouchableOpacity>
        )}
        {canDelete && (
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item)}>
            <Text style={[styles.deleteButton, themed(({ colors }) => ({ color: colors.error }))]}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  return (
    <SafeAreaView style={[styles.safeArea, themed(({ colors }) => ({ backgroundColor: colors.background }))]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, themed(({ colors }) => ({ color: colors.text }))]}>Quản lý Tenant</Text>
          <TouchableOpacity style={[styles.addButton, !canCreate && { opacity: 0.5 }]} onPress={() => canCreate ? (setEditingTenant(null), setFormData({ name: "", tenant_code: "", domain: "", subdomain: "", expiration_date: "", is_active: true }), setModalVisible(true)) : showError("Bạn không có quyền tạo tenant") }>
            <Text style={styles.addButtonText}>+ Thêm</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[styles.searchInput, themed(({ colors }) => ({ borderColor: colors.border, backgroundColor: colors.palette.neutral100, color: colors.text }))]}
          placeholderTextColor={theme.colors.textDim}
          placeholder="Tìm kiếm..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {loading && tenants.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ea" />
          </View>
        ) : (
          <FlatList
            data={tenants}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTenantItem}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Không có tenant</Text>
              </View>
            }
            contentContainerStyle={tenants.length === 0 ? styles.emptyList : undefined}
          />
        )}

        {total > 0 && (
          <View style={[styles.pagination, themed(({ colors }) => ({ borderTopColor: colors.border }))]}>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                themed(({ colors }) => ({ backgroundColor: colors.tint })),
                page === 1 && themed(({ colors, isDark }) => ({ backgroundColor: isDark ? colors.palette.neutral600 : "#ccc" })),
              ]}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <Text style={styles.paginationButtonText}>Trước</Text>
            </TouchableOpacity>
            <View style={styles.paginationCenter}>
              <TouchableOpacity onPress={() => setShowPageSizeModal(true)} style={[styles.pageSizeButton, themed(({ colors }) => ({ borderColor: colors.tint }))]}>
                <Text style={[styles.pageSizeValue, themed(({ colors }) => ({ color: colors.tint }))]}>{pageSize}</Text>
              </TouchableOpacity>
              <Text style={[styles.paginationText, themed(({ colors }) => ({ color: colors.textDim }))]}>
                Trang {page} / {Math.ceil(total / pageSize)}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                themed(({ colors }) => ({ backgroundColor: colors.tint })),
                page * pageSize >= total && themed(({ colors, isDark }) => ({ backgroundColor: isDark ? colors.palette.neutral600 : "#ccc" })),
              ]}
              onPress={() => setPage((p) => p + 1)}
              disabled={page * pageSize >= total}
            >
              <Text style={styles.paginationButtonText}>Sau</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, themed(({ colors }) => ({ backgroundColor: colors.palette.neutral100, borderColor: colors.border }))]}>
            <Text style={[styles.modalTitle, themed(({ colors }) => ({ color: colors.text }))]}>{editingTenant ? "Sửa Tenant" : "Thêm Tenant"}</Text>

            <TextInput
              style={[styles.formInput, themed(({ colors }) => ({ borderColor: colors.border, backgroundColor: colors.palette.neutral100, color: colors.text }))]}
              placeholderTextColor={theme.colors.textDim}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Tên *"
              autoCapitalize="sentences"
              autoCorrect={false}
            />

            <TextInput
              style={[styles.formInput, themed(({ colors }) => ({ borderColor: colors.border, backgroundColor: colors.palette.neutral100, color: colors.text }))]}
              placeholderTextColor={theme.colors.textDim}
              value={formData.tenant_code}
              onChangeText={(text) => setFormData({ ...formData, tenant_code: text })}
              placeholder="Tenant code *"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={[styles.formInput, themed(({ colors }) => ({ borderColor: colors.border, backgroundColor: colors.palette.neutral100, color: colors.text }))]}
              placeholderTextColor={theme.colors.textDim}
              value={formData.domain}
              onChangeText={(text) => setFormData({ ...formData, domain: text })}
              placeholder="Domain"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={[styles.formInput, themed(({ colors }) => ({ borderColor: colors.border, backgroundColor: colors.palette.neutral100, color: colors.text }))]}
              placeholderTextColor={theme.colors.textDim}
              value={formData.subdomain}
              onChangeText={(text) => setFormData({ ...formData, subdomain: text })}
              placeholder="Subdomain"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={[styles.formInput, themed(({ colors }) => ({ borderColor: colors.border, backgroundColor: colors.palette.neutral100, color: colors.text }))]}
              placeholderTextColor={theme.colors.textDim}
              value={formData.expiration_date}
              onChangeText={(text) => setFormData({ ...formData, expiration_date: text })}
              placeholder="Ngày hết hạn (YYYY-MM-DD)"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, themed(({ colors }) => ({ backgroundColor: colors.palette.neutral300, borderColor: colors.border }))]}
                onPress={() => {
                  setModalVisible(false)
                  setFormData({ name: "", tenant_code: "", domain: "", subdomain: "", expiration_date: "", is_active: true })
                  setEditingTenant(null)
                  setErrorMessage("")
                }}
              >
                <Text style={[styles.modalButtonText, themed(({ colors }) => ({ color: colors.text }))]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: "#6200ea", borderColor: "#6200ea" }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonTextPrimary}>Lưu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Page Size Modal */}
      <Modal visible={showPageSizeModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, themed(({ colors }) => ({ backgroundColor: colors.palette.neutral100, borderColor: colors.border }))]}>
            <Text style={[styles.modalTitle, themed(({ colors }) => ({ color: colors.text }))]}>Chọn số dòng mỗi trang</Text>
            {[10, 20, 50, 100].map((size) => (
              <TouchableOpacity
                key={size}
                style={[styles.pageSizeOption, pageSize === size && styles.pageSizeOptionSelected]}
                onPress={() => {
                  setPageSize(size)
                  setPage(1)
                  setShowPageSizeModal(false)
                }}
              >
                <Text style={[styles.pageSizeOptionText, pageSize === size && styles.pageSizeOptionTextSelected]}>
                  {size}
                </Text>
                {pageSize === size && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.modalButton, themed(({ colors }) => ({ backgroundColor: colors.palette.neutral300, borderColor: colors.border }))]} onPress={() => setShowPageSizeModal(false)}>
              <Text style={[styles.modalButtonText, themed(({ colors }) => ({ color: colors.text }))]}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, themed(({ colors }) => ({ backgroundColor: colors.palette.neutral100, borderColor: colors.border }))]}>
            <Text style={[styles.modalTitle, themed(({ colors }) => ({ color: colors.text }))]}>Xác nhận xóa</Text>
            <Text style={[styles.modalMessage, themed(({ colors }) => ({ color: colors.textDim }))]}>
              Bạn có chắc chắn muốn xóa tenant "{tenantToDelete?.name}"?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary, themed(({ colors }) => ({ backgroundColor: colors.palette.neutral300, borderWidth: 0 }))]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, themed(({ colors }) => ({ color: colors.text }))]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: "#d32f2f", borderWidth: 0 }]}
                onPress={confirmDelete}
              >
                <Text style={styles.modalButtonTextPrimary}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
})

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "bold" },
  addButton: { backgroundColor: "#6200ea", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: "#fff", fontWeight: "600" },
  searchInput: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: "#fff" },
  errorText: { color: "#d32f2f", fontSize: 14, marginBottom: 8 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 8, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#ddd", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  cardContent: { flex: 1, marginRight: 12 },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  cardSub: { fontSize: 14, color: "#666", marginBottom: 4 },
  cardMeta: { fontSize: 12, color: "#999" },
  cardActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  actionButton: { padding: 8 },
  editButton: { fontSize: 20 },
  deleteButton: { fontSize: 20, color: "#d32f2f" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyText: { fontSize: 16, color: "#999" },
  emptyList: { flexGrow: 1 },
  pagination: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, borderTopWidth: 1, borderTopColor: "#eee" },
  paginationButton: { backgroundColor: "#6200ea", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  paginationButtonDisabled: { backgroundColor: "#ccc" },
  paginationButtonText: { color: "#fff", fontWeight: "600" },
  paginationText: { fontSize: 14, color: "#666" },
  paginationCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  pageSizeButton: { paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: "#6200ea", borderRadius: 6 },
  pageSizeValue: { fontSize: 14, color: "#6200ea", fontWeight: "600" },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.5)" },
  modalContent: { backgroundColor: "#fff", borderRadius: 12, padding: 20, width: "90%", maxWidth: 400, borderWidth: 1, borderColor: "#ddd" },
  modalTitle: { fontSize: 20, fontWeight: "600", marginBottom: 16 },
  formInput: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: "#fff" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16, gap: 8 },
  modalButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#ddd" },
  modalButtonPrimary: { backgroundColor: "#6200ea", borderColor: "#6200ea" },
  modalButtonText: { color: "#666", fontWeight: "600" },
  modalButtonTextPrimary: { color: "#fff", fontWeight: "600" },
  pageSizeOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, marginVertical: 4, borderRadius: 8, backgroundColor: "#f5f5f5" },
  pageSizeOptionSelected: { backgroundColor: "#e8d5ff" },
  pageSizeOptionText: { fontSize: 16, color: "#333" },
  pageSizeOptionTextSelected: { color: "#6200ea", fontWeight: "600" },
  checkmark: { fontSize: 18, color: "#6200ea", fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center" },
  modalMessage: { fontSize: 16, marginBottom: 24, textAlign: "center" },
  modalButtonSecondary: { backgroundColor: "#f5f5f5" },
})



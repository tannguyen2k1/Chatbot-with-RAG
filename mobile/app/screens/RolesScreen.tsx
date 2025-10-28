import { observer } from "mobx-react-lite"
import { FC, useCallback, useEffect, useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ActivityIndicator, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { AppStackScreenProps } from "../navigators"
import { useStores } from "../models"
import { rolesApi } from "@/services/api"
import type { Role } from "@/services/api/api.types"
import { hasPermission } from "@/utils/permissions"

interface RolesScreenProps extends AppStackScreenProps<"Main"> {}

export const RolesScreen: FC<RolesScreenProps> = observer(function RolesScreen() {
  const { authenticationStore } = useStores()

  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [modalVisible, setModalVisible] = useState(false)
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [pageSize, setPageSize] = useState(20)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 500)
    return () => clearTimeout(handler)
  }, [search])

  const loadRoles = async (currentPage: number = page, searchTerm: string = debouncedSearch) => {
    setLoading(true)
    setErrorMessage("")
    try {
      const response = await rolesApi.getRoles(currentPage, pageSize, searchTerm)
      if (response.kind === "ok") {
        const payload: any = response.data as any
        const list: Role[] = Array.isArray(payload) ? payload : payload?.data ?? []
        setRoles(list)
        const totalCount = Array.isArray(payload)
          ? payload.length
          : payload?.total ?? (Array.isArray(payload?.data) ? payload.data.length : 0)
        setTotal(totalCount)
      } else {
        setErrorMessage("Không thể tải danh sách vai trò")
      }
    } catch (error) {
      console.error("Load roles error:", error)
      setErrorMessage("Đã xảy ra lỗi không mong muốn")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadRoles(page, debouncedSearch)
  }, [page, debouncedSearch, pageSize])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadRoles(page, debouncedSearch)
  }, [page, debouncedSearch])

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên vai trò")
      return
    }

    setSubmitting(true)
    setErrorMessage("")

    try {
      let response
      if (editingRole) {
        response = await rolesApi.updateRole(editingRole.id, formData)
      } else {
        response = await rolesApi.createRole(formData)
      }
      if (response.kind === "ok") {
        setModalVisible(false)
        setFormData({ name: "", description: "" })
        setEditingRole(null)
        setErrorMessage("")
        await loadRoles(page, debouncedSearch)
        Alert.alert("Thành công", editingRole ? "Cập nhật vai trò thành công" : "Thêm vai trò thành công")
      } else {
        setErrorMessage("Không thể lưu vai trò")
      }
    } catch (error) {
      console.error("Submit error:", error)
      setErrorMessage("Đã xảy ra lỗi không mong muốn")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (role: Role) => {
    setEditingRole(role)
    setFormData({ name: role.name, description: role.description || "" })
    setModalVisible(true)
  }

  const handleDelete = (role: Role) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa vai trò này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            setLoading(true)
            try {
              const response = await rolesApi.deleteRole(role.id)
              if (response.kind === "ok") {
                await loadRoles(page, debouncedSearch)
                Alert.alert("Thành công", "Xóa vai trò thành công")
              } else {
                Alert.alert("Lỗi", "Không thể xóa vai trò")
              }
            } catch (error) {
              console.error("Delete error:", error)
              Alert.alert("Lỗi", "Không thể xóa vai trò")
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  const userPermissions = authenticationStore.currentUser?.permissions
  const canView = hasPermission(userPermissions, "role", "view")
  const canCreate = hasPermission(userPermissions, "role", "create")
  const canUpdate = hasPermission(userPermissions, "role", "update")
  const canDelete = hasPermission(userPermissions, "role", "delete")

  if (!canView) return null

  const renderRoleItem = ({ item }: { item: Role }) => (
    <View style={styles.roleCard}>
      <View style={styles.roleContent}>
        <Text style={styles.roleTitle}>{item.name}</Text>
        {!!item.description && <Text style={styles.roleSub}>{item.description}</Text>}
      </View>
      <View style={styles.roleActions}>
        {canUpdate && (
          <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(item)}>
            <Text style={styles.editButton}>✏️</Text>
          </TouchableOpacity>
        )}
        {canDelete && (
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item)}>
            <Text style={styles.deleteButton}>🗑️</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Quản lý vai trò</Text>
          <TouchableOpacity style={[styles.addButton, !canCreate && { opacity: 0.5 }]} onPress={() => canCreate ? (setEditingRole(null), setFormData({ name: "", description: "" }), setModalVisible(true)) : Alert.alert("Không có quyền", "Bạn không có quyền tạo vai trò") }>
            <Text style={styles.addButtonText}>+ Thêm</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {loading && roles.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ea" />
          </View>
        ) : (
          <FlatList
            data={roles}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderRoleItem}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Không có vai trò</Text>
              </View>
            }
            contentContainerStyle={roles.length === 0 ? styles.emptyList : undefined}
          />
        )}

        {total > 0 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <Text style={styles.paginationButtonText}>Trước</Text>
            </TouchableOpacity>
            <Text style={styles.paginationText}>
              Trang {page} / {Math.ceil(total / pageSize)}
            </Text>
            <TouchableOpacity
              style={[styles.paginationButton, page * pageSize >= total && styles.paginationButtonDisabled]}
              onPress={() => setPage((p) => p + 1)}
              disabled={page * pageSize >= total}
            >
              <Text style={styles.paginationButtonText}>Sau</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingRole ? "Sửa vai trò" : "Thêm vai trò"}</Text>

            <TextInput
              style={styles.formInput}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Tên vai trò *"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={[styles.formInput]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Mô tả"
              autoCapitalize="sentences"
              autoCorrect={false}
            />

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setModalVisible(false)
                  setFormData({ name: "", description: "" })
                  setEditingRole(null)
                  setErrorMessage("")
                }}
              >
                <Text style={styles.modalButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
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
    </SafeAreaView>
  )
})

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#6200ea",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 14,
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  roleCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roleContent: {
    flex: 1,
    marginRight: 12,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  roleSub: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  roleActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
  },
  editButton: {
    fontSize: 20,
  },
  deleteButton: {
    fontSize: 20,
    color: "#d32f2f",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  emptyList: {
    flexGrow: 1,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  paginationButton: {
    backgroundColor: "#6200ea",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: "#ccc",
  },
  paginationButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  paginationText: {
    fontSize: 14,
    color: "#666",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    gap: 8,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  modalButtonPrimary: {
    backgroundColor: "#6200ea",
    borderColor: "#6200ea",
  },
  modalButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  modalButtonTextPrimary: {
    color: "#fff",
    fontWeight: "600",
  },
})



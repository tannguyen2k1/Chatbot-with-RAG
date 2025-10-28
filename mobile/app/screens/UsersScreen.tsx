import { observer } from "mobx-react-lite"
import { FC, useCallback, useEffect, useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ActivityIndicator, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { AppStackScreenProps } from "../navigators"
import { useStores } from "../models"
import { usersApi } from "@/services/api"
import type { User } from "@/services/api/api.types"
import { hasPermission } from "@/utils/permissions"

interface UsersScreenProps extends AppStackScreenProps<"Main"> {}

export const UsersScreen: FC<UsersScreenProps> = observer(function UsersScreen() {
  const { authenticationStore } = useStores()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [modalVisible, setModalVisible] = useState(false)
  const [formData, setFormData] = useState({ username: "", email: "", full_name: "", phone: "", password: "" })
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
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

  const loadUsers = async (currentPage: number = page, searchTerm: string = debouncedSearch) => {
    setLoading(true)
    setErrorMessage("")
    try {
      const response = await usersApi.getUsers(currentPage, pageSize, searchTerm)
      if (response.kind === "ok") {
        setUsers(response.data.data)
        setTotal(response.data.total)
      } else {
        setErrorMessage("Không thể tải danh sách người dùng")
      }
    } catch (error) {
      console.error("Load users error:", error)
      setErrorMessage("Đã xảy ra lỗi không mong muốn")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadUsers(page, debouncedSearch)
  }, [page, debouncedSearch, pageSize])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadUsers(page, debouncedSearch)
  }, [page, debouncedSearch])

  const handleSubmit = async () => {
    if (!formData.username.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập username")
      return
    }
    if (!editingUser && !formData.password.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mật khẩu")
      return
    }

    setSubmitting(true)
    setErrorMessage("")

    try {
      let response
      if (editingUser) {
        const { password, ...rest } = formData
        response = await usersApi.updateUser(editingUser.id, rest)
      } else {
        response = await usersApi.createUser(formData)
      }
      if (response.kind === "ok") {
        setModalVisible(false)
        setFormData({ username: "", email: "", full_name: "", phone: "", password: "" })
        setEditingUser(null)
        setErrorMessage("")
        await loadUsers(page, debouncedSearch)
        Alert.alert("Thành công", editingUser ? "Cập nhật thành công" : "Thêm mới thành công")
      } else {
        setErrorMessage("Không thể lưu người dùng")
      }
    } catch (error) {
      console.error("Submit error:", error)
      setErrorMessage("Đã xảy ra lỗi không mong muốn")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({ username: user.username, email: user.email || "", full_name: user.full_name || "", phone: user.phone || "", password: "" })
    setModalVisible(true)
  }

  const handleDelete = (user: User) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa người dùng này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            setLoading(true)
            try {
              const response = await usersApi.deleteUser(user.id)
              if (response.kind === "ok") {
                await loadUsers(page, debouncedSearch)
                Alert.alert("Thành công", "Xóa người dùng thành công")
              } else {
                Alert.alert("Lỗi", "Không thể xóa người dùng")
              }
            } catch (error) {
              console.error("Delete error:", error)
              Alert.alert("Lỗi", "Không thể xóa người dùng")
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  const userPermissions = authenticationStore.currentUser?.permissions
  const canView = hasPermission(userPermissions, "user", "view")
  const canCreate = hasPermission(userPermissions, "user", "create")
  const canUpdate = hasPermission(userPermissions, "user", "update")
  const canDelete = hasPermission(userPermissions, "user", "delete")

  if (!canView) return null

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userContent}>
        <Text style={styles.userTitle}>{item.full_name || item.username}</Text>
        <Text style={styles.userSub}>{item.email || "Không có email"}</Text>
        <Text style={styles.userMeta}>Vai trò: {item.roles?.join(", ") || "-"}</Text>
      </View>
      <View style={styles.userActions}>
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
          <Text style={styles.title}>Quản lý người dùng</Text>
          <TouchableOpacity style={[styles.addButton, !canCreate && { opacity: 0.5 }]} onPress={() => canCreate ? (setEditingUser(null), setFormData({ username: "", email: "", full_name: "", phone: "", password: "" }), setModalVisible(true)) : Alert.alert("Không có quyền", "Bạn không có quyền tạo người dùng") }>
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

        {loading && users.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ea" />
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderUserItem}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Không có người dùng</Text>
              </View>
            }
            contentContainerStyle={users.length === 0 ? styles.emptyList : undefined}
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
            <View style={styles.paginationCenter}>
              <TouchableOpacity onPress={() => setShowPageSizeModal(true)} style={styles.pageSizeButton}>
                <Text style={styles.pageSizeValue}>{pageSize}</Text>
              </TouchableOpacity>
              <Text style={styles.paginationText}>
                Trang {page} / {Math.ceil(total / pageSize)}
              </Text>
            </View>
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
            <Text style={styles.modalTitle}>{editingUser ? "Sửa người dùng" : "Thêm người dùng"}</Text>

            <TextInput
              style={styles.formInput}
              value={formData.username}
              onChangeText={(text) => setFormData({ ...formData, username: text })}
              placeholder="Username *"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {!editingUser && (
              <TextInput
                style={styles.formInput}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                placeholder="Mật khẩu *"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            )}

            <TextInput
              style={styles.formInput}
              value={formData.full_name}
              onChangeText={(text) => setFormData({ ...formData, full_name: text })}
              placeholder="Họ tên"
              autoCapitalize="words"
              autoCorrect={false}
            />

            <TextInput
              style={styles.formInput}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Email"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            <TextInput
              style={styles.formInput}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="Số điện thoại"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="phone-pad"
            />

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setModalVisible(false)
                  setFormData({ username: "", email: "", full_name: "", phone: "", password: "" })
                  setEditingUser(null)
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

      {/* Page Size Modal */}
      <Modal visible={showPageSizeModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn số dòng mỗi trang</Text>
            {pageSizeOptions.map((size) => (
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
            <TouchableOpacity style={styles.modalButton} onPress={() => setShowPageSizeModal(false)}>
              <Text style={styles.modalButtonText}>Đóng</Text>
            </TouchableOpacity>
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
  userCard: {
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
  userContent: {
    flex: 1,
    marginRight: 12,
  },
  userTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  userSub: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  userMeta: {
    fontSize: 12,
    color: "#999",
  },
  userActions: {
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
  paginationCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pageSizeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#6200ea",
    borderRadius: 6,
  },
  pageSizeValue: {
    fontSize: 14,
    color: "#6200ea",
    fontWeight: "600",
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
  // reused from Demo pagination modal
  pageSizeOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  pageSizeOptionSelected: {
    backgroundColor: "#e8d5ff",
  },
  pageSizeOptionText: {
    fontSize: 16,
    color: "#333",
  },
  pageSizeOptionTextSelected: {
    color: "#6200ea",
    fontWeight: "600",
  },
  checkmark: {
    fontSize: 18,
    color: "#6200ea",
    fontWeight: "bold",
  },
})



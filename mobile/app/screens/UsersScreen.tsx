import { observer } from "mobx-react-lite"
import { FC, useCallback, useEffect, useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ActivityIndicator, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { AppStackScreenProps } from "../navigators"
import { useStores } from "../models"
import { usersApi } from "@/services/api"
import type { User } from "@/services/api/api.types"
import { hasPermission } from "@/utils/permissions"
import { useAppTheme } from "@/utils/useAppTheme"

interface UsersScreenProps extends AppStackScreenProps<"Main"> {}

export const UsersScreen: FC<UsersScreenProps> = observer(function UsersScreen() {
  const { authenticationStore } = useStores()
  const { themed, theme } = useAppTheme()

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
  const [resetPasswordModal, setResetPasswordModal] = useState(false)
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)

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

  const handleResetPassword = async () => {
    if (!resetPasswordUser) return
    
    setSubmitting(true)
    try {
      const response = await usersApi.resetPassword(resetPasswordUser.id, "user123456")
      if (response.kind === "ok") {
        setResetPasswordModal(false)
        setResetPasswordUser(null)
        Alert.alert("Thành công", "Reset mật khẩu thành công\nMật khẩu mới: user123456")
      } else {
        Alert.alert("Lỗi", "Không thể reset mật khẩu")
      }
    } catch (error) {
      console.error("Reset password error:", error)
      Alert.alert("Lỗi", "Không thể reset mật khẩu")
    } finally {
      setSubmitting(false)
    }
  }

  const userPermissions = authenticationStore.currentUser?.permissions
  const canView = hasPermission(userPermissions, "user", "view")
  const canCreate = hasPermission(userPermissions, "user", "create")
  const canUpdate = hasPermission(userPermissions, "user", "update")
  const canDelete = hasPermission(userPermissions, "user", "delete")
  const canResetPassword = hasPermission(userPermissions, "user", "reset-password")

  if (!canView) return null

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={[styles.userCard, themed(({ colors }) => ({ backgroundColor: colors.palette.neutral100 }))]}>
      <View style={styles.userContent}>
        <Text style={[styles.userTitle, themed(({ colors }) => ({ color: colors.text }))]}>{item.full_name || item.username}</Text>
        <Text style={[styles.userSub, themed(({ colors }) => ({ color: colors.textDim }))]}>{item.email || "Không có email"}</Text>
        <Text style={[styles.userMeta, themed(({ colors }) => ({ color: colors.textDim }))]}>Vai trò: {item.roles?.join(", ") || "-"}</Text>
      </View>
      <View style={styles.userActions}>
        {canUpdate && !item.roles?.includes("root") && (
          <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(item)}>
            <Text style={styles.editButton}>✏️</Text>
          </TouchableOpacity>
        )}
        {canResetPassword && !item.roles?.includes("root") && (
          <TouchableOpacity style={styles.actionButton} onPress={() => {
            setResetPasswordUser(item)
            setResetPasswordModal(true)
          }}>
            <Text style={[styles.resetButton, themed(({ colors }) => ({ color: colors.tint }))]}>🔑</Text>
          </TouchableOpacity>
        )}
        {canDelete && !item.roles?.includes("root") && (
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
          <Text style={[styles.title, themed(({ colors }) => ({ color: colors.text }))]}>Quản lý người dùng</Text>
          <TouchableOpacity style={[styles.addButton, !canCreate && { opacity: 0.5 }]} onPress={() => canCreate ? (setEditingUser(null), setFormData({ username: "", email: "", full_name: "", phone: "", password: "" }), setModalVisible(true)) : Alert.alert("Không có quyền", "Bạn không có quyền tạo người dùng") }>
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

        {errorMessage ? (
          <Text style={[styles.errorText, themed(({ colors }) => ({ color: colors.error }))]}>{errorMessage}</Text>
        ) : null}

        {loading && users.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themed(({ colors }) => colors.tint) as any} />
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
                <Text style={[styles.emptyText, themed(({ colors }) => ({ color: colors.textDim }))]}>Không có người dùng</Text>
              </View>
            }
            contentContainerStyle={users.length === 0 ? styles.emptyList : undefined}
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

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, themed(({ colors }) => ({ backgroundColor: colors.palette.neutral100 }))]}>
            <Text style={styles.modalTitle}>{editingUser ? "Sửa người dùng" : "Thêm người dùng"}</Text>

            <TextInput
              style={[styles.formInput, themed(({ colors }) => ({ borderColor: colors.border, backgroundColor: colors.palette.neutral100, color: colors.text }))]}
              placeholderTextColor={theme.colors.textDim}
              value={formData.username}
              onChangeText={(text) => setFormData({ ...formData, username: text })}
              placeholder="Username *"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {!editingUser && (
              <TextInput
                style={[styles.formInput, themed(({ colors }) => ({ borderColor: colors.border, backgroundColor: colors.palette.neutral100, color: colors.text }))]}
                placeholderTextColor={theme.colors.textDim}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                placeholder="Mật khẩu *"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            )}

            <TextInput
              style={[styles.formInput, themed(({ colors }) => ({ borderColor: colors.border, backgroundColor: colors.palette.neutral100, color: colors.text }))]}
              placeholderTextColor={theme.colors.textDim}
              value={formData.full_name}
              onChangeText={(text) => setFormData({ ...formData, full_name: text })}
              placeholder="Họ tên"
              autoCapitalize="words"
              autoCorrect={false}
            />

            <TextInput
              style={[styles.formInput, themed(({ colors }) => ({ borderColor: colors.border, backgroundColor: colors.palette.neutral100, color: colors.text }))]}
              placeholderTextColor={theme.colors.textDim}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Email"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            <TextInput
              style={[styles.formInput, themed(({ colors }) => ({ borderColor: colors.border, backgroundColor: colors.palette.neutral100, color: colors.text }))]}
              placeholderTextColor={theme.colors.textDim}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="Số điện thoại"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="phone-pad"
            />

            {errorMessage ? (
              <Text style={[styles.errorText, themed(({ colors }) => ({ color: colors.error }))]}>{errorMessage}</Text>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, themed(({ colors }) => ({ borderColor: colors.border }))]}
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
                style={[styles.modalButton, styles.modalButtonPrimary, themed(({ colors }) => ({ backgroundColor: colors.tint, borderColor: colors.tint }))]}
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
          <View style={[styles.modalContent, themed(({ colors }) => ({ backgroundColor: colors.palette.neutral100 }))]}>
            <Text style={styles.modalTitle}>Chọn số dòng mỗi trang</Text>
            {pageSizeOptions.map((size) => (
              <TouchableOpacity
                key={size}
                style={[styles.pageSizeOption, themed(({ colors }) => ({ backgroundColor: colors.background })), pageSize === size && styles.pageSizeOptionSelected]}
                onPress={() => {
                  setPageSize(size)
                  setPage(1)
                  setShowPageSizeModal(false)
                }}
              >
                <Text style={[styles.pageSizeOptionText, themed(({ colors }) => ({ color: colors.text })), pageSize === size && styles.pageSizeOptionTextSelected]}>
                  {size}
                </Text>
                {pageSize === size && <Text style={[styles.checkmark, themed(({ colors }) => ({ color: colors.tint }))]}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.modalButton, themed(({ colors }) => ({ borderColor: colors.border }))]} onPress={() => setShowPageSizeModal(false)}>
              <Text style={styles.modalButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reset Password Modal */}
      <Modal visible={resetPasswordModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, themed(({ colors }) => ({ backgroundColor: colors.palette.neutral100 }))]}>
            <Text style={styles.modalTitle}>Reset mật khẩu</Text>
            <Text style={[styles.modalText, themed(({ colors }) => ({ color: colors.text }))]}>
              Bạn có chắc chắn muốn reset mật khẩu cho user "{resetPasswordUser?.username}"?
            </Text>
            <Text style={[styles.modalSubText, themed(({ colors }) => ({ color: colors.textDim }))]}>
              Mật khẩu mới sẽ là: <Text style={styles.boldText}>user123456</Text>
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, themed(({ colors }) => ({ borderColor: colors.border }))]} onPress={() => setResetPasswordModal(false)}>
                <Text style={styles.modalButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, themed(({ colors }) => ({ backgroundColor: colors.tint, borderColor: colors.tint }))]}
                onPress={handleResetPassword}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonTextPrimary}>Reset</Text>
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
  resetButton: {
    fontSize: 20,
    color: "#ff8800",
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
  modalText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 16,
  },
  modalSubText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  boldText: {
    fontWeight: "bold",
    color: "#333",
  },
})



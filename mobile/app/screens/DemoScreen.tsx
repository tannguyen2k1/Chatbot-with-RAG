import { observer } from "mobx-react-lite"
import { FC, useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ActivityIndicator, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Button } from "../components"
import { AppStackScreenProps } from "../navigators"
import { useStores } from "../models"
import { demoApi } from "@/services/api"
import type { Demo } from "@/services/api/api.types"

interface DemoScreenProps extends AppStackScreenProps<"Main"> {}

export const DemoScreen: FC<DemoScreenProps> = observer(function DemoScreen() {
  const { authenticationStore } = useStores()

  const [demos, setDemos] = useState<Demo[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [modalVisible, setModalVisible] = useState(false)
  const [formData, setFormData] = useState({ title: "", description: "" })
  const [editingDemo, setEditingDemo] = useState<Demo | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const pageSize = 10

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to page 1 when search changes
    }, 500)
    return () => clearTimeout(handler)
  }, [search])

  const loadDemos = async (currentPage: number = page, searchTerm: string = debouncedSearch) => {
    setLoading(true)
    setErrorMessage("")
    try {
      const response = await demoApi.getDemos(currentPage, pageSize, searchTerm)
      
      if (response.kind === "ok") {
        setDemos(response.data.data)
        setTotal(response.data.total)
      } else {
        setErrorMessage("Không thể tải danh sách demo")
      }
    } catch (error) {
      console.error("Load demos error:", error)
      setErrorMessage("Đã xảy ra lỗi không mong muốn")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDemos(page, debouncedSearch)
  }, [page, debouncedSearch])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadDemos(page, debouncedSearch)
  }, [page, debouncedSearch])

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tiêu đề")
      return
    }

    setSubmitting(true)
    setErrorMessage("")

    try {
      let response
      if (editingDemo) {
        response = await demoApi.updateDemo(editingDemo.id, formData)
      } else {
        response = await demoApi.createDemo(formData)
      }

      if (response.kind === "ok") {
        setModalVisible(false)
        setFormData({ title: "", description: "" })
        setEditingDemo(null)
        setErrorMessage("")
        await loadDemos(page, debouncedSearch)
        Alert.alert("Thành công", editingDemo ? "Cập nhật thành công" : "Thêm mới thành công")
      } else {
        setErrorMessage("Không thể lưu demo")
      }
    } catch (error) {
      console.error("Submit error:", error)
      setErrorMessage("Đã xảy ra lỗi không mong muốn")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (demo: Demo) => {
    setEditingDemo(demo)
    setFormData({ title: demo.title, description: demo.description || "" })
    setModalVisible(true)
  }

  const handleDelete = (demo: Demo) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa demo này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            setLoading(true)
            try {
              const response = await demoApi.deleteDemo(demo.id)
              if (response.kind === "ok") {
                await loadDemos(page, debouncedSearch)
                Alert.alert("Thành công", "Xóa demo thành công")
              } else {
                Alert.alert("Lỗi", "Không thể xóa demo")
              }
            } catch (error) {
              console.error("Delete error:", error)
              Alert.alert("Lỗi", "Không thể xóa demo")
            } finally {
              setLoading(false)
            }
          },
        },
      ]
    )
  }

  const handleAdd = () => {
    setEditingDemo(null)
    setFormData({ title: "", description: "" })
    setErrorMessage("")
    setModalVisible(true)
  }

  const canCreate = authenticationStore.currentUser?.permissions?.["demo"]?.includes("create") ?? true
  const canUpdate = authenticationStore.currentUser?.permissions?.["demo"]?.includes("update") ?? true
  const canDelete = authenticationStore.currentUser?.permissions?.["demo"]?.includes("delete") ?? true

  const renderDemoItem = ({ item }: { item: Demo }) => (
    <View style={styles.demoCard}>
      <View style={styles.demoContent}>
        <Text style={styles.demoTitle}>{item.title}</Text>
        {item.description && <Text style={styles.demoDescription}>{item.description}</Text>}
        <Text style={styles.demoDate}>
          {new Date(item.created_at).toLocaleDateString("vi-VN")}
        </Text>
      </View>
      <View style={styles.demoActions}>
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Quản lý Demo</Text>
          {canCreate && (
            <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
              <Text style={styles.addButtonText}>+ Thêm</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm..."
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Error Message */}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {/* Demo List */}
        {loading && demos.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ea" />
          </View>
        ) : (
          <FlatList
            data={demos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderDemoItem}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Không có demo nào</Text>
              </View>
            }
            contentContainerStyle={demos.length === 0 ? styles.emptyList : undefined}
          />
        )}

        {/* Pagination */}
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
              style={[
                styles.paginationButton,
                page * pageSize >= total && styles.paginationButtonDisabled,
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingDemo ? "Sửa Demo" : "Thêm Demo"}
            </Text>

            <TextInput
              style={styles.formInput}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Tiêu đề *"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={[styles.formInput, styles.formInputMultiline]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Mô tả"
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              numberOfLines={4}
            />

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setModalVisible(false)
                  setFormData({ title: "", description: "" })
                  setEditingDemo(null)
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
  demoCard: {
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
  demoContent: {
    flex: 1,
    marginRight: 12,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  demoDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  demoDate: {
    fontSize: 12,
    color: "#999",
  },
  demoActions: {
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
  formInputMultiline: {
    height: 100,
    textAlignVertical: "top",
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

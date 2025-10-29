import { observer } from "mobx-react-lite"
import { FC, useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { AppStackScreenProps } from "../navigators"
import { useStores } from "../models"
import { authApi } from "@/services/api"
import type { User } from "@/services/api/api.types"

interface ProfileScreenProps extends AppStackScreenProps<"Main"> {}

export const ProfileScreen: FC<ProfileScreenProps> = observer(function ProfileScreen() {
  const { authenticationStore } = useStores()
  const user = authenticationStore.currentUser

  const [editProfileModal, setEditProfileModal] = useState(false)
  const [changePasswordModal, setChangePasswordModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Edit Profile states
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  })

  // Change Password states
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const handleEditProfile = async () => {
    if (!profileData.email.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập email")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      Alert.alert("Lỗi", "Email không hợp lệ")
      return
    }
    if (profileData.phone && !/^[0-9+\-\s()]+$/.test(profileData.phone)) {
      Alert.alert("Lỗi", "Số điện thoại không hợp lệ")
      return
    }

    setSubmitting(true)
    setErrorMessage("")
    try {
      const response = await authApi.updateProfile(profileData)
      if (response.kind === "ok") {
        // Update user data in store
        authenticationStore.setCurrentUser(response.data)
        setEditProfileModal(false)
        Alert.alert("Thành công", "Cập nhật thông tin thành công")
      } else {
        setErrorMessage("Không thể cập nhật thông tin")
      }
    } catch (error) {
      console.error("Update profile error:", error)
      setErrorMessage("Đã xảy ra lỗi không mong muốn")
    } finally {
      setSubmitting(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mật khẩu hiện tại")
      return
    }
    if (!passwordData.newPassword.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mật khẩu mới")
      return
    }
    if (passwordData.newPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu mới phải có ít nhất 6 ký tự")
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp")
      return
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      Alert.alert("Lỗi", "Mật khẩu mới phải khác mật khẩu hiện tại")
      return
    }

    setSubmitting(true)
    setErrorMessage("")
    try {
      const response = await authApi.changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      })
      if (response.kind === "ok") {
        setChangePasswordModal(false)
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
        Alert.alert("Thành công", "Đổi mật khẩu thành công")
      } else {
        setErrorMessage("Không thể đổi mật khẩu")
      }
    } catch (error) {
      console.error("Change password error:", error)
      setErrorMessage("Đã xảy ra lỗi không mong muốn")
    } finally {
      setSubmitting(false)
    }
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Không có thông tin người dùng</Text>
        </View>
      </SafeAreaView>
    )
  }

  const avatarText = user.full_name?.[0] || user.username?.[0] || "?"

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Hồ sơ cá nhân</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarText}</Text>
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.full_name || user.username}</Text>
            <Text style={styles.userEmail}>{user.email || "Không có email"}</Text>
            <Text style={styles.userRole}>Vai trò: {user.roles?.join(", ") || "-"}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => {
                setProfileData({
                  full_name: user.full_name || "",
                  email: user.email || "",
                  phone: user.phone || "",
                })
                setEditProfileModal(true)
              }}
            >
              <Text style={styles.actionButtonText}>✏️ Chỉnh sửa</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => setChangePasswordModal(true)}
            >
              <Text style={styles.actionButtonText}>🔒 Đổi mật khẩu</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* User Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Thông tin chi tiết</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Username:</Text>
            <Text style={styles.detailValue}>{user.username}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{user.email || "-"}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Họ tên:</Text>
            <Text style={styles.detailValue}>{user.full_name || "-"}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Số điện thoại:</Text>
            <Text style={styles.detailValue}>{user.phone || "-"}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Trạng thái:</Text>
            <Text style={[styles.detailValue, { color: user.is_active ? "#4caf50" : "#f44336" }]}>
              {user.is_active ? "Hoạt động" : "Ngừng hoạt động"}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tenant ID:</Text>
            <Text style={styles.detailValue}>{user.tenant_id || "-"}</Text>
          </View>
        </View>

        {/* Permissions */}
        {user.permissions && Object.keys(user.permissions).length > 0 && (
          <View style={styles.permissionsCard}>
            <Text style={styles.permissionsTitle}>Quyền hạn</Text>
            {Object.entries(user.permissions).map(([module, perms]) => (
              <View key={module} style={styles.permissionModule}>
                <Text style={styles.permissionModuleTitle}>{module.toUpperCase()}</Text>
                <View style={styles.permissionList}>
                  {Array.isArray(perms) && perms.length > 0 ? (
                    perms.map((perm) => (
                      <View key={perm} style={styles.permissionItem}>
                        <Text style={styles.permissionText}>• {perm.replace(`${module}.`, "")}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noPermissionText}>Không có quyền</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editProfileModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
            
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            
            <TextInput
              style={styles.input}
              placeholder="Họ và tên"
              value={profileData.full_name}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, full_name: text }))}
              autoCapitalize="words"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email *"
              value={profileData.email}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại"
              value={profileData.phone}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={() => setEditProfileModal(false)}
              >
                <Text style={styles.modalButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleEditProfile}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonTextPrimary}>Cập nhật</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={changePasswordModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
            
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Mật khẩu hiện tại"
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
                secureTextEntry={!showPasswords.current}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility("current")}
              >
                <Text style={styles.eyeButtonText}>{showPasswords.current ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Mật khẩu mới"
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
                secureTextEntry={!showPasswords.new}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility("new")}
              >
                <Text style={styles.eyeButtonText}>{showPasswords.new ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Xác nhận mật khẩu mới"
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
                secureTextEntry={!showPasswords.confirm}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility("confirm")}
              >
                <Text style={styles.eyeButtonText}>{showPasswords.confirm ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={() => {
                  setChangePasswordModal(false)
                  setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
                }}
              >
                <Text style={styles.modalButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleChangePassword}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonTextPrimary}>Đổi mật khẩu</Text>
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
    paddingVertical: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#6200ea",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: "#888",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    backgroundColor: "#6200ea",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
  permissionsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  permissionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  permissionModule: {
    marginBottom: 16,
  },
  permissionModuleTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6200ea",
    marginBottom: 8,
  },
  permissionList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  permissionItem: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  permissionText: {
    fontSize: 12,
    color: "#333",
  },
  noPermissionText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  eyeButtonText: {
    fontSize: 16,
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
  errorText: {
    color: "#f44336",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
})

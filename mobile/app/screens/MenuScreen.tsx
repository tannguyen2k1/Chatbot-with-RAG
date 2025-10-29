import { observer } from "mobx-react-lite"
import { FC, useState } from "react"
import { ViewStyle, TextStyle, View, Alert, Modal, TouchableOpacity } from "react-native"
import { Button, Screen, Text } from "../components"
import { useStores } from "../models"
import { DashboardTabScreenProps } from "../navigators/DashboardTabNavigator"
import { useNavigation } from "@react-navigation/native"
import type { MenuStackParamList } from "../navigators/MenuStackNavigator"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { hasPermission } from "@/utils/permissions"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"

export const MenuScreen: FC<DashboardTabScreenProps<"Menu">> = observer(
  function MenuScreen(_props) {
    const { authenticationStore } = useStores()
    const navigation = useNavigation<NativeStackNavigationProp<MenuStackParamList>>()
    const { themed, setThemeContextOverride, themeContext } = useAppTheme()
    const [logoutModalVisible, setLogoutModalVisible] = useState(false)
    const [versionModalVisible, setVersionModalVisible] = useState(false)

    const handleLogout = () => {
      setLogoutModalVisible(true)
    }

    const canViewUsers = hasPermission(authenticationStore.currentUser?.permissions, "user", "view")
    const canViewRoles = hasPermission(authenticationStore.currentUser?.permissions, "role", "view")
    const canViewTenants = hasPermission(authenticationStore.currentUser?.permissions, "tenant", "view")
    const canViewAudit = hasPermission(authenticationStore.currentUser?.permissions, "audit_log", "view")

    const toggleTheme = () => {
      const newTheme = themeContext === "dark" ? "light" : "dark"
      setThemeContextOverride(newTheme)
    }

    return (
      <Screen
        preset="auto"
        contentContainerStyle={themed($screenContentContainer)}
        safeAreaEdges={["top", "bottom"]}
      >
        <View style={themed($container)}>
          <View style={themed($header)}>
            <Text style={themed($title)}>Menu</Text>
            <Text style={themed($subtitle)}>
              Xin chào,{" "}
              {authenticationStore.currentUser?.full_name ||
                authenticationStore.currentUser?.username ||
                "User"}
              !
            </Text>
          </View>

          <View style={themed($content)}>
            <View style={themed($infoCard)}>
              <Text style={themed($infoTitle)}>Thông tin tài khoản</Text>
              <View style={themed($infoRow)}>
                <Text style={themed($infoLabel)}>Username:</Text>
                <Text style={themed($infoValue)}>
                  {authenticationStore.currentUser?.username || "N/A"}
                </Text>
              </View>
              <View style={themed($infoRow)}>
                <Text style={themed($infoLabel)}>Email:</Text>
                <Text style={themed($infoValue)}>
                  {authenticationStore.currentUser?.email || "N/A"}
                </Text>
              </View>
              <View style={themed($infoRow)}>
                <Text style={themed($infoLabel)}>Tenant:</Text>
                <Text style={themed($infoValue)}>
                  {authenticationStore.currentUser?.tenant_id || "N/A"}
                </Text>
              </View>
              <View style={themed($infoRow)}>
                <Text style={themed($infoLabel)}>Vai trò:</Text>
                <Text style={themed($infoValue)}>
                  {authenticationStore.currentUser?.roles?.join(", ") || "N/A"}
                </Text>
              </View>
            </View>

            <View style={themed($buttonContainer)}>
              <View style={themed($sectionContainer)}>
                <Text style={themed($sectionTitle)}>Cá nhân</Text>
                <Button
                  text="Hồ sơ cá nhân"
                  style={themed($profileButton)}
                  preset="default"
                  onPress={() => navigation.navigate("Profile")}
                />
              </View>

              <View style={themed($sectionContainer)}>
                <Text style={themed($sectionTitle)}>Quản lý hệ thống</Text>
                {canViewUsers && (
                  <Button
                    text="Quản lý người dùng"
                    style={themed($button)}
                    preset="default"
                    onPress={() => navigation.navigate("Users")}
                  />
                )}

                {canViewRoles && (
                  <Button
                    text="Quản lý vai trò"
                    style={themed($button)}
                    preset="default"
                    onPress={() => navigation.navigate("Roles")}
                  />
                )}

                {canViewTenants && (
                  <Button
                    text="Quản lý tenant"
                    style={themed($button)}
                    preset="default"
                    onPress={() => navigation.navigate("Tenants")}
                  />
                )}

                {canViewAudit && (
                  <Button
                    text="Nhật ký hệ thống"
                    style={themed($button)}
                    preset="default"
                    onPress={() => navigation.navigate("AuditLogs")}
                  />
                )}
              </View>

              <View style={themed($sectionContainer)}>
                <Text style={themed($sectionTitle)}>Khác</Text>
                <Button
                  text={`${themeContext === "dark" ? "🌙" : "☀️"} ${themeContext === "dark" ? "Chế độ sáng" : "Chế độ tối"}`}
                  style={themed($button)}
                  preset="default"
                  onPress={toggleTheme}
                />
                <Button
                  text="Thông tin phiên bản"
                  style={themed($button)}
                  preset="default"
                  onPress={() => setVersionModalVisible(true)}
                />

                <Button
                  text="Đăng xuất"
                  style={themed($logoutButton)}
                  textStyle={themed($textWhiteColor)}
                  preset="default"
                  onPress={handleLogout}
                />
              </View>
            </View>
          </View>
        </View>
        {/* Logout Confirmation Modal */}
        <Modal visible={logoutModalVisible} transparent animationType="fade">
          <View style={themed($modalOverlay)}>
            <View style={themed($modalContent)}>
              <Text style={themed($modalTitle)}>Đăng xuất</Text>
              <Text style={themed($modalMessage)}>Bạn có chắc chắn muốn đăng xuất?</Text>
              <View style={themed($modalActions)}>
                <TouchableOpacity style={themed($modalButtonSecondary)} onPress={() => setLogoutModalVisible(false)}>
                  <Text style={themed($modalButtonTextSecondary)}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={themed($modalButtonPrimary)}
                  onPress={() => {
                    setLogoutModalVisible(false)
                    authenticationStore.logout()
                  }}
                >
                  <Text style={$modalButtonTextPrimary as any}>Đăng xuất</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Version Info Modal */}
        <Modal visible={versionModalVisible} transparent animationType="fade">
          <View style={themed($modalOverlay)}>
            <View style={themed($modalContent)}>
              <Text style={themed($modalTitle)}>Thông tin phiên bản</Text>
              <Text style={themed($modalMessage)}>VTMS Mobile v1.0.0</Text>
              <View style={themed($modalActions)}>
                <TouchableOpacity style={themed($modalButtonSecondary)} onPress={() => setVersionModalVisible(false)}>
                  <Text style={themed($modalButtonTextSecondary)}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </Screen>
    )
  },
)

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexGrow: 1,
  backgroundColor: colors.background,
})

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xl,
  marginBottom: spacing.xl,
  alignItems: "center",
})

const $title: ThemedStyle<TextStyle> = ({ typography, colors, spacing }) => ({
  fontSize: 28,
  fontWeight: "bold",
  lineHeight: 34,
  marginBottom: spacing.xs,
  color: colors.text,
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.textDim,
})

const $content: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
})

const $infoCard: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.neutral100,
  padding: spacing.lg,
  borderRadius: 12,
  marginBottom: spacing.xl,
  borderWidth: 1,
  borderColor: colors.border,
})

const $infoTitle: ThemedStyle<TextStyle> = ({ typography, colors, spacing }) => ({
  fontSize: 18,
  fontWeight: "600",
  color: colors.text,
  marginBottom: spacing.md,
})

const $infoText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 14,
  color: colors.textDim,
  marginBottom: spacing.xs,
})

const $infoRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.sm,
})

const $infoLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.textDim,
  fontWeight: "500",
})

const $infoValue: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.text,
  fontWeight: "600",
  flex: 1,
  textAlign: "right",
})

const $buttonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.lg,
})

const $sectionContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, spacing, typography }) => ({
  fontSize: 16,
  fontWeight: "600",
  color: colors.text,
  marginBottom: spacing.md,
  marginLeft: spacing.xs,
})

const $button: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $profileButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  marginBottom: spacing.md,
})

const $logoutButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  marginTop: spacing.lg,
  backgroundColor: colors.palette.angry500,
})

const $textWhiteColor: ThemedStyle<TextStyle> = () => ({
  color: "#fff",
})

// Modal styles
const $modalOverlay: ThemedStyle<ViewStyle> = () => ({
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
})

const $modalContent: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  padding: spacing.lg,
  width: "90%",
  maxWidth: 400,
  borderWidth: 1,
  borderColor: colors.border,
})

const $modalTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 20,
  fontWeight: "600",
  color: colors.text,
  marginBottom: 8,
})

const $modalMessage: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.textDim,
  marginBottom: 16,
})

const $modalActions: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  justifyContent: "flex-end",
  gap: 8,
})

const $modalButtonSecondary: ThemedStyle<ViewStyle> = ({ colors }) => ({
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 8,
  backgroundColor: colors.palette.neutral300,
  borderColor: colors.border,
  borderWidth: 0,
})

const $modalButtonTextSecondary: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text,
  fontWeight: "600",
})

const $modalButtonPrimary: ThemedStyle<ViewStyle> = () => ({
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 8,
  backgroundColor: "#d32f2f",
  borderColor: "#d32f2f",
  borderWidth: 0,
})

const $modalButtonTextPrimary: TextStyle = {
  color: "#fff",
  fontWeight: "600",
}

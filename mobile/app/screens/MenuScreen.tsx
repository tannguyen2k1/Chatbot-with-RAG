import { observer } from "mobx-react-lite"
import { FC } from "react"
import { ViewStyle, TextStyle, View, Alert } from "react-native"
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
    const { themed } = useAppTheme()

    const handleLogout = () => {
      Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: () => {
            authenticationStore.logout()
            // Navigation will automatically redirect to Login due to isAuthenticated check
          },
        },
      ])
    }

    const canViewUsers = hasPermission(authenticationStore.currentUser?.permissions, "user", "view")
    const canViewRoles = hasPermission(authenticationStore.currentUser?.permissions, "role", "view")
    const canViewTenants = hasPermission(authenticationStore.currentUser?.permissions, "tenant", "view")
    const canViewAudit = hasPermission(authenticationStore.currentUser?.permissions, "audit_log", "view")

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
                  text="Thông tin phiên bản"
                  style={themed($button)}
                  preset="default"
                  onPress={() => Alert.alert("Phiên bản", "VTMS Mobile v1.0.0")}
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

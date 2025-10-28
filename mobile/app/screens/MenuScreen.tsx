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

    const handleClearCache = () => {
      Alert.alert("Xóa cache", "Bạn có chắc chắn muốn xóa cache?", [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            // TODO: Implement cache clearing
            Alert.alert("Thành công", "Cache đã được xóa")
          },
        },
      ])
    }

    const canViewUsers = hasPermission(authenticationStore.currentUser?.permissions, "user", "view")
    const canViewRoles = hasPermission(authenticationStore.currentUser?.permissions, "role", "view")

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
              {authenticationStore.currentUser?.username || "User"}
            </Text>
          </View>

          <View style={themed($content)}>
            <View style={themed($infoCard)}>
              <Text style={themed($infoTitle)}>Thông tin tài khoản</Text>
              <Text style={themed($infoText)}>
                Username: {authenticationStore.currentUser?.username || "N/A"}
              </Text>
              <Text style={themed($infoText)}>
                Email: {authenticationStore.currentUser?.email || "N/A"}
              </Text>
              <Text style={themed($infoText)}>
                Tenant: {authenticationStore.currentUser?.tenant_id || "N/A"}
              </Text>
              <Text style={themed($infoText)}>
                Roles: {authenticationStore.currentUser?.roles?.join(", ") || "N/A"}
              </Text>
            </View>

            <View style={themed($buttonContainer)}>
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

              <Button
                text="Thông tin phiên bản"
                style={themed($button)}
                preset="default"
                onPress={() => Alert.alert("Phiên bản", "VTMS Mobile v1.0.0")}
              />

              <Button
                text="Đăng xuất"
                style={themed($logoutButton)}
                preset="default"
                onPress={handleLogout}
              />
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

const $buttonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.md,
})

const $button: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $logoutButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  marginTop: spacing.lg,
  backgroundColor: colors.palette.angry500,
})

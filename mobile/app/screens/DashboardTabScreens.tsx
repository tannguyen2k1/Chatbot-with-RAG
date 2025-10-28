import { observer } from "mobx-react-lite"
import { FC } from "react"
import { ViewStyle, TextStyle, View } from "react-native"
import { Screen, Text } from "../components"
import { useStores } from "../models"
import { DashboardTabScreenProps } from "../navigators/DashboardTabNavigator"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"

export const ProfileScreen: FC<DashboardTabScreenProps<"Profile">> = observer(function ProfileScreen(_props) {
  const { authenticationStore } = useStores()
  const { themed } = useAppTheme()

  return (
    <Screen
      preset="auto"
      contentContainerStyle={themed($screenContentContainer)}
      safeAreaEdges={["top", "bottom"]}
    >
      <View style={themed($container)}>
        <View style={themed($header)}>
          <Text style={themed($title)}>Hồ sơ cá nhân</Text>
        </View>

        <View style={themed($content)}>
          <View style={themed($infoCard)}>
            <Text style={themed($infoTitle)}>Thông tin chi tiết</Text>
            <Text style={themed($infoText)}>
              Username: {authenticationStore.currentUser?.username || "N/A"}
            </Text>
            <Text style={themed($infoText)}>
              Email: {authenticationStore.currentUser?.email || "N/A"}
            </Text>
            <Text style={themed($infoText)}>
              Full Name: {authenticationStore.currentUser?.full_name || "N/A"}
            </Text>
            <Text style={themed($infoText)}>
              Phone: {authenticationStore.currentUser?.phone || "N/A"}
            </Text>
            <Text style={themed($infoText)}>
              Tenant ID: {authenticationStore.currentUser?.tenant_id || "N/A"}
            </Text>
            <Text style={themed($infoText)}>
              Roles: {authenticationStore.currentUser?.roles?.join(", ") || "N/A"}
            </Text>
            <Text style={themed($infoText)}>
              Created: {authenticationStore.currentUser?.created_at || "N/A"}
            </Text>
          </View>
        </View>
      </View>
    </Screen>
  )
})

export const SettingsScreen: FC<DashboardTabScreenProps<"Settings">> = observer(function SettingsScreen(_props) {
  const { themed } = useAppTheme()

  return (
    <Screen
      preset="auto"
      contentContainerStyle={themed($screenContentContainer)}
      safeAreaEdges={["top", "bottom"]}
    >
      <View style={themed($container)}>
        <View style={themed($header)}>
          <Text style={themed($title)}>Cài đặt</Text>
        </View>

        <View style={themed($content)}>
          <View style={themed($infoCard)}>
            <Text style={themed($infoTitle)}>Cài đặt hệ thống</Text>
            <Text style={themed($infoText)}>• Thông báo</Text>
            <Text style={themed($infoText)}>• Bảo mật</Text>
            <Text style={themed($infoText)}>• Ngôn ngữ</Text>
            <Text style={themed($infoText)}>• Chủ đề</Text>
            <Text style={themed($infoText)}>• Đồng bộ dữ liệu</Text>
          </View>
        </View>
      </View>
    </Screen>
  )
})

export const ReportsScreen: FC<DashboardTabScreenProps<"Reports">> = observer(function ReportsScreen(_props) {
  const { themed } = useAppTheme()

  return (
    <Screen
      preset="auto"
      contentContainerStyle={themed($screenContentContainer)}
      safeAreaEdges={["top", "bottom"]}
    >
      <View style={themed($container)}>
        <View style={themed($header)}>
          <Text style={themed($title)}>Báo cáo</Text>
        </View>

        <View style={themed($content)}>
          <View style={themed($infoCard)}>
            <Text style={themed($infoTitle)}>Báo cáo hệ thống</Text>
            <Text style={themed($infoText)}>• Báo cáo người dùng</Text>
            <Text style={themed($infoText)}>• Báo cáo hoạt động</Text>
            <Text style={themed($infoText)}>• Báo cáo hiệu suất</Text>
            <Text style={themed($infoText)}>• Báo cáo lỗi</Text>
            <Text style={themed($infoText)}>• Thống kê tổng quan</Text>
          </View>
        </View>
      </View>
    </Screen>
  )
})

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

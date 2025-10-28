import { observer } from "mobx-react-lite"
import { FC } from "react"
import { ViewStyle, TextStyle, View } from "react-native"
import { Screen, Text } from "../components"
import { useStores } from "../models"
import { AppStackScreenProps } from "../navigators"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"

interface DashboardScreenProps extends AppStackScreenProps<"Main"> {}

export const DashboardScreen: FC<DashboardScreenProps> = observer(function DashboardScreen(_props) {
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
          <Text style={themed($title)}>Dashboard</Text>
          <Text style={themed($subtitle)}>
            Chào mừng, {authenticationStore.currentUser?.username || "User"}!
          </Text>
        </View>

        <View style={themed($content)}>
          <View style={themed($infoCard)}>
            <Text style={themed($infoTitle)}>Thông tin người dùng</Text>
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
              Tenant ID: {authenticationStore.currentUser?.tenant_id || "N/A"}
            </Text>
            <Text style={themed($infoText)}>
              Roles: {authenticationStore.currentUser?.roles?.join(", ") || "N/A"}
            </Text>
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
  fontSize: 32,
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

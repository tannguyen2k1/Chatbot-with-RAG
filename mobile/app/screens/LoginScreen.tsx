import { observer } from "mobx-react-lite"
import { ComponentType, FC, useEffect, useMemo, useRef, useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { TextInput, TextStyle, ViewStyle, View, ActivityIndicator, Modal, TouchableOpacity } from "react-native"
import {
  Button,
  PressableIcon,
  Screen,
  Text,
  TextField,
  TextFieldAccessoryProps,
} from "../components"
import { useStores } from "../models"
import { AppStackScreenProps } from "../navigators"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { authApi } from "@/services/api"
import { setApiBaseUrl, getDefaultApiUrl } from "@/services/api/api"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useToast } from "@/components/ToastProvider"

interface LoginScreenProps extends AppStackScreenProps<"Login"> {}

export const LoginScreen: FC<LoginScreenProps> = observer(function LoginScreen(_props) {
  const passwordInputRef = useRef<TextInput>(null)
  const tenantInputRef = useRef<TextInput>(null)

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [tenantCode, setTenantCode] = useState("")
  const [isPasswordHidden, setIsPasswordHidden] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [apiModalVisible, setApiModalVisible] = useState(false)
  const [apiUrl, setApiUrl] = useState("")
  const API_URL_STORAGE_KEY = "app.apiBaseUrl"

  const {
    authenticationStore: {
      setAuthToken,
      setRefreshToken,
      setCurrentUser,
      setPassword: setStorePassword,
      setTenantCode: setStoreTenantCode,
    },
  } = useStores()

  const { themed, theme } = useAppTheme()
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    // Clear any existing data
    return () => {
      setPassword("")
      setTenantCode("")
      setErrorMessage("")
    }
  }, [])

  const getErrorMessage = () => {
    if (errorMessage) return errorMessage
    return ""
  }

  const handleLogin = async () => {
    console.log("=== Login button pressed ===")
    console.log("Username:", username)
    console.log("Password:", password ? "***" : "empty")
    console.log("Tenant:", tenantCode)

    // Validate inputs
    if (!username.trim() || !password.trim() || !tenantCode.trim()) {
      console.log("Validation failed - missing fields")
      setErrorMessage("Vui lòng điền đầy đủ thông tin")
      return
    }

    setIsLoading(true)
    setErrorMessage("")

    console.log("Calling authApi.login...")
    try {
      const response = await authApi.login({
        username: username.trim(),
        password: password.trim(),
        tenant_code: tenantCode.trim(),
      })

      console.log("Response received:", response.kind)

      if (response.kind === "ok") {
        // Success! Save credentials
        setAuthToken(response.data.access_token)
        // Note: refresh_token is stored in HTTP-only cookie by backend
        setCurrentUser(response.data.user)

        // Show success toast
        showSuccess(`Chào mừng ${response.data.user.username}!`)

        // Navigate will happen automatically via isAuthenticated check in AppNavigator
      } else {
        // Handle different error types
        let errorMsg = "Đăng nhập thất bại"
        switch (response.kind) {
          case "unauthorized":
            errorMsg = "Tên đăng nhập hoặc mật khẩu không đúng"
            break
          case "forbidden":
            errorMsg = "Không có quyền truy cập"
            break
          case "cannot-connect":
          case "timeout":
            errorMsg = "Không thể kết nối đến server"
            break
          case "server":
            errorMsg = "Lỗi server, vui lòng thử lại"
            break
        }
        setErrorMessage(errorMsg)
      }
    } catch (error) {
      console.error("Login error:", error)
      setErrorMessage("Đã xảy ra lỗi không mong muốn")
    } finally {
      setIsLoading(false)
    }
  }

  const openApiModal = async () => {
    try {
      const saved = await AsyncStorage.getItem(API_URL_STORAGE_KEY)
      setApiUrl(saved ?? "")
    } catch {}
    setApiModalVisible(true)
  }

  const saveApiUrl = async () => {
    try {
      const trimmed = apiUrl.trim()
      if (trimmed.length > 0) {
        await AsyncStorage.setItem(API_URL_STORAGE_KEY, trimmed)
        setApiBaseUrl(trimmed)
        showSuccess("Đã lưu API URL")
      } else {
        await AsyncStorage.removeItem(API_URL_STORAGE_KEY)
        setApiBaseUrl(getDefaultApiUrl())
        showSuccess("Đã đặt API URL về mặc định")
      }
      setApiModalVisible(false)
    } catch {}
  }

  const testApiUrl = async () => {
    const target = (apiUrl && apiUrl.trim().length > 0 ? apiUrl.trim() : getDefaultApiUrl()).replace(/\/$/, "")
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(target, { method: "GET", signal: controller.signal })
      clearTimeout(timeout)
      if (res.ok) {
        showSuccess("Kết nối API thành công")
      } else {
        showError(`Kết nối thất bại (HTTP ${res.status})`)
      }
    } catch (e) {
      showError("Không thể kết nối đến API URL")
    }
  }

  const PasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
    () =>
      function PasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <PressableIcon
            icon={isPasswordHidden ? "view" : "hidden"}
            color={theme.colors.palette.neutral600}
            containerStyle={props.style}
            size={24}
            onPress={() => setIsPasswordHidden(!isPasswordHidden)}
          />
        )
      },
    [isPasswordHidden, theme.colors.palette.neutral600],
  )

  const error = getErrorMessage()

  return (
    <Screen
      preset="auto"
      contentContainerStyle={themed($screenContentContainer)}
      safeAreaEdges={["top", "bottom"]}
      KeyboardAvoidingViewProps={{ behavior: "padding" }}
    >
      <View style={themed($container)}>
        {/* Header */}
        <View style={themed($header)}>
          <Text style={themed($title)}>VTMS</Text>
          <Text style={themed($subtitle)}>Đăng nhập vào hệ thống</Text>
        </View>

        {/* Login Form */}
        <View style={themed($formContainer)}>
          <TextField
            value={username}
            onChangeText={(text) => {
              setUsername(text)
              setErrorMessage("")
            }}
            containerStyle={themed($textField)}
            autoCapitalize="none"
            autoComplete="username"
            autoCorrect={false}
            keyboardType="default"
            label="Tên đăng nhập"
            placeholder="Nhập tên đăng nhập"
            helper={error && username.length === 0 ? error : undefined}
            status={error && username.length === 0 ? "error" : undefined}
            editable={!isLoading}
            onSubmitEditing={() => passwordInputRef.current?.focus()}
          />

          <TextField
            ref={passwordInputRef}
            value={password}
            onChangeText={(text) => {
              setPassword(text)
              setStorePassword(text)
              setErrorMessage("")
            }}
            containerStyle={themed($textField)}
            autoCapitalize="none"
            autoComplete="password"
            autoCorrect={false}
            secureTextEntry={isPasswordHidden}
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            helper={error && password.length === 0 ? error : undefined}
            status={error && password.length === 0 ? "error" : undefined}
            editable={!isLoading}
            onSubmitEditing={() => tenantInputRef.current?.focus()}
            RightAccessory={PasswordRightAccessory}
          />

          <TextField
            ref={tenantInputRef}
            value={tenantCode}
            onChangeText={(text) => {
              setTenantCode(text)
              setStoreTenantCode(text)
              setErrorMessage("")
            }}
            containerStyle={themed($textField)}
            autoCapitalize="none"
            autoCorrect={false}
            label="Mã Tenant"
            placeholder="Nhập mã tenant (VD: default)"
            helper={error && tenantCode.length === 0 ? error : undefined}
            status={error && tenantCode.length === 0 ? "error" : undefined}
            editable={!isLoading}
            onSubmitEditing={handleLogin}
          />

          {isLoading && (
            <View style={themed($loadingContainer)}>
              <ActivityIndicator size="small" color={theme.colors.palette.primary500} />
              <Text style={themed($loadingText)}>Đang đăng nhập...</Text>
            </View>
          )}

          <Button
            testID="login-button"
            text="Đăng nhập"
            style={themed($loginButton)}
            preset="default"
            onPress={handleLogin}
            onLongPress={openApiModal}
            delayLongPress={5000}
            disabled={isLoading}
          />
        </View>
      </View>
      {/* API URL Modal */}
      <Modal visible={apiModalVisible} transparent animationType="fade">
        <View style={themed($modalOverlay)}>
          <View style={themed($modalContent)}>
            <Text style={themed($modalTitle)}>Cấu hình API URL</Text>
            <TextField
              value={apiUrl}
              onChangeText={setApiUrl}
              containerStyle={themed($textField)}
              autoCapitalize="none"
              autoCorrect={false}
              label="API URL"
              placeholder={getDefaultApiUrl()}
            />
            <View style={themed($modalActions)}>
              <TouchableOpacity style={themed($modalButtonSecondary)} onPress={testApiUrl}>
                <Text style={themed($modalButtonTextSecondary)}>Kiểm tra</Text>
              </TouchableOpacity>
              <TouchableOpacity style={themed($modalButtonSecondary)} onPress={() => setApiModalVisible(false)}>
                <Text style={themed($modalButtonTextSecondary)}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={themed($modalButtonPrimary)} onPress={saveApiUrl}>
                <Text style={$modalButtonTextPrimary as any}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  )
})

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexGrow: 1,
  backgroundColor: colors.background,
})

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.xxl,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingTop: spacing.xxl,
  marginBottom: spacing.xxxl,
  alignItems: "center",
})

const $title: ThemedStyle<TextStyle> = ({ typography, spacing, colors }) => ({
  fontSize: 42,
  fontWeight: "bold",
  marginBottom: spacing.xs,
  color: colors.text,
  lineHeight: 48,
})

const $subtitle: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  fontSize: 16,
  color: colors.textDim,
})

const $formContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingTop: spacing.xl,
})

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $loadingContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: spacing.md,
  gap: spacing.xs,
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.textDim,
})

const $loginButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
})

const $infoText: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  fontSize: 14,
  textAlign: "center",
  marginTop: spacing.xl,
  color: colors.textDim,
})

// Modal styles for API URL config
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
  maxWidth: 420,
  borderWidth: 1,
  borderColor: colors.border,
})

const $modalTitle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 20,
  fontWeight: "700",
  color: colors.text,
  marginBottom: 12,
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
  backgroundColor: "#6200ea",
  borderColor: "#6200ea",
  borderWidth: 0,
})

const $modalButtonTextPrimary: TextStyle = {
  color: "#fff",
  fontWeight: "600",
}

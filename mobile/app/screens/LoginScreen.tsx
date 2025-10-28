import { observer } from "mobx-react-lite"
import { ComponentType, FC, useEffect, useMemo, useRef, useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { TextInput, TextStyle, ViewStyle, Alert, View, ActivityIndicator } from "react-native"
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

  const {
    authenticationStore: { 
      setAuthToken, 
      setCurrentUser,
      setPassword: setStorePassword,
      setTenantCode: setStoreTenantCode,
    },
  } = useStores()

  const { themed, theme } = useAppTheme()

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
    // Validate inputs
    if (!username.trim() || !password.trim() || !tenantCode.trim()) {
      setErrorMessage("Vui lòng điền đầy đủ thông tin")
      return
    }

    setIsLoading(true)
    setErrorMessage("")

    try {
      const response = await authApi.login({
        username: username.trim(),
        password: password.trim(),
        tenant_code: tenantCode.trim(),
      })

      if (response.kind === "ok") {
        // Success! Save credentials
        setAuthToken(response.data.access_token)
        setCurrentUser(response.data.user)
        
        // Show success message
        Alert.alert("Thành công", `Chào mừng ${response.data.user.username}!`, [
          { text: "OK" }
        ])
        
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
            disabled={isLoading}
          />
        </View>
      </View>
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
  lineHeight:48,
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
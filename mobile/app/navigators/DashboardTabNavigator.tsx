import { BottomTabScreenProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { CompositeScreenProps } from "@react-navigation/native"
import { TextStyle, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Icon } from "../components"
import { DashboardScreen } from "../screens/DashboardScreen"
import { DemoScreen } from "../screens/DemoScreen"
import { MenuStackNavigator } from "./MenuStackNavigator"
import type { ThemedStyle } from "@/theme"
import { AppStackParamList, AppStackScreenProps } from "./AppNavigator"
import { useAppTheme } from "@/utils/useAppTheme"
import { useStores } from "../models"
import { hasPermission } from "@/utils/permissions"

export type DashboardTabParamList = {
  Home: undefined
  Demo: undefined
  Menu: undefined
}

export type DashboardTabScreenProps<T extends keyof DashboardTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<DashboardTabParamList, T>,
  AppStackScreenProps<keyof AppStackParamList>
>

const Tab = createBottomTabNavigator<DashboardTabParamList>()

export function DashboardTabNavigator() {
  const { bottom } = useSafeAreaInsets()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const { authenticationStore } = useStores()
  const canViewDemo = hasPermission(
    authenticationStore.currentUser?.permissions,
    "demo",
    "view",
  )

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: themed([$tabBar, { height: bottom + 70 }]),
        tabBarActiveTintColor: colors.palette.primary500,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: themed($tabBarLabel),
        tabBarItemStyle: themed($tabBarItem),
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen as any}
        options={{
          tabBarLabel: "Trang chủ",
          tabBarIcon: ({ focused }) => (
            <Icon icon="components" color={focused ? colors.palette.primary500 : colors.textDim} size={24} />
          ),
        }}
      />

      {canViewDemo && (
        <Tab.Screen
          name="Demo"
          component={DemoScreen as any}
          options={{
            tabBarLabel: "Demo",
            tabBarIcon: ({ focused }) => (
              <Icon icon="community" color={focused ? colors.palette.primary500 : colors.textDim} size={24} />
            ),
          }}
        />
      )}

      <Tab.Screen
        name="Menu"
        component={MenuStackNavigator as any}
        options={{
          tabBarLabel: "Menu",
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <Icon icon="menu" color={focused ? colors.palette.primary500 : colors.textDim} size={24} />
          ),
          // ensure returning to this tab shows Menu home by unmounting stack on blur
        } as any}
        listeners={({ navigation }) => ({
          focus: () => (navigation as any).navigate("Menu", { screen: "MenuHome" }),
        })}
      />
    </Tab.Navigator>
  )
}

const $tabBar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  borderTopColor: colors.border,
  borderTopWidth: 1,
})

const $tabBarItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingTop: spacing.md,
})

const $tabBarLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 12,
  fontFamily: typography.primary.medium,
  lineHeight: 16,
  color: colors.text,
})

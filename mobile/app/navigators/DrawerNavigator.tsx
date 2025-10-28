import { DrawerContentScrollView, DrawerItemList, createDrawerNavigator } from "@react-navigation/drawer"
import { observer } from "mobx-react-lite"
import React from "react"
import { ViewStyle, TextStyle, View, Text } from "react-native"
import { useStores } from "../models"
import { DashboardTabNavigator } from "./DashboardTabNavigator"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"

export type DrawerParamList = {
  Dashboard: undefined
}

const Drawer = createDrawerNavigator<DrawerParamList>()

// Custom Drawer Content
const CustomDrawerContent = observer(function CustomDrawerContent(props: any) {
  const { authenticationStore } = useStores()
  const { themed, theme } = useAppTheme()

  return (
    <View style={themed($drawerContainer)}>
      <View style={themed($drawerHeader)}>
        <Text style={themed($drawerTitle)}>VTMS</Text>
        <Text style={themed($drawerSubtitle)}>
          {authenticationStore.currentUser?.username || "User"}
        </Text>
        <Text style={themed($drawerEmail)}>
          {authenticationStore.currentUser?.email || ""}
        </Text>
      </View>
      
      <DrawerContentScrollView {...props} contentContainerStyle={themed($drawerContent)}>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
    </View>
  )
})

export function DrawerNavigator() {
  const { themed, theme } = useAppTheme()

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        drawerStyle: themed($drawerStyle),
        drawerActiveTintColor: theme.colors.palette.primary500,
        drawerInactiveTintColor: theme.colors.textDim,
        drawerLabelStyle: themed($drawerLabel),
        headerStyle: themed($headerStyle),
        headerTintColor: theme.colors.text,
        headerTitleStyle: themed($headerTitle),
      }}
    >
      <Drawer.Screen 
        name="Dashboard" 
        component={DashboardTabNavigator as any}
        options={{
          title: "Dashboard",
          drawerLabel: "Trang chủ",
        }}
      />
    </Drawer.Navigator>
  )
}

const $drawerContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
})

const $drawerHeader: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary500,
  padding: spacing.lg,
  paddingTop: spacing.xxxl,
})

const $drawerTitle: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontSize: 24,
  fontWeight: "bold",
  color: colors.palette.neutral100,
  marginBottom: spacing.xs,
})

const $drawerSubtitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  fontSize: 16,
  color: colors.palette.neutral100,
  marginBottom: spacing.xs,
})

const $drawerEmail: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 14,
  color: colors.palette.neutral200,
})

const $drawerContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingTop: spacing.lg,
})

const $drawerStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  width: 280,
})

const $drawerLabel: ThemedStyle<TextStyle> = ({ typography }) => ({
  fontSize: 16,
  fontFamily: typography.primary.medium,
})

const $headerStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  borderBottomColor: colors.border,
})

const $headerTitle: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 18,
  fontFamily: typography.primary.semiBold,
  color: colors.text,
})

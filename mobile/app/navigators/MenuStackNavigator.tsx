import React from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { MenuScreen } from "../screens/MenuScreen"
import { UsersScreen } from "../screens/UsersScreen"
import { RolesScreen } from "../screens/RolesScreen"
import { TenantsScreen } from "../screens/TenantsScreen"
import { RolePermissionsScreen } from "../screens/RolePermissionsScreen"

export type MenuStackParamList = {
  MenuHome: undefined
  Users: undefined
  Roles: undefined
  RolePermissions: { roleId: number; roleName?: string }
  Tenants: undefined
}

const Stack = createNativeStackNavigator<MenuStackParamList>()

export function MenuStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MenuHome" component={MenuScreen as any} />
      <Stack.Screen name="Users" component={UsersScreen as any} />
      <Stack.Screen name="Roles" component={RolesScreen as any} />
      <Stack.Screen name="RolePermissions" component={RolePermissionsScreen as any} />
      <Stack.Screen name="Tenants" component={TenantsScreen as any} />
    </Stack.Navigator>
  )
}



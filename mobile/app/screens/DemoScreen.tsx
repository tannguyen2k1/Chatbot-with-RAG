import { FC } from "react"
import { View, Text, StyleSheet } from "react-native"
import { Screen } from "../components"
import { AppStackScreenProps } from "../navigators"

interface DemoScreenProps extends AppStackScreenProps<"Main"> {}

export const DemoScreen: FC<DemoScreenProps> = function DemoScreen() {
  return (
    <Screen preset="auto" safeAreaEdges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Demo Management</Text>
          <Text style={styles.subtitle}>Danh sách các demo</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.infoText}>Tính năng đang được phát triển...</Text>
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 30,
    marginBottom: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  content: {
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    opacity: 0.7,
  },
})

import { View, Text, StyleSheet } from "react-native";

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🌱 Eco Drop</Text>
      <Text style={styles.subtitle}>Smart Waste Management</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6FFF8",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    fontSize: 34,
    fontWeight: "800",
    color: "#1B7F3A",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#4B6352",
  },
});
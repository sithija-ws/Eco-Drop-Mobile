import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { colors, radius, spacing } from "../../constants/theme";

export default function LogoutButton() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await logout();
              router.replace("/auth/login");
            } catch (error) {
              Alert.alert("Logout failed", "Please try again.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        loading && styles.disabled,
      ]}
      onPress={handleLogout}
      disabled={loading}
    >
      <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
      <Text style={styles.text}>{loading ? "Logging out..." : "Logout"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.6,
  },
});
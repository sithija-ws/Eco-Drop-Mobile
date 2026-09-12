import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../context/AuthContext";
import { SignupProvider } from "../context/SignupContext";
import { NotificationProvider } from "../context/NotificationContext";
import { colors } from "../constants/theme";

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <SignupProvider>
          <StatusBar style="dark" />

          <Stack
            screenOptions={{
              headerShown: false,
              animation: "fade",
              contentStyle: {
                backgroundColor: colors.background,
              },
            }}
          />
        </SignupProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
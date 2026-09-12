import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "./AuthContext";
import {
  clearAllNotifications,
  deleteNotification as deleteNotificationService,
  listenUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";
import type { EcoNotification } from "../types/firestore";
import { colors, radius, softShadow, spacing } from "../constants/theme";

type NotificationContextValue = {
  notifications: EcoNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<EcoNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // In-app toast state
  const [activeToast, setActiveToast] = useState<EcoNotification | null>(null);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const previousIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (!profile?.uid) {
      setNotifications([]);
      setLoading(false);
      previousIdsRef.current.clear();
      initialLoadRef.current = true;
      return;
    }

    setLoading(true);

    const unsubscribe = listenUserNotifications(
      profile.uid,
      (newNotifications) => {
        setNotifications(newNotifications);
        setLoading(false);

        // Check for new notifications to show toast
        const currentIds = new Set(newNotifications.map((n) => n.id));

        if (!initialLoadRef.current) {
          const newest = newNotifications.find(
            (n) => !previousIdsRef.current.has(n.id) && !n.read
          );
          if (newest) {
            triggerToast(newest);
          }
        } else {
          initialLoadRef.current = false;
        }

        previousIdsRef.current = currentIds;
      },
      () => setLoading(false)
    );

    return unsubscribe;
  }, [profile?.uid]);

  const triggerToast = (item: EcoNotification) => {
    setActiveToast(item);
    translateY.setValue(-100);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 50,
        useNativeDriver: true,
        bounciness: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      dismissToast();
    }, 4000);
  };

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveToast(null);
    });
  };

  const handleToastPress = () => {
    if (!activeToast) return;
    const toastData = activeToast;
    dismissToast();
    markAsRead(toastData.id);
    router.push("/notifications");
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await markNotificationAsRead(id);
  };

  const markAllAsRead = async () => {
    if (!profile?.uid) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await markAllNotificationsAsRead(profile.uid);
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await deleteNotificationService(id);
  };

  const clearAll = async () => {
    if (!profile?.uid) return;
    setNotifications([]);
    await clearAllNotifications(profile.uid);
  };

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
    }),
    [notifications, unreadCount, loading]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}

      {/* Floating In-App Banner Toast Alert */}
      {activeToast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              transform: [{ translateY }],
              opacity,
            },
          ]}
        >
          <Pressable style={styles.toastCard} onPress={handleToastPress}>
            <View style={styles.toastIconWrap}>
              <Ionicons
                name="notifications"
                size={20}
                color={colors.primaryDeep}
              />
            </View>
            <View style={styles.toastContent}>
              <Text style={styles.toastTitle} numberOfLines={1}>
                {activeToast.title}
              </Text>
              <Text style={styles.toastMessage} numberOfLines={2}>
                {activeToast.message}
              </Text>
            </View>
            <Pressable
              hitSlop={8}
              onPress={dismissToast}
              style={styles.toastCloseBtn}
            >
              <Ionicons name="close" size={18} color={colors.textSoft} />
            </Pressable>
          </Pressable>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const value = useContext(NotificationContext);
  if (!value) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }
  return value;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 0,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
  },
  toastCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    ...softShadow,
    shadowColor: "#059669",
    shadowOpacity: 0.15,
  },
  toastIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  toastContent: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  toastMessage: {
    fontSize: 12,
    color: colors.textSoft,
    marginTop: 2,
  },
  toastCloseBtn: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
});

import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, gradients, radius, spacing } from "../../constants/theme";

const { width, height } = Dimensions.get("window");

interface AnimatedSplashScreenProps {
  onAnimationComplete?: () => void;
  statusText?: string;
  autoComplete?: boolean;
}

export default function AnimatedSplashScreen({
  onAnimationComplete,
  statusText = "Initializing Eco-Drop Platform...",
  autoComplete = false,
}: AnimatedSplashScreenProps) {
  // Animation Values
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  const rippleScale1 = useRef(new Animated.Value(1)).current;
  const rippleOpacity1 = useRef(new Animated.Value(0.8)).current;

  const rippleScale2 = useRef(new Animated.Value(1)).current;
  const rippleOpacity2 = useRef(new Animated.Value(0.6)).current;

  const titleTranslateY = useRef(new Animated.Value(25)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  const progressWidth = useRef(new Animated.Value(0)).current;
  const [percentDisplay, setPercentDisplay] = useState(0);

  useEffect(() => {
    // 1. Looping Ripple Animations
    Animated.loop(
      Animated.parallel([
        Animated.timing(rippleScale1, {
          toValue: 2.2,
          duration: 2200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rippleOpacity1, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    setTimeout(() => {
      Animated.loop(
        Animated.parallel([
          Animated.timing(rippleScale2, {
            toValue: 2.5,
            duration: 2400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacity2, {
            toValue: 0,
            duration: 2400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 800);

    // 2. Entrance Sequence: Logo Bouncing & Title Fading Up
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),

      Animated.parallel([
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 3. Progress Bar Fill Animation
    const listenerId = progressWidth.addListener(({ value }) => {
      setPercentDisplay(Math.round(value));
    });

    Animated.timing(progressWidth, {
      toValue: 100,
      duration: 2200,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start(() => {
      if (autoComplete && onAnimationComplete) {
        onAnimationComplete();
      }
    });

    return () => {
      progressWidth.removeListener(listenerId);
    };
  }, []);

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-15deg", "0deg"],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.splash as [string, string, string]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
      />

      {/* Center Animated Logo & Ripples */}
      <View style={styles.centerSection}>
        {/* Animated Ripple Circles */}
        <Animated.View
          style={[
            styles.rippleCircle,
            {
              transform: [{ scale: rippleScale1 }],
              opacity: rippleOpacity1,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.rippleCircle,
            {
              transform: [{ scale: rippleScale2 }],
              opacity: rippleOpacity2,
            },
          ]}
        />

        {/* Floating Glowing Eco Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }, { rotate: spin }],
              opacity: logoOpacity,
            },
          ]}
        >
          <View style={styles.logoBadgeInner}>
            <MaterialCommunityIcons name="leaf" size={54} color="#28D46A" />
            <MaterialCommunityIcons
              name="recycle"
              size={24}
              color="#B8F55F"
              style={styles.subIconBadge}
            />
          </View>
        </Animated.View>

        {/* Title & Tagline Reveal */}
        <Animated.View
          style={[
            styles.textSection,
            {
              transform: [{ translateY: titleTranslateY }],
              opacity: titleOpacity,
            },
          ]}
        >
          <View style={styles.brandBadgeRow}>
            <Text style={styles.brandBadgeText}>SMART RECYCLING</Text>
          </View>

          <Text style={styles.title}>ECO-DROP</Text>
          <Text style={styles.subtitle}>
            Empowering Green Waste Management
          </Text>
        </Animated.View>
      </View>

      {/* Bottom Animated Loading Progress Bar */}
      <View style={styles.bottomSection}>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>{statusText}</Text>
          <Text style={styles.percentText}>{percentDisplay}%</Text>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#092617",
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  rippleCircle: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: "rgba(40, 212, 106, 0.4)",
    backgroundColor: "rgba(40, 212, 106, 0.05)",
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(11, 42, 22, 0.9)",
    borderWidth: 3,
    borderColor: "#28D46A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#28D46A",
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  logoBadgeInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  subIconBadge: {
    position: "absolute",
    bottom: -6,
    right: -10,
  },
  textSection: {
    alignItems: "center",
    marginTop: spacing.xl,
  },
  brandBadgeRow: {
    backgroundColor: "rgba(184, 245, 95, 0.15)",
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(184, 245, 95, 0.3)",
    marginBottom: spacing.xs,
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#B8F55F",
    letterSpacing: 2,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 4,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#A2C4B1",
    marginTop: spacing.xs,
    letterSpacing: 0.5,
  },
  bottomSection: {
    width: "85%",
    marginBottom: 50,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#A2C4B1",
  },
  percentText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#28D46A",
  },
  progressTrack: {
    height: 6,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#28D46A",
    borderRadius: radius.pill,
  },
});

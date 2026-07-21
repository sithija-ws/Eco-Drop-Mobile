import React from "react";
import AnimatedSplashScreen from "../components/common/AnimatedSplashScreen";
import { router } from "expo-router";

export default function SplashScreen() {
  return (
    <AnimatedSplashScreen
      statusText="Welcome to Eco-Drop Platform"
      autoComplete
      onAnimationComplete={() => router.replace("/" as never)}
    />
  );
}
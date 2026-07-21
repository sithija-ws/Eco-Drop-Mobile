import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { getHomeRouteForRole } from "../utils/roleRoutes";
import AnimatedSplashScreen from "../components/common/AnimatedSplashScreen";

export default function Index() {
  const { firebaseUser, profile, loading } = useAuth();

  if (loading) {
    return (
      <AnimatedSplashScreen
        statusText="Initializing Eco-Drop Platform..."
      />
    );
  }

  if (!firebaseUser) {
    return <Redirect href="/auth/login" />;
  }

  return <Redirect href={getHomeRouteForRole(profile?.role)} />;
}
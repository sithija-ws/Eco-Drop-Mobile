import { Redirect } from "expo-router";

export default function CollectorHomeRedirect() {
  return <Redirect href="/collector/(tabs)/dashboard" />;
}

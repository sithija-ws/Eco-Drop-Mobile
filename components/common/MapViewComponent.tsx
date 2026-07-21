import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, softShadow, spacing } from "../../constants/theme";

// Safely require react-native-maps to avoid crashes on unsupported web platforms
let NativeMapView: any = null;
let NativeMarker: any = null;
let NativePolyline: any = null;

try {
  const Maps = require("react-native-maps");
  NativeMapView = Maps.default || Maps;
  NativeMarker = Maps.Marker;
  NativePolyline = Maps.Polyline;
} catch (e) {
  // react-native-maps not loaded or on unsupported web environment
}

export interface MapMarkerItem {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  pinColor?: string;
  icon?: string;
  badge?: string;
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

interface MapViewComponentProps {
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  markers?: MapMarkerItem[];
  polyline?: LatLng[];
  interactive?: boolean;
  onPressMap?: (coordinate: LatLng) => void;
  onSelectMarker?: (marker: MapMarkerItem) => void;
  height?: number | string;
  showUserLocation?: boolean;
  style?: any;
}

const DEFAULT_REGION = {
  latitude: 6.9271, // Colombo default coordinates
  longitude: 79.8612,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapViewComponent({
  initialRegion = DEFAULT_REGION,
  markers = [],
  polyline,
  interactive = true,
  onPressMap,
  onSelectMarker,
  height = 240,
  showUserLocation = true,
  style,
}: MapViewComponentProps) {
  const [currentRegion, setCurrentRegion] = useState(initialRegion);

  const isNativeMapSupported =
    Platform.OS !== "web" && NativeMapView !== null;

  const handleMapPress = (e: any) => {
    if (onPressMap && e.nativeEvent && e.nativeEvent.coordinate) {
      onPressMap(e.nativeEvent.coordinate);
    }
  };

  if (!isNativeMapSupported) {
    // Elegant fallback view for Web / Fallback environments
    return (
      <View
        style={[
          styles.fallbackContainer,
          { height: height as any },
          style,
        ]}
      >
        <View style={styles.gridOverlay}>
          <MaterialCommunityIcons
            name="map-marker-radius-outline"
            size={44}
            color={colors.primary}
          />
          <Text style={styles.fallbackTitle}>Eco-Drop Live Map</Text>
          <Text style={styles.fallbackSubtitle}>
            Lat: {currentRegion.latitude.toFixed(4)}, Lng:{" "}
            {currentRegion.longitude.toFixed(4)}
          </Text>
          {markers.length > 0 && (
            <View style={styles.markerBadgeContainer}>
              <Ionicons name="location" size={14} color={colors.primaryDark} />
              <Text style={styles.markerBadgeText}>
                {markers.length} Active Marker{markers.length > 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>
        {interactive && (
          <TouchableOpacity
            style={styles.fallbackTapArea}
            onPress={() =>
              onPressMap &&
              onPressMap({
                latitude: currentRegion.latitude,
                longitude: currentRegion.longitude,
              })
            }
          >
            <Text style={styles.tapAreaText}>Tap to set location</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: height as any }, style]}>
      <NativeMapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        pitchEnabled={interactive}
        rotateEnabled={interactive}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={interactive}
        onPress={handleMapPress}
        onRegionChangeComplete={(r: any) => setCurrentRegion(r)}
      >
        {markers.map((m) => (
          <NativeMarker
            key={m.id}
            coordinate={{ latitude: m.latitude, longitude: m.longitude }}
            title={m.title}
            description={m.description}
            pinColor={m.pinColor || colors.primary}
            onPress={() => onSelectMarker && onSelectMarker(m)}
          />
        ))}

        {polyline && polyline.length > 1 && (
          <NativePolyline
            coordinates={polyline}
            strokeColor={colors.primary}
            strokeWidth={4}
          />
        )}
      </NativeMapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: radius.lg,
    overflow: "hidden",
    ...softShadow,
  },
  fallbackContainer: {
    width: "100%",
    backgroundColor: "#E8F5E9",
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#C8E6C9",
    padding: spacing.md,
    ...softShadow,
  },
  gridOverlay: {
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primaryDark || "#1B5E20",
    marginTop: spacing.xs,
  },
  fallbackSubtitle: {
    fontSize: 12,
    color: colors.textSoft || "#666",
    marginTop: 2,
  },
  markerBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
    elevation: 2,
  },
  markerBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    marginLeft: 4,
  },
  fallbackTapArea: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  tapAreaText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 13,
  },
});

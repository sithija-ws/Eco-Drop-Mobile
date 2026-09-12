import React, { useEffect, useRef, useState } from "react";
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
let NativeUrlTile: any = null;

try {
  const Maps = require("react-native-maps");
  NativeMapView = Maps.default || Maps;
  NativeMarker = Maps.Marker;
  NativePolyline = Maps.Polyline;
  NativeUrlTile = Maps.UrlTile;
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
  heading?: number;
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
  polylineColor?: string;
  autoFit?: boolean;
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
  polylineColor = colors.primary,
  autoFit = true,
  interactive = true,
  onPressMap,
  onSelectMarker,
  height = 240,
  showUserLocation = true,
  style,
}: MapViewComponentProps) {
  const mapRef = useRef<any>(null);
  const [currentRegion, setCurrentRegion] = useState(initialRegion);

  const isNativeMapSupported =
    Platform.OS !== "web" && NativeMapView !== null;

  // Auto-fit bounds when markers or polyline change (Native)
  useEffect(() => {
    if (!isNativeMapSupported || !autoFit || !mapRef.current) return;

    const allCoords: LatLng[] = [
      ...markers.map((m) => ({ latitude: m.latitude, longitude: m.longitude })),
      ...(polyline || []),
    ];

    if (allCoords.length >= 2 && mapRef.current.fitToCoordinates) {
      mapRef.current.fitToCoordinates(allCoords, {
        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
        animated: true,
      });
    }
  }, [markers, polyline, autoFit, isNativeMapSupported]);

  const handleMapPress = (e: any) => {
    if (onPressMap && e.nativeEvent && e.nativeEvent.coordinate) {
      onPressMap(e.nativeEvent.coordinate);
    }
  };

  if (!isNativeMapSupported) {
    const mapCenterLat =
      markers.length > 0 ? markers[0].latitude : currentRegion.latitude;
    const mapCenterLng =
      markers.length > 0 ? markers[0].longitude : currentRegion.longitude;

    const markersJs = markers
      .map(
        (m) =>
          `L.marker([${m.latitude}, ${m.longitude}]).addTo(map).bindPopup("<b>${
            m.title || "Location"
          }</b><br>${m.description || ""}");`
      )
      .join("\n");

    const polylineJs =
      polyline && polyline.length > 1
        ? `L.polyline(${JSON.stringify(
            polyline.map((p) => [p.latitude, p.longitude])
          )}, { color: '${polylineColor}', weight: 5 }).addTo(map);`
        : "";

    const allCoords = [
      ...markers.map((m) => [m.latitude, m.longitude]),
      ...(polyline || []).map((p) => [p.latitude, p.longitude]),
    ];

    const fitBoundsJs =
      allCoords.length >= 2
        ? `map.fitBounds(${JSON.stringify(allCoords)}, { padding: [30, 30] });`
        : "";

    const leafletHtml = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body { margin:0; padding:0; height:100%; width:100%; overflow:hidden; background:#F6FFF8; }
    #map { width:100%; height:100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${mapCenterLat}, ${mapCenterLng}], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '© CARTO, © OpenStreetMap'
    }).addTo(map);
    ${markersJs}
    ${polylineJs}
    ${fitBoundsJs}
  </script>
</body>
</html>`;

    if (Platform.OS === "web") {
      return (
        <View style={[styles.container, { height: height as any }, style]}>
          <iframe
            srcDoc={leafletHtml}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              borderRadius: radius.lg,
            }}
            title="Eco-Drop Live Map"
          />
        </View>
      );
    }

    // Mobile fallback if react-native-maps is disabled
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
            name="navigation-variant-outline"
            size={40}
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

          {polyline && polyline.length > 1 && (
            <View style={styles.routeBadgeContainer}>
              <MaterialCommunityIcons name="routes" size={14} color={colors.primary} />
              <Text style={styles.routeBadgeText}>Live Route Navigation Active</Text>
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
        ref={mapRef}
        style={StyleSheet.absoluteFill}
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
        {/* CARTO Voyager Tile Layer - 100% open, fast, zero HTTP 403 access blocks */}
        {NativeUrlTile && (
          <NativeUrlTile
            urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
            maximumZ={19}
            tileSize={256}
          />
        )}

        {markers.map((m) => (
          <NativeMarker
            key={m.id}
            coordinate={{ latitude: m.latitude, longitude: m.longitude }}
            title={m.title}
            description={m.description}
            pinColor={m.pinColor || colors.primary}
            rotation={m.heading || 0}
            onPress={() => onSelectMarker && onSelectMarker(m)}
          />
        ))}

        {polyline && polyline.length > 1 && (
          <NativePolyline
            coordinates={polyline}
            strokeColor={polylineColor}
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
  routeBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "1A",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
  routeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primaryDark || "#1B5E20",
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

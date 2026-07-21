import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, softShadow, spacing } from "../../constants/theme";
import MapViewComponent, { LatLng } from "../common/MapViewComponent";

export interface SelectedLocation {
  address: string;
  latitude: number;
  longitude: number;
}

interface LocationInputProps {
  value: string;
  onLocationChange: (location: SelectedLocation) => void;
  placeholder?: string;
}

export default function LocationInput({
  value,
  onLocationChange,
  placeholder = "Enter pickup address",
}: LocationInputProps) {
  const [loadingGps, setLoadingGps] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<LatLng>({
    latitude: 6.9271,
    longitude: 79.8612,
  });

  // Get current device GPS location
  const handleGetCurrentLocation = async () => {
    try {
      setLoadingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to detect your current position."
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      setSelectedCoords({ latitude, longitude });

      // Reverse geocode to address
      const geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      let formattedAddress = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

      if (geocode && geocode.length > 0) {
        const item = geocode[0];
        const parts = [
          item.name || item.street,
          item.district || item.subregion || item.city,
          item.region || item.country,
        ].filter(Boolean);

        if (parts.length > 0) {
          formattedAddress = parts.join(", ");
        }
      }

      onLocationChange({
        address: formattedAddress,
        latitude,
        longitude,
      });
    } catch (error: any) {
      Alert.alert(
        "Location Error",
        "Unable to fetch location. Please enter address manually."
      );
    } finally {
      setLoadingGps(false);
    }
  };

  const handleMapTap = async (coords: LatLng) => {
    setSelectedCoords(coords);
    try {
      const geocode = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      let addressText = `Lat ${coords.latitude.toFixed(4)}, Lng ${coords.longitude.toFixed(4)}`;
      if (geocode && geocode.length > 0) {
        const item = geocode[0];
        const parts = [
          item.name || item.street,
          item.district || item.city,
          item.country,
        ].filter(Boolean);
        if (parts.length > 0) {
          addressText = parts.join(", ");
        }
      }

      onLocationChange({
        address: addressText,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    } catch (e) {
      onLocationChange({
        address: `Lat ${coords.latitude.toFixed(4)}, Lng ${coords.longitude.toFixed(4)}`,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Ionicons
          name="location-sharp"
          size={20}
          color={colors.primary}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={(text) =>
            onLocationChange({
              address: text,
              latitude: selectedCoords.latitude,
              longitude: selectedCoords.longitude,
            })
          }
          placeholder={placeholder}
          placeholderTextColor="#999"
        />
        {loadingGps ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.actionBtn}
          />
        ) : (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleGetCurrentLocation}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.mapTriggerBtn}
        onPress={() => setShowMapModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="map-outline" size={16} color={colors.primary} />
        <Text style={styles.mapTriggerText}>Select / Pin on Map</Text>
      </TouchableOpacity>

      {/* Map Selector Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pin Pickup Location</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowMapModal(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalMapWrapper}>
            <MapViewComponent
              height="100%"
              initialRegion={{
                latitude: selectedCoords.latitude,
                longitude: selectedCoords.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              markers={[
                {
                  id: "selected-pin",
                  latitude: selectedCoords.latitude,
                  longitude: selectedCoords.longitude,
                  title: "Pickup Location",
                  pinColor: colors.primary,
                },
              ]}
              onPressMap={handleMapTap}
            />
          </View>

          <View style={styles.modalFooter}>
            <Text style={styles.selectedAddressLabel}>Selected Address:</Text>
            <Text style={styles.selectedAddressValue} numberOfLines={2}>
              {value || "Tap anywhere on map to drop pin"}
            </Text>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => setShowMapModal(false)}
            >
              <Text style={styles.confirmBtnText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#E1E8ED",
    paddingHorizontal: spacing.sm,
    height: 50,
  },
  inputIcon: {
    marginRight: spacing.xs,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
  actionBtn: {
    padding: spacing.xs,
  },
  mapTriggerBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    alignSelf: "flex-start",
  },
  mapTriggerText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: 50,
    paddingBottom: spacing.md,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  modalMapWrapper: {
    flex: 1,
  },
  modalFooter: {
    padding: spacing.md,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    ...softShadow,
  },
  selectedAddressLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  selectedAddressValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
});

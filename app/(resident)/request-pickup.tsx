import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import {
  calculateEcoDropsForCategory,
  calculateEstimatedPickupPrice,
  createPickupRequest,
} from "../../services/pickupService";
import type { WasteCategory } from "../../types/firestore";
import { colors, radius, softShadow, spacing } from "../../constants/theme";
import LocationInput, {
  SelectedLocation,
} from "../../components/resident/LocationInput";

type MaterialIconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

type CategoryOption = {
  id: WasteCategory;
  title: string;
  subtitle: string;
  icon: MaterialIconName;
};

const categories: CategoryOption[] = [
  {
    id: "plastic",
    title: "Plastic",
    subtitle: "Bottles, bags, containers",
    icon: "recycle",
  },
  {
    id: "organic",
    title: "Organic",
    subtitle: "Food and garden waste",
    icon: "food-apple-outline",
  },
  {
    id: "paper",
    title: "Paper",
    subtitle: "Cardboard, books, papers",
    icon: "file-document-outline",
  },
  {
    id: "glass",
    title: "Glass",
    subtitle: "Bottles and jars",
    icon: "bottle-wine-outline",
  },
  {
    id: "electronic",
    title: "E-Waste",
    subtitle: "Devices and batteries",
    icon: "laptop",
  },
  {
    id: "mixed",
    title: "Mixed",
    subtitle: "General sorted waste",
    icon: "trash-can-outline",
  },
];

export default function RequestPickupScreen() {
  const { profile } = useAuth();

  const [selectedCategory, setSelectedCategory] =
    useState<WasteCategory | null>(null);

  const [wasteDetails, setWasteDetails] = useState("");
  const [locationState, setLocationState] = useState<SelectedLocation>({
    address: "",
    latitude: 6.9271,
    longitude: 79.8612,
  });
  const [preferredDateText, setPreferredDateText] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const estimate = useMemo(() => {
    if (!selectedCategory) {
      return {
        price: 0,
        drops: 0,
      };
    }

    return {
      price: calculateEstimatedPickupPrice(selectedCategory),
      drops: calculateEcoDropsForCategory(selectedCategory),
    };
  }, [selectedCategory]);

  const handlePickImage = async () => {
    if (imageUris.length >= 3) {
      Alert.alert(
        "Image limit reached",
        "You can upload up to 3 images per request."
      );
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to upload waste images."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUris((current) => [...current, result.assets[0].uri].slice(0, 3));
    }
  };

  const handleTakePhoto = async () => {
    if (imageUris.length >= 3) {
      Alert.alert(
        "Image limit reached",
        "You can upload up to 3 images per request."
      );
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow camera access to take waste photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUris((current) => [...current, result.assets[0].uri].slice(0, 3));
    }
  };

  const removeImage = (uri: string) => {
    setImageUris((current) => current.filter((item) => item !== uri));
  };

  const handleSubmit = async () => {
    if (!profile) {
      Alert.alert(
        "Login required",
        "Please login again to create a pickup request."
      );
      return;
    }

    if (profile.role !== "resident") {
      Alert.alert(
        "Not allowed",
        "Only resident accounts can request waste pickup."
      );
      return;
    }

    if (!selectedCategory) {
      Alert.alert("Select category", "Please select a waste category.");
      return;
    }

    if (!wasteDetails.trim()) {
      Alert.alert("Waste details required", "Please describe your waste items.");
      return;
    }

    if (!locationState.address.trim()) {
      Alert.alert("Address required", "Please enter or pin the pickup address.");
      return;
    }

    try {
      setSubmitting(true);

      await createPickupRequest({
        resident: profile,
        wasteCategory: selectedCategory,
        wasteDetails,
        address: locationState.address,
        latitude: locationState.latitude,
        longitude: locationState.longitude,
        preferredDateText,
        notes,
        imageUris,
      });

      Alert.alert(
        "Request submitted",
        "Nearby collectors can now see your pickup request.",
        [
          {
            text: "Go to Dashboard",
            onPress: () =>
              router.replace("/(resident)/(tabs)/dashboard" as never),
          },
        ]
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Please try again.";

      Alert.alert("Could not submit request", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>

            <View style={styles.headerTextBlock}>
              <Text style={styles.headerTitle}>Request Pickup</Text>
              <Text style={styles.headerSubtitle}>
                Create a real Firebase pickup request
              </Text>
            </View>

            <View style={styles.headerPlaceholder} />
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoIconWrap}>
              <MaterialCommunityIcons
                name="truck-plus-outline"
                size={28}
                color={colors.primaryDeep}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Doorstep Waste Collection</Text>
              <Text style={styles.infoText}>
                Submit sorted waste details. Collectors in your GN area will
                receive it live.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Waste Category</Text>

          <View style={styles.categoryGrid}>
            {categories.map((category) => {
              const selected = selectedCategory === category.id;

              return (
                <Pressable
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    selected && styles.categoryCardSelected,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <View
                    style={[
                      styles.categoryIconWrap,
                      selected && styles.categoryIconSelected,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={category.icon}
                      size={24}
                      color={selected ? "#FFFFFF" : colors.primaryDark}
                    />
                  </View>

                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categorySubtitle}>
                    {category.subtitle}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.formCard}>
            <LabeledInput
              label="Waste Details"
              placeholder="Example: Two bags of sorted plastic bottles"
              value={wasteDetails}
              onChangeText={setWasteDetails}
              multiline
            />

            <View style={{ marginBottom: spacing.sm }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 4 }}>
                Pickup Location & Address
              </Text>
              <LocationInput
                value={locationState.address}
                onLocationChange={(newLoc) => setLocationState(newLoc)}
                placeholder="Enter address or pin on map..."
              />
            </View>

            <LabeledInput
              label="Preferred Date / Time"
              placeholder="Example: Tomorrow 9:00 AM - 11:00 AM"
              value={preferredDateText}
              onChangeText={setPreferredDateText}
            />

            <LabeledInput
              label="Additional Notes"
              placeholder="Gate code, special instructions, etc."
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          <View style={styles.imageCard}>
            <View style={styles.imageHeaderRow}>
              <View>
                <Text style={styles.imageTitle}>Waste Photos</Text>
                <Text style={styles.imageSubtitle}>
                  Optional, up to 3 images
                </Text>
              </View>

              <Text style={styles.imageCount}>{imageUris.length}/3</Text>
            </View>

            {imageUris.length > 0 ? (
              <View style={styles.previewRow}>
                {imageUris.map((uri) => (
                  <View key={uri} style={styles.previewWrap}>
                    <Image source={{ uri }} style={styles.previewImage} />

                    <Pressable
                      style={styles.removeImageButton}
                      onPress={() => removeImage(uri)}
                    >
                      <Ionicons name="close" size={14} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyImageBox}>
                <MaterialCommunityIcons
                  name="image-plus"
                  size={34}
                  color={colors.primaryDark}
                />
                <Text style={styles.emptyImageText}>
                  Add photos to help collectors identify the waste.
                </Text>
              </View>
            )}

            <View style={styles.imageActionsRow}>
              <Pressable
                style={styles.secondaryActionButton}
                onPress={handlePickImage}
              >
                <Ionicons
                  name="images-outline"
                  size={18}
                  color={colors.primaryDeep}
                />
                <Text style={styles.secondaryActionText}>Gallery</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryActionButton}
                onPress={handleTakePhoto}
              >
                <Ionicons
                  name="camera-outline"
                  size={18}
                  color={colors.primaryDeep}
                />
                <Text style={styles.secondaryActionText}>Camera</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Estimated service charge
              </Text>
              <Text style={styles.summaryValue}>
                Rs. {estimate.price.toFixed(2)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Eco Drops reward</Text>
              <Text style={styles.summaryValue}>+{estimate.drops}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <Text style={styles.summaryNote}>
              Final charges can be adjusted by admin/collector after
              verification.
            </Text>
          </View>

          <Pressable
            disabled={submitting}
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.pressedButton,
              submitting && styles.disabledButton,
            ]}
            onPress={handleSubmit}
          >
            <MaterialCommunityIcons
              name="send-check-outline"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.submitButtonText}>
              {submitting ? "Submitting..." : "Submit Request"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function LabeledInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9AA8A0"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...softShadow,
  },
  headerTextBlock: {
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  headerSubtitle: {
    marginTop: 2,
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "700",
  },
  headerPlaceholder: {
    width: 42,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    marginBottom: spacing.xl,
    ...softShadow,
  },
  infoIconWrap: {
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  infoText: {
    marginTop: 4,
    color: colors.textSoft,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: spacing.md,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  categoryCard: {
    width: "47.8%",
    minHeight: 135,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: "transparent",
    ...softShadow,
  },
  categoryCardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#FBFFFC",
  },
  categoryIconWrap: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  categoryIconSelected: {
    backgroundColor: colors.primaryDark,
  },
  categoryTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  categorySubtitle: {
    marginTop: 4,
    color: colors.textSoft,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
  },
  formCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    ...softShadow,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 7,
  },
  input: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F7FAF8",
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  multilineInput: {
    minHeight: 92,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  imageCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    ...softShadow,
  },
  imageHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  imageTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  imageSubtitle: {
    marginTop: 2,
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  imageCount: {
    color: colors.primaryDeep,
    fontSize: 12,
    fontWeight: "900",
  },
  emptyImageBox: {
    minHeight: 118,
    borderRadius: radius.lg,
    backgroundColor: "#F7FAF8",
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  emptyImageText: {
    marginTop: spacing.sm,
    color: colors.textSoft,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    fontWeight: "700",
  },
  previewRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  previewWrap: {
    width: 86,
    height: 86,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.58)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageActionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  secondaryActionButton: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  secondaryActionText: {
    color: colors.primaryDeep,
    fontSize: 13,
    fontWeight: "900",
  },
  summaryCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.darkCard,
    marginBottom: spacing.lg,
    ...softShadow,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    color: "#DCE9E2",
    fontSize: 12,
    fontWeight: "800",
  },
  summaryValue: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginVertical: spacing.sm,
  },
  summaryNote: {
    color: "#BFD0C7",
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
  },
  submitButton: {
    height: 58,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    ...softShadow,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  pressedButton: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  disabledButton: {
    opacity: 0.6,
  },
});
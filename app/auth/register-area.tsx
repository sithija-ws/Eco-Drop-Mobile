import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Checklist,
  EcoLogo,
  PrimaryButton,
  SecondaryButton,
  SecureBadge,
  SelectField,
} from "../../components/auth/AuthUI";
import { useSignup } from "../../context/SignupContext";
import { colors, radius, softShadow, spacing } from "../../constants/theme";

const AREA_DATA = {
  Colombo: {
    "Colombo Divisional Secretariat": [
      "Colombo North - 04",
      "Pettah",
      "Fort",
      "Slave Island",
    ],
    "Thimbirigasyaya DS Division": [
      "Bambalapitiya",
      "Narahenpita",
      "Kirulapone",
      "Thimbirigasyaya",
    ],
    "Dehiwala DS Division": [
      "Dehiwala West",
      "Mount Lavinia",
      "Kohuwala",
      "Nedimala",
    ],
  },
  Gampaha: {
    "Gampaha DS Division": ["Gampaha Town", "Yakkala", "Miriswatta"],
    "Negombo DS Division": ["Negombo Central", "Kochchikade", "Dalupotha"],
  },
  Kalutara: {
    "Kalutara DS Division": ["Kalutara North", "Kalutara South", "Nagoda"],
    "Panadura DS Division": ["Panadura Town", "Wadduwa", "Keselwatta"],
  },
} as const;

type District = keyof typeof AREA_DATA;
type SelectType = "district" | "ds" | "gn";

export default function RegisterAreaScreen() {
  const { draft, updateDraft } = useSignup();

  const [district, setDistrict] = useState<string>(
    draft.area?.district ?? ""
  );
  const [dsDivision, setDsDivision] = useState<string>(
    draft.area?.dsDivision ?? ""
  );
  const [gnDivision, setGnDivision] = useState<string>(
    draft.area?.gnDivision ?? ""
  );
  const [selectType, setSelectType] = useState<SelectType | null>(null);

  const dsOptions = useMemo(() => {
    if (!district) return [];
    return Object.keys(AREA_DATA[district as District] ?? {});
  }, [district]);

  const gnOptions = useMemo(() => {
    if (!district || !dsDivision) return [];

    const districtData = AREA_DATA[district as District] as
      | Record<string, readonly string[]>
      | undefined;

    return [...(districtData?.[dsDivision] ?? [])];
  }, [district, dsDivision]);

  const modalOptions = useMemo(() => {
    if (selectType === "district") return Object.keys(AREA_DATA);
    if (selectType === "ds") return dsOptions;
    if (selectType === "gn") return gnOptions;
    return [];
  }, [selectType, dsOptions, gnOptions]);

  const handleSelect = (value: string) => {
    if (selectType === "district") {
      setDistrict(value);
      setDsDivision("");
      setGnDivision("");
    }

    if (selectType === "ds") {
      setDsDivision(value);
      setGnDivision("");
    }

    if (selectType === "gn") {
      setGnDivision(value);
    }

    setSelectType(null);
  };

  const handleNext = () => {
    if (!district || !dsDivision || !gnDivision) {
      Alert.alert(
        "Area required",
        "Please select your District, DS Division, and GN Division."
      );
      return;
    }

    updateDraft({
      area: {
        district,
        dsDivision,
        gnDivision,
      },
    });

    router.push("/auth/register-verification");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.introCard}>
          <View style={styles.brandRow}>
            <EcoLogo compact />
            <Text style={styles.brandText}>ECO-DROP</Text>
          </View>

          <Text style={styles.title}>Area Setup</Text>

          <Text style={styles.subtitle}>
            We need your location to assign the correct collection schedule and
            nearest smart bins.
          </Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressTopRow}>
            <Text style={styles.stepText}>Step 3 of 4</Text>
            <Text style={styles.percentText}>75%</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          <Checklist currentStep={3} />
        </View>

        <SecureBadge text="Location data is encrypted and secure" />

        <View style={styles.formCard}>
          <SelectField
            label="District"
            value={district || "Select your District"}
            onPress={() => setSelectType("district")}
          />

          <SelectField
            label="DS Division"
            value={dsDivision || "Select District first"}
            disabled={!district}
            onPress={() => setSelectType("ds")}
          />

          <SelectField
            label="Grama Niladhari (GN) Division"
            value={gnDivision || "Select DS Division first"}
            disabled={!dsDivision}
            onPress={() => setSelectType("gn")}
          />

          <CoverageMap />

          <View style={styles.actionsRow}>
            <View style={styles.backWrap}>
              <SecondaryButton title="Back" onPress={() => router.back()} />
            </View>

            <View style={styles.nextWrap}>
              <PrimaryButton title="Next Step" onPress={handleNext} />
            </View>
          </View>
        </View>
      </ScrollView>

      <OptionModal
        visible={Boolean(selectType)}
        title={
          selectType === "district"
            ? "Select District"
            : selectType === "ds"
            ? "Select DS Division"
            : "Select GN Division"
        }
        options={modalOptions}
        onClose={() => setSelectType(null)}
        onSelect={handleSelect}
      />
    </SafeAreaView>
  );
}

function OptionModal({
  visible,
  title,
  options,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  options: string[];
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>

            <Pressable style={styles.modalClose} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          {options.map((option) => (
            <Pressable
              key={option}
              style={styles.optionRow}
              onPress={() => onSelect(option)}
            >
              <Text style={styles.optionText}>{option}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CoverageMap() {
  return (
    <LinearGradient
      colors={["#204A4F", "#396E72", "#8CCEC5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.mapCard}
    >
      <View style={[styles.mapLine, styles.mapLineOne]} />
      <View style={[styles.mapLine, styles.mapLineTwo]} />
      <View style={[styles.mapLine, styles.mapLineThree]} />
      <View style={[styles.mapLine, styles.mapLineFour]} />

      <View style={styles.coverageGlow} />

      <View style={styles.coveragePill}>
        <MaterialCommunityIcons
          name="shield-check"
          size={13}
          color={colors.primaryDeep}
        />
        <Text style={styles.coverageText}>Coverage Area Preview</Text>
      </View>

      <Pressable style={styles.expandButton}>
        <Ionicons name="expand-outline" size={18} color={colors.primaryDeep} />
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  introCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    ...softShadow,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  brandText: {
    color: colors.primaryDeep,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
  },
  progressCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    ...softShadow,
  },
  progressTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  stepText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  percentText: {
    color: colors.primaryDeep,
    fontSize: 12,
    fontWeight: "900",
  },
  progressTrack: {
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: "#DCEBE2",
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  progressFill: {
    width: "75%",
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  formCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    marginTop: spacing.md,
    ...softShadow,
  },
  mapCard: {
    height: 126,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  mapLine: {
    position: "absolute",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  mapLineOne: {
    width: "130%",
    top: 34,
    left: -20,
    transform: [{ rotate: "-14deg" }],
  },
  mapLineTwo: {
    width: "120%",
    top: 70,
    left: -16,
    transform: [{ rotate: "8deg" }],
  },
  mapLineThree: {
    width: 1,
    height: "130%",
    left: 96,
    top: -10,
    transform: [{ rotate: "18deg" }],
  },
  mapLineFour: {
    width: 1,
    height: "130%",
    right: 54,
    top: -20,
    transform: [{ rotate: "-12deg" }],
  },
  coverageGlow: {
    position: "absolute",
    right: 32,
    top: 24,
    width: 70,
    height: 70,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  coveragePill: {
    position: "absolute",
    left: spacing.md,
    bottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.94)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  coverageText: {
    color: colors.primaryDeep,
    fontSize: 11,
    fontWeight: "900",
  },
  expandButton: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  backWrap: {
    flex: 0.85,
  },
  nextWrap: {
    flex: 1.25,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    width: "100%",
    maxHeight: "78%",
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...softShadow,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: "#F4F7F5",
    alignItems: "center",
    justifyContent: "center",
  },
  optionRow: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: "#F7FAF8",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
});
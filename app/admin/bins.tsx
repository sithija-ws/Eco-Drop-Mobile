import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import {
  createSmartBin,
  formatBinType,
  getBinFillColor,
  listenAllSmartBins,
  type SmartBinStatus,
  type SmartBinType,
  updateSmartBinFillLevel,
  updateSmartBinStatus,
} from "../../services/binService";
import type { SmartBin } from "../../types/firestore";
import { colors, radius, softShadow, spacing } from "../../constants/theme";
import MapViewComponent, { MapMarkerItem } from "../../components/common/MapViewComponent";

type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const binTypes: SmartBinType[] = ["plastic", "organic", "paper", "glass", "electronic", "mixed", "general"];
const statuses: SmartBinStatus[] = ["active", "maintenance", "offline"];

export default function AdminBinsScreen() {
  const { profile } = useAuth();
  const [bins, setBins] = useState<SmartBin[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = listenAllSmartBins(
      (items) => {
        setBins(items);
        setLoading(false);
      },
      (error) => {
        console.warn("Admin bins listener error", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const stats = useMemo(() => {
    return {
      total: bins.length,
      full: bins.filter((bin) => Number(bin.fillLevel ?? 0) >= 85).length,
      maintenance: bins.filter((bin) => bin.status === "maintenance" || bin.status === "offline").length,
    };
  }, [bins]);

  const handleFillChange = async (bin: SmartBin, delta: number) => {
    try {
      setUpdatingId(bin.id);
      await updateSmartBinFillLevel(bin.id, Number(bin.fillLevel ?? 0) + delta);
    } catch (error) {
      console.warn(error);
      Alert.alert("Update failed", "Could not update bin fill level.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = async (bin: SmartBin, status: SmartBinStatus) => {
    try {
      setUpdatingId(bin.id);
      await updateSmartBinStatus(bin.id, status);
    } catch (error) {
      console.warn(error);
      Alert.alert("Update failed", "Could not update bin status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const binMarkers = useMemo<MapMarkerItem[]>(() => {
    return bins.map((bin) => {
      const lat = bin.location?.latitude || 6.9271 + (Math.random() - 0.5) * 0.04;
      const lng = bin.location?.longitude || 79.8612 + (Math.random() - 0.5) * 0.04;
      const fill = Number(bin.fillLevel ?? 0);
      const pinColor = fill >= 85 ? "#E53935" : fill >= 50 ? "#FB8C00" : "#4CAF50";

      return {
        id: bin.id,
        latitude: lat,
        longitude: lng,
        title: bin.name,
        description: `Fill: ${fill}% • Type: ${bin.type}`,
        pinColor,
      };
    });
  }, [bins]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Smart Bins</Text>
            <Text style={styles.headerSubtitle}>Manage bins and live fill levels</Text>
          </View>
          <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <StatCard icon="trash-can-outline" label="Total" value={String(stats.total)} />
          <StatCard icon="alert-outline" label="Full" value={String(stats.full)} warning={stats.full > 0} />
          <StatCard icon="tools" label="Issues" value={String(stats.maintenance)} warning={stats.maintenance > 0} />
        </View>

        {/* Live Municipal Smart Bin Fleet Map */}
        <View style={styles.mapCard}>
          <View style={styles.mapHeaderRow}>
            <MaterialCommunityIcons name="map-marker-multiple-outline" size={20} color={colors.primaryDark} />
            <Text style={styles.mapHeaderTitle}>Live Bin Fleet Map</Text>
          </View>
          <MapViewComponent
            height={200}
            initialRegion={{
              latitude: 6.9271,
              longitude: 79.8612,
              latitudeDelta: 0.06,
              longitudeDelta: 0.06,
            }}
            markers={binMarkers}
          />
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.primaryDark} />
            <Text style={styles.loadingText}>Loading smart bins...</Text>
          </View>
        ) : bins.length > 0 ? (
          <View style={styles.binList}>
            {bins.map((bin) => (
              <AdminBinCard
                key={bin.id}
                bin={bin}
                updating={updatingId === bin.id}
                onDecrease={() => handleFillChange(bin, -10)}
                onIncrease={() => handleFillChange(bin, 10)}
                onStatusChange={(status) => handleStatusChange(bin, status)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="trash-can-outline" size={36} color={colors.primaryDark} />
            <Text style={styles.emptyTitle}>No smart bins yet</Text>
            <Text style={styles.emptySubtitle}>Tap the + button to add your first smart bin.</Text>
          </View>
        )}
      </ScrollView>

      <CreateBinModal
        visible={modalVisible}
        admin={profile}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, warning }: { icon: MaterialIconName; label: string; value: string; warning?: boolean }) {
  return (
    <View style={styles.statCard}>
      <MaterialCommunityIcons name={icon} size={20} color={warning ? colors.danger : colors.primaryDark} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function AdminBinCard({
  bin,
  updating,
  onDecrease,
  onIncrease,
  onStatusChange,
}: {
  bin: SmartBin;
  updating: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  onStatusChange: (status: SmartBinStatus) => void;
}) {
  const fill = Math.max(0, Math.min(100, Math.round(Number(bin.fillLevel ?? 0))));
  const fillColor = getBinFillColor(fill);
  const status = (bin.status ?? "active") as SmartBinStatus;

  return (
    <View style={styles.binCard}>
      <View style={styles.binTopRow}>
        <View style={[styles.binIconWrap, { backgroundColor: `${fillColor}18` }]}>
          <MaterialCommunityIcons name="trash-can-outline" size={24} color={fillColor} />
        </View>
        <View style={styles.binTextBlock}>
          <Text style={styles.binName}>{bin.name}</Text>
          <Text style={styles.binAddress}>{bin.location?.address ?? "Location not set"}</Text>
          <Text style={styles.binArea}>{bin.area?.gnDivision ?? bin.area?.district ?? "Area not assigned"}</Text>
        </View>
        <Text style={[styles.fillBigText, { color: fillColor }]}>{fill}%</Text>
      </View>

      <View style={styles.binMetaRow}>
        <View style={styles.metaPill}><Text style={styles.metaText}>{formatBinType(bin.type)}</Text></View>
        <View style={styles.metaPill}><Text style={styles.metaText}>{bin.capacityLiters ?? 0}L</Text></View>
        <View style={styles.metaPill}><Text style={styles.metaText}>{status}</Text></View>
      </View>

      <View style={styles.fillTrack}>
        <View style={[styles.fillBar, { width: `${fill}%` as `${number}%`, backgroundColor: fillColor }]} />
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.adjustButton} onPress={onDecrease} disabled={updating}>
          <Text style={styles.adjustText}>-10%</Text>
        </Pressable>
        <Pressable style={styles.adjustButton} onPress={onIncrease} disabled={updating}>
          <Text style={styles.adjustText}>+10%</Text>
        </Pressable>
      </View>

      <View style={styles.statusRow}>
        {statuses.map((item) => {
          const selected = status === item;
          return (
            <Pressable
              key={item}
              style={[styles.statusButton, selected && styles.statusButtonSelected]}
              onPress={() => onStatusChange(item)}
              disabled={updating}
            >
              <Text style={[styles.statusButtonText, selected && styles.statusButtonTextSelected]}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function CreateBinModal({
  visible,
  admin,
  onClose,
}: {
  visible: boolean;
  admin: ReturnType<typeof useAuth>["profile"];
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [fillLevel, setFillLevel] = useState("0");
  const [capacityLiters, setCapacityLiters] = useState("500");
  const [type, setType] = useState<SmartBinType>("plastic");
  const [status, setStatus] = useState<SmartBinStatus>("active");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setAddress("");
    setFillLevel("0");
    setCapacityLiters("500");
    setType("plastic");
    setStatus("active");
  };

  const handleSave = async () => {
    if (!admin) {
      Alert.alert("Admin required", "Please login again.");
      return;
    }

    try {
      setSaving(true);
      await createSmartBin(admin, {
        name,
        address,
        type,
        status,
        fillLevel: Number(fillLevel),
        capacityLiters: Number(capacityLiters),
      });
      reset();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again.";
      Alert.alert("Could not create bin", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Smart Bin</Text>
            <Pressable style={styles.modalClose} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Input label="Bin Name" value={name} onChangeText={setName} placeholder="Market Smart Bin" />
            <Input label="Address / Location" value={address} onChangeText={setAddress} placeholder="Colombo North Market" multiline />
            <Input label="Fill Level (%)" value={fillLevel} onChangeText={setFillLevel} placeholder="0" keyboardType="number-pad" />
            <Input label="Capacity Liters" value={capacityLiters} onChangeText={setCapacityLiters} placeholder="500" keyboardType="number-pad" />

            <Text style={styles.inputLabel}>Bin Type</Text>
            <View style={styles.choiceWrap}>
              {binTypes.map((item) => {
                const selected = type === item;
                return (
                  <Pressable key={item} style={[styles.choicePill, selected && styles.choicePillSelected]} onPress={() => setType(item)}>
                    <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{formatBinType(item)}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Status</Text>
            <View style={styles.choiceWrap}>
              {statuses.map((item) => {
                const selected = status === item;
                return (
                  <Pressable key={item} style={[styles.choicePill, selected && styles.choicePillSelected]} onPress={() => setStatus(item)}>
                    <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{item}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable style={[styles.saveButton, saving && styles.disabledButton]} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveText}>{saving ? "Saving..." : "Create Smart Bin"}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Input({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: "default" | "number-pad";
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
        keyboardType={keyboardType ?? "default"}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 105 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg },
  headerTitle: { color: colors.text, fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  headerSubtitle: { marginTop: 3, color: colors.textSoft, fontSize: 13, fontWeight: "700" },
  addButton: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.primaryDark, alignItems: "center", justifyContent: "center", ...softShadow },
  statsGrid: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  mapCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...softShadow,
  },
  mapHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  mapHeaderTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
    marginLeft: 6,
  },
  statCard: { flex: 1, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, alignItems: "center", ...softShadow },
  statValue: { marginTop: 4, color: colors.text, fontSize: 22, fontWeight: "900" },
  statLabel: { color: colors.textSoft, fontSize: 10, fontWeight: "800" },
  loadingCard: { minHeight: 160, borderRadius: radius.xl, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", gap: spacing.sm, ...softShadow },
  loadingText: { color: colors.textSoft, fontSize: 13, fontWeight: "700" },
  binList: { gap: spacing.md },
  binCard: { padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.surface, ...softShadow },
  binTopRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  binIconWrap: { width: 52, height: 52, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  binTextBlock: { flex: 1 },
  binName: { color: colors.text, fontSize: 16, fontWeight: "900" },
  binAddress: { marginTop: 3, color: colors.textSoft, fontSize: 12, fontWeight: "700", lineHeight: 17 },
  binArea: { marginTop: 3, color: colors.primaryDeep, fontSize: 11, fontWeight: "800" },
  fillBigText: { fontSize: 22, fontWeight: "900" },
  binMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  metaPill: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: "#F4F7F5" },
  metaText: { color: colors.textSoft, fontSize: 11, fontWeight: "900", textTransform: "capitalize" },
  fillTrack: { height: 9, borderRadius: radius.pill, backgroundColor: "#DCEBE2", overflow: "hidden", marginTop: spacing.lg },
  fillBar: { height: "100%", borderRadius: radius.pill },
  actionsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  adjustButton: { flex: 1, height: 40, borderRadius: radius.md, backgroundColor: colors.surfaceSoft, alignItems: "center", justifyContent: "center" },
  adjustText: { color: colors.primaryDeep, fontSize: 13, fontWeight: "900" },
  statusRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  statusButton: { flex: 1, height: 36, borderRadius: radius.md, backgroundColor: "#F4F7F5", alignItems: "center", justifyContent: "center" },
  statusButtonSelected: { backgroundColor: colors.primaryDark },
  statusButtonText: { color: colors.textSoft, fontSize: 11, fontWeight: "900", textTransform: "capitalize" },
  statusButtonTextSelected: { color: "#FFFFFF" },
  emptyCard: { minHeight: 210, borderRadius: radius.xl, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", padding: spacing.xl, ...softShadow },
  emptyTitle: { marginTop: spacing.md, color: colors.text, fontSize: 18, fontWeight: "900" },
  emptySubtitle: { marginTop: spacing.xs, color: colors.textSoft, fontSize: 13, lineHeight: 19, fontWeight: "700", textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.32)", justifyContent: "flex-end" },
  modalCard: { maxHeight: "90%", borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, backgroundColor: colors.surface, padding: spacing.lg },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: "900" },
  modalClose: { width: 38, height: 38, borderRadius: radius.pill, backgroundColor: "#F4F7F5", alignItems: "center", justifyContent: "center" },
  inputGroup: { marginBottom: spacing.md },
  inputLabel: { color: colors.text, fontSize: 12, fontWeight: "900", marginBottom: 7 },
  input: { minHeight: 52, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: "#F7FAF8", paddingHorizontal: spacing.md, color: colors.text, fontSize: 14, fontWeight: "700" },
  multilineInput: { minHeight: 82, paddingTop: spacing.md, paddingBottom: spacing.md },
  choiceWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  choicePill: { paddingHorizontal: spacing.md, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: "#F4F7F5" },
  choicePillSelected: { backgroundColor: colors.primaryDark },
  choiceText: { color: colors.textSoft, fontSize: 12, fontWeight: "900", textTransform: "capitalize" },
  choiceTextSelected: { color: "#FFFFFF" },
  saveButton: { height: 52, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: spacing.sm, marginBottom: spacing.lg },
  saveText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  disabledButton: { opacity: 0.6 },
});

import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radius, softShadow, spacing } from "../../constants/theme";

type IonIconName = React.ComponentProps<typeof Ionicons>["name"];
type MaterialIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export function EcoLogo({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.logoCircle, compact && styles.logoCircleCompact]}>
      <MaterialCommunityIcons
        name="leaf"
        size={compact ? 18 : 26}
        color={colors.primaryDeep}
      />
    </View>
  );
}

export function SecureBadge({
  text = "Secure Platform Protection",
}: {
  text?: string;
}) {
  return (
    <View style={styles.secureBadge}>
      <MaterialCommunityIcons
        name="shield-check"
        size={13}
        color={colors.primaryDeep}
      />
      <Text style={styles.secureText}>{text}</Text>
    </View>
  );
}

export function AuthProgress({
  step,
  total = 4,
  label,
}: {
  step: number;
  total?: number;
  label: string;
}) {
  const progressValue = Math.min(100, Math.round((step / total) * 100));
  const progress = `${progressValue}%` as `${number}%`;

  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressTopRow}>
        <Text style={styles.progressStep}>
          Step {step} of {total}
        </Text>
        <Text style={styles.progressLabel}>{label}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: progress }]} />
      </View>
    </View>
  );
}

export function AuthInput({
  label,
  icon,
  rightText,
  secureTextEntry,
  containerStyle,
  ...props
}: TextInputProps & {
  label: string;
  icon: IonIconName;
  rightText?: string;
  containerStyle?: object;
}) {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));

  return (
    <View style={[styles.inputGroup, containerStyle]}>
      <View style={styles.inputLabelRow}>
        <Text style={styles.inputLabel}>{label}</Text>
        {rightText ? <Text style={styles.inputRightText}>{rightText}</Text> : null}
      </View>

      <View style={styles.inputBox}>
        <Ionicons name={icon} size={18} color={colors.muted} />

        <TextInput
          {...props}
          secureTextEntry={secureTextEntry ? hidden : false}
          placeholderTextColor="#9AA8A0"
          style={styles.textInput}
        />

        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((value) => !value)} hitSlop={8}>
            <Ionicons
              name={hidden ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={colors.muted}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  icon = "arrow-forward",
}: {
  title: string;
  onPress: () => void;
  icon?: IonIconName;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primaryButton,
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      <Text style={styles.primaryButtonText}>{title}</Text>
      <Ionicons name={icon} size={18} color="#FFFFFF" />
    </Pressable>
  );
}

export function SecondaryButton({
  title,
  onPress,
  icon = "arrow-back",
}: {
  title: string;
  onPress: () => void;
  icon?: IonIconName;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.secondaryButton,
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color={colors.text} />
      <Text style={styles.secondaryButtonText}>{title}</Text>
    </Pressable>
  );
}

export function SelectField({
  label,
  value,
  disabled,
}: {
  label: string;
  value: string;
  disabled?: boolean;
}) {
  return (
    <View style={styles.selectGroup}>
      <Text style={styles.inputLabel}>{label}</Text>

      <Pressable style={[styles.selectBox, disabled && styles.selectDisabled]}>
        <View style={styles.selectLeft}>
          <Ionicons name="location-outline" size={17} color={colors.muted} />
          <Text style={[styles.selectValue, disabled && styles.selectValueDisabled]}>
            {value}
          </Text>
        </View>

        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </Pressable>
    </View>
  );
}

export function Checklist({ currentStep = 3 }: { currentStep?: number }) {
  const items = [
    "Account Details",
    "Household Info",
    "Area Setup",
    "Verification",
  ];

  return (
    <View style={styles.checkList}>
      {items.map((item, index) => {
        const step = index + 1;
        const done = step < currentStep;
        const active = step === currentStep;

        return (
          <View key={item} style={styles.checkItem}>
            <MaterialCommunityIcons
              name={
                done
                  ? "check-circle"
                  : active
                  ? "checkbox-marked-circle"
                  : "checkbox-blank-circle-outline"
              }
              size={15}
              color={done || active ? colors.primaryDark : colors.muted}
            />

            <Text style={[styles.checkText, active && styles.checkTextActive]}>
              {item}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function RoleIcon({ name }: { name: MaterialIconName }) {
  return (
    <View style={styles.roleIconCircle}>
      <MaterialCommunityIcons name={name} size={31} color={colors.primaryDeep} />
    </View>
  );
}

const styles = StyleSheet.create({
  logoCircle: {
    width: 66,
    height: 66,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    ...softShadow,
  },
  logoCircleCompact: {
    width: 36,
    height: 36,
  },
  secureBadge: {
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: "#DDFBE7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secureText: {
    color: colors.primaryDeep,
    fontSize: 11,
    fontWeight: "800",
  },
  progressWrap: {
    marginBottom: spacing.lg,
  },
  progressTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  progressStep: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "800",
  },
  progressLabel: {
    color: colors.primaryDeep,
    fontSize: 11,
    fontWeight: "900",
  },
  progressTrack: {
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: "#DCEBE2",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },
  inputLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
  },
  inputRightText: {
    color: colors.primaryDeep,
    fontSize: 11,
    fontWeight: "900",
  },
  inputBox: {
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F7FAF8",
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  primaryButton: {
    height: 58,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    ...softShadow,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
  secondaryButton: {
    height: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  buttonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  selectGroup: {
    marginBottom: spacing.md,
  },
  selectBox: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: "#F4F7F5",
    paddingHorizontal: spacing.md,
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectDisabled: {
    opacity: 0.72,
  },
  selectLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  selectValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  selectValueDisabled: {
    color: colors.muted,
  },
  checkList: {
    gap: 8,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  checkText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  checkTextActive: {
    color: colors.primaryDeep,
    fontWeight: "900",
  },
  roleIconCircle: {
    width: 70,
    height: 70,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F6F2",
  },
});
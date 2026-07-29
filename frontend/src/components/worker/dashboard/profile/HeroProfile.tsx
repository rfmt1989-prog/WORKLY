import React from "react";
import {
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import {
  colors,
  radius,
  spacing,
} from "@/src/design";

import type {
  WorkerAvailabilityStatus,
  WorkerProfile,
} from "../types";

type HeroProfileProps = {
  profile: Partial<WorkerProfile>;
  onViewProfile?: () => void;
  onEditProfile?: () => void;
};

const availabilityConfiguration: Record<
  WorkerAvailabilityStatus,
  {
    label: string;
    color: string;
  }
> = {
  available: {
    label: "Disponível",
    color: colors.success,
  },
  busy: {
    label: "Ocupado",
    color: "#F59E0B",
  },
  unavailable: {
    label: "Indisponível",
    color: colors.danger,
  },
};

function clampPercentage(value: number) {
  return Math.max(0, Math.min(100, value));
}

export default function HeroProfile({
  profile,
  onViewProfile,
  onEditProfile,
}: HeroProfileProps) {
  const availability =
    profile.availability_status ?? "available";

  const availabilityData =
    availabilityConfiguration[availability];

  const overall = clampPercentage(
    profile.overall_rating ??
      profile.pulse ??
      0
  );

  const completion = clampPercentage(
    profile.profile_completion ??
      profile.pulse ??
      0
  );

  const rating =
    typeof profile.average_rating === "number"
      ? profile.average_rating.toFixed(1)
      : "--";

  const experience =
    typeof profile.years_of_experience === "number"
      ? `${profile.years_of_experience} ${
          profile.years_of_experience === 1
            ? "ano"
            : "anos"
        }`
      : "--";

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.large,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing[5],
        marginBottom: spacing[6],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: spacing[4],
        }}
      >
        {profile.avatar_url ? (
          <Image
            source={{
              uri: profile.avatar_url,
            }}
            accessibilityLabel={`Fotografia de ${
              profile.name ?? "trabalhador"
            }`}
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: colors.background,
            }}
          />
        ) : (
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: colors.background,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.worker,
            }}
          >
            <Ionicons
              name="person-outline"
              size={42}
              color={colors.worker}
            />
          </View>
        )}

        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 25,
              fontWeight: "900",
            }}
          >
            {profile.name ?? "Trabalhador"}
          </Text>

          <Text
            style={{
              color: colors.worker,
              fontSize: 15,
              fontWeight: "600",
              marginTop: spacing[1],
            }}
          >
            {profile.role ?? "Profissional"}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: spacing[3],
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor:
                  availabilityData.color,
                marginRight: spacing[2],
              }}
            />

            <Text
              style={{
                color: colors.textMuted,
                fontSize: 14,
              }}
            >
              {availabilityData.label}
            </Text>
          </View>
        </View>

        <View
          style={{
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: colors.worker,
              fontSize: 13,
              fontWeight: "800",
              letterSpacing: 1,
            }}
          >
            OVR
          </Text>

          <Text
            style={{
              color: colors.text,
              fontSize: 43,
              fontWeight: "900",
            }}
          >
            {overall}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          marginTop: spacing[5],
          gap: spacing[3],
        }}
      >
        <InfoItem
          icon="location-outline"
          value={profile.location ?? "Por definir"}
        />

        <InfoItem
          icon="star-outline"
          value={rating}
        />

        <InfoItem
          icon="briefcase-outline"
          value={experience}
        />
      </View>

      <View
        style={{
          marginTop: spacing[5],
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: spacing[2],
          }}
        >
          <Text
            style={{
              color: colors.textMuted,
            }}
          >
            Perfil completo
          </Text>

          <Text
            style={{
              color: colors.worker,
              fontWeight: "800",
            }}
          >
            {completion}%
          </Text>
        </View>

        <View
          style={{
            height: 7,
            backgroundColor: colors.border,
            borderRadius: radius.pill,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${completion}%`,
              height: "100%",
              backgroundColor: colors.worker,
              borderRadius: radius.pill,
            }}
          />
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: spacing[3],
          marginTop: spacing[6],
        }}
      >
        <ActionButton
          title="Ver perfil"
          icon="person-outline"
          onPress={onViewProfile}
        />

        <ActionButton
          title="Editar"
          icon="create-outline"
          onPress={onEditProfile}
        />
      </View>
    </View>
  );
}

function InfoItem({
  icon,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        minWidth: 0,
      }}
    >
      <Ionicons
        name={icon}
        size={21}
        color={colors.worker}
      />

      <Text
        numberOfLines={1}
        style={{
          color: colors.text,
          marginTop: spacing[2],
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function ActionButton({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 50,
        borderRadius: radius.medium,
        backgroundColor: colors.worker,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        opacity: pressed ? 0.78 : 1,
      })}
    >
      <Ionicons
        name={icon}
        size={18}
        color="#FFFFFF"
      />

      <Text
        style={{
          color: "#FFFFFF",
          fontWeight: "800",
          marginLeft: spacing[2],
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
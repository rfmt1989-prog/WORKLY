import React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Worker } from "../../hooks/useTeams";

type WorkerInspectorProps = {
  worker: Worker | null;
  isLeader?: boolean;
  isMember?: boolean;
  onClose: () => void;
  onSetLeader?: () => void;
  onRemove?: () => void;
};

function safeScore(value?: number) {
  const score = Number(value || 0);

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(10, score));
}

function initials(name?: string) {
  const safeName = name?.trim() || "W";

  return safeName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function ScoreLine({
  label,
  value,
  icon,
}: {
  label: string;
  value?: number;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}) {
  const score = safeScore(value);

  return (
    <View style={{ marginBottom: 16 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 7,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name={icon} size={17} color="#64748B" />

          <Text
            style={{
              marginLeft: 7,
              color: "#334155",
              fontWeight: "700",
            }}
          >
            {label}
          </Text>
        </View>

        <Text
          style={{
            color: "#0F172A",
            fontWeight: "900",
          }}
        >
          {score.toFixed(1)}
        </Text>
      </View>

      <View
        style={{
          height: 8,
          borderRadius: 999,
          backgroundColor: "#E2E8F0",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${score * 10}%`,
            height: "100%",
            borderRadius: 999,
            backgroundColor: "#F97316",
          }}
        />
      </View>
    </View>
  );
}

export default function WorkerInspector({
  worker,
  isLeader = false,
  isMember = false,
  onClose,
  onSetLeader,
  onRemove,
}: WorkerInspectorProps) {
  if (!worker) {
    return null;
  }

  const name = worker.name || worker.email || "Trabalhador";

  return (
    <View
      style={{
        width: "100%",
        maxWidth: 380,
        minHeight: 520,
        backgroundColor: "#FFFFFF",
        borderLeftWidth: 1,
        borderLeftColor: "#E2E8F0",
        padding: 22,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "#0F172A",
            fontSize: 20,
            fontWeight: "900",
          }}
        >
          Perfil do trabalhador
        </Text>

        <Pressable
          onPress={onClose}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#F1F5F9",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="close" size={20} color="#0F172A" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View style={{ alignItems: "center", marginTop: 28 }}>
          <View
            style={{
              width: 126,
              height: 126,
              borderRadius: 63,
              borderWidth: 5,
              borderColor: isLeader ? "#FACC15" : "#F97316",
              backgroundColor: "#E2E8F0",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {worker.avatar ? (
              <Image
                source={{ uri: worker.avatar }}
                style={{
                  width: 112,
                  height: 112,
                  borderRadius: 56,
                }}
              />
            ) : (
              <Text
                style={{
                  color: "#0F172A",
                  fontSize: 34,
                  fontWeight: "900",
                }}
              >
                {initials(name)}
              </Text>
            )}

            {isLeader && (
              <View
                style={{
                  position: "absolute",
                  top: -20,
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: "#FACC15",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="ribbon" size={21} color="#713F12" />
              </View>
            )}
          </View>

          <Text
            style={{
              marginTop: 17,
              color: "#0F172A",
              fontSize: 22,
              fontWeight: "900",
              textAlign: "center",
            }}
          >
            {name}
          </Text>

          <Text
            style={{
              marginTop: 4,
              color: "#F97316",
              fontSize: 13,
              fontWeight: "800",
              textTransform: "uppercase",
            }}
          >
            {worker.specialty || worker.title || "Profissional"}
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 9,
            }}
          >
            {!!worker.country && (
              <Text style={{ color: "#64748B", marginRight: 12 }}>
                {worker.country}
              </Text>
            )}

            {!!worker.age && (
              <Text style={{ color: "#64748B" }}>
                {worker.age} anos
              </Text>
            )}
          </View>

          <View
            style={{
              marginTop: 15,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#0F172A",
              borderRadius: 999,
              paddingHorizontal: 13,
              paddingVertical: 8,
            }}
          >
            <Ionicons name="star" size={17} color="#FACC15" />

            <Text
              style={{
                color: "#FFFFFF",
                fontWeight: "900",
                marginLeft: 6,
              }}
            >
              {safeScore(worker.overall_score).toFixed(1)}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 28 }}>
          <ScoreLine
            label="Confiança"
            value={worker.trust_score}
            icon="shield-checkmark-outline"
          />

          <ScoreLine
            label="Produtividade"
            value={worker.productivity_score}
            icon="flash-outline"
          />

          <ScoreLine
            label="Qualidade"
            value={worker.quality_score}
            icon="diamond-outline"
          />

          <ScoreLine
            label="Pontualidade"
            value={worker.punctuality_score}
            icon="time-outline"
          />
        </View>

        {isMember && (
          <View style={{ marginTop: 10 }}>
            {!isLeader && (
              <Pressable
                onPress={onSetLeader}
                style={{
                  backgroundColor: "#FEF9C3",
                  borderRadius: 13,
                  paddingVertical: 13,
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    color: "#854D0E",
                    fontWeight: "900",
                  }}
                >
                  Definir como chefe
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={onRemove}
              style={{
                backgroundColor: "#FEF2F2",
                borderRadius: 13,
                paddingVertical: 13,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#DC2626",
                  fontWeight: "900",
                }}
              >
                Retirar da equipa
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
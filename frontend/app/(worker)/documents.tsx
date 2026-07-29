import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { api } from "@/src/api/client";
import {
  colors,
  radius,
  spacing,
  typography,
} from "@/src/design";

type DocumentStatus =
  | "valid"
  | "expiring"
  | "pending";

type WorkerDocument = {
  id: number;
  title: string;
  category: string;
  status: DocumentStatus;
  description: string;
  expiry_date: string | null;
};

type DocumentsSummary = {
  completion_percentage: number;
  total_documents: number;
  valid_documents: number;
  expiring_documents: number;
  pending_documents: number;
};

type WorkerDocumentsResponse = {
  summary: DocumentsSummary;
  documents: WorkerDocument[];
};

export default function WorkerDocumentsScreen() {
  const [data, setData] =
    useState<WorkerDocumentsResponse | null>(
      null
    );

  const [filter, setFilter] = useState<
    "all" | DocumentStatus
  >("all");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);
        setError("");

        const result =
          await api.get<WorkerDocumentsResponse>(
            "/worker/documents"
          );

        setData(result);
      } catch (caughtError) {
        console.error(
          "Erro ao carregar documentos:",
          caughtError
        );

        setError(
          "Não foi possível carregar "
          + "os documentos."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadDocuments();
  }, []);

  const visibleDocuments =
    useMemo(() => {
      const documents =
        data?.documents ?? [];

      if (filter === "all") {
        return documents;
      }

      return documents.filter(
        (document) =>
          document.status === filter
      );
    }, [data, filter]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor:
            colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator
          size="large"
          color={colors.worker}
        />

        <Text
          style={{
            color: colors.textMuted,
            marginTop: spacing[3],
          }}
        >
          A carregar documentos...
        </Text>
      </View>
    );
  }

  const completionPercentage =
    data?.summary
      .completion_percentage ?? 0;

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor:
          colors.background,
      }}
      contentContainerStyle={{
        padding: spacing[5],
        paddingBottom: spacing[16],
      }}
      showsVerticalScrollIndicator={
        false
      }
    >
      <Header />

      {error ? (
        <View
          style={{
            backgroundColor:
              colors.surface,
            borderWidth: 1,
            borderColor: colors.danger,
            borderRadius:
              radius.medium,
            padding: spacing[4],
            marginBottom: spacing[5],
          }}
        >
          <Text
            style={{
              color: colors.danger,
              fontWeight: "700",
            }}
          >
            {error}
          </Text>
        </View>
      ) : null}

      <View
        style={{
          backgroundColor:
            colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.large,
          padding: spacing[5],
          marginBottom: spacing[6],
        }}
      >
        <Text
          style={{
            color: colors.textMuted,
            fontSize:
              typography.caption.fontSize,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Estado documental
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent:
              "space-between",
            marginTop: spacing[2],
          }}
        >
          <View>
            <Text
              style={{
                color: colors.text,
                fontSize: 34,
                fontWeight: "800",
              }}
            >
              {completionPercentage}%
            </Text>

            <Text
              style={{
                color:
                  colors.textMuted,
                marginTop: spacing[1],
              }}
            >
              Documentação validada
            </Text>
          </View>

          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: radius.pill,
              backgroundColor:
                colors.workerSoft,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor:
                colors.worker,
            }}
          >
            <Ionicons
              name={
                "shield-checkmark-outline"
              }
              size={25}
              color={colors.worker}
            />
          </View>
        </View>

        <View
          style={{
            height: 3,
            backgroundColor:
              colors.border,
            marginTop: spacing[5],
          }}
        >
          <View
            style={{
              width:
                `${completionPercentage}%`,
              height: "100%",
              backgroundColor:
                colors.worker,
              shadowColor:
                colors.worker,
              shadowOpacity: 0.7,
              shadowRadius: 8,
            }}
          />
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing[2],
          marginBottom: spacing[5],
        }}
      >
        <FilterButton
          label={`Todos ${
            data?.summary
              .total_documents ?? 0
          }`}
          active={filter === "all"}
          onPress={() =>
            setFilter("all")
          }
        />

        <FilterButton
          label={`Válidos ${
            data?.summary
              .valid_documents ?? 0
          }`}
          active={filter === "valid"}
          onPress={() =>
            setFilter("valid")
          }
        />

        <FilterButton
          label={`A expirar ${
            data?.summary
              .expiring_documents ?? 0
          }`}
          active={
            filter === "expiring"
          }
          onPress={() =>
            setFilter("expiring")
          }
        />

        <FilterButton
          label={`Pendentes ${
            data?.summary
              .pending_documents ?? 0
          }`}
          active={
            filter === "pending"
          }
          onPress={() =>
            setFilter("pending")
          }
        />
      </View>

      <Pressable
        style={{
          minHeight: 52,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: colors.worker,
          borderRadius: radius.medium,
          backgroundColor:
            colors.workerSoft,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing[6],
        }}
      >
        <Ionicons
          name="cloud-upload-outline"
          size={20}
          color={colors.worker}
        />

        <Text
          style={{
            color: colors.text,
            fontWeight: "800",
            marginLeft: spacing[2],
          }}
        >
          Adicionar documento
        </Text>
      </Pressable>

      <Text
        style={{
          color: colors.text,
          fontSize:
            typography.heading.fontSize,
          fontWeight:
            typography.heading
              .fontWeight,
          marginBottom: spacing[3],
        }}
      >
        Os teus documentos
      </Text>

      {visibleDocuments.map(
        (document) => (
          <DocumentCard
            key={document.id}
            document={document}
          />
        )
      )}
    </ScrollView>
  );
}

function Header() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent:
          "space-between",
        marginBottom: spacing[8],
      }}
    >
      <View>
        <Text
          style={{
            color: colors.text,
            fontSize: 22,
            fontWeight: "800",
          }}
        >
          Documentos
        </Text>

        <Text
          style={{
            color: colors.textMuted,
            marginTop: spacing[1],
          }}
        >
          Contratos, seguros e certificados
        </Text>
      </View>

      <View
        style={{
          width: 42,
          height: 42,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.pill,
          backgroundColor:
            colors.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name="document-text-outline"
          size={20}
          color={colors.worker}
        />
      </View>
    </View>
  );
}

function FilterButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        minHeight: 38,
        paddingHorizontal: spacing[3],
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: active
          ? colors.worker
          : colors.border,
        backgroundColor: active
          ? colors.workerSoft
          : colors.surface,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: active
            ? colors.worker
            : colors.textMuted,
          fontWeight: "700",
          fontSize:
            typography.caption.fontSize,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function DocumentCard({
  document,
}: {
  document: WorkerDocument;
}) {
  const statusConfig =
    getStatusConfig(document.status);

  return (
    <Pressable
      style={{
        backgroundColor:
          colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.large,
        padding: spacing[4],
        marginBottom: spacing[3],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
        }}
      >
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius:
              radius.medium,
            backgroundColor:
              statusConfig.background,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name={statusConfig.icon}
            size={20}
            color={statusConfig.color}
          />
        </View>

        <View
          style={{
            flex: 1,
            marginLeft: spacing[3],
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent:
                "space-between",
              alignItems: "flex-start",
            }}
          >
            <View
              style={{
                flex: 1,
                paddingRight:
                  spacing[3],
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontSize: 16,
                  fontWeight: "800",
                }}
              >
                {document.title}
              </Text>

              <Text
                style={{
                  color: colors.worker,
                  fontSize:
                    typography.caption
                      .fontSize,
                  fontWeight: "700",
                  marginTop: 3,
                }}
              >
                {document.category}
              </Text>
            </View>

            <View
              style={{
                backgroundColor:
                  statusConfig
                    .background,
                borderRadius:
                  radius.pill,
                paddingHorizontal:
                  spacing[2],
                paddingVertical: 5,
              }}
            >
              <Text
                style={{
                  color:
                    statusConfig.color,
                  fontSize: 11,
                  fontWeight: "800",
                }}
              >
                {statusConfig.label}
              </Text>
            </View>
          </View>

          <Text
            style={{
              color: colors.textMuted,
              marginTop: spacing[3],
              lineHeight: 19,
            }}
          >
            {document.description}
          </Text>

          {document.expiry_date ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: spacing[3],
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={15}
                color={
                  colors.textMuted
                }
              />

              <Text
                style={{
                  color:
                    colors.textMuted,
                  marginLeft: spacing[2],
                  fontSize:
                    typography.caption
                      .fontSize,
                }}
              >
                Validade:{" "}
                {document.expiry_date}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function getStatusConfig(
  status: DocumentStatus
): {
  label: string;
  color: string;
  background: string;
  icon: keyof typeof Ionicons.glyphMap;
} {
  if (status === "valid") {
    return {
      label: "Válido",
      color: colors.success,
      background:
        "rgba(34, 197, 94, 0.14)",
      icon:
        "checkmark-circle-outline",
    };
  }

  if (status === "expiring") {
    return {
      label: "A expirar",
      color: colors.warning,
      background:
        "rgba(245, 158, 11, 0.14)",
      icon: "time-outline",
    };
  }

  return {
    label: "Pendente",
    color: colors.danger,
    background:
      "rgba(255, 45, 45, 0.14)",
    icon: "alert-circle-outline",
  };
}
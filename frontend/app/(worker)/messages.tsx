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
  TextInput,
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

type WorkerMessage = {
  id: number;
  sender: string;
  role: string;
  preview: string;
  time: string;
  unread: number;
  online: boolean;
};

type WorkerMessagesResponse = {
  unread_total: number;
  messages: WorkerMessage[];
};

export default function WorkerMessagesScreen() {
  const [data, setData] =
    useState<WorkerMessagesResponse | null>(null);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        setError("");

        const result =
          await api.get<WorkerMessagesResponse>(
            "/worker/messages"
          );

        setData(result);
      } catch (caughtError) {
        console.error(
          "Erro ao carregar mensagens:",
          caughtError
        );

        setError(
          "Não foi possível carregar as mensagens."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadMessages();
  }, []);

  const visibleMessages = useMemo(() => {
    const messages =
      data?.messages ?? [];

    const normalizedSearch =
      search.trim().toLowerCase();

    if (!normalizedSearch) {
      return messages;
    }

    return messages.filter((message) =>
      `${message.sender} ${message.role}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [data, search]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
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
          A carregar mensagens...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
      contentContainerStyle={{
        padding: spacing[5],
        paddingBottom: spacing[16],
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Header
        unread={data?.unread_total ?? 0}
      />

      {error ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.danger,
            borderRadius: radius.medium,
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
          flexDirection: "row",
          alignItems: "center",
          minHeight: 50,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.medium,
          paddingHorizontal: spacing[4],
          marginBottom: spacing[5],
        }}
      >
        <Ionicons
          name="search-outline"
          size={19}
          color={colors.textMuted}
        />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Pesquisar conversas"
          placeholderTextColor={
            colors.textDisabled
          }
          selectionColor={colors.worker}
          style={{
            flex: 1,
            color: colors.text,
            fontSize: 15,
            marginLeft: spacing[3],
          }}
        />

        {search ? (
          <Pressable
            onPress={() => setSearch("")}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: spacing[3],
          marginBottom: spacing[6],
        }}
      >
        <QuickAction
          icon="people-outline"
          label="Equipa"
        />

        <QuickAction
          icon="business-outline"
          label="Empresa"
        />

        <QuickAction
          icon="headset-outline"
          label="Suporte"
        />
      </View>

      <Text
        style={{
          color: colors.text,
          fontSize:
            typography.heading.fontSize,
          fontWeight:
            typography.heading.fontWeight,
          marginBottom: spacing[3],
        }}
      >
        Conversas
      </Text>

      {visibleMessages.length > 0 ? (
        visibleMessages.map((message) => (
          <MessageCard
            key={message.id}
            message={message}
          />
        ))
      ) : (
        <View
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.large,
            padding: spacing[5],
          }}
        >
          <Text
            style={{
              color: colors.textMuted,
            }}
          >
            Não foram encontradas conversas.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function Header({
  unread,
}: {
  unread: number;
}) {
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
          Mensagens
        </Text>

        <Text
          style={{
            color: colors.textMuted,
            marginTop: spacing[1],
          }}
        >
          {unread} mensagens por ler
        </Text>
      </View>

      <Pressable
        style={{
          width: 42,
          height: 42,
          borderWidth: 1,
          borderColor: colors.worker,
          borderRadius: radius.pill,
          backgroundColor:
            colors.workerSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name="create-outline"
          size={20}
          color={colors.worker}
        />
      </Pressable>
    </View>
  );
}

function QuickAction({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <Pressable
      style={{
        flex: 1,
        minHeight: 78,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.large,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons
        name={icon}
        size={21}
        color={colors.worker}
      />

      <Text
        style={{
          color: colors.text,
          fontSize: 12,
          fontWeight: "700",
          marginTop: spacing[2],
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function MessageCard({
  message,
}: {
  message: WorkerMessage;
}) {
  return (
    <Pressable
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor:
          message.unread > 0
            ? colors.worker
            : colors.border,
        borderRadius: radius.large,
        padding: spacing[4],
        marginBottom: spacing[3],
      }}
    >
      <View>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.pill,
            backgroundColor:
              colors.workerSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: colors.worker,
              fontSize: 17,
              fontWeight: "900",
            }}
          >
            {getInitials(
              message.sender
            )}
          </Text>
        </View>

        {message.online ? (
          <View
            style={{
              position: "absolute",
              right: 0,
              bottom: 1,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor:
                colors.success,
              borderWidth: 2,
              borderColor:
                colors.surface,
            }}
          />
        ) : null}
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
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              color: colors.text,
              fontSize: 15,
              fontWeight:
                message.unread > 0
                  ? "800"
                  : "700",
            }}
          >
            {message.sender}
          </Text>

          <Text
            style={{
              color:
                message.unread > 0
                  ? colors.worker
                  : colors.textMuted,
              fontSize: 11,
              fontWeight: "700",
              marginLeft: spacing[2],
            }}
          >
            {message.time}
          </Text>
        </View>

        <Text
          style={{
            color: colors.worker,
            fontSize: 11,
            fontWeight: "700",
            marginTop: 2,
          }}
        >
          {message.role}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: spacing[2],
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              color: colors.textMuted,
              fontSize: 13,
            }}
          >
            {message.preview}
          </Text>

          {message.unread > 0 ? (
            <View
              style={{
                minWidth: 21,
                height: 21,
                borderRadius: 11,
                backgroundColor:
                  colors.worker,
                alignItems: "center",
                justifyContent: "center",
                marginLeft: spacing[2],
                paddingHorizontal: 6,
              }}
            >
              <Text
                style={{
                  color: colors.white,
                  fontSize: 11,
                  fontWeight: "900",
                }}
              >
                {message.unread}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function getInitials(
  name: string
) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
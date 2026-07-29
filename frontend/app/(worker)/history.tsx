import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { api } from "@/src/api/client";
import HistoryCard, {
  WorkerJob,
} from "@/src/components/worker/HistoryCard";
import HistoryFilters, {
  HistoryFilter,
} from "@/src/components/worker/HistoryFilters";
import HistorySummary from "@/src/components/worker/HistorySummary";
import {
  colors,
  radius,
  spacing,
  typography,
} from "@/src/design";

type WorkerJobsSummary = {
  total_jobs: number;
  completed_jobs: number;
  total_hours: number;
  total_earnings: number;
  average_rating: number;
};

type WorkerJobsResponse = {
  summary: WorkerJobsSummary;
  jobs: WorkerJob[];
};

type SortMode =
  | "recent"
  | "oldest"
  | "highest_amount"
  | "highest_rating";

export default function WorkerHistoryScreen() {
  const [data, setData] =
    useState<WorkerJobsResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [activeFilter, setActiveFilter] =
    useState<HistoryFilter>("all");

  const [sortMode, setSortMode] =
    useState<SortMode>("recent");

  const [showSortOptions, setShowSortOptions] =
    useState(false);

  const loadHistory = useCallback(async () => {
    try {
      setError("");

      const result =
        await api.get<WorkerJobsResponse>(
          "/worker/jobs"
        );

      setData(result);
    } catch (caughtError) {
      console.error(
        "Erro ao carregar histórico:",
        caughtError
      );

      setError(
        "Não foi possível carregar o histórico de trabalhos."
      );
    }
  }, []);

  useEffect(() => {
    const initialLoad = async () => {
      try {
        setLoading(true);
        await loadHistory();
      } finally {
        setLoading(false);
      }
    };

    void initialLoad();
  }, [loadHistory]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadHistory();
    } finally {
      setRefreshing(false);
    }
  };

  const visibleJobs = useMemo(() => {
    const jobs = [...(data?.jobs ?? [])];

    const normalizedSearch =
      search.trim().toLowerCase();

    const filteredJobs = jobs.filter(
      (job) => {
        const matchesSearch =
          !normalizedSearch ||
          `${job.project_name} ${job.company} ${job.location}`
            .toLowerCase()
            .includes(normalizedSearch);

        const matchesFilter =
          activeFilter === "all" ||
          (activeFilter === "completed" &&
            job.status === "completed") ||
          (activeFilter === "in_progress" &&
            job.status === "in_progress") ||
          (activeFilter === "paid" &&
            job.payment_status === "paid") ||
          (activeFilter === "pending" &&
            job.payment_status === "pending");

        return matchesSearch && matchesFilter;
      }
    );

    return filteredJobs.sort((first, second) => {
      if (sortMode === "oldest") {
        return (
          new Date(first.start_date).getTime() -
          new Date(second.start_date).getTime()
        );
      }

      if (sortMode === "highest_amount") {
        return second.amount - first.amount;
      }

      if (sortMode === "highest_rating") {
        return (
          (second.rating ?? 0) -
          (first.rating ?? 0)
        );
      }

      return (
        new Date(second.start_date).getTime() -
        new Date(first.start_date).getTime()
      );
    });
  }, [
    activeFilter,
    data,
    search,
    sortMode,
  ]);

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
          A carregar histórico...
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
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.worker}
        />
      }
    >
      <Header
        onSortPress={() =>
          setShowSortOptions(
            (current) => !current
          )
        }
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

          <Pressable
            onPress={loadHistory}
            style={{
              alignSelf: "flex-start",
              marginTop: spacing[3],
            }}
          >
            <Text
              style={{
                color: colors.worker,
                fontWeight: "800",
              }}
            >
              Tentar novamente
            </Text>
          </Pressable>
        </View>
      ) : null}

      <HistorySummary
        totalJobs={
          data?.summary.total_jobs ?? 0
        }
        completedJobs={
          data?.summary.completed_jobs ?? 0
        }
        totalHours={
          data?.summary.total_hours ?? 0
        }
        totalEarnings={
          data?.summary.total_earnings ?? 0
        }
        averageRating={
          data?.summary.average_rating ?? 0
        }
      />

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
          marginBottom: spacing[4],
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
          placeholder="Pesquisar obra, empresa ou local"
          placeholderTextColor={
            colors.textDisabled
          }
          selectionColor={colors.worker}
          autoCorrect={false}
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

      {showSortOptions ? (
        <SortOptions
          activeSort={sortMode}
          onChange={(nextSort) => {
            setSortMode(nextSort);
            setShowSortOptions(false);
          }}
        />
      ) : null}

      <HistoryFilters
        activeFilter={activeFilter}
        onChange={setActiveFilter}
      />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: spacing[3],
        }}
      >
        <View>
          <Text
            style={{
              color: colors.text,
              fontSize:
                typography.heading.fontSize,
              fontWeight:
                typography.heading.fontWeight,
            }}
          >
            Trabalhos
          </Text>

          <Text
            style={{
              color: colors.textMuted,
              fontSize:
                typography.caption.fontSize,
              marginTop: 2,
            }}
          >
            {visibleJobs.length} resultados
          </Text>
        </View>

        <Text
          style={{
            color: colors.worker,
            fontSize:
              typography.caption.fontSize,
            fontWeight: "700",
          }}
        >
          {getSortLabel(sortMode)}
        </Text>
      </View>

      {visibleJobs.length > 0 ? (
        visibleJobs.map((job) => (
          <HistoryCard
            key={job.id}
            job={job}
          />
        ))
      ) : (
        <EmptyState />
      )}
    </ScrollView>
  );
}

function Header({
  onSortPress,
}: {
  onSortPress: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
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
          Histórico
        </Text>

        <Text
          style={{
            color: colors.textMuted,
            marginTop: spacing[1],
          }}
        >
          Obras, horas e pagamentos
        </Text>
      </View>

      <Pressable
        onPress={onSortPress}
        style={{
          width: 42,
          height: 42,
          borderWidth: 1,
          borderColor: colors.worker,
          borderRadius: radius.pill,
          backgroundColor: colors.workerSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name="swap-vertical-outline"
          size={20}
          color={colors.worker}
        />
      </Pressable>
    </View>
  );
}

function SortOptions({
  activeSort,
  onChange,
}: {
  activeSort: SortMode;
  onChange: (sort: SortMode) => void;
}) {
  const options: {
    value: SortMode;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    {
      value: "recent",
      label: "Mais recentes",
      icon: "time-outline",
    },
    {
      value: "oldest",
      label: "Mais antigos",
      icon: "calendar-outline",
    },
    {
      value: "highest_amount",
      label: "Maior valor",
      icon: "cash-outline",
    },
    {
      value: "highest_rating",
      label: "Melhor avaliação",
      icon: "star-outline",
    },
  ];

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.large,
        padding: spacing[2],
        marginBottom: spacing[4],
      }}
    >
      {options.map((option) => {
        const active =
          option.value === activeSort;

        return (
          <Pressable
            key={option.value}
            onPress={() =>
              onChange(option.value)
            }
            style={{
              flexDirection: "row",
              alignItems: "center",
              minHeight: 46,
              borderRadius: radius.medium,
              paddingHorizontal: spacing[3],
              backgroundColor: active
                ? colors.workerSoft
                : colors.transparent,
            }}
          >
            <Ionicons
              name={option.icon}
              size={18}
              color={
                active
                  ? colors.worker
                  : colors.textMuted
              }
            />

            <Text
              style={{
                flex: 1,
                color: active
                  ? colors.worker
                  : colors.text,
                fontWeight: active
                  ? "800"
                  : "600",
                marginLeft: spacing[3],
              }}
            >
              {option.label}
            </Text>

            {active ? (
              <Ionicons
                name="checkmark"
                size={18}
                color={colors.worker}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function EmptyState() {
  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.large,
        padding: spacing[8],
      }}
    >
      <View
        style={{
          width: 58,
          height: 58,
          borderRadius: radius.pill,
          backgroundColor: colors.workerSoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name="briefcase-outline"
          size={26}
          color={colors.worker}
        />
      </View>

      <Text
        style={{
          color: colors.text,
          fontSize: 17,
          fontWeight: "800",
          marginTop: spacing[4],
        }}
      >
        Sem resultados
      </Text>

      <Text
        style={{
          color: colors.textMuted,
          textAlign: "center",
          lineHeight: 19,
          marginTop: spacing[2],
        }}
      >
        Não existem trabalhos que correspondam à pesquisa ou ao filtro selecionado.
      </Text>
    </View>
  );
}

function getSortLabel(
  sortMode: SortMode
) {
  if (sortMode === "oldest") {
    return "Mais antigos";
  }

  if (sortMode === "highest_amount") {
    return "Maior valor";
  }

  if (sortMode === "highest_rating") {
    return "Melhor avaliação";
  }

  return "Mais recentes";
}
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { api } from "../src/api/client";
import WorkerInspector from "../src/components/teams/WorkerInspector";

type Worker = {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
  age?: number;
  country?: string;
  country_code?: string;
  flag?: string;
  specialty?: string;
  title?: string;
  available?: boolean;
  trust_score?: number;
  productivity_score?: number;
  quality_score?: number;
  punctuality_score?: number;
  overall_score?: number;
};

type Project = {
  id: string;
  name?: string;
  title?: string;
  location?: string;
  status?: string;
};

type Team = {
  id: string;
  name: string;
  description?: string;
  specialty?: string;
  status?: "available" | "in_project" | "inactive" | string;
  country?: string;
  city?: string;
  company_id?: string;
  member_ids?: string[];
  members?: Worker[];
  leader_id?: string | null;
  leader?: Worker | null;
  project_id?: string | null;
  project?: Project | null;
  member_count?: number;
  team_score?: number;
  average_trust?: number;
  average_productivity?: number;
};

type TeamForm = {
  name: string;
  description: string;
  specialty: string;
  country: string;
  city: string;
  status: string;
  project_id: string;
};

const EMPTY_FORM: TeamForm = {
  name: "",
  description: "",
  specialty: "",
  country: "",
  city: "",
  status: "available",
  project_id: "",
};

const COLORS = {
  background: "#F4F6FA",
  surface: "#FFFFFF",
  text: "#111827",
  muted: "#64748B",
  line: "#E2E8F0",
  orange: "#F97316",
  orangeSoft: "#FFF7ED",
  dark: "#0F172A",
  green: "#16A34A",
  greenSoft: "#F0FDF4",
  red: "#DC2626",
  redSoft: "#FEF2F2",
  blue: "#2563EB",
  blueSoft: "#EFF6FF",
  yellow: "#EAB308",
};

function numberScore(value?: number) {
  const parsed = Number(value || 0);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.min(10, parsed));
}

function workerName(worker?: Worker | null) {
  return worker?.name || worker?.email || "Trabalhador";
}

function initials(name?: string) {
  const safeName = name?.trim() || "T";

  return safeName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getFlag(worker: Worker) {
  if (worker.flag) {
    return worker.flag;
  }

  const code = worker.country_code?.trim().toUpperCase();

  if (!code || code.length !== 2) {
    return "🌍";
  }

  return String.fromCodePoint(
    ...code.split("").map((character) => 127397 + character.charCodeAt(0))
  );
}

function statusInfo(status?: string) {
  switch (status) {
    case "in_project":
      return {
        label: "Em obra",
        color: COLORS.blue,
        background: COLORS.blueSoft,
        icon: "construct-outline" as const,
      };

    case "inactive":
      return {
        label: "Inativa",
        color: COLORS.red,
        background: COLORS.redSoft,
        icon: "pause-circle-outline" as const,
      };

    default:
      return {
        label: "Disponível",
        color: COLORS.green,
        background: COLORS.greenSoft,
        icon: "checkmark-circle-outline" as const,
      };
  }
}

function ScoreBadge({
  value,
  compact = false,
}: {
  value?: number;
  compact?: boolean;
}) {
  const score = numberScore(value);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#111827",
        borderRadius: 999,
        paddingHorizontal: compact ? 8 : 11,
        paddingVertical: compact ? 5 : 7,
      }}
    >
      <Ionicons name="star" size={compact ? 13 : 16} color="#FACC15" />

      <Text
        style={{
          color: "#FFFFFF",
          fontWeight: "900",
          marginLeft: 5,
          fontSize: compact ? 12 : 14,
        }}
      >
        {score.toFixed(1)}
      </Text>
    </View>
  );
}

function ScoreBar({
  label,
  value,
  icon,
}: {
  label: string;
  value?: number;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}) {
  const score = numberScore(value);
  const width = `${score * 10}%` as `${number}%`;

  return (
    <View style={{ marginBottom: 10 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 5,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name={icon} size={14} color={COLORS.muted} />

          <Text
            style={{
              color: COLORS.muted,
              fontSize: 12,
              marginLeft: 5,
              fontWeight: "600",
            }}
          >
            {label}
          </Text>
        </View>

        <Text
          style={{
            color: COLORS.text,
            fontSize: 12,
            fontWeight: "800",
          }}
        >
          {score.toFixed(1)}
        </Text>
      </View>

      <View
        style={{
          height: 6,
          borderRadius: 999,
          backgroundColor: "#E5E7EB",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width,
            height: "100%",
            backgroundColor: COLORS.orange,
            borderRadius: 999,
          }}
        />
      </View>
    </View>
  );
}

function WorkerAvatar({
  worker,
  size = 82,
  leader = false,
}: {
  worker: Worker;
  size?: number;
  leader?: boolean;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 4,
        borderColor: leader ? "#FACC15" : COLORS.orange,
        backgroundColor: "#E2E8F0",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {worker.avatar ? (
        <Image
          source={{ uri: worker.avatar }}
          style={{
            width: size - 8,
            height: size - 8,
            borderRadius: (size - 8) / 2,
          }}
        />
      ) : (
        <Text
          style={{
            color: COLORS.dark,
            fontWeight: "900",
            fontSize: size * 0.28,
          }}
        >
          {initials(workerName(worker))}
        </Text>
      )}

      <View
        style={{
          position: "absolute",
          right: -5,
          bottom: -2,
          minWidth: 28,
          height: 28,
          paddingHorizontal: 4,
          borderRadius: 14,
          backgroundColor: COLORS.surface,
          borderWidth: 2,
          borderColor: COLORS.line,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 16 }}>{getFlag(worker)}</Text>
      </View>

      {leader && (
        <View
          style={{
            position: "absolute",
            top: -17,
            backgroundColor: "#FACC15",
            width: 30,
            height: 30,
            borderRadius: 15,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="ribbon" size={17} color="#713F12" />
        </View>
      )}
    </View>
  );
}

function WorkerCard({
  worker,
  isMember,
  isLeader,
  busy,
  onPress,
  onAdd,
  onRemove,
  onSetLeader,
}: {
  worker: Worker;
  isMember: boolean;
  isLeader: boolean;
  busy: boolean;
  onPress?: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
  onSetLeader?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 260,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: isLeader ? "#FACC15" : COLORS.line,
        borderRadius: 22,
        padding: 17,
        marginRight: 14,
        shadowColor: "#000000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <WorkerAvatar worker={worker} leader={isLeader} />

        <ScoreBadge value={worker.overall_score} />
      </View>

      <Text
        numberOfLines={1}
        style={{
          marginTop: 17,
          color: COLORS.text,
          fontSize: 18,
          fontWeight: "900",
        }}
      >
        {workerName(worker)}
      </Text>

      <Text
        numberOfLines={1}
        style={{
          color: COLORS.orange,
          fontSize: 13,
          fontWeight: "800",
          marginTop: 3,
          textTransform: "uppercase",
        }}
      >
        {worker.specialty || worker.title || "Profissional"}
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          marginTop: 8,
        }}
      >
        {!!worker.age && (
          <Text style={{ color: COLORS.muted, fontSize: 12, marginRight: 10 }}>
            {worker.age} anos
          </Text>
        )}

        {!!worker.country && (
          <Text style={{ color: COLORS.muted, fontSize: 12 }}>
            {worker.country}
          </Text>
        )}
      </View>

      {isLeader && (
        <View
          style={{
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FEF9C3",
            borderRadius: 999,
            paddingHorizontal: 9,
            paddingVertical: 5,
            marginTop: 10,
          }}
        >
          <Ionicons name="ribbon" size={14} color="#A16207" />

          <Text
            style={{
              marginLeft: 5,
              color: "#854D0E",
              fontSize: 11,
              fontWeight: "900",
            }}
          >
            CHEFE DE EQUIPA
          </Text>
        </View>
      )}

      <View style={{ marginTop: 17 }}>
        <ScoreBar
          label="Confiança"
          value={worker.trust_score}
          icon="shield-checkmark-outline"
        />

        <ScoreBar
          label="Produtividade"
          value={worker.productivity_score}
          icon="flash-outline"
        />

        <ScoreBar
          label="Qualidade"
          value={worker.quality_score}
          icon="diamond-outline"
        />

        <ScoreBar
          label="Pontualidade"
          value={worker.punctuality_score}
          icon="time-outline"
        />
      </View>

      {isMember ? (
        <View style={{ marginTop: 8 }}>
          {!isLeader && (
            <Pressable
              disabled={busy}
              onPress={onSetLeader}
              style={{
                backgroundColor: "#FEF9C3",
                borderRadius: 12,
                paddingVertical: 11,
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text style={{ color: "#854D0E", fontWeight: "800" }}>
                Definir como chefe
              </Text>
            </Pressable>
          )}

          <Pressable
            disabled={busy}
            onPress={onRemove}
            style={{
              backgroundColor: COLORS.redSoft,
              borderRadius: 12,
              paddingVertical: 11,
              alignItems: "center",
            }}
          >
            <Text style={{ color: COLORS.red, fontWeight: "800" }}>
              Retirar da equipa
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          disabled={busy}
          onPress={onAdd}
          style={{
            marginTop: 8,
            backgroundColor: COLORS.dark,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>
            Adicionar à equipa
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 13 }}>
      <Text
        style={{
          color: COLORS.text,
          fontWeight: "700",
          fontSize: 13,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={{
          borderWidth: 1,
          borderColor: COLORS.line,
          borderRadius: 12,
          paddingHorizontal: 13,
          paddingVertical: 12,
          minHeight: multiline ? 90 : undefined,
          color: COLORS.text,
          backgroundColor: "#FFFFFF",
        }}
      />
    </View>
  );
}

export default function TeamsScreen() {
  const router = useRouter();

  const [teams, setTeams] = useState<Team[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [form, setForm] = useState<TeamForm>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<TeamForm>(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId) || null,
    [teams, selectedTeamId]
  );

  const memberIds = useMemo(
    () => new Set(selectedTeam?.member_ids || []),
    [selectedTeam]
  );

  const availableWorkers = useMemo(
    () => workers.filter((worker) => !memberIds.has(worker.id)),
    [workers, memberIds]
  );

  const updateForm = (key: keyof TeamForm, value: string) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateEditForm = (key: keyof TeamForm, value: string) => {
    setEditForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const loadTeams = async (preferredTeamId?: string) => {
    const data = await api.get<Team[]>("/teams");

    setTeams(data);

    const nextId =
      preferredTeamId ||
      (data.some((team) => team.id === selectedTeamId)
        ? selectedTeamId
        : data[0]?.id || "");

    setSelectedTeamId(nextId);
  };

  const loadWorkers = async (query = "") => {
    const suffix = query.trim()
      ? `?q=${encodeURIComponent(query.trim())}`
      : "";

    const data = await api.get<Worker[]>(
      `/teams/available-workers${suffix}`
    );

    setWorkers(data);
  };

  const loadEverything = async () => {
    try {
      setLoading(true);

      await Promise.all([loadTeams(), loadWorkers()]);
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível carregar a gestão de equipas."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEverything();
  }, []);

  const openEdit = () => {
    if (!selectedTeam) {
      return;
    }

    setEditForm({
      name: selectedTeam.name || "",
      description: selectedTeam.description || "",
      specialty: selectedTeam.specialty || "",
      country: selectedTeam.country || "",
      city: selectedTeam.city || "",
      status: selectedTeam.status || "available",
      project_id: selectedTeam.project_id || "",
    });

    setShowEdit(true);
  };

  const createTeam = async () => {
    if (!form.name.trim()) {
      Alert.alert("Campo obrigatório", "Escreve o nome da equipa.");
      return;
    }

    try {
      setBusyAction("create");

      const created = await api.post<Team>("/teams", {
        name: form.name.trim(),
        description: form.description.trim() || null,
        specialty: form.specialty.trim() || null,
        country: form.country.trim() || null,
        city: form.city.trim() || null,
        status: form.status || "available",
        project_id: form.project_id.trim() || null,
        leader_id: null,
      });

      setForm(EMPTY_FORM);
      setShowCreate(false);

      await loadTeams(created.id);

      Alert.alert("Sucesso", "Equipa criada com sucesso.");
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível criar a equipa."
      );
    } finally {
      setBusyAction("");
    }
  };

  const saveTeam = async () => {
    if (!selectedTeam) {
      return;
    }

    if (!editForm.name.trim()) {
      Alert.alert("Campo obrigatório", "Escreve o nome da equipa.");
      return;
    }

    try {
      setBusyAction("edit");

      await api.post(`/teams/${selectedTeam.id}/update`, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        specialty: editForm.specialty.trim() || null,
        country: editForm.country.trim() || null,
        city: editForm.city.trim() || null,
        status: editForm.status || "available",
        project_id: editForm.project_id.trim() || null,
        leader_id: selectedTeam.leader_id || null,
      });

      setShowEdit(false);

      await loadTeams(selectedTeam.id);

      Alert.alert("Sucesso", "Equipa atualizada.");
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível atualizar a equipa."
      );
    } finally {
      setBusyAction("");
    }
  };

 const deleteSelectedTeam = async () => {
  if (!selectedTeam) {
    return;
  }

  try {
    setBusyAction("delete");

    await api.post(`/teams/${selectedTeam.id}/delete`, {});

    setSelectedTeamId("");
    setShowEdit(false);

    await loadTeams();

    if (Platform.OS === "web") {
      window.alert("Equipa apagada com sucesso.");
    } else {
      Alert.alert("Sucesso", "Equipa apagada com sucesso.");
    }
  } catch (error: any) {
    const message =
      error?.message || "Não foi possível apagar a equipa.";

    if (Platform.OS === "web") {
      window.alert(message);
    } else {
      Alert.alert("Erro", message);
    }
  } finally {
    setBusyAction("");
  }
};

const deleteTeam = () => {
  if (!selectedTeam) {
    return;
  }

  const message = `Tens a certeza de que pretendes apagar "${selectedTeam.name}"?`;

  if (Platform.OS === "web") {
    const confirmed = window.confirm(message);

    if (confirmed) {
      void deleteSelectedTeam();
    }

    return;
  }

  Alert.alert("Apagar equipa", message, [
    {
      text: "Cancelar",
      style: "cancel",
    },
    {
      text: "Apagar",
      style: "destructive",
      onPress: () => {
        void deleteSelectedTeam();
      },
    },
  ]);
};

  const addWorker = async (worker: Worker) => {
    if (!selectedTeam) {
      Alert.alert("Seleciona uma equipa", "Escolhe primeiro uma equipa.");
      return;
    }

    try {
      setBusyAction(`add-${worker.id}`);

      await api.post(
        `/teams/${selectedTeam.id}/members/${worker.id}`,
        {}
      );

      await loadTeams(selectedTeam.id);
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível adicionar o trabalhador."
      );
    } finally {
      setBusyAction("");
    }
  };

  const removeWorker = async (worker: Worker) => {
    if (!selectedTeam) {
      return;
    }

    try {
      setBusyAction(`remove-${worker.id}`);

      await api.post(
        `/teams/${selectedTeam.id}/remove-member/${worker.id}`,
        {}
      );

      await loadTeams(selectedTeam.id);
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível retirar o trabalhador."
      );
    } finally {
      setBusyAction("");
    }
  };

  const setLeader = async (worker: Worker) => {
    if (!selectedTeam) {
      return;
    }

    try {
      setBusyAction(`leader-${worker.id}`);

      await api.post(
        `/teams/${selectedTeam.id}/leader/${worker.id}`,
        {}
      );

      await loadTeams(selectedTeam.id);
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível definir o chefe da equipa."
      );
    } finally {
      setBusyAction("");
    }
  };

  const setStatus = async (status: string) => {
    if (!selectedTeam) {
      return;
    }

    try {
      setBusyAction(`status-${status}`);

      await api.post(
        `/teams/${selectedTeam.id}/status/${status}`,
        {}
      );

      await loadTeams(selectedTeam.id);
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível mudar o estado."
      );
    } finally {
      setBusyAction("");
    }
  };

  const searchWorkers = async () => {
    try {
      setBusyAction("search");
      await loadWorkers(search);
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error?.message || "Não foi possível procurar trabalhadores."
      );
    } finally {
      setBusyAction("");
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={COLORS.orange} />

        <Text style={{ marginTop: 12, color: COLORS.muted }}>
          A carregar equipas...
        </Text>
      </View>
    );
  }

  const currentStatus = statusInfo(selectedTeam?.status);

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
      }}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: 70,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.line,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 13,
            }}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.dark} />
          </Pressable>

          <View>
            <Text
              style={{
                color: COLORS.text,
                fontSize: 28,
                fontWeight: "900",
              }}
            >
              Gerir Equipas
            </Text>

            <Text style={{ color: COLORS.muted, marginTop: 3 }}>
              Cria, edita e organiza as tuas equipas.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => setShowCreate((current) => !current)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: COLORS.orange,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 13,
            marginTop: 8,
          }}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />

          <Text
            style={{
              color: "#FFFFFF",
              fontWeight: "900",
              marginLeft: 6,
            }}
          >
            Nova equipa
          </Text>
        </Pressable>
      </View>

      {showCreate && (
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 20,
            padding: 18,
            borderWidth: 1,
            borderColor: COLORS.line,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              color: COLORS.text,
              fontSize: 19,
              fontWeight: "900",
              marginBottom: 16,
            }}
          >
            Criar nova equipa
          </Text>

          <Field
            label="Nome"
            value={form.name}
            onChangeText={(value) => updateForm("name", value)}
            placeholder="Ex.: Equipa Soldadores TIG"
          />

          <Field
            label="Descrição"
            value={form.description}
            onChangeText={(value) => updateForm("description", value)}
            placeholder="Descrição das competências da equipa"
            multiline
          />

          <Field
            label="Especialidade"
            value={form.specialty}
            onChangeText={(value) => updateForm("specialty", value)}
            placeholder="Ex.: Soldadura industrial"
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field
                label="País"
                value={form.country}
                onChangeText={(value) => updateForm("country", value)}
                placeholder="Portugal"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Field
                label="Cidade"
                value={form.city}
                onChangeText={(value) => updateForm("city", value)}
                placeholder="Lisboa"
              />
            </View>
          </View>

          <Pressable
            disabled={busyAction === "create"}
            onPress={createTeam}
            style={{
              backgroundColor: COLORS.orange,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>
              {busyAction === "create" ? "A criar..." : "Criar equipa"}
            </Text>
          </Pressable>
        </View>
      )}

      <Text
        style={{
          color: COLORS.text,
          fontSize: 20,
          fontWeight: "900",
          marginBottom: 12,
        }}
      >
        As minhas equipas
      </Text>

      {teams.length === 0 ? (
        <View
          style={{
            backgroundColor: COLORS.surface,
            borderRadius: 20,
            padding: 30,
            borderWidth: 1,
            borderColor: COLORS.line,
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Ionicons name="people-outline" size={44} color="#94A3B8" />

          <Text
            style={{
              color: COLORS.text,
              fontWeight: "900",
              fontSize: 18,
              marginTop: 12,
            }}
          >
            Ainda não existem equipas
          </Text>

          <Text
            style={{
              color: COLORS.muted,
              textAlign: "center",
              marginTop: 5,
            }}
          >
            Cria a primeira equipa para começar a selecionar trabalhadores.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 25 }}
        >
          {teams.map((team) => {
            const selected = team.id === selectedTeamId;
            const info = statusInfo(team.status);

            return (
              <Pressable
                key={team.id}
                onPress={() => setSelectedTeamId(team.id)}
                style={{
                  width: 285,
                  backgroundColor: selected
                    ? COLORS.orangeSoft
                    : COLORS.surface,
                  borderRadius: 19,
                  padding: 17,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? COLORS.orange : COLORS.line,
                  marginRight: 13,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: COLORS.text,
                        fontSize: 17,
                        fontWeight: "900",
                      }}
                    >
                      {team.name}
                    </Text>

                    <Text
                      numberOfLines={1}
                      style={{
                        color: COLORS.muted,
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      {team.specialty || "Equipa multidisciplinar"}
                    </Text>
                  </View>

                  <ScoreBadge value={team.team_score} compact />
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 15,
                  }}
                >
                  <Ionicons name="people-outline" size={17} color={COLORS.orange} />

                  <Text
                    style={{
                      color: COLORS.orange,
                      fontWeight: "800",
                      marginLeft: 6,
                    }}
                  >
                    {team.member_count ?? team.member_ids?.length ?? 0} membros
                  </Text>
                </View>

                <View
                  style={{
                    alignSelf: "flex-start",
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: info.background,
                    borderRadius: 999,
                    paddingHorizontal: 9,
                    paddingVertical: 5,
                    marginTop: 12,
                  }}
                >
                  <Ionicons name={info.icon} size={14} color={info.color} />

                  <Text
                    style={{
                      color: info.color,
                      fontWeight: "800",
                      fontSize: 11,
                      marginLeft: 5,
                    }}
                  >
                    {info.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {selectedTeam && (
        <>
          <View
            style={{
              backgroundColor: COLORS.dark,
              borderRadius: 24,
              padding: 21,
              marginBottom: 25,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                flexWrap: "wrap",
              }}
            >
              <View style={{ flex: 1, minWidth: 230, paddingRight: 12 }}>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 25,
                    fontWeight: "900",
                  }}
                >
                  {selectedTeam.name}
                </Text>

                <Text
                  style={{
                    color: "#CBD5E1",
                    lineHeight: 20,
                    marginTop: 7,
                  }}
                >
                  {selectedTeam.description || "Sem descrição."}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    marginTop: 13,
                  }}
                >
                  {!!selectedTeam.specialty && (
                    <Text style={{ color: "#FDBA74", marginRight: 14 }}>
                      {selectedTeam.specialty}
                    </Text>
                  )}

                  {!!selectedTeam.city && (
                    <Text style={{ color: "#CBD5E1" }}>
                      {selectedTeam.city}
                      {selectedTeam.country
                        ? `, ${selectedTeam.country}`
                        : ""}
                    </Text>
                  )}
                </View>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <ScoreBadge value={selectedTeam.team_score} />

                <Text
                  style={{
                    color: "#94A3B8",
                    fontSize: 11,
                    marginTop: 5,
                  }}
                >
                  TEAM SCORE
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                marginTop: 20,
                gap: 10,
              }}
            >
              <View
                style={{
                  backgroundColor: "#1E293B",
                  borderRadius: 14,
                  padding: 13,
                  minWidth: 140,
                }}
              >
                <Text style={{ color: "#94A3B8", fontSize: 11 }}>
                  CONFIANÇA MÉDIA
                </Text>

                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 20,
                    fontWeight: "900",
                    marginTop: 4,
                  }}
                >
                  {numberScore(selectedTeam.average_trust).toFixed(1)}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: "#1E293B",
                  borderRadius: 14,
                  padding: 13,
                  minWidth: 140,
                }}
              >
                <Text style={{ color: "#94A3B8", fontSize: 11 }}>
                  PRODUTIVIDADE
                </Text>

                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 20,
                    fontWeight: "900",
                    marginTop: 4,
                  }}
                >
                  {numberScore(
                    selectedTeam.average_productivity
                  ).toFixed(1)}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: "#1E293B",
                  borderRadius: 14,
                  padding: 13,
                  minWidth: 140,
                }}
              >
                <Text style={{ color: "#94A3B8", fontSize: 11 }}>
                  OBRA ATUAL
                </Text>

                <Text
                  numberOfLines={1}
                  style={{
                    color: "#FFFFFF",
                    fontSize: 15,
                    fontWeight: "800",
                    marginTop: 6,
                  }}
                >
                  {selectedTeam.project?.name ||
                    selectedTeam.project?.title ||
                    "Sem obra"}
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                marginTop: 18,
                gap: 9,
              }}
            >
              <Pressable
                onPress={openEdit}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  borderRadius: 11,
                  paddingHorizontal: 13,
                  paddingVertical: 10,
                }}
              >
                <Ionicons name="create-outline" size={17} color={COLORS.dark} />

                <Text
                  style={{
                    color: COLORS.dark,
                    fontWeight: "800",
                    marginLeft: 6,
                  }}
                >
                  Editar
                </Text>
              </Pressable>

              <Pressable
                onPress={deleteTeam}
                disabled={busyAction === "delete"}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#7F1D1D",
                  borderRadius: 11,
                  paddingHorizontal: 13,
                  paddingVertical: 10,
                }}
              >
                <Ionicons name="trash-outline" size={17} color="#FFFFFF" />

                <Text
                  style={{
                    color: "#FFFFFF",
                    fontWeight: "800",
                    marginLeft: 6,
                  }}
                >
                  Apagar
                </Text>
              </Pressable>
            </View>
          </View>

          {showEdit && (
            <View
              style={{
                backgroundColor: COLORS.surface,
                borderRadius: 20,
                padding: 18,
                borderWidth: 1,
                borderColor: COLORS.line,
                marginBottom: 25,
              }}
            >
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 19,
                  fontWeight: "900",
                  marginBottom: 16,
                }}
              >
                Editar equipa
              </Text>

              <Field
                label="Nome"
                value={editForm.name}
                onChangeText={(value) => updateEditForm("name", value)}
                placeholder="Nome da equipa"
              />

              <Field
                label="Descrição"
                value={editForm.description}
                onChangeText={(value) =>
                  updateEditForm("description", value)
                }
                placeholder="Descrição da equipa"
                multiline
              />

              <Field
                label="Especialidade"
                value={editForm.specialty}
                onChangeText={(value) =>
                  updateEditForm("specialty", value)
                }
                placeholder="Especialidade principal"
              />

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="País"
                    value={editForm.country}
                    onChangeText={(value) =>
                      updateEditForm("country", value)
                    }
                    placeholder="País"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Field
                    label="Cidade"
                    value={editForm.city}
                    onChangeText={(value) =>
                      updateEditForm("city", value)
                    }
                    placeholder="Cidade"
                  />
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {[
                  ["available", "Disponível"],
                  ["in_project", "Em obra"],
                  ["inactive", "Inativa"],
                ].map(([value, label]) => {
                  const active = editForm.status === value;

                  return (
                    <Pressable
                      key={value}
                      onPress={() => updateEditForm("status", value)}
                      style={{
                        backgroundColor: active
                          ? COLORS.orange
                          : COLORS.background,
                        borderRadius: 999,
                        paddingHorizontal: 13,
                        paddingVertical: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: active ? "#FFFFFF" : COLORS.muted,
                          fontWeight: "800",
                        }}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => setShowEdit(false)}
                  style={{
                    flex: 1,
                    backgroundColor: COLORS.background,
                    borderRadius: 12,
                    paddingVertical: 13,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: COLORS.text, fontWeight: "800" }}>
                    Cancelar
                  </Text>
                </Pressable>

                <Pressable
                  onPress={saveTeam}
                  disabled={busyAction === "edit"}
                  style={{
                    flex: 1,
                    backgroundColor: COLORS.orange,
                    borderRadius: 12,
                    paddingVertical: 13,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "900" }}>
                    Guardar alterações
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          <Text
            style={{
              color: COLORS.text,
              fontSize: 20,
              fontWeight: "900",
              marginBottom: 12,
            }}
          >
            Estado da equipa
          </Text>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 25,
            }}
          >
            {[
              ["available", "Disponível", "checkmark-circle-outline"],
              ["in_project", "Em obra", "construct-outline"],
              ["inactive", "Inativa", "pause-circle-outline"],
            ].map(([value, label, icon]) => {
              const active = selectedTeam.status === value;

              return (
                <Pressable
                  key={value}
                  disabled={busyAction === `status-${value}`}
                  onPress={() => setStatus(value)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: active
                      ? COLORS.orange
                      : COLORS.surface,
                    borderWidth: 1,
                    borderColor: active ? COLORS.orange : COLORS.line,
                    borderRadius: 13,
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                  }}
                >
                  <Ionicons
                    name={icon as React.ComponentProps<typeof Ionicons>["name"]}
                    size={18}
                    color={active ? "#FFFFFF" : COLORS.muted}
                  />

                  <Text
                    style={{
                      color: active ? "#FFFFFF" : COLORS.text,
                      fontWeight: "800",
                      marginLeft: 7,
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text
            style={{
              color: COLORS.text,
              fontSize: 20,
              fontWeight: "900",
              marginBottom: 12,
            }}
          >
            Plantel da equipa
          </Text>

          {selectedTeam.members && selectedTeam.members.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 28 }}
            >
              {selectedTeam.members.map((worker) => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  isMember
                  isLeader={selectedTeam.leader_id === worker.id}
                  busy={busyAction.includes(worker.id)}
                  onPress={() => setSelectedWorker(worker)}
                  onRemove={() => removeWorker(worker)}
                  onSetLeader={() => setLeader(worker)}
                />
              ))}
            </ScrollView>
          ) : (
            <View
              style={{
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.line,
                borderRadius: 18,
                padding: 22,
                marginBottom: 28,
              }}
            >
              <Text style={{ color: COLORS.muted }}>
                Esta equipa ainda não tem membros. Seleciona perfis abaixo.
              </Text>
            </View>
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: COLORS.text,
                fontSize: 20,
                fontWeight: "900",
              }}
            >
              Mercado de trabalhadores
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.line,
                borderRadius: 12,
                paddingLeft: 12,
                marginTop: 8,
                minWidth: 290,
              }}
            >
              <Ionicons name="search" size={18} color={COLORS.muted} />

              <TextInput
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={searchWorkers}
                placeholder="Nome, profissão, país..."
                placeholderTextColor="#94A3B8"
                style={{
                  flex: 1,
                  paddingHorizontal: 9,
                  paddingVertical: 11,
                  color: COLORS.text,
                }}
              />

              <Pressable
                onPress={searchWorkers}
                style={{
                  backgroundColor: COLORS.dark,
                  paddingHorizontal: 13,
                  paddingVertical: 12,
                  borderTopRightRadius: 11,
                  borderBottomRightRadius: 11,
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>
                  Procurar
                </Text>
              </Pressable>
            </View>
          </View>

          {availableWorkers.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {availableWorkers.map((worker) => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  isMember={false}
                  isLeader={false}
                  busy={busyAction.includes(worker.id)}
                  onPress={() => setSelectedWorker(worker)}
                  onAdd={() => addWorker(worker)}
                />
              ))}
            </ScrollView>
          ) : (
            <View
              style={{
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.line,
                borderRadius: 18,
                padding: 22,
              }}
            >
              <Text style={{ color: COLORS.muted }}>
                Não foram encontrados outros trabalhadores disponíveis.
              </Text>
            </View>
          )}

          <WorkerInspector
            worker={selectedWorker}
            isLeader={
              !!selectedWorker && selectedTeam.leader_id === selectedWorker.id
            }
            isMember={
              !!selectedWorker && memberIds.has(selectedWorker.id)
            }
            onClose={() => setSelectedWorker(null)}
            onSetLeader={
              selectedWorker ? () => setLeader(selectedWorker) : undefined
            }
            onRemove={
              selectedWorker ? () => removeWorker(selectedWorker) : undefined
            }
          />
        </>
      )}
    </ScrollView>
  );
}
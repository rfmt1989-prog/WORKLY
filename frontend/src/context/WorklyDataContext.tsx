import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

import { ApiError, api } from "@/src/api/client";
import { localizeApiError } from "@/src/demo/apiErrorI18n";
import { uiText } from "@/src/demo/fullUi";
import type {
  Attendance,
  Company,
  LanguageCode,
  Project,
  Team,
  ToastMessage,
  ToastTone,
  Worker,
  WorklyState,
} from "@/src/demo/types";
import { storage } from "@/src/utils/storage";

import { useAuth } from "./AuthContext";

const STATE_STORAGE_KEY = "workly_demo_state:v1";
const LANGUAGE_STORAGE_KEY = "workly_language:v1";
const SERVER_SYNC_INTERVAL_MS = 4_000;

type CheckInLocation = {
  latitude: number | null;
  longitude: number | null;
  location_mode: "gps" | "demo";
};

type WorklyDataValue = {
  state: WorklyState | null;
  loading: boolean;
  error: string | null;
  language: LanguageCode;
  toast: ToastMessage | null;
  setLanguage: (language: LanguageCode) => void;
  reload: (forceRemote?: boolean) => Promise<void>;
  resetDemo: () => Promise<void>;
  dismissToast: () => void;
  notify: (message: string, tone?: ToastTone) => void;
  updateWorker: (workerId: string, patch: Partial<Worker>) => Promise<void>;
  updateCompany: (companyId: string, patch: Partial<Company>) => Promise<void>;
  createTeam: (input: Omit<Team, "id" | "company_id">) => Promise<Team>;
  updateTeam: (teamId: string, patch: Partial<Team>) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  addTeamMember: (teamId: string, workerId: string) => Promise<void>;
  removeTeamMember: (teamId: string, workerId: string) => Promise<void>;
  setTeamLeader: (teamId: string, workerId: string) => Promise<void>;
  createProject: (
    input: Omit<Project, "id" | "company_id" | "latitude" | "longitude">,
  ) => Promise<Project>;
  updateProject: (projectId: string, patch: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  assignToProject: (
    projectId: string,
    assignment: { worker_id?: string; team_id?: string },
  ) => Promise<void>;
  checkIn: (projectId: string, location: CheckInLocation) => Promise<void>;
  checkOut: () => Promise<void>;
};

const WorklyDataContext = createContext<WorklyDataValue | null>(null);

function replaceById<T extends { id: string }>(items: T[], entity: T): T[] {
  const exists = items.some((item) => item.id === entity.id);
  return exists
    ? items.map((item) => (item.id === entity.id ? entity : item))
    : [entity, ...items];
}

function parseStoredState(raw: string | null): WorklyState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as WorklyState;
    if (
      parsed.version !== 1 ||
      !Array.isArray(parsed.workers) ||
      !Array.isArray(parsed.projects)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function WorklyDataProvider({ children }: { children: React.ReactNode }) {
  const { user, token, setUser } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<WorklyState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguageState] = useState<LanguageCode>("pt");
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const hydratedRef = useRef(false);
  const stateSnapshotRef = useRef("");
  const syncInFlightRef = useRef(false);
  const toastIdRef = useRef(0);

  const notify = useCallback((message: string, tone: ToastTone = "success") => {
    toastIdRef.current += 1;
    const nextToast = { id: toastIdRef.current, message, tone };
    setToast(nextToast);
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    let active = true;
    storage.getItem<string>(LANGUAGE_STORAGE_KEY, "pt").then((stored) => {
      if (active && (stored === "pt" || stored === "en" || stored === "fr" || stored === "es" || stored === "ro" || stored === "de" || stored === "nl")) {
        setLanguageState(stored);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const setLanguage = useCallback((nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage);
    void storage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  }, []);

  const runMutation = useCallback(
    async function runAuthoritativeMutation<T>(
      request: () => Promise<T>,
      fallbackPt: string,
      fallbackEn: string,
    ): Promise<T> {
      try {
        const result = await request();
        return result;
      } catch (requestError) {
        const message =
          requestError instanceof ApiError
            ? localizeApiError(language, requestError.message)
            : uiText(language, fallbackPt, fallbackEn);
        notify(message, "error");
        throw requestError instanceof Error
          ? requestError
          : new Error(message);
      }
    },
    [language, notify],
  );

  const reload = useCallback(
    async (forceRemote = false) => {
      if (!userId || !token) return;
      if (syncInFlightRef.current) return;

      syncInFlightRef.current = true;
      const showLoading = !hydratedRef.current;
      if (showLoading) setLoading(true);

      try {
        if (!forceRemote && !hydratedRef.current) {
          const stored = await storage.getItem<string>(STATE_STORAGE_KEY, "");
          const localState = parseStoredState(stored);
          if (localState) {
            setState(localState);
            stateSnapshotRef.current = stored ?? "";
            hydratedRef.current = true;
            setLoading(false);
          }
        }

        // The local snapshot only makes the first paint fast. The server always
        // reconciles it so Worker and Company never remain on different states.
        const remote = await api.get<WorklyState>("/bootstrap");
        const serializedRemote = JSON.stringify(remote);
        if (serializedRemote !== stateSnapshotRef.current) {
          setState(remote);
          stateSnapshotRef.current = serializedRemote;
          await storage.setItem(STATE_STORAGE_KEY, serializedRemote);
        }
        setError(null);
        hydratedRef.current = true;
      } catch (requestError) {
        const message =
          requestError instanceof ApiError
            ? localizeApiError(language, requestError.message)
            : uiText(
                language,
                "Não foi possível sincronizar os dados.",
                "Could not synchronize the data.",
              );
        setError(message);
      } finally {
        syncInFlightRef.current = false;
        if (showLoading) setLoading(false);
      }
    },
    [language, token, userId],
  );

  useEffect(() => {
    if (!userId || !token) {
      setState(null);
      setError(null);
      hydratedRef.current = false;
      stateSnapshotRef.current = "";
      return;
    }

    void reload(false);
  }, [reload, token, userId]);

  useEffect(() => {
    if (!userId || !token) return;

    const syncFromServer = () => {
      void reload(true);
    };
    const interval = setInterval(syncFromServer, SERVER_SYNC_INTERVAL_MS);
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") syncFromServer();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [reload, token, userId]);

  useEffect(() => {
    if (!state || !hydratedRef.current) return;
    const handle = setTimeout(() => {
      const serializedState = JSON.stringify(state);
      stateSnapshotRef.current = serializedState;
      void storage.setItem(STATE_STORAGE_KEY, serializedState);
    }, 80);
    return () => clearTimeout(handle);
  }, [state]);

  useEffect(() => {
    if (!toast) return;
    const handle = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(handle);
  }, [toast]);

  const resetDemo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post<{ state: WorklyState }>("/demo/reset");
      setState(response.state);
      stateSnapshotRef.current = JSON.stringify(response.state);
      hydratedRef.current = true;
      await storage.setItem(STATE_STORAGE_KEY, stateSnapshotRef.current);
      notify(
        uiText(language, "Dados demo repostos.", "Demo data reset."),
        "success",
      );
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : uiText(language, "Falha ao repor os dados.", "Reset failed.");
      setError(message);
      notify(message, "error");
    } finally {
      setLoading(false);
    }
  }, [language, notify]);

  const updateWorker = useCallback(
    async (workerId: string, patch: Partial<Worker>) => {
      const updated = await runMutation(
        () => api.patch<Worker>(`/workers/${workerId}`, { data: patch }),
        "Não foi possível atualizar o perfil.",
        "Could not update the profile.",
      );
      setState((current) => {
        if (!current) return current;
        const existing = current.workers.find((item) => item.id === workerId);
        if (!existing) return current;
        return { ...current, workers: replaceById(current.workers, updated) };
      });
      if (user?.id === workerId) {
        setUser(user ? { ...user, ...patch } : user);
      }
      notify(uiText(language, "Perfil atualizado.", "Profile updated."));
    },
    [language, notify, runMutation, setUser, user],
  );

  const updateCompany = useCallback(
    async (companyId: string, patch: Partial<Company>) => {
      const updated = await runMutation(
        () =>
          api.patch<Company>(`/companies/${companyId}`, {
            data: patch,
          }),
        "Não foi possível atualizar a empresa.",
        "Could not update the company.",
      );
      setState((current) => {
        if (!current) return current;
        const existing = current.companies.find((item) => item.id === companyId);
        if (!existing) return current;
        return {
          ...current,
          companies: replaceById(current.companies, updated),
        };
      });
      if (user?.id === companyId) {
        setUser(user ? { ...user, ...patch } : user);
      }
      notify(uiText(language, "Empresa atualizada.", "Company updated."));
    },
    [language, notify, runMutation, setUser, user],
  );

  const createTeam = useCallback(
    async (input: Omit<Team, "id" | "company_id">) => {
      const created = await runMutation(
        () => api.post<Team>("/teams", input),
        "Não foi possível criar a equipa.",
        "Could not create the team.",
      );
      setState((current) =>
        current ? { ...current, teams: [created, ...current.teams] } : current,
      );
      notify(uiText(language, "Equipa criada.", "Team created."));
      return created;
    },
    [language, notify, runMutation],
  );

  const updateTeam = useCallback(
    async (teamId: string, patch: Partial<Team>) => {
      const updated = await runMutation(
        () => api.patch<Team>(`/teams/${teamId}`, { data: patch }),
        "Não foi possível atualizar a equipa.",
        "Could not update the team.",
      );
      setState((current) => {
        if (!current) return current;
        const existing = current.teams.find((item) => item.id === teamId);
        if (!existing) return current;
        return {
          ...current,
          teams: replaceById(current.teams, updated),
        };
      });
      notify(uiText(language, "Equipa atualizada.", "Team updated."));
    },
    [language, notify, runMutation],
  );

  const deleteTeam = useCallback(
    async (teamId: string) => {
      await runMutation(
        () => api.delete(`/teams/${teamId}`),
        "Não foi possível eliminar a equipa.",
        "Could not delete the team.",
      );
      setState((current) => {
        if (!current) return current;
        return {
          ...current,
          teams: current.teams.filter((item) => item.id !== teamId),
          projects: current.projects.map((project) => ({
            ...project,
            team_ids: project.team_ids.filter((id) => id !== teamId),
          })),
        };
      });
      notify(uiText(language, "Equipa eliminada.", "Team deleted."));
    },
    [language, notify, runMutation],
  );

  const addTeamMember = useCallback(
    async (teamId: string, workerId: string) => {
      const updated = await runMutation(
        () =>
          api.post<Team>(`/teams/${teamId}/members`, {
            worker_id: workerId,
          }),
        "Não foi possível adicionar o trabalhador.",
        "Could not add the worker.",
      );
      setState((current) => {
        if (!current) return current;
        const existing = current.teams.find((item) => item.id === teamId);
        if (!existing) return current;
        return { ...current, teams: replaceById(current.teams, updated) };
      });
      notify(uiText(language, "Trabalhador adicionado.", "Worker added."));
    },
    [language, notify, runMutation],
  );

  const removeTeamMember = useCallback(
    async (teamId: string, workerId: string) => {
      const updated = await runMutation(
        () => api.delete<Team>(`/teams/${teamId}/members/${workerId}`),
        "Não foi possível remover o trabalhador.",
        "Could not remove the worker.",
      );
      setState((current) => {
        if (!current) return current;
        const existing = current.teams.find((item) => item.id === teamId);
        if (!existing) return current;
        return { ...current, teams: replaceById(current.teams, updated) };
      });
      notify(uiText(language, "Trabalhador removido.", "Worker removed."));
    },
    [language, notify, runMutation],
  );

  const setTeamLeader = useCallback(
    async (teamId: string, workerId: string) => {
      const updated = await runMutation(
        () =>
          api.post<Team>(`/teams/${teamId}/leader`, {
            worker_id: workerId,
          }),
        "Não foi possível definir o líder.",
        "Could not assign the leader.",
      );
      setState((current) => {
        if (!current) return current;
        const existing = current.teams.find((item) => item.id === teamId);
        if (!existing) return current;
        return { ...current, teams: replaceById(current.teams, updated) };
      });
      notify(uiText(language, "Líder definido.", "Leader assigned."));
    },
    [language, notify, runMutation],
  );

  const createProject = useCallback(
    async (
      input: Omit<Project, "id" | "company_id" | "latitude" | "longitude">,
    ) => {
      const created = await runMutation(
        () => api.post<Project>("/projects", input),
        "Não foi possível criar a obra.",
        "Could not create the project.",
      );
      setState((current) =>
        current
          ? { ...current, projects: [created, ...current.projects] }
          : current,
      );
      notify(uiText(language, "Obra criada.", "Project created."));
      return created;
    },
    [language, notify, runMutation],
  );

  const updateProject = useCallback(
    async (projectId: string, patch: Partial<Project>) => {
      const updated = await runMutation(
        () =>
          api.patch<Project>(`/projects/${projectId}`, {
            data: patch,
          }),
        "Não foi possível atualizar a obra.",
        "Could not update the project.",
      );
      setState((current) => {
        if (!current) return current;
        const existing = current.projects.find((item) => item.id === projectId);
        if (!existing) return current;
        return {
          ...current,
          projects: replaceById(current.projects, updated),
        };
      });
      notify(uiText(language, "Obra atualizada.", "Project updated."));
    },
    [language, notify, runMutation],
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      await runMutation(
        () => api.delete(`/projects/${projectId}`),
        "Não foi possível eliminar a obra.",
        "Could not delete the project.",
      );
      setState((current) => {
        if (!current) return current;
        return {
          ...current,
          projects: current.projects.filter((item) => item.id !== projectId),
          teams: current.teams.map((team) =>
            team.project_id === projectId
              ? { ...team, project_id: null, status: "available" }
              : team,
          ),
        };
      });
      notify(uiText(language, "Obra eliminada.", "Project deleted."));
    },
    [language, notify, runMutation],
  );

  const assignToProject = useCallback(
    async (
      projectId: string,
      assignment: { worker_id?: string; team_id?: string },
    ) => {
      const updated = await runMutation(
        () =>
          api.post<Project>(`/projects/${projectId}/assign`, assignment),
        "Não foi possível concluir a atribuição.",
        "Could not complete the assignment.",
      );
      setState((current) => {
        if (!current) return current;
        const existing = current.projects.find((item) => item.id === projectId);
        if (!existing) return current;
        return {
          ...current,
          projects: replaceById(current.projects, updated),
          teams: assignment.team_id
            ? current.teams.map((team) =>
                team.id === assignment.team_id
                  ? { ...team, project_id: projectId, status: "assigned" }
                  : team,
              )
            : current.teams,
        };
      });
      notify(uiText(language, "Atribuição concluída.", "Assignment completed."));
    },
    [language, notify, runMutation],
  );

  const checkIn = useCallback(
    async (projectId: string, location: CheckInLocation) => {
      if (!userId) return;
      const record = await runMutation(
        () =>
          api.post<Attendance>("/attendance/check-in", {
            project_id: projectId,
            ...location,
          }),
        "Não foi possível registar o check-in.",
        "Could not record the check-in.",
      );
      setState((current) => {
        if (!current) return current;
        return {
          ...current,
          attendance: [record, ...current.attendance],
          workers: current.workers.map((worker) =>
            worker.id === userId
              ? {
                  ...worker,
                  status: "on_site",
                  availability: false,
                  current_project_id: projectId,
                }
              : worker,
          ),
        };
      });
      notify(
        uiText(language, "Check-in registado.", "Check-in recorded."),
        "success",
      );
    },
    [language, notify, runMutation, userId],
  );

  const checkOut = useCallback(async () => {
    if (!userId) return;
    const updatedRecord = await runMutation(
      () =>
        api.post<Attendance>("/attendance/check-out", {
          location_mode: "demo",
        }),
      "Não foi possível registar o check-out.",
      "Could not record the check-out.",
    );
    const checkoutAt = updatedRecord.check_out ?? new Date().toISOString();
    setState((current) => {
      if (!current) return current;
      return {
        ...current,
        attendance: current.attendance.map((record) =>
          record.worker_id === userId && record.check_out === null
            ? { ...updatedRecord, check_out: checkoutAt }
            : record,
        ),
        workers: current.workers.map((worker) =>
          worker.id === userId
            ? {
                ...worker,
                status: worker.company_id ? "contracted" : "available",
              }
            : worker,
        ),
      };
    });
    notify(
      uiText(language, "Check-out registado.", "Check-out recorded."),
      "success",
    );
  }, [language, notify, runMutation, userId]);

  const value = useMemo<WorklyDataValue>(
    () => ({
      state,
      loading,
      error,
      language,
      toast,
      setLanguage,
      reload,
      resetDemo,
      dismissToast,
      notify,
      updateWorker,
      updateCompany,
      createTeam,
      updateTeam,
      deleteTeam,
      addTeamMember,
      removeTeamMember,
      setTeamLeader,
      createProject,
      updateProject,
      deleteProject,
      assignToProject,
      checkIn,
      checkOut,
    }),
    [
      addTeamMember,
      assignToProject,
      checkIn,
      checkOut,
      createProject,
      createTeam,
      deleteProject,
      deleteTeam,
      dismissToast,
      error,
      language,
      loading,
      notify,
      reload,
      removeTeamMember,
      resetDemo,
      setLanguage,
      setTeamLeader,
      state,
      toast,
      updateCompany,
      updateProject,
      updateTeam,
      updateWorker,
    ],
  );

  return (
    <WorklyDataContext.Provider value={value}>
      {children}
    </WorklyDataContext.Provider>
  );
}

export function useWorklyData() {
  const context = useContext(WorklyDataContext);
  if (!context) {
    throw new Error("useWorklyData must be used inside WorklyDataProvider");
  }
  return context;
}

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { api } from "@/src/api/client";
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
  const [state, setState] = useState<WorklyState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguageState] = useState<LanguageCode>("pt");
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const hydratedRef = useRef(false);
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
      if (active && (stored === "pt" || stored === "en")) {
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

  const reload = useCallback(
    async (forceRemote = false) => {
      if (!user || !token) return;
      setLoading(true);
      setError(null);

      try {
        if (!forceRemote) {
          const stored = await storage.getItem<string>(STATE_STORAGE_KEY, "");
          const localState = parseStoredState(stored);
          if (localState) {
            setState(localState);
            hydratedRef.current = true;
            setLoading(false);
            return;
          }
        }

        const remote = await api.get<WorklyState>("/bootstrap");
        setState(remote);
        hydratedRef.current = true;
        await storage.setItem(STATE_STORAGE_KEY, JSON.stringify(remote));
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível carregar os dados.";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [token, user],
  );

  useEffect(() => {
    if (!user || !token) return;
    if (!state) {
      void reload(false);
    }
  }, [reload, state, token, user]);

  useEffect(() => {
    if (!state || !hydratedRef.current) return;
    const handle = setTimeout(() => {
      void storage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
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
      hydratedRef.current = true;
      await storage.setItem(STATE_STORAGE_KEY, JSON.stringify(response.state));
      notify(
        language === "pt" ? "Dados demo repostos." : "Demo data reset.",
        "success",
      );
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Reset failed.";
      setError(message);
      notify(message, "error");
    } finally {
      setLoading(false);
    }
  }, [language, notify]);

  const updateWorker = useCallback(
    async (workerId: string, patch: Partial<Worker>) => {
      let updated: Worker | null = null;
      try {
        updated = await api.patch<Worker>(`/workers/${workerId}`, { data: patch });
      } catch {
        // Demo state remains editable in-browser if a serverless instance resets.
      }
      setState((current) => {
        if (!current) return current;
        const existing = current.workers.find((item) => item.id === workerId);
        if (!existing) return current;
        const nextWorker = updated ?? { ...existing, ...patch };
        return { ...current, workers: replaceById(current.workers, nextWorker) };
      });
      if (user?.id === workerId) {
        setUser(user ? { ...user, ...patch } : user);
      }
      notify(language === "pt" ? "Perfil atualizado." : "Profile updated.");
    },
    [language, notify, setUser, user],
  );

  const updateCompany = useCallback(
    async (companyId: string, patch: Partial<Company>) => {
      let updated: Company | null = null;
      try {
        updated = await api.patch<Company>(`/companies/${companyId}`, {
          data: patch,
        });
      } catch {
        // Keep the browser-persistent demo usable during a cold API reset.
      }
      setState((current) => {
        if (!current) return current;
        const existing = current.companies.find((item) => item.id === companyId);
        if (!existing) return current;
        const nextCompany = updated ?? { ...existing, ...patch };
        return {
          ...current,
          companies: replaceById(current.companies, nextCompany),
        };
      });
      if (user?.id === companyId) {
        setUser(user ? { ...user, ...patch } : user);
      }
      notify(language === "pt" ? "Empresa atualizada." : "Company updated.");
    },
    [language, notify, setUser, user],
  );

  const createTeam = useCallback(
    async (input: Omit<Team, "id" | "company_id">) => {
      const companyId = user?.company_id ?? user?.id ?? "company-1";
      let created: Team;
      try {
        created = await api.post<Team>("/teams", input);
      } catch {
        created = {
          ...input,
          id: `team-local-${Date.now()}`,
          company_id: companyId,
        };
      }
      setState((current) =>
        current ? { ...current, teams: [created, ...current.teams] } : current,
      );
      notify(language === "pt" ? "Equipa criada." : "Team created.");
      return created;
    },
    [language, notify, user],
  );

  const updateTeam = useCallback(
    async (teamId: string, patch: Partial<Team>) => {
      let updated: Team | null = null;
      try {
        updated = await api.patch<Team>(`/teams/${teamId}`, { data: patch });
      } catch {
        // Local browser persistence is the demo fallback.
      }
      setState((current) => {
        if (!current) return current;
        const existing = current.teams.find((item) => item.id === teamId);
        if (!existing) return current;
        return {
          ...current,
          teams: replaceById(current.teams, updated ?? { ...existing, ...patch }),
        };
      });
      notify(language === "pt" ? "Equipa atualizada." : "Team updated.");
    },
    [language, notify],
  );

  const deleteTeam = useCallback(
    async (teamId: string) => {
      try {
        await api.delete(`/teams/${teamId}`);
      } catch {
        // The same action is applied to the local demo snapshot below.
      }
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
      notify(language === "pt" ? "Equipa eliminada." : "Team deleted.");
    },
    [language, notify],
  );

  const addTeamMember = useCallback(
    async (teamId: string, workerId: string) => {
      let updated: Team | null = null;
      try {
        updated = await api.post<Team>(`/teams/${teamId}/members`, {
          worker_id: workerId,
        });
      } catch {
        // Apply locally below.
      }
      setState((current) => {
        if (!current) return current;
        const existing = current.teams.find((item) => item.id === teamId);
        if (!existing) return current;
        const nextTeam =
          updated ??
          ({
            ...existing,
            member_ids: Array.from(new Set([...existing.member_ids, workerId])),
          } satisfies Team);
        return { ...current, teams: replaceById(current.teams, nextTeam) };
      });
      notify(language === "pt" ? "Trabalhador adicionado." : "Worker added.");
    },
    [language, notify],
  );

  const removeTeamMember = useCallback(
    async (teamId: string, workerId: string) => {
      let updated: Team | null = null;
      try {
        updated = await api.delete<Team>(`/teams/${teamId}/members/${workerId}`);
      } catch {
        // Apply locally below.
      }
      setState((current) => {
        if (!current) return current;
        const existing = current.teams.find((item) => item.id === teamId);
        if (!existing) return current;
        const memberIds = existing.member_ids.filter((id) => id !== workerId);
        const nextTeam =
          updated ??
          ({
            ...existing,
            member_ids: memberIds,
            leader_id:
              existing.leader_id === workerId
                ? (memberIds[0] ?? null)
                : existing.leader_id,
          } satisfies Team);
        return { ...current, teams: replaceById(current.teams, nextTeam) };
      });
      notify(language === "pt" ? "Trabalhador removido." : "Worker removed.");
    },
    [language, notify],
  );

  const setTeamLeader = useCallback(
    async (teamId: string, workerId: string) => {
      let updated: Team | null = null;
      try {
        updated = await api.post<Team>(`/teams/${teamId}/leader`, {
          worker_id: workerId,
        });
      } catch {
        // Apply locally below.
      }
      setState((current) => {
        if (!current) return current;
        const existing = current.teams.find((item) => item.id === teamId);
        if (!existing) return current;
        const nextTeam =
          updated ??
          ({
            ...existing,
            leader_id: workerId,
            member_ids: Array.from(new Set([...existing.member_ids, workerId])),
          } satisfies Team);
        return { ...current, teams: replaceById(current.teams, nextTeam) };
      });
      notify(language === "pt" ? "Líder definido." : "Leader assigned.");
    },
    [language, notify],
  );

  const createProject = useCallback(
    async (
      input: Omit<Project, "id" | "company_id" | "latitude" | "longitude">,
    ) => {
      const companyId = user?.company_id ?? user?.id ?? "company-1";
      let created: Project;
      try {
        created = await api.post<Project>("/projects", input);
      } catch {
        created = {
          ...input,
          id: `project-local-${Date.now()}`,
          company_id: companyId,
          latitude: null,
          longitude: null,
        };
      }
      setState((current) =>
        current
          ? { ...current, projects: [created, ...current.projects] }
          : current,
      );
      notify(language === "pt" ? "Obra criada." : "Project created.");
      return created;
    },
    [language, notify, user],
  );

  const updateProject = useCallback(
    async (projectId: string, patch: Partial<Project>) => {
      let updated: Project | null = null;
      try {
        updated = await api.patch<Project>(`/projects/${projectId}`, {
          data: patch,
        });
      } catch {
        // Apply locally below.
      }
      setState((current) => {
        if (!current) return current;
        const existing = current.projects.find((item) => item.id === projectId);
        if (!existing) return current;
        return {
          ...current,
          projects: replaceById(
            current.projects,
            updated ?? { ...existing, ...patch },
          ),
        };
      });
      notify(language === "pt" ? "Obra atualizada." : "Project updated.");
    },
    [language, notify],
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      try {
        await api.delete(`/projects/${projectId}`);
      } catch {
        // Apply locally below.
      }
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
      notify(language === "pt" ? "Obra eliminada." : "Project deleted.");
    },
    [language, notify],
  );

  const assignToProject = useCallback(
    async (
      projectId: string,
      assignment: { worker_id?: string; team_id?: string },
    ) => {
      let updated: Project | null = null;
      try {
        updated = await api.post<Project>(
          `/projects/${projectId}/assign`,
          assignment,
        );
      } catch {
        // Apply locally below.
      }
      setState((current) => {
        if (!current) return current;
        const existing = current.projects.find((item) => item.id === projectId);
        if (!existing) return current;
        const nextProject =
          updated ??
          ({
            ...existing,
            worker_ids: assignment.worker_id
              ? Array.from(
                  new Set([...existing.worker_ids, assignment.worker_id]),
                )
              : existing.worker_ids,
            team_ids: assignment.team_id
              ? Array.from(new Set([...existing.team_ids, assignment.team_id]))
              : existing.team_ids,
          } satisfies Project);
        return {
          ...current,
          projects: replaceById(current.projects, nextProject),
          teams: assignment.team_id
            ? current.teams.map((team) =>
                team.id === assignment.team_id
                  ? { ...team, project_id: projectId, status: "assigned" }
                  : team,
              )
            : current.teams,
        };
      });
      notify(language === "pt" ? "Atribuição concluída." : "Assignment completed.");
    },
    [language, notify],
  );

  const checkIn = useCallback(
    async (projectId: string, location: CheckInLocation) => {
      if (!user) return;
      let record: Attendance;
      try {
        record = await api.post<Attendance>("/attendance/check-in", {
          project_id: projectId,
          ...location,
        });
      } catch {
        const project = state?.projects.find((item) => item.id === projectId);
        record = {
          id: `attendance-local-${Date.now()}`,
          worker_id: user.id,
          company_id: project?.company_id ?? null,
          project_id: projectId,
          check_in: new Date().toISOString(),
          check_out: null,
          ...location,
          note:
            language === "pt"
              ? "Entrada guardada no modo demo."
              : "Check-in saved in demo mode.",
        };
      }
      setState((current) => {
        if (!current) return current;
        return {
          ...current,
          attendance: [record, ...current.attendance],
          workers: current.workers.map((worker) =>
            worker.id === user.id
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
        language === "pt" ? "Check-in registado." : "Check-in recorded.",
        "success",
      );
    },
    [language, notify, state?.projects, user],
  );

  const checkOut = useCallback(async () => {
    if (!user) return;
    let updatedRecord: Attendance | null = null;
    try {
      updatedRecord = await api.post<Attendance>("/attendance/check-out", {
        location_mode: "demo",
      });
    } catch {
      // The current local record is closed below.
    }
    const checkoutAt = updatedRecord?.check_out ?? new Date().toISOString();
    setState((current) => {
      if (!current) return current;
      return {
        ...current,
        attendance: current.attendance.map((record) =>
          record.worker_id === user.id && record.check_out === null
            ? { ...(updatedRecord ?? record), check_out: checkoutAt }
            : record,
        ),
        workers: current.workers.map((worker) =>
          worker.id === user.id
            ? {
                ...worker,
                status: worker.company_id ? "contracted" : "available",
              }
            : worker,
        ),
      };
    });
    notify(
      language === "pt" ? "Check-out registado." : "Check-out recorded.",
      "success",
    );
  }, [language, notify, user]);

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


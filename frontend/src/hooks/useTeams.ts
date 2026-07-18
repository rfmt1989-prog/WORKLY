import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";

export type Worker = {
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

export type Team = {
  id: string;
  name: string;
  description?: string;
  specialty?: string;
  status?: string;
  country?: string;
  city?: string;
  member_ids?: string[];
  members?: Worker[];
  leader_id?: string | null;
  project_id?: string | null;
  member_count?: number;
  team_score?: number;
  average_trust?: number;
  average_productivity?: number;
};

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");

  const loadTeams = useCallback(async () => {
    const data = await api.get<Team[]>("/teams");

    setTeams(data);

    setSelectedTeamId((current) => {
      if (data.some((team) => team.id === current)) {
        return current;
      }

      return data[0]?.id || "";
    });
  }, []);

  const loadWorkers = useCallback(async () => {
    const data = await api.get<Worker[]>("/teams/available-workers");
    setWorkers(data);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadTeams(), loadWorkers()]);
    } finally {
      setLoading(false);
    }
  }, [loadTeams, loadWorkers]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    teams,
    workers,
    selectedTeamId,
    setSelectedTeamId,
    loading,
    busyAction,
    setBusyAction,
    loadTeams,
    loadWorkers,
    refresh,
  };
}
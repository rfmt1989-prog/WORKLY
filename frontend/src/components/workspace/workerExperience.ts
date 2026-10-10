import type { Attendance, Project } from "@/src/demo/types";

function durationHours(checkIn: string, checkOut: string | null) {
  if (!checkOut) return 0;
  const start = Date.parse(checkIn);
  const end = Date.parse(checkOut);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.max(0, (end - start) / 3600000);
}

export function verifiedAttendanceHours(
  workerId: string,
  attendance: Attendance[],
  projectId?: string,
) {
  return Math.round(
    attendance
      .filter(
        (item) =>
          item.worker_id === workerId &&
          item.approval_status === "approved" &&
          (!projectId || item.project_id === projectId),
      )
      .reduce((sum, item) => sum + durationHours(item.check_in, item.check_out), 0) *
      10,
  ) / 10;
}

export function verifiedProjectIds(
  workerId: string,
  projects: Project[],
  attendance: Attendance[],
  professionId?: string,
) {
  const projectIdsWithApprovedWork = new Set(
    attendance
      .filter(
        (item) =>
          item.worker_id === workerId &&
          item.approval_status === "approved" &&
          Boolean(item.check_out),
      )
      .map((item) => item.project_id),
  );

  return new Set(
    projects
      .filter((project) => {
        const tagged = project as Project & { profession_id?: string };
        return (
          project.status === "completed" &&
          project.worker_ids.includes(workerId) &&
          projectIdsWithApprovedWork.has(project.id) &&
          (!professionId || tagged.profession_id === professionId)
        );
      })
      .map((project) => project.id),
  );
}

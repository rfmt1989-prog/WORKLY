import type { Attendance, Project } from "@/src/demo/types";

function durationHours(checkIn: string, checkOut: string | null) {
  if (!checkOut) return 0;
  const start = Date.parse(checkIn);
  const end = Date.parse(checkOut);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.min(16, Math.max(0, (end - start) / 3600000));
}

export function verifiedAttendanceHours(
  workerId: string,
  attendance: Attendance[],
  projectId?: string,
) {
  // Union approved time intervals: overlapping or duplicated records cannot
  // inflate the worker's verified experience.
  const periods = attendance
    .filter(item => item.worker_id === workerId && item.approval_status === "approved" && (!projectId || item.project_id === projectId))
    .map(item => {
      const start = Date.parse(item.check_in);
      const end = Date.parse(item.check_out || "");
      return { start, end: Math.min(end, start + 16 * 3600000) };
    })
    .filter(item => Number.isFinite(item.start) && Number.isFinite(item.end) && item.end > item.start)
    .sort((a, b) => a.start - b.start);
  let totalMs = 0;
  let lastEnd = Number.NEGATIVE_INFINITY;
  for (const period of periods) {
    totalMs += Math.max(0, period.end - Math.max(period.start, lastEnd));
    lastEnd = Math.max(lastEnd, period.end);
  }
  return Math.round(totalMs / 3600000 * 10) / 10;
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
          (!professionId || !tagged.profession_id || tagged.profession_id === professionId)
        );
      })
      .map((project) => project.id),
  );
}

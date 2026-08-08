import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { useAuth } from "@/src/context/AuthContext";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import type { Attendance, Project, Worker } from "@/src/demo/types";

import {
  Avatar,
  Card,
  EmptyState,
  MetricCard,
  SectionTitle,
  StatusPill,
  roleAccent,
  sharedStyles,
  workspaceColors,
} from "./primitives";

type SiteOperational = {
  project: Project;
  activeAttendance: Attendance[];
  activeWorkers: Worker[];
  gpsInside: number;
  gpsOutside: number;
  demo: number;
  unverifiedGps: number;
  alerts: number;
};

function formatCoordinate(value: number | null) {
  return value === null ? "—" : value.toFixed(5);
}

function siteStatus(site: SiteOperational) {
  if (site.gpsOutside > 0 || site.unverifiedGps > 0) return "alert";
  if (site.activeAttendance.length > 0) return "live";
  return "idle";
}

function siteColor(site: SiteOperational) {
  const status = siteStatus(site);
  if (status === "alert") return workspaceColors.redSoft;
  if (status === "live") return workspaceColors.green;
  return workspaceColors.muted;
}

function normaliseCoordinate(
  value: number,
  min: number,
  max: number,
  fallback: number,
) {
  if (Math.abs(max - min) < 0.000001) return fallback;
  return 12 + ((value - min) / (max - min)) * 76;
}

export function OperationsMapView() {
  const { user } = useAuth();
  const { state, language } = useWorklyData();
  const { width } = useWindowDimensions();
  const compact = width < 880;
  const role = user?.role ?? "company";
  const accent = roleAccent(role);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const companyId = user?.company_id ?? user?.id;

  const sites = useMemo<SiteOperational[]>(() => {
    if (!state || !companyId) return [];
    return state.projects
      .filter((project) => project.company_id === companyId)
      .map((project) => {
        const activeAttendance = state.attendance.filter(
          (record) => record.project_id === project.id && record.check_out === null,
        );
        const activeWorkers = activeAttendance
          .map((record) => state.workers.find((worker) => worker.id === record.worker_id))
          .filter((worker): worker is Worker => Boolean(worker));
        const gpsInside = activeAttendance.filter(
          (record) => record.location_mode === "gps" && record.within_geofence === true,
        ).length;
        const gpsOutside = activeAttendance.filter(
          (record) => record.location_mode === "gps" && record.within_geofence === false,
        ).length;
        const demo = activeAttendance.filter(
          (record) => record.location_mode === "demo",
        ).length;
        const unverifiedGps = activeAttendance.filter(
          (record) => record.location_mode === "gps" && record.within_geofence == null,
        ).length;
        return {
          project,
          activeAttendance,
          activeWorkers,
          gpsInside,
          gpsOutside,
          demo,
          unverifiedGps,
          alerts: gpsOutside + unverifiedGps,
        };
      })
      .sort((a, b) => {
        const activeDelta = b.activeAttendance.length - a.activeAttendance.length;
        if (activeDelta !== 0) return activeDelta;
        return a.project.name.localeCompare(b.project.name);
      });
  }, [companyId, state]);

  if (!state || !user) return null;

  const geocodedSites = sites.filter(
    (site) => site.project.latitude !== null && site.project.longitude !== null,
  );
  const selected =
    sites.find((site) => site.project.id === selectedProjectId) ??
    sites.find((site) => site.activeAttendance.length > 0) ??
    sites[0];

  const latitudes = geocodedSites.map((site) => site.project.latitude as number);
  const longitudes = geocodedSites.map((site) => site.project.longitude as number);
  const minLat = latitudes.length ? Math.min(...latitudes) : 0;
  const maxLat = latitudes.length ? Math.max(...latitudes) : 0;
  const minLon = longitudes.length ? Math.min(...longitudes) : 0;
  const maxLon = longitudes.length ? Math.max(...longitudes) : 0;

  const activeWorkers = sites.reduce(
    (sum, site) => sum + site.activeAttendance.length,
    0,
  );
  const inside = sites.reduce((sum, site) => sum + site.gpsInside, 0);
  const alerts = sites.reduce((sum, site) => sum + site.alerts, 0);
  const activeSites = sites.filter((site) => site.project.status === "active").length;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, compact ? styles.contentCompact : null]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, compact ? styles.headerCompact : null]}>
        <View style={{ flex: 1 }}>
          <Text style={sharedStyles.title}>
            {language === "pt" ? "Mapa Operacional" : "Operations Map"}
          </Text>
          <Text style={sharedStyles.subtitle}>
            {language === "pt"
              ? "Visão em tempo real das obras, presenças e zonas GPS da empresa."
              : "Real-time view of company sites, attendance and GPS zones."}
          </Text>
        </View>
        <View style={[styles.liveBadge, { borderColor: `${accent}66` }]}>
          <View style={[styles.liveDot, { backgroundColor: workspaceColors.green }]} />
          <Text style={styles.liveBadgeText}>LIVE OPS</Text>
        </View>
      </View>

      <View style={styles.metrics}>
        <MetricCard
          icon="business-outline"
          label={language === "pt" ? "Obras ativas" : "Active sites"}
          value={activeSites}
          detail={`${sites.length} ${language === "pt" ? "obras monitorizadas" : "sites monitored"}`}
          accent={accent}
        />
        <MetricCard
          icon="people-outline"
          label={language === "pt" ? "Workers em obra" : "Workers on site"}
          value={activeWorkers}
          detail={language === "pt" ? "Sessões abertas" : "Open sessions"}
          accent={workspaceColors.green}
        />
        <MetricCard
          icon="shield-checkmark-outline"
          label={language === "pt" ? "GPS validado" : "GPS validated"}
          value={inside}
          detail={language === "pt" ? "Dentro da geofence" : "Inside geofence"}
          accent={workspaceColors.green}
        />
        <MetricCard
          icon="warning-outline"
          label={language === "pt" ? "Alertas" : "Alerts"}
          value={alerts}
          detail={language === "pt" ? "GPS fora ou não validado" : "Outside or unverified GPS"}
          accent={alerts ? workspaceColors.redSoft : workspaceColors.muted}
        />
      </View>

      <View style={[styles.mainGrid, compact ? styles.mainGridCompact : null]}>
        <Card style={[styles.mapCard, compact ? styles.mapCardCompact : null]} accent={accent}>
          <SectionTitle
            title={language === "pt" ? "Rede de obras" : "Site network"}
            subtitle={
              language === "pt"
                ? "Posição relativa baseada nas coordenadas GPS configuradas."
                : "Relative position based on configured GPS coordinates."
            }
          />

          {geocodedSites.length ? (
            <View style={styles.mapSurface}>
              {[20, 40, 60, 80].map((position) => (
                <React.Fragment key={position}>
                  <View style={[styles.gridLineHorizontal, { top: `${position}%` }]} />
                  <View style={[styles.gridLineVertical, { left: `${position}%` }]} />
                </React.Fragment>
              ))}
              <View style={styles.mapGlow} />
              {geocodedSites.map((site, index) => {
                const latitude = site.project.latitude as number;
                const longitude = site.project.longitude as number;
                const left = normaliseCoordinate(longitude, minLon, maxLon, 48 + (index % 2) * 7);
                const top = 88 - normaliseCoordinate(latitude, minLat, maxLat, 48 + (index % 3) * 5);
                const color = siteColor(site);
                const active = selected?.project.id === site.project.id;
                return (
                  <Pressable
                    key={site.project.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${site.project.name} · ${site.activeAttendance.length} workers`}
                    onPress={() => setSelectedProjectId(site.project.id)}
                    style={({ pressed }) => [
                      styles.sitePinWrap,
                      { left: `${left}%`, top: `${top}%` },
                      pressed ? { opacity: 0.72 } : null,
                    ]}
                  >
                    {site.activeAttendance.length > 0 ? (
                      <View style={[styles.pinPulse, { borderColor: `${color}77` }]} />
                    ) : null}
                    <View
                      style={[
                        styles.sitePin,
                        {
                          borderColor: active ? workspaceColors.text : color,
                          backgroundColor: `${color}24`,
                          shadowColor: color,
                        },
                      ]}
                    >
                      <Ionicons name="business" size={16} color={color} />
                    </View>
                    <View style={[styles.pinLabel, active ? { borderColor: `${color}88` } : null]}>
                      <Text style={styles.pinTitle} numberOfLines={1}>
                        {site.project.name}
                      </Text>
                      <Text style={[styles.pinMeta, { color }]}>
                        {site.activeAttendance.length} {language === "pt" ? "em obra" : "on site"}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
              <View style={styles.mapLegend}>
                <LegendDot color={workspaceColors.green} label={language === "pt" ? "Ativo" : "Live"} />
                <LegendDot color={workspaceColors.redSoft} label={language === "pt" ? "Alerta" : "Alert"} />
                <LegendDot color={workspaceColors.muted} label={language === "pt" ? "Sem sessão" : "Idle"} />
              </View>
            </View>
          ) : (
            <EmptyState
              icon="map-outline"
              title={language === "pt" ? "Sem obras com coordenadas" : "No geocoded sites"}
              description={
                language === "pt"
                  ? "Define latitude e longitude no perfil da obra para a incluir no mapa operacional."
                  : "Set latitude and longitude on the project to include it in the operations map."
              }
            />
          )}
        </Card>

        <Card style={styles.detailCard} accent={selected ? siteColor(selected) : accent}>
          {selected ? (
            <>
              <SectionTitle
                title={selected.project.name}
                subtitle={selected.project.location}
                action={
                  <StatusPill
                    status={selected.activeAttendance.length ? "active" : selected.project.status}
                    label={
                      selected.activeAttendance.length
                        ? language === "pt"
                          ? "Em operação"
                          : "Operating"
                        : selected.project.status
                    }
                  />
                }
              />

              <View style={styles.siteFacts}>
                <Fact
                  icon="navigate-outline"
                  label={language === "pt" ? "Centro GPS" : "GPS centre"}
                  value={`${formatCoordinate(selected.project.latitude)}, ${formatCoordinate(selected.project.longitude)}`}
                />
                <Fact
                  icon="radio-outline"
                  label={language === "pt" ? "Raio" : "Radius"}
                  value={`${selected.project.geofence_radius_m ?? 250} m`}
                />
                <Fact
                  icon="people-outline"
                  label={language === "pt" ? "Em obra" : "On site"}
                  value={String(selected.activeAttendance.length)}
                />
                <Fact
                  icon="shield-checkmark-outline"
                  label="GPS OK"
                  value={String(selected.gpsInside)}
                />
              </View>

              <View style={styles.alertStrip}>
                <Ionicons
                  name={selected.alerts ? "warning-outline" : "checkmark-circle-outline"}
                  size={19}
                  color={selected.alerts ? workspaceColors.redSoft : workspaceColors.green}
                />
                <Text style={styles.alertText}>
                  {selected.alerts
                    ? language === "pt"
                      ? `${selected.alerts} sessão(ões) requerem atenção GPS.`
                      : `${selected.alerts} session(s) require GPS attention.`
                    : language === "pt"
                      ? "Sem violações GPS ativas nesta obra."
                      : "No active GPS violations on this site."}
                </Text>
              </View>

              <View style={styles.workerList}>
                <Text style={styles.listTitle}>
                  {language === "pt" ? "Workers no local" : "Workers on site"}
                </Text>
                {selected.activeAttendance.length ? (
                  selected.activeAttendance.map((record) => {
                    const worker = state.workers.find((item) => item.id === record.worker_id);
                    const color =
                      record.location_mode === "demo"
                        ? workspaceColors.yellow
                        : record.within_geofence === false
                          ? workspaceColors.redSoft
                          : record.within_geofence === true
                            ? workspaceColors.green
                            : workspaceColors.muted;
                    return (
                      <View key={record.id} style={styles.workerRow}>
                        <Avatar
                          name={worker?.name ?? record.worker_id}
                          flag={worker?.flag}
                          size={38}
                          accent={color}
                        />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.workerName} numberOfLines={1}>
                            {worker?.name ?? record.worker_id}
                          </Text>
                          <Text style={styles.workerMeta} numberOfLines={1}>
                            {record.location_mode.toUpperCase()}
                            {record.distance_m != null ? ` · ${Math.round(record.distance_m)} m` : ""}
                          </Text>
                        </View>
                        <View style={[styles.workerState, { borderColor: `${color}66` }]}>
                          <View style={[styles.workerDot, { backgroundColor: color }]} />
                          <Text style={[styles.workerStateText, { color }]}>
                            {record.location_mode === "demo"
                              ? "DEMO"
                              : record.within_geofence === false
                                ? language === "pt"
                                  ? "FORA"
                                  : "OUT"
                                : record.within_geofence === true
                                  ? "GPS OK"
                                  : language === "pt"
                                    ? "VALIDAR"
                                    : "CHECK"}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.emptyInline}>
                    {language === "pt"
                      ? "Nenhum worker com sessão ativa nesta obra."
                      : "No worker has an active session on this site."}
                  </Text>
                )}
              </View>
            </>
          ) : (
            <EmptyState
              icon="business-outline"
              title={language === "pt" ? "Sem obras" : "No sites"}
            />
          )}
        </Card>
      </View>

      <Card>
        <SectionTitle
          title={language === "pt" ? "Estado de todas as obras" : "All site status"}
          subtitle={
            language === "pt"
              ? "Seleciona uma obra para a destacar no mapa."
              : "Select a site to highlight it on the map."
          }
        />
        <View style={styles.siteList}>
          {sites.map((site) => {
            const color = siteColor(site);
            return (
              <Pressable
                key={site.project.id}
                onPress={() => setSelectedProjectId(site.project.id)}
                style={({ pressed }) => [
                  styles.siteRow,
                  selected?.project.id === site.project.id
                    ? { borderColor: `${color}66`, backgroundColor: `${color}0D` }
                    : null,
                  pressed ? { opacity: 0.75 } : null,
                ]}
              >
                <View style={[styles.siteRowIcon, { borderColor: `${color}66` }]}>
                  <Ionicons name="business-outline" size={18} color={color} />
                </View>
                <View style={{ flex: 1, minWidth: 150 }}>
                  <Text style={styles.siteRowTitle}>{site.project.name}</Text>
                  <Text style={styles.siteRowMeta} numberOfLines={1}>
                    {site.project.location} · {site.project.geofence_radius_m ?? 250} m
                  </Text>
                </View>
                <Text style={styles.siteCount}>{site.activeAttendance.length}</Text>
                <Text style={styles.siteCountLabel}>
                  {language === "pt" ? "em obra" : "on site"}
                </Text>
                <StatusPill
                  status={siteStatus(site) === "alert" ? "paused" : site.activeAttendance.length ? "active" : site.project.status}
                  label={
                    siteStatus(site) === "alert"
                      ? language === "pt"
                        ? "Atenção"
                        : "Attention"
                      : site.activeAttendance.length
                        ? "Live"
                        : site.project.status
                  }
                />
              </Pressable>
            );
          })}
        </View>
      </Card>
    </ScrollView>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function Fact({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={17} color={workspaceColors.textSoft} />
      <View style={{ flex: 1 }}>
        <Text style={styles.factLabel}>{label}</Text>
        <Text style={styles.factValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 22, paddingBottom: 42, gap: 16 },
  contentCompact: { paddingHorizontal: 14, paddingTop: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 16 },
  headerCompact: { alignItems: "flex-start" },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: workspaceColors.panelSoft,
  },
  liveDot: { width: 7, height: 7, borderRadius: 99 },
  liveBadgeText: {
    color: workspaceColors.textSoft,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  mainGrid: { flexDirection: "row", gap: 16, alignItems: "stretch" },
  mainGridCompact: { flexDirection: "column" },
  mapCard: { flex: 1.35, minWidth: 0 },
  mapCardCompact: { minHeight: 430 },
  detailCard: { flex: 0.8, minWidth: 300 },
  mapSurface: {
    position: "relative",
    height: 470,
    marginTop: 16,
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: "#080C13",
  },
  gridLineHorizontal: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#20273566",
  },
  gridLineVertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "#20273566",
  },
  mapGlow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: "#FF3B4808",
    left: "38%",
    top: "22%",
  },
  sitePinWrap: {
    position: "absolute",
    width: 150,
    marginLeft: -22,
    marginTop: -22,
    alignItems: "flex-start",
  },
  pinPulse: {
    position: "absolute",
    width: 46,
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    left: -1,
    top: -1,
  },
  sitePin: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  pinLabel: {
    marginTop: 6,
    minWidth: 100,
    maxWidth: 150,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 10,
    backgroundColor: "#0D111ACC",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  pinTitle: { color: workspaceColors.text, fontSize: 11, fontWeight: "800" },
  pinMeta: { fontSize: 9, fontWeight: "800", marginTop: 2 },
  mapLegend: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#0B0F17E6",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 99 },
  legendText: { color: workspaceColors.textSoft, fontSize: 10, fontWeight: "700" },
  siteFacts: { gap: 9, marginTop: 16 },
  fact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    backgroundColor: workspaceColors.panelSoft,
  },
  factLabel: { color: workspaceColors.muted, fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  factValue: { color: workspaceColors.text, fontSize: 13, fontWeight: "800", marginTop: 2 },
  alertStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 14,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 12,
    padding: 11,
    backgroundColor: workspaceColors.panelSoft,
  },
  alertText: { color: workspaceColors.textSoft, fontSize: 12, lineHeight: 18, flex: 1 },
  workerList: { marginTop: 17, gap: 8 },
  listTitle: { color: workspaceColors.text, fontWeight: "800", fontSize: 13, marginBottom: 2 },
  workerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: workspaceColors.line,
  },
  workerName: { color: workspaceColors.text, fontSize: 12, fontWeight: "800" },
  workerMeta: { color: workspaceColors.muted, fontSize: 10, marginTop: 2 },
  workerState: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  workerDot: { width: 6, height: 6, borderRadius: 99 },
  workerStateText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  emptyInline: { color: workspaceColors.muted, fontSize: 12, lineHeight: 18 },
  siteList: { gap: 8, marginTop: 14 },
  siteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: workspaceColors.line,
    borderRadius: 14,
    padding: 11,
    backgroundColor: workspaceColors.panelSoft,
  },
  siteRowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  siteRowTitle: { color: workspaceColors.text, fontSize: 12, fontWeight: "800" },
  siteRowMeta: { color: workspaceColors.muted, fontSize: 10, marginTop: 2 },
  siteCount: { color: workspaceColors.text, fontSize: 18, fontWeight: "900" },
  siteCountLabel: { color: workspaceColors.muted, fontSize: 9, fontWeight: "700", marginRight: 4 },
});

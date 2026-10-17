import Ionicons from "@expo/vector-icons/Ionicons";
import React, { type ComponentProps } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, G, Path, Polygon, Rect } from "react-native-svg";

/**
 * WORKLY's vector symbol language.
 *
 * Technical motifs are original, geometric and platform-independent. The
 * Ionicons fallback is reserved for non-core utility actions, and is forced
 * to a consistent outline stroke whenever that icon variant exists.
 *
 * An unverified badge is always neutral; a verified mark is never inferred
 * from colour or a supplied certificate alone.
 */
export type WorklyIconName = ComponentProps<typeof Ionicons>["name"];
export type WorklyIconVariant = "plain" | "tile" | "emblem";

export const worklyIconPalette = {
  ink: "#263D49",
  steel: "#537E90",
  muted: "#869BA4",
  pale: "#EAF2F5",
  border: "#BDD2DB",
  paper: "#F7FAFB",
  verified: "#397B73",
  pending: "#AA8457",
} as const;

type SymbolKey =
  | "profile" | "career" | "site" | "document" | "time" | "shield"
  | "verified" | "education" | "machine" | "climate" | "electric"
  | "water" | "fire" | "solar" | "weld" | "lift" | "atex"
  | "value" | "medal" | "skills" | "pin" | "camera" | "settings";

function resolveSymbol(name: string): SymbolKey | null {
  const key = name.toLowerCase().replace(/(-outline|-sharp)$/, "");
  const exact: Record<string, SymbolKey> = {
    person: "profile", "person-circle": "profile", "people": "profile", "person-add": "profile", fingerprint: "profile", "id-card": "profile",
    "git-branch": "career", "git-network": "career", "trending-up": "career", "trail-sign": "career",
    business: "site", storefront: "site", build: "site", "briefcase": "site", "business-outline": "site", hammer: "site",
    folder: "document", "folder-open": "document", document: "document", "document-text": "document", archive: "document", receipt: "document", clipboard: "document", "cloud-upload": "document",
    time: "time", timer: "time", calendar: "time", "alarm": "time", stopwatch: "time", radio: "time",
    shield: "shield", "shield-checkmark": "shield", "lock-closed": "shield", key: "shield",
    "checkmark-circle": "verified", "checkmark-done": "verified", checkmark: "verified", checkbox: "verified",
    school: "education", book: "education", "book-outline": "education", library: "education",
    construct: "machine", "hardware-chip": "machine", cog: "machine", settings: "settings", "settings-outline": "settings", layers: "machine",
    snow: "climate", "snow-outline": "climate", "thermometer": "climate", "thermometer-outline": "climate",
    flash: "electric", battery: "electric", "battery-charging": "electric", power: "electric", bulb: "electric",
    water: "water", rain: "water", "water-outline": "water", "water-drop": "water",
    flame: "fire", "flame-outline": "fire", "flame-sharp": "fire",
    sunny: "solar", sun: "solar", grid: "solar", "grid-outline": "solar",
    sparkles: "weld", "sparkles-outline": "weld",
    "arrow-up-circle": "lift", "arrow-up": "lift",
    warning: "atex", alert: "atex", "alert-circle": "atex", flask: "atex", nuclear: "atex",
    analytics: "value", pulse: "value", speedometer: "value", stats: "value", "bar-chart": "value",
    ribbon: "medal", medal: "medal", trophy: "medal", diamond: "medal", "diamond-outline": "medal",
    extension: "skills", "link": "skills", "code-working": "skills", "git-merge": "skills",
    location: "pin", navigate: "pin", map: "pin", "map-outline": "pin",
    camera: "camera", image: "camera", images: "camera", "camera-outline": "camera",
  };
  return exact[key] ?? null;
}

function Motif({ symbol }: { symbol: SymbolKey }) {
  switch (symbol) {
    case "profile":
      return <><Circle cx={12} cy={8} r={3.2} /><Path d="M4.8 19.2v-1.5c0-3 3.2-5.1 7.2-5.1s7.2 2.1 7.2 5.1v1.5"/><Path d="M2.7 5V2.8H5M19 2.8h2.2V5M2.7 19v2.2H5M19 21.2h2.2V19"/></>;
    case "career":
      return <><Path d="M4 19.3V13l8-4.1 8-4.2"/><Path d="M12 8.9v6.2l-8 4.2"/><Polygon points="4,2.5 7,5.5 4,8.5 1,5.5"/><Polygon points="20,1.5 23,4.5 20,7.5 17,4.5"/><Polygon points="12,12 15.1,15.1 12,18.2 8.9,15.1"/><Circle cx={4} cy={19.2} r={2.2}/></>;
    case "site":
      return <><Path d="M3 21V8.2l7.5-4V21M10.5 10.5l10.5-4V21H3"/><Path d="M6.2 9.4v1.6m0 3v1.8m7.6-3.7v2.1m3.8-3.3v2.1m-3.8 4.3v2m3.8-3.5v2.1"/><Path d="M1.8 21.3h20.4"/></>;
    case "document":
      return <><Path d="M5.1 2.3h9l4.7 4.9V22H5.1Z"/><Path d="M14.1 2.6v4.9h4.6M8.4 11h7m-7 3.8h7"/><Rect x={8.4} y={17.6} width={2.3} height={2.2}/><Path d="M13 17.7h2.8m-2.8 2.2h1.2"/></>;
    case "time":
      return <><Circle cx={12} cy={12} r={9.1}/><Path d="M12 5v7l4.7 2.7"/><Path d="M12 2v1.4M21 12h-1.4M12 22v-1.4M3 12h1.4"/></>;
    case "shield":
      return <><Path d="M12 1.8 20.3 5v6.5c0 5-2.9 8.7-8.3 10.7-5.4-2-8.3-5.7-8.3-10.7V5Z"/><Path d="M8.5 12.2 11 14.6l4.8-5.1"/></>;
    case "verified":
      return <><Polygon points="12,1.8 21.4,7 21.4,17 12,22.2 2.6,17 2.6,7"/><Path d="m7 12.3 3.3 3.3L17.4 8.4"/></>;
    case "education":
      return <><Path d="m2 7 10-5 10 5-10 5Z"/><Path d="M5.3 9.1v6c3.8 3.5 9.6 3.5 13.4 0v-6"/><Path d="M21.9 7v10m-1.3 2h2.7"/></>;
    case "machine":
      return <><Rect x={5} y={5} width={14} height={14} rx={2}/><Circle cx={12} cy={12} r={4}/><Path d="M8.8 12h6.4m-3.2-3.2v6.4M2 9h3m-3 6h3m14-6h3m-3 6h3M9 2v3m6-3v3M9 19v3m6-3v3"/></>;
    case "climate":
      return <><Path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9 4.9 19.1"/><Path d="m9.4 4.5 2.6 2.6 2.6-2.6m-5.2 15 2.6-2.6 2.6 2.6M4.5 9.4 7.1 12l-2.6 2.6m15-5.2-2.6 2.6 2.6 2.6"/></>;
    case "electric":
      return <><Path d="m13.8 2.2-9.1 11h7.1l-1.6 8.6 9.1-11h-7Z"/><Path d="M2 5h3M19 19h3"/></>;
    case "water":
      return <><Path d="M12 2.4S5 10 5 14.3a7 7 0 0 0 14 0C19 10 12 2.4 12 2.4Z"/><Path d="M8.6 15.3a3.7 3.7 0 0 0 3.7 3.4"/></>;
    case "fire":
      return <><Path d="M12.8 2.3C15.4 6.5 11.3 8 14 11c2.4-1.3 2.9-3 2.9-3s3.3 4 3.3 7.1a8.2 8.2 0 0 1-16.4 0c0-4.1 2.9-6.8 4.4-8.4.3 3.1 1.9 4.4 1.9 4.4S12.9 7.7 12.8 2.3Z"/><Path d="M12.1 13.4c2 2 2.4 3.1 2.4 4.1a2.5 2.5 0 0 1-5 0c0-1.4 1.2-3 2.6-4.1Z"/></>;
    case "solar":
      return <><Circle cx={17.1} cy={6.4} r={2.8}/><Path d="M17.1 1.4v1.3m0 7.3v1.3m-5-4.9h1.2m7.4 0h1.2M13.6 2.9l.9.9m5.1 5.1.9.9"/><Path d="m3.4 11.2 11.7-.2 2.1 9.6H1.8Z"/><Path d="M9.2 11.2v9.3M2.9 16h13.3"/></>;
    case "weld":
      return <><Path d="M3 20.6h11.2M5 16l5.8-5.9 2.9 2.9-5.9 5.8Z"/><Path d="m11.8 10.1 2.8-2.8m.8-4.7.2 2.5m5.8 4.6-2.5-.2m-.7-5 2-2m-2 10.5 1.6 1.8M12.4 5.7l-2.1-1"/></>;
    case "lift":
      return <><Path d="M4 20.7h16M6 18.4h12M8 18.4 6 7h12l-2 11.4M4 6.9V4.2h16v2.7M12 18.4V7M9.5 10.8l2.5-2.5 2.5 2.5"/></>;
    case "atex":
      return <><Polygon points="12,1.5 22.5,12 12,22.5 1.5,12"/><Path d="M12 5.6v8.2M12 17.3v.4"/><Path d="m6.8 17.2 2.1-2m8.2-8.4-2 2"/></>;
    case "value":
      return <><Path d="M4 18a9 9 0 1 1 16 0"/><Path d="m12 12 5-4M4.6 18.9h14.8"/><Circle cx={12} cy={12} r={1.4}/><Path d="M5 12.2 6.4 13M12 3v2M19 12.2l-1.4.8"/></>;
    case "medal":
      return <><Path d="M5.4 2.4h4L12 7l2.6-4.6h4L15 9"/><Circle cx={12} cy={15} r={6.5}/><Polygon points="12,10.3 13.5,13.5 17,14 14.5,16.3 15.1,19.5 12,17.9 8.9,19.5 9.5,16.3 7,14 10.5,13.5"/></>;
    case "skills":
      return <><Polygon points="12,2 15.6,5.6 12,9.2 8.4,5.6"/><Polygon points="5,14.8 8.6,18.4 5,22 1.4,18.4"/><Polygon points="19,14.8 22.6,18.4 19,22 15.4,18.4"/><Path d="M12 9.2v3.6H5v2m7-2h7v2"/></>;
    case "pin":
      return <><Path d="M12 22s7-7 7-13.2a7 7 0 0 0-14 0C5 15 12 22 12 22Z"/><Circle cx={12} cy={9} r={2.5}/></>;
    case "camera":
      return <><Path d="M3 6.8h4l1.6-2.3h6.8L17 6.8h4v13H3Z"/><Circle cx={12} cy={13.1} r={3.5}/><Path d="M17.4 9.1h.2"/></>;
    case "settings":
      return <><Circle cx={12} cy={12} r={3.2}/><Path d="M10 2.3h4l.7 2.5 2.1 1.2 2.5-.7 2 3.4-1.8 1.8v2.4l1.8 1.8-2 3.4-2.5-.7-2.1 1.2-.7 2.5h-4l-.7-2.5-2.1-1.2-2.5.7-2-3.4 1.8-1.8v-2.4L2.7 8.7l2-3.4 2.5.7 2.1-1.2Z"/></>;
  }
}

export function WorklyIcon({
  name,
  size = 20,
  color = worklyIconPalette.steel,
  variant = "plain",
  active = false,
  verified = false,
  disabled = false,
  style,
}: {
  name: WorklyIconName;
  size?: number;
  color?: string;
  variant?: WorklyIconVariant;
  active?: boolean;
  verified?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const key = resolveSymbol(name);
  const tone = disabled ? worklyIconPalette.muted : verified ? worklyIconPalette.verified : color;
  const framed = variant !== "plain";
  const isEmblem = variant === "emblem";
  const fill = verified ? "#E5F3EF" : active ? "#DBEAF0" : worklyIconPalette.paper;
  const alternative = name.endsWith("-outline") ? name : (name + "-outline") as WorklyIconName;
  const fallback = Object.prototype.hasOwnProperty.call(Ionicons.glyphMap, alternative) ? alternative : name;
  return (
    <View pointerEvents="none" style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {framed ? (
          isEmblem
            ? <Polygon points="12,0.9 21.8,6.4 21.8,17.6 12,23.1 2.2,17.6 2.2,6.4" stroke={verified ? worklyIconPalette.verified : active ? tone : worklyIconPalette.border} strokeWidth={1.15} fill={fill}/>
            : <Rect x={1.2} y={1.2} width={21.6} height={21.6} rx={5} stroke={active ? tone : worklyIconPalette.border} strokeWidth={1.1} fill={fill}/>
        ) : null}
        {framed ? <Path d="M4.5 3.5h2m10.5 0h2M4.5 20.5h2m10.5 0h2" stroke={tone} strokeWidth={0.6} strokeOpacity={0.55}/> : null}
        {key ? (
          <G transform={framed ? "translate(3.8 3.8) scale(0.68333)" : undefined} stroke={tone} strokeWidth={1.65} strokeLinecap="round" strokeLinejoin="round" fill="none">
            <Motif symbol={key} />
          </G>
        ) : null}
      </Svg>
      {!key ? <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { alignItems: "center", justifyContent: "center" }]}><Ionicons name={fallback} color={tone} size={framed ? size * 0.59 : size * 0.88} /></View> : null}
    </View>
  );
}

export default WorklyIcon;

import { Platform } from "react-native";

export type DemoLocation = {
  latitude: number | null;
  longitude: number | null;
  location_mode: "gps" | "demo";
};

export async function resolveDemoLocation(
  fallback: { latitude?: number | null; longitude?: number | null } = {},
): Promise<DemoLocation> {
  const demo: DemoLocation = {
    latitude: fallback.latitude ?? 40.2033,
    longitude: fallback.longitude ?? -8.4103,
    location_mode: "demo",
  };
  if (Platform.OS !== "web" || typeof navigator === "undefined") return demo;
  if (!navigator.geolocation) return demo;

  return new Promise<DemoLocation>((resolve) => {
    const timeout = setTimeout(() => resolve(demo), 4500);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeout);
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          location_mode: "gps",
        });
      },
      () => {
        clearTimeout(timeout);
        resolve(demo);
      },
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 120_000 },
    );
  });
}

import React, { useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image, ImageSource } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/AuthContext";

type ProfileSection = "cover" | "info" | "skills" | "projects";

const PROFILE_PAGES: Record<ProfileSection, ImageSource> = {
  cover: require("../../assets/images/worker-profile/cover.jpg"),
  info: require("../../assets/images/worker-profile/info.jpg"),
  skills: require("../../assets/images/worker-profile/skills.jpg"),
  projects: require("../../assets/images/worker-profile/projects.jpg"),
};

const SECTION_ORDER: ProfileSection[] = [
  "cover",
  "info",
  "skills",
  "projects",
];

const MENU_ITEMS: {
  id: Exclude<ProfileSection, "cover">;
  label: string;
  accessibilityLabel: string;
}[] = [
  { id: "info", label: "INFO", accessibilityLabel: "Informações pessoais" },
  { id: "skills", label: "SKIL", accessibilityLabel: "Competências" },
  { id: "projects", label: "PROJ", accessibilityLabel: "Projetos e certificados" },
];

export default function WorkerProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { logout } = useAuth();
  const [section, setSection] = useState<ProfileSection>("cover");
  const [transitioning, setTransitioning] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const selectSection = (nextSection: ProfileSection) => {
    if (nextSection === section || transitioning) return;

    const direction =
      SECTION_ORDER.indexOf(nextSection) > SECTION_ORDER.indexOf(section)
        ? 1
        : -1;

    setTransitioning(true);

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -direction * Math.min(width * 0.16, 90),
        duration: 170,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSection(nextSection);
      translateX.setValue(direction * Math.min(width * 0.16, 90));

      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          damping: 20,
          stiffness: 210,
          mass: 0.7,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 190,
          useNativeDriver: true,
        }),
      ]).start(() => setTransitioning(false));
    });
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <View style={styles.screen}>
      <Animated.View
        style={[
          styles.page,
          {
            opacity,
            transform: [{ translateX }],
          },
        ]}
      >
        <Image
          source={PROFILE_PAGES[section]}
          style={styles.image}
          contentFit="contain"
          transition={0}
          accessibilityLabel={`Perfil de Rodolfo Maia - ${section}`}
        />
      </Animated.View>

      <View
        style={[
          styles.topActions,
          {
            top: Math.max(insets.top, 12) + 6,
          },
        ]}
      >
        {section === "cover" ? <View style={styles.actionPlaceholder} /> : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar à capa do perfil"
            onPress={() => selectSection("cover")}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons name="chevron-back" size={22} color="#F5F8FF" />
            <Text style={styles.iconButtonLabel}>CAPA</Text>
          </Pressable>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Terminar sessão"
          onPress={() => void handleLogout()}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
        >
          <Ionicons name="log-out-outline" size={20} color="#F5F8FF" />
        </Pressable>
      </View>

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.82)", "#000000"]}
        locations={[0, 0.44, 1]}
        pointerEvents="none"
        style={styles.bottomShade}
      />

      <View
        style={[
          styles.sectionMenu,
          {
            paddingBottom: Math.max(insets.bottom, 8) + (Platform.OS === "web" ? 10 : 2),
          },
        ]}
      >
        {MENU_ITEMS.map((item) => {
          const active = section === item.id;

          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityLabel={item.accessibilityLabel}
              accessibilityState={{ selected: active }}
              onPress={() => selectSection(item.id)}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>
                {item.label}
              </Text>
              <View style={[styles.menuIndicator, active && styles.menuIndicatorActive]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  page: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  topActions: {
    position: "absolute",
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionPlaceholder: {
    width: 82,
    height: 40,
  },
  iconButton: {
    minWidth: 82,
    height: 40,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(45,160,255,0.68)",
    backgroundColor: "rgba(0,0,0,0.64)",
  },
  iconButtonLabel: {
    color: "#F5F8FF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  logoutButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(0,0,0,0.64)",
  },
  bottomShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 148,
  },
  sectionMenu: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
    minHeight: 74,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
  },
  menuItem: {
    minWidth: 82,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 8,
  },
  menuLabel: {
    color: "rgba(223,232,243,0.68)",
    fontFamily: Platform.select({ web: "monospace", default: undefined }),
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 3.5,
    textShadowColor: "rgba(37,151,255,0.25)",
    textShadowRadius: 8,
  },
  menuLabelActive: {
    color: "#28A5FF",
    textShadowColor: "#007BFF",
    textShadowRadius: 12,
  },
  menuIndicator: {
    width: 22,
    height: 2,
    borderRadius: 1,
    backgroundColor: "transparent",
  },
  menuIndicatorActive: {
    width: 46,
    backgroundColor: "#28A5FF",
    shadowColor: "#008CFF",
    shadowOpacity: 0.9,
    shadowRadius: 9,
  },
  pressed: {
    opacity: 0.64,
  },
});

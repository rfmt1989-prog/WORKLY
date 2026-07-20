import React, { useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type DimensionValue,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image, type ImageSource } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/context/AuthContext";

type ProfileSection = "info" | "skills" | "projects";
type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const PROFILE_BACKGROUNDS: Record<ProfileSection, ImageSource> = {
  info: require("../../assets/images/worker-profile/profile-info.jpg"),
  skills: require("../../assets/images/worker-profile/profile-skills.jpg"),
  projects: require("../../assets/images/worker-profile/profile-projects.jpg"),
};

const SECTION_ORDER: ProfileSection[] = ["info", "skills", "projects"];

const MENU_ITEMS: {
  id: ProfileSection;
  label: string;
  icon: IoniconName;
  accessibilityLabel: string;
}[] = [
  {
    id: "info",
    label: "INFO",
    icon: "person-outline",
    accessibilityLabel: "Informações profissionais",
  },
  {
    id: "skills",
    label: "SKILLS",
    icon: "build-outline",
    accessibilityLabel: "Competências técnicas",
  },
  {
    id: "projects",
    label: "OBRAS",
    icon: "construct-outline",
    accessibilityLabel: "Obras e certificados",
  },
];

const LANGUAGES = [
  { name: "Português", level: "Nativo", score: 5 },
  { name: "Inglês", level: "Falo bem", score: 4 },
  { name: "Espanhol", level: "Médio / baixo", score: 2 },
];

const TECHNICAL_SKILLS = [
  { name: "Infraestruturas metálicas", score: 92 },
  { name: "Eletricidade", score: 91 },
  { name: "Canalização", score: 87 },
  { name: "Sistemas AVAC", score: 89 },
  { name: "Trabalhos em altura", score: 90 },
  { name: "Leitura de esquemas técnicos", score: 88 },
  { name: "Montagem industrial", score: 90 },
  { name: "Segurança em obra", score: 93 },
];

const PROJECTS = [
  { company: "Galp Petrogal", location: "Sines", icon: "business-outline" as IoniconName },
  { company: "Sirmax", location: "Indianapolis", icon: "cube-outline" as IoniconName },
  { company: "Dal-Tile", location: "Tennessee", icon: "grid-outline" as IoniconName },
  { company: "Rennes Métropole", location: "Rennes", icon: "trail-sign-outline" as IoniconName },
];

const CERTIFICATES = [
  { label: "Trabalho em altura", icon: "accessibility-outline" as IoniconName },
  { label: "Segurança industrial", icon: "shield-checkmark-outline" as IoniconName },
  { label: "LOTO / bloqueio e etiquetagem", icon: "lock-closed-outline" as IoniconName },
  { label: "Primeiros socorros", icon: "medkit-outline" as IoniconName },
];

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      <View style={styles.titleRule} />
    </View>
  );
}

function InfoSection() {
  return (
    <>
      <SectionHeader eyebrow="PERFIL PROFISSIONAL" title="Rodolfo Maia" />

      <View style={styles.rolePill}>
        <Ionicons name="flash-outline" size={15} color="#59B8FF" />
        <Text style={styles.roleText}>ELETROMECÂNICO</Text>
      </View>

      <View style={styles.glassCard}>
        <Text style={styles.cardLabel}>SOBRE</Text>
        <Text style={styles.bodyText}>
          Profissional com experiência sólida em ambientes industriais e projetos
          internacionais. Atuação focada em infraestruturas metálicas,
          eletricidade, canalização, sistemas AVAC, montagem técnica e segurança
          em obra. Perfil orientado para qualidade, eficiência e entrega de
          resultados.
        </Text>
      </View>

      <View style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={18} color="#319FFF" />
          <View>
            <Text style={styles.detailLabel}>IDADE</Text>
            <Text style={styles.detailValue}>36 anos</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="flag-outline" size={18} color="#319FFF" />
          <View>
            <Text style={styles.detailLabel}>NACIONALIDADE</Text>
            <Text style={styles.detailValue}>Portuguesa</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="briefcase-outline" size={18} color="#319FFF" />
          <View>
            <Text style={styles.detailLabel}>PROFISSÃO</Text>
            <Text style={styles.detailValue}>Eletromecânico</Text>
          </View>
        </View>
      </View>

      <View style={styles.glassCard}>
        <View style={styles.cardHeadingRow}>
          <Ionicons name="language-outline" size={18} color="#319FFF" />
          <Text style={styles.cardLabel}>IDIOMAS</Text>
        </View>
        {LANGUAGES.map((language) => (
          <View key={language.name} style={styles.languageRow}>
            <View style={styles.languageCopy}>
              <Text style={styles.languageName}>{language.name}</Text>
              <Text style={styles.languageLevel}>{language.level}</Text>
            </View>
            <View style={styles.dots}>
              {[0, 1, 2, 3, 4].map((dot) => (
                <View
                  key={dot}
                  style={[styles.dot, dot < language.score && styles.dotActive]}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

function SkillsSection() {
  return (
    <>
      <SectionHeader eyebrow="COMPETÊNCIAS" title="Skills técnicas" />

      <View style={styles.scoreCard}>
        <View>
          <Text style={styles.cardLabel}>AVALIAÇÃO GLOBAL</Text>
          <Text style={styles.scoreCaption}>Qualidade, rigor e segurança</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreNumber}>91</Text>
          <Text style={styles.scoreUnit}>OVR</Text>
        </View>
      </View>

      <View style={styles.glassCard}>
        {TECHNICAL_SKILLS.map((skill) => (
          <View key={skill.name} style={styles.skillRow}>
            <View style={styles.skillCopy}>
              <Text style={styles.skillName}>{skill.name}</Text>
              <Text style={styles.skillScore}>{skill.score}</Text>
            </View>
            <View style={styles.skillTrack}>
              <View
                style={[
                  styles.skillFill,
                  { width: `${skill.score}%` as DimensionValue },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.attributeGrid}>
        {["Organização", "Autonomia", "Rigor técnico", "Segurança", "Adaptabilidade", "Trabalho em equipa"].map(
          (attribute) => (
            <View key={attribute} style={styles.attributePill}>
              <Ionicons name="checkmark-circle" size={14} color="#319FFF" />
              <Text style={styles.attributeText}>{attribute}</Text>
            </View>
          ),
        )}
      </View>
    </>
  );
}

function ProjectsSection() {
  return (
    <>
      <SectionHeader eyebrow="EXPERIÊNCIA INTERNACIONAL" title="Obras e certificados" />

      <View style={styles.glassCard}>
        <View style={styles.cardHeadingRow}>
          <Ionicons name="construct-outline" size={19} color="#319FFF" />
          <Text style={styles.cardLabel}>MELHORES PROJETOS</Text>
        </View>
        {PROJECTS.map((project, index) => (
          <View key={`${project.company}-${project.location}`} style={styles.projectRow}>
            <View style={styles.projectIcon}>
              <Ionicons name={project.icon} size={20} color="#65BDFF" />
            </View>
            <View style={styles.projectCopy}>
              <Text style={styles.projectCompany}>{project.company}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color="#8492A7" />
                <Text style={styles.projectLocation}>{project.location}</Text>
              </View>
            </View>
            <Text style={styles.projectNumber}>{String(index + 1).padStart(2, "0")}</Text>
          </View>
        ))}
      </View>

      <View style={styles.glassCard}>
        <View style={styles.cardHeadingRow}>
          <Ionicons name="ribbon-outline" size={19} color="#319FFF" />
          <Text style={styles.cardLabel}>CERTIFICADOS</Text>
        </View>
        <View style={styles.certificateGrid}>
          {CERTIFICATES.map((certificate) => (
            <View key={certificate.label} style={styles.certificatePill}>
              <Ionicons name={certificate.icon} size={17} color="#59B8FF" />
              <Text style={styles.certificateText}>{certificate.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

function SectionContent({ section }: { section: ProfileSection }) {
  if (section === "skills") return <SkillsSection />;
  if (section === "projects") return <ProjectsSection />;
  return <InfoSection />;
}

export default function WorkerProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { logout } = useAuth();
  const compact = width < 720;
  const panelWidth = compact ? width * 0.59 : Math.min(width * 0.45, 650);
  const [section, setSection] = useState<ProfileSection>("info");
  const [transitioning, setTransitioning] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const selectSection = (nextSection: ProfileSection) => {
    if (nextSection === section || transitioning) return;

    const direction =
      SECTION_ORDER.indexOf(nextSection) > SECTION_ORDER.indexOf(section) ? 1 : -1;

    setTransitioning(true);
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -direction * Math.min(width * 0.08, 70),
        duration: 170,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 145,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSection(nextSection);
      translateX.setValue(direction * Math.min(width * 0.08, 70));

      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          damping: 22,
          stiffness: 210,
          mass: 0.72,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 210,
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
          styles.stage,
          {
            opacity,
            transform: [{ translateX }],
          },
        ]}
      >
        <View style={[styles.photoLayer, compact && styles.photoLayerCompact]}>
          <Image
            source={PROFILE_BACKGROUNDS[section]}
            style={styles.photo}
            contentFit={compact ? "cover" : "contain"}
            contentPosition={compact ? "center" : "left"}
            transition={0}
            accessibilityLabel={`Fotografia profissional de Rodolfo Maia - ${section}`}
          />
        </View>

        <LinearGradient
          colors={
            compact
              ? ["rgba(0,0,0,0.04)", "rgba(3,6,12,0.72)", "#03060C"]
              : ["rgba(0,0,0,0.01)", "rgba(3,6,12,0.54)", "#03060C"]
          }
          locations={[0, compact ? 0.38 : 0.44, 0.72]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
        />

        <LinearGradient
          colors={["rgba(3,6,12,0.82)", "transparent", "rgba(3,6,12,0.9)"]}
          locations={[0, 0.22, 1]}
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
        />

        <View
          style={[
            styles.contentPanel,
            {
              top: Math.max(insets.top, 10) + 70,
              right: compact ? 9 : Math.max(width * 0.04, 28),
              bottom: Math.max(insets.bottom, 8) + 94,
              width: panelWidth,
            },
            compact && styles.contentPanelCompact,
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              compact && styles.scrollContentCompact,
            ]}
          >
            <SectionContent section={section} />
          </ScrollView>
        </View>
      </Animated.View>

      <View
        style={[
          styles.topBar,
          {
            top: Math.max(insets.top, 10) + 8,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar ao dashboard"
          onPress={() => router.replace("/(worker)" as never)}
          style={({ pressed }) => [styles.dashboardButton, pressed && styles.pressed]}
        >
          <Ionicons name="grid-outline" size={17} color="#59B8FF" />
          {!compact && <Text style={styles.dashboardButtonText}>DASHBOARD</Text>}
        </Pressable>

        <View style={styles.topIdentity}>
          <Text style={styles.topIdentityName}>RODOLFO MAIA</Text>
          <Text style={styles.topIdentityRole}>PERFIL PROFISSIONAL</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Terminar sessão"
          onPress={() => void handleLogout()}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
        >
          <Ionicons name="log-out-outline" size={19} color="#F5F8FF" />
        </Pressable>
      </View>

      <View
        style={[
          styles.menuDock,
          {
            bottom: Math.max(insets.bottom, 8),
          },
        ]}
      >
        <View style={styles.sectionMenu} accessibilityRole="tablist">
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
                  active && styles.menuItemActive,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={compact ? 17 : 19}
                  color={active ? "#59B8FF" : "#728096"}
                />
                <Text
                  style={[
                    styles.menuLabel,
                    compact && styles.menuLabelCompact,
                    active && styles.menuLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
                <View style={[styles.menuIndicator, active && styles.menuIndicatorActive]} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const monoFont = Platform.select({ web: "monospace", default: undefined });

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#03060C",
  },
  stage: {
    ...StyleSheet.absoluteFillObject,
  },
  photoLayer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "66%",
    backgroundColor: "#000000",
  },
  photoLayerCompact: {
    width: "100%",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  topBar: {
    position: "absolute",
    left: 14,
    right: 14,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dashboardButton: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(64,168,255,0.45)",
    backgroundColor: "rgba(3,8,16,0.72)",
  },
  dashboardButtonText: {
    color: "#DDEEFF",
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  topIdentity: {
    alignItems: "center",
  },
  topIdentityName: {
    color: "#F4F8FF",
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2.2,
  },
  topIdentityRole: {
    marginTop: 2,
    color: "#359FFF",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.7,
  },
  logoutButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.24)",
    backgroundColor: "rgba(3,8,16,0.72)",
  },
  contentPanel: {
    position: "absolute",
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(82,171,255,0.24)",
    backgroundColor: "rgba(3,8,16,0.7)",
    shadowColor: "#000000",
    shadowOpacity: 0.42,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
  },
  contentPanelCompact: {
    borderRadius: 16,
    backgroundColor: "rgba(3,8,16,0.78)",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 24,
    gap: 14,
  },
  scrollContentCompact: {
    paddingHorizontal: 13,
    paddingTop: 16,
    paddingBottom: 18,
    gap: 10,
  },
  sectionHeader: {
    gap: 4,
  },
  eyebrow: {
    color: "#359FFF",
    fontFamily: monoFont,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  sectionTitle: {
    color: "#F7FAFF",
    fontSize: 27,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -0.7,
  },
  titleRule: {
    marginTop: 7,
    width: 46,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#319FFF",
    shadowColor: "#319FFF",
    shadowOpacity: 0.9,
    shadowRadius: 7,
  },
  rolePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 11,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(62,169,255,0.42)",
    backgroundColor: "rgba(25,112,190,0.16)",
  },
  roleText: {
    color: "#DDEEFF",
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  glassCard: {
    padding: 14,
    gap: 11,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.045)",
  },
  cardHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardLabel: {
    color: "#AFC1D8",
    fontFamily: monoFont,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.45,
  },
  bodyText: {
    color: "#D9E1EC",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
  detailsCard: {
    padding: 14,
    gap: 12,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(49,159,255,0.19)",
    backgroundColor: "rgba(10,42,72,0.22)",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  detailLabel: {
    color: "#74849A",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  detailValue: {
    marginTop: 1,
    color: "#F0F5FC",
    fontSize: 12,
    fontWeight: "700",
  },
  languageRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  languageCopy: {
    flex: 1,
  },
  languageName: {
    color: "#EDF4FE",
    fontSize: 11,
    fontWeight: "700",
  },
  languageLevel: {
    color: "#8290A4",
    fontSize: 8,
    marginTop: 1,
  },
  dots: {
    flexDirection: "row",
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#536175",
  },
  dotActive: {
    borderColor: "#319FFF",
    backgroundColor: "#319FFF",
    shadowColor: "#319FFF",
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },
  scoreCard: {
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(49,159,255,0.31)",
    backgroundColor: "rgba(14,74,124,0.24)",
  },
  scoreCaption: {
    marginTop: 4,
    color: "#8997A9",
    fontSize: 9,
  },
  scoreBadge: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#319FFF",
    backgroundColor: "rgba(15,84,145,0.36)",
    shadowColor: "#2196F3",
    shadowOpacity: 0.55,
    shadowRadius: 10,
  },
  scoreNumber: {
    color: "#FFFFFF",
    fontFamily: monoFont,
    fontSize: 23,
    lineHeight: 25,
    fontWeight: "900",
  },
  scoreUnit: {
    color: "#59B8FF",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  skillRow: {
    gap: 5,
  },
  skillCopy: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  skillName: {
    flex: 1,
    color: "#DDE6F2",
    fontSize: 10,
    fontWeight: "600",
  },
  skillScore: {
    color: "#79C5FF",
    fontFamily: monoFont,
    fontSize: 9,
    fontWeight: "800",
  },
  skillTrack: {
    height: 4,
    overflow: "hidden",
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  skillFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#319FFF",
    shadowColor: "#319FFF",
    shadowOpacity: 0.7,
    shadowRadius: 5,
  },
  attributeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  attributePill: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  attributeText: {
    color: "#C9D5E5",
    fontSize: 8,
    fontWeight: "700",
  },
  projectRow: {
    minHeight: 51,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.09)",
  },
  projectIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "rgba(49,159,255,0.12)",
  },
  projectCopy: {
    flex: 1,
  },
  projectCompany: {
    color: "#F1F6FD",
    fontSize: 11,
    fontWeight: "800",
  },
  locationRow: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  projectLocation: {
    color: "#8492A7",
    fontSize: 8,
  },
  projectNumber: {
    color: "rgba(89,184,255,0.38)",
    fontFamily: monoFont,
    fontSize: 14,
    fontWeight: "900",
  },
  certificateGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  certificatePill: {
    minWidth: "46%",
    paddingHorizontal: 9,
    paddingVertical: 8,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(49,159,255,0.2)",
    backgroundColor: "rgba(49,159,255,0.075)",
  },
  certificateText: {
    flex: 1,
    color: "#D7E2EF",
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "700",
  },
  menuDock: {
    position: "absolute",
    left: 12,
    right: 12,
    alignItems: "center",
  },
  sectionMenu: {
    width: "100%",
    maxWidth: 620,
    height: 72,
    padding: 6,
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(91,177,255,0.28)",
    backgroundColor: "rgba(3,8,16,0.92)",
    shadowColor: "#000000",
    shadowOpacity: 0.55,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  menuItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: 18,
  },
  menuItemActive: {
    backgroundColor: "rgba(39,145,232,0.12)",
  },
  menuLabel: {
    color: "#728096",
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.45,
  },
  menuLabelCompact: {
    fontSize: 8,
    letterSpacing: 0.9,
  },
  menuLabelActive: {
    color: "#DCEEFF",
  },
  menuIndicator: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: "transparent",
  },
  menuIndicatorActive: {
    width: 34,
    backgroundColor: "#319FFF",
    shadowColor: "#319FFF",
    shadowOpacity: 0.9,
    shadowRadius: 7,
  },
  pressed: {
    opacity: 0.62,
  },
});

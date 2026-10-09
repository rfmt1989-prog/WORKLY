import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { uiText } from "@/src/demo/fullUi";
import type { LanguageCode, WorkExperience } from "@/src/demo/types";
import { Button } from "./primitives";

export function WorkerExperienceTimeline({
  entries,
  language,
  onAdd,
  onEdit,
}: {
  entries: WorkExperience[];
  language: LanguageCode;
  onAdd: () => void;
  onEdit: (entry: WorkExperience) => void;
}) {
  const text = (pt: string, en: string) => uiText(language, pt, en);
  const ordered = [...entries].sort((a, b) => b.start_date.localeCompare(a.start_date));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>{text("EXPERIÊNCIA PROFISSIONAL", "PROFESSIONAL EXPERIENCE")}</Text>
          <Text style={styles.title}>{text("Histórico de trabalho", "Work history")}</Text>
        </View>
        <Button
          label={text("Adicionar", "Add")}
          icon="add-outline"
          variant="secondary"
          onPress={onAdd}
          style={styles.add}
        />
      </View>

      {!ordered.length ? (
        <View style={styles.empty}>
          <Ionicons name="briefcase-outline" size={24} color="#5E7D96" />
          <Text style={styles.emptyTitle}>{text("Ainda sem experiência registada", "No experience recorded yet")}</Text>
          <Text style={styles.emptyText}>
            {text(
              "Adiciona cada empresa e função. A WORKLY calcula automaticamente o tempo de experiência.",
              "Add each company and role. WORKLY automatically calculates your experience duration.",
            )}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {ordered.map((entry) => (
            <Pressable
              key={entry.id}
              accessibilityRole="button"
              onPress={() => onEdit(entry)}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <View style={[styles.statusDot, entry.status === "verified" && styles.statusVerified]} />
              <View style={styles.copy}>
                <View style={styles.row}>
                  <Text style={styles.role}>{entry.role}</Text>
                  <Text style={styles.status}>
                    {entry.status === "verified"
                      ? text("Verificada", "Verified")
                      : entry.status === "pending"
                        ? text("A validar", "Pending")
                        : text("Registada", "Recorded")}
                  </Text>
                </View>
                <Text style={styles.company}>{entry.company}</Text>
                <Text style={styles.meta}>
                  {entry.start_date} → {entry.current ? text("Atual", "Present") : entry.end_date || "—"}
                  {entry.location ? " · " + entry.location : ""}
                  {entry.country ? " · " + entry.country : ""}
                </Text>
                {entry.description ? (
                  <Text style={styles.description} numberOfLines={2}>{entry.description}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward-outline" size={15} color="#66839A" />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card:{borderWidth:1,borderColor:"#19354A",borderRadius:18,backgroundColor:"#060D14E8",padding:16,gap:14},
  header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:12},
  eyebrow:{color:"#6F91AC",fontSize:8,lineHeight:12,letterSpacing:1.5,fontWeight:"700"},
  title:{color:"#DFEAF3",fontSize:17,lineHeight:23,fontWeight:"700",marginTop:2},
  add:{minHeight:36},
  empty:{alignItems:"center",paddingVertical:18,gap:7},
  emptyTitle:{color:"#BFD0DE",fontSize:12,fontWeight:"600"},
  emptyText:{color:"#6E869A",fontSize:10,lineHeight:16,textAlign:"center",maxWidth:520},
  list:{gap:2},
  item:{minHeight:78,flexDirection:"row",alignItems:"flex-start",gap:10,paddingVertical:11,borderBottomWidth:1,borderBottomColor:"#132837"},
  pressed:{opacity:.7},
  statusDot:{width:8,height:8,borderRadius:4,backgroundColor:"#60788C",marginTop:6},
  statusVerified:{backgroundColor:"#68AEE7"},
  copy:{flex:1,minWidth:0,gap:2},
  row:{flexDirection:"row",justifyContent:"space-between",gap:10},
  role:{color:"#D2E0EB",fontSize:12,lineHeight:17,fontWeight:"600",flex:1},
  status:{color:"#7394AE",fontSize:8,lineHeight:12},
  company:{color:"#91AAC0",fontSize:10,lineHeight:15},
  meta:{color:"#637D92",fontSize:8,lineHeight:13},
  description:{color:"#758EA2",fontSize:9,lineHeight:14,marginTop:2},
});

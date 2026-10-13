import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { professionalText, specialtyCopy, specialtyRequirementText } from "@/src/demo/professionalI18n";
import type { LanguageCode } from "@/src/demo/types";
import { JourneyStatus, JourneySymbol } from "./WorkerJourneyTree";
import type { AchievementNode, SpecialtyTree } from "./workerCertificateTree";
import { specialtyCatalog } from "./professionCatalog";

export function WorkerSpecialtyTree({
  tree,
  language,
  onNode,
  expanded: controlledExpanded,
  onToggle,
}: {
  tree: SpecialtyTree;
  language: LanguageCode;
  onNode: (node: AchievementNode) => void;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const text = (pt: string, en: string) => professionalText(language, pt, en);
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = controlledExpanded ?? internalExpanded;
  const toggle = () => onToggle ? onToggle() : setInternalExpanded(value => !value);

  return (
    <View style={styles.panel} testID="worker-specialty-tree">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={toggle}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
      >
        <View style={styles.headerIcon}>
          <Ionicons name="git-network-outline" size={18} color="#4B7E91" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>{text("DESENVOLVIMENTO TÉCNICO", "TECHNICAL DEVELOPMENT")}</Text>
          <Text style={styles.title}>{text("Extras", "Extras")}</Text>
          {expanded ? (
            <Text style={styles.description}>
              {text(tree.description, tree.descriptionEn)}
            </Text>
          ) : null}
        </View>
        <View style={styles.count}>
          <Text style={styles.countValue}>{tree.unlockedCount}</Text>
          <View style={styles.countLine}>
            <Text style={styles.countLabel}>{text("disponíveis", "available")}</Text>
            <Ionicons
              name={expanded ? "chevron-up-outline" : "chevron-down-outline"}
              size={14}
              color="#657C88"
            />
          </View>
        </View>
      </Pressable>

      {expanded ? (
        <>
      <View style={styles.timeline}>
        {tree.nodes.map((node, index) => {
          const locked = node.status === "locked";
          const definition = specialtyCatalog.find((item) => item.id === node.id);
          return (
            <Pressable
              key={node.id}
              accessibilityRole="button"
              accessibilityLabel={specialtyCopy(language, node.id, node.title, definition?.titleEn || node.title)}
              onPress={() => onNode(node)}
              style={({ pressed }) => [
                styles.row,
                locked && styles.rowLocked,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.lane}>
                <View
                  style={[
                    styles.rail,
                    index === 0 && styles.railFirst,
                    index === tree.nodes.length - 1 && styles.railLast,
                    !locked && styles.railOpen,
                  ]}
                />
                <JourneySymbol node={node} />
              </View>
              <View style={styles.copy}>
                <View style={styles.titleRow}>
                  <Text style={[styles.nodeTitle, locked && styles.nodeTitleLocked]}>
                    {specialtyCopy(language, node.id, node.title, definition?.titleEn || node.title)}
                  </Text>
                  {!locked ? (
                    <View style={styles.unlockChip}>
                      <Text style={styles.unlockText}>
                        {node.status === "available"
                          ? text("DESBLOQUEADA", "UNLOCKED")
                          : text("ATIVA", "ACTIVE")}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.nodeSubtitle} numberOfLines={2}>
                  {specialtyCopy(language, node.id, node.subtitle, definition?.descriptionEn || node.subtitle, true)}
                </Text>
                <JourneyStatus node={node} language={language} />
                {locked && node.meta?.length ? (
                  <View style={styles.requirements}>
                    {node.meta.slice(0, 3).map((item) => (
                      <Text key={item} style={styles.requirement}>· {specialtyRequirementText(language, item)}</Text>
                    ))}
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={14} color="#C7B6A4" />
        <Text style={styles.noteText}>
          {text(
            "O desbloqueio é progressão interna WORKLY. Certificações e autorizações legais continuam a exigir comprovativo próprio.",
            "Unlocking is an internal WORKLY progression. Legal certificates and authorisations still require their own evidence.",
          )}
        </Text>
      </View>
        </>
      ) : null}
    </View>
  );
}

const styles=StyleSheet.create({
  panel:{borderWidth:1,borderColor: "#DDE7EA",borderRadius:20,backgroundColor: "#FFFFFF",padding:16,gap:14},
  header:{flexDirection:"row",alignItems:"flex-start",gap:12,borderRadius:12},
  headerPressed:{opacity:.78},
  headerIcon:{width:40,height:40,borderRadius:14,borderWidth:1,borderColor: "#DDE7EA",backgroundColor: "#EAF2F4",alignItems:"center",justifyContent:"center"},
  headerText:{flex:1,minWidth:0,gap:3},
  eyebrow:{color: "#4B7E91",fontSize:8,lineHeight:12,letterSpacing:1.8,fontWeight:"700"},
  title:{color: "#233844",fontSize:18,lineHeight:24,fontWeight:"700"},
  description:{color: "#657C88",fontSize:11,lineHeight:17},
  count:{alignItems:"flex-end"},
  countValue:{color: "#4B7E91",fontSize:21,lineHeight:25,fontWeight:"700"},
  countLine:{flexDirection:"row",alignItems:"center",gap:6},
  countLabel:{color: "#4B7E91",fontSize:9,lineHeight:13},
  timeline:{paddingTop:2},
  row:{minHeight:90,flexDirection:"row",alignItems:"stretch",borderRadius:12},
  rowLocked:{opacity:.72},
  pressed:{backgroundColor: "#EAF2F4",opacity:.88},
  lane:{width:62,alignItems:"center",justifyContent:"center",position:"relative"},
  rail:{position:"absolute",top:0,bottom:0,width:1,backgroundColor: "#F7FAFB"},
  railOpen:{backgroundColor: "#EAF2F4"},
  railFirst:{top:45},
  railLast:{bottom:45},
  copy:{flex:1,minWidth:0,justifyContent:"center",gap:4,paddingVertical:10,paddingLeft:8},
  titleRow:{flexDirection:"row",alignItems:"center",flexWrap:"wrap",gap:8},
  nodeTitle:{color: "#233844",fontSize:13,lineHeight:18,fontWeight:"600",flexShrink:1},
  nodeTitleLocked:{color: "#233844"},
  nodeSubtitle:{color: "#233844",fontSize:10,lineHeight:15},
  unlockChip:{borderWidth:1,borderColor: "#DDE7EA",backgroundColor: "#EAF2F4",borderRadius:999,paddingHorizontal:7,paddingVertical:2},
  unlockText:{color: "#4B7E91",fontSize:7,lineHeight:10,letterSpacing:.8,fontWeight:"700"},
  requirements:{gap:2,marginTop:3},
  requirement:{color: "#657C88",fontSize:9,lineHeight:14},
  note:{flexDirection:"row",gap:8,paddingTop:12,borderTopWidth:1,borderTopColor: "#DDE7EA"},
  noteText:{flex:1,color: "#657C88",fontSize:9,lineHeight:15},
});

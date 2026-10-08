import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { uiText } from "@/src/demo/fullUi";
import { localizeDemoText } from "@/src/demo/localizedData";
import type { LanguageCode } from "@/src/demo/types";
import { JourneyStatus, JourneySymbol } from "./WorkerJourneyTree";
import type { AchievementNode, ComplianceTree } from "./workerCertificateTree";

export function WorkerCompliancePanel({
  tree,
  language,
  onNode,
}: {
  tree: ComplianceTree;
  language: LanguageCode;
  onNode: (node: AchievementNode) => void;
}) {
  const text = (pt: string, en: string) => uiText(language, pt, en);

  return (
    <View style={styles.panel} testID="worker-compliance-panel">
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#91C7F5" />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>
            {text("CONFORMIDADE CONTEXTUAL", "CONTEXTUAL COMPLIANCE")}
          </Text>
          <Text style={styles.title}>{text(tree.title, tree.titleEn)}</Text>
          <Text style={styles.description}>
            {text(tree.description, tree.descriptionEn)}
          </Text>
        </View>
        <View style={styles.counter}>
          <Text style={styles.counterValue}>{tree.validCount}</Text>
          <Text style={styles.counterLabel}>{text("válidas", "valid")}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {tree.nodes.map((node) => {
          const verified = node.status === "verified";
          return (
            <Pressable
              key={node.id}
              accessibilityRole="button"
              onPress={() => onNode(node)}
              style={({ pressed }) => [
                styles.item,
                verified && styles.itemVerified,
                pressed && styles.itemPressed,
              ]}
            >
              <JourneySymbol node={node} />
              <View style={styles.itemCopy}>
                <Text style={styles.itemTitle}>
                  {localizeDemoText(language, node.title)}
                </Text>
                <Text style={styles.itemScope}>{node.scope}</Text>
                <JourneyStatus node={node} language={language} />
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={14} color="#718AA0" />
        <Text style={styles.noteText}>
          {text(
            "Estes requisitos indicam aptidão legal, empresarial ou de site. Não aumentam diretamente a senioridade técnica.",
            "These requirements indicate legal, employer or site eligibility. They do not directly increase technical seniority.",
          )}
        </Text>
      </View>
    </View>
  );
}

const styles=StyleSheet.create({
  panel:{borderWidth:1,borderColor:"#19354A",borderRadius:20,backgroundColor:"#060D14E8",padding:16,gap:14},
  header:{flexDirection:"row",alignItems:"flex-start",gap:12},
  headerIcon:{width:40,height:40,borderRadius:13,borderWidth:1,borderColor:"#315C7C",backgroundColor:"#071725",alignItems:"center",justifyContent:"center"},
  headerCopy:{flex:1,minWidth:0,gap:3},
  eyebrow:{color:"#6D8BA3",fontSize:8,lineHeight:12,letterSpacing:1.6,fontWeight:"700"},
  title:{color:"#DFEAF3",fontSize:17,lineHeight:22,fontWeight:"700"},
  description:{color:"#748CA0",fontSize:10,lineHeight:16},
  counter:{alignItems:"flex-end"},
  counterValue:{color:"#9BCDF6",fontSize:20,lineHeight:24,fontWeight:"700"},
  counterLabel:{color:"#6B8295",fontSize:8,lineHeight:12},
  grid:{flexDirection:"row",flexWrap:"wrap",gap:8},
  item:{width:"100%",minHeight:76,flexDirection:"row",alignItems:"center",gap:11,borderWidth:1,borderColor:"#1A3040",borderRadius:13,backgroundColor:"#050B11",padding:10},
  itemVerified:{borderColor:"#2E6287",backgroundColor:"#071521"},
  itemPressed:{opacity:.75},
  itemCopy:{flex:1,minWidth:0,gap:3},
  itemTitle:{color:"#C9D8E4",fontSize:11,lineHeight:16,fontWeight:"600"},
  itemScope:{color:"#6B8498",fontSize:8,lineHeight:12},
  note:{flexDirection:"row",gap:8,borderTopWidth:1,borderTopColor:"#162A39",paddingTop:12},
  noteText:{flex:1,color:"#6D8498",fontSize:9,lineHeight:14},
});

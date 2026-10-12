import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { complianceTitle, professionalText, scopeText } from "@/src/demo/professionalI18n";
import type { LanguageCode } from "@/src/demo/types";
import { JourneyStatus, JourneySymbol } from "./WorkerJourneyTree";
import type { AchievementNode, ComplianceTree } from "./workerCertificateTree";
import { complianceCatalog } from "./professionCatalog";

export function WorkerCompliancePanel({
  tree,
  language,
  onNode,
}: {
  tree: ComplianceTree;
  language: LanguageCode;
  onNode: (node: AchievementNode) => void;
}) {
  const text = (pt: string, en: string) => professionalText(language, pt, en);
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.panel} testID="worker-compliance-panel">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}
      >
        <View style={styles.headerIcon}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#D9A184" />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>
            {text("CONFORMIDADE CONTEXTUAL", "CONTEXTUAL COMPLIANCE")}
          </Text>
          <Text style={styles.title}>{text(tree.title, tree.titleEn)}</Text>
          {expanded ? (
            <Text style={styles.description}>
              {text(tree.description, tree.descriptionEn)}
            </Text>
          ) : null}
        </View>
        <View style={styles.counter}>
          <Text style={styles.counterValue}>{tree.validCount}</Text>
          <View style={styles.counterLine}>
            <Text style={styles.counterLabel}>{text("válidas", "valid")}</Text>
            <Ionicons
              name={expanded ? "chevron-up-outline" : "chevron-down-outline"}
              size={14}
              color="#A88F7B"
            />
          </View>
        </View>
      </Pressable>

      {expanded ? (
        <>
      <View style={styles.grid}>
        {tree.nodes.map((node) => {
          const verified = node.status === "verified";
          const definition = complianceCatalog.find((item) => item.id === node.id);
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
                  {complianceTitle(language, node.id, node.title, definition?.titleEn || node.title)}
                </Text>
                <Text style={styles.itemScope}>{scopeText(language, node.scope)}</Text>
                <JourneyStatus node={node} language={language} />
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={14} color="#8A7A6C" />
        <Text style={styles.noteText}>
          {text(
            "Estes requisitos indicam aptidão legal, empresarial ou de site. Não aumentam diretamente a senioridade técnica.",
            "These requirements indicate legal, employer or site eligibility. They do not directly increase technical seniority.",
          )}
        </Text>
      </View>
        </>
      ) : null}
    </View>
  );
}

const styles=StyleSheet.create({
  panel:{borderWidth:1,borderColor:"#E3DCD2",borderRadius:20,backgroundColor:"#FFFEFC",padding:16,gap:14},
  header:{flexDirection:"row",alignItems:"flex-start",gap:12,borderRadius:12},
  headerPressed:{opacity:.78},
  headerIcon:{width:40,height:40,borderRadius:12,borderWidth:1,borderColor:"#E1C9BB",backgroundColor:"#F8EEE7",alignItems:"center",justifyContent:"center"},
  headerCopy:{flex:1,minWidth:0,gap:3},
  eyebrow:{color:"#9B715E",fontSize:8,lineHeight:12,letterSpacing:1.6,fontWeight:"700"},
  title:{color:"#293C44",fontSize:17,lineHeight:22,fontWeight:"700"},
  description:{color:"#738288",fontSize:10,lineHeight:16},
  counter:{alignItems:"flex-end"},
  counterValue:{color:"#B55C43",fontSize:20,lineHeight:24,fontWeight:"700"},
  counterLine:{flexDirection:"row",alignItems:"center",gap:6},
  counterLabel:{color:"#738288",fontSize:8,lineHeight:12},
  grid:{flexDirection:"row",flexWrap:"wrap",gap:8},
  item:{width:"100%",minHeight:76,flexDirection:"row",alignItems:"center",gap:11,borderWidth:1,borderColor:"#E3DDD3",borderRadius:13,backgroundColor:"#FBFAF6",padding:10},
  itemVerified:{borderColor:"#B9DCC6",backgroundColor:"#F1F8F1"},
  itemPressed:{opacity:.75},
  itemCopy:{flex:1,minWidth:0,gap:3},
  itemTitle:{color:"#2B4149",fontSize:11,lineHeight:16,fontWeight:"600"},
  itemScope:{color:"#647C83",fontSize:8,lineHeight:12},
  note:{flexDirection:"row",gap:8,borderTopWidth:1,borderTopColor:"#E4DDD4",paddingTop:12},
  noteText:{flex:1,color:"#738288",fontSize:9,lineHeight:14},
});

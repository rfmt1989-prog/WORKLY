import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useWorklyData } from "@/src/context/WorklyDataContext";
import { uiText } from "@/src/demo/fullUi";
import type { WorkExperience, Worker } from "@/src/demo/types";
import { Button, Field, ModalPanel } from "./primitives";
import { experienceYears } from "./workerExperience";

export function WorkerExperienceEditor({
  worker,
  experience,
  onClose,
}: {
  worker: Worker;
  experience?: WorkExperience;
  onClose: () => void;
}) {
  const { language, updateWorker, notify } = useWorklyData();
  const text = (pt: string, en: string) => uiText(language, pt, en);
  const [company, setCompany] = useState(experience?.company || "");
  const [role, setRole] = useState(experience?.role || "");
  const [country, setCountry] = useState(experience?.country || "");
  const [location, setLocation] = useState(experience?.location || "");
  const [startDate, setStartDate] = useState(experience?.start_date || "");
  const [endDate, setEndDate] = useState(experience?.end_date || "");
  const [current, setCurrent] = useState(experience?.current || false);
  const [description, setDescription] = useState(experience?.description || "");
  const [hours, setHours] = useState(experience?.hours ? String(experience.hours) : "");
  const [busy, setBusy] = useState(false);

  const validDate = (value: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;

  const save = async () => {
    if (busy || !company.trim() || !role.trim() || !validDate(startDate)) return;
    if (!current && (!endDate || !validDate(endDate) || Date.parse(endDate) < Date.parse(startDate))) {
      notify(text("Confirma as datas da experiência.", "Check the experience dates."), "error");
      return;
    }
    const parsedHours = hours.trim() ? Number(hours.replace(",", ".")) : undefined;
    if (parsedHours !== undefined && (!Number.isFinite(parsedHours) || parsedHours < 0 || parsedHours > 200000)) {
      notify(text("Confirma as horas.", "Check the hours."), "error");
      return;
    }

    const entry: WorkExperience = {
      id: experience?.id || "exp-" + worker.id + "-" + Date.now().toString(36),
      company: company.trim(),
      role: role.trim(),
      country: country.trim(),
      location: location.trim(),
      start_date: startDate,
      end_date: current ? "" : endDate,
      current,
      description: description.trim(),
      hours: parsedHours,
      status: experience?.status === "verified" ? "pending" : experience?.status || "recorded",
    };
    const list = [...(worker.work_experience || [])];
    const index = list.findIndex((item) => item.id === entry.id);
    if (index >= 0) list[index] = entry;
    else list.push(entry);
    const years = experienceYears(list);

    setBusy(true);
    try {
      await updateWorker(worker.id, { work_experience: list, experience_years: years });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!experience || busy) return;
    const list = (worker.work_experience || []).filter((item) => item.id !== experience.id);
    setBusy(true);
    try {
      await updateWorker(worker.id, { work_experience: list, experience_years: experienceYears(list) });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalPanel
      visible
      onClose={() => !busy && onClose()}
      title={text(experience ? "Editar experiência" : "Adicionar experiência", experience ? "Edit experience" : "Add experience")}
      subtitle={text(
        "A experiência conta para o WORKLY VALUE quando é confirmada. Os anos são calculados automaticamente pelas datas.",
        "Experience contributes to WORKLY VALUE when verified. Years are calculated automatically from dates.",
      )}
      footer={
        <>
          {experience ? <Button label={text("Eliminar", "Delete")} variant="secondary" disabled={busy} onPress={() => void remove()} /> : null}
          <Button label={text("Cancelar", "Cancel")} variant="secondary" disabled={busy} onPress={onClose} />
          <Button label={text("Guardar", "Save")} loading={busy} disabled={!company.trim() || !role.trim() || !startDate} onPress={() => void save()} />
        </>
      }
    >
      <View style={styles.form}>
        <Field label={text("Empresa", "Company")} value={company} editable={!busy} onChangeText={setCompany} />
        <Field label={text("Função", "Role")} value={role} editable={!busy} onChangeText={setRole} />
        <Field label={text("País", "Country")} value={country} editable={!busy} onChangeText={setCountry} />
        <Field label={text("Local", "Location")} value={location} editable={!busy} onChangeText={setLocation} />
        <Field label={text("Início", "Start date")} placeholder="AAAA-MM-DD" value={startDate} editable={!busy} onChangeText={setStartDate} />
        {!current ? <Field label={text("Fim", "End date")} placeholder="AAAA-MM-DD" value={endDate} editable={!busy} onChangeText={setEndDate} /> : null}
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: current }} onPress={() => setCurrent((value) => !value)} style={styles.option}>
          <Text style={styles.optionText}>{current ? "☑" : "☐"} {text("Trabalho atualmente aqui", "I currently work here")}</Text>
        </Pressable>
        <Field label={text("Horas comprováveis (opcional)", "Verifiable hours (optional)")} value={hours} editable={!busy} onChangeText={setHours} />
        <Field label={text("Descrição / responsabilidades", "Description / responsibilities")} value={description} multiline editable={!busy} onChangeText={setDescription} />
        <Text style={styles.hint}>
          {text(
            "Registos introduzidos pelo Worker ficam registados. A confirmação por empresa altera o estado para verificado.",
            "Worker-entered records remain recorded. Employer confirmation changes the status to verified.",
          )}
        </Text>
      </View>
    </ModalPanel>
  );
}

const styles=StyleSheet.create({
  form:{gap:14},
  option:{minHeight:40,justifyContent:"center",paddingVertical:8},
  optionText:{color:"#B6C8D8",fontSize:12,lineHeight:18},
  hint:{color:"#758DA1",fontSize:10,lineHeight:16},
});

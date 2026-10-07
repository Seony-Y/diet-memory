import { format, subDays } from "date-fns";
import { useState } from "react";

export interface BodyRecord {
  recordedOn: string;
  weightKg: number;
  muscleMassKg?: number;
  bodyFatMassKg?: number;
  bodyFatPercent?: number;
  visceralFatLevel?: number;
}

export type BodyRecordInput = Omit<BodyRecord, "recordedOn">;

export function useBodyRecords() {
  const [records, setRecords] = useState<BodyRecord[]>([]);

  const saveToday = (input: BodyRecordInput) => {
    const recordedOn = format(new Date(), "yyyy-MM-dd");
    setRecords((current) => {
      const next = [
        ...current.filter((record) => record.recordedOn !== recordedOn),
        { recordedOn, ...input },
      ].sort((left, right) => left.recordedOn.localeCompare(right.recordedOn));
      return next;
    });
  };

  return { records, saveToday, setRecords };
}

export function getTodayRecord(records: BodyRecord[]) {
  const today = format(new Date(), "yyyy-MM-dd");
  return (
    records.find((record) => record.recordedOn === today) ?? records.at(-1)
  );
}

export function getYesterdayRecord(records: BodyRecord[]) {
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
  return records.find((record) => record.recordedOn === yesterday);
}

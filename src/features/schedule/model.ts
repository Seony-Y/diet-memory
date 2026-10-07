export interface ScheduleEntry {
  id: string;
  scheduledOn: string;
  scheduledTime?: string;
  status: "확정" | "미확정";
  title: string;
  detail: string;
  pending: boolean;
}

export interface ScheduleInput {
  title: string;
  scheduledOn: string;
  scheduledTime?: string;
}

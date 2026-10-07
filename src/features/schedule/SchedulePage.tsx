import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Sheet } from "../../app/types";
import { PageTitle, SectionTitle } from "../../shared/ui";

interface ScheduleEntry {
  day: string;
  status: string;
  title: string;
  detail: string;
  pending?: boolean;
}

const schedules: ScheduleEntry[] = [
  {
    day: "18",
    status: "확정",
    title: "피부 관리 예약",
    detail: "다음 주기 · 1개월 후",
  },
  {
    day: "25",
    status: "미확정",
    title: "레이저 시술 검토",
    detail: "최소 다운타임 · 1주",
    pending: true,
  },
];

export function SchedulePage({
  openSheet,
  editSchedule,
}: {
  openSheet: (sheet: Sheet) => void;
  editSchedule: (title: string) => void;
}) {
  const [selectedDay, setSelectedDay] = useState(7);
  const selectedSchedules = schedules.filter(
    (schedule) => Number(schedule.day) === selectedDay,
  );

  return (
    <>
      <PageTitle
        eyebrow="CARE CALENDAR"
        title="일정 정리"
        description="시술 날짜와 회복 일정을 놓치지 마세요."
      >
        <button onClick={() => openSheet("schedule")}>
          <Plus size={17} /> 일정 추가
        </button>
      </PageTitle>
      <section className="calendar">
        <div className="calendar-head">
          <button aria-label="이전 달">
            <ChevronLeft size={17} />
          </button>
          <b>2026년 10월</b>
          <button aria-label="다음 달">
            <ChevronRight size={17} />
          </button>
        </div>
        <div className="week">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="days">
          {Array.from({ length: 35 }, (_, index) => {
            const day = index - 3;
            const isValidDay = day > 0 && day <= 31;
            const className = [
              day === 7 ? "today" : "",
              schedules.some((schedule) => Number(schedule.day) === day)
                ? "marked"
                : "",
              day === selectedDay ? "selected" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                className={className}
                onClick={() => isValidDay && setSelectedDay(day)}
                disabled={!isValidDay}
                aria-label={isValidDay ? `10월 ${day}일` : undefined}
                key={index}
              >
                {isValidDay ? day : ""}
              </button>
            );
          })}
        </div>
      </section>
      <section className="selected-day-schedule">
        <header>
          <span>SELECTED DATE</span>
          <h2>10월 {selectedDay}일 일정</h2>
        </header>
        {selectedSchedules.length ? (
          <div className="schedule-list">
            {selectedSchedules.map((schedule) => (
              <ScheduleItem
                {...schedule}
                onEdit={editSchedule}
                key={schedule.title}
              />
            ))}
          </div>
        ) : (
          <p>등록된 일정이 없어요.</p>
        )}
      </section>
      <SectionTitle eyebrow="UPCOMING" title="다가오는 일정" />
      <div className="schedule-list">
        {schedules.map((schedule) => (
          <ScheduleItem
            {...schedule}
            onEdit={editSchedule}
            key={schedule.title}
          />
        ))}
      </div>
    </>
  );
}

function ScheduleItem({
  day,
  status,
  title,
  detail,
  pending = false,
  onEdit,
}: {
  day: string;
  status: string;
  title: string;
  detail: string;
  pending?: boolean;
  onEdit: (title: string) => void;
}) {
  return (
    <article>
      <div className={`schedule-date ${pending ? "pending" : ""}`}>
        <strong>{day}</strong>
        <span>OCT</span>
      </div>
      <div>
        <em>{status}</em>
        <h3>{title}</h3>
        <p>{detail}</p>
      </div>
      <button
        className="schedule-edit"
        onClick={() => onEdit(title)}
        aria-label={`${title} 일정 수정`}
      >
        <ChevronRight size={18} />
      </button>
    </article>
  );
}

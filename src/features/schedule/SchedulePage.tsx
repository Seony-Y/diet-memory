import { useState } from "react";
import {
  addMonths,
  format,
  getDate,
  getDay,
  getDaysInMonth,
  isSameMonth,
  parseISO,
  setDate,
  startOfMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight, Pencil, Plus } from "lucide-react";
import { PageTitle, SectionTitle } from "../../shared/ui";
import type { ScheduleEntry } from "./model";

export function SchedulePage({
  schedules,
  addSchedule,
  editSchedule,
}: {
  schedules: ScheduleEntry[];
  addSchedule: (scheduledOn: string) => void;
  editSchedule: (schedule: ScheduleEntry) => void;
}) {
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(today));
  const [selectedDay, setSelectedDay] = useState(getDate(today));
  const monthSchedules = schedules.filter(
    (schedule) =>
      schedule.scheduledOn &&
      isSameMonth(parseISO(schedule.scheduledOn), visibleMonth),
  );
  const selectedSchedules = monthSchedules.filter(
    (schedule) => getDate(parseISO(schedule.scheduledOn)) === selectedDay,
  );
  const leadingDays = getDay(visibleMonth);
  const daysInMonth = getDaysInMonth(visibleMonth);
  const calendarCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
  const selectedDate = format(setDate(visibleMonth, selectedDay), "yyyy-MM-dd");

  const moveMonth = (offset: number) => {
    const nextMonth = addMonths(visibleMonth, offset);
    setVisibleMonth(nextMonth);
    setSelectedDay(isSameMonth(today, nextMonth) ? getDate(today) : 1);
  };

  return (
    <>
      <PageTitle
        eyebrow="CARE CALENDAR"
        title="일정 정리"
        description="시술 날짜와 회복 일정을 놓치지 마세요."
      >
        <button onClick={() => addSchedule(selectedDate)}>
          <Plus size={17} /> 일정 추가
        </button>
      </PageTitle>
      <section className="calendar">
        <div className="calendar-head">
          <button onClick={() => moveMonth(-1)} aria-label="이전 달">
            <ChevronLeft size={17} />
          </button>
          <b>{format(visibleMonth, "yyyy년 M월")}</b>
          <button onClick={() => moveMonth(1)} aria-label="다음 달">
            <ChevronRight size={17} />
          </button>
        </div>
        <div className="week">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="days">
          {Array.from({ length: calendarCells }, (_, index) => {
            const day = index - leadingDays + 1;
            const isValidDay = day > 0 && day <= daysInMonth;
            const isToday =
              isSameMonth(today, visibleMonth) && day === getDate(today);
            const className = [
              isToday ? "today" : "",
              monthSchedules.some(
                (schedule) => getDate(parseISO(schedule.scheduledOn)) === day,
              )
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
                aria-label={
                  isValidDay
                    ? `${format(visibleMonth, "M월")} ${day}일`
                    : undefined
                }
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
          <h2>
            {format(visibleMonth, "M월")} {selectedDay}일 일정
          </h2>
        </header>
        {selectedSchedules.length ? (
          <div className="schedule-list">
            {selectedSchedules.map((schedule) => (
              <ScheduleItem
                schedule={schedule}
                onEdit={editSchedule}
                key={schedule.id}
              />
            ))}
          </div>
        ) : (
          <p>등록된 일정이 없어요.</p>
        )}
      </section>
      <SectionTitle eyebrow="UPCOMING" title="등록된 일정" />
      <div className="schedule-list">
        {schedules.length ? (
          schedules.map((schedule) => (
            <ScheduleItem
              schedule={schedule}
              onEdit={editSchedule}
              key={schedule.id}
            />
          ))
        ) : (
          <p className="empty-records">아직 등록한 일정이 없어요.</p>
        )}
      </div>
    </>
  );
}

function ScheduleItem({
  schedule,
  onEdit,
}: {
  schedule: ScheduleEntry;
  onEdit: (schedule: ScheduleEntry) => void;
}) {
  const date = schedule.scheduledOn ? parseISO(schedule.scheduledOn) : null;
  return (
    <article>
      <div className={`schedule-date ${schedule.pending ? "pending" : ""}`}>
        <strong>{date ? format(date, "d") : "?"}</strong>
        <span>{date ? format(date, "MMM").toUpperCase() : "TBD"}</span>
      </div>
      <div>
        <em>{schedule.status}</em>
        <h3>{schedule.title}</h3>
        {schedule.detail && <p>{schedule.detail}</p>}
      </div>
      <div className="record-actions">
        <button
          className="schedule-edit"
          onClick={() => onEdit(schedule)}
          aria-label={`${schedule.title} 일정 수정`}
        >
          <Pencil size={15} />
        </button>
      </div>
    </article>
  );
}

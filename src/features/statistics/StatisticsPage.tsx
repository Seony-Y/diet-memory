import { useState } from "react";
import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  getWeekOfMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MouseHandlerDataParam } from "recharts";
import { ChartCard, PageTitle, StatCard } from "../../shared/ui";
import type { BodyRecord } from "../body/model";

type BodyMetric = keyof Pick<
  BodyRecord,
  "weightKg" | "muscleMassKg" | "bodyFatMassKg" | "bodyFatPercent"
>;
type PeriodType = "week" | "month";

const metricOptions = [
  ["weightKg", "몸무게", "kg", "#19448c"],
  ["muscleMassKg", "근육량", "kg", "#238b82"],
  ["bodyFatMassKg", "체지방량", "kg", "#ef806c"],
  ["bodyFatPercent", "체지방률", "%", "#e4b557"],
] as const;

export function StatisticsPage({
  records,
  calorieHistory,
}: {
  records: BodyRecord[];
  calorieHistory: Array<{ recordedOn: string; calories: number }>;
}) {
  const [metric, setMetric] = useState<BodyMetric>("weightKg");
  const [periodType, setPeriodType] = useState<PeriodType>("week");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [selectedRecordDate, setSelectedRecordDate] = useState<string>();
  const periodStart =
    periodType === "week"
      ? startOfWeek(anchorDate, { weekStartsOn: 1 })
      : startOfMonth(anchorDate);
  const periodEnd =
    periodType === "week"
      ? endOfWeek(anchorDate, { weekStartsOn: 1 })
      : endOfMonth(anchorDate);
  const inSelectedPeriod = (recordedOn: string) =>
    isWithinInterval(parseISO(recordedOn), {
      start: periodStart,
      end: periodEnd,
    });
  const selectedRecords = records.filter((record) =>
    inSelectedPeriod(record.recordedOn),
  );
  const availableMetrics = metricOptions.filter(([key]) =>
    selectedRecords.some((record) => record[key] !== undefined),
  );
  const selected =
    availableMetrics.find(([key]) => key === metric) ?? availableMetrics[0];
  const chartData = selectedRecords.map((record) => ({
    ...record,
    day: format(parseISO(record.recordedOn), "M/d"),
  }));
  const bodyChartData = selected
    ? chartData.filter((record) => record[selected[0]] !== undefined)
    : [];
  const calorieData = calorieHistory
    .filter((record) => inSelectedPeriod(record.recordedOn))
    .map((record) => ({
      ...record,
      day: format(parseISO(record.recordedOn), "M/d"),
    }));
  const selectedRecord =
    selectedRecords.find(
      (record) => record.recordedOn === selectedRecordDate,
    ) ?? selectedRecords[0];
  const selectedRecordIndex = selectedRecord
    ? records.findIndex(
        (record) => record.recordedOn === selectedRecord.recordedOn,
      )
    : -1;
  const previousRecord =
    selectedRecordIndex > 0 ? records[selectedRecordIndex - 1] : undefined;
  const periodLabel =
    periodType === "week"
      ? `${format(periodStart, "M월 d일")} - ${format(periodEnd, "M월 d일")}`
      : format(anchorDate, "yyyy년 M월");
  const periodRecordLabel =
    periodType === "week"
      ? `${format(anchorDate, "yyyy년 M월")} ${getWeekOfMonth(anchorDate, { weekStartsOn: 1 })}주차 기록`
      : `${format(anchorDate, "yyyy년 M월")} 기록`;
  const movePeriod = (amount: number) =>
    setAnchorDate((current) =>
      periodType === "week"
        ? addWeeks(current, amount)
        : addMonths(current, amount),
    );
  const formatValue = (value?: number) =>
    value === undefined ? "—" : value.toFixed(1);
  const difference = (key: BodyMetric) => {
    if (selectedRecord?.[key] === undefined) return "기록 없음";
    if (previousRecord?.[key] === undefined) return "이전 기록 없음";
    const change = Number(selectedRecord[key]) - Number(previousRecord[key]);
    return `${change > 0 ? "+" : ""}${change.toFixed(1)}${key === "bodyFatPercent" ? "%p" : "kg"}`;
  };
  const selectChartDate = ({ activeTooltipIndex }: MouseHandlerDataParam) => {
    const index = Number(activeTooltipIndex);
    if (!Number.isInteger(index) || !bodyChartData[index]) return;
    setSelectedRecordDate(bodyChartData[index].recordedOn);
  };

  return (
    <>
      <PageTitle
        eyebrow="PROGRESS"
        title="나의 변화"
        description="일자별 기록을 주간 또는 월간으로 확인하세요."
      >
        <div className="statistics-period">
          <div className="period" aria-label="통계 기간 단위">
            {(["week", "month"] as const).map((type) => (
              <button
                className={periodType === type ? "active" : ""}
                key={type}
                onClick={() => {
                  setPeriodType(type);
                  setAnchorDate(new Date());
                }}
              >
                {type === "week" ? "주간" : "월간"}
              </button>
            ))}
          </div>
          <div className="period-nav">
            <button onClick={() => movePeriod(-1)} aria-label="이전 기간">
              <ChevronLeft size={17} />
            </button>
            <b>{periodLabel}</b>
            <button onClick={() => movePeriod(1)} aria-label="다음 기간">
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </PageTitle>
      {selectedRecord && (
        <div className="selected-record-date">{periodRecordLabel}</div>
      )}
      {selectedRecord && (
        <div className="stat-grid body-stat-grid">
          {metricOptions
            .filter(([key]) => selectedRecord[key] !== undefined)
            .map(([key, label, unit]) => (
              <StatCard
                label={label}
                value={formatValue(selectedRecord[key])}
                unit={unit}
                note={difference(key)}
                key={key}
              />
            ))}
        </div>
      )}
      {availableMetrics.length > 0 && (
        <section className="report-tabs" aria-label="체성분 리포트 선택">
          {availableMetrics.map(([key, label]) => (
            <button
              className={selected?.[0] === key ? "active" : ""}
              key={key}
              onClick={() => setMetric(key)}
            >
              {label}
            </button>
          ))}
        </section>
      )}
      {selected && bodyChartData.length > 0 && (
        <ChartCard
          title={`${selected[1]} 변화`}
          target={`${periodLabel} · ${selected[2]}`}
          eyebrow={periodType === "week" ? "WEEKLY" : "MONTHLY"}
        >
          <ResponsiveContainer>
            <LineChart
              data={bodyChartData}
              margin={{ left: -18, right: 12 }}
              onClick={selectChartDate}
              style={{ cursor: "pointer" }}
            >
              <CartesianGrid stroke="#e9f0f2" vertical={false} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={["dataMin - 1", "dataMax + 1"]}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip cursor={false} />
              <Line
                type="monotone"
                dataKey={selected[0]}
                name={selected[1]}
                stroke={selected[3]}
                strokeWidth={3}
                dot={{ fill: "#fff", strokeWidth: 3 }}
                activeDot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
      {calorieData.length > 0 && (
        <ChartCard title="섭취 칼로리" target={periodLabel} eyebrow="NUTRITION">
          <ResponsiveContainer>
            <BarChart data={calorieData} margin={{ left: -25, right: 10 }}>
              <CartesianGrid stroke="#e9f0f2" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={false} />
              <Bar dataKey="calories" fill="#379bc1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </>
  );
}

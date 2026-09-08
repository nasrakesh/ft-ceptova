import { todayIso, weekDatesFor } from "../dateUtils";

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

export default function WeekStrip({ date, onPick }: { date: string; onPick: (iso: string) => void }) {
  const today = todayIso();
  const week = weekDatesFor(date);
  return (
    <div className="week-strip">
      {week.map((iso, i) => {
        const dayNum = Number(iso.split("-")[2]);
        const isSelected = iso === date;
        const isToday = iso === today;
        return (
          <button
            key={iso}
            type="button"
            className={isSelected ? "week-day active" : isToday ? "week-day is-today" : "week-day"}
            onClick={() => onPick(iso)}
          >
            <span className="week-day-letter">{WEEKDAY_LETTERS[i]}</span>
            <span className="week-day-num">{dayNum}</span>
          </button>
        );
      })}
    </div>
  );
}

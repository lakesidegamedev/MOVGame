import { useState } from "react";
import { Plus } from "lucide-react";

interface PlanQueueControlsProps {
  days: { day: number; count: number; available: boolean }[];
  limit: number;
  action: string;
  addToDay: (day: number) => void;
}

export function PlanQueueControls({ days, limit, action, addToDay }: PlanQueueControlsProps) {
  const [selection, setSelection] = useState(0);
  const [lastAdded, setLastAdded] = useState("");
  const target = selection === 0 ? days.find((day) => day.available) : days.find((day) => day.day === selection);

  return (
    <div className="plan-queue-controls">
      <label>
        Day
        <select value={selection} onChange={(event) => setSelection(Number(event.target.value))}>
          <option value={0}>Next open day</option>
          {days.map(({ day, count }) => <option key={day} value={day}>Day {day} ({count}/{limit})</option>)}
        </select>
      </label>
      <button type="button" className="primary" disabled={!target?.available} onClick={() => {
        if (!target?.available) return;
        addToDay(target.day);
        setLastAdded(`${action} added to day ${target.day}`);
      }}>
        <Plus size={16} aria-hidden="true" />
        {target ? `Add to day ${target.day}` : "Add to plan"}
      </button>
      <span className="plan-queue-notice" role="status">{lastAdded}</span>
    </div>
  );
}

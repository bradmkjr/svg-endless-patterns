"use client";

import { memo, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import css from "./CrossStitchBuilder.module.css";

/** Cells re-render only when their own values change, so painting stays quick on a large grid. */
const Cell = memo(function Cell({ row, column, color, label, focusable }: { row: number; column: number; color: string; label: string; focusable: boolean }) {
  const classes = [css.cell, (column + 1) % 10 === 0 ? css.cellEnd : "", (row + 1) % 10 === 0 ? css.cellBottom : ""].join(" ");
  return <button type="button" data-row={row} data-column={column} tabIndex={focusable ? 0 : -1} className={classes} style={{ background: color }} aria-label={label} />;
});

function cellAt(target: EventTarget | Element | null): [number, number] | null {
  const element = target instanceof Element ? target.closest<HTMLElement>("[data-row]") : null;
  return element ? [Number(element.dataset.row), Number(element.dataset.column)] : null;
}

/** The editable grid: drag to paint, or move with the arrow keys and press Enter or Space. */
export function CrossStitchBuilderGrid({
  grid,
  colors,
  fabric,
  label,
  cellLabel,
  onPaint,
}: {
  grid: string[];
  colors: string[];
  fabric: string;
  label: string;
  cellLabel: (row: number, column: number, cell: string) => string;
  onPaint: (row: number, column: number) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const painting = useRef(false);
  const [focus, setFocus] = useState<[number, number]>([0, 0]);
  const columns = grid[0].length;
  // The grid can shrink past the cell that had the keyboard.
  const focusRow = Math.min(focus[0], grid.length - 1);
  const focusColumn = Math.min(focus[1], columns - 1);

  useEffect(() => {
    const stop = () => {
      painting.current = false;
    };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, []);

  const onPointerDown = (e: PointerEvent) => {
    const at = cellAt(e.target);
    if (!at) return;
    painting.current = true;
    setFocus(at);
    onPaint(at[0], at[1]);
  };

  // Looked up by position: a touch stays targeted at the cell it started on.
  const onPointerMove = (e: PointerEvent) => {
    if (!painting.current) return;
    const at = cellAt(document.elementFromPoint(e.clientX, e.clientY));
    if (at && box.current?.contains(document.elementFromPoint(e.clientX, e.clientY))) onPaint(at[0], at[1]);
  };

  // Pointers paint on the way down, so a click only counts when the keyboard made it.
  const onClick = (e: MouseEvent) => {
    const at = e.detail === 0 ? cellAt(e.target) : null;
    if (at) onPaint(at[0], at[1]);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const moves: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    const row = Math.max(0, Math.min(grid.length - 1, focusRow + move[0]));
    const column = Math.max(0, Math.min(columns - 1, focusColumn + move[1]));
    setFocus([row, column]);
    box.current?.querySelector<HTMLElement>(`[data-row="${row}"][data-column="${column}"]`)?.focus();
  };

  return (
    <div
      ref={box}
      role="group"
      aria-label={label}
      className={css.grid}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, background: fabric }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      {grid.flatMap((text, row) =>
        [...text].map((cell, column) => (
          <Cell
            key={`${row}.${column}`}
            row={row}
            column={column}
            color={cell === "." ? "transparent" : colors[cell.charCodeAt(0) - 97]}
            label={cellLabel(row, column, cell)}
            focusable={row === focusRow && column === focusColumn}
          />
        )),
      )}
    </div>
  );
}

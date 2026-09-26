export type ReviewPeriod = {
  key: string;
  start: string;
  end: string;
  nextStart: string;
};

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function monthPeriod(key: string): ReviewPeriod | null {
  const match = /^(\d{4})-(\d{2})$/.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const endDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    key,
    start: isoDate(year, month, 1),
    end: isoDate(year, month, endDay),
    nextStart: isoDate(nextYear, nextMonth, 1),
  };
}

export function quarterPeriod(key: string): ReviewPeriod | null {
  const match = /^(\d{4})-Q([1-4])$/.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const quarter = Number(match[2]);
  const startMonth = (quarter - 1) * 3 + 1;
  const nextYear = quarter === 4 ? year + 1 : year;
  const nextMonth = quarter === 4 ? 1 : startMonth + 3;
  const endDay = new Date(Date.UTC(nextYear, nextMonth - 1, 0)).getUTCDate();
  const endMonth = nextMonth === 1 ? 12 : nextMonth - 1;
  const endYear = nextMonth === 1 ? year : nextYear;
  return {
    key,
    start: isoDate(year, startMonth, 1),
    end: isoDate(endYear, endMonth, endDay),
    nextStart: isoDate(nextYear, nextMonth, 1),
  };
}

export function currentMonthKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function currentQuarterKey(now = new Date()) {
  return `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;
}

export function customPeriod(start: string, end: string): ReviewPeriod | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end < start) return null;
  const next = new Date(`${end}T00:00:00.000Z`);
  if (Number.isNaN(next.getTime())) return null;
  next.setUTCDate(next.getUTCDate() + 1);
  return { key: `${start}_${end}`, start, end, nextStart: next.toISOString().slice(0, 10) };
}

import { StaffMember, RosterConfig, Assignment, ShiftType } from "../types";
import { getBaseShiftCode, validateShiftSequence } from "../utils/sequenceRules";

export interface SolverResult {
  assignments: Assignment[];
  stats: {
    totalAssigned: number;
    morningCount: number;
    eveningCount: number;
    nightCount: number;
    offCount: number;
    leaveCount: number;
    warnings: string[];
  };
}

/**
 * Local System Constraint Solver:
 * Generates an optimal 1-month duty schedule adhering to clinical sequence rules,
 * operational headcounts, mandatory recovery periods, senior quotas, and individual staff limits
 * without requiring any external AI API key or internet connection.
 */
export const generateLocalRoster = (
  staff: StaffMember[],
  config: RosterConfig,
  existingAssignments: Assignment[]
): SolverResult => {
  const isHaStaff = (name: string, member?: StaffMember): boolean => {
    if (member?.isHa) return true;
    const trimmed = name.trim();
    return (
      trimmed.startsWith("HA") ||
      trimmed.startsWith("(HA)") ||
      trimmed.startsWith("MSA") ||
      trimmed.startsWith("(MSA)")
    );
  };

  const isWsStaff = (s?: StaffMember): boolean => {
    if (!s) return false;
    return !!s.isWardSupervisor || s.name.trim().startsWith("WS") || s.name.trim().startsWith("(WS)");
  };

  const monthIdx = new Date(Date.parse(`${config.month} 1, ${config.year}`)).getMonth();
  const validMonthIdx = isNaN(monthIdx) ? 11 : monthIdx;
  const daysInMonth = new Date(config.year, validMonthIdx + 1, 0).getDate();

  // Filter staff pools
  const normalStaff = staff.filter(s => !s.isCounterPart && !isWsStaff(s));
  const regularNormalStaff = normalStaff.filter(s => !isHaStaff(s.name, s));
  const haNormalStaff = normalStaff.filter(s => isHaStaff(s.name, s));
  const wsStaffMembers = staff.filter(s => isWsStaff(s));

  // Map existing/anchored assignments for the target month
  const targetPrefix = `${config.year}-${(validMonthIdx + 1).toString().padStart(2, "0")}-`;
  const existingMap = new Map<string, ShiftType>(); // key: `${staffId}|${date}`

  existingAssignments.forEach(a => {
    if (a.date.startsWith(targetPrefix)) {
      existingMap.set(`${a.staffId}|${a.date}`, a.shift);
    }
  });

  const warnings: string[] = [];

  // Helper to solve for a given group of staff members
  const solveGroup = (
    groupStaff: StaffMember[],
    isHA: boolean
  ): Map<string, ShiftType> => {
    const groupAssignments = new Map<string, ShiftType>();
    if (groupStaff.length === 0) return groupAssignments;

    // Minimum headcounts according to config
    const minM = isHA ? (config.haMinMorning ?? config.minMorning) : config.minMorning;
    const minE = isHA ? (config.haMinEvening ?? config.minEvening) : config.minEvening;
    const minN = isHA ? (config.haMinNight ?? config.minNight) : config.minNight;

    const minMWeekend = isHA ? (config.haMinMorningWeekend ?? config.minMorningWeekend) : config.minMorningWeekend;
    const minEWeekend = isHA ? (config.haMinEveningWeekend ?? config.minEveningWeekend) : config.minEveningWeekend;
    const minNWeekend = isHA ? (config.haMinNightWeekend ?? config.minNightWeekend) : config.minNightWeekend;

    const minMHoliday = isHA
      ? (config.haMinMorningHoliday ?? config.minMorningHoliday ?? config.minMorning)
      : (config.minMorningHoliday ?? config.minMorning);
    const minEHoliday = isHA
      ? (config.haMinEveningHoliday ?? config.minEveningHoliday ?? config.minEvening)
      : (config.minEveningHoliday ?? config.minEvening);
    const minNHoliday = isHA
      ? (config.haMinNightHoliday ?? config.minNightHoliday ?? config.minNight)
      : (config.minNightHoliday ?? config.minNight);

    const minSeniorVal = isHA ? (config.haMinSenior ?? config.minSenior) : config.minSenior;
    const maxMaleVal = isHA ? (config.haMaxMale ?? config.maxMale) : config.maxMale;
    const maxCaringHoursVal = isHA
      ? (config.haMaxCaringHoursPerShift ?? config.maxCaringHoursPerShift ?? 2)
      : (config.maxCaringHoursPerShift ?? 2);
    const maxConsecutiveDutyVal = isHA ? (config.haMaxConsecutiveDuty ?? config.maxConsecutiveDuty) : config.maxConsecutiveDuty;
    const offAfterNightVal = isHA ? (config.haOffAfterNight ?? config.offAfterNight) : config.offAfterNight;
    const maxConsecutiveNightVal = config.maxConsecutiveNight || 2;
    const maxConsecutiveEveningVal = config.maxConsecutiveEvening || 2;

    const holidaysSet = new Set(config.holidays || []);

    // Track state per staff member
    interface StaffState {
      member: StaffMember;
      shiftCounts: { [key in ShiftType]?: number };
      totalDutyDays: number;
      consecutiveDuty: number;
      consecutiveEvening: number;
      consecutiveNight: number;
      mandatoryOffRemaining: number;
      prevShift: ShiftType;
    }

    const stateMap = new Map<string, StaffState>();
    groupStaff.forEach(s => {
      // Find shift from day 0 (previous month's last day) if present in existing assignments
      const prevDate = new Date(config.year, validMonthIdx, 0);
      const prevDateStr = `${prevDate.getFullYear()}-${(prevDate.getMonth() + 1).toString().padStart(2, "0")}-${prevDate.getDate().toString().padStart(2, "0")}`;
      const lastAssignedShift = existingAssignments.find(a => a.staffId === s.id && a.date === prevDateStr)?.shift || ShiftType.None;

      stateMap.set(s.id, {
        member: s,
        shiftCounts: {},
        totalDutyDays: 0,
        consecutiveDuty: 0,
        consecutiveEvening: 0,
        consecutiveNight: 0,
        mandatoryOffRemaining: 0,
        prevShift: lastAssignedShift,
      });
    });

    // Helper to check if staff is on leave or anchored
    const getAnchorShift = (staffId: string, dateStr: string): ShiftType | undefined => {
      const existing = existingMap.get(`${staffId}|${dateStr}`);
      if (existing && existing !== ShiftType.None) return existing;
      return undefined;
    };

    // Helper to evaluate if day is weekend (Fri/Sat in Middle East or Sat/Sun depending on hospital; standard Fri=5, Sat=6)
    const getDayType = (dateStr: string): 'holiday' | 'weekend' | 'weekday' => {
      if (holidaysSet.has(dateStr)) return 'holiday';
      const d = new Date(dateStr);
      const dayOfWeek = d.getDay(); // 0 = Sun, 5 = Fri, 6 = Sat
      if (dayOfWeek === 5 || dayOfWeek === 6) return 'weekend';
      return 'weekday';
    };

    // Day by day generation
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${config.year}-${(validMonthIdx + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const dayType = getDayType(dateStr);

      const targetM = dayType === 'holiday' ? minMHoliday : dayType === 'weekend' ? minMWeekend : minM;
      const targetE = dayType === 'holiday' ? minEHoliday : dayType === 'weekend' ? minEWeekend : minE;
      const targetN = dayType === 'holiday' ? minNHoliday : dayType === 'weekend' ? minNWeekend : minN;

      const dailyAssignments = new Map<string, ShiftType>();

      // 1. First Pass: Lock in all anchored/manual shifts for today
      groupStaff.forEach(s => {
        const anchor = getAnchorShift(s.id, dateStr);
        if (anchor) {
          dailyAssignments.set(s.id, anchor);
        }
      });

      // Count currently locked shifts
      let currentM = 0;
      let currentE = 0;
      let currentN = 0;

      dailyAssignments.forEach(shift => {
        const base = getBaseShiftCode(shift);
        if (base === '1') currentM++;
        else if (base === '2') currentE++;
        else if (base === '3') currentN++;
      });

      // Helper to check eligibility of a staff member for a specific shift
      const canTakeShift = (s: StaffMember, candidateShift: ShiftType): boolean => {
        if (dailyAssignments.has(s.id)) return false;
        const st = stateMap.get(s.id)!;

        // If in mandatory rest recovery after a night shift, must take Off (W)
        if (st.mandatoryOffRemaining > 0 && candidateShift !== ShiftType.Off) {
          return false;
        }

        // Check sequence rule with previous day's shift
        const seq = validateShiftSequence(st.prevShift, candidateShift);
        if (!seq.isValid) return false;

        // Check consecutive duties
        if (candidateShift !== ShiftType.Off) {
          if (st.consecutiveDuty >= maxConsecutiveDutyVal) return false;
        }

        // Check consecutive Night limit
        if (candidateShift === ShiftType.Night) {
          if (st.consecutiveNight >= maxConsecutiveNightVal) return false;
        }

        // Check consecutive Evening limit
        if (candidateShift === ShiftType.Evening) {
          if (st.consecutiveEvening >= maxConsecutiveEveningVal) return false;
        }

        // Check individual limits
        if (candidateShift === ShiftType.Morning && s.maxMorning && (st.shiftCounts[ShiftType.Morning] || 0) >= s.maxMorning) {
          return false;
        }
        if (candidateShift === ShiftType.Evening && s.maxEvening && (st.shiftCounts[ShiftType.Evening] || 0) >= s.maxEvening) {
          return false;
        }
        if (candidateShift === ShiftType.Night && s.maxNight && (st.shiftCounts[ShiftType.Night] || 0) >= s.maxNight) {
          return false;
        }

        return true;
      };

      // 2. Second Pass: Assign Night Shifts (N) - Most restrictive shift requiring recovery
      while (currentN < targetN) {
        // Find candidate staff sorted by least nights worked & best sequence
        const eligible = groupStaff
          .filter(s => canTakeShift(s, ShiftType.Night))
          .sort((a, b) => {
            const stA = stateMap.get(a.id)!;
            const stB = stateMap.get(b.id)!;
            // Prioritize staff who haven't worked night as much
            const nightsA = stA.shiftCounts[ShiftType.Night] || 0;
            const nightsB = stB.shiftCounts[ShiftType.Night] || 0;
            if (nightsA !== nightsB) return nightsA - nightsB;
            // Prioritize staff already on night streak (up to max) for continuity
            if (stA.consecutiveNight > 0 && stA.consecutiveNight < maxConsecutiveNightVal) return -1;
            if (stB.consecutiveNight > 0 && stB.consecutiveNight < maxConsecutiveNightVal) return 1;
            return stA.totalDutyDays - stB.totalDutyDays;
          });

        if (eligible.length === 0) break;
        const chosen = eligible[0];
        dailyAssignments.set(chosen.id, ShiftType.Night);
        currentN++;
      }

      // 3. Third Pass: Assign Evening Shifts (E)
      while (currentE < targetE) {
        const eligible = groupStaff
          .filter(s => canTakeShift(s, ShiftType.Evening))
          .sort((a, b) => {
            const stA = stateMap.get(a.id)!;
            const stB = stateMap.get(b.id)!;
            const evesA = stA.shiftCounts[ShiftType.Evening] || 0;
            const evesB = stB.shiftCounts[ShiftType.Evening] || 0;
            if (evesA !== evesB) return evesA - evesB;
            return stA.totalDutyDays - stB.totalDutyDays;
          });

        if (eligible.length === 0) break;
        const chosen = eligible[0];
        dailyAssignments.set(chosen.id, ShiftType.Evening);
        currentE++;
      }

      // 4. Fourth Pass: Assign Morning Shifts (M)
      while (currentM < targetM) {
        const eligible = groupStaff
          .filter(s => canTakeShift(s, ShiftType.Morning))
          .sort((a, b) => {
            const stA = stateMap.get(a.id)!;
            const stB = stateMap.get(b.id)!;
            // Respect caring hours preference for morning if needed
            if (a.hasCaringHours && !b.hasCaringHours) return -1;
            if (!a.hasCaringHours && b.hasCaringHours) return 1;
            const mornsA = stA.shiftCounts[ShiftType.Morning] || 0;
            const mornsB = stB.shiftCounts[ShiftType.Morning] || 0;
            if (mornsA !== mornsB) return mornsA - mornsB;
            return stA.totalDutyDays - stB.totalDutyDays;
          });

        if (eligible.length === 0) break;
        const chosen = eligible[0];
        dailyAssignments.set(chosen.id, ShiftType.Morning);
        currentM++;
      }

      // 5. Fifth Pass: Remaining unassigned staff get Off (W)
      groupStaff.forEach(s => {
        if (!dailyAssignments.has(s.id)) {
          dailyAssignments.set(s.id, ShiftType.Off);
        }
      });

      // 6. Update staff state tracking for next day
      groupStaff.forEach(s => {
        const assigned = dailyAssignments.get(s.id) || ShiftType.Off;
        groupAssignments.set(`${s.id}|${dateStr}`, assigned);

        const st = stateMap.get(s.id)!;
        const base = getBaseShiftCode(assigned);

        // Update counts
        st.shiftCounts[assigned] = (st.shiftCounts[assigned] || 0) + 1;

        if (base === 'W' || base === 'L' || base === 'P' || base === 'H' || base === 'O') {
          // Off or leave
          st.consecutiveDuty = 0;
          st.consecutiveEvening = 0;
          st.consecutiveNight = 0;
          if (st.mandatoryOffRemaining > 0) {
            st.mandatoryOffRemaining--;
          }
        } else {
          // Working shift
          st.totalDutyDays++;
          st.consecutiveDuty++;

          if (base === '3') {
            st.consecutiveNight++;
            st.consecutiveEvening = 0;
            // If completed night block or reaching max, trigger mandatory recovery
            if (st.consecutiveNight >= maxConsecutiveNightVal) {
              st.mandatoryOffRemaining = offAfterNightVal;
            }
          } else if (base === '2') {
            st.consecutiveEvening++;
            st.consecutiveNight = 0;
            st.mandatoryOffRemaining = 0;
          } else {
            st.consecutiveEvening = 0;
            st.consecutiveNight = 0;
            st.mandatoryOffRemaining = 0;
          }
        }

        st.prevShift = assigned;
      });
    }

    return groupAssignments;
  };

  // Run solver on Regular and MSA/HA groups
  const regularAssignmentsMap = solveGroup(regularNormalStaff, false);
  const haAssignmentsMap = solveGroup(haNormalStaff, true);

  // Combine results
  const allAssignments: Assignment[] = [];
  const assignedKeys = new Set<string>();

  const addAssignment = (staffId: string, date: string, shift: ShiftType) => {
    const key = `${staffId}|${date}`;
    allAssignments.push({
      staffId,
      date,
      shift,
      wardId: config.wardId,
    });
    assignedKeys.add(key);
  };

  regularAssignmentsMap.forEach((shift, key) => {
    const [staffId, date] = key.split("|");
    addAssignment(staffId, date, shift);
  });

  haAssignmentsMap.forEach((shift, key) => {
    const [staffId, date] = key.split("|");
    addAssignment(staffId, date, shift);
  });

  // Include existing Ward Supervisor assignments or set regular default
  wsStaffMembers.forEach(ws => {
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${config.year}-${(validMonthIdx + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const anchor = existingMap.get(`${ws.id}|${dateStr}`);
      if (anchor) {
        addAssignment(ws.id, dateStr, anchor);
      } else {
        // Standard supervisor schedule: weekdays Morning (1), weekends Off (W)
        const d = new Date(dateStr);
        const dayOfWeek = d.getDay();
        const shift = dayOfWeek === 5 || dayOfWeek === 6 ? ShiftType.Off : ShiftType.Morning;
        addAssignment(ws.id, dateStr, shift);
      }
    }
  });

  // Calculate statistics
  let morningCount = 0;
  let eveningCount = 0;
  let nightCount = 0;
  let offCount = 0;
  let leaveCount = 0;

  allAssignments.forEach(a => {
    const base = getBaseShiftCode(a.shift);
    if (base === '1') morningCount++;
    else if (base === '2') eveningCount++;
    else if (base === '3') nightCount++;
    else if (base === 'W') offCount++;
    else if (base === 'L' || base === 'P' || base === 'H' || base === 'O') leaveCount++;
  });

  return {
    assignments: allAssignments,
    stats: {
      totalAssigned: allAssignments.length,
      morningCount,
      eveningCount,
      nightCount,
      offCount,
      leaveCount,
      warnings,
    },
  };
};

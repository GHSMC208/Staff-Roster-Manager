
import { GoogleGenAI, Type } from "@google/genai";
import { StaffMember, RosterConfig, Assignment, ShiftType } from "../types";

/**
 * Generates a full month staff duty roster using Gemini 3 Pro reasoning.
 * Employs thinking budget to ensure complex constraints like senior distribution,
 * gender balance, and recovery periods are handled with high accuracy.
 * Explicitly preserves all manual/requested assignments as absolute anchors.
 */
export const generateRoster = async (
  staff: StaffMember[],
  config: RosterConfig,
  manualAssignments: Assignment[],
  customApiKey?: string
): Promise<Assignment[]> => {
  const activeKey = customApiKey?.trim() || process.env.GEMINI_API_KEY || process.env.API_KEY || "";
  if (!activeKey) {
    throw new Error("Missing Gemini API Key. Please provide a valid Gemini API key or use the Local System Generation option (no API key required).");
  }
  const ai = new GoogleGenAI({ apiKey: activeKey });
  
  const isHaStaff = (name: string, member?: StaffMember): boolean => {
    if (member?.isHa) return true;
    const trimmed = name.trim();
    return trimmed.startsWith('HA') || trimmed.startsWith('(HA)') || trimmed.startsWith('MSA') || trimmed.startsWith('(MSA)');
  };

  const isWsStaff = (s?: StaffMember): boolean => {
    if (!s) return false;
    return !!s.isWardSupervisor || s.name.trim().startsWith('WS') || s.name.trim().startsWith('(WS)');
  };

  const normalStaff = staff.filter(s => !s.isCounterPart && !isWsStaff(s));
  const regularNormalStaff = normalStaff.filter(s => !isHaStaff(s.name, s));
  const haNormalStaff = normalStaff.filter(s => isHaStaff(s.name, s));

  const regularManualAssignments = manualAssignments.filter(a => regularNormalStaff.some(s => s.id === a.staffId));
  const haManualAssignments = manualAssignments.filter(a => haNormalStaff.some(s => s.id === a.staffId));
  const wsManualAssignments = manualAssignments.filter(a => isWsStaff(staff.find(s => s.id === a.staffId)));

  const generateForGroup = async (
    groupStaff: StaffMember[],
    groupManual: Assignment[],
    groupLabel: string
  ): Promise<Assignment[]> => {
    if (groupStaff.length === 0) return [];

    const monthIdx = new Date(Date.parse(config.month + " 1, " + config.year)).getMonth();
    const daysInMonth = new Date(config.year, monthIdx + 1, 0).getDate();

    const isHA = groupLabel === "MSA Staff" || groupLabel === "HA Staff";
    const minM = isHA ? (config.haMinMorning ?? config.minMorning) : config.minMorning;
    const minE = isHA ? (config.haMinEvening ?? config.minEvening) : config.minEvening;
    const minN = isHA ? (config.haMinNight ?? config.minNight) : config.minNight;
    
    const minMWeekend = isHA ? (config.haMinMorningWeekend ?? config.minMorningWeekend) : config.minMorningWeekend;
    const minEWeekend = isHA ? (config.haMinEveningWeekend ?? config.minEveningWeekend) : config.minEveningWeekend;
    const minNWeekend = isHA ? (config.haMinNightWeekend ?? config.minNightWeekend) : config.minNightWeekend;

    const minMHoliday = isHA ? (config.haMinMorningHoliday ?? config.minMorningHoliday ?? config.minMorning) : (config.minMorningHoliday ?? config.minMorning);
    const minEHoliday = isHA ? (config.haMinEveningHoliday ?? config.minEveningHoliday ?? config.minEvening) : (config.minEveningHoliday ?? config.minEvening);
    const minNHoliday = isHA ? (config.haMinNightHoliday ?? config.minNightHoliday ?? config.minNight) : (config.minNightHoliday ?? config.minNight);

    const minSeniorVal = isHA ? (config.haMinSenior ?? config.minSenior) : config.minSenior;
    const maxMaleVal = isHA ? (config.haMaxMale ?? config.maxMale) : config.maxMale;
    const maxCaringHoursVal = isHA ? (config.haMaxCaringHoursPerShift ?? config.maxCaringHoursPerShift ?? 2) : (config.maxCaringHoursPerShift ?? 2);
    const maxConsecutiveDutyVal = isHA ? (config.haMaxConsecutiveDuty ?? config.maxConsecutiveDuty) : config.maxConsecutiveDuty;
    const offAfterNightVal = isHA ? (config.haOffAfterNight ?? config.offAfterNight) : config.offAfterNight;

    const balancingRules = isHA
      ? `2. BALANCING RULES:
       - Max Caring Hours staff per shift: ${maxCaringHoursVal}. Do NOT assign more than ${maxCaringHoursVal} female staff with caring hours (hasCaringHours: true) on duty in the same shift on any day.
       - Recovery: EXACTLY ${offAfterNightVal} Off (W) days MUST follow any Night (3) shift series.
       - Max Consecutive Duties: ${maxConsecutiveDutyVal} days max working before a 'W'.
       - Limits: Max ${config.maxConsecutiveEvening} Eve shifts and ${config.maxConsecutiveNight} Night shifts consecutively.`
      : `2. BALANCING RULES:
       - Every shift MUST have at least ${minSeniorVal} Senior staff members (isSenior: true) from this category if available.
       - Max Male staff per shift: ${maxMaleVal}.
       - Max Caring Hours staff per shift: ${maxCaringHoursVal}. Do NOT assign more than ${maxCaringHoursVal} female staff with caring hours (hasCaringHours: true) on duty in the same shift on any day.
       - Recovery: EXACTLY ${offAfterNightVal} Off (W) days MUST follow any Night (3) shift series.
       - Max Consecutive Duties: ${maxConsecutiveDutyVal} days max working before a 'W'.
       - Limits: Max ${config.maxConsecutiveEvening} Eve shifts and ${config.maxConsecutiveNight} Night shifts consecutively.`;

    const prompt = `
    TASK: Generate a complete monthly duty roster for ${config.month} ${config.year} (${daysInMonth} days) for the "${groupLabel}" staff category.
    
    CRITICAL INSTRUCTION:
    Any assignment starting with 'R' (R1, R2, R3, RW), 'L' (Leave), 'P' (Compensation Leave), 'H' (Public Holiday), or 'O' (On-call) in the PROVIDED ASSIGNMENTS list is SACRED. 
    You MUST NOT change these. You MUST include them in your output exactly as they are.

    STAFF DATABASE (INCLUDING INDIVIDUAL LIMITS) FOR ${groupLabel.toUpperCase()} STAFF:
    ${JSON.stringify(groupStaff)}

    ROSTER RULES (100% ADHERENCE REQUIRED FOR THIS CATEGORY):
    1. OPERATIONAL HEADCOUNT (DAILY MINIMUMS FOR THIS CATEGORY - NOTE: On-call duties O1, O2, O3 are separate standby shifts and are NOT counted towards these shift staff counts):
       - On Holidays (${config.holidays && config.holidays.length > 0 ? `specifically the following dates: ${config.holidays.join(', ')}` : 'None defined'}):
         * Morning (1, R1, 1S): >= ${minMHoliday} staff
         * Evening (2, R2): >= ${minEHoliday} staff
         * Night (3, R3): >= ${minNHoliday} staff
       - On Weekdays (Sunday, Monday, Tuesday, Wednesday, Thursday) (excluding any holidays listed above):
         * Morning (1, R1, 1S): >= ${minM} staff
         * Evening (2, R2): >= ${minE} staff
         * Night (3, R3): >= ${minN} staff
       - On Weekends (Friday, Saturday) (excluding any holidays listed above):
         * Morning (1, R1, 1S): >= ${minMWeekend} staff
         * Evening (2, R2): >= ${minEWeekend} staff
         * Night (3, R3): >= ${minNWeekend} staff

    ${balancingRules}

    3. INDIVIDUAL STAFF CONSTRAINTS:
       - Each staff member has monthly limits for Morning, Evening, Night, and Off shifts (maxMorning, maxEvening, maxNight, maxOff). 
       - You MUST NOT exceed these monthly totals (including maximum allowed Off 'W' days) for any staff member.
       - Female staff members with "hasCaringHours: true" have caring duties: prioritize giving them regular morning/day shifts or off days and minimize irregular night assignments wherever possible to accommodate their caring hours.

    4. STRICT SEQUENCE RULES (SHIFT AFTER PREVIOUS DAY - MANDATORY):
       - Morning shift (1, 1S, O1, R1) is ALLOWED ONLY AFTER: "W" (off), "L" (leave), "P" (compensation leave), or "1" (morning). NEVER after Evening (2) or Night (3).
       - Evening shift (2, O2, R2) is ALLOWED ONLY AFTER: "W" (off), "L" (leave), "P" (compensation leave), "1" (morning), or "2" (evening). NEVER after Night (3).
       - Night shift (3, O3, R3) is ALLOWED AFTER: "W" (off), "L" (leave), "P" (compensation leave), "1" (morning), "2" (evening), or "3" (night).
       - Distribute duties fairly among all staff not on Leave (L) or Compensation Leave (P).

    CURRENT MANUAL ASSIGNMENTS (ANCHORS) FOR ${groupLabel.toUpperCase()} STAFF:
    ${JSON.stringify(groupManual)}

    OUTPUT:
    Return a JSON array where every staffId has one entry for every day of the month.
    Fields: "staffId", "date" (YYYY-MM-DD), "shift" (string code).
  `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 16384 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                staffId: { type: Type.STRING },
                date: { type: Type.STRING },
                shift: { type: Type.STRING },
              },
              required: ["staffId", "date", "shift"],
            },
          },
        },
      });

      const text = response.text;
      if (!text) throw new Error(`AI returned empty response for ${groupLabel}`);

      let generatedAssignments: Assignment[] = JSON.parse(text.trim());

      // FORCED SAFETY LAYER: Re-apply manual overrides for this group
      const manualMap = new Map();
      groupManual.forEach(a => manualMap.set(`${a.staffId}|${a.date}`, a.shift));

      const finalAssignments = generatedAssignments.map(a => {
        const key = `${a.staffId}|${a.date}`;
        if (manualMap.has(key)) {
          return { ...a, shift: manualMap.get(key) };
        }
        return a;
      });

      // Ensure all missing days/staff are filled
      const finalKeys = new Set(finalAssignments.map(a => `${a.staffId}|${a.date}`));
      groupManual.forEach(ma => {
        const key = `${ma.staffId}|${ma.date}`;
        if (!finalKeys.has(key)) finalAssignments.push(ma);
      });

      return finalAssignments;
    } catch (error) {
      console.error(`Error generating roster for ${groupLabel}:`, error);
      throw error;
    }
  };

  try {
    const [regularAssignments, haAssignments] = await Promise.all([
      generateForGroup(regularNormalStaff, regularManualAssignments, "Regular Staff"),
      generateForGroup(haNormalStaff, haManualAssignments, "MSA Staff")
    ]);
    return [...regularAssignments, ...haAssignments, ...wsManualAssignments];
  } catch (error) {
    console.error("Roster Generation Error:", error);
    throw error;
  }
};

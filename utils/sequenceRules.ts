import { ShiftType } from '../types';

export interface SequenceValidationResult {
  isValid: boolean;
  message?: string;
  prevShiftCode?: string;
  currShiftCode?: string;
}

export const getBaseShiftCode = (shift: ShiftType): '1' | '2' | '3' | 'W' | 'L' | 'O' | 'H' | 'P' | '-' => {
  if ([ShiftType.Morning, ShiftType.MorningSpecial, ShiftType.MorningOnCall, ShiftType.RequestedMorning].includes(shift)) {
    return '1';
  }
  if ([ShiftType.Evening, ShiftType.EveningOnCall, ShiftType.RequestedEvening].includes(shift)) {
    return '2';
  }
  if ([ShiftType.Night, ShiftType.NightOnCall, ShiftType.RequestedNight].includes(shift)) {
    return '3';
  }
  if ([ShiftType.Off, ShiftType.RequestedOff].includes(shift)) {
    return 'W';
  }
  if (shift === ShiftType.Leave) {
    return 'L';
  }
  if (shift === ShiftType.OtherLeave) {
    return 'O';
  }
  if (shift === ShiftType.PublicHoliday) {
    return 'H';
  }
  if (shift === ShiftType.CompensationLeave) {
    return 'P';
  }
  return '-';
};

/**
 * Strict Sequence Rules (Shift After Previous Day):
 * - Morning shift allowed only after: "W" (off), "L" (leave), "O" (other leave), "P" (comp leave), or "1" (morning).
 * - Evening shift allowed only after: "W", "L", "O", "P", "1", or "2".
 * - Night shift allowed after: "W", "L", "O", "P", "1", "2", or "3".
 */
export const validateShiftSequence = (prevShift: ShiftType, currShift: ShiftType): SequenceValidationResult => {
  const prevBase = getBaseShiftCode(prevShift);
  const currBase = getBaseShiftCode(currShift);

  // If either shift is unassigned ('-'), sequence constraint is skipped
  if (prevBase === '-' || currBase === '-') {
    return { isValid: true };
  }

  // Off, Leave, Other Leave, Holiday, and Comp Leave are always allowed on current day
  if (currBase === 'W' || currBase === 'L' || currBase === 'O' || currBase === 'H' || currBase === 'P') {
    return { isValid: true };
  }

  // If previous day was Off ('W'), Leave ('L'), Other Leave ('O'), Holiday ('H'), or Comp Leave ('P'), any current shift is allowed
  if (prevBase === 'W' || prevBase === 'L' || prevBase === 'O' || prevBase === 'H' || prevBase === 'P') {
    return { isValid: true };
  }

  // Morning shift allowed ONLY after W, L, O, P, or 1
  if (currBase === '1') {
    if (prevBase === '1') return { isValid: true };
    return {
      isValid: false,
      message: `Morning shift (1) allowed only after W, L, O, P, or 1 (Found after '${prevBase}')`,
      prevShiftCode: prevBase,
      currShiftCode: currBase
    };
  }

  // Evening shift allowed ONLY after W, L, O, P, 1, or 2
  if (currBase === '2') {
    if (prevBase === '1' || prevBase === '2') return { isValid: true };
    return {
      isValid: false,
      message: `Evening shift (2) allowed only after W, L, O, P, 1, or 2 (Found after '${prevBase}')`,
      prevShiftCode: prevBase,
      currShiftCode: currBase
    };
  }

  // Night shift allowed after W, L, O, P, 1, 2, or 3
  if (currBase === '3') {
    if (prevBase === '1' || prevBase === '2' || prevBase === '3') return { isValid: true };
    return {
      isValid: false,
      message: `Night shift (3) allowed only after W, L, O, P, 1, 2, or 3 (Found after '${prevBase}')`,
      prevShiftCode: prevBase,
      currShiftCode: currBase
    };
  }

  return { isValid: true };
};

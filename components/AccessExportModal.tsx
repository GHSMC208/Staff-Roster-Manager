import React, { useState } from 'react';
import { StaffMember, WardInfo, ClinicalDivision, Assignment, RosterConfig, ShiftType } from '../types';
import { 
  Database, 
  Download, 
  FileCode, 
  FileSpreadsheet, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  Layers, 
  X, 
  Sparkles, 
  ShieldCheck, 
  FileText,
  HelpCircle,
  FolderDown
} from 'lucide-react';

interface AccessExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  wards: WardInfo[];
  staff: StaffMember[];
  divisions: ClinicalDivision[];
  assignments: Assignment[];
  config: RosterConfig;
  currentWard?: WardInfo;
}

export const AccessExportModal: React.FC<AccessExportModalProps> = ({
  isOpen,
  onClose,
  wards,
  staff,
  divisions,
  assignments,
  config,
  currentWard
}) => {
  const [activeTab, setActiveTab] = useState<'builder' | 'vba' | 'tables' | 'guide'>('builder');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const triggerDownload = (filename: string, content: string, mimeType: string = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 1. Generate VBScript that constructs HospitalRoster.accdb via MS Access COM automation
  const generateVBScript = (): string => {
    const escapeVBS = (str: string | undefined | null) => {
      if (!str) return '';
      return str.replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
    };

    // Filter relevant assignments for the active ward or all active assignments
    const activeAssignments = assignments.filter(a => a.shift && a.shift !== ShiftType.None);

    let script = `' ==============================================================================
' HOSPITAL ROSTER ACCDB AUTOMATED BUILDER
' Generated automatically by AI Staff Roster Manager
' Date: ${new Date().toLocaleDateString()}
' Target File: HospitalRoster.accdb
' ==============================================================================
Option Explicit

Dim fso, currentDir, dbPath, accessApp, db

Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
dbPath = currentDir & "\\HospitalRoster.accdb"

If fso.FileExists(dbPath) Then
    On Error Resume Next
    fso.DeleteFile dbPath, True
    If Err.Number <> 0 Then
        MsgBox "The file " & dbPath & " is open or locked." & vbCrLf & _
               "Please close Microsoft Access and run this script again.", vbCritical, "File In Use"
        WScript.Quit
    End If
    On Error GoTo 0
End If

WScript.Echo "Creating Microsoft Access Database..." & vbCrLf & _
             "Location: " & dbPath & vbCrLf & vbCrLf & _
             "Generating tables, constraints, queries and loading hospital records..."

Set accessApp = CreateObject("Access.Application")
accessApp.Visible = False

accessApp.NewCurrentDatabase dbPath
Set db = accessApp.CurrentDb

' ------------------------------------------------------------------------------
' 1. CREATE TABLE: tblDivisions
' ------------------------------------------------------------------------------
db.Execute "CREATE TABLE tblDivisions (" & _
           "DivisionID VARCHAR(50) CONSTRAINT PK_tblDivisions PRIMARY KEY, " & _
           "DivisionName VARCHAR(100) NOT NULL, " & _
           "Category VARCHAR(50), " & _
           "Description VARCHAR(255)" & _
           ");"

' ------------------------------------------------------------------------------
' 2. CREATE TABLE: tblWards
' ------------------------------------------------------------------------------
db.Execute "CREATE TABLE tblWards (" & _
           "WardID VARCHAR(50) CONSTRAINT PK_tblWards PRIMARY KEY, " & _
           "WardCode VARCHAR(20) NOT NULL, " & _
           "WardName VARCHAR(100) NOT NULL, " & _
           "Category VARCHAR(50), " & _
           "SupervisorName VARCHAR(100), " & _
           "SupervisorEmail VARCHAR(100), " & _
           "TotalBeds INTEGER DEFAULT 20" & _
           ");"

' ------------------------------------------------------------------------------
' 3. CREATE TABLE: tblShifts (Reference Dictionary)
' ------------------------------------------------------------------------------
db.Execute "CREATE TABLE tblShifts (" & _
           "ShiftCode VARCHAR(10) CONSTRAINT PK_tblShifts PRIMARY KEY, " & _
           "ShiftName VARCHAR(50) NOT NULL, " & _
           "StartTime VARCHAR(10), " & _
           "EndTime VARCHAR(10), " & _
           "ShiftType VARCHAR(30)" & _
           ");"

' ------------------------------------------------------------------------------
' 4. CREATE TABLE: tblStaff
' ------------------------------------------------------------------------------
db.Execute "CREATE TABLE tblStaff (" & _
           "StaffID VARCHAR(50) CONSTRAINT PK_tblStaff PRIMARY KEY, " & _
           "FullName VARCHAR(100) NOT NULL, " & _
           "Email VARCHAR(100), " & _
           "JobTitle VARCHAR(50), " & _
           "Designation VARCHAR(20), " & _
           "WardID VARCHAR(50), " & _
           "Category VARCHAR(50), " & _
           "Gender VARCHAR(10), " & _
           "IsSenior YESNO, " & _
           "Phone VARCHAR(30), " & _
           "LicenseNumber VARCHAR(50), " & _
           "MaxMorning INTEGER, " & _
           "MaxEvening INTEGER, " & _
           "MaxNight INTEGER, " & _
           "MaxOff INTEGER, " & _
           "IsActive YESNO DEFAULT True" & _
           ");"

' ------------------------------------------------------------------------------
' 5. CREATE TABLE: tblRosterAssignments
' ------------------------------------------------------------------------------
db.Execute "CREATE TABLE tblRosterAssignments (" & _
           "AssignmentID AUTOINCREMENT CONSTRAINT PK_tblRosterAssignments PRIMARY KEY, " & _
           "StaffID VARCHAR(50) NOT NULL, " & _
           "WardID VARCHAR(50), " & _
           "AssignmentDate DATETIME NOT NULL, " & _
           "ShiftCode VARCHAR(10) NOT NULL, " & _
           "RosterYear INTEGER, " & _
           "RosterMonth VARCHAR(20), " & _
           "IsLocked YESNO DEFAULT False, " & _
           "Notes VARCHAR(255)" & _
           ");"

' ------------------------------------------------------------------------------
' 6. CREATE TABLE: tblDutyExchanges
' ------------------------------------------------------------------------------
db.Execute "CREATE TABLE tblDutyExchanges (" & _
           "ExchangeID AUTOINCREMENT CONSTRAINT PK_tblDutyExchanges PRIMARY KEY, " & _
           "RequesterStaffID VARCHAR(50) NOT NULL, " & _
           "TargetStaffID VARCHAR(50) NOT NULL, " & _
           "RequesterDate DATETIME NOT NULL, " & _
           "TargetDate DATETIME NOT NULL, " & _
           "Status VARCHAR(30) DEFAULT 'Pending', " & _
           "RequestedAt DATETIME" & _
           ");"

' ------------------------------------------------------------------------------
' POPULATE SHIFT DEFINITIONS
' ------------------------------------------------------------------------------
`;

    const shiftData = [
      { code: 'M', name: 'Morning Shift', start: '07:00', end: '15:30', type: 'Regular' },
      { code: 'E', name: 'Evening Shift', start: '15:00', end: '23:00', type: 'Regular' },
      { code: 'N', name: 'Night Shift', start: '22:30', end: '07:30', type: 'Regular' },
      { code: 'Off', name: 'Scheduled Off', start: '', end: '', type: 'Off' },
      { code: 'L', name: 'Annual / Medical Leave', start: '', end: '', type: 'Leave' },
      { code: 'H', name: 'Public Holiday', start: '', end: '', type: 'Holiday' },
      { code: 'CL', name: 'Compensation Leave', start: '', end: '', type: 'Leave' },
      { code: 'RM', name: 'Relief Morning', start: '07:00', end: '15:30', type: 'Relief' },
      { code: 'RE', name: 'Relief Evening', start: '15:00', end: '23:00', type: 'Relief' },
      { code: 'RN', name: 'Relief Night', start: '22:30', end: '07:30', type: 'Relief' },
      { code: 'MS', name: 'Morning Special', start: '08:00', end: '16:00', type: 'Special' },
      { code: 'MO', name: 'Morning On-Call', start: '07:00', end: '15:30', type: 'OnCall' },
      { code: 'EO', name: 'Evening On-Call', start: '15:00', end: '23:00', type: 'OnCall' },
      { code: 'NO', name: 'Night On-Call', start: '22:30', end: '07:30', type: 'OnCall' }
    ];

    shiftData.forEach(s => {
      script += `db.Execute "INSERT INTO tblShifts (ShiftCode, ShiftName, StartTime, EndTime, ShiftType) VALUES ('${s.code}', '${escapeVBS(s.name)}', '${s.start}', '${s.end}', '${s.type}');"\n`;
    });

    script += `\n' ------------------------------------------------------------------------------\n' POPULATE DIVISIONS (${divisions.length} Records)\n' ------------------------------------------------------------------------------\n`;
    divisions.forEach(d => {
      script += `db.Execute "INSERT INTO tblDivisions (DivisionID, DivisionName, Category, Description) VALUES ('${escapeVBS(d.id)}', '${escapeVBS(d.name)}', '${escapeVBS(d.name)}', '${escapeVBS(d.description)}');"\n`;
    });

    script += `\n' ------------------------------------------------------------------------------\n' POPULATE WARDS (${wards.length} Records)\n' ------------------------------------------------------------------------------\n`;
    wards.forEach(w => {
      script += `db.Execute "INSERT INTO tblWards (WardID, WardCode, WardName, Category, SupervisorName, SupervisorEmail, TotalBeds) VALUES ('${escapeVBS(w.id)}', '${escapeVBS(w.code)}', '${escapeVBS(w.name)}', '${escapeVBS(w.category)}', '${escapeVBS(w.supervisorName)}', '${escapeVBS(w.supervisorEmail)}', 25);"\n`;
    });

    script += `\n' ------------------------------------------------------------------------------\n' POPULATE STAFF DIRECTORY (${staff.length} Personnel)\n' ------------------------------------------------------------------------------\n`;
    staff.forEach(s => {
      const isSeniorVal = s.isSenior ? 'True' : 'False';
      const genderVal = s.isMale ? 'M' : 'F';
      const designation = s.isSenior ? 'SRN' : 'RN';
      script += `db.Execute "INSERT INTO tblStaff (StaffID, FullName, Email, JobTitle, Designation, WardID, Category, Gender, IsSenior, Phone, LicenseNumber, MaxMorning, MaxEvening, MaxNight, MaxOff) VALUES (" & _\n` +
                `           "'${escapeVBS(s.id)}', '${escapeVBS(s.name)}', '${escapeVBS(s.email)}', '${escapeVBS(s.jobTitle || 'Staff Nurse')}', '${designation}', '${escapeVBS(s.wardId || '')}', '${escapeVBS(s.category || '')}', '${genderVal}', ${isSeniorVal}, '${escapeVBS(s.phone || '')}', '${escapeVBS(s.licenseNumber || '')}', ${s.maxMorning || 15}, ${s.maxEvening || 10}, ${s.maxNight || 8}, ${s.maxOff ?? 10});"\n`;
    });

    if (activeAssignments.length > 0) {
      script += `\n' ------------------------------------------------------------------------------\n' POPULATE ROSTER ASSIGNMENTS (${activeAssignments.length} Assignments)\n' ------------------------------------------------------------------------------\n`;
      // Insert in chunks
      activeAssignments.forEach(a => {
        script += `db.Execute "INSERT INTO tblRosterAssignments (StaffID, WardID, AssignmentDate, ShiftCode, RosterYear, RosterMonth) VALUES ('${escapeVBS(a.staffId)}', '${escapeVBS(a.wardId || config.wardId)}', #${a.date}#, '${escapeVBS(a.shift)}', ${config.year}, '${config.month}');"\n`;
      });
    }

    script += `\n' ------------------------------------------------------------------------------
' CREATE STANDARD QUERIES
' ------------------------------------------------------------------------------
' 1. Ward Staff Roster Overview
db.CreateQueryDef "qryActiveStaffByWard", _
    "SELECT tblStaff.StaffID, tblStaff.FullName, tblStaff.JobTitle, tblWards.WardName, tblStaff.Gender, tblStaff.IsSenior, tblStaff.Phone " & _
    "FROM tblStaff INNER JOIN tblWards ON tblStaff.WardID = tblWards.WardID " & _
    "WHERE tblStaff.IsActive = True ORDER BY tblWards.WardName, tblStaff.FullName;"

' 2. Daily Duty Roster Sheet
db.CreateQueryDef "qryDailyDutyRoster", _
    "SELECT tblRosterAssignments.AssignmentDate, tblWards.WardCode, tblStaff.FullName, tblStaff.JobTitle, tblShifts.ShiftCode, tblShifts.ShiftName, tblStaff.Phone " & _
    "FROM (tblRosterAssignments INNER JOIN tblStaff ON tblRosterAssignments.StaffID = tblStaff.StaffID) " & _
    "INNER JOIN tblWards ON tblRosterAssignments.WardID = tblWards.WardID " & _
    "INNER JOIN tblShifts ON tblRosterAssignments.ShiftCode = tblShifts.ShiftCode " & _
    "ORDER BY tblRosterAssignments.AssignmentDate, tblWards.WardCode, tblShifts.ShiftCode;"

' 3. Monthly Crosstab Grid
db.CreateQueryDef "qryMonthlyCrosstabGrid", _
    "TRANSFORM First(tblRosterAssignments.ShiftCode) AS Shift " & _
    "SELECT tblStaff.StaffID, tblStaff.FullName, tblStaff.JobTitle " & _
    "FROM tblRosterAssignments INNER JOIN tblStaff ON tblRosterAssignments.StaffID = tblStaff.StaffID " & _
    "GROUP BY tblStaff.StaffID, tblStaff.FullName, tblStaff.JobTitle " & _
    "PIVOT Day(tblRosterAssignments.AssignmentDate);"

' 4. Shift Coverage Totals
db.CreateQueryDef "qryShiftCoverageSummary", _
    "SELECT tblRosterAssignments.AssignmentDate, tblWards.WardCode, tblRosterAssignments.ShiftCode, Count(tblRosterAssignments.AssignmentID) AS CoverageCount " & _
    "FROM tblRosterAssignments INNER JOIN tblWards ON tblRosterAssignments.WardID = tblWards.WardID " & _
    "GROUP BY tblRosterAssignments.AssignmentDate, tblWards.WardCode, tblRosterAssignments.ShiftCode " & _
    "ORDER BY tblRosterAssignments.AssignmentDate, tblWards.WardCode;"

accessApp.CloseCurrentDatabase
accessApp.Quit
Set accessApp = Nothing
Set fso = Nothing

MsgBox "SUCCESS! Microsoft Access database created successfully at:" & vbCrLf & _
       dbPath & vbCrLf & vbCrLf & _
       "• Tables created: tblDivisions, tblWards, tblStaff, tblShifts, tblRosterAssignments, tblDutyExchanges" & vbCrLf & _
       "• Loaded: " & ${staff.length} & " staff members & " & ${activeAssignments.length} & " roster assignments" & vbCrLf & _
       "• Created 4 standard queries including qryMonthlyCrosstabGrid", vbInformation, "Hospital Roster Builder"
`;

    return script;
  };

  // 2. Generate VBA Module for sequence constraints
  const generateVBAModule = (): string => {
    return `' Attribute VB_Name = "modRosterValidation"
' ==============================================================================
' HOSPITAL ROSTER CONSTRAINT VALIDATION ENGINE
' Automatically validates duty sequence rules according to hospital policy
' ==============================================================================
Option Compare Database
Option Explicit

' Policy Constants
Public Const MAX_CONSECUTIVE_NIGHTS As Integer = 2
Public Const MAX_CONSECUTIVE_DUTY As Integer = 5
Public Const MANDATORY_OFF_AFTER_NIGHT As Integer = 2

''' <summary>
''' Validates whether assigning a shift violates hospital scheduling constraints.
''' Returns "OK" if valid, or a descriptive violation message.
''' </summary>
Public Function ValidateShiftAssignment(ByVal StaffID As String, ByVal TargetDate As Date, ByVal NewShift As String) As String
    Dim result As String
    result = "OK"

    ' 1. Check rest violation: Morning shift immediately after Night shift
    If NewShift = "M" Or NewShift = "RM" Then
        Dim prevShift As String
        prevShift = GetShiftOnDate(StaffID, DateAdd("d", -1, TargetDate))
        If prevShift = "N" Or prevShift = "RN" Then
            ValidateShiftAssignment = "VIOLATION: Cannot assign Morning shift immediately following a Night shift! Minimum 16h rest required."
            Exit Function
        End If
    End If

    ' 2. Check maximum consecutive nights (e.g. max 2 nights)
    If NewShift = "N" Or NewShift = "RN" Then
        Dim nightCount As Integer
        nightCount = CountConsecutivePastShifts(StaffID, TargetDate, "N")
        If nightCount >= MAX_CONSECUTIVE_NIGHTS Then
            ValidateShiftAssignment = "VIOLATION: Maximum " & MAX_CONSECUTIVE_NIGHTS & " consecutive Night shifts allowed! Staff member needs mandatory rest."
            Exit Function
        End If
    End If

    ' 3. Check mandatory OFF days after night block
    If NewShift = "M" Or NewShift = "E" Then
        Dim daysSinceNight As Integer
        daysSinceNight = CheckDaysSinceLastNight(StaffID, TargetDate)
        If daysSinceNight > 0 And daysSinceNight <= MANDATORY_OFF_AFTER_NIGHT Then
            ValidateShiftAssignment = "WARNING: Mandatory " & MANDATORY_OFF_AFTER_NIGHT & " OFF days required following Night shift block."
            Exit Function
        End If
    End If

    ' 4. Check maximum consecutive working days (max 5)
    If NewShift <> "Off" And NewShift <> "L" And NewShift <> "H" And NewShift <> "CL" Then
        Dim consecutiveWork As Integer
        consecutiveWork = CountConsecutiveWorkingDays(StaffID, TargetDate)
        If consecutiveWork >= MAX_CONSECUTIVE_DUTY Then
            ValidateShiftAssignment = "VIOLATION: Staff member has worked " & consecutiveWork & " consecutive days. Maximum is " & MAX_CONSECUTIVE_DUTY & "."
            Exit Function
        End If
    End If

    ValidateShiftAssignment = result
End Function

''' <summary>
''' Retrieves the shift code for a staff member on a specific date.
''' </summary>
Public Function GetShiftOnDate(ByVal StaffID As String, ByVal CheckDate As Date) As String
    Dim rs As DAO.Recordset
    Dim strSQL As String
    
    strSQL = "SELECT ShiftCode FROM tblRosterAssignments " & _
             "WHERE StaffID = '" & Replace(StaffID, "'", "''") & "' " & _
             "AND AssignmentDate = #" & Format(CheckDate, "yyyy-mm-dd") & "#;"
             
    Set rs = CurrentDb.OpenRecordset(strSQL, dbOpenSnapshot)
    If Not rs.EOF Then
        GetShiftOnDate = Nz(rs!ShiftCode, "")
    Else
        GetShiftOnDate = ""
    End If
    rs.Close
    Set rs = Nothing
End Function

''' <summary>
''' Counts past consecutive shifts matching a given prefix (e.g. "N").
''' </summary>
Private Function CountConsecutivePastShifts(ByVal StaffID As String, ByVal TargetDate As Date, ByVal ShiftPrefix As String) As Integer
    Dim count As Integer
    Dim checkD As Date
    Dim s As String
    
    count = 0
    checkD = DateAdd("d", -1, TargetDate)
    
    Do While True
        s = GetShiftOnDate(StaffID, checkD)
        If InStr(1, s, ShiftPrefix, vbTextCompare) > 0 Then
            count = count + 1
            checkD = DateAdd("d", -1, checkD)
        Else
            Exit Do
        End If
        If count > 10 Then Exit Do
    Loop
    
    CountConsecutivePastShifts = count
End Function

''' <summary>
''' Checks how many days have elapsed since the last Night shift.
''' </summary>
Private Function CheckDaysSinceLastNight(ByVal StaffID As String, ByVal TargetDate As Date) As Integer
    Dim d As Integer
    Dim checkD As Date
    Dim s As String
    
    For d = 1 To 3
        checkD = DateAdd("d", -d, TargetDate)
        s = GetShiftOnDate(StaffID, checkD)
        If s = "N" Or s = "RN" Then
            CheckDaysSinceLastNight = d
            Exit Function
        End If
    Next d
    
    CheckDaysSinceLastNight = -1
End Function

''' <summary>
''' Counts total consecutive working days up to TargetDate.
''' </summary>
Private Function CountConsecutiveWorkingDays(ByVal StaffID As String, ByVal TargetDate As Date) As Integer
    Dim count As Integer
    Dim checkD As Date
    Dim s As String
    
    count = 0
    checkD = DateAdd("d", -1, TargetDate)
    
    Do While True
        s = GetShiftOnDate(StaffID, checkD)
        If s <> "" And s <> "Off" And s <> "L" And s <> "H" And s <> "CL" Then
            count = count + 1
            checkD = DateAdd("d", -1, checkD)
        Else
            Exit Do
        End If
        If count > 14 Then Exit Do
    Loop
    
    CountConsecutiveWorkingDays = count
End Function
`;
  };

  // 3. Generate SQL Schema Script
  const generateSQLSchema = (): string => {
    return `-- ==============================================================================
-- HOSPITAL ROSTER DATABASE SCHEMA (MS Access & SQL Server Compatible)
-- Generated by AI Staff Roster Manager
-- ==============================================================================

CREATE TABLE tblDivisions (
    DivisionID VARCHAR(50) NOT NULL PRIMARY KEY,
    DivisionName VARCHAR(100) NOT NULL,
    Category VARCHAR(50),
    Description VARCHAR(255)
);

CREATE TABLE tblWards (
    WardID VARCHAR(50) NOT NULL PRIMARY KEY,
    WardCode VARCHAR(20) NOT NULL,
    WardName VARCHAR(100) NOT NULL,
    Category VARCHAR(50),
    SupervisorName VARCHAR(100),
    SupervisorEmail VARCHAR(100),
    TotalBeds INTEGER DEFAULT 20
);

CREATE TABLE tblShifts (
    ShiftCode VARCHAR(10) NOT NULL PRIMARY KEY,
    ShiftName VARCHAR(50) NOT NULL,
    StartTime VARCHAR(10),
    EndTime VARCHAR(10),
    ShiftType VARCHAR(30)
);

CREATE TABLE tblStaff (
    StaffID VARCHAR(50) NOT NULL PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(100),
    JobTitle VARCHAR(50),
    Designation VARCHAR(20),
    WardID VARCHAR(50),
    Category VARCHAR(50),
    Gender VARCHAR(10),
    IsSenior BIT DEFAULT 0,
    Phone VARCHAR(30),
    LicenseNumber VARCHAR(50),
    MaxMorning INTEGER DEFAULT 15,
    MaxEvening INTEGER DEFAULT 10,
    MaxNight INTEGER DEFAULT 8,
    MaxOff INTEGER DEFAULT 10,
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (WardID) REFERENCES tblWards(WardID)
);

CREATE TABLE tblRosterAssignments (
    AssignmentID AUTOINCREMENT PRIMARY KEY,
    StaffID VARCHAR(50) NOT NULL,
    WardID VARCHAR(50),
    AssignmentDate DATETIME NOT NULL,
    ShiftCode VARCHAR(10) NOT NULL,
    RosterYear INTEGER,
    RosterMonth VARCHAR(20),
    IsLocked BIT DEFAULT 0,
    Notes VARCHAR(255),
    FOREIGN KEY (StaffID) REFERENCES tblStaff(StaffID),
    FOREIGN KEY (ShiftCode) REFERENCES tblShifts(ShiftCode)
);

CREATE TABLE tblDutyExchanges (
    ExchangeID AUTOINCREMENT PRIMARY KEY,
    RequesterStaffID VARCHAR(50) NOT NULL,
    TargetStaffID VARCHAR(50) NOT NULL,
    RequesterDate DATETIME NOT NULL,
    TargetDate DATETIME NOT NULL,
    Status VARCHAR(30) DEFAULT 'Pending',
    RequestedAt DATETIME
);
`;
  };

  // 4. Generate CSV files
  const generateStaffCSV = (): string => {
    const headers = ['StaffID', 'FullName', 'Email', 'JobTitle', 'Designation', 'WardID', 'Category', 'Gender', 'IsSenior', 'Phone', 'LicenseNumber', 'MaxMorning', 'MaxEvening', 'MaxNight', 'MaxOff'];
    const rows = staff.map(s => [
      s.id,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${(s.email || '').replace(/"/g, '""')}"`,
      `"${(s.jobTitle || 'Staff Nurse').replace(/"/g, '""')}"`,
      s.isSenior ? 'SRN' : 'RN',
      s.wardId || '',
      `"${(s.category || '').replace(/"/g, '""')}"`,
      s.isMale ? 'M' : 'F',
      s.isSenior ? 'TRUE' : 'FALSE',
      `"${(s.phone || '').replace(/"/g, '""')}"`,
      `"${(s.licenseNumber || '').replace(/"/g, '""')}"`,
      s.maxMorning || 15,
      s.maxEvening || 10,
      s.maxNight || 8,
      s.maxOff ?? 10
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  };

  const generateWardsCSV = (): string => {
    const headers = ['WardID', 'WardCode', 'WardName', 'Category', 'SupervisorName', 'SupervisorEmail', 'TotalBeds'];
    const rows = wards.map(w => [
      w.id,
      `"${w.code}"`,
      `"${w.name.replace(/"/g, '""')}"`,
      `"${w.category || ''}"`,
      `"${(w.supervisorName || '').replace(/"/g, '""')}"`,
      `"${(w.supervisorEmail || '').replace(/"/g, '""')}"`,
      25
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  };

  const generateAssignmentsCSV = (): string => {
    const headers = ['StaffID', 'WardID', 'AssignmentDate', 'ShiftCode', 'RosterYear', 'RosterMonth'];
    const rows = assignments
      .filter(a => a.shift && a.shift !== ShiftType.None)
      .map(a => [
        a.staffId,
        a.wardId || config.wardId,
        a.date,
        a.shift,
        config.year,
        config.month
      ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600/90 text-white rounded-2xl shadow-inner border border-rose-400/30">
              <Database size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white">Microsoft Access (.accdb) Exporter</h2>
                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black uppercase tracking-wider rounded-md">
                  ACCDB Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Export complete relational database, 1-click builder script, schema, and VBA shift validation rules
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-3">
          <button
            onClick={() => setActiveTab('builder')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === 'builder'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles size={15} />
            1-Click ACCDB Builder
          </button>
          <button
            onClick={() => setActiveTab('vba')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === 'vba'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode size={15} />
            VBA Rules Module
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === 'tables'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet size={15} />
            Relational CSVs & SQL
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition cursor-pointer ${
              activeTab === 'guide'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle size={15} />
            Access Setup Guide
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: 1-Click Builder */}
          {activeTab === 'builder' && (
            <div className="space-y-6">
              <div className="p-5 bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200/80 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-rose-950 text-base">Automatic .accdb Generator Script</span>
                    <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold">Recommended</span>
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed max-w-xl">
                    Since Microsoft Access files are binary containers requiring the Windows Access Database Engine, this script runs in 2 seconds on your computer and creates <strong className="font-semibold">HospitalRoster.accdb</strong> with all tables, relations, queries, and your current roster data loaded.
                  </p>
                </div>
                <button
                  onClick={() => triggerDownload('Build_HospitalRoster_ACCDB.vbs', generateVBScript(), 'text/vbscript')}
                  className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-2 shrink-0 transition cursor-pointer"
                >
                  <Download size={16} />
                  Download Builder (.vbs)
                </button>
              </div>

              {/* Data Summary Grid */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Live Data Bundled into the Script</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-2xl font-black text-slate-800">{staff.length}</div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Staff Members</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-2xl font-black text-slate-800">{wards.length}</div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Hospital Wards</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-2xl font-black text-slate-800">{divisions.length}</div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Divisions</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-2xl font-black text-slate-800">
                      {assignments.filter(a => a.shift && a.shift !== ShiftType.None).length}
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Roster Shifts</div>
                  </div>
                </div>
              </div>

              {/* Pre-built Access Objects Included */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-xs font-black text-slate-800 uppercase tracking-wider">Access Database Objects Created Automatically</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <div className="font-bold text-indigo-700 flex items-center gap-1.5">
                      <Layers size={14} /> Relational Tables (6)
                    </div>
                    <div className="text-[11px] text-slate-600">
                      <code className="text-slate-800 font-mono">tblStaff</code>, <code className="text-slate-800 font-mono">tblWards</code>, <code className="text-slate-800 font-mono">tblDivisions</code>, <code className="text-slate-800 font-mono">tblShifts</code>, <code className="text-slate-800 font-mono">tblRosterAssignments</code>, <code className="text-slate-800 font-mono">tblDutyExchanges</code>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <div className="font-bold text-indigo-700 flex items-center gap-1.5">
                      <FileText size={14} /> Pre-Built Queries (4)
                    </div>
                    <div className="text-[11px] text-slate-600">
                      <code className="text-slate-800 font-mono">qryMonthlyCrosstabGrid</code> (31-day Matrix), <code className="text-slate-800 font-mono">qryDailyDutyRoster</code>, <code className="text-slate-800 font-mono">qryActiveStaffByWard</code>, <code className="text-slate-800 font-mono">qryShiftCoverageSummary</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Step Execution Instruction */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-900 text-white space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-rose-400">How to execute on Windows:</div>
                <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>Click <strong>Download Builder (.vbs)</strong> above to save <code className="text-amber-300 font-mono">Build_HospitalRoster_ACCDB.vbs</code> on your PC.</li>
                  <li><strong>Double-click</strong> the file. Access will open in the background and create <code className="text-emerald-300 font-mono">HospitalRoster.accdb</code> in the same folder.</li>
                  <li>Double-click the new <code className="text-emerald-300 font-mono">HospitalRoster.accdb</code> to open your complete database in Microsoft Access!</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: VBA Rules Module */}
          {activeTab === 'vba' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Hospital Sequence Rules VBA Module</h3>
                  <p className="text-xs text-slate-500">
                    Enforces max consecutive nights, mandatory off after night, and rest period validation in Access forms.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(generateVBAModule(), 'vba')}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedKey === 'vba' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {copiedKey === 'vba' ? 'Copied' : 'Copy VBA'}
                  </button>
                  <button
                    onClick={() => triggerDownload('modRosterValidation.bas', generateVBAModule(), 'text/plain')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download size={14} />
                    Download .bas
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 text-slate-200 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-[350px] leading-relaxed border border-slate-800">
                  {generateVBAModule()}
                </pre>
              </div>

              <div className="text-xs text-slate-500 bg-blue-50/60 p-3 rounded-xl border border-blue-200/60">
                <strong>How to import into MS Access:</strong> Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Alt + F11</kbd> in Access to open the Visual Basic Editor. Click <strong>File &gt; Import File...</strong> and select <code className="font-mono text-slate-800">modRosterValidation.bas</code>.
              </div>
            </div>
          )}

          {/* TAB 3: Tables, CSVs & SQL */}
          {activeTab === 'tables' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Individual Relational CSV Tables</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs text-slate-900">tblStaff.csv</div>
                      <div className="text-[11px] text-slate-500 mt-1">{staff.length} staff records with job titles, contacts & limits</div>
                    </div>
                    <button
                      onClick={() => triggerDownload('tblStaff.csv', generateStaffCSV(), 'text/csv')}
                      className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Download size={14} /> Download Staff CSV
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs text-slate-900">tblWards.csv</div>
                      <div className="text-[11px] text-slate-500 mt-1">{wards.length} hospital wards and units</div>
                    </div>
                    <button
                      onClick={() => triggerDownload('tblWards.csv', generateWardsCSV(), 'text/csv')}
                      className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Download size={14} /> Download Wards CSV
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs text-slate-900">tblRosterAssignments.csv</div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {assignments.filter(a => a.shift && a.shift !== ShiftType.None).length} shift assignments
                      </div>
                    </div>
                    <button
                      onClick={() => triggerDownload('tblRosterAssignments.csv', generateAssignmentsCSV(), 'text/csv')}
                      className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Download size={14} /> Download Assignments CSV
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Database DDL Schema (SQL)</h3>
                  <button
                    onClick={() => triggerDownload('HospitalRoster_Schema.sql', generateSQLSchema(), 'text/plain')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Download size={13} /> Download Schema.sql
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 text-slate-200 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-[220px] leading-relaxed border border-slate-800">
                  {generateSQLSchema()}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: Setup Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-5 text-slate-700 text-xs leading-relaxed">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900">
                <span className="font-black block mb-1">Architecture Recommendation: Split Database Setup</span>
                For production hospital ward use with multiple ward supervisors, always split your Access database into:
                <ul className="list-disc list-inside mt-2 space-y-1 font-medium">
                  <li><strong>HospitalRoster_BE.accdb (Back-End)</strong>: Contains only tables. Store on a shared hospital network drive.</li>
                  <li><strong>HospitalRoster_FE.accdb (Front-End)</strong>: Contains forms, reports, queries, and VBA modules. Installed locally on each supervisor's workstation.</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="font-black text-slate-900 text-sm">A. Creating the 31-Day Form</div>
                  <p className="text-slate-600">
                    In Access, create a Form named <code className="font-mono text-slate-800">frmRosterGrid</code>:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600">
                    <li>Create textboxes named <code className="font-mono">txtDay1</code> to <code className="font-mono">txtDay31</code>.</li>
                    <li>In the <code className="font-mono">Form_Current</code> event, load shifts from <code className="font-mono">tblRosterAssignments</code>.</li>
                    <li>Apply <strong>Conditional Formatting</strong> on the textboxes to highlight M (Yellow), E (Blue), N (Dark), and L (Red).</li>
                  </ol>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="font-black text-slate-900 text-sm">B. Designing Printable A4 Reports</div>
                  <p className="text-slate-600">
                    Access has pixel-perfect print reporting:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600">
                    <li>Create a Report named <code className="font-mono">rptMonthlyRoster</code> based on <code className="font-mono">qryMonthlyCrosstabGrid</code>.</li>
                    <li>In <strong>Page Setup</strong>, set Orientation to <strong>Landscape</strong> and Margins to 5mm.</li>
                    <li>Add one-click export to PDF via <code className="font-mono text-[10px]">DoCmd.OutputTo acOutputReport, ..., acFormatPDF</code>.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 font-medium">
            Active Ward: <strong className="text-slate-800">{currentWard?.name || config.wardName || 'All Wards'}</strong> • {staff.length} Staff Personnel
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => triggerDownload('Build_HospitalRoster_ACCDB.vbs', generateVBScript(), 'text/vbscript')}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm transition cursor-pointer active:scale-95"
            >
              <Download size={14} />
              Download .vbs Script
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

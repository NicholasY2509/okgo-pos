"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { getExportTemplateDataAction, processScheduleImportAction, type ScheduleImportPayload } from "../actions/attendance-schedule-import-action";
import { Input } from "@/components/ui/input";
import { MonthPicker } from "@/components/ui/month-picker";
import { FilePicker } from "@/components/file-picker";
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";

export function AttendanceScheduleImportDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Upload State
  const [fileUrl, setFileUrl] = useState<string>("");
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<"TYPE1" | "TYPE2" | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("");

  // Confirmation State
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [pendingRecords, setPendingRecords] = useState<ScheduleImportPayload[]>([]);

  const resetState = () => {
    setFileUrl("");
    setRawFile(null);
    setUploadType(null);
    setSelectedMonth("");
    setShowConfirm(false);
    setPendingRecords([]);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) resetState();
  };

  const fetchExportData = async () => {
    setLoading(true);
    const res = await getExportTemplateDataAction();
    setLoading(false);
    if (res.error || !res.data) {
      toast.error(res.error || "Failed to fetch data for export");
      return null;
    }
    return res.data;
  };

  const downloadType1Template = async () => {
    const data = await fetchExportData();
    if (!data) return;

    const { activeStaff, workingHours } = data;

    // Add instruction sheet
    const codes = workingHours.map(w => `${w.code} - ${w.name}`).join("\n");
    const wsInstructions = XLSX.utils.aoa_to_sheet([
      ["Instructions"],
      ["1. Fill the 'Shift Code' column with the code of the shift for the full month."],
      ["2. Available Shift Codes:"],
      ...workingHours.map(w => [w.code, w.name, `${w.clockIn} - ${w.clockOut}`])
    ]);

    const wsData = XLSX.utils.json_to_sheet(activeStaff.map(s => ({
      "Staff ID": s.id,
      "Staff Number": s.staffIdNumber || "-",
      "Name": `${s.firstName} ${s.lastName}`,
      "Shift Code": ""
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");
    XLSX.utils.book_append_sheet(wb, wsData, "Type1_Template");
    XLSX.writeFile(wb, "Monthly_Schedule_Template.xlsx");
  };

  const downloadType2Template = async () => {
    const data = await fetchExportData();
    if (!data) return;

    const { activeStaff, workingHours } = data;

    // Default to next month
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const startDate = startOfMonth(nextMonth);
    const endDate = endOfMonth(nextMonth);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const headerRow = ["Staff ID", "Staff Number", "Name", ...days.map(d => format(d, "d"))];

    const rows = activeStaff.map(s => {
      const row: string[] = [s.id, s.staffIdNumber || "-", `${s.firstName} ${s.lastName}`];
      days.forEach(() => row.push(""));
      return row;
    });

    const wsInstructions = XLSX.utils.aoa_to_sheet([
      ["Instructions"],
      ["1. Fill the dates columns with Shift Codes."],
      ["2. Available Shift Codes:"],
      ...workingHours.map(w => [w.code, w.name, `${w.clockIn} - ${w.clockOut}`])
    ]);

    const wsData = XLSX.utils.aoa_to_sheet([headerRow, ...rows]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");
    XLSX.utils.book_append_sheet(wb, wsData, "Type2_Template");
    XLSX.writeFile(wb, `Date_Range_Template_${format(startDate, "yyyy-MM")}.xlsx`);
  };

  const processUpload = async (confirmReplace = false) => {
    if (!fileUrl || !rawFile) return;

    if ((uploadType === "TYPE1" || uploadType === "TYPE2") && !selectedMonth) {
      toast.error("Please select a month for the schedule import.");
      return;
    }

    setLoading(true);

    try {
      let recordsToProcess = pendingRecords;

      // Parse file if not already parsed
      if (!confirmReplace) {
        const buffer = await rawFile.arrayBuffer();
        const wb = XLSX.read(buffer);

        let targetSheetName = "";
        if (uploadType === "TYPE1") {
          targetSheetName = wb.SheetNames.find(s => s.toLowerCase().includes("type1")) || wb.SheetNames[wb.SheetNames.length - 1];
        } else {
          targetSheetName = wb.SheetNames.find(s => s.toLowerCase().includes("type2")) || wb.SheetNames[wb.SheetNames.length - 1];
        }

        const ws = wb.Sheets[targetSheetName];
        if (!ws) throw new Error("Could not find the data sheet in Excel file.");

        const json = XLSX.utils.sheet_to_json<any>(ws, { header: 1 });
        if (json.length < 2) throw new Error("Empty template.");

        const headers = json[0] as string[];
        const dataRows = json.slice(1);

        const staffIdIndex = headers.findIndex(h => h === "Staff ID");
        if (staffIdIndex === -1) throw new Error("Missing 'Staff ID' column.");

        recordsToProcess = [];

        if (uploadType === "TYPE1") {
          const shiftCodeIndex = headers.findIndex(h => h === "Shift Code");
          if (shiftCodeIndex === -1) throw new Error("Missing 'Shift Code' column.");

          const [yearStr, monthStr] = selectedMonth.split("-");
          const year = parseInt(yearStr);
          const month = parseInt(monthStr) - 1;
          const startDate = new Date(year, month, 1);
          const endDate = endOfMonth(startDate);
          const days = eachDayOfInterval({ start: startDate, end: endDate });

          for (const row of dataRows) {
            if (!row[staffIdIndex] || !row[shiftCodeIndex]) continue;
            const staffId = String(row[staffIdIndex]);
            const shiftCode = String(row[shiftCodeIndex]);

            for (const day of days) {
              recordsToProcess.push({
                staffId,
                date: format(day, "yyyy-MM-dd"),
                shiftCode
              });
            }
          }
        } else {
          // TYPE 2
          const dateHeaders = headers.slice(3); // Dates start from index 3

          const [yearStr, monthStr] = selectedMonth.split("-");
          const year = parseInt(yearStr);
          const month = parseInt(monthStr) - 1;

          for (const row of dataRows) {
            if (!row[staffIdIndex]) continue;
            const staffId = String(row[staffIdIndex]);

            for (let i = 0; i < dateHeaders.length; i++) {
              const dayStr = String(dateHeaders[i]);
              const day = parseInt(dayStr);

              if (!isNaN(day) && day >= 1 && day <= 31) {
                const shiftCode = row[i + 3];
                if (shiftCode) {
                  const dateObj = new Date(year, month, day);
                  if (dateObj.getMonth() === month) {
                    recordsToProcess.push({
                      staffId,
                      date: format(dateObj, "yyyy-MM-dd"),
                      shiftCode: String(shiftCode)
                    });
                  }
                }
              }
            }
          }
        }
      }

      if (recordsToProcess.length === 0) {
        toast.error("No valid records found to process.");
        setLoading(false);
        return;
      }

      const res = await processScheduleImportAction(recordsToProcess, confirmReplace);

      if (res.requiresConfirmation) {
        setPendingRecords(recordsToProcess);
        setConfirmMessage(res.message!);
        setShowConfirm(true);
      } else if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Successfully imported ${res.count} schedule records!`);
        setOpen(false);
      }

    } catch (e: any) {
      toast.error(e.message || "Failed to process excel file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Import / Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        {!showConfirm ? (
          <>
            <DialogHeader>
              <DialogTitle>Import / Export Schedules</DialogTitle>
              <DialogDescription>
                Download a template, fill it out, and upload it back.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2 border rounded-md p-4 bg-muted/30">
                <h4 className="text-sm font-medium">1. Export Template</h4>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={downloadType1Template} disabled={loading}>
                    <Download className="mr-2 h-4 w-4" />
                    Monthly Template
                  </Button>
                  <Button size="sm" variant="secondary" onClick={downloadType2Template} disabled={loading}>
                    <Download className="mr-2 h-4 w-4" />
                    Date Range Template
                  </Button>
                </div>
              </div>

              <div className="space-y-4 border rounded-md p-4">
                <h4 className="text-sm font-medium">2. Upload Filled Template</h4>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Import Type</label>
                  <Select
                    value={uploadType || ""}
                    onValueChange={(val) => setUploadType(val as "TYPE1" | "TYPE2")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TYPE1">Upload Monthly</SelectItem>
                      <SelectItem value="TYPE2">Upload Date Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {uploadType && (
                  <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-top-2">
                    {(uploadType === "TYPE1" || uploadType === "TYPE2") && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Month</label>
                        <MonthPicker
                          value={selectedMonth}
                          onChange={setSelectedMonth}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Excel File</label>
                      <FilePicker
                        value={fileUrl}
                        onChange={(url, file) => {
                          setFileUrl(url);
                          if (file) setRawFile(file);
                        }}
                        accept=".xlsx, .xls"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                onClick={() => processUpload(false)}
                disabled={!fileUrl || !rawFile || !uploadType || loading}
              >
                {loading ? "Processing..." : "Import Schedules"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Confirm Overwrite
              </DialogTitle>
              <DialogDescription>
                {confirmMessage}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => processUpload(true)} disabled={loading}>
                {loading ? "Replacing..." : "Yes, Replace"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

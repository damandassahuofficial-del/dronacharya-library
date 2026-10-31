"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwRytE8gk3RWkY653YxcZ-pqKm7zLLosLdW4oyxNBbBzlPmHQhccyiAvWwbSnv8JLB-/exec";

const LIBRARY_SECTIONS = [
  { name: "युधिष्ठिर", count: 18 },
  { name: "भीम", count: 15 },
  { name: "अर्जुन", count: 15 },
  { name: "विकर्ण", count: 12 },
  { name: "एकलव्य", count: 22 },
];
const TOTAL_SEATS = LIBRARY_SECTIONS.reduce((a, b) => a + b.count, 0);

const PLAN_FEE_RATES: Record<string, number> = {
  "6hrs/Month": 800,
  "1 Month": 1200,
  "3 Month": 3300,
  "6 Month": 6000,
  "9 Month": 8400,
};

interface Student {
  rowIndex?: number;
  studentId: string;
  name: string;
  fatherName: string;
  gender: string;
  dob?: string;
  phone: string;
  altPhone: string;
  address: string;
  pincode?: string;
  idProof: string;
  selectedRow?: string;
  selectedSeatNum?: string;
  seatNo: string;
  admDate: string;
  renDate: string;
  plan: string;
  batch?: string;
  course?: string;
  monthlyFee: number | string;
  status: "Active" | "Inactive";
  remarks: string;
  studentType: "Reserved" | "Unreserved";
}

interface RenewalLog {
  txId: string;
  studentId: string;
  name: string;
  plan: string;
  amount: number;
  mode: string;
  payDate: string;
  oldRenDate: string;
  newRenDate: string;
  remarks: string;
}

interface PendingApplicant {
  pendingRowIndex: number;
  date: string;
  name: string;
  fatherName: string;
  gender: string;
  dob: string;
  phone: string;
  altPhone: string;
  course: string;
  exam: string;
  address: string;
  pincode: string;
  idProof: string;
  status: string;
}

export default function Dashboard() {
  const [activeMenu, setActiveMenu] = useState<"Dashboard" | "Students" | "Seats" | "Pending">("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [renewalHistory, setRenewalHistory] = useState<RenewalLog[]>([]);
  const [pendingApplicants, setPendingApplicants] = useState<PendingApplicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [membershipFilter, setMembershipFilter] = useState("All Membership");

  const [showAddModal, setShowAddModal] = useState(false);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);
  const [viewHistoryStudent, setViewHistoryStudent] = useState<Student | null>(null);
  const [studentToRenew, setStudentToRenew] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<{ student: Student; sNo: number } | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [approvingApplicant, setApprovingApplicant] = useState<PendingApplicant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Approval Modal Form Data
  const [approvalFormData, setApprovalFormData] = useState({
    plan: "1 Month",
    monthlyFee: 1200,
    payMode: "Cash",
    selectedRow: "युधिष्ठिर",
    selectedSeatNum: "",
    seatNo: "युधिष्ठिर-1",
    studentType: "Reserved",
    admDate: new Date().toISOString().slice(0, 10),
    renDate: "",
    batch: "FULL DAY",
    remarks: "QR Admission Approved",
  });

  const [renewFormData, setRenewFormData] = useState<{
    plan: string;
    startDate: string;
    newRenDate: string;
    feePaid: number | string;
    payMode: string;
    remarks: string;
  }>({
    plan: "1 Month",
    startDate: "",
    newRenDate: "",
    feePaid: 1200,
    payMode: "Cash",
    remarks: "Monthly Renewal",
  });

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number>(0);
  const [visibleRange, setVisibleRange] = useState<string>("0");

  const initialForm: Student = {
    studentId: "",
    name: "",
    fatherName: "",
    gender: "Male",
    dob: "",
    phone: "",
    altPhone: "",
    address: "",
    pincode: "",
    idProof: "",
    selectedRow: "None",
    selectedSeatNum: "",
    seatNo: "-",
    admDate: "",
    renDate: "",
    plan: "1 Month",
    batch: "",
    course: "",
    monthlyFee: 1200,
    status: "Active",
    remarks: "-",
    studentType: "Reserved",
  };
  const [formData, setFormData] = useState<Student>(initialForm);

  const formatDateToDDMMYYYY = (dateStr: string): string => {
    if (!dateStr || dateStr === "-" || String(dateStr).trim() === "") return "-";
    const s = String(dateStr).trim();

    if (s.includes("/")) {
      const parts = s.split("/");
      if (parts.length === 3) {
        return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[2].slice(0, 4)}`;
      }
    }

    if (s.includes("-")) {
      const parts = s.split("T")[0].split("-");
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return `${parts[2].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[0]}`;
        } else {
          return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[2]}`;
        }
      }
    }
    return s;
  };

  const formatToInputDate = (dateStr: string): string => {
    if (!dateStr || dateStr === "-") return "";
    const s = String(dateStr).trim();
    if (s.includes("/")) {
      const parts = s.split("/");
      if (parts.length === 3) {
        return `${parts[2].slice(0, 4)}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    }
    if (s.includes("-")) {
      const parts = s.split("T")[0].split("-");
      if (parts.length === 3) {
        if (parts[0].length === 4) return s.split("T")[0];
        return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    }
    return "";
  };

  const calculateRenewalDateFromBase = (baseDateStr: string, planStr: string): string => {
    if (!baseDateStr || baseDateStr === "-") return "";
    const s = String(baseDateStr).trim();

    let y = 0, m = 0, d = 0;
    if (s.includes("-")) {
      const parts = s.split("T")[0].split("-");
      if (parts[0].length === 4) {
        y = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
        d = parseInt(parts[2], 10);
      } else {
        d = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10);
        y = parseInt(parts[2], 10);
      }
    } else if (s.includes("/")) {
      const parts = s.split("/");
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      y = parseInt(parts[2].slice(0, 4), 10);
    }

    if (!y || !m || !d || isNaN(y) || isNaN(m) || isNaN(d)) {
      const now = new Date();
      y = now.getFullYear();
      m = now.getMonth() + 1;
      d = now.getDate();
    }

    let monthsToAdd = 1;
    if (planStr.includes("3 Month")) monthsToAdd = 3;
    else if (planStr.includes("6 Month") && !planStr.includes("6hrs")) monthsToAdd = 6;
    else if (planStr.includes("9 Month")) monthsToAdd = 9;
    else if (planStr.includes("6hrs/Month")) monthsToAdd = 1;

    let targetYear = y;
    let targetMonth = m + monthsToAdd;

    while (targetMonth > 12) {
      targetMonth -= 12;
      targetYear += 1;
    }

    const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
    const finalDay = Math.min(d, daysInTargetMonth);

    return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(finalDay).padStart(2, "0")}`;
  };

  const parseDateToTimestamp = (dateStr: string): number => {
    if (!dateStr || dateStr === "-" || String(dateStr).trim() === "") return 9999999999999;
    const s = String(dateStr).trim();

    if (s.includes("/")) {
      const parts = s.split("/");
      if (parts.length === 3) {
        return new Date(parseInt(parts[2].slice(0, 4), 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)).getTime();
      }
    }

    if (s.includes("-")) {
      const parts = s.split("T")[0].split("-");
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)).getTime();
        } else {
          return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)).getTime();
        }
      }
    }
    const t = new Date(s).getTime();
    return isNaN(t) ? 9999999999999 : t;
  };

  const getRenewalAlertStatus = (
    renDateStr: string,
    status: string
  ): "EXPIRED" | "TODAY" | "WARNING_3DAYS" | "SAFE" => {
    if (status !== "Active" || !renDateStr || renDateStr === "-") return "SAFE";
    const renTs = parseDateToTimestamp(renDateStr);
    if (renTs === 9999999999999) return "SAFE";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTs = today.getTime();

    const renDateObj = new Date(renTs);
    renDateObj.setHours(0, 0, 0, 0);
    const normalizedRenTs = renDateObj.getTime();

    const diffDays = Math.ceil((normalizedRenTs - todayTs) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "EXPIRED";
    if (diffDays === 0) return "TODAY";
    if (diffDays <= 3) return "WARNING_3DAYS";
    return "SAFE";
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${GOOGLE_SCRIPT_URL}?t=${Date.now()}`);
      const data = await res.json();
      
      // Dono formats handle karega (direct array ya payload object)
      if (Array.isArray(data)) {
        setStudents(data);
      } else if (data && typeof data === "object") {
        if (Array.isArray(data.students)) setStudents(data.students);
        if (Array.isArray(data.history)) setRenewalHistory(data.history);
        if (Array.isArray(data.pending)) setPendingApplicants(data.pending);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const initialRen = calculateRenewalDateFromBase(today, "1 Month");
    setFormData((prev) => ({ ...prev, admDate: today, renDate: initialRen }));
    setApprovalFormData((prev) => ({ ...prev, admDate: today, renDate: initialRen }));
    fetchStudents();
  }, []);

  const getAvailableSeatsForRow = (rowName: string, currentEditingSeatNo?: string) => {
    if (rowName === "None" || !rowName) return [];
    const targetSection = LIBRARY_SECTIONS.find((s) => s.name === rowName);
    if (!targetSection) return [];

    const occupiedSeatNumbers = new Set(
      students
        .filter((s) => s.status === "Active")
        .filter((s) => !currentEditingSeatNo || s.seatNo !== currentEditingSeatNo)
        .map((s) => s.seatNo)
    );

    const available: number[] = [];
    for (let i = 1; i <= targetSection.count; i++) {
      const fullSeatName = `${rowName}-${i}`;
      if (!occupiedSeatNumbers.has(fullSeatName) && !occupiedSeatNumbers.has(String(i))) {
        available.push(i);
      }
    }
    return available;
  };

  const handleRowChange = (rowName: string) => {
    if (rowName === "None") {
      setFormData((prev) => ({ ...prev, selectedRow: "None", selectedSeatNum: "", seatNo: "-" }));
      return;
    }
    const freeSeats = getAvailableSeatsForRow(rowName, editStudent?.seatNo);
    const firstFree = freeSeats.length > 0 ? String(freeSeats[0]) : "";
    setFormData((prev) => ({
      ...prev,
      selectedRow: rowName,
      selectedSeatNum: firstFree,
      seatNo: firstFree ? `${rowName}-${firstFree}` : "-",
    }));
  };

  const handleSeatNumChange = (seatNum: string) => {
    if (!seatNum || seatNum === "none") {
      setFormData((prev) => ({ ...prev, selectedSeatNum: "", seatNo: "-" }));
      return;
    }
    const row = formData.selectedRow || "युधिष्ठिर";
    setFormData((prev) => ({ ...prev, selectedSeatNum: seatNum, seatNo: `${row}-${seatNum}` }));
  };

  const getCompiledHistoryForStudent = (st: Student): RenewalLog[] => {
    const rawLogs = renewalHistory.filter(
      (h) =>
        (h.studentId && h.studentId === st.studentId) ||
        (h.name && h.name.toUpperCase() === st.name.toUpperCase())
    );

    const hasAdmissionLogged = rawLogs.some(
      (h) =>
        h.remarks?.toLowerCase().includes("admission") ||
        h.txId?.startsWith("INIT-") ||
        h.txId?.startsWith("TX-ADM-")
    );

    const combined: RenewalLog[] = [...rawLogs];
    if (!hasAdmissionLogged) {
      const originalFirstRenDate = calculateRenewalDateFromBase(st.admDate, st.plan || "1 Month");
      combined.push({
        txId: `INIT-${st.studentId}`,
        studentId: st.studentId,
        name: st.name,
        plan: st.plan || "1 Month",
        amount: Number(st.monthlyFee) || 0,
        mode: "Cash",
        payDate: formatDateToDDMMYYYY(st.admDate),
        oldRenDate: formatDateToDDMMYYYY(st.admDate),
        newRenDate: formatDateToDDMMYYYY(originalFirstRenDate),
        remarks: "First Admission",
      });
    }

    return combined.sort((a, b) => {
      const tsA = parseDateToTimestamp(a.newRenDate);
      const tsB = parseDateToTimestamp(b.newRenDate);
      return tsB - tsA;
    });
  };

  const getLatestActivePeriodForStudent = (st: Student) => {
    const compiled = getCompiledHistoryForStudent(st);
    if (compiled.length > 0) {
      const latest = compiled[0];
      return {
        startDate: latest.oldRenDate,
        endDate: latest.newRenDate,
        plan: latest.plan || st.plan,
      };
    }
    return {
      startDate: formatDateToDDMMYYYY(st.admDate),
      endDate: formatDateToDDMMYYYY(st.renDate),
      plan: st.plan || "1 Month",
    };
  };

  const hasStudentRenewed = (st: Student): boolean => {
    const logs = getCompiledHistoryForStudent(st);
    return logs.some(
      (log) =>
        !log.remarks?.toLowerCase().includes("admission") &&
        !log.txId?.startsWith("INIT-") &&
        !log.txId?.startsWith("TX-ADM-")
    );
  };

  const openRenewModal = (student: Student) => {
    const latestPeriod = getLatestActivePeriodForStudent(student);
    const currentPlan = latestPeriod.plan || student.plan || "1 Month";
    const autoFee = PLAN_FEE_RATES[currentPlan] ?? 1200;

    const startDateVal = formatToInputDate(latestPeriod.endDate) || new Date().toISOString().slice(0, 10);
    const calcDate = calculateRenewalDateFromBase(startDateVal, currentPlan);

    setRenewFormData({
      plan: currentPlan,
      startDate: startDateVal,
      newRenDate: calcDate,
      feePaid: autoFee,
      payMode: "Cash",
      remarks: "Monthly Renewal",
    });
    setStudentToRenew(student);
  };

  const handleConfirmRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentToRenew) return;

    try {
      setIsSubmitting(true);
      const payload: Record<string, any> = {
        action: "renew",
        rowIndex: studentToRenew.rowIndex,
        studentId: studentToRenew.studentId,
        name: studentToRenew.name,
        plan: renewFormData.plan,
        startDate: renewFormData.startDate,
        newRenDate: renewFormData.newRenDate,
        feePaid: renewFormData.feePaid === "" ? 0 : Number(renewFormData.feePaid),
        payMode: renewFormData.payMode,
        oldRenDate: studentToRenew.renDate,
        remarks: renewFormData.remarks,
      };

      const formBody = new URLSearchParams();
      for (const key in payload) {
        formBody.append(key, String(payload[key] ?? ""));
      }

      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody.toString(),
      });

      setStudents((prev) =>
        prev.map((s) =>
          s.rowIndex === studentToRenew.rowIndex
            ? {
                ...s,
                status: "Active",
                plan: renewFormData.plan,
                renDate: renewFormData.newRenDate,
              }
            : s
        )
      );

      setRenewalHistory((prev) => [
        {
          txId: "TX-" + Date.now(),
          studentId: studentToRenew.studentId,
          name: studentToRenew.name,
          plan: renewFormData.plan,
          amount: Number(renewFormData.feePaid) || 0,
          mode: renewFormData.payMode,
          payDate: formatDateToDDMMYYYY(new Date().toISOString().slice(0, 10)),
          oldRenDate: formatDateToDDMMYYYY(renewFormData.startDate),
          newRenDate: formatDateToDDMMYYYY(renewFormData.newRenDate),
          remarks: renewFormData.remarks,
        },
        ...prev,
      ]);

      setStudentToRenew(null);
      setTimeout(() => fetchStudents(), 1800);
    } catch (err) {
      alert("Renewal save failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Approval Form for Pending Student
  const openApprovalModal = (applicant: PendingApplicant) => {
    const today = new Date().toISOString().slice(0, 10);
    const initialRen = calculateRenewalDateFromBase(today, "1 Month");
    const freeSeats = getAvailableSeatsForRow("युधिष्ठिर");
    const firstFree = freeSeats.length > 0 ? String(freeSeats[0]) : "1";

    setApprovalFormData({
      plan: "1 Month",
      monthlyFee: 1200,
      payMode: "Cash",
      selectedRow: "युधिष्ठिर",
      selectedSeatNum: firstFree,
      seatNo: `युधिष्ठिर-${firstFree}`,
      studentType: "Reserved",
      admDate: today,
      renDate: initialRen,
      batch: "FULL DAY",
      remarks: "Online QR Admission Approved",
    });
    setApprovingApplicant(applicant);
  };

  // Submit Approval and Generate Official Receipt
  const handleConfirmApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingApplicant) return;

    try {
      setIsSubmitting(true);
      const generatedId = `DL-${students.length < 9 ? "0" + (students.length + 1) : students.length + 1}`;

      const payload: Record<string, any> = {
        action: "approve_pending",
        pendingRowIndex: approvingApplicant.pendingRowIndex,
        studentId: generatedId,
        name: approvingApplicant.name,
        fatherName: approvingApplicant.fatherName,
        gender: approvingApplicant.gender || "Male",
        dob: approvingApplicant.dob,
        phone: approvingApplicant.phone,
        altPhone: approvingApplicant.altPhone,
        address: approvingApplicant.address,
        pincode: approvingApplicant.pincode,
        idProof: approvingApplicant.idProof,
        seatNo: approvalFormData.selectedRow === "None" ? "-" : approvalFormData.seatNo,
        admDate: approvalFormData.admDate,
        renDate: approvalFormData.renDate,
        plan: approvalFormData.plan,
        batch: approvalFormData.batch,
        course: approvingApplicant.course || approvingApplicant.exam || "-",
        monthlyFee: Number(approvalFormData.monthlyFee) || 0,
        payMode: approvalFormData.payMode,
        studentType: approvalFormData.studentType,
        remarks: approvalFormData.remarks,
      };

      const formBody = new URLSearchParams();
      for (const key in payload) {
        formBody.append(key, String(payload[key] ?? ""));
      }

      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody.toString(),
      });

      // Add to local state
      const newRec: Student = {
        studentId: generatedId,
        name: approvingApplicant.name,
        fatherName: approvingApplicant.fatherName,
        gender: approvingApplicant.gender || "Male",
        dob: approvingApplicant.dob,
        phone: approvingApplicant.phone,
        altPhone: approvingApplicant.altPhone,
        address: approvingApplicant.address,
        pincode: approvingApplicant.pincode,
        idProof: approvingApplicant.idProof,
        seatNo: payload.seatNo,
        admDate: approvalFormData.admDate,
        renDate: approvalFormData.renDate,
        plan: approvalFormData.plan,
        batch: approvalFormData.batch,
        course: payload.course,
        monthlyFee: payload.monthlyFee,
        status: "Active",
        remarks: payload.remarks,
        studentType: approvalFormData.studentType as any,
        rowIndex: students.length + 2,
      };

      setStudents((prev) => [...prev, newRec]);
      setPendingApplicants((prev) => prev.filter((p) => p.pendingRowIndex !== approvingApplicant.pendingRowIndex));
      setRenewalHistory((prev) => [
        {
          txId: "TX-ADM-" + generatedId,
          studentId: generatedId,
          name: approvingApplicant.name,
          plan: approvalFormData.plan,
          amount: Number(approvalFormData.monthlyFee) || 0,
          mode: approvalFormData.payMode,
          payDate: formatDateToDDMMYYYY(approvalFormData.admDate),
          oldRenDate: formatDateToDDMMYYYY(approvalFormData.admDate),
          newRenDate: formatDateToDDMMYYYY(approvalFormData.renDate),
          remarks: "First Admission Fee (Approved)",
        },
        ...prev,
      ]);

      setApprovingApplicant(null);
      alert(`Student ${approvingApplicant.name} ko ID ${generatedId} ke sath safaltapoorvak approve kar diya gaya hai!`);
      setTimeout(() => fetchStudents(), 1800);
    } catch (err) {
      alert("Approval save failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert("Name aur Mobile number zaroori hai.");
      return;
    }

    try {
      setIsSubmitting(true);
      const cleanAadhaar = formData.idProof ? formData.idProof.replace(/\D/g, "").slice(-4) : "";
      const fullAadhaar = cleanAadhaar ? `XXXX-XXXX-${cleanAadhaar}` : "-";

      const payload: Record<string, any> = {
        action: editStudent ? "edit" : "add",
        rowIndex: editStudent?.rowIndex || "",
        ...formData,
        name: (formData.name || "").trim().toUpperCase(),
        fatherName: (formData.fatherName || "").trim().toUpperCase(),
        address: (formData.address || "").trim().toUpperCase(),
        batch: (formData.batch || "").trim().toUpperCase(),
        course: (formData.course || "").trim().toUpperCase(),
        idProof: fullAadhaar,
      };

      const formBody = new URLSearchParams();
      for (const key in payload) {
        formBody.append(key, String(payload[key] ?? ""));
      }

      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody.toString(),
      });

      if (editStudent) {
        const targetRowIndex = editStudent.rowIndex;
        setStudents((prev) =>
          prev.map((s) => (s.rowIndex === targetRowIndex ? ({ ...payload, rowIndex: targetRowIndex } as Student) : s))
        );
        setEditStudent(null);
      } else {
        const generatedId = `DL-${students.length < 9 ? "0" + (students.length + 1) : students.length + 1}`;
        const newRecord: Student = { ...(payload as Student), studentId: generatedId, rowIndex: students.length + 2 };
        setStudents((prev) => [...prev, newRecord]);

        setRenewalHistory((prev) => [
          {
            txId: "TX-ADM-" + generatedId,
            studentId: generatedId,
            name: payload.name,
            plan: payload.plan || "1 Month",
            amount: Number(payload.monthlyFee) || 0,
            mode: "Cash",
            payDate: formatDateToDDMMYYYY(new Date().toISOString().slice(0, 10)),
            oldRenDate: formatDateToDDMMYYYY(payload.admDate),
            newRenDate: formatDateToDDMMYYYY(payload.renDate),
            remarks: "New Admission Fee",
          },
          ...prev,
        ]);

        setShowAddModal(false);
      }

      const today = new Date().toISOString().slice(0, 10);
      setFormData({
        ...initialForm,
        admDate: today,
        renDate: calculateRenewalDateFromBase(today, "1 Month"),
        monthlyFee: 1200,
      });
      setTimeout(() => fetchStudents(), 1800);
    } catch (err) {
      alert("Save failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickToggleStatus = async (student: Student) => {
    const newStatus = student.status === "Active" ? "Inactive" : "Active";
    try {
      const payload: Record<string, any> = {
        action: "edit",
        rowIndex: student.rowIndex,
        ...student,
        status: newStatus,
        seatNo: newStatus === "Inactive" ? "-" : student.seatNo,
      };

      const formBody = new URLSearchParams();
      for (const key in payload) {
        formBody.append(key, String(payload[key] ?? ""));
      }

      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody.toString(),
      });

      setStudents((prev) =>
        prev.map((s) => (s.rowIndex === student.rowIndex ? { ...s, status: newStatus, seatNo: payload.seatNo } : s))
      );
      setTimeout(() => fetchStudents(), 1800);
    } catch (err) {
      alert("Status update failed.");
    }
  };

  const executeDelete = async () => {
    if (!studentToDelete) return;
    try {
      const formBody = new URLSearchParams();
      formBody.append("action", "delete");
      formBody.append("rowIndex", String(studentToDelete.student.rowIndex));

      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody.toString(),
      });
      setStudents((prev) => prev.filter((s) => s.rowIndex !== studentToDelete.student.rowIndex));
      setStudentToDelete(null);
      setTimeout(() => fetchStudents(), 1800);
    } catch (err) {
      alert("Delete failed.");
    }
  };

  // Metrics
  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === "Active").length;
  const inactiveStudents = totalStudents - activeStudents;
  const pendingCount = pendingApplicants.length;

  const activeReservedStudents = students.filter(
    (s) => s.status === "Active" && (s.studentType === "Reserved" || !s.studentType)
  ).length;
  const activeUnreservedStudents = students.filter(
    (s) => s.status === "Active" && s.studentType === "Unreserved"
  ).length;

  const activeRenewedStudentsCount = students.filter(
    (s) => s.status === "Active" && hasStudentRenewed(s)
  ).length;

  const occupiedSeats = students.filter((s) => s.seatNo && s.seatNo !== "-" && s.status === "Active").length;
  const emptySeats = Math.max(0, TOTAL_SEATS - occupiedSeats);

  const allInitialAdmissionFees = students.reduce((acc, curr) => acc + (Number(curr.monthlyFee) || 0), 0);
  const allRenewalsFees = renewalHistory
    .filter(
      (h) =>
        !h.remarks?.toLowerCase().includes("admission") &&
        !h.txId?.startsWith("INIT-") &&
        !h.txId?.startsWith("TX-ADM-")
    )
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalCombinedIncome = allInitialAdmissionFees + allRenewalsFees;

  const filteredStudents = students
    .filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (s.name || "").toLowerCase().includes(q) ||
        (s.phone || "").includes(q) ||
        (s.seatNo || "").toLowerCase().includes(q) ||
        (s.fatherName || "").toLowerCase().includes(q) ||
        (s.course || "").toLowerCase().includes(q);

      let matchesStatus = true;
      if (statusFilter === "Active") matchesStatus = s.status === "Active";
      else if (statusFilter === "Inactive") matchesStatus = s.status === "Inactive";
      else if (statusFilter === "Active Reserved")
        matchesStatus = s.status === "Active" && (s.studentType === "Reserved" || !s.studentType);
      else if (statusFilter === "Active Unreserved")
        matchesStatus = s.status === "Active" && s.studentType === "Unreserved";
      else if (statusFilter === "Renewed (Active)")
        matchesStatus = s.status === "Active" && hasStudentRenewed(s);

      const matchesPlan =
        membershipFilter === "All Membership"
          ? true
          : (s.plan || "").toLowerCase().includes(membershipFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesPlan;
    })
    .sort((a, b) => {
      if (a.status === "Active" && b.status !== "Active") return -1;
      if (a.status !== "Active" && b.status === "Active") return 1;

      if (a.status === "Active" && b.status === "Active") {
        return parseDateToTimestamp(a.renDate) - parseDateToTimestamp(b.renDate);
      }
      return parseDateToTimestamp(b.renDate) - parseDateToTimestamp(a.renDate);
    });

  const expiredCount = students.filter(
    (s) => s.status === "Active" && getRenewalAlertStatus(s.renDate, s.status) === "EXPIRED"
  ).length;

  const todayDueCount = students.filter(
    (s) => s.status === "Active" && getRenewalAlertStatus(s.renDate, s.status) === "TODAY"
  ).length;

  const due3DaysCount = students.filter(
    (s) => s.status === "Active" && getRenewalAlertStatus(s.renDate, s.status) === "WARNING_3DAYS"
  ).length;

  const calculateExactVisibleRows = () => {
    if (!tableContainerRef.current) return;
    const container = tableContainerRef.current;
    const rows = container.querySelectorAll("tbody tr");
    if (rows.length === 0) {
      setVisibleCount(0);
      setVisibleRange("0");
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const theadHeight = container.querySelector("thead")?.clientHeight || 40;

    const fullyVisibleIndexes: number[] = [];
    rows.forEach((row, idx) => {
      const rowRect = row.getBoundingClientRect();
      const isVisible =
        rowRect.top >= containerRect.top + theadHeight - 8 &&
        rowRect.bottom <= containerRect.bottom + 5;

      if (isVisible) fullyVisibleIndexes.push(idx + 1);
    });

    if (fullyVisibleIndexes.length > 0) {
      setVisibleCount(fullyVisibleIndexes.length);
      const first = fullyVisibleIndexes[0];
      const last = fullyVisibleIndexes[fullyVisibleIndexes.length - 1];
      setVisibleRange(first === last ? `${first}` : `${first} - ${last}`);
    } else {
      const count = Math.min(rows.length, 3);
      setVisibleCount(count);
      setVisibleRange(`1 - ${count}`);
    }
  };

  useEffect(() => {
    const timer = setTimeout(calculateExactVisibleRows, 150);
    window.addEventListener("resize", calculateExactVisibleRows);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculateExactVisibleRows);
    };
  }, [filteredStudents, activeMenu]);

  const displayTotal = filteredStudents.length;
  const displayActive = filteredStudents.filter((s) => s.status === "Active").length;
  const displayInactive = displayTotal - displayActive;

  const historyStudentLogs = viewHistoryStudent ? getCompiledHistoryForStudent(viewHistoryStudent) : [];
  const totalPaidByHistoryStudent = historyStudentLogs.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="flex h-screen bg-[#f1eee7] text-neutral-800 font-sans antialiased overflow-hidden select-none relative">
      {/* Mobile Backdrop for Sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity"
        />
      )}

      {/* 1. Sidebar */}
      <aside
        className={
          (isSidebarOpen ? "w-64" : "w-0 -translate-x-full") +
          " bg-[#faf8f4] border-r border-[#e3dccb] flex flex-col justify-between flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden z-40 relative md:z-20"
        }
      >
        <div className="w-64">
          <div className="h-16 flex items-center justify-between px-5 border-b border-[#e3dccb]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                📚
              </div>
              <div>
                <h1 className="text-sm font-black text-neutral-900 leading-none">DRONACHARYA</h1>
                <p className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase mt-1">LIBRARY ERP</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-neutral-400 hover:text-neutral-700 text-sm p-1 font-bold"
            >
              ✕
            </button>
          </div>

          <nav className="p-3.5 space-y-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveMenu("Dashboard")}
              className={
                "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition " +
                (activeMenu === "Dashboard"
                  ? "bg-[#e5dcc7] text-amber-950 font-bold shadow-sm"
                  : "text-neutral-600 hover:bg-[#ede5d4]")
              }
            >
              <span>📊</span>
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveMenu("Students")}
              className={
                "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition " +
                (activeMenu === "Students"
                  ? "bg-[#e5dcc7] text-amber-950 font-bold shadow-sm"
                  : "text-neutral-600 hover:bg-[#ede5d4]")
              }
            >
              <div className="flex items-center gap-3">
                <span>👥</span>
                <span>Students</span>
              </div>
              <span className="text-[10px] bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded-full font-bold">
                {totalStudents}
              </span>
            </button>

            <button
              onClick={() => setActiveMenu("Seats")}
              className={
                "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition " +
                (activeMenu === "Seats"
                  ? "bg-[#e5dcc7] text-amber-950 font-bold shadow-sm"
                  : "text-neutral-600 hover:bg-[#ede5d4]")
              }
            >
              <div className="flex items-center gap-3">
                <span>🪑</span>
                <span>Seat Management</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                {emptySeats} Free
              </span>
            </button>

            {/* NEW: Pending Admissions Sidebar Tab */}
            <button
              onClick={() => setActiveMenu("Pending")}
              className={
                "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition " +
                (activeMenu === "Pending"
                  ? "bg-amber-200/90 text-amber-950 font-bold shadow-sm border border-amber-300"
                  : "text-neutral-600 hover:bg-[#ede5d4]")
              }
            >
              <div className="flex items-center gap-3">
                <span>📝</span>
                <span>Pending Approvals</span>
              </div>
              {pendingCount > 0 ? (
                <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-black animate-bounce shadow-sm">
                  {pendingCount} New
                </span>
              ) : (
                <span className="text-[10px] bg-neutral-200 text-neutral-500 px-2 py-0.5 rounded-full font-bold">
                  0
                </span>
              )}
            </button>
          </nav>
        </div>

        <div className="w-64 p-3 border-t border-[#e3dccb] space-y-2">
          {/* Public QR Admission Page Link Button */}
          <Link
            href="/admission"
            target="_blank"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-black text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition border border-blue-200"
          >
            <span>📱</span> Public Admission QR Form ↗
          </Link>

          <Link
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition"
            href="/"
          >
            <span>🚪</span> Logout
          </Link>
        </div>
      </aside>

      {/* Continuous Slider Handle */}
      <div
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        title={isSidebarOpen ? "Click to collapse sidebar" : "Click to expand sidebar"}
        className="hidden md:flex w-2.5 h-full bg-[#f1eee7] hover:bg-amber-300/80 cursor-col-resize transition-colors items-center justify-center flex-shrink-0 z-30 group select-none border-r border-[#e3dccb]"
      >
        <div className="w-0.5 h-16 bg-[#d6ccb8] group-hover:bg-amber-700 rounded-full transition-colors" />
      </div>

      {/* 2. Main Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 bg-[#faf8f4] border-b border-[#e3dccb] flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg border border-[#e3dccb] bg-[#ede5d4] hover:bg-[#e4dbca] text-xs font-bold text-neutral-700 transition"
              title="Toggle Sidebar"
            >
              {isSidebarOpen ? "◀" : "▶"}
            </button>
            <span className="text-base">
              {activeMenu === "Seats" ? "🪑" : activeMenu === "Students" ? "👥" : activeMenu === "Pending" ? "📝" : "📊"}
            </span>
            <h2 className="font-extrabold text-neutral-800 text-sm tracking-tight">
              {activeMenu === "Seats"
                ? "Seat Management Matrix"
                : activeMenu === "Students"
                ? "Students Directory"
                : activeMenu === "Pending"
                ? "Pending Public Applications"
                : "Dashboard Overview"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10);
                setFormData({
                  ...initialForm,
                  admDate: today,
                  renDate: calculateRenewalDateFromBase(today, "1 Month"),
                  selectedRow: "None",
                  selectedSeatNum: "",
                  seatNo: "-",
                  monthlyFee: 1200,
                  status: "Active",
                });
                setEditStudent(null);
                setShowAddModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition shadow flex items-center gap-1.5"
            >
              <span>+</span> Direct Add
            </button>
            <button
              onClick={fetchStudents}
              title="Refresh"
              className="bg-[#ede5d4] hover:bg-[#e4dbca] text-neutral-700 p-2 rounded-lg transition text-xs border border-[#ddd3be]"
            >
              🔄 Refresh
            </button>
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <main className="flex-1 flex flex-col p-4 md:p-5 overflow-hidden">
          {activeMenu === "Dashboard" && (
            <div className="flex-1 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. TOTAL STUDENTS */}
                <div className="rounded-2xl p-5 text-white shadow-sm bg-gradient-to-br from-[#2563eb] via-[#1d4ed8] to-[#1e40af] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold tracking-widest uppercase opacity-90">TOTAL ENROLLED STUDENTS</p>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">ERP Live</span>
                    </div>
                    <p className="text-4xl font-black mt-2 tracking-tight">{totalStudents}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/20 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm animate-pulse"></span>
                        <span>Active Members: <b className="text-sm font-black text-white">{activeStudents}</b></span>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-90">
                        <span className="w-2 h-2 rounded-full bg-rose-300"></span>
                        <span>Inactive: <b>{inactiveStudents}</b></span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] bg-black/15 px-3 py-1.5 rounded-xl">
                      <span className="flex items-center gap-1.5 text-cyan-200 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                        Reserved: <b className="text-white font-bold">{activeReservedStudents}</b>
                      </span>
                      <span className="text-white/40">•</span>
                      <span className="flex items-center gap-1.5 text-blue-100 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                        Unreserved: <b className="text-white font-bold">{activeUnreservedStudents}</b>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. OCCUPANCY */}
                <div className="rounded-2xl p-5 text-white shadow-sm bg-gradient-to-br from-[#ea580c] via-[#c2410c] to-[#9a3412] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold tracking-widest uppercase opacity-90">SEAT OCCUPANCY</p>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">5 Rows</span>
                    </div>
                    <p className="text-4xl font-black mt-2 tracking-tight">
                      {occupiedSeats} <span className="text-lg opacity-80 font-bold">/ {TOTAL_SEATS}</span>
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                      Empty Seats: <b>{emptySeats}</b>
                    </span>
                    <span className="bg-white/20 px-2.5 py-0.5 rounded-full font-black text-[11px]">
                      {Math.round((occupiedSeats / TOTAL_SEATS) * 100)}% Full
                    </span>
                  </div>
                </div>

                {/* 3. TOTAL LEDGER COLLECTION */}
                <div className="rounded-2xl p-5 text-white shadow-sm bg-gradient-to-br from-[#059669] via-[#047857] to-[#065f46] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold tracking-widest uppercase opacity-90">TOTAL COLLECTION (LEDGER)</p>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">Lifetime</span>
                    </div>
                    <p className="text-4xl font-black mt-2 tracking-tight">₹{totalCombinedIncome.toLocaleString("en-IN")}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-semibold">
                    <span>Admissions + Renewals</span>
                    <span className="bg-emerald-800/60 px-2 py-0.5 rounded text-[11px]">
                      Active Renewed: <b>{activeRenewedStudentsCount}</b>
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                <div
                  onClick={() => setActiveMenu("Pending")}
                  className="bg-[#faf8f4] border-2 border-amber-400 p-6 rounded-2xl cursor-pointer hover:bg-amber-50/50 transition shadow-sm group relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <span className="text-2xl p-3 bg-amber-100 rounded-xl">📝</span>
                      <div>
                        <h3 className="font-extrabold text-amber-950 group-hover:text-amber-700 transition text-sm">
                          Pending Approvals ({pendingCount})
                        </h3>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Review student QR submissions & generate admission receipts.
                        </p>
                      </div>
                    </div>
                    <span className="text-amber-600 font-black">➔</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveMenu("Students")}
                  className="bg-[#faf8f4] border border-[#e3dccb] p-6 rounded-2xl cursor-pointer hover:border-amber-600 transition shadow-sm group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <span className="text-2xl p-3 bg-blue-100 rounded-xl">👥</span>
                      <div>
                        <h3 className="font-extrabold text-neutral-900 group-hover:text-blue-600 transition text-sm">
                          Students Directory
                        </h3>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Manage all records, click rows for profiles, renew memberships.
                        </p>
                      </div>
                    </div>
                    <span className="text-neutral-400 group-hover:translate-x-1 transition font-bold">➔</span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveMenu("Seats")}
                  className="bg-[#faf8f4] border border-[#e3dccb] p-6 rounded-2xl cursor-pointer hover:border-amber-600 transition shadow-sm group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <span className="text-2xl p-3 bg-emerald-100 rounded-xl">🪑</span>
                      <div>
                        <h3 className="font-extrabold text-neutral-900 group-hover:text-emerald-700 transition text-sm">
                          Seat Matrix (5 Rows)
                        </h3>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Interactive 82 Cabin Seats layout with live seat assignment.
                        </p>
                      </div>
                    </div>
                    <span className="text-neutral-400 group-hover:translate-x-1 transition font-bold">➔</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 📝 PENDING APPLICANTS REVIEW VIEW */}
          {activeMenu === "Pending" && (
            <div className="flex-1 flex flex-col h-full overflow-hidden space-y-3">
              <div className="bg-[#faf8f4] border border-[#e3dccb] rounded-2xl p-4 flex items-center justify-between shadow-sm flex-shrink-0">
                <div>
                  <h3 className="text-sm font-black text-neutral-900">Online QR Admission Submissions</h3>
                  <p className="text-xs text-neutral-500">
                    Students who filled the public admission form via mobile QR scan.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1 rounded-lg">
                    {pendingCount} Applications Awaiting Review
                  </span>
                </div>
              </div>

              <div className="bg-[#faf8f4] border border-[#e3dccb] rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col relative">
                <div className="overflow-x-auto overflow-y-auto flex-1 w-full">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 z-10 border-b border-[#e3dccb] text-neutral-500 font-bold uppercase tracking-wider text-[11px] bg-[#f5f1e8] shadow-sm select-none">
                      <tr>
                        <th className="py-3 px-3">#</th>
                        <th className="py-3 px-4">APPLICANT DETAILS</th>
                        <th className="py-3 px-4">CONTACT & ADDRESS</th>
                        <th className="py-3 px-3">EXAM / COURSE</th>
                        <th className="py-3 px-3">SUBMITTED ON</th>
                        <th className="py-3 px-4 text-center">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e3dccb]/70 text-neutral-800">
                      {pendingApplicants.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-neutral-500 font-medium">
                            🎉 Abhi koi pending application nahi hai. Sabhi forms approved hain!
                          </td>
                        </tr>
                      ) : (
                        pendingApplicants.map((app, idx) => (
                          <tr key={app.pendingRowIndex || idx} className="hover:bg-[#f2ecde] transition">
                            <td className="py-3 px-3 font-bold text-neutral-500">{idx + 1}</td>
                            <td className="py-3 px-4 space-y-0.5">
                              <p className="font-extrabold text-neutral-900 text-sm">{app.name}</p>
                              <p className="text-[11px] text-neutral-600">Father: {app.fatherName}</p>
                              <p className="text-[10px] text-neutral-500 font-mono">Aadhaar: {app.idProof}</p>
                            </td>
                            <td className="py-3 px-4 space-y-0.5">
                              <p className="font-bold text-neutral-900">📞 {app.phone}</p>
                              <p className="text-[11px] text-neutral-500">Alt: {app.altPhone || "-"}</p>
                              <p className="text-[11px] text-neutral-500 truncate max-w-xs">{app.address}</p>
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-block bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">
                                {app.course || app.exam || "General Study"}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-[11px] text-neutral-600 font-medium">
                              {app.date ? String(app.date).slice(0, 10) : "Today"}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => openApprovalModal(app)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg transition shadow flex items-center gap-1.5 mx-auto"
                              >
                                <span>⚡</span> Review & Approve
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeMenu === "Students" && (
            <div className="flex-1 flex flex-col h-full overflow-hidden space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-shrink-0">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative flex-1 min-w-[180px] max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">🔍</span>
                    <input
                      type="text"
                      placeholder="Search name, phone, seat, exam..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#faf8f4] border border-[#e3dccb] rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-800 focus:outline-none"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#faf8f4] border border-[#e3dccb] rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 font-semibold cursor-pointer"
                  >
                    <option value="All Status">All Status ({totalStudents})</option>
                    <option value="Active">Active Only ({activeStudents})</option>
                    <option value="Active Reserved">↳ Active Reserved ({activeReservedStudents})</option>
                    <option value="Active Unreserved">↳ Active Unreserved ({activeUnreservedStudents})</option>
                    <option value="Renewed (Active)">⚡ Renewed Active Members ({activeRenewedStudentsCount})</option>
                    <option value="Inactive">Inactive Members ({inactiveStudents})</option>
                  </select>

                  <select
                    value={membershipFilter}
                    onChange={(e) => setMembershipFilter(e.target.value)}
                    className="bg-[#faf8f4] border border-[#e3dccb] rounded-lg px-2.5 py-1.5 text-xs text-neutral-700 cursor-pointer"
                  >
                    <option>All Membership</option>
                    <option>6hrs/Month</option>
                    <option>1 Month</option>
                    <option>3 Month</option>
                    <option>6 Month</option>
                    <option>9 Month</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    const headers = ["Student ID", "Name", "Gender", "Father Name", "Course Exam", "Mobile", "Seat", "Plan", "Fee", "Status", "Type", "Admission Date", "Renewal Date", "Aadhaar"];
                    const rows = filteredStudents.map((s) => [s.studentId, s.name, s.gender, s.fatherName, s.course, s.phone, s.seatNo, s.plan, s.monthlyFee, s.status, s.studentType, s.admDate, s.renDate, s.idProof]);
                    const csv = "data:text/csv;charset=utf-8," + [headers, ...rows].map((r) => r.join(",")).join("\n");
                    const a = document.createElement("a");
                    a.href = encodeURI(csv);
                    a.download = "Dronacharya_Students.csv";
                    a.click();
                  }}
                  className="bg-[#2e7d32] hover:bg-[#256828] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition flex-shrink-0"
                >
                  📥 Export CSV
                </button>
              </div>

              {/* TABLE CONTAINER */}
              <div className="bg-[#faf8f4] border border-[#e3dccb] rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col relative">
                <div
                  ref={tableContainerRef}
                  onScroll={calculateExactVisibleRows}
                  className="overflow-x-auto overflow-y-auto flex-1 w-full"
                >
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 z-10 border-b border-[#e3dccb] text-neutral-500 font-bold uppercase tracking-wider text-[11px] bg-[#f5f1e8] shadow-sm select-none">
                      <tr>
                        <th className="py-3 px-3">S.NO</th>
                        <th className="py-3 px-4">STUDENT DETAILS</th>
                        <th className="py-3 px-4">CONTACT & ADDRESS</th>
                        <th className="py-3 px-3 text-center">SEAT</th>
                        <th className="py-3 px-4">CURRENT MEMBERSHIP PERIOD</th>
                        <th className="py-3 px-3 text-center">TYPE</th>
                        <th className="py-3 px-3 text-center">STATUS</th>
                        <th className="py-3 px-4 text-center">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e3dccb]/70 text-neutral-800">
                      {loading ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-neutral-500 font-medium">
                            Connecting to Google Sheets...
                          </td>
                        </tr>
                      ) : filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-neutral-500 font-medium">
                            No matching students found for selected filter.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((st, idx) => {
                          const activePeriod = getLatestActivePeriodForStudent(st);
                          const alertStatus = getRenewalAlertStatus(activePeriod.endDate, st.status);
                          const isRenewedMember = st.status === "Active" && hasStudentRenewed(st);

                          let rowColorClass = "";
                          if (st.status !== "Active") {
                            rowColorClass = "bg-[#eee9dc]/80 opacity-60 hover:opacity-100 hover:bg-[#e4ded0]";
                          } else if (alertStatus === "EXPIRED") {
                            rowColorClass = "bg-rose-100/90 border-l-4 border-l-rose-500 hover:bg-rose-200/90";
                          } else if (alertStatus === "TODAY") {
                            rowColorClass = "bg-orange-100/90 border-l-4 border-l-orange-500 hover:bg-orange-200/90";
                          } else if (alertStatus === "WARNING_3DAYS") {
                            rowColorClass = "bg-amber-100/80 border-l-4 border-l-amber-400 hover:bg-amber-200/80";
                          } else {
                            rowColorClass = idx % 2 === 0 ? "bg-[#faf8f4] hover:bg-[#ebe3d3]" : "bg-[#f4efe4] hover:bg-[#ebe3d3]";
                          }

                          return (
                            <tr
                              key={st.rowIndex || idx}
                              data-index={idx + 1}
                              onClick={() => setViewStudent(st)}
                              title="Click row to view full student profile"
                              className={"transition duration-150 cursor-pointer " + rowColorClass}
                            >
                              <td className="py-3 px-3 font-semibold text-neutral-500">{idx + 1}</td>

                              <td className="py-3 px-4 space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="font-bold text-neutral-900 leading-tight">
                                    {st.name}
                                  </p>
                                  <span className="text-neutral-500 font-medium text-[10px] uppercase">
                                    ({st.gender || "MALE"})
                                  </span>
                                  {isRenewedMember && (
                                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded border border-emerald-300">
                                      ⚡ RENEWED
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-neutral-600">F: {st.fatherName}</p>
                                <span className="inline-block bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9] px-2 py-0.5 rounded text-[10px] font-semibold">
                                  📚 {st.course && st.course.trim() !== "" ? st.course : "Course Not Set"}
                                </span>
                              </td>

                              <td className="py-3 px-4 space-y-0.5">
                                <p className="font-semibold text-neutral-900 text-xs">
                                  <span className="text-amber-700 mr-1">📞</span> {st.phone}
                                </p>
                                <p className="text-[11px] text-neutral-500">Alt: {st.altPhone || "-"}</p>
                                <p className="text-[11px] text-neutral-500 truncate max-w-xs">📍 {st.address}</p>
                              </td>

                              <td className="py-3 px-3 text-center">
                                {st.seatNo !== "-" ? (
                                  <span className="inline-block bg-blue-100 text-blue-800 font-black px-2.5 py-1 rounded-md text-xs">
                                    {st.seatNo}
                                  </span>
                                ) : (
                                  <span className="text-neutral-400 font-bold">-</span>
                                )}
                              </td>

                              <td className="py-3 px-4 space-y-0.5">
                                <p className="font-bold text-neutral-900">
                                  {activePeriod.plan}
                                </p>
                                <p className="text-[11px]">
                                  From: <span className="text-emerald-700 font-bold">{activePeriod.startDate}</span>
                                </p>
                                <div className="text-[11px] flex items-center gap-1.5 flex-wrap">
                                  <span>
                                    To: <span className="font-bold text-red-600">{activePeriod.endDate}</span>
                                  </span>
                                  {alertStatus === "EXPIRED" && (
                                    <span className="bg-rose-600 text-white font-black text-[9px] px-1.5 py-0.2 rounded uppercase animate-pulse shadow-sm">
                                      Expired
                                    </span>
                                  )}
                                  {alertStatus === "TODAY" && (
                                    <span className="bg-orange-600 text-white font-black text-[9px] px-1.5 py-0.2 rounded uppercase shadow-sm">
                                      Today Due
                                    </span>
                                  )}
                                  {alertStatus === "WARNING_3DAYS" && (
                                    <span className="bg-amber-500 text-white font-black text-[9px] px-1.5 py-0.2 rounded uppercase shadow-sm">
                                      Due Soon
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-3 text-center">
                                <span
                                  className={
                                    "px-2.5 py-1 rounded-md text-[10px] font-bold " +
                                    (st.studentType === "Reserved" || !st.studentType
                                      ? "bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]"
                                      : "bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1]")
                                  }
                                >
                                  {st.studentType || "Reserved"}
                                </span>
                              </td>

                              <td className="py-3 px-3 text-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickToggleStatus(st);
                                  }}
                                  title="Click to toggle Active / Inactive"
                                  className={
                                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold transition hover:opacity-80 " +
                                    (st.status === "Active"
                                      ? "bg-[#dcfce7] text-[#15803d]"
                                      : "bg-[#fee2e2] text-[#991b1b]")
                                  }
                                >
                                  {st.status}
                                </button>
                              </td>

                              {/* ACTIONS */}
                              <td className="py-3 px-4 text-center">
                                <div
                                  className="flex items-center justify-center gap-1.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => openRenewModal(st)}
                                    title="Open Renewal Form"
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold transition flex items-center gap-0.5 shadow-sm"
                                  >
                                    <span>⚡</span> Renew
                                  </button>

                                  <button
                                    onClick={() => handleQuickToggleStatus(st)}
                                    title={st.status === "Active" ? "Mark Inactive" : "Mark Active"}
                                    className={
                                      "px-2 py-1 rounded-md text-[10px] font-bold transition shadow-sm " +
                                      (st.status === "Active"
                                        ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                                        : "bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300")
                                    }
                                  >
                                    {st.status === "Active" ? "Leave" : "Re-join"}
                                  </button>

                                  <button
                                    onClick={() => setViewHistoryStudent(st)}
                                    title="View Payment Receipts Ledger"
                                    className="p-1 text-neutral-600 hover:text-emerald-700 transition font-bold"
                                  >
                                    🧾
                                  </button>

                                  <button
                                    onClick={() => {
                                      setEditStudent(st);
                                      const parts = (st.seatNo || "").split("-");
                                      const r = parts.length > 1 ? parts[0] : "None";
                                      const s = parts.length > 1 ? parts[1] : "";
                                      const cleanAadhaar = st.idProof ? st.idProof.replace(/\D/g, "").slice(-4) : "";

                                      setFormData({
                                        ...st,
                                        idProof: cleanAadhaar,
                                        admDate: formatToInputDate(st.admDate),
                                        renDate: formatToInputDate(st.renDate),
                                        dob: formatToInputDate(st.dob || ""),
                                        selectedRow: r,
                                        selectedSeatNum: s,
                                      });
                                      setShowAddModal(true);
                                    }}
                                    title="Edit Profile"
                                    className="p-1 text-neutral-600 hover:text-amber-600 transition font-bold"
                                  >
                                    ✏️
                                  </button>

                                  <button
                                    onClick={() => setStudentToDelete({ student: st, sNo: idx + 1 })}
                                    title="Delete Student"
                                    className="p-1 text-neutral-600 hover:text-red-600 transition font-bold"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-[#e3dccb] bg-[#faf8f4] px-5 py-2.5 flex items-center justify-between text-xs text-neutral-700 font-semibold flex-shrink-0 z-10 shadow-[0_-3px_10px_rgba(0,0,0,0.04)] select-none">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span>
                      Showing{" "}
                      <b className="text-neutral-900 bg-neutral-200 px-2 py-0.5 rounded text-[11px]">
                        {visibleCount}
                      </b>{" "}
                      <span className="text-neutral-500 font-normal">({visibleRange})</span> of{" "}
                      <b className="text-neutral-900">{displayTotal}</b>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-700">Active: <b>{displayActive}</b></span>
                    <span>•</span>
                    <span className="text-blue-700">Reserved: <b>{activeReservedStudents}</b></span>
                    <span>•</span>
                    <span className="text-slate-700">Unreserved: <b>{activeUnreservedStudents}</b></span>
                    <span>•</span>
                    <span className="text-emerald-800">Renewed: <b>{activeRenewedStudentsCount}</b></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMenu === "Seats" && (
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="flex justify-between items-center px-1">
                <div>
                  <h3 className="text-sm font-black text-neutral-900 tracking-tight">
                    Cabin Allocation Matrix (5 Rows)
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium">Total {TOTAL_SEATS} Library Cabins</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-500"></span> Available ({emptySeats})
                  </span>
                  <span className="flex items-center gap-1.5 text-red-800">
                    <span className="w-3 h-3 rounded bg-red-100 border border-red-500"></span> Occupied ({occupiedSeats})
                  </span>
                </div>
              </div>

              {LIBRARY_SECTIONS.map((section) => (
                <div
                  key={section.name}
                  className="bg-[#faf8f4] border border-[#e3dccb] rounded-2xl p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#e3dccb]/70 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                      <h4 className="text-xs font-black text-neutral-900 uppercase">
                        ROW: {section.name}
                      </h4>
                      <span className="text-[10px] text-neutral-500 font-bold bg-[#ede6d5] px-2 py-0.5 rounded-md">
                        {section.count} Seats
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2.5">
                    {Array.from({ length: section.count }, (_, i) => i + 1).map((seat) => {
                      const fullSeatName = `${section.name} - ${seat}`;
                      const student = students.find((s) => {
                        const sNo = String(s.seatNo).trim();
                        return (
                          s.status === "Active" &&
                          (sNo === `${section.name}-${seat}` || sNo === fullSeatName || sNo === `${seat}`)
                        );
                      });
                      const isTaken = Boolean(student);

                      return (
                        <div
                          key={seat}
                          title={isTaken ? `Profile: ${student?.name} (${fullSeatName})` : `${fullSeatName} (Free)`}
                          onClick={() => {
                            if (isTaken && student) {
                              setViewStudent(student);
                            } else {
                              const today = new Date().toISOString().slice(0, 10);
                              setFormData({
                                ...initialForm,
                                admDate: today,
                                renDate: calculateRenewalDateFromBase(today, "1 Month"),
                                selectedRow: section.name,
                                selectedSeatNum: String(seat),
                                seatNo: `${section.name}-${seat}`,
                                monthlyFee: 1200,
                                status: "Active",
                              });
                              setShowAddModal(true);
                            }
                          }}
                          className={
                            "p-2.5 rounded-xl border text-center transition flex flex-col justify-center items-center cursor-pointer select-none " +
                            (isTaken
                              ? "bg-red-50 border-red-300 text-red-900 shadow-sm hover:border-red-500 hover:bg-red-100/90 active:scale-95"
                              : "bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-400 shadow-sm active:scale-95")
                          }
                        >
                          <span className="text-[11px] font-black tracking-tight leading-tight">
                            {section.name} - {seat}
                          </span>
                          
                          <span
                            className={
                              "text-[9px] truncate max-w-full font-bold mt-1 px-1.5 py-0.2 rounded " +
                              (isTaken ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800")
                            }
                          >
                            {isTaken ? student?.name?.split(" ")[0] : "Free"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ⚡ NEW: APPROVAL & RECEIPT GENERATION MODAL */}
      {approvingApplicant && (
        <div
          onClick={() => setApprovingApplicant(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#cad5e2] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden font-sans max-h-[90vh] flex flex-col"
          >
            <div className="flex justify-between items-center px-5 py-3.5 border-b border-neutral-100 bg-emerald-50/50">
              <div>
                <h3 className="font-extrabold text-neutral-900 text-sm flex items-center gap-1.5">
                  <span className="text-emerald-700">⚡</span> Approve Admission & Generate Official Receipt
                </h3>
                <p className="text-[11px] text-neutral-600 font-semibold mt-0.5">
                  Applicant: <b>{approvingApplicant.name}</b> (Ph: {approvingApplicant.phone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setApprovingApplicant(null)}
                className="w-6 h-6 rounded-full hover:bg-neutral-100 text-neutral-400 font-bold flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmApproval} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Plan Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px]">MEMBERSHIP PLAN *</label>
                  <select
                    value={approvalFormData.plan}
                    onChange={(e) => {
                      const p = e.target.value;
                      const fee = PLAN_FEE_RATES[p] ?? 1200;
                      const calc = calculateRenewalDateFromBase(approvalFormData.admDate, p);
                      setApprovalFormData({ ...approvalFormData, plan: p, monthlyFee: fee, renDate: calc });
                    }}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-800 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="6hrs/Month">6hrs/Month</option>
                    <option value="1 Month">1 Month</option>
                    <option value="3 Month">3 Month</option>
                    <option value="6 Month">6 Month</option>
                    <option value="9 Month">9 Month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px]">STUDENT TYPE</label>
                  <select
                    value={approvalFormData.studentType}
                    onChange={(e) => setApprovalFormData({ ...approvalFormData, studentType: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-800 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Reserved">Reserved Seat</option>
                    <option value="Unreserved">Unreserved Shift</option>
                  </select>
                </div>
              </div>

              {/* Seat Allocation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px]">SELECT CABIN ROW</label>
                  <select
                    value={approvalFormData.selectedRow}
                    onChange={(e) => {
                      const r = e.target.value;
                      const free = getAvailableSeatsForRow(r);
                      const fSeat = free.length > 0 ? String(free[0]) : "";
                      setApprovalFormData({
                        ...approvalFormData,
                        selectedRow: r,
                        selectedSeatNum: fSeat,
                        seatNo: fSeat ? `${r}-${fSeat}` : "-",
                      });
                    }}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-800 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="None">None / No Seat</option>
                    {LIBRARY_SECTIONS.map((sec) => (
                      <option key={sec.name} value={sec.name}>
                        {sec.name} ({sec.count} Seats)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px] flex items-center justify-between">
                    <span>SELECT FREE CABIN SEAT</span>
                    <span className="text-emerald-700 text-[9px] font-bold">Free Cabins Only</span>
                  </label>
                  <select
                    disabled={approvalFormData.selectedRow === "None"}
                    value={approvalFormData.selectedSeatNum}
                    onChange={(e) => {
                      const sNum = e.target.value;
                      setApprovalFormData({
                        ...approvalFormData,
                        selectedSeatNum: sNum,
                        seatNo: sNum === "none" ? "-" : `${approvalFormData.selectedRow}-${sNum}`,
                      });
                    }}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-neutral-800 font-bold focus:outline-none focus:border-blue-500 cursor-pointer disabled:bg-neutral-100"
                  >
                    {getAvailableSeatsForRow(approvalFormData.selectedRow).map((n) => (
                      <option key={n} value={n}>
                        Seat #{n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px]">ADMISSION DATE *</label>
                  <input
                    type="date"
                    required
                    value={approvalFormData.admDate}
                    onChange={(e) => {
                      const d = e.target.value;
                      const calc = calculateRenewalDateFromBase(d, approvalFormData.plan);
                      setApprovalFormData({ ...approvalFormData, admDate: d, renDate: calc });
                    }}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-1.5 text-neutral-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px] flex justify-between">
                    <span>NEXT RENEWAL DATE *</span>
                    <span className="text-emerald-700 text-[9px] font-bold">Auto-calculated</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={approvalFormData.renDate}
                    onChange={(e) => setApprovalFormData({ ...approvalFormData, renDate: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-1.5 text-neutral-800 font-bold"
                  />
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#f8fbff] p-3 rounded-xl border border-blue-100">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1 uppercase text-[10px]">FEE AMOUNT (₹) *</label>
                  <input
                    type="number"
                    required
                    value={approvalFormData.monthlyFee}
                    onChange={(e) => setApprovalFormData({ ...approvalFormData, monthlyFee: Number(e.target.value) })}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 font-black text-sm"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-bold mb-1 uppercase text-[10px]">PAYMENT MODE</label>
                  <select
                    value={approvalFormData.payMode}
                    onChange={(e) => setApprovalFormData({ ...approvalFormData, payMode: e.target.value })}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-800 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI / QR">UPI / QR</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setApprovingApplicant(null)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black shadow-md shadow-emerald-600/20"
                >
                  {isSubmitting ? "Generating Receipt..." : "✓ Approve & Issue Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENEWAL MODAL */}
      {studentToRenew && (
        <div
          onClick={() => setStudentToRenew(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#cad5e2] rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-neutral-900 text-sm">⚡ Student Membership Renewal</h3>
              <button onClick={() => setStudentToRenew(null)} className="text-neutral-400 font-bold text-xs">✕</button>
            </div>
            <form onSubmit={handleConfirmRenew} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Select Plan</label>
                <select
                  value={renewFormData.plan}
                  onChange={(e) => {
                    const p = e.target.value;
                    const fee = PLAN_FEE_RATES[p] ?? 1200;
                    setRenewFormData({ ...renewFormData, plan: p, feePaid: fee, newRenDate: calculateRenewalDateFromBase(renewFormData.startDate, p) });
                  }}
                  className="w-full bg-neutral-50 border p-2 rounded-lg font-bold"
                >
                  <option value="6hrs/Month">6hrs/Month</option>
                  <option value="1 Month">1 Month</option>
                  <option value="3 Month">3 Month</option>
                  <option value="6 Month">6 Month</option>
                  <option value="9 Month">9 Month</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={renewFormData.startDate}
                    onChange={(e) => setRenewFormData({ ...renewFormData, startDate: e.target.value, newRenDate: calculateRenewalDateFromBase(e.target.value, renewFormData.plan) })}
                    className="w-full bg-neutral-50 border p-1.5 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">New Renewal Date</label>
                  <input
                    type="date"
                    required
                    value={renewFormData.newRenDate}
                    onChange={(e) => setRenewFormData({ ...renewFormData, newRenDate: e.target.value })}
                    className="w-full bg-neutral-50 border p-1.5 rounded-lg font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Fee Amount (₹)</label>
                  <input
                    type="number"
                    value={renewFormData.feePaid}
                    onChange={(e) => setRenewFormData({ ...renewFormData, feePaid: e.target.value })}
                    className="w-full bg-neutral-50 border p-2 rounded-lg font-black text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-600 uppercase mb-1">Payment Mode</label>
                  <select
                    value={renewFormData.payMode}
                    onChange={(e) => setRenewFormData({ ...renewFormData, payMode: e.target.value })}
                    className="w-full bg-neutral-50 border p-2 rounded-lg font-bold"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI / QR">UPI / QR</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t">
                <button type="button" onClick={() => setStudentToRenew(null)} className="px-4 py-2 border rounded-lg font-bold">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-black">
                  {isSubmitting ? "Saving..." : "Confirm & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT PROFILE MODAL */}
      {viewStudent && (
        <div
          onClick={() => setViewStudent(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#cad5e2] rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-3.5 text-[11px]"
          >
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-extrabold text-xs">📋 Student Details Profile</h3>
              <button onClick={() => setViewStudent(null)} className="font-bold text-xs text-neutral-400">✕</button>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <h4 className="font-black text-blue-900 text-sm">
                ID: {viewStudent.studentId || "DL-01"} - {viewStudent.name} ({viewStudent.gender || "MALE"})
              </h4>
              <p className="text-neutral-600 font-bold mt-0.5">Father: {viewStudent.fatherName}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-neutral-700 font-medium">
              <p>📞 <b>Mobile:</b> {viewStudent.phone}</p>
              <p>📞 <b>Alt:</b> {viewStudent.altPhone || "-"}</p>
              <p>🪪 <b>Aadhaar:</b> {viewStudent.idProof || "-"}</p>
              <p>🎂 <b>DOB:</b> {formatDateToDDMMYYYY(viewStudent.dob || "")}</p>
              <p className="col-span-2">📍 <b>Address:</b> {viewStudent.address}</p>
            </div>
            <div className="bg-[#f2faf5] border border-[#d2eedf] rounded-xl p-3 grid grid-cols-2 gap-2 font-medium">
              <p>💺 <b>Seat:</b> <span className="font-black text-blue-700">{viewStudent.seatNo}</span></p>
              <p>⏳ <b>Plan:</b> {viewStudent.plan}</p>
              <p>📅 <b>Admission:</b> {formatDateToDDMMYYYY(viewStudent.admDate)}</p>
              <p>🗓️ <b>Renewal:</b> <span className="font-black text-red-600">{formatDateToDDMMYYYY(getLatestActivePeriodForStudent(viewStudent).endDate)}</span></p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  const s = viewStudent;
                  setViewStudent(null);
                  setViewHistoryStudent(s);
                }}
                className="px-3.5 py-1.5 bg-emerald-600 text-white font-bold rounded-lg"
              >
                🧾 View Receipts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPTS LEDGER MODAL */}
      {viewHistoryStudent && (
        <div
          onClick={() => setViewHistoryStudent(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-3 max-h-[85vh] flex flex-col"
          >
            <div className="flex justify-between items-center border-b pb-2 flex-shrink-0">
              <h3 className="font-extrabold text-xs">🧾 Receipts Ledger: {viewHistoryStudent.name}</h3>
              <button onClick={() => setViewHistoryStudent(null)} className="font-bold text-xs">✕</button>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex justify-between items-center flex-shrink-0">
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-800">TOTAL PAID</p>
                <p className="text-xl font-black text-emerald-700">₹{totalPaidByHistoryStudent}</p>
              </div>
              <span className="text-xs bg-emerald-200 px-2.5 py-1 rounded-full font-bold">{historyStudentLogs.length} Receipts</span>
            </div>
            <div className="overflow-y-auto space-y-2 flex-1 text-xs">
              {historyStudentLogs.map((log, i) => (
                <div key={log.txId || i} className="p-3 border rounded-xl flex justify-between items-center bg-white shadow-sm">
                  <div>
                    <span className="font-black text-emerald-700 text-sm mr-2">₹{log.amount}</span>
                    <span className="text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded font-bold mr-2">{log.plan}</span>
                    <span className="text-[10px] text-neutral-400">({log.mode})</span>
                    <p className="text-[11px] text-neutral-500 mt-1">{formatDateToDDMMYYYY(log.oldRenDate)} - {formatDateToDDMMYYYY(log.newRenDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-neutral-400 font-bold uppercase">PAID DATE</p>
                    <p className="text-[11px] font-black">{formatDateToDDMMYYYY(log.payDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DIRECT ADD / EDIT MODAL */}
      {(showAddModal || editStudent) && (
        <div
          onClick={() => {
            setShowAddModal(false);
            setEditStudent(null);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start border-b pb-3">
              <h3 className="font-bold text-neutral-900 text-base">
                {editStudent ? "Edit Student Details" : "New Student Admission"}
              </h3>
              <button onClick={() => { setShowAddModal(false); setEditStudent(null); }} className="font-bold text-xs">✕</button>
            </div>
            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-600 mb-1 uppercase text-[10px]">Student Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                    className="w-full bg-neutral-50 border p-2 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-600 mb-1 uppercase text-[10px]">Father's Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value.toUpperCase() })}
                    className="w-full bg-neutral-50 border p-2 rounded-lg font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-600 mb-1 uppercase text-[10px]">Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-neutral-50 border p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-600 mb-1 uppercase text-[10px]">Alt Contact *</label>
                  <input
                    type="tel"
                    value={formData.altPhone}
                    onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
                    className="w-full bg-neutral-50 border p-2 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-neutral-600 mb-1 uppercase text-[10px]">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value.toUpperCase() })}
                  className="w-full bg-neutral-50 border p-2 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-600 mb-1 uppercase text-[10px]">Admission Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.admDate}
                    onChange={(e) => setFormData({ ...formData, admDate: e.target.value, renDate: calculateRenewalDateFromBase(e.target.value, formData.plan) })}
                    className="w-full bg-neutral-50 border p-1.5 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-600 mb-1 uppercase text-[10px]">Renewal Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.renDate}
                    onChange={(e) => setFormData({ ...formData, renDate: e.target.value })}
                    className="w-full bg-neutral-50 border p-1.5 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-600 mb-1 uppercase text-[10px]">Select Row</label>
                  <select
                    value={formData.selectedRow}
                    onChange={(e) => handleRowChange(e.target.value)}
                    className="w-full bg-neutral-50 border p-2 rounded-lg font-bold"
                  >
                    <option value="None">None / No Seat</option>
                    {LIBRARY_SECTIONS.map((sec) => (
                      <option key={sec.name} value={sec.name}>{sec.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-neutral-600 mb-1 uppercase text-[10px]">Seat Number</label>
                  <select
                    disabled={formData.selectedRow === "None"}
                    value={formData.selectedSeatNum}
                    onChange={(e) => handleSeatNumChange(e.target.value)}
                    className="w-full bg-neutral-50 border p-2 rounded-lg font-bold disabled:bg-neutral-100"
                  >
                    {getAvailableSeatsForRow(formData.selectedRow || "", editStudent?.seatNo).map((num) => (
                      <option key={num} value={num}>Seat #{num}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-3 border-t flex justify-end gap-2.5">
                <button type="button" onClick={() => { setShowAddModal(false); setEditStudent(null); }} className="px-4 py-2 border rounded-lg font-bold">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold">
                  {isSubmitting ? "Saving..." : "Confirm & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {studentToDelete && (
        <div
          onClick={() => setStudentToDelete(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border rounded-2xl w-full max-w-xs p-5 shadow-2xl text-center space-y-3"
          >
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">🗑️</div>
            <h3 className="font-black text-sm">Delete Student Record?</h3>
            <p className="text-xs text-neutral-500">Permanently delete <b>{studentToDelete.student.name}</b>?</p>
            <div className="flex gap-2 pt-1">
              <button onClick={executeDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold text-xs">Yes, Delete</button>
              <button onClick={() => setStudentToDelete(null)} className="flex-1 py-2 bg-neutral-100 rounded-lg font-bold text-xs">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
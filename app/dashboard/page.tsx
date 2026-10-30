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

export default function Dashboard() {
  const [activeMenu, setActiveMenu] = useState<"Dashboard" | "Students" | "Seats">("Dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [renewalHistory, setRenewalHistory] = useState<RenewalLog[]>([]);
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      if (data && data.students) {
        setStudents(data.students);
        setRenewalHistory(data.history || []);
      } else if (Array.isArray(data)) {
        setStudents(data);
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

    const hasAdmissionLogged = rawLogs.some((h) => h.remarks?.toLowerCase().includes("admission"));
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

      // Original admDate ko preserve rakhenge
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
            txId: "TX-" + Date.now(),
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

  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === "Active").length;
  const inactiveStudents = totalStudents - activeStudents;
  const occupiedSeats = students.filter((s) => s.seatNo && s.seatNo !== "-" && s.status === "Active").length;
  const emptySeats = Math.max(0, TOTAL_SEATS - occupiedSeats);

  const allInitialAdmissionFees = students.reduce((acc, curr) => acc + (Number(curr.monthlyFee) || 0), 0);
  const allRenewalsFees = renewalHistory
    .filter((h) => !h.remarks?.toLowerCase().includes("admission"))
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

      const matchesStatus =
        statusFilter === "All Status" ? true : s.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesPlan =
        membershipFilter === "All Membership" ? true : (s.plan || "").toLowerCase().includes(membershipFilter.toLowerCase());

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
          </nav>
        </div>

        <div className="w-64 p-3 border-t border-[#e3dccb]">
          <Link className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition" href="/">
            <span>🚪</span> Logout
          </Link>
        </div>
      </aside>

      {/* Vertical Continuous Top-to-Bottom Slider Strip Handle */}
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
              {activeMenu === "Seats" ? "🪑" : activeMenu === "Students" ? "👥" : "📊"}
            </span>
            <h2 className="font-extrabold text-neutral-800 text-sm tracking-tight">
              {activeMenu === "Seats"
                ? "Seat Management Matrix"
                : activeMenu === "Students"
                ? "Students Directory"
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
              <span>+</span> Add Student
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
                <div className="rounded-2xl p-5 text-white shadow-sm bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8]">
                  <p className="text-[11px] font-bold tracking-widest uppercase opacity-90">TOTAL STUDENTS</p>
                  <p className="text-4xl font-black mt-2 tracking-tight">{totalStudents}</p>
                  <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-xs">
                    <span>Active: <b>{activeStudents}</b></span>
                    <span>Inactive: <b>{inactiveStudents}</b></span>
                  </div>
                </div>

                <div className="rounded-2xl p-5 text-white shadow-sm bg-gradient-to-br from-[#f97316] to-[#c2410c]">
                  <p className="text-[11px] font-bold tracking-widest uppercase opacity-90">SEAT OCCUPANCY</p>
                  <p className="text-4xl font-black mt-2 tracking-tight">
                    {occupiedSeats} <span className="text-lg opacity-80">/ {TOTAL_SEATS}</span>
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-xs">
                    <span>Empty Seats: <b>{emptySeats}</b></span>
                    <span>{Math.round((occupiedSeats / TOTAL_SEATS) * 100)}% Full</span>
                  </div>
                </div>

                <div className="rounded-2xl p-5 text-white shadow-sm bg-gradient-to-br from-[#10b981] to-[#047857]">
                  <p className="text-[11px] font-bold tracking-widest uppercase opacity-90">TOTAL COLLECTION (LEDGER)</p>
                  <p className="text-4xl font-black mt-2 tracking-tight">₹{totalCombinedIncome.toLocaleString("en-IN")}</p>
                  <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-xs">
                    <span>All Admissions + Renewals</span>
                    <span>Lifetime Ledger</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div
                  onClick={() => setActiveMenu("Students")}
                  className="bg-[#faf8f4] border border-[#e3dccb] p-6 rounded-2xl cursor-pointer hover:border-amber-600 transition shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-3 bg-blue-100 rounded-xl">👥</span>
                    <div>
                      <h3 className="font-extrabold text-neutral-900 group-hover:text-blue-600 transition">Students Directory</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">Click here to manage all students, edit profiles, view admission details.</p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setActiveMenu("Seats")}
                  className="bg-[#faf8f4] border border-[#e3dccb] p-6 rounded-2xl cursor-pointer hover:border-amber-600 transition shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-3 bg-emerald-100 rounded-xl">🪑</span>
                    <div>
                      <h3 className="font-extrabold text-neutral-900 group-hover:text-emerald-700 transition">Seat Allocation Matrix</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">Click here to view 5 Rows (82 Seats) interactive layout & assign seats.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMenu === "Students" && (
            <div className="flex-1 flex flex-col h-full overflow-hidden space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-shrink-0">
                <div className="flex flex-wrap items-center gap-2.5 flex-1">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
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
                    className="bg-[#faf8f4] border border-[#e3dccb] rounded-lg px-3 py-1.5 text-xs text-neutral-700 cursor-pointer"
                  >
                    <option>All Status</option>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>

                  <select
                    value={membershipFilter}
                    onChange={(e) => setMembershipFilter(e.target.value)}
                    className="bg-[#faf8f4] border border-[#e3dccb] rounded-lg px-3 py-1.5 text-xs text-neutral-700 cursor-pointer"
                  >
                    <option>All Membership</option>
                    <option>6hrs/Month</option>
                    <option>1 Month</option>
                    <option>3 Month</option>
                    <option>6 Month</option>
                    <option>9 Month</option>
                  </select>

                  <div className="hidden lg:flex items-center gap-3 text-[10px] font-bold px-3 py-1.5 bg-white/80 border border-[#e3dccb] rounded-lg shadow-sm">
                    <span className="flex items-center gap-1.5 text-rose-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-rose-600"></span>
                      Expired <b className="bg-rose-100 text-rose-900 px-1.5 py-0.2 rounded-full border border-rose-200">({expiredCount})</b>
                    </span>
                    <span className="flex items-center gap-1.5 text-orange-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-400 border border-orange-500"></span>
                      Today Due <b className="bg-orange-100 text-orange-900 px-1.5 py-0.2 rounded-full border border-orange-200">({todayDueCount})</b>
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-300 border border-amber-400"></span>
                      Due in ≤3 Days <b className="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full border border-amber-200">({due3DaysCount})</b>
                    </span>
                  </div>
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
                  className="bg-[#2e7d32] hover:bg-[#256828] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition flex-shrink-0"
                >
                  📥 Export CSV
                </button>
              </div>

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
                            No students found. Click "+ Add Student" to create a record.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((st, idx) => {
                          const activePeriod = getLatestActivePeriodForStudent(st);
                          const alertStatus = getRenewalAlertStatus(activePeriod.endDate, st.status);

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
                              title="Click row to view student profile"
                              className={"transition duration-150 cursor-pointer " + rowColorClass}
                            >
                              <td className="py-3 px-3 font-semibold text-neutral-500">{idx + 1}</td>

                              <td className="py-3 px-4 space-y-0.5">
                                <p className="font-bold text-neutral-900 leading-tight">
                                  {st.name}{" "}
                                  <span className="text-neutral-500 font-medium text-xs uppercase">
                                    ({st.gender || "MALE"})
                                  </span>
                                </p>
                                <p className="text-[11px] text-neutral-600">F: {st.fatherName}</p>
                                <span className="inline-block bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9] px-2 py-0.5 rounded text-[10px] font-semibold">
                                  📚 {st.course && st.course.trim() !== "" ? st.course : "Course Not Set"}
                                </span>
                              </td>

                              <td className="py-3 px-4 space-y-0.5">
                                <p className="font-semibold text-neutral-900 text-xs">
                                  <span className="text-amber-700 mr-1">📞</span> {st.phone}
                                </p>
                                <p className="text-[11px] text-neutral-500">Alt: {st.altPhone}</p>
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
                                    (st.studentType === "Reserved"
                                      ? "bg-[#e0f2fe] text-[#0369a1]"
                                      : "bg-[#f1f5f9] text-[#475569]")
                                  }
                                >
                                  {st.studentType}
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
                  <div className="flex items-center gap-2.5">
                    <span>
                      Showing{" "}
                      <b className="text-neutral-900 bg-neutral-200 px-2 py-0.5 rounded text-[11px]">
                        {visibleCount}
                      </b>{" "}
                      <span className="text-neutral-500 font-normal">({visibleRange})</span> of{" "}
                      <b className="text-neutral-900">{displayTotal}</b>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-700">
                      Active: <b>{displayActive}</b>
                    </span>
                    <span>•</span>
                    <span className="text-red-600">
                      Inactive: <b>{displayInactive}</b>
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 font-medium hidden sm:block">
                    Tip: Row par click karke student profile dekhein
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
                          title={isTaken ? `Click to view profile: ${student?.name} (${fullSeatName})` : `${fullSeatName} (Available)`}
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

      {/* ⚡ RENEWAL FORM MODAL (Click outside to close) */}
      {studentToRenew && (
        <div
          onClick={() => setStudentToRenew(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#cad5e2] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden font-sans"
          >
            <div className="flex justify-between items-center px-5 py-3.5 border-b border-neutral-100 bg-[#f9fbff]">
              <div>
                <h3 className="font-extrabold text-neutral-900 text-sm flex items-center gap-1.5">
                  <span className="text-emerald-600">⚡</span> Student Membership Renewal
                </h3>
                <p className="text-[11px] text-neutral-500 font-semibold mt-0.5">
                  {studentToRenew.name} (ID: {studentToRenew.studentId || "DL-01"})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStudentToRenew(null)}
                className="w-6 h-6 rounded-full hover:bg-neutral-100 text-neutral-400 font-bold flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmRenew} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px]">SELECT PLAN</label>
                <select
                  value={renewFormData.plan}
                  onChange={(e) => {
                    const selectedPlan = e.target.value;
                    const fee = PLAN_FEE_RATES[selectedPlan] ?? 1200;
                    const calculatedDate = calculateRenewalDateFromBase(renewFormData.startDate, selectedPlan);
                    setRenewFormData((prev) => ({
                      ...prev,
                      plan: selectedPlan,
                      feePaid: fee,
                      newRenDate: calculatedDate,
                    }));
                  }}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="6hrs/Month">6hrs/Month</option>
                  <option value="1 Month">1 Month</option>
                  <option value="3 Month">3 Month</option>
                  <option value="6 Month">6 Month</option>
                  <option value="9 Month">9 Month</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px]">
                    RENEWAL START DATE *
                  </label>
                  <input
                    type="date"
                    required
                    value={renewFormData.startDate}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      const calc = calculateRenewalDateFromBase(newStart, renewFormData.plan);
                      setRenewFormData((prev) => ({
                        ...prev,
                        startDate: newStart,
                        newRenDate: calc,
                      }));
                    }}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-neutral-800 font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px] flex items-center justify-between">
                    <span>NEXT RENEWAL DATE *</span>
                    <span className="text-emerald-600 text-[9px] font-semibold">Auto-calculated</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={renewFormData.newRenDate}
                    onChange={(e) => setRenewFormData({ ...renewFormData, newRenDate: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-neutral-800 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px] flex items-center justify-between">
                    <span>FEE AMOUNT (₹) *</span>
                    <span className="text-neutral-400 text-[9px] font-normal">Editable</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1200"
                    value={renewFormData.feePaid === "" ? "" : renewFormData.feePaid}
                    onChange={(e) =>
                      setRenewFormData({
                        ...renewFormData,
                        feePaid: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 font-bold text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px]">PAYMENT MODE</label>
                  <select
                    value={renewFormData.payMode}
                    onChange={(e) => setRenewFormData({ ...renewFormData, payMode: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI / QR">UPI / QR</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setStudentToRenew(null)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-100 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md shadow-emerald-600/20 transition"
                >
                  {isSubmitting ? "Recording..." : "Confirm & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 👁️ MODAL 1: STUDENT PROFILE (Click outside to close) */}
      {viewStudent && (
        <div
          onClick={() => setViewStudent(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#cad5e2] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden font-sans"
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-100">
              <h3 className="font-extrabold text-neutral-800 text-xs flex items-center gap-1.5">
                <span>📋</span> Student Details Profile
              </h3>
              <button
                type="button"
                onClick={() => setViewStudent(null)}
                className="w-6 h-6 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 font-bold flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-[11px]">
              <div className="bg-[#f0f6ff] border border-[#d6e5fd] rounded-xl p-3">
                <h4 className="font-extrabold text-blue-700 text-sm tracking-tight">
                  ID: {viewStudent.studentId || "DL-01"} - {viewStudent.name} ({viewStudent.gender || "Male"})
                </h4>
                <p className="text-neutral-500 font-semibold text-[11px] mt-0.5">
                  Father Name: <span className="text-neutral-800">{viewStudent.fatherName}</span>
                </p>
                <p className="text-neutral-500 font-semibold text-[11px] mt-0.5">
                  Status:{" "}
                  <span
                    className={
                      viewStudent.status === "Active"
                        ? "font-black uppercase text-emerald-700"
                        : "font-black uppercase text-red-600"
                    }
                  >
                    {viewStudent.status}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 px-1 text-neutral-700 font-medium">
                <div>
                  <p className="flex items-center gap-1.5">
                    <span>📞</span> <b>Mobile:</b> {viewStudent.phone}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5">
                    <span>📞</span> <b>Alt Mobile:</b> {viewStudent.altPhone || "-"}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5">
                    <span>🪪</span> <b>Aadhaar:</b> {viewStudent.idProof || "-"}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5">
                    <span>📍</span> <b>Pincode:</b> {viewStudent.pincode || "-"}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5">
                    <span>🎂</span> <b>DOB:</b> {formatDateToDDMMYYYY(viewStudent.dob || "")}
                  </p>
                </div>
                <div className="col-span-2 pt-0.5">
                  <p className="flex items-start gap-1.5 leading-relaxed">
                    <span className="flex-shrink-0 mt-0.5">🏡</span>
                    <span>
                      <b>Address:</b>{" "}
                      <span className="text-neutral-800 font-normal break-words">
                        {viewStudent.address || "-"}
                      </span>
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-[#f2faf5] border border-[#d2eedf] rounded-xl p-3 text-neutral-800 space-y-1.5">
                <div className="grid grid-cols-2 gap-2 font-medium">
                  <p className="flex items-center gap-1.5">
                    <span>💺</span> <b>Current Seat:</b>{" "}
                    <span className="font-extrabold text-blue-700">{viewStudent.seatNo}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span>⏳</span> <b>Active Plan:</b> {viewStudent.plan}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span>📅</span> <b>Admission:</b>{" "}
                    <span className="font-extrabold text-emerald-700">
                      {formatDateToDDMMYYYY(viewStudent.admDate)}
                    </span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span>🗓️</span> <b>Renewal Date:</b>{" "}
                    <span className="font-extrabold text-red-600">
                      {formatDateToDDMMYYYY(getLatestActivePeriodForStudent(viewStudent).endDate)}
                    </span>
                  </p>
                </div>

                <div className="pt-1.5 border-t border-[#d2eedf]/70 flex items-center justify-between font-medium">
                  <p className="flex items-center gap-1.5">
                    <span>📚</span> <b>Course:</b>{" "}
                    <span className="font-bold text-neutral-900">{viewStudent.course || "-"}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span>🏷️</span> <b>Type:</b>{" "}
                    <span
                      className={
                        "px-2 py-0.5 rounded text-[10px] font-black " +
                        (viewStudent.studentType === "Reserved"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-neutral-200 text-neutral-700")
                      }
                    >
                      {viewStudent.studentType || "Reserved"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const st = viewStudent;
                    setViewStudent(null);
                    setViewHistoryStudent(st);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                >
                  <span>🧾</span> View Payment Receipts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🧾 MODAL 2: DEDICATED RECEIPTS LEDGER (Click outside to close) */}
      {viewHistoryStudent && (
        <div
          onClick={() => setViewHistoryStudent(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#cad5e2] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden font-sans max-h-[90vh] flex flex-col"
          >
            <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-100 bg-[#f9fbff] flex-shrink-0">
              <div>
                <h3 className="font-extrabold text-neutral-900 text-xs flex items-center gap-1.5">
                  <span className="text-emerald-700 text-sm">🧾</span> Fee & Renewal Receipts Ledger
                </h3>
                <p className="text-[11px] text-neutral-500 font-semibold mt-0.5">
                  {viewHistoryStudent.name} (ID: {viewHistoryStudent.studentId || "DL-01"})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewHistoryStudent(null)}
                className="w-6 h-6 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 font-bold flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-[11px] overflow-y-auto flex-1">
              <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">TOTAL PAID TILL DATE</p>
                  <p className="text-xl font-black text-emerald-700 mt-0.5">₹{totalPaidByHistoryStudent}</p>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-900 font-extrabold px-2.5 py-1 rounded-full border border-emerald-300">
                  {historyStudentLogs.length} Receipts
                </span>
              </div>

              <div className="space-y-2">
                {historyStudentLogs.length === 0 ? (
                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-center text-neutral-500">
                    No payment receipts found.
                  </div>
                ) : (
                  historyStudentLogs.map((log, lIdx) => {
                    const isAdmission = log.remarks?.toLowerCase().includes("admission") || log.txId?.startsWith("INIT-") || log.txId?.startsWith("TX-ADM-");
                    const displayStart = formatDateToDDMMYYYY(log.oldRenDate);
                    const displayEnd = formatDateToDDMMYYYY(log.newRenDate);

                    return (
                      <div
                        key={log.txId || lIdx}
                        className={
                          "p-3 rounded-xl border transition flex items-center justify-between " +
                          (isAdmission ? "bg-[#f8fbff] border-blue-200" : "bg-white border-neutral-200 shadow-sm")
                        }
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-emerald-700 text-sm">₹{log.amount}</span>
                            <span
                              className={
                                "px-1.5 py-0.2 rounded text-[10px] font-bold " +
                                (isAdmission
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : "bg-neutral-100 text-neutral-800 border border-neutral-200")
                              }
                            >
                              {log.plan}
                            </span>
                            <span className="text-neutral-400 font-normal">({log.mode})</span>
                          </div>

                          <p className="text-[11px] text-neutral-600 font-medium">
                            {displayStart} - {displayEnd}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider">PAID DATE</p>
                          <p className="text-[11px] text-neutral-900 font-extrabold mt-0.5">
                            {formatDateToDDMMYYYY(log.payDate)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🗑️ DELETE CONFIRMATION POPUP (Click outside to close) */}
      {studentToDelete && (
        <div
          onClick={() => setStudentToDelete(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-neutral-200 rounded-2xl w-full max-w-xs p-5 shadow-2xl text-center space-y-3.5 font-sans"
          >
            <div className="w-12 h-12 bg-red-50 text-red-600 border border-red-200 rounded-full flex items-center justify-center mx-auto text-xl shadow-sm">
              🗑️
            </div>
            <div>
              <h3 className="font-black text-neutral-900 text-sm">Delete Student Record?</h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Kya aap student <b>{studentToDelete.student.name}</b> (ID: {studentToDelete.student.studentId || `DL-${studentToDelete.sNo}`}) ko permanently delete karna chahte hain?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={executeDelete}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-bold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW/EDIT STUDENT ADMISSION MODAL (Click outside to close) */}
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
            className="bg-white border border-neutral-200 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start border-b border-neutral-200 pb-3">
              <div>
                <h3 className="font-bold text-neutral-900 text-base flex items-center gap-1.5">
                  <span className="text-neutral-700 text-lg">+</span> {editStudent ? "Edit Student Details" : "New Student Admission"}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Enter details to enroll or update a library member
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditStudent(null);
                }}
                className="w-6 h-6 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 font-bold text-xs transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div className="space-y-2.5">
                <p className="text-[11px] font-bold text-blue-600 flex items-center gap-1 tracking-wider uppercase">
                  <span>👤</span> BASIC DETAILS
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px]">STUDENT NAME *</label>
                    <input
                      type="text"
                      required
                      placeholder="FULL NAME"
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 uppercase focus:outline-none focus:border-blue-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px]">FATHER'S NAME *</label>
                    <input
                      type="text"
                      required
                      placeholder="FATHER'S NAME"
                      value={formData.fatherName || ""}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value.toUpperCase() })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 uppercase focus:outline-none focus:border-blue-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-neutral-600 font-bold mb-1.5 uppercase text-[10px]">GENDER</label>
                    <div className="flex items-center gap-4 text-neutral-700 font-semibold pt-1">
                      {["Male", "Female", "Other"].map((g) => (
                        <label key={g} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="gender"
                            value={g}
                            checked={formData.gender === g}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            className="accent-blue-600"
                          />
                          <span>{g}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px]">DATE OF BIRTH</label>
                    <input
                      type="date"
                      value={formData.dob || ""}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-neutral-700 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-neutral-100">
                <p className="text-[11px] font-bold text-blue-600 flex items-center gap-1 tracking-wider uppercase">
                  <span>📞</span> CONTACT & ADDRESS
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px]">MOBILE (WHATSAPP) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="10 DIGIT MOBILE NO."
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px]">PARENTS / ALT CONTACT *</label>
                    <input
                      type="tel"
                      placeholder="10 DIGIT CONTACT NO."
                      value={formData.altPhone || ""}
                      onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px]">ADDRESS</label>
                  <input
                    type="text"
                    placeholder="HOUSE NO, AREA, CITY"
                    value={formData.address || ""}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value.toUpperCase() })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 uppercase focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px]">PINCODE *</label>
                    <input
                      type="text"
                      placeholder="6 DIGIT PINCODE"
                      value={formData.pincode || ""}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px] flex items-center justify-between">
                      <span>AADHAAR NO. (LAST 4 DIGITS) *</span>
                      <span className="text-neutral-400 font-normal text-[9px]">Saves as XXXX-XXXX-LAST4</span>
                    </label>
                    <div className="flex items-center h-[38px] border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50 focus-within:border-blue-500">
                      <span className="bg-neutral-100 text-neutral-500 px-3 py-2 font-mono text-xs border-r border-neutral-200 whitespace-nowrap select-none font-bold">
                        XXXX-XXXX-
                      </span>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="1234"
                        value={formData.idProof ? formData.idProof.replace(/\D/g, "").slice(-4) : ""}
                        onChange={(e) => setFormData({ ...formData, idProof: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                        className="w-full bg-transparent px-3 py-2 text-neutral-800 font-mono tracking-widest text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-neutral-100">
                <p className="text-[11px] font-bold text-blue-600 flex items-center gap-1 tracking-wider uppercase">
                  <span>📚</span> LIBRARY MEMBERSHIP
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px]">STATUS</label>
                    <select
                      value={formData.status || "Active"}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px]">STATUS TYPE</label>
                    <select
                      value={formData.studentType || "Reserved"}
                      onChange={(e) => setFormData({ ...formData, studentType: e.target.value as any })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Reserved">Reserved</option>
                      <option value="Unreserved">Unreserved</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px]">ADMISSION DATE *</label>
                    <input
                      type="date"
                      required
                      value={formData.admDate || ""}
                      onChange={(e) => {
                        const ren = calculateRenewalDateFromBase(e.target.value, formData.plan);
                        setFormData({ ...formData, admDate: e.target.value, renDate: ren });
                      }}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-neutral-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px] flex items-center justify-between">
                      <span>RENEWAL DATE *</span>
                      <span className="text-emerald-600 text-[9px] font-semibold">Auto-calculated</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.renDate || ""}
                      onChange={(e) => setFormData({ ...formData, renDate: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-neutral-800 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px]">PLAN DURATION</label>
                    <select
                      value={formData.plan || "1 Month"}
                      onChange={(e) => {
                        const plan = e.target.value;
                        const ren = calculateRenewalDateFromBase(formData.admDate, plan);
                        const autoFee = PLAN_FEE_RATES[plan] ?? 1200;
                        setFormData({ ...formData, plan, renDate: ren, monthlyFee: autoFee });
                      }}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="6hrs/Month">6hrs/Month</option>
                      <option value="1 Month">1 Month</option>
                      <option value="3 Month">3 Month</option>
                      <option value="6 Month">6 Month</option>
                      <option value="9 Month">9 Month</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px] flex items-center justify-between">
                      <span>FEE AMOUNT (₹) *</span>
                      <span className="text-neutral-400 text-[9px] font-normal">Editable</span>
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 1200"
                      value={formData.monthlyFee === "" ? "" : formData.monthlyFee}
                      onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value === "" ? "" : Number(e.target.value) })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 font-bold text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px]">SELECT ROW</label>
                    <select
                      value={formData.selectedRow || "None"}
                      onChange={(e) => handleRowChange(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="None">None / No Seat (Seat nahi dena)</option>
                      {LIBRARY_SECTIONS.map((sec) => (
                        <option key={sec.name} value={sec.name}>
                          {sec.name} ({sec.count} Seats)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px] flex items-center justify-between">
                      <span>SELECT AVAILABLE SEAT</span>
                      <span className="text-emerald-600 text-[9px] font-bold">Only Free Seats</span>
                    </label>
                    <select
                      disabled={formData.selectedRow === "None"}
                      value={formData.selectedSeatNum || ""}
                      onChange={(e) => handleSeatNumChange(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 font-bold focus:outline-none focus:border-blue-500 cursor-pointer disabled:bg-neutral-100 disabled:text-neutral-400"
                    >
                      {formData.selectedRow === "None" ? (
                        <option value="">No Seat Allotted (-)</option>
                      ) : getAvailableSeatsForRow(formData.selectedRow || "", editStudent?.seatNo).length === 0 ? (
                        <option value="">No Free Seats in this Row</option>
                      ) : (
                        <>
                          <option value="none">No Seat (-)</option>
                          {getAvailableSeatsForRow(formData.selectedRow || "", editStudent?.seatNo).map((num) => (
                            <option key={num} value={num}>
                              Seat #{num}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px]">BATCH / SHIFT</label>
                    <input
                      type="text"
                      placeholder="E.G. MORNING (6 AM - 2 PM), FULL DAY"
                      value={formData.batch || ""}
                      onChange={(e) => setFormData({ ...formData, batch: e.target.value.toUpperCase() })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 uppercase focus:outline-none focus:border-blue-500 placeholder:text-neutral-400 font-normal"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-600 font-bold mb-1 uppercase text-[10px]">COURSE / TARGET EXAM</label>
                    <input
                      type="text"
                      placeholder="TARGET EXAM (E.G. UPSC, SSC, GATE, NEET)"
                      value={formData.course || ""}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value.toUpperCase() })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-neutral-800 uppercase focus:outline-none focus:border-blue-500 placeholder:text-neutral-400 font-normal"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditStudent(null);
                  }}
                  className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-100 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg transition shadow-md shadow-blue-500/20"
                >
                  {isSubmitting ? "Saving..." : editStudent ? "Update & Save" : "Confirm & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
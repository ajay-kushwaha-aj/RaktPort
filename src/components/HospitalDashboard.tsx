import React, { useState, useMemo, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import QRious from "qrious";
import {
  Bell,
  LogOut,
  Plus,
  QrCode,
  Copy,
  Trash2,
  X,
  Printer,
  FileText,
  Activity,
  Droplet,
  Gift,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Siren,
  FileDown,
  Phone,
  PieChart,
  AlertCircle,
  Search,
  Shield,
  MapPin,
  User,
  Stethoscope,
  Building2,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import logo from '../assets/raktsetu-logo.jpg';

// --- FIREBASE IMPORTS ---
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';

// @ts-ignore
import { BLOOD_GROUPS, generateRtid } from "@/lib/bloodbank-utils";

// ============= TYPES =============

type BloodGroup = "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";
type RequestStatus =
  | "CREATED"
  | "PENDING"
  | "PROCESSING"
  | "PLEDGED"
  | "PARTIAL"
  | "REDEEMED"
  | "HOSPITAL VERIFIED"
  | "CLOSED"
  | "EXPIRED"
  | "CANCELLED";

type UrgencyLevel = "Normal" | "High" | "Critical";

type BloodComponentType =
  | "Whole Blood"
  | "PRBC"
  | "Platelets"
  | "FFP"
  | "Cryoprecipitate";

type TransfusionIndication =
  | "Anemia"
  | "Surgery"
  | "Trauma"
  | "Oncology"
  | "Obstetric"
  | "Hemorrhage"
  | "Other";

interface DonorInfo {
  dRtid: string;
  name: string;
  date: string;
}

interface BloodRequest {
  id: string;
  rtid: string;
  serialNumber?: string;
  patientName: string;
  bloodGroup: BloodGroup;
  componentType?: BloodComponentType;
  transfusionIndication?: TransfusionIndication;
  unitsRequired: number;
  unitsFulfilled: number;
  requiredBy: Date;
  status: RequestStatus;
  city: string;
  createdAt: Date;
  patientMobile: string;
  patientAadhaar: string;
  pincode: string;
  age?: number;
  urgency?: UrgencyLevel;
  donors?: DonorInfo[];
  doctorName?: string;
  doctorRegNo?: string;
  wardDepartment?: string;
  bedNumber?: string;
  validityHours?: number;
  scannedAt?: string;
  scannedLocation?: string;
  redeemedAt?: Date;
  generatedBy?: string;
  systemVersion?: string;
}

interface Notification {
  id: string;
  message: string;
  time: string;
  type: "new" | "update" | "alert";
}

// ============= CONSTANTS =============

const HOSPITAL_NAME_DEFAULT = "Hospital";
const SYSTEM_VERSION = "v2.1.0";

const BLOOD_COMPONENT_TYPES: BloodComponentType[] = [
  "Whole Blood",
  "PRBC",
  "Platelets",
  "FFP",
  "Cryoprecipitate"
];

const TRANSFUSION_INDICATIONS: TransfusionIndication[] = [
  "Anemia",
  "Surgery",
  "Trauma",
  "Oncology",
  "Obstetric",
  "Hemorrhage",
  "Other"
];

const initialNotifications: Notification[] = [
  {
    id: "1",
    message: "System connected to Firebase Database.",
    time: "Just now",
    type: "new",
  },
];

// ============= UTILITIES =============

const formatDate = (date: Date): string => {
  if (!date || isNaN(date.getTime())) return "Invalid Date";
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatTime = (date: Date): string => {
  if (!date || isNaN(date.getTime())) return "";
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const generateSerialNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `REQ/${year}/${month}/${random}`;
};

const calculateValidity = (urgency: UrgencyLevel): number => {
  switch (urgency) {
    case "Critical": return 12;
    case "High": return 24;
    case "Normal": return 24;
    default: return 24;
  }
};

const isRequestValid = (request: BloodRequest): boolean => {
  if (!request.validityHours || !request.createdAt) return true;
  const validUntil = new Date(request.createdAt.getTime() + request.validityHours * 60 * 60 * 1000);
  return new Date() < validUntil;
};

const getTimeRemaining = (request: BloodRequest): string => {
  if (!request.validityHours || !request.createdAt) return "N/A";
  const validUntil = new Date(request.createdAt.getTime() + request.validityHours * 60 * 60 * 1000);
  const now = new Date();
  const diff = validUntil.getTime() - now.getTime();

  if (diff <= 0) return "Expired";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const getQRDataPayload = (request: BloodRequest): string => {
  const dateStr = request.requiredBy
    ? new Date(request.requiredBy).toISOString().replace(/[-:]/g, "").substring(0, 13)
    : "N/A";

  const validityTimestamp = request.requiredBy
    ? new Date(request.requiredBy).toISOString()
    : new Date().toISOString();

  return JSON.stringify({
    rtid: request.rtid,
    serialNumber: request.serialNumber || "",
    name: request.patientName,
    city: request.city,
    bloodGroup: request.bloodGroup,
    componentType: request.componentType || "Whole Blood",
    unitsRequired: request.unitsRequired,
    urgencyLevel: request.urgency || "Normal",
    requiredBy: dateStr,
    validityTimestamp: validityTimestamp,
    createdAt: request.createdAt.toISOString()
  });
};

const getStatusClasses = (status: string): string => {
  const s = status?.toUpperCase();
  switch (s) {
    case "CREATED":
      return "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200";
    case "PENDING":
      return "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200";
    case "PROCESSING":
    case "PLEDGED":
      return "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200";
    case "PARTIAL":
      return "bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200";
    case "REDEEMED":
      return "bg-green-100 text-green-700 border-green-300 hover:bg-green-200";
    case "HOSPITAL VERIFIED":
      return "bg-green-200 text-green-800 border-green-400 hover:bg-green-300";
    case "CLOSED":
      return "bg-gray-200 text-gray-800 border-gray-400 hover:bg-gray-300";
    case "EXPIRED":
    case "CANCELLED":
      return "bg-red-100 text-red-700 border-red-300 hover:bg-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

const getStatusIcon = (status: string) => {
  const s = status?.toUpperCase();
  switch (s) {
    case "CREATED":
      return <FileText className="w-3 h-3 mr-1.5" />;
    case "PENDING":
      return <Clock className="w-3 h-3 mr-1.5" />;
    case "PROCESSING":
    case "PLEDGED":
      return <Activity className="w-3 h-3 mr-1.5" />;
    case "PARTIAL":
      return <PieChart className="w-3 h-3 mr-1.5" />;
    case "REDEEMED":
      return <CheckCircle2 className="w-3 h-3 mr-1.5" />;
    case "HOSPITAL VERIFIED":
      return <CheckCircle className="w-3 h-3 mr-1.5" />;
    case "CLOSED":
      return <CheckCircle2 className="w-3 h-3 mr-1.5" />;
    case "EXPIRED":
    case "CANCELLED":
      return <XCircle className="w-3 h-3 mr-1.5" />;
    default:
      return null;
  }
};

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy:", err);
    return false;
  }
};

// ============= PRINTABLE REQUEST COMPONENT =============

const PrintableRequest = ({
  request,
  hospital,
}: {
  request: BloodRequest | null;
  hospital: any;
}) => {
  const qrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (request && qrRef.current) {
      new QRious({
        element: qrRef.current,
        value: getQRDataPayload(request),
        size: 100,
        level: "H",
      });
    }
  }, [request]);

  if (!request) return null;

  const urgencyStyle =
    request.urgency === "Critical"
      ? "bg-red-100 text-red-700 border-red-500"
      : request.urgency === "High"
        ? "bg-orange-100 text-orange-700 border-orange-500"
        : "bg-green-100 text-green-700 border-green-500";

  const validityRemaining = getTimeRemaining(request);
  const isValid = isRequestValid(request);

  return (
    <>
      <style>{`
        @media print {
          [data-sonner-toast],
          [data-sonner-toaster] {
            display: none !important;
          }

          @page {
            size: A4;
            margin: 10mm;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .emergency-watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 80px;
            font-weight: 900;
            color: rgba(220, 38, 38, 0.06);
            white-space: nowrap;
            pointer-events: none;
            z-index: 0;
          }

          .print-content {
            position: relative;
            z-index: 1;
          }
        }
      `}</style>

      <div className="hidden print:block bg-white font-sans">
        <div className="w-full max-w-[190mm] mx-auto relative">

          {/* EMERGENCY WATERMARK - Only for Critical */}
          {request.urgency === "Critical" && (
            <div className="emergency-watermark">
              CRITICAL EMERGENCY
            </div>
          )}

          <div className="border-[3px] border-gray-900 p-6 flex flex-col print-content" style={{ minHeight: '277mm' }}>

            {/* HEADER */}
            <div className="border-b-2 border-[#8B0000] pb-3 mb-3">
              <div className="flex items-start gap-3">
                <img src={logo} className="h-12 w-12 object-contain flex-shrink-0" alt="Logo" />
                <div className="flex-1">
                  <h1 className="text-xl font-black text-[#8B0000] uppercase leading-tight">
                    RaktPort
                  </h1>
                  <p className="text-[9px] font-bold uppercase text-gray-700 leading-tight">
                    National Digital Blood Donation & Management System
                  </p>
                  <p className="text-[8px] text-gray-500">
                    Ministry of Health & Family Welfare, Govt. of India
                  </p>
                  <p className="text-[10.5px] italic font-semibold text-[#8B0000] mt-0.5">
                    "Donate Blood Anywhere, Save Life Everywhere"
                  </p>
                </div>
                {/* Serial Number in Header */}
                <div className="text-right flex-shrink-0">
                  <p className="text-[8px] text-gray-500 uppercase">Serial No.</p>
                  <p className="font-mono text-[10.5px] font-bold leading-tight">{request.serialNumber}</p>
                  <p className="text-[7px] text-gray-400 mt-0.5">
                    Gen: {new Date(request.createdAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* TITLE */}
            <div className="text-center mb-3">
              <h2 className="text-base font-extrabold uppercase underline">
                Blood Requisition Form
              </h2>
              <p className="text-[9px] text-gray-500 mt-0.5">
                Generated On: {new Date().toLocaleString('en-IN')}
              </p>
            </div>

            {/* URGENCY & VALIDITY ALERT */}
            <div className="flex justify-center gap-3 mb-3">
              <div className={`px-3 py-1.5 border-2 rounded ${urgencyStyle}`}>
                <span className="text-[10px] font-bold uppercase">Urgency: {request.urgency || "Normal"}</span>
              </div>
              <div className={`px-3 py-1.5 border-2 rounded ${isValid ? 'bg-green-50 text-green-700 border-green-500' : 'bg-red-50 text-red-700 border-red-500'}`}>
                <span className="text-[10px] font-bold uppercase">
                  Validity: {validityRemaining}
                </span>
              </div>
            </div>

            {/* PATIENT & HOSPITAL INFO */}
            <div className="grid grid-cols-2 gap-5 mb-3">
              <div>
                <h3 className="font-bold uppercase text-[15px] border-l-4 border-[#8B0000] pl-2 mb-1.5">
                  Patient Information
                </h3>
                <div className="text-[12px] space-y-0.5">
                  <p><b>Name:</b> {request.patientName}</p>
                  <p><b>Age:</b> {request.age || "N/A"} Years</p>
                  <p><b>Mobile:</b> {request.patientMobile}</p>
                  {request.wardDepartment && (
                    <p><b>Ward/Dept:</b> {request.wardDepartment}</p>
                  )}
                  {request.bedNumber && (
                    <p><b>Bed No:</b> {request.bedNumber}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-bold uppercase text-[15px] border-l-4 border-gray-600 pl-2 mb-1.5">
                  Requesting Hospital
                </h3>
                <div className="text-[12px] space-y-0.5">
                  <p><b>Name:</b> {hospital?.fullName || "Hospital"}</p>
                  <p><b>Location:</b> {hospital?.district}, {hospital?.pincode}</p>
                  <p><b>Contact:</b> {hospital?.mobile || "N/A"}</p>
                  {request.doctorName && (
                    <>
                      <p className="mt-1"><b>Doctor:</b> {request.doctorName}</p>
                      {request.doctorRegNo && (
                        <p><b>Reg. No:</b> {request.doctorRegNo}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* RTID CODE */}
            <div className="text-center mb-3">
              <p className="text-[11px] font-semibold mb-1">RTID Code</p>
              <div className="inline-block font-mono px-3 py-1.5 border-2 border-gray-300 bg-gray-50 text-[15px] font-bold">
                {request.rtid}
              </div>
            </div>

            {/* BLOOD COMPONENT REQUIREMENTS */}
            <div className="border-2 border-gray-300 py-3 mb-3">
              <div className="grid grid-cols-4 gap-2 px-3">
                <div className="text-center">
                  <p className="text-[9px] uppercase text-gray-600 font-semibold mb-1">Blood Group</p>
                  <p className="text-3xl font-black text-[#8B0000] leading-tight">
                    {request.bloodGroup}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] uppercase text-gray-600 font-semibold mb-1">Component Type</p>
                  <p className="text-[15px] font-bold leading-tight mt-1">
                    {request.componentType || "Whole Blood"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] uppercase text-gray-600 font-semibold mb-1">Units Required</p>
                  <p className="text-3xl font-black leading-tight">{request.unitsRequired}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] uppercase text-gray-600 font-semibold mb-1">Required By</p>
                  <p className="font-bold text-sm leading-tight mt-1">{formatDate(request.requiredBy)}</p>
                  <p className="text-[10px] leading-tight">{formatTime(request.requiredBy)}</p>
                </div>
              </div>
            </div>

            {/* TRANSFUSION INDICATION */}
            {request.transfusionIndication && (
              <div className="bg-blue-50 border border-blue-200 rounded px-3 py-1.5 mb-3">
                <p className="text-[10px] font-bold uppercase text-blue-900">Indication for Transfusion:</p>
                <p className="text-[12px] font-semibold text-blue-700">{request.transfusionIndication}</p>
              </div>
            )}

            {/* CLINICAL SAFETY WARNING */}
            <div className="bg-red-50 border-2 border-red-300 rounded px-3 py-2 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold uppercase text-red-900 mb-1">
                    ⚠️ Compatibility & Safety Requirements
                  </p>
                  <ul className="text-[9.5px] text-red-800 space-y-0.5 list-disc list-inside leading-snug">
                    <li><b>Mandatory cross-matching</b> required before transfusion</li>
                    <li><b>Emergency uncross-matched blood</b> only if immediately life-threatening</li>
                    <li>Verify patient identity and blood component type before administration</li>
                    <li>Monitor patient for transfusion reactions during and after procedure</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* FOOTER - Pushed to bottom with flex-grow */}
            <div className="border-t-2 border-gray-800 pt-3 mt-auto">
              <div className="flex gap-3 items-start">

                {/* QR CODE */}
                <div className="flex flex-col items-center justify-start flex-shrink-0" style={{ width: "105px" }}>
                  <canvas ref={qrRef} width={100} height={100} />
                  <p className="text-[8px] text-center mt-1 font-semibold">Scan to Verify</p>
                </div>

                {/* METADATA & DISCLAIMER */}
                <div className="text-[8px] text-gray-700 leading-snug flex-1">
                  <p className="font-bold uppercase text-[8.5px] mb-0.5">Digital Signature & Metadata:</p>
                  <p className="mb-0.5">Generated by: <span className="font-semibold">{request.generatedBy || hospital?.fullName}</span></p>
                  <p className="mb-0.5">System: RaktPort {request.systemVersion || SYSTEM_VERSION}</p>
                  <p className="mb-1.5">Timestamp: {new Date(request.createdAt).toLocaleString('en-IN')} IST</p>

                  <p className="font-bold uppercase text-[8.5px] mb-0.5">Disclaimer:</p>
                  <p className="leading-snug">
                    This document is electronically generated by the RaktPort Digital Platform. Blood issued
                    against this request must be cross-matched before transfusion. Validation of this request is
                    subject to the authenticity of the QR code and validity period. This requisition becomes
                    invalid after redemption or expiry.
                  </p>
                </div>

                {/* SIGNATURE */}
                <div className="w-32 text-center flex-shrink-0">
                  <div className="h-10 border-b border-gray-400 mb-1"></div>
                  <p className="text-[8.5px] font-bold uppercase leading-tight">
                    Authorized Signatory
                  </p>
                  <p className="text-[7.5px] leading-tight">
                    (Medical Officer / In-Charge)
                  </p>
                  <p className="text-[7px] text-gray-500 mt-1">
                    Date: {formatDate(new Date())}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

// ============= FIXED NEW REQUEST MODAL COMPONENT =============

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  defaultCity: string;
  defaultPincode: string;
  defaultUrgency: UrgencyLevel;
  hospitalName: string;
}

const NewRequestModal = ({
  isOpen,
  onClose,
  onSubmit,
  defaultCity,
  defaultPincode,
  defaultUrgency,
  hospitalName,
}: NewRequestModalProps) => {
  const [patientName, setPatientName] = useState("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | "">("");
  const [componentType, setComponentType] = useState<BloodComponentType>("Whole Blood");
  const [transfusionIndication, setTransfusionIndication] = useState<TransfusionIndication>("Anemia");
  const [unitsRequired, setUnitsRequired] = useState("1");
  const [requiredByDate, setRequiredByDate] = useState(new Date().toISOString().split("T")[0]);
  const [requiredByTime, setRequiredByTime] = useState("12:00");
  const [age, setAge] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [pincode, setPincode] = useState(defaultPincode);
  const [mobile, setMobile] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [urgency, setUrgency] = useState<UrgencyLevel>(defaultUrgency);
  const [doctorName, setDoctorName] = useState("");
  const [doctorRegNo, setDoctorRegNo] = useState("");
  const [wardDepartment, setWardDepartment] = useState("");
  const [bedNumber, setBedNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrgency(defaultUrgency);
      setCity(defaultCity);
      setPincode(defaultPincode);
    }
  }, [isOpen, defaultUrgency, defaultCity, defaultPincode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isSubmitting) return;

    // **FIX 2: Comprehensive validation with better error messages**
    try {
      if (!patientName?.trim()) {
        toast.error("Patient name is required");
        return;
      }

      if (!bloodGroup) {
        toast.error("Please select a blood group");
        return;
      }

      if (!age || parseInt(age) <= 0 || parseInt(age) > 120) {
        toast.error("Please enter a valid age (1-120)");
        return;
      }

      if (!mobile?.trim() || mobile.length !== 10) {
        toast.error("Please enter a valid 10-digit mobile number");
        return;
      }

      if (!aadhaar?.trim() || aadhaar.length !== 12) {
        toast.error("Please enter a valid 12-digit Aadhaar number");
        return;
      }

      if (!city?.trim()) {
        toast.error("City is required");
        return;
      }

      if (!pincode?.trim() || pincode.length !== 6) {
        toast.error("Please enter a valid 6-digit pincode");
        return;
      }

      if (!requiredByDate) {
        toast.error("Required by date is mandatory");
        return;
      }

      if (!requiredByTime) {
        toast.error("Required by time is mandatory");
        return;
      }

      setIsSubmitting(true);

      // Prepare data with proper formatting
      const formData = {
        patientName: patientName.trim(),
        bloodGroup: bloodGroup,
        componentType: componentType,
        transfusionIndication: transfusionIndication,
        unitsRequired: parseInt(unitsRequired) || 1,
        requiredByDate: requiredByDate,
        requiredByTime: requiredByTime,
        age: parseInt(age),
        city: city.trim(),
        pincode: pincode.trim(),
        mobile: mobile.trim(),
        aadhaar: aadhaar.trim(),
        urgency: urgency,
        doctorName: doctorName?.trim() || null,
        doctorRegNo: doctorRegNo?.trim() || null,
        wardDepartment: wardDepartment?.trim() || null,
        bedNumber: bedNumber?.trim() || null,
      };

      // Call the submit handler
      await onSubmit(formData);

      // **FIX: Reset form only after successful submission**
      setPatientName("");
      setBloodGroup("");
      setComponentType("Whole Blood");
      setTransfusionIndication("Anemia");
      setUnitsRequired("1");
      setAge("");
      setMobile("");
      setAadhaar("");
      setDoctorName("");
      setDoctorRegNo("");
      setWardDepartment("");
      setBedNumber("");
      setRequiredByDate(new Date().toISOString().split("T")[0]);
      setRequiredByTime("12:00");

    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNumericInput = (setter: (val: string) => void, maxLength: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '').slice(0, maxLength);
      setter(val);
    };

  const validityHours = calculateValidity(urgency);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && !isSubmitting) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center gap-2 text-2xl">
            🩸 New Patient Blood Request
          </DialogTitle>
          <DialogDescription>
            Generate a unique RTID for immediate blood requirements. All fields marked with * are mandatory.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">

          {/* URGENCY LEVEL */}
          <div className="bg-red-50 p-3 rounded-md border border-red-100">
            <Label htmlFor="urgency" className="text-xs font-semibold text-red-700 uppercase mb-1 block">
              Urgency Level *
            </Label>
            <Select value={urgency} onValueChange={(v) => setUrgency(v as UrgencyLevel)}>
              <SelectTrigger className="bg-white border-red-200 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Normal">Normal (Valid: 24 hours)</SelectItem>
                <SelectItem value="High">High Priority (Valid: 24 hours)</SelectItem>
                <SelectItem value="Critical">Critical Emergency (Valid: 12 hours)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-red-600 mt-1">
              ⏱️ This request will be valid for <b>{validityHours} hours</b> from creation
            </p>
          </div>

          {/* PATIENT INFORMATION */}
          <div className="space-y-3 p-4 bg-blue-50 rounded-md border border-blue-200">
            <h3 className="font-bold text-sm text-blue-900 uppercase flex items-center gap-2">
              <User className="w-4 h-4" /> Patient Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name *</Label>
              <Input
                id="patientName"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
                placeholder="Full name as per ID"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age (Years) *</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  placeholder="Enter age"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile No. *</Label>
                <Input
                  id="mobile"
                  value={mobile}
                  onChange={handleNumericInput(setMobile, 10)}
                  maxLength={10}
                  required
                  placeholder="10-digit number"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aadhaar">Aadhaar No. *</Label>
                <Input
                  id="aadhaar"
                  value={aadhaar}
                  onChange={handleNumericInput(setAadhaar, 12)}
                  maxLength={12}
                  required
                  placeholder="12-digit number"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedNumber">Bed Number (Optional)</Label>
                <Input
                  id="bedNumber"
                  value={bedNumber}
                  onChange={(e) => setBedNumber(e.target.value)}
                  placeholder="e.g., ICU-12, Ward-A-23"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wardDepartment">Ward / Department (Optional)</Label>
              <Input
                id="wardDepartment"
                value={wardDepartment}
                onChange={(e) => setWardDepartment(e.target.value)}
                placeholder="e.g., ICU, Emergency, OT, Cardiology"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* BLOOD COMPONENT REQUIREMENTS */}
          <div className="space-y-3 p-4 bg-red-50 rounded-md border border-red-200">
            <h3 className="font-bold text-sm text-red-900 uppercase flex items-center gap-2">
              <Droplet className="w-4 h-4" /> Blood Component Requirements
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bloodGroup">Blood Group *</Label>
                <Select
                  value={bloodGroup}
                  onValueChange={(value) => setBloodGroup(value as BloodGroup)}
                  required
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Blood Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map((bg: string) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="componentType">Component Type *</Label>
                <Select
                  value={componentType}
                  onValueChange={(value) => setComponentType(value as BloodComponentType)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_COMPONENT_TYPES.map((comp) => (
                      <SelectItem key={comp} value={comp}>{comp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitsRequired">Units Required *</Label>
                <Input
                  id="unitsRequired"
                  type="number"
                  min="1"
                  max="20"
                  value={unitsRequired}
                  onChange={(e) => setUnitsRequired(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transfusionIndication">Indication *</Label>
                <Select
                  value={transfusionIndication}
                  onValueChange={(value) => setTransfusionIndication(value as TransfusionIndication)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSFUSION_INDICATIONS.map((ind) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ATTENDING DOCTOR INFORMATION */}
          <div className="space-y-3 p-4 bg-green-50 rounded-md border border-green-200">
            <h3 className="font-bold text-sm text-green-900 uppercase flex items-center gap-2">
              <Stethoscope className="w-4 h-4" /> Attending Doctor (Optional)
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doctorName">Doctor Name</Label>
                <Input
                  id="doctorName"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="Dr. Full Name"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctorRegNo">Registration No.</Label>
                <Input
                  id="doctorRegNo"
                  value={doctorRegNo}
                  onChange={(e) => setDoctorRegNo(e.target.value)}
                  placeholder="MCI Reg. Number"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* LOCATION & TIMING */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-md border border-gray-200">
            <h3 className="font-bold text-sm text-gray-900 uppercase flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Location & Required By
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={pincode}
                  onChange={handleNumericInput(setPincode, 6)}
                  maxLength={6}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requiredByDate">Required By Date *</Label>
                <Input
                  id="requiredByDate"
                  type="date"
                  value={requiredByDate}
                  onChange={(e) => setRequiredByDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requiredByTime">Required By Time *</Label>
                <Input
                  id="requiredByTime"
                  type="time"
                  value={requiredByTime}
                  onChange={(e) => setRequiredByTime(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTONS */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={`flex-1 text-white ${urgency === 'Critical'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#8B0000] hover:bg-[#6B0000]'
                }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Generate RTID & Print'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ============= HEADER COMPONENT =============

interface HeaderProps {
  hospitalName: string;
  notificationCount: number;
  onNotificationClick: () => void;
  onLogout: () => void;
}

const Header = ({
  hospitalName,
  notificationCount,
  onNotificationClick,
  onLogout,
}: HeaderProps) => {
  return (
    <header className="bg-[#8B0000] text-white py-4 shadow-lg relative z-50 no-print">
      <div className="container mx-auto px-4 flex justify-between items-center max-w-7xl">
        <div className="flex items-center space-x-3 flex-1">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-white/20 shadow-md">
            <img src={logo} alt="RaktPort Logo" className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight">RaktPort Hospital Portal</div>
            <p className="text-xs text-red-100 opacity-90">National Blood Management System</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={onNotificationClick}
            className="relative p-2 hover:bg-white/10 rounded-full transition duration-200"
          >
            <Bell className="w-6 h-6" />
            {notificationCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-yellow-500 text-black text-xs font-bold border border-white">
                {notificationCount}
              </Badge>
            )}
          </button>
          <Button
            onClick={onLogout}
            variant="secondary"
            size="sm"
            className="gap-2 font-semibold shadow-sm hover:bg-red-50 text-[#8B0000]"
          >
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

// ============= KPI CARD =============

interface KPICardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
}

const KPICard = ({ label, value, icon: Icon, colorClass }: KPICardProps) => {
  return (
    <Card className={`card-hover border-l-4 ${colorClass} shadow-sm bg-white`}>
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider text-[10px]">
            {label}
          </p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-opacity-10 ${colorClass.replace('border-l-', 'bg-')}`}>
          <Icon className={`w-6 h-6 ${colorClass.replace('border-l-', 'text-')}`} />
        </div>
      </CardContent>
    </Card>
  );
};

// ============= QR CODE CANVAS =============

const QRCodeCanvas = ({ data, size = 256 }: { data: string, size?: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && data) {
      try {
        const context = canvasRef.current.getContext('2d');
        if (context) context.clearRect(0, 0, size, size);
        new QRious({
          element: canvasRef.current,
          value: data,
          size: size,
          foreground: "#8B0000",
          level: "H"
        });
      } catch (e) {
        console.error(e);
      }
    }
  }, [data, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded" />;
};

// ============= QR MODAL =============

const QRModal = ({
  isOpen,
  onClose,
  request
}: {
  isOpen: boolean,
  onClose: () => void,
  request: BloodRequest | null
}) => {
  if (!request) return null;

  const isValid = isRequestValid(request);
  const validityRemaining = getTimeRemaining(request);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center gap-2 text-lg">
            <QrCode className="w-5 h-5" />
            QR Code — {request.rtid}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Scan this QR code at any blood bank to verify and process this request
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-2">
          {/* QR Code */}
          <div className="relative">
            <div className="bg-white p-3 rounded-lg border-2 border-gray-200">
              <QRCodeCanvas key={request.rtid} data={getQRDataPayload(request)} size={200} />
            </div>
            {!isValid && (
              <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center rounded-lg">
                <Badge variant="destructive" className="text-xs font-bold">EXPIRED</Badge>
              </div>
            )}
          </div>

          {/* Request Details */}
          <div className="w-full space-y-2 bg-gray-50 p-3 rounded-lg border">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Patient</p>
                <p className="text-sm font-semibold text-gray-800">{request.patientName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Blood Group</p>
                <p className="text-sm font-semibold">{request.bloodGroup}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Component</p>
                <p className="text-sm font-semibold">{request.componentType || "Whole Blood"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Units</p>
                <p className="text-sm font-semibold">{request.unitsRequired}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Serial Number</p>
              <p className="text-xs font-mono bg-white px-2 py-1 rounded border">{request.serialNumber}</p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 justify-center">
            {request.urgency === 'Critical' && (
              <Badge variant="destructive" className="animate-pulse text-xs">
                <Siren className="w-3 h-3 mr-1" />
                Critical Emergency
              </Badge>
            )}
            {request.urgency === 'High' && (
              <Badge variant="default" className="bg-orange-500 text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                High Priority
              </Badge>
            )}
            <Badge
              variant={isValid ? "default" : "destructive"}
              className="flex items-center gap-1 text-xs"
            >
              <Clock className="w-3 h-3" />
              Valid: {validityRemaining}
            </Badge>
            <Badge variant="outline" className={`${getStatusClasses(request.status)} text-xs`}>
              {getStatusIcon(request.status)}
              {request.status}
            </Badge>
          </div>

          {/* Verification Info */}
          {request.status === 'REDEEMED' && request.redeemedAt && (
            <div className="w-full bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="font-semibold text-green-900 text-sm flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Redeemed Successfully
              </p>
              <p className="text-xs text-green-700 mt-1">
                {new Date(request.redeemedAt).toLocaleString('en-IN')}
              </p>
              {request.scannedLocation && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Location: {request.scannedLocation}
                </p>
              )}
            </div>
          )}

          {!isValid && request.status !== 'REDEEMED' && (
            <div className="w-full bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="font-semibold text-red-900 text-sm flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                Request Expired
              </p>
              <p className="text-xs text-red-700 mt-1">
                This request has exceeded its validity period and cannot be processed.
              </p>
            </div>
          )}
        </div>

        <Button onClick={onClose} className="w-full mt-2">Close</Button>
      </DialogContent>
    </Dialog>
  );
};

// ============= NOTIFICATION DRAWER =============

const NotificationDrawer = ({
  isOpen,
  notifications,
  onClose
}: {
  isOpen: boolean,
  notifications: Notification[],
  onClose: () => void
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40 no-print" onClick={onClose} />
      <Card className="fixed top-[68px] right-4 w-80 max-h-[80vh] overflow-y-auto z-50 transition-all duration-300 ease-out no-print">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">Notifications</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="divide-y">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notif) => (
              <div key={notif.id} className="p-4 hover:bg-muted/50 cursor-pointer">
                <p className="text-sm mb-1">{notif.message}</p>
                <p className="text-xs text-muted-foreground">{notif.time}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </>
  );
};

// ============= REQUESTS TABLE COMPONENT =============

const RequestsTable = ({
  requests,
  onViewQR,
  onCopyRTID,
  onDelete,
  onPrint,
  onConfirmReceipt
}: any) => {
  const [filterBG, setFilterBG] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const filteredRequests = (Array.isArray(requests) ? requests : []).filter((req: BloodRequest) => {
    const bgMatch = filterBG === "All" || req.bloodGroup === filterBG;
    const searchMatch =
      req.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.rtid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.serialNumber && req.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    let statusMatch = true;
    if (filterStatus !== "All") {
      if (filterStatus === "VALID") {
        statusMatch = isRequestValid(req) && !['REDEEMED', 'EXPIRED', 'CANCELLED'].includes(req.status);
      } else if (filterStatus === "EXPIRED") {
        statusMatch = !isRequestValid(req) || req.status === 'EXPIRED';
      } else {
        statusMatch = req.status === filterStatus;
      }
    }

    return bgMatch && searchMatch && statusMatch;
  });

  const handleShowDonorDetails = (donor: DonorInfo) => {
    Swal.fire({
      title: 'Donor Details',
      html: `
        <div class="text-left space-y-2">
          <p><strong>Name:</strong> ${donor.name}</p>
          <p><strong>D-RTID:</strong> <span class="font-mono bg-gray-100 px-1 rounded">${donor.dRtid}</span></p>
          <p><strong>Date:</strong> ${new Date(donor.date).toLocaleDateString()}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonColor: '#8B0000',
    });
  };

  const handleViewRequestDetails = (request: BloodRequest) => {
    const isValid = isRequestValid(request);
    const validityRemaining = getTimeRemaining(request);

    Swal.fire({
      title: `Request Details - ${request.rtid}`,
      html: `
        <div class="text-left space-y-3 text-sm">
          <div class="bg-blue-50 p-3 rounded">
            <p class="font-bold text-blue-900 mb-2">Patient Information</p>
            <p><strong>Name:</strong> ${request.patientName}</p>
            <p><strong>Age:</strong> ${request.age || 'N/A'} years</p>
            <p><strong>Mobile:</strong> ${request.patientMobile}</p>
            ${request.wardDepartment ? `<p><strong>Ward/Dept:</strong> ${request.wardDepartment}</p>` : ''}
            ${request.bedNumber ? `<p><strong>Bed:</strong> ${request.bedNumber}</p>` : ''}
          </div>

          <div class="bg-red-50 p-3 rounded">
            <p class="font-bold text-red-900 mb-2">Blood Requirements</p>
            <p><strong>Blood Group:</strong> ${request.bloodGroup}</p>
            <p><strong>Component:</strong> ${request.componentType || 'Whole Blood'}</p>
            <p><strong>Units:</strong> ${request.unitsFulfilled} / ${request.unitsRequired}</p>
            ${request.transfusionIndication ? `<p><strong>Indication:</strong> ${request.transfusionIndication}</p>` : ''}
          </div>

          ${request.doctorName ? `
            <div class="bg-green-50 p-3 rounded">
              <p class="font-bold text-green-900 mb-2">Attending Doctor</p>
              <p><strong>Name:</strong> ${request.doctorName}</p>
              ${request.doctorRegNo ? `<p><strong>Reg. No:</strong> ${request.doctorRegNo}</p>` : ''}
            </div>
          ` : ''}

          <div class="bg-gray-50 p-3 rounded">
            <p class="font-bold text-gray-900 mb-2">Status & Validity</p>
            <p><strong>Status:</strong> ${request.status}</p>
            <p><strong>Urgency:</strong> ${request.urgency || 'Normal'}</p>
            <p><strong>Validity:</strong> <span class="${isValid ? 'text-green-600' : 'text-red-600'} font-semibold">${validityRemaining}</span></p>
            <p><strong>Required By:</strong> ${formatDate(request.requiredBy)} ${formatTime(request.requiredBy)}</p>
            <p><strong>Serial No:</strong> <span class="font-mono text-xs">${request.serialNumber || 'N/A'}</span></p>
          </div>

          ${request.status === 'REDEEMED' && request.redeemedAt ? `
            <div class="bg-green-50 p-3 rounded border border-green-300">
              <p class="font-bold text-green-900 mb-2">✓ Redemption Details</p>
              <p><strong>Redeemed At:</strong> ${new Date(request.redeemedAt).toLocaleString('en-IN')}</p>
              ${request.scannedLocation ? `<p><strong>Location:</strong> ${request.scannedLocation}</p>` : ''}
            </div>
          ` : ''}
        </div>
      `,
      width: '600px',
      confirmButtonColor: '#8B0000',
      confirmButtonText: 'Close'
    });
  };

  const handleConfirmReceipt = (request: BloodRequest) => {
    Swal.fire({
      title: 'Confirm Blood Receipt',
      html: `
        <div class="text-left space-y-3">
          <p class="text-sm text-gray-700">You are about to confirm that you have received:</p>
          <div class="bg-blue-50 p-3 rounded border border-blue-200">
            <p><strong>RTID:</strong> <span class="font-mono">${request.rtid}</span></p>
            <p><strong>Patient:</strong> ${request.patientName}</p>
            <p><strong>Blood Group:</strong> ${request.bloodGroup}</p>
            <p><strong>Component:</strong> ${request.componentType || 'Whole Blood'}</p>
            <p><strong>Units Required:</strong> ${request.unitsRequired}</p>
          </div>
          <p class="text-sm text-red-600 font-semibold">⚠️ This action cannot be undone. The request will be marked as REDEEMED.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Confirm Receipt',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        onConfirmReceipt(request.id, request);
      }
    });
  };

  return (
    <div className="space-y-4 mt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Active Requests</h2>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Name, RTID, Serial..."
              className="pl-9 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Blood Group Filter */}
          <Select value={filterBG} onValueChange={setFilterBG}>
            <SelectTrigger className="w-[120px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Groups</SelectItem>
              {BLOOD_GROUPS.map((bg: string) => (
                <SelectItem key={bg} value={bg}>{bg}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="VALID">Valid</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="DONATED">Donated</SelectItem>
              <SelectItem value="REDEEMED">Redeemed</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-bold text-gray-700">RTID / Serial</TableHead>
              <TableHead className="font-bold text-gray-700">Patient</TableHead>
              <TableHead className="font-bold text-gray-700">Blood Info</TableHead>
              <TableHead className="font-bold text-gray-700">Units</TableHead>
              <TableHead className="font-bold text-gray-700">Required By</TableHead>
              <TableHead className="font-bold text-gray-700">Status</TableHead>
              <TableHead className="font-bold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No requests found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request: BloodRequest) => {
                let displayStatus = request.status;
                const isValid = isRequestValid(request);

                // Auto-expire logic - mark as EXPIRED if validity expired
                if (!isValid && !['REDEEMED', 'HOSPITAL VERIFIED', 'CLOSED', 'CANCELLED'].includes(request.status)) {
                  displayStatus = 'EXPIRED' as RequestStatus;
                } else {
                  // Normal status flow: CREATED → PENDING → PROCESSING/PLEDGED → PARTIAL → REDEEMED → HOSPITAL VERIFIED → CLOSED
                  // Keep current status if valid, otherwise determine from fulfillment
                  if (request.unitsFulfilled === 0 && ['CREATED', 'PENDING'].includes(request.status)) {
                    displayStatus = 'PENDING' as RequestStatus;
                  } else if (request.unitsFulfilled > 0 && request.unitsFulfilled < request.unitsRequired && !['REDEEMED', 'HOSPITAL VERIFIED', 'CLOSED'].includes(request.status)) {
                    displayStatus = 'PARTIAL' as RequestStatus;
                  } else if (request.unitsFulfilled >= request.unitsRequired && ['CREATED', 'PENDING', 'PROCESSING', 'PLEDGED', 'PARTIAL'].includes(request.status) && request.status !== 'REDEEMED') {
                    displayStatus = 'PROCESSING' as RequestStatus;
                  }
                  // Otherwise keep the current status
                }

                const validityRemaining = getTimeRemaining(request);
                // Allow hospital verification when status is REDEEMED
                const canVerifyReceipt = request.status === 'REDEEMED' && displayStatus !== 'HOSPITAL VERIFIED' && displayStatus !== 'CLOSED';

                return (
                  <TableRow
                    key={request.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleViewRequestDetails(request)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-1">
                        <div className="font-mono text-xs font-bold text-[#8B0000] flex items-center gap-2">
                          {request.rtid}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5 text-gray-400 hover:text-green-600 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCopyRTID(request.rtid);
                            }}
                            title="Copy RTID"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          {request.urgency === 'Critical' && (
                            <AlertCircle className="w-3 h-3 text-red-600 animate-pulse" />
                          )}
                        </div>
                        {request.serialNumber && (
                          <div className="font-mono text-[10px] text-gray-500">
                            {request.serialNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {request.patientName}
                        </div>
                        {request.age && (
                          <div className="text-xs text-gray-500">
                            {request.age} years
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-1">
                        <Badge
                          variant="outline"
                          className="font-bold bg-white text-gray-700 border-gray-300"
                        >
                          {request.bloodGroup}
                        </Badge>
                        <div className="text-[10px] text-gray-600">
                          {request.componentType || 'Whole Blood'}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {request.unitsFulfilled} / {request.unitsRequired}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase">
                          Collected
                        </span>
                      </div>
                    </TableCell>

                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="text-sm font-medium">
                        {formatDate(request.requiredBy)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(request.requiredBy)}
                      </div>
                    </TableCell>

                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant="outline"
                            className={`border ${getStatusClasses(displayStatus)} flex items-center w-fit whitespace-nowrap text-[10px]`}
                          >
                            {getStatusIcon(displayStatus)}
                            {displayStatus === 'PARTIAL' ? 'Partially Donated' : displayStatus}
                          </Badge>

                          {!['REDEEMED', 'EXPIRED', 'CANCELLED'].includes(displayStatus) && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${isValid ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-700 border-red-300'}`}
                            >
                              <Clock className="w-2.5 h-2.5 mr-1" />
                              {validityRemaining}
                            </Badge>
                          )}
                        </div>

                        {/* Hospital Verification Button */}
                        {canVerifyReceipt && (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 text-white text-[10px] h-6 px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmReceipt(request);
                            }}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Verify & Close
                          </Button>
                        )}

                        {request.unitsFulfilled > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {request.donors && request.donors.length > 0 ? (
                              request.donors.map((donor, i) => (
                                <button
                                  key={i}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShowDonorDetails(donor);
                                  }}
                                  className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 font-mono"
                                >
                                  D{i + 1}
                                </button>
                              ))
                            ) : (
                              Array.from({ length: request.unitsFulfilled }).map((_, i) => (
                                <button
                                  key={i}
                                  className="text-[10px] bg-gray-50 text-gray-600 border border-gray-200 rounded px-1.5 py-0.5 font-mono cursor-default"
                                >
                                  D{i + 1}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPrint(request);
                          }}
                          title="Print"
                          className="hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewQR(request);
                          }}
                          title="QR"
                          className="hover:bg-purple-50 hover:text-purple-600"
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(request.id);
                          }}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete"
                          disabled={request.status === 'REDEEMED'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// ============= MAIN HOSPITAL DASHBOARD COMPONENT =============

const HospitalDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [hospitalData, setHospitalData] = useState<any>(null);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [requestToPrint, setRequestToPrint] = useState<BloodRequest | null>(null);
  const [modalDefaultUrgency, setModalDefaultUrgency] = useState<UrgencyLevel>('Normal');

  const hospitalId = localStorage.getItem('userId');

  // Auto-print effect
  useEffect(() => {
    if (requestToPrint) {
      const timer = setTimeout(() => {
        window.print();
        setRequestToPrint(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [requestToPrint]);

  // Fetch data from Firebase

  useEffect(() => {
    if (!hospitalId) {
      toast.error("You are not logged in.");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch hospital data
        const userRef = doc(db, "users", hospitalId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setHospitalData(userSnap.data());
        } else {
          console.warn("Hospital data not found");
        }

        // Fetch blood requests
        const q = query(
          collection(db, "bloodRequests"),
          where("hospitalId", "==", hospitalId)
        );
        const querySnapshot = await getDocs(q);
        const fetchedRequests: BloodRequest[] = [];

        // **FIX 1: Try to fetch linked donations, but don't fail if permission denied**
        let allLinkedDonations: any[] = [];
        try {
          // Try to fetch only donations linked to this hospital's requests
          const requestRtids = querySnapshot.docs.map(doc => doc.data().rtid || doc.data().linkedRTID).filter(Boolean);

          if (requestRtids.length > 0) {
            // Fetch in batches of 10 (Firestore 'in' operator limit)
            const batchSize = 10;
            for (let i = 0; i < requestRtids.length; i += batchSize) {
              const batch = requestRtids.slice(i, i + batchSize);
              const donQuery = query(
                collection(db, "donations"),
                where("linkedHrtid", "in", batch)
              );
              const donSnapshot = await getDocs(donQuery);
              allLinkedDonations.push(...donSnapshot.docs.map(d => d.data()));
            }
          }
        } catch (donError) {
          console.warn("Could not fetch linked donations. Continuing without donor details.", donError);
          // Continue without crashing - donor details will just be empty
        }

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const parseTime = (t: any) => {
            if (t?.toDate) return t.toDate();
            if (typeof t === 'string') return new Date(t);
            return new Date();
          };

          const linkedDonors = allLinkedDonations
            .filter((d: any) =>
              d.linkedHrtid === data.linkedRTID || d.linkedHrtid === data.rtid
            )
            .map((d: any) => ({
              dRtid: d.rtidCode || d.rtid || 'N/A',
              name: d.donorName || 'Anonymous',
              date: d.date ? parseTime(d.date).toISOString() : new Date().toISOString()
            }));

          fetchedRequests.push({
            id: doc.id,
            rtid: data.linkedRTID || data.rtid,
            serialNumber: data.serialNumber,
            patientName: data.patientName,
            bloodGroup: data.bloodGroup,
            componentType: data.componentType,
            transfusionIndication: data.transfusionIndication,
            unitsRequired: parseInt(data.units) || 0,
            unitsFulfilled: data.fulfilled ? parseInt(data.fulfilled) : linkedDonors.length,
            requiredBy: parseTime(data.requiredBy),
            status: data.status,
            city: data.city,
            createdAt: parseTime(data.createdAt),
            patientMobile: data.patientMobile,
            patientAadhaar: data.patientAadhaar,
            pincode: data.pincode,
            age: data.age ? parseInt(data.age) : undefined,
            urgency: data.urgency,
            donors: linkedDonors,
            doctorName: data.doctorName,
            doctorRegNo: data.doctorRegNo,
            wardDepartment: data.wardDepartment,
            bedNumber: data.bedNumber,
            validityHours: data.validityHours,
            scannedAt: data.scannedAt,
            scannedLocation: data.scannedLocation,
            redeemedAt: data.redeemedAt ? parseTime(data.redeemedAt) : undefined,
            generatedBy: data.generatedBy,
            systemVersion: data.systemVersion,
          });
        });

        fetchedRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // Auto-expire logic: Mark expired requests
        const now = new Date();
        const expiredRequests: string[] = [];
        fetchedRequests.forEach(req => {
          if (req.validityHours && req.createdAt) {
            const validUntil = new Date(req.createdAt.getTime() + req.validityHours * 60 * 60 * 1000);
            if (now > validUntil && !['REDEEMED', 'HOSPITAL VERIFIED', 'CLOSED', 'EXPIRED', 'CANCELLED'].includes(req.status)) {
              expiredRequests.push(req.id);
            }
          }
        });

        // Update expired requests in database (non-blocking)
        if (expiredRequests.length > 0) {
          Promise.all(
            expiredRequests.map(async (reqId) => {
              try {
                const reqRef = doc(db, "bloodRequests", reqId);
                await updateDoc(reqRef, { status: "EXPIRED" });
              } catch (err) {
                console.error(`Failed to expire request ${reqId}:`, err);
              }
            })
          ).catch(err => {
            console.error("Error updating expired requests:", err);
          });

          // Update local state with expired status immediately
          fetchedRequests.forEach(req => {
            if (expiredRequests.includes(req.id)) {
              req.status = "EXPIRED" as RequestStatus;
            }
          });
        }

        setRequests(fetchedRequests);
        toast.success("Dashboard loaded successfully");

      } catch (error: any) {
        console.error("Fetch Error:", error);
        const errorMessage = error?.message || "Unknown error occurred";
        toast.error("Failed to load dashboard data", {
          description: errorMessage
        });
        // **FIX: Don't crash - set empty array so UI still renders**
        setRequests([]);
      }
    };

    fetchData();
  }, [hospitalId]);

  // Handle new request submission
  // Handle new request submission
  const handleNewRequest = async (data: any) => {
    if (!hospitalId) {
      toast.error("Hospital ID not found. Please login again.");
      return;
    }

    try {
      // **FIX: Better date/time handling**
      const requiredByDateTime = new Date(`${data.requiredByDate}T${data.requiredByTime}:00`);

      // Validate the date
      if (isNaN(requiredByDateTime.getTime())) {
        toast.error("Invalid date/time selected");
        return;
      }

      const newHrtid = generateRtid('H');
      const serialNumber = generateSerialNumber();
      const validityHours = calculateValidity(data.urgency);
      const now = new Date();

      const newRequestData = {
        hospitalId: hospitalId,
        bloodBankId: "",
        patientName: data.patientName,
        patientMobile: data.mobile,
        patientAadhaar: data.aadhaar,
        bloodGroup: data.bloodGroup,
        componentType: data.componentType || "Whole Blood",
        transfusionIndication: data.transfusionIndication || "Anemia",
        units: data.unitsRequired.toString(),
        fulfilled: "0",
        age: data.age.toString(),
        city: data.city,
        pincode: data.pincode,
        requiredBy: requiredByDateTime.toISOString(),
        urgency: data.urgency || "Normal",
        status: "CREATED",
        linkedRTID: newHrtid,
        rtid: newHrtid,
        serialNumber: serialNumber,
        validityHours: validityHours,
        createdAt: now.toISOString(),
        doctorName: data.doctorName || "",
        doctorRegNo: data.doctorRegNo || "",
        wardDepartment: data.wardDepartment || "",
        bedNumber: data.bedNumber || "",
        generatedBy: hospitalData?.fullName || HOSPITAL_NAME_DEFAULT,
        systemVersion: SYSTEM_VERSION,
      };

      // **FIX: Add the request to Firestore**
      const docRef = await addDoc(collection(db, "bloodRequests"), newRequestData);

      // **FIX: Create the local request object properly**
      const newRequest: BloodRequest = {
        id: docRef.id,
        rtid: newHrtid,
        serialNumber: serialNumber,
        patientName: data.patientName,
        bloodGroup: data.bloodGroup,
        componentType: data.componentType || "Whole Blood",
        transfusionIndication: data.transfusionIndication || "Anemia",
        unitsRequired: data.unitsRequired,
        unitsFulfilled: 0,
        requiredBy: requiredByDateTime,
        status: "CREATED",
        city: data.city,
        createdAt: now,
        patientMobile: data.mobile,
        patientAadhaar: data.aadhaar,
        pincode: data.pincode,
        age: data.age,
        urgency: data.urgency || "Normal",
        donors: [],
        doctorName: data.doctorName || undefined,
        doctorRegNo: data.doctorRegNo || undefined,
        wardDepartment: data.wardDepartment || undefined,
        bedNumber: data.bedNumber || undefined,
        validityHours: validityHours,
        generatedBy: hospitalData?.fullName || HOSPITAL_NAME_DEFAULT,
        systemVersion: SYSTEM_VERSION,
      };

      // **FIX: Update state properly**
      setRequests(prevRequests => [newRequest, ...prevRequests]);
      setIsRequestModalOpen(false);

      toast.success("Request Created Successfully", {
        description: `RTID ${newHrtid} generated. Serial: ${serialNumber}`
      });

      // Add notification
      setNotifications(prevNotifications => [
        {
          id: Date.now().toString(),
          message: `New ${data.urgency} priority request created for ${data.patientName}`,
          time: "Just now",
          type: "new"
        },
        ...prevNotifications
      ]);

      // Trigger print
      setRequestToPrint(newRequest);

    } catch (error: any) {
      console.error("Create request error:", error);
      toast.error("Failed to create request", {
        description: error?.message || "Please try again"
      });
    }
  };

  // Handle hospital verification and closure
  const handleConfirmReceipt = async (requestId: string, request: BloodRequest) => {
    try {
      const requestRef = doc(db, "bloodRequests", requestId);

      // Update status: REDEEMED → HOSPITAL VERIFIED → CLOSED
      const currentStatus = request.status;
      let newStatus: RequestStatus;

      if (currentStatus === 'REDEEMED') {
        newStatus = 'HOSPITAL VERIFIED';
      } else if (currentStatus === 'HOSPITAL VERIFIED') {
        newStatus = 'CLOSED';
      } else {
        // If somehow not REDEEMED yet, first mark as REDEEMED
        newStatus = 'REDEEMED';
      }

      await updateDoc(requestRef, {
        status: newStatus,
        redeemedAt: currentStatus === 'REDEEMED' ? request.redeemedAt : new Date().toISOString(),
        hospitalVerifiedAt: newStatus === 'HOSPITAL VERIFIED' ? new Date().toISOString() : undefined,
        closedAt: newStatus === 'CLOSED' ? new Date().toISOString() : undefined,
        scannedLocation: hospitalData?.fullName || "Hospital Location"
      });

      // Update local state
      setRequests(requests.map(r =>
        r.id === requestId
          ? {
            ...r,
            status: newStatus,
            redeemedAt: currentStatus === 'REDEEMED' ? r.redeemedAt : new Date(),
            scannedLocation: hospitalData?.fullName || "Hospital Location"
          }
          : r
      ));

      // Add notification
      setNotifications([
        {
          id: Date.now().toString(),
          message: `Blood ${newStatus === 'HOSPITAL VERIFIED' ? 'verified' : 'closed'} for ${request.patientName} (${request.rtid})`,
          time: "Just now",
          type: "update"
        },
        ...notifications
      ]);

      Swal.fire({
        title: newStatus === 'HOSPITAL VERIFIED' ? 'Verification Confirmed!' : 'Request Closed!',
        html: `
          <div class="text-left space-y-2">
            <p class="text-sm text-gray-700">Blood ${newStatus === 'HOSPITAL VERIFIED' ? 'verification' : 'request closure'} completed for:</p>
            <div class="bg-green-50 p-3 rounded border border-green-200">
              <p><strong>RTID:</strong> <span class="font-mono">${request.rtid}</span></p>
              <p><strong>Patient:</strong> ${request.patientName}</p>
              <p><strong>Blood Group:</strong> ${request.bloodGroup}</p>
              <p><strong>Component:</strong> ${request.componentType || 'Whole Blood'}</p>
              <p><strong>Units:</strong> ${request.unitsRequired}</p>
            </div>
            <p class="text-xs text-gray-600">Status: <strong>${newStatus}</strong></p>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#16a34a',
        confirmButtonText: 'Done'
      });

    } catch (error) {
      console.error("Confirm receipt error:", error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to confirm blood verification. Please try again.',
        icon: 'error',
        confirmButtonColor: '#8B0000'
      });
    }
  };

  // Handle delete request
  const handleDelete = (id: string) => {
    const requestToDelete = requests.find(r => r.id === id);

    if (requestToDelete?.status === 'REDEEMED') {
      Swal.fire({
        title: 'Cannot Delete',
        text: 'Redeemed requests cannot be deleted.',
        icon: 'warning',
        confirmButtonColor: '#8B0000'
      });
      return;
    }

    Swal.fire({
      title: "Delete Request?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#8B0000",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteDoc(doc(db, "bloodRequests", id));
          setRequests(requests.filter((r) => r.id !== id));
          Swal.fire("Deleted!", "Request has been removed.", "success");
        } catch (error) {
          console.error("Delete error:", error);
          Swal.fire("Error", "Failed to delete request.", "error");
        }
      }
    });
  };

  // Handle logout
  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to logout?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#8B0000",
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel"
    }).then((result) => {
      if (result.isConfirmed) {
        onLogout();
      }
    });
  };

  // Calculate KPIs
  const kpis = useMemo(() => {
    const total = requests.length;
    const completed = requests.filter(r =>
      r.status === 'DONATED' || r.status === 'REDEEMED'
    ).length;
    const active = requests.filter(r =>
      ['PENDING', 'PARTIAL', 'Pending Pledge'].includes(r.status) &&
      isRequestValid(r)
    ).length;
    const units = requests.reduce((sum, r) => sum + r.unitsRequired, 0);
    const received = requests.filter(r => r.status === 'DONATED').length;
    const redeemed = requests.filter(r => r.status === 'REDEEMED').length;

    return {
      totalRequests: total,
      activeRequests: active,
      totalUnits: units,
      donationsReceived: received,
      requestsRedeemed: redeemed,
    };
  }, [requests]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="no-print">
        <Header
          hospitalName={hospitalData?.fullName || HOSPITAL_NAME_DEFAULT}
          notificationCount={notifications.length}
          onNotificationClick={() => setIsNotificationDrawerOpen(!isNotificationDrawerOpen)}
          onLogout={handleLogout}
        />

        <main className="container mx-auto px-4 py-8 max-w-7xl space-y-8">

          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-white to-red-50 p-6 rounded-xl shadow-sm border border-red-100 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Welcome, {hospitalData?.fullName || "Hospital"}
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage blood requests and inventory with clinical safety compliance.
              </p>
            </div>
            <Button
              onClick={() => {
                setModalDefaultUrgency('Normal');
                setIsRequestModalOpen(true);
              }}
              className="bg-[#8B0000] hover:bg-[#6B0000] text-white shadow-lg transform transition hover:scale-105"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" /> Create Request
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <KPICard
              label="Total Requests"
              value={kpis.totalRequests}
              icon={FileText}
              colorClass="border-l-blue-500"
            />
            <KPICard
              label="Active Requests"
              value={kpis.activeRequests}
              icon={Activity}
              colorClass="border-l-orange-500"
            />
            <KPICard
              label="Units Required"
              value={kpis.totalUnits}
              icon={Droplet}
              colorClass="border-l-red-500"
            />
            <KPICard
              label="Donations Rcvd"
              value={kpis.donationsReceived}
              icon={Gift}
              colorClass="border-l-purple-500"
            />
            <KPICard
              label="Redeemed"
              value={kpis.requestsRedeemed}
              icon={CheckCircle}
              colorClass="border-l-green-500"
            />
          </div>

          {/* Quick Actions & Status Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="col-span-1 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#8B0000]" /> Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3 border-red-200 bg-red-50 hover:bg-red-100 text-red-700"
                  onClick={() => {
                    setModalDefaultUrgency('Critical');
                    setIsRequestModalOpen(true);
                  }}
                >
                  <Siren className="w-5 h-5 mr-3" /> Emergency Request
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => toast.info("Downloading reports...")}
                >
                  <FileDown className="w-5 h-5 mr-3 text-blue-600" /> Download Reports
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                  onClick={() => window.open('tel:108')}
                >
                  <Phone className="w-5 h-5 mr-3 text-green-600" /> Contact Blood Bank
                </Button>
              </CardContent>
            </Card>

            <Card className="col-span-1 lg:col-span-2 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" /> Status Overview
                </CardTitle>
                <CardDescription>Real-time fulfillment breakdown.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Fulfillment Rate</span>
                    <span className="text-green-600">
                      {kpis.totalRequests > 0
                        ? Math.round((kpis.requestsRedeemed / kpis.totalRequests) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${kpis.totalRequests > 0
                          ? Math.round((kpis.requestsRedeemed / kpis.totalRequests) * 100)
                          : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100 text-center">
                    <p className="text-2xl font-bold text-yellow-700">
                      {kpis.activeRequests}
                    </p>
                    <p className="text-xs text-yellow-600 font-medium uppercase">
                      Pending
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-center">
                    <p className="text-2xl font-bold text-blue-700">
                      {kpis.donationsReceived}
                    </p>
                    <p className="text-xs text-blue-600 font-medium uppercase">
                      Fulfilled
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Requests Table */}
          <RequestsTable
            requests={requests}
            onViewQR={(req: BloodRequest) => {
              setSelectedRequest(req);
              setIsQRModalOpen(true);
            }}
            onCopyRTID={(rtid: string) => {
              copyToClipboard(rtid);
              toast.success("RTID copied to clipboard!");
            }}
            onDelete={handleDelete}
            onPrint={(req: BloodRequest) => setRequestToPrint(req)}
            onConfirmReceipt={handleConfirmReceipt}
          />
        </main>
      </div>

      {/* Modals */}
      <NewRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSubmit={handleNewRequest}
        defaultCity={hospitalData?.district || ''}
        defaultPincode={hospitalData?.pincode || ''}
        defaultUrgency={modalDefaultUrgency}
        hospitalName={hospitalData?.fullName || HOSPITAL_NAME_DEFAULT}
      />

      <QRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        request={selectedRequest}
      />

      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        notifications={notifications}
        onClose={() => setIsNotificationDrawerOpen(false)}
      />

      <PrintableRequest
        request={requestToPrint}
        hospital={hospitalData}
      />
    </div>
  );
};

export default HospitalDashboard;
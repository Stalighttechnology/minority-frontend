import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { fetchWithTokenRefresh } from "@/utils/authService";
import { API_ENDPOINT } from "@/utils/config";
import { SmartTablePagination } from "@/components/common/SmartTablePagination";
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Sliders,
  Send,
  Building,
  Home,
  FileText,
  Search,
  RefreshCw,
  Award,
  Layers,
  ShieldCheck,
  BedDouble,
  UserCheck,
  ChevronRight,
  Filter,
  Download,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Lock,
} from "lucide-react";

interface SmartAdmissionModelProps {
  userRole?: string;
}

export const SmartAdmissionModel: React.FC<SmartAdmissionModelProps> = ({
  userRole = "admission_manager",
}) => {
  const { toast } = useToast();

  // Role Permissions
  const isCrudUser = useMemo(() => {
    return ["counsellor", "admission_manager", "superadmin"].includes(
      userRole?.toLowerCase()
    );
  }, [userRole]);

  // Tab State
  const [activeTab, setActiveTab] = useState("overview");

  // Overview / Funnel State
  const [overviewData, setOverviewData] = useState<any>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);

  // Applications List State (Step 1-3)
  const [applications, setApplications] = useState<any[]>([]);
  const [totalAppsCount, setTotalAppsCount] = useState(0);
  const [appsTotalPages, setAppsTotalPages] = useState(1);
  const [appsCurrentPage, setAppsCurrentPage] = useState(1);
  const [isLoadingApps, setIsLoadingApps] = useState(false);

  // Application Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [communityFilter, setCommunityFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");

  // Verification Modal State (Step 3)
  const [selectedAppForVerify, setSelectedAppForVerify] = useState<any>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);

  // Merit Rule Config State (Step 4)
  const [academicWeight, setAcademicWeight] = useState(70);
  const [socioEconomicWeight, setSocioEconomicWeight] = useState(20);
  const [specialBonusWeight, setSpecialBonusWeight] = useState(10);
  const [tieBreakers, setTieBreakers] = useState<string[]>([
    "AGE_PRIORITY",
    "SCIENCE_MATHS_SCORE",
    "APPLICATION_TIMESTAMP",
  ]);
  const [isSavingMeritRule, setIsSavingMeritRule] = useState(false);
  const [isGeneratingMerit, setIsGeneratingMerit] = useState(false);

  // Roster Config State (Step 6)
  const [muslimPct, setMuslimPct] = useState(50);
  const [christianPct, setChristianPct] = useState(15);
  const [otherMinorityPct, setOtherMinorityPct] = useState(10);
  const [scPct, setScPct] = useState(15);
  const [stPct, setStPct] = useState(3);
  const [obcPct, setObcPct] = useState(7);
  const [girlsPct, setGirlsPct] = useState(50);
  const [pwdPct, setPwdPct] = useState(3);
  const [isSavingRoster, setIsSavingRoster] = useState(false);
  const [isAllocatingSeats, setIsAllocatingSeats] = useState(false);
  const [allocationResults, setAllocationResults] = useState<any>(null);

  // Allotment Modal View
  const [selectedAppForAllotment, setSelectedAppForAllotment] = useState<any>(null);

  // Hostel Allocation Modal (Step 10)
  const [selectedAppForHostel, setSelectedAppForHostel] = useState<any>(null);
  const [hostelsList, setHostelsList] = useState<any[]>([]);
  const [selectedHostelId, setSelectedHostelId] = useState<number | string>("");
  const [hostelBlock, setHostelBlock] = useState("");
  const [hostelRoom, setHostelRoom] = useState("");
  const [hostelBed, setHostelBed] = useState("Bed-A");
  const [messCardNo, setMessCardNo] = useState("");
  const [isSubmittingHostel, setIsSubmittingHostel] = useState(false);

  // Communication Modal (Step 8)
  const [commTargetGroup, setCommTargetGroup] = useState("All Allotted Students");
  const [commChannel, setCommChannel] = useState("sms");
  const [commSubject, setCommSubject] = useState("MDRS Residential School Admission Allotment");
  const [commMessage, setCommMessage] = useState(
    "Congratulations! Your seat has been provisionally allotted at Morarji Desai Residential School. Please report by June 25, 2026."
  );
  const [isSendingComm, setIsSendingComm] = useState(false);

  // 1. Fetch Overview Funnel
  const fetchOverview = async () => {
    setIsLoadingOverview(true);
    try {
      const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/admission/smart/overview/`);
      const data = await res.json();
      if (res.ok && data.success) {
        setOverviewData(data);
      } else {
        toast({
          variant: "destructive",
          title: "Failed to load overview data",
          description: data.error || data.message || "Failed to fetch admission overview.",
        });
      }
    } catch (err: any) {
      console.error("Failed to fetch smart admission overview:", err);
      toast({
        variant: "destructive",
        title: "Network Error",
        description: err.message || "Failed to fetch smart admission overview.",
      });
    } finally {
      setIsLoadingOverview(false);
    }
  };

  // 2. Fetch Paginated Applications (10 per page)
  const fetchApplications = async (page = 1) => {
    setIsLoadingApps(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (communityFilter !== "all") params.append("community", communityFilter);
      if (districtFilter !== "all") params.append("district", districtFilter);

      const res = await fetchWithTokenRefresh(
        `${API_ENDPOINT}/admission/smart/applications/?${params.toString()}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setApplications(data.results || []);
        setTotalAppsCount(data.count || 0);
        setAppsTotalPages(data.total_pages || 1);
        setAppsCurrentPage(data.current_page || 1);
      } else {
        toast({
          variant: "destructive",
          title: "Failed to load applications",
          description: data.error || data.message || "Failed to fetch applications.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to load applications",
        description: err.message || "Please check network connection.",
      });
    } finally {
      setIsLoadingApps(false);
    }
  };

  // 3. Fetch Configs (Merit Rules & Roster Rules)
  const fetchConfigs = async () => {
    try {
      const [meritRes, rosterRes] = await Promise.all([
        fetchWithTokenRefresh(`${API_ENDPOINT}/admission/smart/merit-config/`),
        fetchWithTokenRefresh(`${API_ENDPOINT}/admission/smart/roster-config/`),
      ]);
      const meritData = await meritRes.json();
      const rosterData = await rosterRes.json();

      if (meritData.success) {
        setAcademicWeight(meritData.academic_weight ?? 70);
        setSocioEconomicWeight(meritData.socio_economic_weight ?? 20);
        setSpecialBonusWeight(meritData.special_category_bonus_weight ?? 10);
        if (meritData.tie_breaking_order) {
          setTieBreakers(meritData.tie_breaking_order);
        }
      }

      if (rosterData.success) {
        setMuslimPct(rosterData.minority_muslim_pct ?? 50);
        setChristianPct(rosterData.minority_christian_pct ?? 15);
        setOtherMinorityPct(rosterData.minority_other_pct ?? 10);
        setScPct(rosterData.sc_pct ?? 15);
        setStPct(rosterData.st_pct ?? 3);
        setObcPct(rosterData.obc_cat1_pct ?? 7);
        setGirlsPct(rosterData.girls_reservation_pct ?? 50);
        setPwdPct(rosterData.pwd_reservation_pct ?? 3);
      }
    } catch (err) {
      console.error("Error fetching rules config:", err);
    }
  };

  const fetchHostels = async (): Promise<any[]> => {
    if (hostelsList.length > 0) return hostelsList;
    try {
      const hostelRes = await fetchWithTokenRefresh(`${API_ENDPOINT}/admission/smart/hostels-and-rooms/`);
      const hostelData = await hostelRes.json();
      if (hostelRes.ok && hostelData.success && Array.isArray(hostelData.hostels)) {
        setHostelsList(hostelData.hostels);
        return hostelData.hostels;
      }
    } catch (err) {
      console.error("Error fetching hostels:", err);
    }
    return [];
  };

  const openHostelModal = async (app: any) => {
    setSelectedAppForHostel(app);
    let list = hostelsList;
    if (list.length === 0) {
      list = await fetchHostels();
    }
    const isFemale = String(app.gender || "").toLowerCase().startsWith("f");
    const matchingHostel =
      list.find((h) =>
        isFemale
          ? h.gender === "F" || h.name.toLowerCase().includes("girl")
          : h.gender === "M" || h.name.toLowerCase().includes("boy")
      ) || list[0];

    if (matchingHostel) {
      setSelectedHostelId(matchingHostel.id);
      setHostelBlock(matchingHostel.name);
      if (matchingHostel.rooms && matchingHostel.rooms.length > 0) {
        setHostelRoom(matchingHostel.rooms[0].name);
      } else {
        setHostelRoom("Room 101");
      }
    } else {
      setHostelBlock("Aryabhatta Hostel (Boys)");
      setHostelRoom("Room 101");
    }
    setHostelBed("Bed-A");
    setMessCardNo(`MC-${(app.id || 1).toString().padStart(4, "0")}`);
  };

  useEffect(() => {
    fetchOverview();
    fetchConfigs();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchApplications(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, communityFilter, districtFilter]);

  // Handle Verification (Step 3)
  const handleVerify = async (statusVal: "VERIFIED" | "DEFICIENT" | "REJECTED") => {
    if (!selectedAppForVerify) return;
    setIsSubmittingVerify(true);
    try {
      const res = await fetchWithTokenRefresh(
        `${API_ENDPOINT}/admission/smart/verify/${selectedAppForVerify.id}/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: statusVal,
            notes: verificationNotes,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast({
          title: `Application ${statusVal}`,
          description: data.message,
        });
        setSelectedAppForVerify(null);
        setVerificationNotes("");
        fetchApplications(appsCurrentPage);
        fetchOverview();
      } else {
        throw new Error(data.error || "Failed to update verification.");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Verification Error",
        description: err.message,
      });
    } finally {
      setIsSubmittingVerify(false);
    }
  };

  // Save Merit Rule (Step 4)
  const handleSaveMeritRule = async () => {
    setIsSavingMeritRule(true);
    try {
      const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/admission/smart/merit-config/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academic_weight: academicWeight,
          socio_economic_weight: socioEconomicWeight,
          special_category_bonus_weight: specialBonusWeight,
          tie_breaking_order: tieBreakers,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Merit Formula Saved",
          description: "Scoring weights & tie-breaking rules successfully updated.",
        });
      } else {
        throw new Error(data.error || "Failed to save merit rules.");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: err.message,
      });
    } finally {
      setIsSavingMeritRule(false);
    }
  };

  // Generate Merit List (Step 4)
  const handleGenerateMeritList = async () => {
    setIsGeneratingMerit(true);
    try {
      const res = await fetchWithTokenRefresh(
        `${API_ENDPOINT}/admission/smart/generate-merit-list/`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Merit List Generated",
          description: data.message,
        });
        fetchApplications(appsCurrentPage);
        fetchOverview();
      } else {
        throw new Error(data.error || "Failed to generate merit list.");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Merit Engine Error",
        description: err.message,
      });
    } finally {
      setIsGeneratingMerit(false);
    }
  };

  // Save Roster Config (Step 6)
  const handleSaveRoster = async () => {
    setIsSavingRoster(true);
    try {
      const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/admission/smart/roster-config/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minority_muslim_pct: muslimPct,
          minority_christian_pct: christianPct,
          minority_other_pct: otherMinorityPct,
          sc_pct: scPct,
          st_pct: stPct,
          obc_cat1_pct: obcPct,
          girls_reservation_pct: girlsPct,
          pwd_reservation_pct: pwdPct,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Roster Quota Saved",
          description: "Category and horizontal reservation rules updated.",
        });
      } else {
        throw new Error(data.error || "Failed to save roster rules.");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Roster Error",
        description: err.message,
      });
    } finally {
      setIsSavingRoster(false);
    }
  };

  // Execute Seat Allocation (Step 6 & 7)
  const handleSeatAllocation = async (dryRun = false) => {
    setIsAllocatingSeats(true);
    try {
      const res = await fetchWithTokenRefresh(
        `${API_ENDPOINT}/admission/smart/run-seat-allocation/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dry_run: dryRun }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setAllocationResults(data);
        toast({
          title: dryRun ? "Dry Run Simulation Complete" : "Seats Successfully Allotted",
          description: data.message,
        });
        if (!dryRun) {
          fetchApplications(appsCurrentPage);
          fetchOverview();
        }
      } else {
        throw new Error(data.error || "Seat allocation execution failed.");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Allocation Error",
        description: err.message,
      });
    } finally {
      setIsAllocatingSeats(false);
    }
  };

  // Confirm Admission (Step 9)
  const handleConfirmAdmission = async (appId: number) => {
    try {
      const res = await fetchWithTokenRefresh(
        `${API_ENDPOINT}/admission/smart/confirm-admission/${appId}/`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Admission Confirmed",
          description: `Enrollment ID: ${data.enrollment_id} generated.`,
        });
        fetchApplications(appsCurrentPage);
        fetchOverview();
      } else {
        throw new Error(data.error || "Failed to confirm admission.");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Confirmation Error",
        description: err.message,
      });
    }
  };

  // Allocate Hostel (Step 10)
  const handleAllocateHostel = async () => {
    if (!selectedAppForHostel) return;
    setIsSubmittingHostel(true);
    try {
      const res = await fetchWithTokenRefresh(
        `${API_ENDPOINT}/admission/smart/allocate-hostel/${selectedAppForHostel.id}/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hostel_id: selectedHostelId,
            hostel_block: hostelBlock,
            room_number: hostelRoom,
            bed_number: hostelBed,
            mess_card_no: messCardNo,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Hostel Bed Allocated",
          description: data.message,
        });
        setSelectedAppForHostel(null);
        fetchApplications(appsCurrentPage);
        fetchOverview();
      } else {
        throw new Error(data.error || "Failed to allocate hostel.");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Hostel Allocation Error",
        description: err.message,
      });
    } finally {
      setIsSubmittingHostel(false);
    }
  };

  // Send Communication (Step 8)
  const handleSendCommunication = async () => {
    setIsSendingComm(true);
    try {
      const res = await fetchWithTokenRefresh(
        `${API_ENDPOINT}/admission/smart/send-communication/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_group: commTargetGroup,
            channel: commChannel,
            subject: commSubject,
            message: commMessage,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Broadcast Queued",
          description: data.message,
        });
        fetchOverview();
      } else {
        throw new Error(data.error || "Failed to send communication.");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Dispatch Error",
        description: err.message,
      });
    } finally {
      setIsSendingComm(false);
    }
  };

  const funnel = overviewData?.pipeline_funnel || {};

  return (
    <div className="space-y-6 pb-12">
      {/* 10-Step Interactive Pipeline Status Header */}
      <div className="relative p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border border-primary/20 shadow-sm overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/20 text-primary uppercase tracking-wide">
                10-Step Smart Pipeline
              </span>
              {!isCrudUser && (
                <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                  <Lock className="w-3 h-3" /> Read-Only Oversight
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1.5">
              Minority Residential School Smart Admission Model
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Automated scoring, quota rosters (75% Minority / 25% Gen), seat allotment & hostel mapping.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchOverview();
                fetchApplications(appsCurrentPage);
              }}
              className="h-9 gap-1.5 text-xs rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
            {isCrudUser && (
              <Button
                size="sm"
                onClick={handleGenerateMeritList}
                disabled={isGeneratingMerit}
                className="h-9 gap-1.5 text-xs rounded-xl shadow-sm bg-primary text-primary-foreground"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isGeneratingMerit ? "Ranking..." : "Run Merit Engine"}
              </Button>
            )}
          </div>
        </div>

        {/* 10-Step Horizontal Visual Step Track */}
        <div className="mt-5 pt-4 border-t border-primary/10 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 min-w-[760px]">
            {[
              { num: 1, name: "Application", count: funnel.step1_total_applications || 0 },
              { num: 2, name: "Central Ingest", count: funnel.step2_centralized_ingested || 0 },
              { num: 3, name: "Verification", count: funnel.step3_verified || 0 },
              { num: 4, name: "Merit List", count: funnel.step4_merit_listed || 0 },
              { num: 5, name: "Preferences", count: funnel.step5_preferences_filled || 0 },
              { num: 6, name: "Roster Rules", count: "75% / 25%" },
              { num: 7, name: "Seat Allotment", count: funnel.step6_7_seats_allotted || 0 },
              { num: 8, name: "Auto Alerts", count: funnel.step8_communications_sent || 0 },
              { num: 9, name: "Confirmation", count: funnel.step9_confirmed_admissions || 0 },
              { num: 10, name: "Hostel Bed", count: funnel.step10_hostel_allocated || 0 },
            ].map((step, idx) => (
              <div
                key={step.num}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card/80 border border-border text-xs shrink-0 shadow-sm"
              >
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px]">
                  {step.num}
                </span>
                <span className="font-medium text-foreground">{step.name}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground ml-1">
                  {step.count}
                </span>
                {idx < 9 && <ChevronRight className="w-3 h-3 text-muted-foreground ml-1" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Feature Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 h-auto p-1 bg-muted/60 rounded-xl gap-1">
          <TabsTrigger value="overview" className="text-xs py-2 rounded-lg gap-1.5">
            <Layers className="w-3.5 h-3.5" /> Pipeline Overview
          </TabsTrigger>
          <TabsTrigger value="verification" className="text-xs py-2 rounded-lg gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Verification (1-3)
          </TabsTrigger>
          <TabsTrigger value="merit" className="text-xs py-2 rounded-lg gap-1.5">
            <Award className="w-3.5 h-3.5" /> Merit Formula (4)
          </TabsTrigger>
          <TabsTrigger value="roster" className="text-xs py-2 rounded-lg gap-1.5">
            <Building className="w-3.5 h-3.5" /> Roster & Allotment (6-7)
          </TabsTrigger>
          <TabsTrigger value="desk" className="text-xs py-2 rounded-lg gap-1.5">
            <Home className="w-3.5 h-3.5" /> Desk & Hostel (9-10)
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: PIPELINE OVERVIEW & MACRO KPIs                         */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="overview" className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
            <Card className="rounded-2xl border bg-card">
              <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Ingested Apps</p>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1 text-foreground">
                    {funnel.step1_total_applications || 0}
                  </h3>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Step 1 & 2 Live
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-card">
              <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Verified Documents</p>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1 text-foreground">
                    {funnel.step3_verified || 0}
                  </h3>
                  <span className="text-[10px] text-primary font-semibold mt-0.5 block">
                    {Math.round(
                      ((funnel.step3_verified || 0) /
                        (funnel.step1_total_applications || 1)) *
                        100
                    )}
                    % Verified
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-card">
              <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Seats Allotted</p>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1 text-foreground">
                    {funnel.step6_7_seats_allotted || 0}
                  </h3>
                  <span className="text-[10px] text-amber-600 font-semibold mt-0.5 block">
                    Capacity: {overviewData?.seat_capacity?.total_capacity || 100}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-card">
              <CardContent className="p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Hostel Bed Allocated</p>
                  <h3 className="text-xl sm:text-2xl font-bold mt-1 text-foreground">
                    {funnel.step10_hostel_allocated || 0}
                  </h3>
                  <span className="text-[10px] text-purple-600 font-semibold mt-0.5 block">
                    Step 10 Complete
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  <BedDouble className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Minority Community Breakdown & Capacity Utilization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="rounded-2xl border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" /> Minority Quota & Community Distribution
                </CardTitle>
                <CardDescription className="text-xs">
                  Applicant intake categorization across notified minority groups and quotas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {overviewData?.community_distribution &&
                  Object.entries(overviewData.community_distribution).map(
                    ([comm, count]: any) => {
                      const total = funnel.step1_total_applications || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={comm} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span>{comm}</span>
                            <span className="text-muted-foreground">
                              {count} students ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(pct, count > 0 ? 6 : 0))}%` }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-card flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-primary" /> Approved Roster Rules & Horizontal Quotas
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Current active roster configuration for Residential Minority Institutions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                    <div className="flex justify-between font-bold text-foreground">
                      <span>Minority Quota (Total 75%)</span>
                      <span className="text-primary">{muslimPct + christianPct + otherMinorityPct}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-muted-foreground pt-1 border-t border-primary/10">
                      <div>Muslim: <strong className="text-foreground">{muslimPct}%</strong></div>
                      <div>Christian: <strong className="text-foreground">{christianPct}%</strong></div>
                      <div>Jain/Sikh: <strong className="text-foreground">{otherMinorityPct}%</strong></div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-muted/60 border border-border space-y-2">
                    <div className="flex justify-between font-bold text-foreground">
                      <span>General & SC/ST Quota (Total 25%)</span>
                      <span>{scPct + stPct + obcPct}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                      <div>SC: <strong className="text-foreground">{scPct}%</strong></div>
                      <div>ST: <strong className="text-foreground">{stPct}%</strong></div>
                      <div>Cat-1/OBC: <strong className="text-foreground">{obcPct}%</strong></div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-600 flex items-center justify-center font-bold text-xs">
                        ♀
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{girlsPct}% Girls Reservation</p>
                        <p className="text-[10px] text-muted-foreground">Mandatory Horizontal Overlay</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                        ♿
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{pwdPct}% PwD Quota</p>
                        <p className="text-[10px] text-muted-foreground">Specially Abled Students</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="p-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Need adjustments? Configure in the Roster tab.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("roster")}
                  className="text-xs rounded-xl h-8"
                >
                  Adjust Roster Quotas ➔
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: VERIFICATION DESK (STEPS 1–3)                          */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="verification" className="space-y-4">
          <Card className="rounded-2xl border bg-card">
            <CardHeader className="p-4 sm:p-5 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" /> Application Verification Queue
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Review and verify caste, income, and academic documents (Strict 10 items per page).
                  </CardDescription>
                </div>

                <Badge variant="outline" className="px-3 py-1 font-bold text-xs bg-muted">
                  Total: {totalAppsCount} Applicants
                </Badge>
              </div>

              {/* Filters & Search Row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Search name, phone, ATN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-9 text-xs rounded-xl"
                  />
                </div>

                <Select value={communityFilter} onValueChange={setCommunityFilter}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Community" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Communities</SelectItem>
                    <SelectItem value="Muslim">Muslim</SelectItem>
                    <SelectItem value="Christian">Christian</SelectItem>
                    <SelectItem value="Jain">Jain / Buddhist / Sikh</SelectItem>
                    <SelectItem value="SC">SC / ST</SelectItem>
                    <SelectItem value="Other">General / Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                    <SelectItem value="DEFICIENT">Deficient</SelectItem>
                    <SelectItem value="SUBMITTED">Pending Verification</SelectItem>
                    <SelectItem value="ALLOTTED">Seat Allotted</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setCommunityFilter("all");
                    setDistrictFilter("all");
                  }}
                  className="h-9 text-xs rounded-xl"
                >
                  Reset Filters
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoadingApps ? (
                <div className="p-12 text-center text-muted-foreground text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                  Loading application records...
                </div>
              ) : applications.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-xs">
                  No applications match your current filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 text-muted-foreground border-y font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 sm:px-4">ATN / Candidate</th>
                        <th className="py-2.5 px-3">Community & Caste</th>
                        <th className="py-2.5 px-3">Location & Rural</th>
                        <th className="py-2.5 px-3">Academic %</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 sm:px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {applications.map((app) => (
                        <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-3 sm:px-4">
                            <span className="font-mono text-[10px] text-muted-foreground block">
                              {app.application_number}
                            </span>
                            <span className="font-bold text-foreground text-xs sm:text-sm">
                              {app.student_name}
                            </span>
                            <span className="text-[11px] text-muted-foreground block">
                              {app.gender} • {app.contact_number}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant="outline" className="text-[10px] font-semibold bg-primary/5 text-primary border-primary/20">
                              {app.minority_community}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground block mt-0.5">
                              Cat: {app.caste_category}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-medium text-foreground">{app.district}</span>
                            <span className="text-[10px] text-muted-foreground block">
                              {app.is_rural ? "Rural Resident ✓" : "Urban"}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-foreground text-xs sm:text-sm">
                              {app.academic_percentage}%
                            </span>
                            {app.merit_score != null && (
                              <span className="text-[10px] text-emerald-600 block font-semibold">
                                Score: {app.merit_score} (Rank #{app.merit_rank})
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {app.is_verified ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                              </Badge>
                            ) : app.verification_status === "DEFICIENT" ? (
                              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] font-bold">
                                Deficient
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                Pending
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-3 sm:px-4 text-right">
                            {isCrudUser ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedAppForVerify(app);
                                  setVerificationNotes(app.manager_remarks || "");
                                }}
                                className="h-8 px-2.5 text-xs rounded-xl font-semibold gap-1"
                              >
                                Verify Docs
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedAppForVerify(app)}
                                className="h-8 px-2.5 text-xs rounded-xl"
                              >
                                View ➔
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 10 Per Page Pagination Controls */}
              <SmartTablePagination
                currentPage={appsCurrentPage}
                totalPages={appsTotalPages}
                totalCount={totalAppsCount}
                pageSize={10}
                onPageChange={(p) => fetchApplications(p)}
                isLoading={isLoadingApps}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: MERIT RULE FORMULA & TIE-BREAKERS (STEP 4)             */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="merit" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Configurator Panel */}
            <Card className="rounded-2xl border bg-card lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" /> Automated Scoring Engine
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure weighted formula (Must sum to 100%).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* Academic Weight Slider */}
                <div className="space-y-1.5 p-3 rounded-xl bg-muted/40 border border-border">
                  <div className="flex justify-between font-bold">
                    <span>Academic Score Weight</span>
                    <span className="text-primary font-bold">{academicWeight}%</span>
                  </div>
                  <Slider
                    value={[academicWeight]}
                    min={40}
                    max={90}
                    step={1}
                    disabled={!isCrudUser}
                    onValueChange={(val) => setAcademicWeight(val[0])}
                  />
                  <p className="text-[10px] text-muted-foreground">Qualifying exam marks card percentage</p>
                </div>

                {/* Socio-Economic Slider */}
                <div className="space-y-1.5 p-3 rounded-xl bg-muted/40 border border-border">
                  <div className="flex justify-between font-bold">
                    <span>Socio-Economic Weight</span>
                    <span className="text-primary font-bold">{socioEconomicWeight}%</span>
                  </div>
                  <Slider
                    value={[socioEconomicWeight]}
                    min={5}
                    max={40}
                    step={1}
                    disabled={!isCrudUser}
                    onValueChange={(val) => setSocioEconomicWeight(val[0])}
                  />
                  <p className="text-[10px] text-muted-foreground">Income certificate + Rural resident bonus</p>
                </div>

                {/* Special Bonus Slider */}
                <div className="space-y-1.5 p-3 rounded-xl bg-muted/40 border border-border">
                  <div className="flex justify-between font-bold">
                    <span>Special Category Bonus</span>
                    <span className="text-primary font-bold">{specialBonusWeight}%</span>
                  </div>
                  <Slider
                    value={[specialBonusWeight]}
                    min={0}
                    max={20}
                    step={1}
                    disabled={!isCrudUser}
                    onValueChange={(val) => setSpecialBonusWeight(val[0])}
                  />
                  <p className="text-[10px] text-muted-foreground">Orphan, single-parent, state sports quota</p>
                </div>

                {/* Sum Indicator */}
                <div
                  className={`p-2.5 rounded-xl text-center font-bold text-xs ${
                    academicWeight + socioEconomicWeight + specialBonusWeight === 100
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  }`}
                >
                  Formula Total: {academicWeight + socioEconomicWeight + specialBonusWeight}%{" "}
                  {academicWeight + socioEconomicWeight + specialBonusWeight === 100 ? "✓ Valid" : "(Must equal 100%)"}
                </div>

                {/* Tie Breaking Hierarchy */}
                <div className="pt-2 border-t space-y-2">
                  <Label className="text-xs font-bold text-foreground">Tie-Breaking Hierarchy (Ordered)</Label>
                  <div className="space-y-1.5">
                    {tieBreakers.map((tb, idx) => (
                      <div key={tb} className="p-2 rounded-lg bg-card border flex items-center gap-2 text-[11px]">
                        <span className="w-4 h-4 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-foreground">
                          {tb === "AGE_PRIORITY" && "1. Older Age Priority (DOB)"}
                          {tb === "SCIENCE_MATHS_SCORE" && "2. Science & Maths Marks"}
                          {tb === "APPLICATION_TIMESTAMP" && "3. Application Submission Date"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {isCrudUser && (
                  <Button
                    onClick={handleSaveMeritRule}
                    disabled={isSavingMeritRule || academicWeight + socioEconomicWeight + specialBonusWeight !== 100}
                    className="w-full h-9 text-xs rounded-xl font-semibold shadow-sm"
                  >
                    {isSavingMeritRule ? "Saving..." : "Save Merit Formula"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Right Col: Ranked Merit List (10 per page) */}
            <Card className="rounded-2xl border bg-card lg:col-span-2 flex flex-col justify-between">
              <div>
                <CardHeader className="p-4 sm:p-5 pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Award className="w-4 h-4 text-primary" /> Generated Merit Ranking
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Calculated final scores with tie-breakers applied.
                      </CardDescription>
                    </div>

                    {isCrudUser && (
                      <Button
                        size="sm"
                        onClick={handleGenerateMeritList}
                        disabled={isGeneratingMerit}
                        className="h-8 gap-1.5 text-xs rounded-xl bg-primary text-primary-foreground font-semibold"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {isGeneratingMerit ? "Ranking..." : "Recalculate All Ranks"}
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 text-muted-foreground border-y font-semibold">
                        <tr>
                          <th className="py-2.5 px-3 sm:px-4">Rank</th>
                          <th className="py-2.5 px-3">Applicant Name</th>
                          <th className="py-2.5 px-3">Community</th>
                          <th className="py-2.5 px-3">Academic %</th>
                          <th className="py-2.5 px-3 font-bold text-foreground">Final Merit Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {applications
                          .filter((a) => a.merit_rank || a.merit_score)
                          .map((app) => (
                            <tr key={app.id} className="hover:bg-muted/30">
                              <td className="py-3 px-3 sm:px-4">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                                  #{app.merit_rank}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-bold text-foreground block">{app.student_name}</span>
                                <span className="text-[10px] text-muted-foreground">{app.application_number}</span>
                              </td>
                              <td className="py-3 px-3">
                                <Badge variant="outline" className="text-[10px]">
                                  {app.minority_community}
                                </Badge>
                              </td>
                              <td className="py-3 px-3 font-medium">{app.academic_percentage}%</td>
                              <td className="py-3 px-3">
                                <span className="font-bold text-xs sm:text-sm text-emerald-600">
                                  {app.merit_score} pts
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </div>

              {/* 10 Per Page Pagination */}
              <SmartTablePagination
                currentPage={appsCurrentPage}
                totalPages={appsTotalPages}
                totalCount={totalAppsCount}
                pageSize={10}
                onPageChange={(p) => fetchApplications(p)}
                isLoading={isLoadingApps}
              />
            </Card>
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: ROSTER MATRIX & SEAT ALLOTMENT (STEPS 6–7)             */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="roster" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Roster Controls */}
            <Card className="rounded-2xl border bg-card lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Building className="w-4 h-4 text-primary" /> Quota Roster Configurator
                </CardTitle>
                <CardDescription className="text-xs">
                  Minority (75%) + General (25%) + Horizontal 50% Girls.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 text-xs">
                {/* Minority Quota Inputs */}
                <div className="space-y-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex justify-between font-bold text-foreground">
                    <span>Minority Quota (75%)</span>
                    <span className="text-primary">{muslimPct + christianPct + otherMinorityPct}%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Muslim %</Label>
                      <Input
                        type="number"
                        value={muslimPct}
                        disabled={!isCrudUser}
                        onChange={(e) => setMuslimPct(Number(e.target.value))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Christian %</Label>
                      <Input
                        type="number"
                        value={christianPct}
                        disabled={!isCrudUser}
                        onChange={(e) => setChristianPct(Number(e.target.value))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Jain/Sikh %</Label>
                      <Input
                        type="number"
                        value={otherMinorityPct}
                        disabled={!isCrudUser}
                        onChange={(e) => setOtherMinorityPct(Number(e.target.value))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* General / SC / ST Quota Inputs */}
                <div className="space-y-2 p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="flex justify-between font-bold text-foreground">
                    <span>General / SC / ST Quota (25%)</span>
                    <span>{scPct + stPct + obcPct}%</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">SC %</Label>
                      <Input
                        type="number"
                        value={scPct}
                        disabled={!isCrudUser}
                        onChange={(e) => setScPct(Number(e.target.value))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">ST %</Label>
                      <Input
                        type="number"
                        value={stPct}
                        disabled={!isCrudUser}
                        onChange={(e) => setStPct(Number(e.target.value))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Cat-1/OBC %</Label>
                      <Input
                        type="number"
                        value={obcPct}
                        disabled={!isCrudUser}
                        onChange={(e) => setObcPct(Number(e.target.value))}
                        className="h-8 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Horizontal Quotas */}
                <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-2">
                  <Label className="font-bold text-foreground">Horizontal Quotas</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Girls Quota %</Label>
                      <Input
                        type="number"
                        value={girlsPct}
                        disabled={!isCrudUser}
                        onChange={(e) => setGirlsPct(Number(e.target.value))}
                        className="h-8 text-xs font-bold text-pink-600"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">PwD Quota %</Label>
                      <Input
                        type="number"
                        value={pwdPct}
                        disabled={!isCrudUser}
                        onChange={(e) => setPwdPct(Number(e.target.value))}
                        className="h-8 text-xs font-bold text-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {isCrudUser && (
                  <div className="space-y-2 pt-2">
                    <Button
                      onClick={handleSaveRoster}
                      disabled={isSavingRoster}
                      variant="outline"
                      className="w-full h-8 text-xs rounded-xl"
                    >
                      {isSavingRoster ? "Saving..." : "Save Quota Matrix"}
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => handleSeatAllocation(true)}
                        disabled={isAllocatingSeats}
                        className="h-9 text-xs rounded-xl"
                      >
                        Dry Run (Preview)
                      </Button>
                      <Button
                        onClick={() => handleSeatAllocation(false)}
                        disabled={isAllocatingSeats}
                        className="h-9 text-xs rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm"
                      >
                        Execute Allotment
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Allotted Seats Table (10 per page) */}
            <Card className="rounded-2xl border bg-card lg:col-span-2 flex flex-col justify-between">
              <div>
                <CardHeader className="p-4 sm:p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Allotted Seats & Reporting
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Algorithm matches: Merit Rank × Category Roster × Choice Order × Vacancy.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs font-bold bg-muted">
                      {funnel.step6_7_seats_allotted || 0} Allotted
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 text-muted-foreground border-y font-semibold">
                        <tr>
                          <th className="py-2.5 px-3 sm:px-4">Candidate</th>
                          <th className="py-2.5 px-3">Quota Category</th>
                          <th className="py-2.5 px-3">Allotted Campus</th>
                          <th className="py-2.5 px-3">Reporting Deadline</th>
                          <th className="py-2.5 px-3 sm:px-4 text-right">Allotment Slip</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {applications
                          .filter((a) => a.allotment)
                          .map((app) => (
                            <tr key={app.id} className="hover:bg-muted/30">
                              <td className="py-3 px-3 sm:px-4">
                                <span className="font-bold text-foreground block">{app.student_name}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {app.application_number} • Rank #{app.merit_rank}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                                  {app.allotment.category_quota}
                                </Badge>
                              </td>
                              <td className="py-3 px-3 font-medium text-foreground">
                                {app.allotment.allotted_institution}
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-semibold text-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-muted-foreground" />
                                  {app.allotment.reporting_date || "2026-06-25"}
                                </span>
                              </td>
                              <td className="py-3 px-3 sm:px-4 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedAppForAllotment(app)}
                                  className="h-8 px-2.5 text-xs rounded-xl font-semibold gap-1"
                                >
                                  <FileText className="w-3.5 h-3.5" /> View Slip
                                </Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </div>

              {/* 10 Per Page Pagination */}
              <SmartTablePagination
                currentPage={appsCurrentPage}
                totalPages={appsTotalPages}
                totalCount={totalAppsCount}
                pageSize={10}
                onPageChange={(p) => fetchApplications(p)}
                isLoading={isLoadingApps}
              />
            </Card>
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: DESK CONFIRMATION & HOSTEL BED (STEPS 9–10)            */}
        {/* ------------------------------------------------------------- */}
        <TabsContent value="desk" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Communication Broadcast Box */}
            <Card className="rounded-2xl border bg-card lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary" /> Step 8: Auto Broadcast Alerts
                </CardTitle>
                <CardDescription className="text-xs">
                  SMS / WhatsApp dispatch to students & parents.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Target Group</Label>
                  <Select value={commTargetGroup} onValueChange={setCommTargetGroup}>
                    <SelectTrigger className="h-8 text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All Allotted Students">All Allotted Students</SelectItem>
                      <SelectItem value="Reporting Pending Students">Pending Reporting</SelectItem>
                      <SelectItem value="Hostel Assigned Students">Hostel Assigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[10px] text-muted-foreground">Channel</Label>
                  <Select value={commChannel} onValueChange={setCommChannel}>
                    <SelectTrigger className="h-8 text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS Message Gateway</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp Business API</SelectItem>
                      <SelectItem value="email">Email Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[10px] text-muted-foreground">Message Body</Label>
                  <textarea
                    rows={3}
                    value={commMessage}
                    onChange={(e) => setCommMessage(e.target.value)}
                    className="w-full p-2.5 rounded-xl border bg-card text-xs"
                  />
                </div>

                {isCrudUser && (
                  <Button
                    onClick={handleSendCommunication}
                    disabled={isSendingComm}
                    className="w-full h-9 text-xs rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm"
                  >
                    {isSendingComm ? "Dispatching..." : "Send Broadcast"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Desk Check-in & Hostel Allocation Table */}
            <Card className="rounded-2xl border bg-card lg:col-span-2 flex flex-col justify-between">
              <div>
                <CardHeader className="p-4 sm:p-5 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Home className="w-4 h-4 text-purple-600" /> Physical Reporting & Hostel Assignment
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Confirm admission on reporting day & allocate hostel block/bed.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 text-muted-foreground border-y font-semibold">
                        <tr>
                          <th className="py-2.5 px-3 sm:px-4">Candidate</th>
                          <th className="py-2.5 px-3">Admission Status</th>
                          <th className="py-2.5 px-3">Hostel Block & Room</th>
                          <th className="py-2.5 px-3 sm:px-4 text-right">Desk Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {applications.map((app) => (
                          <tr key={app.id} className="hover:bg-muted/30">
                            <td className="py-3 px-3 sm:px-4">
                              <span className="font-bold text-foreground block">{app.student_name}</span>
                              <span className="text-[10px] text-muted-foreground">{app.application_number}</span>
                            </td>
                            <td className="py-3 px-3">
                              {app.enquiry_status === "enrolled" ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                                  Confirmed & Enrolled
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
                                  Allotted / Pending Check-in
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {app.hostel_allocation ? (
                                <div>
                                  <span className="font-bold text-foreground block">
                                    {app.hostel_allocation.hostel_block}
                                  </span>
                                  <span className="text-[10px] text-purple-600 font-semibold">
                                    Room {app.hostel_allocation.room_number} • Bed {app.hostel_allocation.bed_number}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-[11px]">Unassigned</span>
                              )}
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-right space-x-1.5">
                              {isCrudUser && (
                                <>
                                  {app.enquiry_status !== "enrolled" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleConfirmAdmission(app.id)}
                                      className="h-8 px-2.5 text-xs rounded-xl text-emerald-600 border-emerald-500/30 font-semibold"
                                    >
                                      Confirm
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openHostelModal(app)}
                                    className="h-8 px-2.5 text-xs rounded-xl font-semibold gap-1"
                                  >
                                    <BedDouble className="w-3.5 h-3.5" /> Assign Hostel
                                  </Button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </div>

              {/* 10 Per Page Pagination */}
              <SmartTablePagination
                currentPage={appsCurrentPage}
                totalPages={appsTotalPages}
                totalCount={totalAppsCount}
                pageSize={10}
                onPageChange={(p) => fetchApplications(p)}
                isLoading={isLoadingApps}
              />
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: VERIFICATION MODAL (STEP 3)                          */}
      {/* ------------------------------------------------------------- */}
      <Dialog open={!!selectedAppForVerify} onOpenChange={(open) => !open && setSelectedAppForVerify(null)}>
        <DialogContent className="w-[96vw] sm:w-[90vw] lg:w-[680px] max-w-2xl p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-4 sm:p-6 bg-gradient-to-r from-primary/10 via-background to-secondary/10 border-b">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold">
                  Document & Quota Verification
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Review applicant's certificates & eligibility details.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedAppForVerify && (
            <div className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-muted/50 border border-border">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Candidate</span>
                  <span className="font-bold text-foreground">{selectedAppForVerify.student_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Minority Community</span>
                  <span className="font-bold text-primary">{selectedAppForVerify.minority_community}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Caste Category</span>
                  <span className="font-bold text-foreground">{selectedAppForVerify.caste_category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Annual Family Income</span>
                  <span className="font-bold text-foreground">
                    {selectedAppForVerify.annual_income != null
                      ? `₹${selectedAppForVerify.annual_income.toLocaleString()}`
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Resident Type</span>
                  <span className="font-bold text-foreground">
                    {selectedAppForVerify.is_rural ? "Rural Resident" : "Urban"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Academic Marks %</span>
                  <span className="font-bold text-emerald-600">{selectedAppForVerify.academic_percentage}%</span>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-foreground">Counselor Verification Notes / Remarks</Label>
                <textarea
                  rows={3}
                  value={verificationNotes}
                  disabled={!isCrudUser}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="e.g. Caste & Income certificate verified against Seva Sindhu RD number..."
                  className="w-full mt-1.5 p-3 rounded-xl border bg-card text-xs focus:ring-1 focus:ring-primary"
                />
              </div>

              {isCrudUser ? (
                <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSubmittingVerify}
                    onClick={() => handleVerify("DEFICIENT")}
                    className="h-9 px-3 text-xs text-amber-600 border-amber-500/30 rounded-xl"
                  >
                    Flag as Deficient
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isSubmittingVerify}
                    onClick={() => handleVerify("REJECTED")}
                    className="h-9 px-3 text-xs rounded-xl"
                  >
                    Reject Application
                  </Button>
                  <Button
                    size="sm"
                    disabled={isSubmittingVerify}
                    onClick={() => handleVerify("VERIFIED")}
                    className="h-9 px-4 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve & Verify
                  </Button>
                </div>
              ) : (
                <div className="flex justify-end pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => setSelectedAppForVerify(null)}>
                    Close
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: HOSTEL ALLOCATION MODAL (STEP 10)                    */}
      {/* ------------------------------------------------------------- */}
      <Dialog open={!!selectedAppForHostel} onOpenChange={(open) => !open && setSelectedAppForHostel(null)}>
        <DialogContent className="w-[96vw] sm:w-[90vw] lg:w-[500px] max-w-md p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-4 sm:p-5 bg-gradient-to-r from-purple-500/10 via-background to-secondary/10 border-b">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-600 flex items-center justify-center font-bold">
                <BedDouble className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Hostel Bed Assignment</DialogTitle>
                <DialogDescription className="text-xs">
                  Map residential room and bed against student profile.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedAppForHostel && (
            <div className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-muted/60 border">
                <span className="font-bold text-foreground block">{selectedAppForHostel.student_name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {selectedAppForHostel.application_number} • {selectedAppForHostel.gender}
                </span>
              </div>

              <div>
                <Label className="text-[11px] text-muted-foreground">Hostel Block (Registered in Database)</Label>
                <Select
                  value={hostelBlock}
                  onValueChange={(val) => {
                    setHostelBlock(val);
                    const found = hostelsList.find((h) => h.name === val);
                    if (found) {
                      setSelectedHostelId(found.id);
                      if (found.rooms && found.rooms.length > 0) {
                        setHostelRoom(found.rooms[0].name);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl mt-1 font-semibold">
                    <SelectValue placeholder="Select Registered Hostel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hostelsList.map((h) => (
                      <SelectItem key={h.id} value={h.name}>
                        {h.name} {h.gender ? `(${h.gender === "M" ? "Boys" : "Girls"})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Room Number</Label>
                  {(() => {
                    const currentHostel = hostelsList.find((h) => h.name === hostelBlock);
                    const currentRooms = currentHostel?.rooms || [];
                    if (currentRooms.length > 0) {
                      return (
                        <Select value={hostelRoom} onValueChange={setHostelRoom}>
                          <SelectTrigger className="h-9 text-xs rounded-xl mt-1 font-bold">
                            <SelectValue placeholder="Select Room" />
                          </SelectTrigger>
                          <SelectContent>
                            {currentRooms.map((r: any) => (
                              <SelectItem key={r.id || r.name} value={r.name}>
                                {r.name} {r.floor !== undefined ? `(Floor ${r.floor})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    }
                    return (
                      <Input
                        value={hostelRoom}
                        onChange={(e) => setHostelRoom(e.target.value)}
                        placeholder="e.g. Room 101"
                        className="h-9 text-xs font-bold rounded-xl mt-1"
                      />
                    );
                  })()}
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground">Bed Number</Label>
                  <Select value={hostelBed} onValueChange={setHostelBed}>
                    <SelectTrigger className="h-9 text-xs rounded-xl mt-1 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bed-A">Bed-A</SelectItem>
                      <SelectItem value="Bed-B">Bed-B</SelectItem>
                      <SelectItem value="Bed-C">Bed-C</SelectItem>
                      <SelectItem value="Bed-D">Bed-D</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-[11px] text-muted-foreground">Mess Card ID (Optional)</Label>
                <Input
                  value={messCardNo}
                  onChange={(e) => setMessCardNo(e.target.value)}
                  placeholder="e.g. MC-9021"
                  className="h-9 text-xs rounded-xl mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button variant="outline" size="sm" onClick={() => setSelectedAppForHostel(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAllocateHostel}
                  disabled={isSubmittingHostel}
                  className="h-9 px-4 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Confirm Bed Allotment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: ALLOTMENT SLIP PREVIEW (STEP 7)                      */}
      {/* ------------------------------------------------------------- */}
      <Dialog open={!!selectedAppForAllotment} onOpenChange={(open) => !open && setSelectedAppForAllotment(null)}>
        <DialogContent className="w-[96vw] sm:w-[90vw] lg:w-[600px] max-w-lg p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="p-4 sm:p-5 bg-gradient-to-r from-primary/15 via-background to-secondary/10 border-b">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">Official Allotment Letter</DialogTitle>
                <DialogDescription className="text-xs">
                  Karnataka Minority Residential Schools Allotment Order
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedAppForAllotment && (
            <div className="p-5 space-y-4 text-xs">
              <div className="p-4 rounded-xl border bg-card space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground font-mono">{selectedAppForAllotment.application_number}</span>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold text-[10px]">
                    SEAT ALLOTTED ✓
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Student Name</span>
                    <span className="font-bold text-foreground text-sm">{selectedAppForAllotment.student_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Allotted Quota</span>
                    <span className="font-bold text-primary">{selectedAppForAllotment.allotment?.category_quota}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Allotted Institution</span>
                    <span className="font-bold text-foreground">{selectedAppForAllotment.allotment?.allotted_institution}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Class / Stream</span>
                    <span className="font-bold text-foreground">{selectedAppForAllotment.allotment?.allotted_class || "Class 6"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Reporting Date</span>
                    <span className="font-bold text-amber-600">
                      {selectedAppForAllotment.allotment?.reporting_date || "2026-06-25"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Merit Rank</span>
                    <span className="font-bold text-foreground">#{selectedAppForAllotment.merit_rank}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border text-[11px] text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Reporting Instructions:</p>
                <p>1. Please carry original Caste & Income Certificate, 10th/5th Marks Card, and Aadhaar Card.</p>
                <p>2. Admission and residential hostel boarding are 100% scholarship funded by Directorate of Minorities.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedAppForAllotment(null)}>
                  Close
                </Button>
                <Button
                  size="sm"
                  disabled={true}
                  className="h-8 text-xs rounded-xl bg-primary text-primary-foreground font-semibold gap-1.5 opacity-50 cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF Slip
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

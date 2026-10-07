import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fetchWithTokenRefresh } from "@/utils/authService";
import { API_ENDPOINT } from "@/utils/config";
import {
  getDistrictsForState,
  getTaluksForDistrict,
  INSTITUTION_MANAGEMENT_TYPES,
} from "@/utils/indian_states_districts";
import {
  Search,
  Building2,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Loader2,
  RefreshCw,
  Plus,
  School,
  Phone,
  SlidersHorizontal,
  X,
  Compass,
} from "lucide-react";

interface AddSchoolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrg?: (org: any) => void;
  onNavigateCreateOrg?: () => void;
}

export const AddSchoolSearchModal: React.FC<AddSchoolSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectOrg,
  onNavigateCreateOrg,
}) => {
  const { toast } = useToast();

  // State is fixed to Karnataka
  const FIXED_STATE = "Karnataka";

  // Filter States - Start with clean/unselected state
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedTaluk, setSelectedTaluk] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Data States
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [registeredVillagesList, setRegisteredVillagesList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [switchingId, setSwitchingId] = useState<number | null>(null);
  const requestSeqRef = useRef(0);

  const currentSavedOrgId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("selectedOrgId") || localStorage.getItem("selectedOrgId")
      : null;

  // Karnataka Districts List
  const districtsList = useMemo(() => {
    return getDistrictsForState(FIXED_STATE);
  }, []);

  // Cascading Taluks List for selected District
  const taluksList = useMemo(() => {
    if (!selectedDistrict) return [];
    return getTaluksForDistrict(selectedDistrict);
  }, [selectedDistrict]);

  // Handle District Change -> Resets taluk, village, and village list
  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    setSelectedTaluk("");
    setSelectedVillage("");
    setRegisteredVillagesList([]);
  };

  // Handle Taluk Change -> Resets village selection
  const handleTalukChange = (taluk: string) => {
    setSelectedTaluk(taluk);
    setSelectedVillage("");
  };

  // Debounced search on filter or search query change with sequence ref and AbortController
  useEffect(() => {
    if (!isOpen) return;

    if (!selectedDistrict || !selectedTaluk) {
      setInstitutions([]);
      setRegisteredVillagesList([]);
      setIsLoading(false);
      return;
    }

    const abortController = new AbortController();
    const currentSeq = ++requestSeqRef.current;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        params.append("state", FIXED_STATE);
        params.append("district", selectedDistrict);
        params.append("taluk", selectedTaluk);
        if (selectedVillage && selectedVillage !== "all") params.append("village_city", selectedVillage);
        if (searchQuery.trim()) params.append("search", searchQuery.trim());

        const response = await fetchWithTokenRefresh(
          `${API_ENDPOINT}/org-admin/search-institutions/?${params.toString()}`,
          { signal: abortController.signal }
        );
        const data = await response.json().catch(() => ({}));

        // Discard stale responses if a newer request was started or aborted
        if (requestSeqRef.current !== currentSeq || abortController.signal.aborted) {
          return;
        }

        if (response.ok && data.success) {
          setInstitutions(data.institutions || []);
          
          if (Array.isArray(data.registered_villages) && data.registered_villages.length > 0) {
            setRegisteredVillagesList(data.registered_villages);
          } else {
            const extracted = Array.from(
              new Set(
                (data.institutions || [])
                  .map((inst: any) => inst.village_city)
                  .filter((v: any) => typeof v === "string" && v.trim().length > 0)
              )
            ) as string[];
            setRegisteredVillagesList(extracted);
          }
        } else {
          toast({
            variant: "destructive",
            title: "Failed to Fetch Schools",
            description: data.message || "Could not load registered institutions.",
          });
        }
      } catch (err: any) {
        if (err.name === "AbortError" || abortController.signal.aborted || requestSeqRef.current !== currentSeq) {
          return;
        }
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: err.message || "Failed to search institutions.",
        });
      } finally {
        if (requestSeqRef.current === currentSeq && !abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [
    isOpen,
    selectedDistrict,
    selectedTaluk,
    selectedVillage,
    searchQuery,
  ]);

  // Reset Filters
  const handleResetFilters = () => {
    requestSeqRef.current++;
    setSearchQuery("");
    setSelectedDistrict("");
    setSelectedTaluk("");
    setSelectedVillage("");
    setInstitutions([]);
    setRegisteredVillagesList([]);
  };

  // Direct Select & Switch Dashboard without OTP
  const handleSelectAndSwitch = async (org: any) => {
    setSwitchingId(org.id);
    try {
      // Automatically link to org_admin account if not already linked
      const linkRes = await fetchWithTokenRefresh(`${API_ENDPOINT}/org-admin/direct-link-organization/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization_id: org.id }),
      });
      const linkData = await linkRes.json().catch(() => ({}));

      if (!linkRes.ok || !linkData.success) {
        throw new Error(linkData.message || "Failed to link institution.");
      }

      // Update Session Storage & Context
      sessionStorage.setItem("selectedOrgId", org.id.toString());
      localStorage.setItem("selectedOrgId", org.id.toString());

      toast({
        title: "Switched Dashboard",
        description: `Now viewing metrics and records for ${org.name}.`,
      });

      if (onSelectOrg) {
        onSelectOrg(org);
      }

      onClose();

      // Refresh to load new organization context across entire dashboard
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Switch Failed",
        description: err.message || "Failed to switch institution dashboard.",
      });
    } finally {
      setSwitchingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[96vw] sm:w-[92vw] lg:w-[860px] max-w-4xl max-h-[94vh] sm:max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl shadow-2xl border bg-card text-foreground">
        {/* Header - Responsive Layout */}
        <DialogHeader className="p-4 sm:p-5 lg:p-6 pb-3 sm:pb-4 bg-gradient-to-r from-primary/10 via-background to-secondary/10 border-b border-border">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-sm shrink-0">
                <School className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <DialogTitle className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-foreground truncate">
                    Find &amp; Switch School
                  </DialogTitle>
                  <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                    Karnataka
                  </span>
                </div>
                <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2 sm:line-clamp-1">
                  Select District and Taluk / Block to list available registered colleges.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Filter Controls Section - Responsive for Mobile, Tablets & Laptops */}
        <div className="p-3.5 sm:p-5 lg:p-6 pb-3.5 sm:pb-4 border-b border-border bg-muted/20 space-y-3 sm:space-y-3.5">
          {/* Global Search Bar (College Name, Pincode, Village Name) */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by college name, pincode (e.g. 587101), or village..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!selectedDistrict || !selectedTaluk}
              className="pl-9 sm:pl-10 pr-9 sm:pr-10 h-10 sm:h-11 text-xs sm:text-sm bg-background border-border rounded-xl shadow-inner focus-visible:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Location Filters Row: Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 items-end">
            {/* 1. District */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary shrink-0" /> District <span className="text-primary">*</span>
              </label>
              <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
                <SelectTrigger className="h-9 sm:h-10 text-xs rounded-lg bg-background font-medium">
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {districtsList.map((dist) => (
                    <SelectItem key={dist} value={dist}>
                      {dist}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Taluk / Block */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-500 shrink-0" /> Taluk / Block <span className="text-primary">*</span>
              </label>
              <Select
                value={selectedTaluk}
                onValueChange={handleTalukChange}
                disabled={!selectedDistrict}
              >
                <SelectTrigger className="h-9 sm:h-10 text-xs rounded-lg bg-background font-medium disabled:opacity-50">
                  <SelectValue placeholder={selectedDistrict ? "Select Taluk" : "Select District First"} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {taluksList.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Village / Town + Reset Button */}
            <div className="space-y-1 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  Village / Town
                </label>
                {selectedTaluk && registeredVillagesList.length > 0 && (
                  <span className="text-[10px] text-primary font-medium">
                    ({registeredVillagesList.length} registered)
                  </span>
                )}
              </div>
              <div className="flex gap-1.5">
                <Select
                  value={selectedVillage}
                  onValueChange={setSelectedVillage}
                  disabled={!selectedTaluk}
                >
                  <SelectTrigger className="h-9 sm:h-10 text-xs rounded-lg bg-background disabled:opacity-50 flex-1">
                    <SelectValue
                      placeholder={
                        !selectedTaluk
                          ? "Select Taluk First"
                          : registeredVillagesList.length === 0
                          ? "No Registered Villages"
                          : "All Registered Villages"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">All Registered Villages</SelectItem>
                    {registeredVillagesList.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(selectedDistrict || selectedTaluk || selectedVillage || searchQuery) && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleResetFilters}
                    title="Clear All Selections"
                    className="h-9 sm:h-10 w-9 sm:w-10 shrink-0 rounded-lg hover:bg-muted"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results List Section - Scrollable Responsive Container */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 lg:p-6 space-y-3 min-h-[260px] sm:min-h-[300px]">
          {selectedDistrict && selectedTaluk && (
            <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                Registered Colleges ({institutions.length})
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-md border border-primary/20 truncate max-w-full">
                📍 {selectedDistrict} &gt; {selectedTaluk}
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-muted-foreground gap-3">
              <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin text-primary" />
              <p className="text-xs font-medium">Fetching registered colleges...</p>
            </div>
          ) : !selectedDistrict || !selectedTaluk ? (
            <div className="flex flex-col items-center justify-center py-10 sm:py-14 px-4 text-center rounded-2xl border border-dashed border-border bg-muted/10 space-y-2.5 sm:space-y-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
                <Compass className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base text-foreground">Select District &amp; Taluk / Block</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  Please choose a <strong>District</strong> and <strong>Taluk / Block</strong> from the dropdowns above to list registered colleges and registered villages in that area.
                </p>
              </div>
            </div>
          ) : institutions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 sm:py-12 px-4 text-center rounded-xl border border-dashed border-border bg-muted/10 space-y-2.5 sm:space-y-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">No Colleges Found in {selectedDistrict} ({selectedTaluk})</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  {searchQuery || (selectedVillage && selectedVillage !== "all")
                    ? "No registered colleges matched your search or village filter in this taluk."
                    : `No registered colleges found in ${selectedTaluk} taluk yet. You can register a new college below.`}
                </p>
              </div>
              {(searchQuery || (selectedVillage && selectedVillage !== "all")) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedVillage("");
                  }}
                  className="text-xs rounded-lg mt-1 sm:mt-2"
                >
                  Clear Search &amp; Village Filter
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
              {institutions.map((org) => {
                const isCurrentActive =
                  currentSavedOrgId && currentSavedOrgId.toString() === org.id.toString();
                const isSwitching = switchingId === org.id;

                return (
                  <div
                    key={org.id}
                    className={`relative flex flex-col justify-between p-3.5 sm:p-4 rounded-xl border transition-all duration-200 ${
                      isCurrentActive
                        ? "bg-primary/5 border-primary/40 shadow-sm ring-1 ring-primary/20"
                        : "bg-card border-border hover:border-primary/30 hover:shadow-md"
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                            {org.logo_url ? (
                              <img
                                src={org.logo_url}
                                alt={org.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Building2 className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-foreground truncate" title={org.name}>
                              {org.name}
                            </h4>
                            {org.management ? (
                              <span className="text-[10px] sm:text-[11px] font-semibold text-primary">
                                {INSTITUTION_MANAGEMENT_TYPES.find(
                                  (m) => m.toLowerCase() === org.management?.toLowerCase()
                                ) || org.management}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {isCurrentActive && (
                          <span className="shrink-0 flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>

                      {/* Location Tags */}
                      <div className="flex flex-wrap gap-1 sm:gap-1.5 my-2">
                        <span className="text-[10px] font-medium bg-muted px-1.5 sm:px-2 py-0.5 rounded-md text-foreground border border-border/60">
                          📍 {org.district || selectedDistrict}
                        </span>
                        <span className="text-[10px] font-medium bg-muted px-1.5 sm:px-2 py-0.5 rounded-md text-foreground border border-border/60">
                          🏛️ {org.taluk || selectedTaluk}
                        </span>
                        {org.village_city && (
                          <span className="text-[10px] font-medium bg-muted px-1.5 sm:px-2 py-0.5 rounded-md text-foreground border border-border/60">
                            🏘️ {org.village_city}
                          </span>
                        )}
                        {org.pincode && (
                          <span className="text-[10px] font-medium bg-muted px-1.5 sm:px-2 py-0.5 rounded-md text-muted-foreground border border-border/60">
                            📮 {org.pincode}
                          </span>
                        )}
                      </div>

                      {/* Principal / Contact info */}
                      {org.principal_name && (
                        <div className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 space-y-0.5 border-t border-border/50 pt-1.5 sm:pt-2">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-medium text-foreground">Principal:</span> {org.principal_name}
                          </div>
                          {org.principal_phone && (
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="truncate">{org.principal_phone}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Switch Button */}
                    <div className="mt-3 pt-2 flex items-center justify-end border-t border-border/50">
                      <Button
                        size="sm"
                        disabled={isSwitching || isCurrentActive}
                        onClick={() => handleSelectAndSwitch(org)}
                        className={`h-8 text-xs font-semibold rounded-lg px-3.5 transition-all w-full sm:w-auto ${
                          isCurrentActive
                            ? "bg-muted text-muted-foreground cursor-default"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                        }`}
                      >
                        {isSwitching ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            Switching...
                          </>
                        ) : isCurrentActive ? (
                          "Current Dashboard"
                        ) : (
                          <>
                            Select &amp; Switch
                            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions - Responsive */}
        <div className="p-3 sm:p-4 px-4 sm:px-6 border-t border-border bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="text-[11px] sm:text-xs text-muted-foreground text-center sm:text-left">
            Can't find your college? You can register and add a new institution directly.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs rounded-xl h-8 sm:h-9 flex-1 sm:flex-initial"
            >
              Close
            </Button>
            {onNavigateCreateOrg && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  onClose();
                  onNavigateCreateOrg();
                }}
                className="text-xs rounded-xl h-8 sm:h-9 font-semibold gap-1.5 shadow-sm flex-1 sm:flex-initial"
              >
                <Plus className="w-3.5 h-3.5" />
                Register New Institution
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddSchoolSearchModal;

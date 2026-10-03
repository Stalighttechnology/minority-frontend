import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  User,
  Mail,
  Phone,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Shield,
  Globe,
  ChevronLeft,
  Camera,
  Sparkles,
  School,
  MapPin,
  Check,
  Copy,
  ExternalLink,
  Layers
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_ENDPOINT } from "@/utils/config";
import { useToast } from "@/hooks/use-toast";
import { fetchWithTokenRefresh } from "@/utils/authService";
import { getIndianStates, getDistrictsForState, getTaluksForDistrict, getVillagesForTaluk } from "@/utils/indian_states_districts";

interface CreateOrganizationPageProps {
  onNavigate?: (page: string) => void;
}

export const CreateOrganizationPage: React.FC<CreateOrganizationPageProps> = ({
  onNavigate,
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [pincodeError, setPincodeError] = useState("");
  const [createdOrgData, setCreatedOrgData] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customVillage, setCustomVillage] = useState(false);

  const indianStates = getIndianStates();

  const [formData, setFormData] = useState({
    org_name: "",
    admin_name: "",
    email: "",
    phone: "",
    plan: "advance",
    accreditation_id: "",
    institution_type: "school",
    state: "Karnataka",
    district: "Bengaluru Urban",
    taluk: "Bengaluru North",
    village_city: "Peenya",
    pincode: "",
    institution_address: "",
    billing_address: "",
    tax_id: "",
    tech_poc_name: "",
    tech_poc_email: "",
    tech_poc_mobile: "",
    role: "Principal",
    students_count: "500",
    billing_cycle: "Yearly",
  });

  const [districtsList, setDistrictsList] = useState<string[]>(
    getDistrictsForState("Karnataka")
  );

  const [taluksList, setTaluksList] = useState<string[]>(
    getTaluksForDistrict("Bengaluru Urban")
  );

  const [villagesList, setVillagesList] = useState<string[]>(
    getVillagesForTaluk("Bengaluru North")
  );

  useEffect(() => {
    const districts = getDistrictsForState(formData.state);
    setDistrictsList(districts);
    if (districts.length > 0 && !districts.includes(formData.district)) {
      setFormData((prev) => ({ ...prev, district: districts[0] }));
    }
  }, [formData.state]);

  useEffect(() => {
    const taluks = getTaluksForDistrict(formData.district);
    setTaluksList(taluks);
    if (taluks.length > 0 && !taluks.includes(formData.taluk)) {
      setFormData((prev) => ({ ...prev, taluk: taluks[0] }));
    }
  }, [formData.district]);

  useEffect(() => {
    const villages = getVillagesForTaluk(formData.taluk);
    setVillagesList(villages);
    if (villages.length > 0) {
      if (!villages.includes(formData.village_city) && !customVillage) {
        setFormData((prev) => ({ ...prev, village_city: villages[0] }));
      }
    } else {
      setCustomVillage(true);
    }
  }, [formData.taluk]);

  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.org_name.trim()) {
        toast({
          variant: "destructive",
          title: "Required Field",
          description: "Institution / Organization name is required.",
        });
        return;
      }
      if (!formData.state.trim() || !formData.district.trim()) {
        toast({
          variant: "destructive",
          title: "Required Fields",
          description: "State and District are required.",
        });
        return;
      }
      if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode.trim())) {
        setPincodeError("Please enter a valid 6-digit Pincode.");
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.admin_name.trim() || !formData.email.trim() || !formData.phone.trim()) {
        toast({
          variant: "destructive",
          title: "Required Fields",
          description: "All primary administrator details are required.",
        });
        return;
      }
      if (!/^\d{10}$/.test(formData.phone.trim())) {
        setPhoneError("Phone number must be exactly 10 digits.");
        return;
      }
    }
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const handleCreateOrganization = async () => {
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("org_name", formData.org_name.trim());
      payload.append("institution_type", formData.institution_type);
      payload.append("accreditation_id", formData.accreditation_id.trim());
      payload.append("state", formData.state.trim());
      payload.append("district", formData.district.trim());
      payload.append("taluk", formData.taluk.trim());
      payload.append("village_city", formData.village_city.trim());
      payload.append("pincode", formData.pincode.trim());
      
      const villagePart = formData.village_city ? `${formData.village_city}, ` : "";
      const talukPart = formData.taluk ? `${formData.taluk}, ` : "";
      const combinedAddress = formData.institution_address.trim()
        ? `${formData.institution_address.trim()}, ${villagePart}${talukPart}${formData.district}, ${formData.state} - ${formData.pincode.trim()}`
        : `${villagePart}${talukPart}${formData.district}, ${formData.state} - ${formData.pincode.trim()}`;
      
      payload.append("institution_address", combinedAddress);
      payload.append("billing_address", (formData.billing_address || combinedAddress).trim());
      payload.append("tax_id", formData.tax_id.trim());
      payload.append("admin_name", formData.admin_name.trim());
      payload.append("email", formData.email.trim().toLowerCase());
      payload.append("phone", formData.phone.trim());
      payload.append("role", formData.role);
      payload.append("students_count", formData.students_count);
      payload.append("plan", "advance");

      if (formData.tech_poc_name) payload.append("tech_poc_name", formData.tech_poc_name.trim());
      if (formData.tech_poc_email) payload.append("tech_poc_email", formData.tech_poc_email.trim());
      if (formData.tech_poc_mobile) payload.append("tech_poc_mobile", formData.tech_poc_mobile.trim());

      if (logo) {
        payload.append("logo", logo);
      }

      const response = await fetchWithTokenRefresh(
        `${API_ENDPOINT}/org-admin/create-organization/`,
        {
          method: "POST",
          body: payload,
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setCreatedOrgData(data);

        toast({
          title: "Institution Created!",
          description: `"${data.organization?.name || formData.org_name}" provisioned under ${formData.state} → ${formData.district} → ${formData.taluk} → ${formData.village_city || "Village"} → ${formData.pincode}.`,
        });

        // Trigger in-memory refresh across Navbar & context without using localStorage
        window.dispatchEvent(
          new CustomEvent("refresh-linked-organizations", {
            detail: {
              newOrgId: data.organization?.id,
              newOrg: data.organization,
            },
          })
        );
      } else {
        toast({
          variant: "destructive",
          title: "Creation Failed",
          description: data.message || "Failed to create organization. Please try again.",
        });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: err.message || "Failed to connect to server.",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const steps = [
    { id: 1, name: "Institutional Identity" },
    { id: 2, name: "Administrative Ownership" },
    { id: 3, name: "Configuration & Deployment" },
  ];

  if (success && createdOrgData) {
    return (
      <div className="w-full p-4 sm:p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-2xl border p-8 shadow-xl text-center space-y-6"
        >
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle2 size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Institution Successfully Provisioned!
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              <strong className="text-foreground">{createdOrgData.organization?.name}</strong> has been created and linked to your Organization Administrator account.
            </p>
          </div>

          {/* Credentials Card */}
          {createdOrgData.credentials && (
            <div className="bg-muted/50 rounded-xl p-5 border text-left max-w-lg mx-auto space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Principal Account Credentials
                </span>
                <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                  {createdOrgData.credentials.role?.toUpperCase()}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Username / ID:</span>
                  <div className="flex items-center gap-1.5">
                    <code className="font-bold text-foreground bg-background px-2 py-0.5 rounded">
                      {createdOrgData.credentials.username}
                    </code>
                    <button
                      onClick={() => copyToClipboard(createdOrgData.credentials.username, "username")}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {copiedKey === "username" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Registered Email:</span>
                  <span className="font-medium text-foreground">{createdOrgData.credentials.email}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Temporary Password:</span>
                  <div className="flex items-center gap-1.5">
                    <code className="font-bold text-foreground bg-background px-2 py-0.5 rounded">
                      {createdOrgData.credentials.password}
                    </code>
                    <button
                      onClick={() => copyToClipboard(createdOrgData.credentials.password, "password")}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {copiedKey === "password" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              onClick={() => {
                if (onNavigate) {
                  onNavigate("college-details");
                }
              }}
              className="font-bold gap-2"
            >
              <Building2 size={16} /> View Institution Details
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSuccess(false);
                setCreatedOrgData(null);
                setCurrentStep(1);
                setFormData({
                  org_name: "",
                  admin_name: "",
                  email: "",
                  phone: "",
                  plan: "advance",
                  accreditation_id: "",
                  institution_type: "school",
                  state: "Karnataka",
                  district: "Bengaluru Urban",
                  taluk: "Bengaluru North",
                  village_city: "Peenya",
                  pincode: "",
                  institution_address: "",
                  billing_address: "",
                  tax_id: "",
                  tech_poc_name: "",
                  tech_poc_email: "",
                  tech_poc_mobile: "",
                  role: "Principal",
                  students_count: "500",
                  billing_cycle: "Yearly",
                });
                setLogo(null);
                setLogoPreview(null);
              }}
              className="font-semibold"
            >
              Add Another Institution
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Breadcrumb / Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div className="space-y-1">
          {currentStep > 1 && (
            <div className="flex items-center gap-2 mb-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                className="h-8 px-2 text-muted-foreground hover:text-foreground gap-1 font-semibold"
              >
                <ChevronLeft size={16} /> Back
              </Button>
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Create & Link New Institution
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Provision a complete educational institution under your master Organization Administrator account.
          </p>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-xl border shrink-0 self-start sm:self-auto">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === step.id
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : currentStep > step.id
                    ? "bg-emerald-600 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > step.id ? <Check size={14} /> : step.id}
              </div>
              {step.id < 3 && (
                <div
                  className={`w-4 sm:w-6 h-0.5 mx-1 transition-all ${
                    currentStep > step.id ? "bg-emerald-600" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Wizard Card */}
      <div className="bg-card rounded-2xl border shadow-xl p-6 sm:p-9">
        <AnimatePresence mode="wait">
          {/* STEP 1: Institutional Identity */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="space-y-1 pb-4 border-b">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <School size={16} /> Step 1 of 3
                </div>
                <h2 className="text-2xl font-bold text-foreground">Institutional Identity</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Core identity, accreditation, and location details of the educational institution.
                </p>
              </div>

              <div className="space-y-5">
                {/* Org Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Organization / Institution Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    placeholder="e.g. Morarji Desai Residential School, Bengaluru"
                    className="h-11 rounded-xl bg-background border-input focus:ring-2 focus:ring-primary/20 text-sm"
                    value={formData.org_name}
                    onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Board / Affiliation */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Board / Affiliation / Reg. ID
                    </label>
                    <Input
                      placeholder="e.g. KSEEB / CBSE / State Board"
                      className="h-11 rounded-xl bg-background border-input text-sm"
                      value={formData.accreditation_id}
                      onChange={(e) => setFormData({ ...formData, accreditation_id: e.target.value })}
                    />
                  </div>

                  {/* Institution Type (Fixed) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Institution Type
                    </label>
                    <div className="h-11 rounded-xl bg-muted/50 border border-input px-3.5 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <School size={16} className="text-primary shrink-0" />
                      <span>School (Minority / Residential K-12)</span>
                    </div>
                  </div>
                </div>

                {/* Brand Logo Upload */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Institutional Crest / Brand Logo
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-muted/40 border border-input rounded-xl cursor-pointer hover:bg-muted/70 transition-colors">
                    <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center overflow-hidden border shrink-0">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera size={18} className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {logo ? logo.name : "Upload School / College Logo"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">PNG, JPG, or SVG up to 5MB</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                  </label>
                </div>

                {/* Institution Hierarchy: State → District → Taluk → Village → Pincode */}
                <div className="p-4 bg-muted/30 border border-border/80 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary">
                      <Layers size={16} /> Institution Geographic Hierarchy (Karnataka)
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Karnataka → District → Taluk → Village / City → Pincode
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {/* Fixed State: Karnataka */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        State
                      </label>
                      <div className="h-11 rounded-xl bg-muted/50 border border-input px-3 flex items-center justify-between text-xs font-bold text-foreground">
                        <span>Karnataka</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-semibold border border-emerald-500/20">
                          State Gov
                        </span>
                      </div>
                    </div>

                    {/* District Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        District <span className="text-destructive">*</span>
                      </label>
                      <Select
                        value={formData.district}
                        onValueChange={(value) => setFormData({ ...formData, district: value })}
                      >
                        <SelectTrigger className="h-11 rounded-xl bg-background border-input text-xs font-medium">
                          <SelectValue placeholder="Select District" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {districtsList.map((d) => (
                            <SelectItem key={d} value={d} className="text-xs">
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Taluk Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Taluk / Block
                      </label>
                      {taluksList.length > 0 ? (
                        <Select
                          value={formData.taluk}
                          onValueChange={(value) => setFormData({ ...formData, taluk: value })}
                        >
                          <SelectTrigger className="h-11 rounded-xl bg-background border-input text-xs font-medium">
                            <SelectValue placeholder="Select Taluk" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {taluksList.map((t) => (
                              <SelectItem key={t} value={t} className="text-xs">
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="e.g. Taluk name"
                          className="h-11 rounded-xl bg-background border-input text-xs font-medium"
                          value={formData.taluk}
                          onChange={(e) => setFormData({ ...formData, taluk: e.target.value })}
                        />
                      )}
                    </div>

                    {/* Village / Ward / City Selector */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Village / Town
                        </label>
                        {villagesList.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setCustomVillage(!customVillage)}
                            className="text-[10px] text-primary hover:underline font-semibold"
                          >
                            {customVillage ? "Select from list" : "Type custom"}
                          </button>
                        )}
                      </div>
                      {villagesList.length > 0 && !customVillage ? (
                        <Select
                          value={formData.village_city}
                          onValueChange={(value) => {
                            if (value === "__custom__") {
                              setCustomVillage(true);
                              setFormData({ ...formData, village_city: "" });
                            } else {
                              setFormData({ ...formData, village_city: value });
                            }
                          }}
                        >
                          <SelectTrigger className="h-11 rounded-xl bg-background border-input text-xs font-medium">
                            <SelectValue placeholder="Select Village / Ward" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {villagesList.map((v) => (
                              <SelectItem key={v} value={v} className="text-xs">
                                {v}
                              </SelectItem>
                            ))}
                            <SelectItem value="__custom__" className="text-xs text-primary font-bold">
                              + Enter Other Village / Ward
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="e.g. Village / Ward name"
                          className="h-11 rounded-xl bg-background border-input text-xs font-medium"
                          value={formData.village_city}
                          onChange={(e) => setFormData({ ...formData, village_city: e.target.value })}
                        />
                      )}
                    </div>

                    {/* Pincode Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Pincode <span className="text-destructive">*</span>
                      </label>
                      <Input
                        required
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 560001"
                        className="h-11 rounded-xl bg-background border-input text-xs font-mono font-medium"
                        value={formData.pincode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setFormData({ ...formData, pincode: val });
                          if (val.length === 6) setPincodeError("");
                        }}
                      />
                      {pincodeError && <p className="text-[11px] text-destructive font-semibold">{pincodeError}</p>}
                    </div>
                  </div>

                  {/* Hierarchy Visual Breadcrumb */}
                  {formData.state && formData.district && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] bg-background/80 px-3 py-1.5 rounded-lg border text-muted-foreground">
                      <MapPin size={12} className="text-primary shrink-0" />
                      <span className="font-semibold text-foreground">{formData.state}</span>
                      <span>›</span>
                      <span className="font-semibold text-foreground">{formData.district}</span>
                      {formData.taluk && (
                        <>
                          <span>›</span>
                          <span className="font-semibold text-foreground">{formData.taluk}</span>
                        </>
                      )}
                      {formData.village_city && (
                        <>
                          <span>›</span>
                          <span className="font-semibold text-foreground">{formData.village_city}</span>
                        </>
                      )}
                      {formData.pincode && (
                        <>
                          <span>›</span>
                          <span className="font-mono font-bold text-primary">{formData.pincode}</span>
                        </>
                      )}
                      {formData.org_name && (
                        <>
                          <span>›</span>
                          <span className="font-semibold text-foreground truncate max-w-[150px]">
                            {formData.org_name}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Institution Physical Address (Street / Landmark) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Campus Street Address / Landmark (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Near Taluk Office, Main Road, Vidyanagar"
                    className="h-11 rounded-xl bg-background border-input text-sm"
                    value={formData.institution_address}
                    onChange={(e) => setFormData({ ...formData, institution_address: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  onClick={nextStep}
                  className="h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white gap-2 shadow-md shadow-primary/25"
                >
                  Continue to Administrative Details
                  <ArrowRight size={16} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Administrative Ownership */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="space-y-1 pb-4 border-b">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <User size={16} /> Step 2 of 3
                </div>
                <h2 className="text-2xl font-bold text-foreground">Primary Administrator</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Assign the institution head (Principal or Admin) who will receive master credentials.
                </p>
              </div>

              <div className="space-y-5">
                {/* Role */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Administrative Role <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-background border-input text-sm">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Principal">Principal / Head of Institution</SelectItem>
                      <SelectItem value="Admin">Institution Administrator</SelectItem>
                      <SelectItem value="Dean">Dean / Director</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Administrator Full Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    placeholder="e.g. Dr. Ramesh Kumar"
                    className="h-11 rounded-xl bg-background border-input text-sm"
                    value={formData.admin_name}
                    onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Official Email Address <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    type="email"
                    placeholder="principal@institution.gov.in"
                    className="h-11 rounded-xl bg-background border-input text-sm"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                {/* Mobile Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Contact Mobile Number <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    type="tel"
                    placeholder="10-digit registered mobile number"
                    className="h-11 rounded-xl bg-background border-input text-sm"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      setPhoneError("");
                    }}
                  />
                  {phoneError && <p className="text-xs text-destructive font-semibold">{phoneError}</p>}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button variant="ghost" onClick={prevStep} className="h-11 px-4 rounded-xl font-semibold">
                  <ChevronLeft size={16} /> Back
                </Button>
                <Button
                  onClick={nextStep}
                  className="h-11 px-6 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white gap-2 shadow-md shadow-primary/25"
                >
                  Continue to Configuration
                  <ArrowRight size={16} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Configuration & Deployment */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="space-y-1 pb-4 border-b">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <Shield size={16} /> Step 3 of 3
                </div>
                <h2 className="text-2xl font-bold text-foreground">Configuration & Deployment</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Set capacity metrics, technical point of contact, and review summary.
                </p>
              </div>

              <div className="space-y-5">
                {/* Institution Size / Student capacity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Estimated Student Capacity
                  </label>
                  <Select
                    value={formData.students_count}
                    onValueChange={(value) => setFormData({ ...formData, students_count: value })}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-background border-input text-sm">
                      <SelectValue placeholder="Select Student Limit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500">Up to 500 Students</SelectItem>
                      <SelectItem value="2000">501 - 2,000 Students</SelectItem>
                      <SelectItem value="5000">2,001 - 5,000 Students</SelectItem>
                      <SelectItem value="10000">5,001 - 10,000 Students</SelectItem>
                      <SelectItem value="25000">Enterprise (10,000+ Students)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Technical POC (Optional) */}
                <div className="p-4 bg-muted/40 rounded-xl border space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Secondary Technical Point of Contact (Optional)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      placeholder="POC Name"
                      className="h-10 text-xs bg-background"
                      value={formData.tech_poc_name}
                      onChange={(e) => setFormData({ ...formData, tech_poc_name: e.target.value })}
                    />
                    <Input
                      placeholder="POC Email"
                      type="email"
                      className="h-10 text-xs bg-background"
                      value={formData.tech_poc_email}
                      onChange={(e) => setFormData({ ...formData, tech_poc_email: e.target.value })}
                    />
                    <Input
                      placeholder="POC Mobile"
                      type="tel"
                      className="h-10 text-xs bg-background"
                      value={formData.tech_poc_mobile}
                      onChange={(e) => setFormData({ ...formData, tech_poc_mobile: e.target.value })}
                    />
                  </div>
                </div>

                {/* Summary Review Banner */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <Building2 size={16} /> Summary Review & Hierarchy Verification
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span className="font-semibold text-foreground">Institution:</span> {formData.org_name || "—"}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Type:</span> {formData.institution_type.toUpperCase()}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Geo Hierarchy:</span>{" "}
                      <span className="text-foreground font-medium">
                        {formData.state} → {formData.district} → {formData.taluk || "N/A"} → {formData.village_city || "N/A"} → {formData.pincode}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Taluk / Village:</span> {formData.taluk || "—"} ({formData.village_city || "—"})
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Principal / Admin:</span> {formData.admin_name}
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Email:</span> {formData.email}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button variant="ghost" onClick={prevStep} className="h-11 px-4 rounded-xl font-semibold">
                  <ChevronLeft size={16} /> Back
                </Button>
                <Button
                  onClick={handleCreateOrganization}
                  disabled={loading}
                  className="h-11 px-8 rounded-xl font-bold bg-[#0F3F73] hover:bg-[#0B335E] text-white gap-2 shadow-lg shadow-[#0F3F73]/25"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Provisioning Institution...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Create & Deploy Institution
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CreateOrganizationPage;

import { motion } from "framer-motion";
import { FiBell, FiMoon, FiSun, FiMenu, FiBellOff, FiClock, FiCalendar } from "react-icons/fi";
import { Building2, Plus, ShieldCheck, User as UserIcon, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useMemo } from "react";
import { useTheme } from "../../context/ThemeContext";
import { Button } from "../ui/button";
import { API_BASE_URL } from "../../utils/config";
import { Capacitor } from "@capacitor/core";
import { fetchParentChildrenCached } from "../../utils/student_api";
import { Popover, PopoverContent, PopoverTrigger, PopoverArrow } from "../ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { translateTerminology } from "../../utils/institutionConfig";
import { AddCollegeModal } from "../org_admin/AddCollegeModal";
import { AddSchoolSearchModal } from "../org_admin/AddSchoolSearchModal";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface User {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  profile_picture?: string | null;
  profile_image?: string | null;
  branch?: string;
  branch_name?: string;
  department?: string;
}

interface NavbarProps {
  role: string;
  user?: User;
  onNotificationClick?: () => void;
  setPage: (page: string) => void;
  showHamburger?: boolean;
  onHamburgerClick?: () => void;
  unreadCount?: number;
  personalNotificationCount?: number;
  recentNotifications?: any[];
}

export const Navbar = ({
  role,
  user,
  onNotificationClick,
  setPage,
  showHamburger = false,
  onHamburgerClick,
  unreadCount = 0,
  personalNotificationCount = 0,
  recentNotifications = [],
}: NavbarProps) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(0);

  const handleFontSizeChange = (level: number) => {
    setFontSizeLevel(level);
    const root = document.documentElement;
    if (level === -1) {
      root.style.fontSize = "92%";
    } else if (level === 1) {
      root.style.fontSize = "108%";
    } else {
      root.style.fontSize = "100%";
    }
  };

  const parseNotificationMessage = (message: string) => {
    if (!message) return { cleanMessage: "", examData: null };

    const lowerMsg = message.toLowerCase();
    if (!lowerMsg.includes("detailed schedule:")) {
      return { cleanMessage: message, examData: null };
    }

    const matchIndex = lowerMsg.indexOf("detailed schedule:");
    const cleanMessage = message.substring(0, matchIndex).trim();
    const tablePart = message.substring(matchIndex + "detailed schedule:".length);

    const examData: any[] = [];
    const lines = tablePart.split("\n");
    lines.forEach((line) => {
      if (line.includes("|") && !line.includes("---")) {
        const rowParts = line.split("|").map((p) => p.trim());
        const filteredParts = rowParts.filter((_, idx) => {
          if (idx === 0 && rowParts[0] === "") return false;
          if (idx === rowParts.length - 1 && rowParts[rowParts.length - 1] === "") return false;
          return true;
        });

        if (filteredParts.length >= 3) {
          const subject = filteredParts[0];
          if (subject.toLowerCase() === "subject" || subject.toLowerCase() === "") return;

          examData.push({
            subject: subject,
            date: filteredParts[1] || "",
            time: filteredParts[2] || "",
            room: filteredParts[3] || "TBD",
          });
        }
      }
    });

    return { cleanMessage, examData: examData.length > 0 ? examData : null };
  };

  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    sessionStorage.getItem("selectedStudentId")
  );
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const [showDesktopSwitcher, setShowDesktopSwitcher] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const desktopSwitcherRef = useRef<HTMLDivElement>(null);

  // Multi-Organization management for Org Admins (in-memory & session-based, zero localStorage)
  const [organizationsList, setOrganizationsList] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(
    sessionStorage.getItem("selectedOrgId")
  );
  const [showOrgSwitcher, setShowOrgSwitcher] = useState(false);
  const [showAddCollegeModal, setShowAddCollegeModal] = useState(false);
  const [orgSearchQuery, setOrgSearchQuery] = useState("");
  const [orgCurrentPage, setOrgCurrentPage] = useState(1);
  const orgSwitcherRef = useRef<HTMLDivElement>(null);

  const filteredOrgs = useMemo(() => {
    if (!orgSearchQuery.trim()) return organizationsList;
    const q = orgSearchQuery.toLowerCase().trim();
    return organizationsList.filter((org: any) =>
      (org.name && org.name.toLowerCase().includes(q)) ||
      (org.address && org.address.toLowerCase().includes(q))
    );
  }, [organizationsList, orgSearchQuery]);

  const ORG_PAGE_SIZE = 10;
  const totalOrgPages = Math.max(1, Math.ceil(filteredOrgs.length / ORG_PAGE_SIZE));
  const currentPageSafe = Math.min(Math.max(1, orgCurrentPage), totalOrgPages);

  const paginatedOrgs = useMemo(() => {
    const start = (currentPageSafe - 1) * ORG_PAGE_SIZE;
    return filteredOrgs.slice(start, start + ORG_PAGE_SIZE);
  }, [filteredOrgs, currentPageSafe]);

  useEffect(() => {
    setOrgCurrentPage(1);
  }, [orgSearchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        desktopSwitcherRef.current &&
        !desktopSwitcherRef.current.contains(event.target as Node)
      ) {
        setShowDesktopSwitcher(false);
      }
      if (
        orgSwitcherRef.current &&
        !orgSwitcherRef.current.contains(event.target as Node)
      ) {
        setShowOrgSwitcher(false);
      }
    };
    if (showDesktopSwitcher || showOrgSwitcher) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDesktopSwitcher, showOrgSwitcher]);

  const markNotificationsRead = async () => {
    if (personalNotificationCount === 0) return;
    try {
      const { fetchWithTokenRefresh } = await import("../../utils/authService");
      const response = await fetchWithTokenRefresh(`${API_BASE_URL}/api/notifications/mark-read/`, {
        method: "POST",
      });
      if (response.ok) {
        window.dispatchEvent(
          new CustomEvent("refresh-unread-count", {
            detail: { decrement: personalNotificationCount },
          })
        );
      }
    } catch (error) {
      console.error("Failed to mark notifications read", error);
    }
  };

  useEffect(() => {
    if (role === "parent") {
      const fetchChildren = async () => {
        try {
          const { fetchWithTokenRefresh } = await import("../../utils/student_api");
          const data = await fetchParentChildrenCached(fetchWithTokenRefresh, API_BASE_URL);
          if (data.success && data.children) {
            setChildrenList(data.children);
            const currentSavedId = sessionStorage.getItem("selectedStudentId");
            if (
              data.children.length > 0 &&
              (!currentSavedId || currentSavedId === "null" || currentSavedId === "undefined")
            ) {
              sessionStorage.setItem("selectedStudentId", data.children[0].id.toString());
              setSelectedChildId(data.children[0].id.toString());
            }
          }
        } catch (error) {
          console.error("Failed to fetch children", error);
        }
      };
      fetchChildren();
    }
  }, [role]);

  const fetchOrganizations = async () => {
    try {
      const { fetchWithTokenRefresh } = await import("../../utils/authService");
      const res = await fetchWithTokenRefresh(`${API_BASE_URL}/api/org-admin/linked-organizations/`);
      const data = await res.json();
      if (res.ok && data.success && data.organizations) {
        setOrganizationsList(data.organizations);
        const currentSavedOrgId = sessionStorage.getItem("selectedOrgId");
        if (
          data.organizations.length > 0 &&
          (!currentSavedOrgId || currentSavedOrgId === "null" || currentSavedOrgId === "undefined")
        ) {
          const defaultId = data.active_org_id
            ? data.active_org_id.toString()
            : data.organizations[0].id.toString();
          sessionStorage.setItem("selectedOrgId", defaultId);
          setSelectedOrgId(defaultId);
        } else if (currentSavedOrgId) {
          setSelectedOrgId(currentSavedOrgId);
        }
      }
    } catch (error) {
      console.error("Failed to fetch linked organizations", error);
    }
  };

  useEffect(() => {
    if (role === "org_admin") {
      fetchOrganizations();

      const handleRefresh = (e: any) => {
        if (e.detail?.newOrgId) {
          const newId = e.detail.newOrgId.toString();
          sessionStorage.setItem("selectedOrgId", newId);
          setSelectedOrgId(newId);
        }
        fetchOrganizations();
      };

      window.addEventListener("refresh-linked-organizations", handleRefresh);
      return () => {
        window.removeEventListener("refresh-linked-organizations", handleRefresh);
      };
    }
  }, [role]);

  const handleNotificationItemClick = (notif: any) => {
    setIsNotificationsOpen(false);
    const titleLower = (notif.title || "").toLowerCase();
    const msgLower = (notif.message || "").toLowerCase();
    const roleLower = (role || "").toLowerCase();

    if (
      titleLower.includes("alternate duty") ||
      titleLower.includes("substitute") ||
      msgLower.includes("alternate duty")
    ) {
      if (roleLower === "hod") {
        setPage("apply-leaves");
      } else if (roleLower === "student" || roleLower === "parent") {
        setPage("leave-request");
      } else {
        setPage("apply-leave");
      }
      window.dispatchEvent(
        new CustomEvent("stalightcampus_set_leave_tab", {
          detail: { tab: "substitute_requests" },
        })
      );
      return;
    }

    if (
      titleLower.includes("leave") ||
      msgLower.includes("leave") ||
      titleLower.includes("post-od")
    ) {
      if (roleLower === "hod") {
        setPage("apply-leaves");
      } else if (roleLower === "student" || roleLower === "parent") {
        setPage("leave-request");
      } else {
        setPage("apply-leave");
      }
      return;
    }

    if (titleLower.includes("attendance") || msgLower.includes("attendance")) {
      if (roleLower === "student" || roleLower === "parent") {
        setPage("attendance");
      } else if (roleLower === "faculty") {
        setPage("attendance");
      }
      return;
    }

    navigate("/dashboard/notifications");
  };

  const [align, setAlign] = useState<"center" | "end">("end");
  const [localNotifications, setLocalNotifications] = useState<any[]>(recentNotifications);

  useEffect(() => {
    setLocalNotifications(recentNotifications);
  }, [recentNotifications]);

  useEffect(() => {
    const handleResize = () => {
      setAlign(window.innerWidth < 640 ? "center" : "end");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleProfileClick = () => {
    if (role === "parent") {
      if (window.innerWidth < 640) {
        setShowParentDropdown(!showParentDropdown);
      }
      return;
    }
    if (setPage) {
      if (role === "faculty") {
        setPage("faculty-profile");
      } else if (role === "hod") {
        setPage("hod-profile");
      } else {
        setPage("profile");
      }
    }
  };

  const orgPlan = localStorage.getItem("org_plan") || "standard";
  let avatarSrc = user?.profile_image || user?.profile_picture;
  if (avatarSrc && avatarSrc.startsWith("/media/")) {
    avatarSrc = `${API_BASE_URL.replace("/api", "")}${avatarSrc}`;
  }

  const roleTitle = (() => {
    if (user?.role === "security" || role === "security") return "Security Portal";
    if (user?.role === "group_d" || role === "group_d") return "Group D Portal";
    const bName = (user?.branch_name || user?.branch || "").toString().toLowerCase();
    const dName = (user?.department || "").toString().toLowerCase();
    if (bName.includes("non-teaching") || dName.includes("non-teaching")) return "Non-Teaching Staff";
    if (role === "admin" || role === "principal") return "Principal Portal";
    return `${translateTerminology(role).replace("_", " ")} Portal`;
  })();

  return (
    <nav
      className="w-full flex items-center justify-between px-3 sm:px-6 h-[60px] border-b transition-colors duration-200 notranslate bg-card border-border text-foreground shadow-sm"
    >
      {/* Left: Hamburger + User Welcome & Portal Badge */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {showHamburger && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-lg ${
                theme === "dark" ? "hover:bg-accent" : "hover:bg-slate-100"
              }`}
              onClick={onHamburgerClick}
              aria-label="Toggle Navigation"
            >
              <FiMenu size={20} />
            </Button>
          )}

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold truncate">
                Welcome,{" "}
                <span className="text-primary font-bold">
                  {user?.first_name || user?.username || "Staff / Student"}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                  theme === "dark"
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-[#0C3562]/10 border-[#0C3562]/20 text-[#0C3562]"
                }`}
              >
                {roleTitle}
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions: Clock, Switchers, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Live Date & Time Display */}
          <div
            className={`hidden xl:flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-medium ${
              theme === "dark"
                ? "bg-slate-800/60 border-slate-700 text-slate-300"
                : "bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            <FiCalendar className="text-primary w-3.5 h-3.5" />
            <span>
              {currentTime.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="opacity-30">•</span>
            <FiClock className="text-primary w-3.5 h-3.5" />
            <span>
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
          </div>

          {/* Parent Student Switcher */}
          {role === "parent" && childrenList.length > 1 && (
            <div className="hidden sm:block relative" ref={desktopSwitcherRef}>
              <button
                onClick={() => setShowDesktopSwitcher(!showDesktopSwitcher)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold bg-card border-border text-foreground hover:bg-muted/60"
              >
                <span className="truncate max-w-[130px]">
                  {childrenList.find((c: any) => c.id.toString() === selectedChildId)?.name ||
                    "Switch Student"}
                </span>
              </button>

              {showDesktopSwitcher && (
                <div
                  className="absolute top-full right-0 mt-2 w-56 rounded-xl shadow-xl py-1 z-50 border bg-card border-border text-foreground"
                >
                  <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase border-b border-border">
                    Select Student
                  </div>
                  {childrenList.map((child: any) => (
                    <button
                      key={child.id}
                      onClick={() => {
                        localStorage.setItem("selectedStudentId", child.id.toString());
                        setSelectedChildId(child.id.toString());
                        setShowDesktopSwitcher(false);
                        window.location.reload();
                      }}
                      className="block w-full text-left px-3 py-2 text-xs hover:bg-primary/10 transition-colors"
                    >
                      <div className="font-semibold">{child.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {child.usn || child.enrollment_number}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Org Admin Switcher - Responsive on Mobile, Tablet & Desktop */}
          {role === "org_admin" && (
            <div className="relative flex items-center" ref={orgSwitcherRef}>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  onClick={() => setShowOrgSwitcher(!showOrgSwitcher)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-semibold bg-card border-border text-foreground hover:bg-muted/60 transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate max-w-[90px] sm:max-w-[140px] md:max-w-[180px]">
                    {organizationsList.find((o: any) => o.id.toString() === selectedOrgId)?.name ||
                      "Select School"}
                  </span>
                </button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAddCollegeModal(true)}
                  title="Search & Filter Registered Schools (Bagalkot, Karnataka, etc.)"
                  className="h-8 w-8 rounded-lg border text-primary hover:bg-primary/10 transition-colors shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                </Button>
              </div>

              {showOrgSwitcher && (
                <div
                  className="absolute top-full right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl z-50 border bg-card border-border text-foreground max-w-[95vw] overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-3.5 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-foreground">Linked Schools / Institutions</div>
                      <div className="text-[10px] text-muted-foreground">Switch dashboard view across registered schools</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 shrink-0">
                      {filteredOrgs.length} {filteredOrgs.length === 1 ? 'School' : 'Schools'}
                    </span>
                  </div>

                  {/* Search Bar */}
                  <div className="p-2 border-b border-border/60 bg-background/50">
                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        value={orgSearchQuery}
                        onChange={(e) => setOrgSearchQuery(e.target.value)}
                        placeholder="Search by school name, code, district..."
                        className="w-full text-xs pl-8 pr-7 py-1.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                      {orgSearchQuery && (
                        <button
                          onClick={() => setOrgSearchQuery("")}
                          className="absolute right-2 p-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Clear search"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 10 Items per page List */}
                  <div className="max-h-72 overflow-y-auto divide-y divide-border/40">
                    {paginatedOrgs.length === 0 ? (
                      <div className="py-8 px-4 text-center text-muted-foreground">
                        <Building2 className="w-7 h-7 mx-auto mb-1.5 opacity-40 text-primary" />
                        <p className="text-xs font-medium text-foreground">No schools found</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Try searching with a different keyword</p>
                      </div>
                    ) : (
                      paginatedOrgs.map((org: any, idx: number) => {
                        const isSelected = selectedOrgId === org.id.toString();
                        const itemNumber = (currentPageSafe - 1) * ORG_PAGE_SIZE + idx + 1;
                        return (
                          <button
                            key={org.id}
                            onClick={() => {
                              sessionStorage.setItem("selectedOrgId", org.id.toString());
                              setSelectedOrgId(org.id.toString());
                              setShowOrgSwitcher(false);
                              window.location.reload();
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-start gap-2.5 ${
                              isSelected
                                ? "bg-primary/10 text-primary font-bold"
                                : "hover:bg-primary/5 text-foreground"
                            }`}
                          >
                            <span className="text-[10px] font-bold text-muted-foreground w-5 shrink-0 pt-0.5">
                              {itemNumber}.
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <div className="font-semibold text-xs truncate text-foreground">{org.name}</div>
                                {org.is_primary && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                                    Primary
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                                {org.address || "Karnataka"}
                              </div>
                            </div>
                            {isSelected && (
                              <span className="text-[10px] font-bold text-primary shrink-0 self-center">
                                Active ✓
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Pagination Controls (10 per page) */}
                  {totalOrgPages > 1 && (
                    <div className="px-3 py-2 bg-muted/30 border-t border-border flex items-center justify-between text-xs">
                      <button
                        type="button"
                        disabled={currentPageSafe <= 1}
                        onClick={() => setOrgCurrentPage((p) => Math.max(1, p - 1))}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-[11px]"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Prev</span>
                      </button>

                      <span className="text-[11px] font-semibold text-muted-foreground">
                        Page <strong className="text-foreground">{currentPageSafe}</strong> of <strong className="text-foreground">{totalOrgPages}</strong>
                      </span>

                      <button
                        type="button"
                        disabled={currentPageSafe >= totalOrgPages}
                        onClick={() => setOrgCurrentPage((p) => Math.min(totalOrgPages, p + 1))}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-[11px]"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="p-2 border-t border-border bg-card space-y-1">
                    <button
                      onClick={() => {
                        setShowOrgSwitcher(false);
                        setShowAddCollegeModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors border border-primary/20"
                    >
                      <Search className="w-3.5 h-3.5" /> Search &amp; Filter Schools (District / Taluk)
                    </button>
                    <button
                      onClick={() => {
                        setShowOrgSwitcher(false);
                        if (setPage) {
                          setPage("create-organization");
                        }
                        navigate("/org-admin/create-organization");
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Register New School
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications Bell */}
          <Popover
            open={isNotificationsOpen}
            onOpenChange={(open) => {
              setIsNotificationsOpen(open);
              if (open) markNotificationsRead();
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full w-9 h-9 relative hover:bg-primary/10"
                aria-label="Notifications"
              >
                <FiBell size={18} className="text-slate-700 dark:text-slate-200" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[90vw] sm:w-80 p-0 sm:mr-4 rounded-xl shadow-xl"
              align={align}
              sideOffset={6}
            >
              <PopoverArrow className="fill-popover stroke-border" width={12} height={6} />
              <div className="flex flex-col">
                <div className="px-4 py-3 font-bold text-sm border-b flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-xs text-primary font-normal">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {localNotifications.length > 0 ? (
                    localNotifications.map((notif: any) => {
                      const { cleanMessage } = parseNotificationMessage(notif.message);
                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationItemClick(notif)}
                          className="px-4 py-3 border-b text-xs hover:bg-muted/70 transition-colors cursor-pointer"
                        >
                          <div className="font-semibold">{notif.title}</div>
                          <div className="text-muted-foreground mt-0.5 line-clamp-2">
                            {cleanMessage}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No new notifications
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* User Profile Avatar */}
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-primary/40 transition-all"
            title="User Profile"
          >
            <div className="w-8 h-8 rounded-full bg-[#0C3562] text-white flex items-center justify-center font-bold text-xs shadow overflow-hidden border border-white/20">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={user?.first_name || "Profile"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {(user?.first_name?.[0] || user?.username?.[0] || "U").toUpperCase()}
                </span>
              )}
            </div>
          </button>
        </div>

      {/* Search & Add School Modal for Org Admin */}
      <AddSchoolSearchModal
        isOpen={showAddCollegeModal}
        onClose={() => setShowAddCollegeModal(false)}
        onSelectOrg={(newOrg) => {
          fetchOrganizations();
          if (newOrg?.id) {
            sessionStorage.setItem("selectedOrgId", newOrg.id.toString());
            setSelectedOrgId(newOrg.id.toString());
          }
        }}
        onNavigateCreateOrg={() => {
          if (setPage) setPage("create-organization");
          navigate("/org-admin/create-organization");
        }}
      />
    </nav>
  );
};

export default Navbar;
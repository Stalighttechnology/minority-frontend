import * as React from "react";
export type InstitutionType = 'school' | 'engineering' | 'medical';

interface InstitutionTerminology {
  branch: string;
  branches: string;
  semester: string;
  semesters: string;
  section: string;
  sections: string;
  hod: string;
  usn: string;
  coAttainment: string;
  labs: string;
  electives: string;
  proctor: string;
  mentoring: string;
  admin: string;
  admins: string;
  activeBranches: string;
  acrossBranches: string;
  coordinators: string;
  institution: string;
  institutionProfile: string;
}

const SCHOOL_TERMINOLOGY: InstitutionTerminology = {
  branch: 'Stream',
  branches: 'Streams',
  semester: 'Class',
  semesters: 'Classes',
  section: 'Section',
  sections: 'Sections',
  hod: 'Academic Coordinator',
  usn: 'Roll No',
  coAttainment: 'Learning Outcomes',
  labs: 'Practicals',
  electives: 'Optional Subjects',
  proctor: 'Class Teacher',
  mentoring: 'Mentorship',
  admin: 'School Admin',
  admins: 'School Admins',
  activeBranches: 'Active Streams',
  acrossBranches: 'Across Streams',
  coordinators: 'Academic Coordinators',
  institution: 'School',
  institutionProfile: 'School Profile',
};

const TERMINOLOGY_MAP: Record<InstitutionType, InstitutionTerminology> = {
  school: SCHOOL_TERMINOLOGY,
  engineering: SCHOOL_TERMINOLOGY,
  medical: SCHOOL_TERMINOLOGY,
};

export const getInstitutionType = (): InstitutionType => {
  return 'school';
};

export const getTerminology = (_type?: InstitutionType): InstitutionTerminology => {
  return SCHOOL_TERMINOLOGY;
};

export const getTerm = (key: keyof InstitutionTerminology, _type?: InstitutionType): string => {
  return SCHOOL_TERMINOLOGY[key] || '';
};

export const hasFeature = (feature: 'labs' | 'electives' | 'coAttainment', _type?: InstitutionType): boolean => {
  if (feature === 'coAttainment') {
    return false;
  }
  return true;
};

export const translateTerminology = (content: any): any => {
  if (typeof content !== "string") return content;

  let result = content;
  const replacements = [
    { pattern: /\bBatch\s*\/\s*Branch\s*\/\s*Sem\b/gi, replacement: "Batch / Stream / Class" },
    { pattern: /\bBatch\s*\/\s*Branch\s*\/\s*Semester\b/gi, replacement: "Batch / Stream / Class" },
    { pattern: /\bBranch\s*\/\s*Sem\b/gi, replacement: "Stream / Class" },
    { pattern: /\bBranch\s*\/\s*Semester\b/gi, replacement: "Stream / Class" },
    { pattern: /\bHead of Branch\b/gi, replacement: "Academic Coordinator" },
    { pattern: /\bHead of Department\b/gi, key: "hod" },
    { pattern: /\bHeads of Departments\b/gi, key: "hod" },
    { pattern: /\bDept heads\b/gi, key: "hod" },
    { pattern: /\bDepartment heads\b/gi, key: "hod" },
    { pattern: /\bHOD\b/g, key: "hod" },
    { pattern: /\bHODs\b/g, key: "hod" },
    { pattern: /\bActive branches\b/gi, key: "activeBranches" },
    { pattern: /\bAcross branches\b/gi, key: "acrossBranches" },
    { pattern: /\bCoordinators\b/gi, key: "coordinators" },
    { pattern: /\bCollege Profile\b/gi, replacement: "School Profile" },
    { pattern: /\bCollege Details\b/gi, replacement: "School Details" },
    { pattern: /\bCollege Report Card\b/gi, replacement: "School Report Card" },
    { pattern: /\bCollege-Issued Items\b/gi, replacement: "School-Issued Items" },
    { pattern: /\bEngineering College\b/gi, replacement: "School" },
    { pattern: /\bMedical College\b/gi, replacement: "School" },
    { pattern: /\bVTU Circular\b/gi, replacement: "Board Circular" },
    { pattern: /\bUniversity Notification\b/gi, replacement: "Board / Govt Notification" },
    { pattern: /\bUniversity Notifications\b/gi, replacement: "Board Notifications" },
    { pattern: /\bUniversity\b/gi, replacement: "Education Board" },
    { pattern: /\bDean\b/gi, replacement: "Vice Principal" },
    { pattern: /\bStreams\b/gi, key: "branches" },
    { pattern: /\bStream\b/gi, key: "branch" },
    { pattern: /\bBranch\b/gi, key: "branch" },
    { pattern: /\bBranches\b/gi, key: "branches" },
    { pattern: /(?<!Library\s|Transport\s|Org\s|School\s)\bAdmin\b(?!istrat)/g, key: "admin" },
    { pattern: /(?<!Library\s|Transport\s|Org\s|School\s)\bAdmins\b(?!istrat)/g, key: "admins" },
    { pattern: /\bProctors\b/g, replacement: "Class Teachers" },
    { pattern: /\bProctor\b/g, key: "proctor" },
    { pattern: /\bMentoring\b/g, key: "mentoring" },
    { pattern: /\bSemesters\b/gi, key: "semesters" },
    { pattern: /\bSemester\b/gi, key: "semester" },
    { pattern: /\bSem(?=[\s:.-]|\b)(?!\w)/g, key: "semester" },
    { pattern: /\bElective\b/g, key: "electives" },
    { pattern: /\bElectives\b/g, key: "electives" },
    { pattern: /\bCO Attainment\b/g, key: "coAttainment" },
    { pattern: /\bUSN\b/g, key: "usn" },
  ];

  for (const item of replacements) {
    const { pattern } = item;
    if (pattern.test(result)) {
      let replacement = (item as any).replacement || getTerm((item as any).key as any);
      if (pattern.source.includes("HODs") || pattern.source.includes("Heads of Departments") || pattern.source.includes("Dept heads") || pattern.source.includes("Department heads") || pattern.source.includes("Electives")) {
        if (!replacement.endsWith("s")) {
          replacement = replacement + "s";
        }
      }

      result = result.replace(pattern, (match) => {
        if (match === match.toLowerCase()) {
          return replacement.toLowerCase();
        }
        if ((item as any).key === 'hod' || (item as any).key === 'usn') {
          return replacement;
        }
        if (match === match.toUpperCase()) {
          return replacement.toUpperCase();
        }
        if (match[0] === match[0].toUpperCase()) {
          return replacement.charAt(0).toUpperCase() + replacement.slice(1);
        }
        return replacement;
      });
    }
  }

  return result;
};

export const translateChildren = (children: React.ReactNode): React.ReactNode => {
  if (typeof children === "string") {
    return translateTerminology(children);
  }
  if (Array.isArray(children)) {
    return React.Children.map(children, child => translateChildren(child));
  }
  if (React.isValidElement(children)) {
    const props = children.props as any;
    if (props && props.children) {
      return React.cloneElement(children, {
        ...props,
        children: translateChildren(props.children),
      } as any);
    }
  }
  return children;
};

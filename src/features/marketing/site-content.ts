/**
 * Central site content configuration.
 * Replace placeholder values with official Rakshak Securitas details when available.
 * Do not treat placeholder text as verified company facts.
 */

export const SITE = {
  legalName: "Rakshak Securitas Pvt Ltd",
  shortName: "Rakshak Securitas",
  name: "Rakshak Securitas",
  tagline: "Digital Employee Onboarding — Fast, Secure, Audit-Ready",
  intro:
    "Register employees online, verify documents, approve through L1 and L2, generate Temporary Employee IDs, and organize every file into Employee Documents — all in one secure portal.",
  description:
    "Rakshak Securitas Employee Onboarding Portal — multi-step registration, document uploads, L1/L2 approvals, Temporary Employee ID generation, Employee Documents folders, and role-based dashboards.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? "https://www.rakshaksecuritas.com",
  email: "recruitment@rakshaksecuritas.com",
  generalEmail: "admin@rakshaksecuritas.com",
  phone: "+91 9818662052",
  officePhone: "011-42760103",
  address:
    "T-5, Plot No. 12, Manish Plaza-III, Sector-10, Dwarka, New Delhi – 110075, India",
  officeHours: "Monday – Saturday: 9:00 AM – 6:00 PM",
  heroImage: "/marketing/hero-pattern.svg",
  founded: "",
} as const;

export const POWERED_BY = {
  prefix: "Powered by",
  name: "Robustrix IT Solution",
  href: "https://therobustrix.com/",
  markSrc: "/brand/robustrix-mark.png",
  markLightSrc: "/brand/robustrix-mark-light.png",
} as const;

/** Core platform capabilities shown on the home page */
export const PLATFORM_FEATURES = [
  {
    title: "Multi-Section Registration",
    description:
      "Submitters complete a guided 7-section employment form — personal details, references, family, nominee, additional particulars, documents, and declaration.",
    icon: "FileText",
    color: "from-[#0B1F3A] to-[#12325C]",
  },
  {
    title: "Secure Document Uploads",
    description:
      "Aadhaar, PAN, photo, bank proof, certificates, and more — stored securely and later organized into each employee folder.",
    icon: "Upload",
    color: "from-[#0EA5E9] to-[#0284C7]",
  },
  {
    title: "L1 Review & Reverse",
    description:
      "L1 verifies details and documents, then approves to L2 or reverses to the submitter with a clear correction note.",
    icon: "Search",
    color: "from-[#0F766E] to-[#0B1F3A]",
  },
  {
    title: "L2 Final Approval",
    description:
      "L2 gives final approval, generates Temporary Employee ID, can send back to L1, or reverse to the submitter.",
    icon: "BadgeCheck",
    color: "from-[#D4AF37] to-[#B8941F]",
  },
  {
    title: "Employee Documents Folders",
    description:
      "After L2 approval, all uploads move into Employee Documents / TEMP ID - Name for Admin, Support, L2, and the submitter.",
    icon: "FolderOpen",
    color: "from-[#12325C] to-[#0EA5E9]",
  },
  {
    title: "Role-Based Dashboards",
    description:
      "Submitter, L1, L2, Admin, and Support each get the queues, Excel exports, and folders they are allowed to access.",
    icon: "LayoutDashboard",
    color: "from-[#0B1F3A] to-[#0F766E]",
  },
] as const;

export const PORTAL_ROLES = [
  {
    role: "Registration Submitter",
    description:
      "Create and edit registrations, upload documents, resubmit after reverse notes, and view your own employee folders.",
    href: "/staff/login",
    cta: "Submitter Login",
    icon: "UserPlus",
    accent: "bg-sky-500",
  },
  {
    role: "L1 Approver",
    description:
      "Review pending registrations, verify documents, approve to L2, or reverse with notes for correction.",
    href: "/staff/login",
    cta: "L1 Login",
    icon: "Search",
    accent: "bg-teal-600",
  },
  {
    role: "L2 Approver",
    description:
      "Final approval, Temporary Employee ID generation, or send back to L1 for re-review.",
    href: "/staff/login",
    cta: "L2 Login",
    icon: "BadgeCheck",
    accent: "bg-[#D4AF37]",
  },
  {
    role: "Admin & Support",
    description:
      "Admin manages users and approved records; Support accesses L2-approved folders and employee documents.",
    href: "/staff/login",
    cta: "Staff Login",
    icon: "Settings",
    accent: "bg-[#0B1F3A]",
  },
] as const;

export const NAV_LINKS = [
  { label: "About", href: "/?section=about" },
  { label: "Services", href: "/?section=services" },
  { label: "FAQ", href: "/?section=faq" },
  { label: "Contact", href: "/?section=contact" },
] as const;

/** @deprecated Use MARKETING_SECTIONS from sections.ts */
export const HOME_ANCHORS = [
  { label: "About", href: "/?section=about" },
  { label: "Services", href: "/?section=services" },
  { label: "FAQ", href: "/?section=faq" },
  { label: "Contact", href: "/?section=contact" },
] as const;

export const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "https://www.rakshaksecuritas.com", icon: "Linkedin" },
  { label: "Facebook", href: "https://www.rakshaksecuritas.com", icon: "Facebook" },
  { label: "Instagram", href: "https://www.rakshaksecuritas.com", icon: "Instagram" },
  { label: "YouTube", href: "https://www.rakshaksecuritas.com", icon: "Youtube" },
] as const;

export const COMPANY_STATS = [
  { id: "sections", label: "Form Sections", displayValue: "7", numericValue: 7, suffix: "" },
  { id: "roles", label: "Staff Roles", displayValue: "5", numericValue: 5, suffix: "" },
  { id: "stages", label: "Approval Path", displayValue: "L1→L2", numericValue: null as number | null, suffix: "" },
  { id: "folder", label: "Document Folders", displayValue: "Auto", numericValue: null as number | null, suffix: "" },
  {
    id: "portal",
    label: "Cloud Onboarding Portal",
    displayValue: "Live",
    numericValue: null as number | null,
    suffix: "",
  },
] as const;

export const PORTAL_ROLES_LIST = [
  "Registration Submitter",
  "L1 Approver",
  "L2 Approver",
  "Support",
  "Super Admin",
] as const;

export const APPROVAL_STAGES_LIST = [
  "Draft",
  "Submitted",
  "Pending L1",
  "L1 Approved → L2",
  "Pending L2",
  "L2 Approved + Temp ID",
  "Employee Documents Folder",
  "Sent to Admin / Support",
] as const;

export const ABOUT_CONTENT = {
  title: "About Rakshak Securitas Pvt Ltd",
  intro: [
    "Rakshak Securitas Pvt Ltd is a leading Security and Facility Management Company providing professional security services, integrated facility management, housekeeping services, manpower solutions, skill development, and technical support services across India.",
    "The company is committed to delivering reliable security solutions through trained professionals, operational excellence, technology-driven workforce management, and customer-focused services.",
    "To improve employee onboarding and recruitment, Rakshak Securitas has implemented a secure digital Employee Onboarding Management System (EOMS) that replaces traditional paper-based recruitment with a streamlined online process.",
  ],
  overview:
    "Rakshak Securitas Pvt Ltd specializes in providing professional manpower and integrated security solutions for corporate organizations, industries, residential communities, hospitals, educational institutions, commercial establishments, and various public sector organizations. The company follows a structured recruitment and verification process to ensure every employee meets organizational standards before deployment. The Employee Onboarding Management System enables candidates to complete employment registration, upload documents, track approvals, and complete joining formalities digitally.",
  mission:
    "To deliver reliable, professional, and technology-driven security and facility management solutions by building a disciplined workforce, maintaining transparent recruitment practices, and providing exceptional customer service.",
  vision:
    "To become one of India's most trusted security and facility management organizations by continuously improving operational excellence, employee development, client satisfaction, and digital workforce management.",
  objectives: [
    "Deliver high-quality security and facility management services.",
    "Build a skilled and disciplined workforce through structured recruitment and training.",
    "Ensure complete statutory compliance and transparent employee onboarding.",
    "Improve operational efficiency using digital technologies.",
    "Maintain long-term relationships through quality service and customer satisfaction.",
    "Support employee growth through continuous training and professional development.",
  ],
  values: [
    {
      title: "Integrity",
      description:
        "We conduct our business with honesty, transparency, and ethical practices while maintaining the trust of our employees, clients, and business partners.",
      icon: "Scale",
    },
    {
      title: "Professionalism",
      description:
        "Our employees maintain high standards of discipline, appearance, communication, and service quality in every assignment.",
      icon: "Award",
    },
    {
      title: "Reliability",
      description:
        "We are committed to delivering dependable services through consistent operations, timely response, and well-trained personnel.",
      icon: "ShieldCheck",
    },
    {
      title: "Accountability",
      description:
        "Every employee is responsible for maintaining organizational standards, complying with company policies, and continuously improving service quality.",
      icon: "ClipboardCheck",
    },
    {
      title: "Customer Commitment",
      description:
        "We strive to understand client requirements and deliver customized security and facility management solutions with excellence.",
      icon: "HeartHandshake",
    },
    {
      title: "Continuous Improvement",
      description:
        "We encourage innovation, training, and continuous learning to improve employee performance and organizational growth.",
      icon: "TrendingUp",
    },
  ],
} as const;

export const COMPANY_HIGHLIGHTS = [
  { title: "Digital Employee Registration", icon: "Laptop", description: "Submitters register employees online with a guided multi-section form." },
  { title: "Paperless Document Capture", icon: "FileCheck", description: "Upload identity, bank, education, and compliance documents securely." },
  { title: "L1 & L2 Approval Workflow", icon: "GitBranch", description: "Approve, reverse, or send back with notes — every decision is tracked." },
  { title: "Temporary Employee ID", icon: "Hash", description: "Generated automatically when L2 approves the registration." },
  { title: "Employee Documents Folders", icon: "FolderOpen", description: "All uploads organized under Employee Documents / TEMP ID - Name." },
  { title: "Role-Based Access", icon: "Shield", description: "Submitter, L1, L2, Admin, and Support see only what they are allowed to." },
] as const;

export const WHY_CHOOSE = [
  {
    title: "Experienced Team",
    description:
      "A dedicated workforce of trained professionals committed to delivering reliable and efficient services across multiple industries.",
    icon: "Users",
  },
  {
    title: "Professional Security",
    description:
      "Well-trained security personnel equipped to manage corporate, industrial, residential, healthcare, and commercial security requirements.",
    icon: "Shield",
  },
  {
    title: "Trained Staff",
    description:
      "Employees undergo systematic recruitment, verification, and onboarding procedures to maintain high professional standards.",
    icon: "GraduationCap",
  },
  {
    title: "Digital Recruitment",
    description:
      "The Employee Onboarding Management System provides a paperless, secure, and transparent recruitment experience from registration to joining.",
    icon: "Zap",
  },
  {
    title: "Nationwide Operations",
    description:
      "The organization provides security and facility management services across multiple locations in India with standardized operational practices.",
    icon: "MapPin",
  },
  {
    title: "Employee Welfare",
    description:
      "Rakshak Securitas promotes employee development, workplace discipline, and professional growth through structured HR processes.",
    icon: "Heart",
  },
  {
    title: "Compliance",
    description:
      "The company follows statutory documentation, employee verification, and organizational compliance procedures to support lawful operations.",
    icon: "ClipboardCheck",
  },
  {
    title: "Customer Satisfaction",
    description:
      "Customer satisfaction is achieved through dependable services, responsive support, trained manpower, and continuous operational improvement.",
    icon: "ThumbsUp",
  },
] as const;

export const SERVICES = [
  {
    title: "Security Services",
    description:
      "Trained security professionals for commercial, industrial, residential, institutional, and government organizations.",
    icon: "Shield",
  },
  {
    title: "Industrial Security",
    description:
      "Protection for manufacturing facilities, warehouses, production units, equipment, and inventory.",
    icon: "Factory",
  },
  {
    title: "Corporate Security",
    description:
      "Security solutions for IT companies, business parks, offices, and corporate campuses.",
    icon: "Building2",
  },
  {
    title: "Residential Security",
    description:
      "Gate security, visitor management, and patrol services for apartments and gated communities.",
    icon: "Home",
  },
  {
    title: "Hospital Security",
    description:
      "Healthcare security supporting hospitals, clinics, and medical institutions.",
    icon: "Hospital",
  },
  {
    title: "Event Security",
    description:
      "Crowd control, VIP security, and venue monitoring for conferences and public gatherings.",
    icon: "Calendar",
  },
  {
    title: "ATM Security",
    description:
      "Dedicated ATM security personnel for customer safety and location monitoring.",
    icon: "CreditCard",
  },
  {
    title: "Facility Management",
    description:
      "Integrated facility operations for commercial, industrial, healthcare, and residential sites.",
    icon: "Wrench",
  },
  {
    title: "Housekeeping Services",
    description:
      "Professional cleaning, sanitation, and maintenance for offices, hospitals, and hotels.",
    icon: "Sparkles",
  },
  {
    title: "Manpower Services",
    description:
      "Recruitment, verification, training, and deployment of trained personnel across industries.",
    icon: "UserPlus",
  },
] as const;

export const RECRUITMENT_STEPS = [
  {
    step: 1,
    title: "Submit Registration",
    description: "Submitter fills the 7-section form and uploads required documents.",
    icon: "UserPlus",
  },
  {
    step: 2,
    title: "L1 Review",
    description: "L1 verifies details & documents — approve to L2 or reverse with notes.",
    icon: "Search",
  },
  {
    step: 3,
    title: "L2 Final Approval",
    description: "L2 approves, sends back to L1, or reverses to the submitter.",
    icon: "CheckCircle",
  },
  {
    step: 4,
    title: "Temp Employee ID",
    description: "On L2 approve, a Temporary Employee ID is generated automatically.",
    icon: "Hash",
  },
  {
    step: 5,
    title: "Document Folder",
    description: "Files move into Employee Documents / TEMP ID - Employee Name.",
    icon: "FolderOpen",
  },
  {
    step: 6,
    title: "Admin & Support",
    description: "Approved records and folders are available to Admin and Support.",
    icon: "BadgeCheck",
  },
] as const;

export const ONBOARDING_WORKFLOW = [
  { title: "Submitter registers", description: "Complete form + upload documents" },
  { title: "L1 verifies", description: "Approve to L2 or reverse with note" },
  { title: "L2 decides", description: "Approve, reverse, or send back to L1" },
  { title: "Temp ID generated", description: "Temporary Employee ID assigned" },
  { title: "Folder created", description: "Employee Documents folder organized" },
  { title: "Ready for Admin", description: "Visible to Admin / Support teams" },
] as const;

export const REQUIRED_DOCUMENTS = [
  { title: "Passport Photo", icon: "Camera" },
  { title: "Aadhaar", icon: "Fingerprint" },
  { title: "PAN", icon: "CreditCard" },
  { title: "Bank Passbook", icon: "Landmark" },
  { title: "Signature", icon: "PenLine" },
  { title: "Education Certificates", icon: "GraduationCap" },
  { title: "Experience Certificates", icon: "Briefcase" },
  { title: "Police Verification", icon: "ShieldCheck" },
  { title: "Medical Certificate", icon: "HeartPulse" },
  { title: "Driving License", icon: "Car" },
  { title: "Other Documents", icon: "Files" },
] as const;

export const BENEFITS = [
  {
    title: "Career Growth",
    description:
      "Structured roles across security operations, facility management, and supervisory positions with advancement pathways.",
    icon: "TrendingUp",
  },
  {
    title: "Professional Environment",
    description:
      "Work with trained teams following organized procedures, uniforms, and professional workplace standards.",
    icon: "Building",
  },
  {
    title: "Timely Salary",
    description:
      "Established payroll and workforce management practices supporting reliable compensation for deployed personnel.",
    icon: "Wallet",
  },
  {
    title: "Training",
    description:
      "Orientation, verification, and role-specific preparation before deployment to client locations.",
    icon: "BookOpen",
  },
  {
    title: "Job Security",
    description:
      "Opportunities with an established security and facility management organization operating across multiple sectors.",
    icon: "Lock",
  },
  {
    title: "Employee Support",
    description:
      "HR assistance, digital onboarding support, and help desk guidance throughout the recruitment process.",
    icon: "Headphones",
  },
  {
    title: "Uniform",
    description:
      "Professional uniform and deployment readiness as part of organized security workforce operations.",
    icon: "Shirt",
  },
  {
    title: "Insurance",
    description:
      "Workforce policies aligned with statutory compliance and organizational employment procedures.",
    icon: "Shield",
  },
] as const;

export const WHY_JOIN = {
  headline: "Build a Secure Career with Rakshak Securitas",
  description:
    "Join a professional security and facility management organization with digital onboarding, structured verification, and clear pathways from application to deployment.",
  points: [
    {
      title: "Career Opportunities",
      description:
        "Roles across security guarding, supervision, facility management, housekeeping, and manpower services.",
    },
    {
      title: "Learning & Development",
      description:
        "Training, verification, and preparation before assignment to client sites and operational duties.",
    },
    {
      title: "Growth",
      description:
        "Advancement opportunities based on performance, experience, and operational requirements.",
    },
    {
      title: "Safe Working Environment",
      description:
        "Organized deployment procedures, supervision, and compliance-focused workforce management.",
    },
    {
      title: "Recognition",
      description:
        "Professional standards, accountability, and performance-oriented operational culture.",
    },
    {
      title: "Long-Term Career",
      description:
        "Stable employment opportunities with a growing security services organization across India.",
    },
  ],
} as const;

export const FAQ_ITEMS = [
  {
    question: "How do I join as an employee?",
    answer:
      "Contact HR or click Employee Registration on the home page. Complete the 7-section employment form and upload all required documents to begin onboarding.",
  },
  {
    question: "What documents are required?",
    answer:
      "Required documents typically include passport photo, Aadhaar, PAN, bank passbook, signature, and supporting certificates. See the Required Documents section for the full checklist.",
  },
  {
    question: "How long does approval take?",
    answer:
      "Processing time depends on application completeness and review workload. You can track real-time status on the registration page after submission.",
  },
  {
    question: "How do I receive my employee ID?",
    answer:
      "After L1 approval, your employee number is generated automatically. You will see it in your application status timeline once assigned.",
  },
  {
    question: "When will my ID card be generated?",
    answer:
      "After L2 approval, the request is forwarded to the Support team who generates your ID card. You will be notified when it is ready for download.",
  },
] as const;

/** Legacy exports for backward compatibility */
export const STATS = COMPANY_STATS.map((s) => ({ value: s.displayValue, label: s.label }));
export const VALUES = ABOUT_CONTENT.values;
export const WHY_US = WHY_CHOOSE.map((w) => w.title);
export const CAREERS = [
  {
    title: "Security Guard",
    location: "Pan India — Client Sites",
    type: "Full-time",
    department: "Security Operations",
  },
  {
    title: "Security Supervisor",
    location: "Delhi NCR & Major Cities",
    type: "Full-time",
    department: "Security Operations",
  },
  {
    title: "Facility Management Staff",
    location: "Commercial & Industrial Sites",
    type: "Full-time",
    department: "Facility Management",
  },
  {
    title: "Housekeeping Personnel",
    location: "Offices, Hospitals & Institutions",
    type: "Full-time",
    department: "Housekeeping Services",
  },
] as const;

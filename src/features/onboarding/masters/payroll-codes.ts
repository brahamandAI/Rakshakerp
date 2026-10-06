/**
 * Payroll designation + bank masters (name shown in form, code used in Excel export).
 *
 * Source: Bank & Designation Code.xlsx — keep codes in sync with payroll.
 * Dropdowns show `name` only; exports use numeric `code` only.
 */

export type PayrollCodeOption = {
  code: string;
  name: string;
};

/** Designation names for "Post Applied For / Designation" dropdown. */
export const PAYROLL_DESIGNATIONS: PayrollCodeOption[] = [
  { code: "5", name: "ACCOUNTANT" },
  { code: "599", name: "AREA MANAGER" },
  { code: "22", name: "ASSTT.MANAGER" },
  { code: "594", name: "BRANCH MANAGER" },
  { code: "40", name: "CARE TAKER" },
  { code: "42", name: "CARPENTER" },
  { code: "43", name: "CASHIER" },
  { code: "918", name: "CHEF" },
  { code: "64", name: "COMPUTER OPERATOR" },
  { code: "71", name: "DATA OPERATOR" },
  { code: "917", name: "DELIVERY BOY" },
  { code: "84", name: "DRIVER" },
  { code: "86", name: "ELECTRICIAN" },
  { code: "329", name: "FACILITY MANAGER" },
  { code: "96", name: "FIELD MAN" },
  { code: "608", name: "FIREMAN" },
  { code: "102", name: "GARDENER" },
  { code: "1109", name: "GENERAL MANAGER" },
  { code: "324", name: "GM" },
  { code: "111", name: "GUN MEN" },
  { code: "1115", name: "HOUSEKEEPER" },
  { code: "1177", name: "HR" },
  { code: "770", name: "JANITOR" },
  { code: "857", name: "L.A HELPER" },
  { code: "142", name: "LAB ASST" },
  { code: "149", name: "LABORATORY ATTENDANT" },
  { code: "150", name: "LABOUR" },
  { code: "1017", name: "LINE HELPER" },
  { code: "165", name: "LINEMAN" },
  { code: "169", name: "MAID" },
  { code: "171", name: "MALI" },
  { code: "174", name: "MAN POWER" },
  { code: "176", name: "MANAGER" },
  { code: "865", name: "METER READER" },
  { code: "202", name: "OFFICE BOY" },
  { code: "308", name: "OFFICE EXECUTIVE" },
  { code: "1120", name: "OFFICE HELPER" },
  { code: "554", name: "OPS. MANAGER" },
  { code: "209", name: "PEON" },
  { code: "218", name: "PLUMBER" },
  { code: "630", name: "PROJECT MANAGER" },
  { code: "227", name: "RELIEVER" },
  { code: "1157", name: "SAFETY ENGINEER" },
  { code: "304", name: "SAFETY SUPERVISOR" },
  { code: "703", name: "SALES MANAGER" },
  { code: "909", name: "SALES OFFICER" },
  { code: "816", name: "SANITARY ATTENDANT" },
  { code: "984", name: "SANITATION SUPERVISOR" },
  { code: "234", name: "SECURITY GUARD" },
  { code: "238", name: "SECURITY OFFICER" },
  { code: "239", name: "SECURITY SUPERVISOR" },
  { code: "240", name: "SEMI SKILLED" },
  { code: "245", name: "SKILLED" },
  { code: "624", name: "SOFTWARE DEVELOPER" },
  { code: "839", name: "SSO" },
  { code: "260", name: "SUPERVISOR" },
  { code: "681", name: "TAILOR" },
  { code: "1150", name: "TALLY OPERATOR" },
  { code: "282", name: "UN SKILLED" },
];

/** Bank names for bank-details dropdown; Excel exports the code. */
export const PAYROLL_BANKS: PayrollCodeOption[] = [
  { code: "1", name: "ALLAHABAD BANK" },
  { code: "2", name: "ANDHARA BANK" },
  { code: "72", name: "AU SMALL FINANCE BANK" },
  { code: "3", name: "AXIS BANK" },
  { code: "4", name: "BANDHAN BANK" },
  { code: "5", name: "BANK OF BARODA" },
  { code: "6", name: "BANK OF INDIA" },
  { code: "7", name: "BANK OF MAHARASHTRA" },
  { code: "8", name: "BARODA UTTAR PR" },
  { code: "9", name: "BCO BANK" },
  { code: "10", name: "BDB" },
  { code: "11", name: "BHARAT BANK" },
  { code: "12", name: "BHARAT BK" },
  { code: "13", name: "CANARA BANK" },
  { code: "14", name: "CENTRAL BANK OF INDIA" },
  { code: "75", name: "CENTRAL MADHYA GRAMIN BANK" },
  { code: "15", name: "CITY BANK" },
  { code: "16", name: "CORPORATION BANK" },
  { code: "71", name: "DBS BANK" },
  { code: "69", name: "DCB BANK" },
  { code: "17", name: "DENA BANK" },
  { code: "18", name: "FEDERAL BANK" },
  { code: "19", name: "FINO BANK" },
  { code: "20", name: "GRAMIN BANK" },
  { code: "79", name: "HDFC" },
  { code: "21", name: "HDFC BANK" },
  { code: "78", name: "HIMACHAL GRAMIN BANK" },
  { code: "22", name: "ICICI BANK" },
  { code: "23", name: "IDBI BANK" },
  { code: "24", name: "IDFB" },
  { code: "25", name: "IDFC BANK" },
  { code: "26", name: "IDI" },
  { code: "27", name: "INDIAN BANK" },
  { code: "28", name: "INDIAN OVERSEAS BANK" },
  { code: "29", name: "INDUSIND BANK" },
  { code: "30", name: "JAMMU & KASHMIR BANK" },
  { code: "31", name: "JILA SAHKARI BA" },
  { code: "32", name: "KARNATAKA BANK" },
  { code: "33", name: "KARUR VYSYA" },
  { code: "34", name: "KAUR VYSYA BANK" },
  { code: "35", name: "KGSGB" },
  { code: "36", name: "KOTAK MAHINDRA BANK" },
  { code: "37", name: "KVBL" },
  { code: "38", name: "LAXMI VILAS" },
  { code: "73", name: "MADHYA PRADESH GRAMIN BANK" },
  { code: "39", name: "MAHA BANK" },
  { code: "77", name: "MAHARASHTRA BANK" },
  { code: "40", name: "MBGB" },
  { code: "41", name: "NAINITAL BANK" },
  { code: "76", name: "NARMADA MALWA GRAMIN BANK" },
  { code: "42", name: "OBI" },
  { code: "43", name: "ORIENTAL BANK OF COMMERCE" },
  { code: "67", name: "PAYTM BANK" },
  { code: "44", name: "PMC BANK" },
  { code: "45", name: "PNBH" },
  { code: "46", name: "PUNJAB & SIND BANK" },
  { code: "47", name: "PUNJAB GRAMIN B" },
  { code: "48", name: "PUNJAB NATIONAL BANK" },
  { code: "49", name: "PURVANCHAL BANK" },
  { code: "74", name: "RATANAKAR BANK" },
  { code: "50", name: "SAHAKARI BANK" },
  { code: "51", name: "SARASWAT BANK" },
  { code: "52", name: "SARASWAT COOPER" },
  { code: "53", name: "SARVA HARYANA G" },
  { code: "54", name: "SARVA UP BANK" },
  { code: "55", name: "SOUTH INDIAN BANK" },
  { code: "66", name: "STANDARD CHARTERED BANK" },
  { code: "57", name: "SYNDICATE BANK" },
  { code: "56", name: "STATE BANK OF INDIA" },
  { code: "70", name: "TAMIL NADU MERCANTILE BANK LTD" },
  { code: "58", name: "THE ARBUN CO OP" },
  { code: "59", name: "THE NAINITAL BA" },
  { code: "60", name: "UCO BANK" },
  { code: "68", name: "UJJIVAN SMALL FINANCE BANK" },
  { code: "61", name: "UNION BANK OF INDIA" },
  { code: "62", name: "UNITED BANK OF INDIA" },
  { code: "63", name: "UTTARAKHAN G BK" },
  { code: "64", name: "VIJAYA BANK" },
  { code: "65", name: "YES BANK" },
];

/**
 * Legacy alphabetic designation codes / free-text labels → payroll numeric IDs.
 * Covers older form values (SG, SUP, HK, …) still stored on existing registrations.
 */
const DESIGNATION_ALIASES: Record<string, string> = {
  sg: "234",
  "security guard": "234",
  security: "234",
  "armed security guard": "234",
  asg: "234",
  guard: "234",
  sup: "260",
  supervisor: "260",
  "security supervisor": "239",
  ssup: "239",
  "senior supervisor": "239",
  hk: "1115",
  housekeeping: "1115",
  housekeeper: "1115",
  so: "238",
  "security officer": "238",
  aso: "238",
  "assistant security officer": "238",
  sso: "839",
  "senior security officer": "238",
  gunman: "111",
  "gun man": "111",
  "gun men": "111",
  gunmen: "111",
  drv: "84",
  driver: "84",
  boy: "202",
  "office boy": "202",
  cctv: "64",
  "cctv operator": "64",
  tech: "86",
  technician: "86",
  qrt: "234",
  "qrt member": "234",
  ctrl: "64",
  "control room operator": "64",
  fieldoff: "96",
  "field officer": "96",
  "field man": "96",
  lg: "234",
  "lady guard": "234",
};

/**
 * Legacy IFSC / short bank codes and alternate names → payroll numeric bank codes.
 */
const BANK_ALIASES: Record<string, string> = {
  sbin: "56",
  "state bank of india": "56",
  "state bank": "56",
  sbi: "56",
  cnrb: "13",
  "canara bank": "13",
  canara: "13",
  punb: "48",
  "punjab national bank": "48",
  pnb: "48",
  idib: "27",
  "indian bank": "27",
  ubin: "61",
  "union bank of india": "61",
  "union bank": "61",
  barb: "5",
  "bank of baroda": "5",
  bob: "5",
  hdfc: "79",
  "hdfc bank": "21",
  icic: "22",
  "icici bank": "22",
  icici: "22",
  utib: "3",
  "axis bank": "3",
  axis: "3",
  bkid: "6",
  "bank of india": "6",
  boi: "6",
  cbin: "14",
  "central bank of india": "14",
  ioba: "28",
  "indian overseas bank": "28",
  mahb: "7",
  "bank of maharashtra": "7",
  ucba: "60",
  "uco bank": "60",
  psib: "46",
  "punjab & sind bank": "46",
  "punjab and sind bank": "46",
  kkbk: "36",
  "kotak mahindra bank": "36",
  kotak: "36",
  yesb: "65",
  "yes bank": "65",
  idfb: "24",
  "idfc bank": "25",
  "idfc first bank": "25",
  fdrl: "18",
  "federal bank": "18",
  sibl: "55",
  "south indian bank": "55",
  karb: "32",
  "karnataka bank": "32",
  kvbl: "37",
  "karur vysya": "33",
  "karur vysya bank": "34",
  "kaur vysya bank": "34",
  tmbl: "70",
  "tamil nadu mercantile bank ltd": "70",
  "tamilnad mercantile bank": "70",
  indb: "29",
  "indusind bank": "29",
  ratn: "74",
  "ratanakar bank": "74",
  "rbl bank": "74",
  bdbl: "4",
  "bandhan bank": "4",
  pytm: "67",
  "paytm bank": "67",
  "paytm payments bank": "67",
  ipos: "56",
  "india post": "56",
  "india post payments bank": "56",
  "india post paym": "56",
  airp: "56",
  ciub: "15",
  "city union bank": "15",
  "city bank": "15",
  allahabad: "1",
  "allahabad bank": "1",
  andhara: "2",
  "andhara bank": "2",
  "andhra bank": "2",
};

function normName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normCode(value: string): string {
  return value.trim();
}

function isNumericCode(value: string): boolean {
  return /^\d+$/.test(value.trim());
}

export function findDesignationByName(name: string): PayrollCodeOption | undefined {
  const n = normName(name);
  return PAYROLL_DESIGNATIONS.find((d) => normName(d.name) === n);
}

export function findDesignationByCode(code: string): PayrollCodeOption | undefined {
  const c = normCode(code);
  return PAYROLL_DESIGNATIONS.find((d) => normCode(d.code) === c);
}

export function findBankByName(name: string): PayrollCodeOption | undefined {
  const n = normName(name);
  return PAYROLL_BANKS.find((b) => normName(b.name) === n);
}

export function findBankByCode(code: string): PayrollCodeOption | undefined {
  const c = normCode(code);
  return PAYROLL_BANKS.find((b) => normCode(b.code) === c);
}

function designationFromAlias(raw: string): string {
  const key = normName(raw);
  if (!key) return "";
  const mapped = DESIGNATION_ALIASES[key];
  if (mapped) return mapped;
  for (const [alias, code] of Object.entries(DESIGNATION_ALIASES)) {
    if (alias.length >= 4 && (key.startsWith(alias) || alias.startsWith(key))) {
      return code;
    }
  }
  return "";
}

function bankFromAlias(raw: string): string {
  const key = normName(raw);
  if (!key) return "";
  const mapped = BANK_ALIASES[key];
  if (mapped) return mapped;
  if (/^[a-z]{4}/i.test(key)) {
    const ifscPrefix = key.slice(0, 4);
    if (BANK_ALIASES[ifscPrefix]) return BANK_ALIASES[ifscPrefix];
  }
  for (const [alias, code] of Object.entries(BANK_ALIASES)) {
    if (alias.length >= 5 && (key.startsWith(alias) || alias.startsWith(key))) {
      return code;
    }
  }
  return "";
}

/**
 * Resolve payroll designation ID for Excel.
 * Always returns a numeric code when possible — never SG/SUP/HK.
 */
export function resolveDesignationCode(
  designationCode?: unknown,
  postAppliedFor?: unknown
): string {
  const candidates = [
    normCode(String(designationCode ?? "")),
    String(postAppliedFor ?? "").trim(),
  ].filter(Boolean);

  for (const value of candidates) {
    if (isNumericCode(value)) {
      const byCode = findDesignationByCode(value);
      if (byCode) return byCode.code;
      return value;
    }

    const byName = findDesignationByName(value);
    if (byName) return byName.code;

    const fromAlias = designationFromAlias(value);
    if (fromAlias) return fromAlias;
  }

  return "";
}

/**
 * Resolve payroll bank code for Excel.
 * Always returns a numeric code when possible — never SBIN/CNRB/PUNB.
 */
export function resolveBankCode(bankCode?: unknown, bankName?: unknown): string {
  const candidates = [
    normCode(String(bankCode ?? "")),
    String(bankName ?? "").trim(),
  ].filter(Boolean);

  for (const value of candidates) {
    if (isNumericCode(value)) {
      const byCode = findBankByCode(value);
      if (byCode) return byCode.code;
      return value;
    }

    const byName = findBankByName(value);
    if (byName) return byName.code;

    const fromAlias = bankFromAlias(value);
    if (fromAlias) return fromAlias;
  }

  return "";
}

export const DESIGNATION_SELECT_OPTIONS = [
  { value: "", label: "Select designation" },
  ...PAYROLL_DESIGNATIONS.map((d) => ({ value: d.name, label: d.name })),
];

export const BANK_SELECT_OPTIONS = [
  { value: "", label: "Select bank" },
  ...PAYROLL_BANKS.map((b) => ({ value: b.name, label: b.name })),
];

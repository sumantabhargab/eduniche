import { getPaperById } from "@/lib/gate/config";

const BRANCHES = getPaperById
  ? getPaperById("cse")
    ? [
        { id: "cse", name: "Computer Science & Engineering", code: "CS", shortName: "CSE" },
        { id: "ece", name: "Electronics & Communication", code: "EC", shortName: "ECE" },
        { id: "ee", name: "Electrical Engineering", code: "EE", shortName: "EE" },
        { id: "me", name: "Mechanical Engineering", code: "ME", shortName: "ME" },
        { id: "civil", name: "Civil Engineering", code: "CE", shortName: "CE" },
        { id: "in", name: "Instrumentation Engineering", code: "IN", shortName: "IN" },
        { id: "pi", name: "Production & Industrial", code: "PI", shortName: "PI" },
        { id: "ch", name: "Chemical Engineering", code: "CH", shortName: "CH" },
        { id: "bt", name: "Biotechnology", code: "BT", shortName: "BT" },
        { id: "mt", name: "Metallurgical Engineering", code: "MT", shortName: "MT" },
        { id: "xe", name: "Engineering Sciences", code: "XE", shortName: "XE" },
        { id: "xl", name: "Life Sciences", code: "XL", shortName: "XL" },
        { id: "tf", name: "Textile Engineering", code: "TF", shortName: "TF" },
        { id: "pe", name: "Petroleum Engineering", code: "PE", shortName: "PE" },
        { id: "ey", name: "Ecology & Evolution", code: "EY", shortName: "EY" },
        { id: "ma", name: "Mathematics", code: "MA", shortName: "MA" },
        { id: "ar", name: "Architecture & Planning", code: "AR", shortName: "AR" },
        { id: "ag", name: "Agricultural Engineering", code: "AG", shortName: "AG" },
        { id: "gg", name: "Geology & Geophysics", code: "GG", shortName: "GG" },
        { id: "ph", name: "Engineering Physics", code: "PH", shortName: "PH" },
      ]
    : []
  : [];

export type BranchId = (typeof BRANCHES)[number]["id"];
export { BRANCHES };

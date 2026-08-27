/**
 * Generic GATE branch / subject / topic hierarchy.
 *
 * Covers all seven supported GATE branches: CSE, ECE, EE, ME, CE, IN, PI.
 * Structured for extension — new subjects or branches can be added
 * without touching consumer code.
 */

import type {
  BranchProfile,
  GATESyllabus,
  SubjectProfile,
  TopicProfile,
} from "../types/index";

export const SYLLABUS: GATESyllabus[] = [
  {
    branch: {
      id: "cse",
      name: "Computer Science & Engineering",
      shortName: "CSE",
      icon: "💻",
      color: "#3b82f6",
      subjectCount: 10,
      totalMarks: 65,
    },
    subjects: [
      { id: "cse-gt", name: "General Aptitude", weight: 15, topics: [
        { id: "cse-gt-va", name: "Verbal Aptitude", importance: 0.8, pyqCount: 12 },
        { id: "cse-gt-na", name: "Numerical Aptitude", importance: 0.85, pyqCount: 15 },
        { id: "cse-gt-ds", name: "Data Interpretation", importance: 0.6, pyqCount: 8 },
      ]},
      { id: "cse-ds", name: "Data Structures", weight: 8, topics: [
        { id: "cse-ds-arrays", name: "Arrays & Matrices", importance: 0.7, pyqCount: 7 },
        { id: "cse-ds-ll", name: "Linked Lists", importance: 0.6, pyqCount: 5 },
        { id: "cse-ds-stacks", name: "Stacks & Queues", importance: 0.75, pyqCount: 6 },
        { id: "cse-ds-trees", name: "Trees & BST", importance: 0.8, pyqCount: 8 },
        { id: "cse-ds-graphs", name: "Graphs", importance: 0.9, pyqCount: 10 },
        { id: "cse-ds-hash", name: "Hashing", importance: 0.7, pyqCount: 5 },
        { id: "cse-ds-heap", name: "Heaps", importance: 0.6, pyqCount: 4 },
      ]},
      { id: "cse-algo", name: "Algorithms", weight: 8, topics: [
        { id: "cse-algo-sort", name: "Sorting", importance: 0.7, pyqCount: 7 },
        { id: "cse-algo-search", name: "Searching", importance: 0.6, pyqCount: 5 },
        { id: "cse-algo-greedy", name: "Greedy Algorithms", importance: 0.8, pyqCount: 8 },
        { id: "cse-algo-dp", name: "Dynamic Programming", importance: 0.9, pyqCount: 10 },
        { id: "cse-algo-backtrack", name: "Backtracking", importance: 0.6, pyqCount: 4 },
      ]},
      { id: "cse-toc", name: "Theory of Computation", weight: 7, topics: [
        { id: "cse-toc-fa", name: "Finite Automata", importance: 0.8, pyqCount: 8 },
        { id: "cse-toc-pda", name: "Pushdown Automata", importance: 0.7, pyqCount: 6 },
        { id: "cse-toc-tm", name: "Turing Machines", importance: 0.85, pyqCount: 7 },
        { id: "cse-toc-p", name: "P & NP Classes", importance: 0.9, pyqCount: 9 },
        { id: "cse-toc-re", name: "Regular Expressions", importance: 0.7, pyqCount: 5 },
      ]},
      { id: "cse-cn", name: "Computer Networks", weight: 7, topics: [
        { id: "cse-cn-osi", name: "OSI & TCP/IP", importance: 0.7, pyqCount: 6 },
        { id: "cse-cn-ip", name: "IP Addressing", importance: 0.75, pyqCount: 7 },
        { id: "cse-cn-routing", name: "Routing Algorithms", importance: 0.8, pyqCount: 7 },
        { id: "cse-cn-tcp", name: "TCP/UDP", importance: 0.85, pyqCount: 8 },
        { id: "cse-cn-dns", name: "DNS & Application Layer", importance: 0.6, pyqCount: 4 },
      ]},
      { id: "cse-dbms", name: "DBMS", weight: 7, topics: [
        { id: "cse-dbms-erd", name: "ER Model", importance: 0.7, pyqCount: 6 },
        { id: "cse-dbms-rdbms", name: "Relational Model", importance: 0.8, pyqCount: 8 },
        { id: "cse-dbms-sql", name: "SQL & Queries", importance: 0.85, pyqCount: 9 },
        { id: "cse-dbms-normalization", name: "Normalization", importance: 0.9, pyqCount: 10 },
        { id: "cse-dbms-tx", name: "Transactions & Concurrency", importance: 0.8, pyqCount: 7 },
        { id: "cse-dbms-joins", name: "Joins & Indexing", importance: 0.75, pyqCount: 6 },
      ]},
      { id: "cse-os", name: "Operating Systems", weight: 7, topics: [
        { id: "cse-os-process", name: "Process Management", importance: 0.8, pyqCount: 8 },
        { id: "cse-os-scheduling", name: "CPU Scheduling", importance: 0.85, pyqCount: 9 },
        { id: "cse-os-mem", name: "Memory Management", importance: 0.85, pyqCount: 9 },
        { id: "cse-os-deadlock", name: "Deadlocks", importance: 0.7, pyqCount: 5 },
        { id: "cse-os-fs", name: "File Systems", importance: 0.6, pyqCount: 4 },
      ]},
      { id: "cse-daa", name: "Design & Analysis of Algorithms", weight: 8, topics: [
        { id: "cse-daa-complexity", name: "Time Complexity", importance: 0.9, pyqCount: 10 },
        { id: "cse-daa-recurrence", name: "Recurrence Relations", importance: 0.8, pyqCount: 7 },
        { id: "cse-daa-masters", name: "Master Theorem", importance: 0.85, pyqCount: 6 },
        { id: "cse-daa-advanced", name: "Advanced Algorithms", importance: 0.7, pyqCount: 5 },
      ]},
      { id: "cse-dld", name: "Digital Logic", weight: 6, topics: [
        { id: "cse-dld-boolean", name: "Boolean Algebra", importance: 0.8, pyqCount: 7 },
        { id: "cse-dld-kmap", name: "K-Maps", importance: 0.75, pyqCount: 6 },
        { id: "cse-dld-combinational", name: "Combinational Circuits", importance: 0.7, pyqCount: 5 },
        { id: "cse-dld-sequential", name: "Sequential Circuits", importance: 0.75, pyqCount: 6 },
      ]},
      { id: "cse-co", name: "Computer Organization", weight: 6, topics: [
        { id: "cse-co-alu", name: "ALU & Data Path", importance: 0.7, pyqCount: 5 },
        { id: "cse-co-memory", name: "Memory Hierarchy", importance: 0.8, pyqCount: 7 },
        { id: "cse-co-io", name: "I/O Organization", importance: 0.6, pyqCount: 4 },
        { id: "cse-co-pipeline", name: "Pipelining", importance: 0.85, pyqCount: 8 },
      ]},
      { id: "cse-se", name: "Software Engineering", weight: 4, topics: [
        { id: "cse-se-sdlc", name: "SDLC Models", importance: 0.6, pyqCount: 4 },
        { id: "cse-se-uml", name: "UML & Design", importance: 0.5, pyqCount: 3 },
        { id: "cse-se-testing", name: "Testing", importance: 0.6, pyqCount: 4 },
      ]},
    ],
  },
  {
    branch: {
      id: "ece",
      name: "Electronics & Communication Engineering",
      shortName: "ECE",
      icon: "📡",
      color: "#8b5cf6",
      subjectCount: 8,
      totalMarks: 65,
    },
    subjects: [
      { id: "ece-gt", name: "General Aptitude", weight: 15, topics: [
        { id: "ece-gt-va", name: "Verbal Aptitude", importance: 0.8, pyqCount: 12 },
        { id: "ece-gt-na", name: "Numerical Aptitude", importance: 0.85, pyqCount: 15 },
        { id: "ece-gt-di", name: "Data Interpretation", importance: 0.6, pyqCount: 8 },
      ]},
      { id: "ece-ec", name: "Engineering Mathematics", weight: 13, topics: [
        { id: "ece-ec-lin", name: "Linear Algebra", importance: 0.8, pyqCount: 7 },
        { id: "ece-ec-calc", name: "Calculus", importance: 0.8, pyqCount: 8 },
        { id: "ece-ec-diff", name: "Differential Equations", importance: 0.75, pyqCount: 6 },
        { id: "ece-ec-prob", name: "Probability & Statistics", importance: 0.85, pyqCount: 9 },
        { id: "ece-ec-complex", name: "Complex Analysis", importance: 0.7, pyqCount: 5 },
      ]},
      { id: "ece-networks", name: "Networks", weight: 8, topics: [
        { id: "ece-net-osi", name: "OSI Model", importance: 0.7, pyqCount: 5 },
        { id: "ece-net-ip", name: "IP Addressing", importance: 0.8, pyqCount: 7 },
        { id: "ece-net-routing", name: "Routing", importance: 0.8, pyqCount: 6 },
        { id: "ece-net-tcp", name: "TCP/UDP & Sockets", importance: 0.85, pyqCount: 8 },
      ]},
      { id: "ece-edc", name: "Electronic Devices", weight: 7, topics: [
        { id: "ece-edc-pn", name: "PN Junction", importance: 0.8, pyqCount: 7 },
        { id: "ece-edc-bjt", name: "BJT", importance: 0.75, pyqCount: 6 },
        { id: "ece-edc-mosfet", name: "MOSFET", importance: 0.85, pyqCount: 8 },
        { id: "ece-edc-opamp", name: "Op-Amps", importance: 0.7, pyqCount: 5 },
      ]},
      { id: "ece-ana", name: "Analog Circuits", weight: 7, topics: [
        { id: "ece-ana-amp", name: "Amplifiers", importance: 0.75, pyqCount: 6 },
        { id: "ece-ana-feedback", name: "Feedback Circuits", importance: 0.7, pyqCount: 5 },
        { id: "ece-ana-osc", name: "Oscillators", importance: 0.65, pyqCount: 4 },
        { id: "ece-ana-power", name: "Power Amplifiers", importance: 0.6, pyqCount: 4 },
      ]},
      { id: "ece-signals", name: "Signals & Systems", weight: 8, topics: [
        { id: "ece-sig-lti", name: "LTI Systems", importance: 0.85, pyqCount: 8 },
        { id: "ece-sig-fourier", name: "Fourier Series/Transform", importance: 0.9, pyqCount: 10 },
        { id: "ece-sig-lap", name: "Laplace Transform", importance: 0.85, pyqCount: 9 },
        { id: "ece-sig-z", name: "Z-Transform", importance: 0.8, pyqCount: 7 },
        { id: "ece-sig-sampling", name: "Sampling Theorem", importance: 0.75, pyqCount: 6 },
      ]},
      { id: "ece-control", name: "Control Systems", weight: 7, topics: [
        { id: "ece-ctrl-block", name: "Block Diagrams", importance: 0.7, pyqCount: 5 },
        { id: "ece-ctrl-rlocus", name: "Root Locus", importance: 0.8, pyqCount: 7 },
        { id: "ece-ctrl-freq", name: "Frequency Response", importance: 0.85, pyqCount: 8 },
        { id: "ece-ctrl-state", name: "State Space Analysis", importance: 0.7, pyqCount: 5 },
        { id: "ece-ctrl-comp", name: "Compensators", importance: 0.65, pyqCount: 4 },
      ]},
      { id: "ece-digital", name: "Digital Logic", weight: 7, topics: [
        { id: "ece-dig-boolean", name: "Boolean Algebra", importance: 0.7, pyqCount: 5 },
        { id: "ece-dig-combinational", name: "Combinational Circuits", importance: 0.75, pyqCount: 6 },
        { id: "ece-dig-sequential", name: "Sequential Circuits", importance: 0.8, pyqCount: 7 },
        { id: "ece-dig-verilog", name: "Verilog/HDL", importance: 0.6, pyqCount: 4 },
      ]},
    ],
  },
  {
    branch: {
      id: "ee",
      name: "Electrical Engineering",
      shortName: "EE",
      icon: "⚡",
      color: "#f59e0b",
      subjectCount: 7,
      totalMarks: 65,
    },
    subjects: [
      { id: "ee-gt", name: "General Aptitude", weight: 15, topics: [
        { id: "ee-gt-va", name: "Verbal Aptitude", importance: 0.8, pyqCount: 12 },
        { id: "ee-gt-na", name: "Numerical Aptitude", importance: 0.85, pyqCount: 15 },
      ]},
      { id: "ee-engmath", name: "Engineering Mathematics", weight: 13, topics: [
        { id: "ee-em-lin", name: "Linear Algebra", importance: 0.8, pyqCount: 6 },
        { id: "ee-em-calc", name: "Calculus", importance: 0.8, pyqCount: 7 },
        { id: "ee-em-prob", name: "Probability & Statistics", importance: 0.85, pyqCount: 8 },
      ]},
      { id: "ee-pow", name: "Power Systems", weight: 10, topics: [
        { id: "ee-pow-gen", name: "Power Generation", importance: 0.7, pyqCount: 5 },
        { id: "ee-pow-trans", name: "Transmission", importance: 0.75, pyqCount: 6 },
        { id: "ee-pow-fault", name: "Fault Analysis", importance: 0.85, pyqCount: 8 },
        { id: "ee-pow-protection", name: "Protection Systems", importance: 0.7, pyqCount: 5 },
      ]},
      { id: "ee-machines", name: "Electrical Machines", weight: 10, topics: [
        { id: "ee-mac-dc", name: "DC Machines", importance: 0.75, pyqCount: 6 },
        { id: "ee-mac-transformers", name: "Transformers", importance: 0.85, pyqCount: 8 },
        { id: "ee-mac-induction", name: "Induction Motors", importance: 0.8, pyqCount: 7 },
        { id: "ee-mac-sync", name: "Synchronous Machines", importance: 0.75, pyqCount: 6 },
      ]},
      { id: "ee-control", name: "Control Systems", weight: 8, topics: [
        { id: "ee-ctrl-block", name: "Block Diagrams", importance: 0.7, pyqCount: 5 },
        { id: "ee-ctrl-rlocus", name: "Root Locus", importance: 0.8, pyqCount: 7 },
        { id: "ee-ctrl-freq", name: "Frequency Response", importance: 0.85, pyqCount: 8 },
        { id: "ee-ctrl-state", name: "State Space", importance: 0.7, pyqCount: 5 },
      ]},
      { id: "ee-signals", name: "Signals & Systems", weight: 7, topics: [
        { id: "ee-sig-lti", name: "LTI Systems", importance: 0.8, pyqCount: 6 },
        { id: "ee-sig-fourier", name: "Fourier Transform", importance: 0.85, pyqCount: 8 },
        { id: "ee-sig-lap", name: "Laplace Transform", importance: 0.85, pyqCount: 8 },
      ]},
      { id: "ee-eme", name: "EM Theory", weight: 7, topics: [
        { id: "ee-eme-electrostatics", name: "Electrostatics", importance: 0.75, pyqCount: 6 },
        { id: "ee-eme-magnetostatics", name: "Magnetostatics", importance: 0.75, pyqCount: 5 },
        { id: "ee-eme-emw", name: "EM Waves", importance: 0.8, pyqCount: 7 },
      ]},
    ],
  },
  {
    branch: {
      id: "me",
      name: "Mechanical Engineering",
      shortName: "ME",
      icon: "⚙️",
      color: "#ef4444",
      subjectCount: 7,
      totalMarks: 65,
    },
    subjects: [
      { id: "me-gt", name: "General Aptitude", weight: 15, topics: [
        { id: "me-gt-va", name: "Verbal Aptitude", importance: 0.8, pyqCount: 12 },
        { id: "me-gt-na", name: "Numerical Aptitude", importance: 0.85, pyqCount: 15 },
      ]},
      { id: "me-engmath", name: "Engineering Mathematics", weight: 13, topics: [
        { id: "me-em-calc", name: "Calculus", importance: 0.8, pyqCount: 7 },
        { id: "me-em-prob", name: "Probability & Statistics", importance: 0.85, pyqCount: 8 },
        { id: "me-em-lin", name: "Linear Algebra", importance: 0.75, pyqCount: 5 },
      ]},
      { id: "me-som", name: "Strength of Materials", weight: 8, topics: [
        { id: "me-som-stress", name: "Stress & Strain", importance: 0.85, pyqCount: 8 },
        { id: "me-som-shear", name: "Shear Force & Bending Moment", importance: 0.8, pyqCount: 7 },
        { id: "me-som-torsion", name: "Torsion", importance: 0.75, pyqCount: 5 },
        { id: "me-som-columns", name: "Columns & Buckling", importance: 0.7, pyqCount: 5 },
      ]},
      { id: "me-tom", name: "Theory of Machines", weight: 8, topics: [
        { id: "me-tom-kinematics", name: "Kinematics", importance: 0.8, pyqCount: 7 },
        { id: "me-tom-dynamics", name: "Dynamics", importance: 0.75, pyqCount: 6 },
        { id: "me-tom-gears", name: "Gears & Gear Trains", importance: 0.7, pyqCount: 5 },
        { id: "me-tom-cam", name: "Cam & Follower", importance: 0.6, pyqCount: 4 },
        { id: "me-tom-vibration", name: "Vibration", importance: 0.8, pyqCount: 7 },
      ]},
      { id: "me-thermo", name: "Thermodynamics", weight: 8, topics: [
        { id: "me-th-laws", name: "Laws of Thermodynamics", importance: 0.85, pyqCount: 8 },
        { id: "me-th-entropy", name: "Entropy & Availability", importance: 0.8, pyqCount: 7 },
        { id: "me-th-cycles", name: "Power Cycles", importance: 0.75, pyqCount: 6 },
      ]},
      { id: "me-hmt", name: "Heat Transfer", weight: 7, topics: [
        { id: "me-hmt-conduction", name: "Conduction", importance: 0.8, pyqCount: 7 },
        { id: "me-hmt-convection", name: "Convection", importance: 0.75, pyqCount: 6 },
        { id: "me-hmt-radiation", name: "Radiation", importance: 0.7, pyqCount: 5 },
        { id: "me-hmt-heat", name: "Heat Exchangers", importance: 0.65, pyqCount: 4 },
      ]},
      { id: "me-manufacturing", name: "Manufacturing Processes", weight: 8, topics: [
        { id: "me-mfg-casting", name: "Casting", importance: 0.7, pyqCount: 5 },
        { id: "me-mfg-forming", name: "Metal Forming", importance: 0.7, pyqCount: 5 },
        { id: "me-mfg-machining", name: "Machining", importance: 0.8, pyqCount: 7 },
        { id: "me-mfg-welding", name: "Welding", importance: 0.65, pyqCount: 4 },
        { id: "me-mfg-metrology", name: "Metrology", importance: 0.6, pyqCount: 4 },
      ]},
    ],
  },
  {
    branch: {
      id: "ce",
      name: "Civil Engineering",
      shortName: "CE",
      icon: "🏗️",
      color: "#10b981",
      subjectCount: 7,
      totalMarks: 65,
    },
    subjects: [
      { id: "ce-gt", name: "General Aptitude", weight: 15, topics: [
        { id: "ce-gt-va", name: "Verbal Aptitude", importance: 0.8, pyqCount: 12 },
        { id: "ce-gt-na", name: "Numerical Aptitude", importance: 0.85, pyqCount: 15 },
      ]},
      { id: "ce-engmath", name: "Engineering Mathematics", weight: 13, topics: [
        { id: "ce-em-calc", name: "Calculus", importance: 0.8, pyqCount: 7 },
        { id: "ce-em-prob", name: "Probability & Statistics", importance: 0.85, pyqCount: 8 },
        { id: "ce-em-lin", name: "Linear Algebra", importance: 0.7, pyqCount: 5 },
      ]},
      { id: "ce-struct", name: "Structural Engineering", weight: 12, topics: [
        { id: "ce-st-som", name: "Stress & Strain", importance: 0.85, pyqCount: 8 },
        { id: "ce-st-bending", name: "Bending & Shear", importance: 0.8, pyqCount: 7 },
        { id: "ce-st-torsion", name: "Torsion", importance: 0.7, pyqCount: 5 },
        { id: "ce-st-columns", name: "Columns & Buckling", importance: 0.75, pyqCount: 6 },
        { id: "ce-st-frames", name: "Frames & Trusses", importance: 0.7, pyqCount: 5 },
      ]},
      { id: "ce-geotech", name: "Geotechnical Engineering", weight: 10, topics: [
        { id: "ce-gt-properties", name: "Soil Properties", importance: 0.8, pyqCount: 7 },
        { id: "ce-gt-classification", name: "Soil Classification", importance: 0.7, pyqCount: 5 },
        { id: "ce-gt-permeability", name: "Permeability", importance: 0.75, pyqCount: 6 },
        { id: "ce-gt-compression", name: "Compression & Consolidation", importance: 0.75, pyqCount: 6 },
        { id: "ce-gt-shear", name: "Shear Strength", importance: 0.8, pyqCount: 7 },
      ]},
      { id: "ce-wm", name: "Water Resources", weight: 8, topics: [
        { id: "ce-wm-hydrology", name: "Hydrology", importance: 0.75, pyqCount: 6 },
        { id: "ce-wm-irrigation", name: "Irrigation", importance: 0.7, pyqCount: 5 },
        { id: "ce-wm-flood", name: "Flood Management", importance: 0.65, pyqCount: 4 },
      ]},
      { id: "ce-transport", name: "Transportation Engineering", weight: 7, topics: [
        { id: "ce-tr-highway", name: "Highway Design", importance: 0.75, pyqCount: 5 },
        { id: "ce-tr-traffic", name: "Traffic Engineering", importance: 0.7, pyqCount: 5 },
        { id: "ce-tr-material", name: " Pavement Materials", importance: 0.65, pyqCount: 4 },
      ]},
      { id: "ce-environment", name: "Environmental Engineering", weight: 7, topics: [
        { id: "ce-env-water", name: "Water Treatment", importance: 0.7, pyqCount: 5 },
        { id: "ce-env-sewage", name: "Sewage Treatment", importance: 0.7, pyqCount: 5 },
        { id: "ce-env-solid", name: "Solid Waste", importance: 0.6, pyqCount: 3 },
      ]},
    ],
  },
  {
    branch: {
      id: "in",
      name: "Instrumentation Engineering",
      shortName: "IN",
      icon: "📊",
      color: "#06b6d4",
      subjectCount: 6,
      totalMarks: 65,
    },
    subjects: [
      { id: "in-gt", name: "General Aptitude", weight: 15, topics: [
        { id: "in-gt-va", name: "Verbal Aptitude", importance: 0.8, pyqCount: 12 },
        { id: "in-gt-na", name: "Numerical Aptitude", importance: 0.85, pyqCount: 15 },
      ]},
      { id: "in-engmath", name: "Engineering Mathematics", weight: 13, topics: [
        { id: "in-em-calc", name: "Calculus", importance: 0.8, pyqCount: 7 },
        { id: "in-em-complex", name: "Complex Variables", importance: 0.75, pyqCount: 6 },
        { id: "in-em-prob", name: "Probability", importance: 0.85, pyqCount: 8 },
        { id: "in-em-la", name: "Linear Algebra", importance: 0.7, pyqCount: 5 },
      ]},
      { id: "in-ec", name: "Electric Circuits", weight: 10, topics: [
        { id: "in-ec-kcl", name: "KCL/KVL", importance: 0.8, pyqCount: 7 },
        { id: "in-ec-network", name: "Network Theorems", importance: 0.85, pyqCount: 8 },
        { id: "in-ec-transient", name: "Transient Analysis", importance: 0.75, pyqCount: 6 },
        { id: "in-ec-ac", name: "AC Analysis", importance: 0.7, pyqCount: 5 },
      ]},
      { id: "in-measurement", name: "Measurement", weight: 10, topics: [
        { id: "in-mes-error", name: "Error Analysis", importance: 0.8, pyqCount: 7 },
        { id: "in-mes-instruments", name: "Instruments", importance: 0.75, pyqCount: 6 },
        { id: "in-mes-bridges", name: "Bridges & Potentiometers", importance: 0.7, pyqCount: 5 },
        { id: "in-mes-oscilloscope", name: "CRO & DSO", importance: 0.7, pyqCount: 5 },
      ]},
      { id: "in-transducers", name: "Transducers", weight: 8, topics: [
        { id: "in-tp-resistive", name: "Resistive Transducers", importance: 0.7, pyqCount: 5 },
        { id: "in-tp-capacitive", name: "Capacitive Transducers", importance: 0.7, pyqCount: 5 },
        { id: "in-tp-inductive", name: "Inductive Transducers", importance: 0.7, pyqCount: 5 },
        { id: "in-tp-opto", name: "Optical Transducers", importance: 0.65, pyqCount: 4 },
      ]},
      { id: "in-control", name: "Control Systems", weight: 9, topics: [
        { id: "in-ctrl-block", name: "Block Diagrams", importance: 0.7, pyqCount: 5 },
        { id: "in-ctrl-rlocus", name: "Root Locus", importance: 0.8, pyqCount: 7 },
        { id: "in-ctrl-freq", name: "Frequency Response", importance: 0.85, pyqCount: 8 },
        { id: "in-ctrl-state", name: "State Space", importance: 0.7, pyqCount: 5 },
        { id: "in-ctrl-comp", name: "Compensators", importance: 0.65, pyqCount: 4 },
      ]},
    ],
  },
  {
    branch: {
      id: "pi",
      name: "Production & Industrial Engineering",
      shortName: "PI",
      icon: "🏭",
      color: "#f97316",
      subjectCount: 6,
      totalMarks: 65,
    },
    subjects: [
      { id: "pi-gt", name: "General Aptitude", weight: 15, topics: [
        { id: "pi-gt-va", name: "Verbal Aptitude", importance: 0.8, pyqCount: 12 },
        { id: "pi-gt-na", name: "Numerical Aptitude", importance: 0.85, pyqCount: 15 },
      ]},
      { id: "pi-engmath", name: "Engineering Mathematics", weight: 13, topics: [
        { id: "pi-em-calc", name: "Calculus", importance: 0.8, pyqCount: 7 },
        { id: "pi-em-prob", name: "Probability & Statistics", importance: 0.85, pyqCount: 8 },
        { id: "pi-em-lin", name: "Linear Algebra", importance: 0.7, pyqCount: 5 },
      ]},
      { id: "pi-ppc", name: "Production Planning & Control", weight: 12, topics: [
        { id: "pi-ppc-forecast", name: "Demand Forecasting", importance: 0.75, pyqCount: 6 },
        { id: "pi-ppc-inventory", name: "Inventory Control", importance: 0.8, pyqCount: 7 },
        { id: "pi-ppc-scheduling", name: "Scheduling", importance: 0.75, pyqCount: 5 },
        { id: "pi-ppc-aggregate", name: "Aggregate Planning", importance: 0.7, pyqCount: 4 },
      ]},
      { id: "pi-om", name: "Operations Research", weight: 10, topics: [
        { id: "pi-om-lp", name: "Linear Programming", importance: 0.85, pyqCount: 8 },
        { id: "pi-om-trans", name: "Transportation Problem", importance: 0.8, pyqCount: 7 },
        { id: "pi-om-assign", name: "Assignment Problem", importance: 0.75, pyqCount: 5 },
        { id: "pi-om-nlp", name: "Non-linear Programming", importance: 0.6, pyqCount: 3 },
      ]},
      { id: "pi-qlc", name: "Quality & Reliability", weight: 8, topics: [
        { id: "pi-qlc-spc", name: "SPC & Control Charts", importance: 0.8, pyqCount: 7 },
        { id: "pi-qlc-acceptance", name: "Acceptance Sampling", importance: 0.7, pyqCount: 5 },
        { id: "pi-qlc-reliability", name: "Reliability", importance: 0.7, pyqCount: 5 },
      ]},
      { id: "pi-work", name: "Work Study & Ergonomics", weight: 7, topics: [
        { id: "pi-ws-method", name: "Method Study", importance: 0.7, pyqCount: 5 },
        { id: "pi-ws-motion", name: "Motion Study", importance: 0.65, pyqCount: 4 },
        { id: "pi-ws-ergo", name: "Ergonomics", importance: 0.6, pyqCount: 3 },
      ]},
    ],
  },
];

/** Look up a branch profile by ID. */
export function getBranchById(branchId: string): BranchProfile | undefined {
  return SYLLABUS.find((s) => s.branch.id === branchId)?.branch;
}

/** Look up a subject profile within a branch. */
export function getSubjectById(branchId: string, subjectId: string): SubjectProfile | undefined {
  return SYLLABUS
    .find((s) => s.branch.id === branchId)
    ?.subjects.find((sub) => sub.id === subjectId);
}

/** Get all branch profiles. */
export function getAllBranches(): BranchProfile[] {
  return SYLLABUS.map((s) => s.branch);
}

/** Get all subject profiles for a branch. */
export function getSubjectsForBranch(branchId: string): SubjectProfile[] {
  return SYLLABUS.find((s) => s.branch.id === branchId)?.subjects ?? [];
}

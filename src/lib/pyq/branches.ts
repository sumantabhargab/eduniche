/**
 * PYQ Branch Registry
 *
 * Canonical branch definitions. Every branch supported by PadhaiShuru.
 * Used for both the GATE questions system and the game/leaderboard system.
 *
 * DO NOT manually add branches without also adding corresponding
 * subjects, questions, and data files.
 */

export interface PYQBranch {
  branchCode: string;
  branchName: string;
  displayName: string;
  examCode: string;
  questionCount: number;
  yearMin: number;
  yearMax: number;
  active: boolean;
  pyqStatus: "complete" | "partial" | "planned";
  sourceIds: string[];
}

export interface PYQSubject {
  subjectName: string;
  displayName: string;
  displayOrder: number;
  topics: PYQTopic[];
}

export interface PYQTopic {
  topicName: string;
  displayName: string;
  displayOrder: number;
  subtopics: string[];
  questionCount: number;
}

/**
 * Resolve branch code to canonical branch info.
 */
export function resolveBranch(code: string): PYQBranch | undefined {
  const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return BRANCH_REGISTRY.find(
    (b) =>
      b.branchCode === normalized ||
      b.branchCode === code.toUpperCase()
  );
}

/**
 * Get all active branches.
 */
export function getActiveBranches(): PYQBranch[] {
  return BRANCH_REGISTRY.filter((b) => b.active);
}

/**
 * Get subjects for a branch.
 */
export function getSubjectsForBranch(branchCode: string): PYQSubject[] {
  const branch = resolveBranch(branchCode);
  if (!branch) return [];
  return SUBJECT_REGISTRY[branch.branchCode] || [];
}

/**
 * Get subject by name for a branch.
 */
export function getSubjectByName(branchCode: string, name: string): PYQSubject | undefined {
  const subjects = getSubjectsForBranch(branchCode);
  return subjects.find(
    (s) =>
      s.subjectName.toLowerCase() === name.toLowerCase() ||
      s.displayName.toLowerCase() === name.toLowerCase()
  );
}

// ─── Branch Registry ─────────────────────────────────────────────────────────

export const BRANCH_REGISTRY: PYQBranch[] = [
  {
    branchCode: "CS",
    branchName: "Computer Science and Information Technology",
    displayName: "Computer Science",
    examCode: "CS",
    questionCount: 59,
    yearMin: 2021,
    yearMax: 2024,
    active: true,
    pyqStatus: "partial",
    sourceIds: ["official"],
  },
  {
    branchCode: "EC",
    branchName: "Electronics and Communication Engineering",
    displayName: "Electronics & Communication",
    examCode: "EC",
    questionCount: 40,
    yearMin: 2021,
    yearMax: 2024,
    active: true,
    pyqStatus: "partial",
    sourceIds: ["official"],
  },
  {
    branchCode: "EE",
    branchName: "Electrical Engineering",
    displayName: "Electrical Engineering",
    examCode: "EE",
    questionCount: 40,
    yearMin: 2021,
    yearMax: 2024,
    active: true,
    pyqStatus: "partial",
    sourceIds: ["official"],
  },
  {
    branchCode: "ME",
    branchName: "Mechanical Engineering",
    displayName: "Mechanical Engineering",
    examCode: "ME",
    questionCount: 20,
    yearMin: 2023,
    yearMax: 2024,
    active: true,
    pyqStatus: "partial",
    sourceIds: ["official"],
  },
  {
    branchCode: "CE",
    branchName: "Civil Engineering",
    displayName: "Civil Engineering",
    examCode: "CE",
    questionCount: 20,
    yearMin: 2023,
    yearMax: 2024,
    active: true,
    pyqStatus: "partial",
    sourceIds: ["official"],
  },
  {
    branchCode: "IN",
    branchName: "Instrumentation Engineering",
    displayName: "Instrumentation",
    examCode: "IN",
    questionCount: 10,
    yearMin: 2024,
    yearMax: 2024,
    active: true,
    pyqStatus: "partial",
    sourceIds: ["official"],
  },
  {
    branchCode: "PI",
    branchName: "Production and Industrial Engineering",
    displayName: "Production & Industrial",
    examCode: "PI",
    questionCount: 10,
    yearMin: 2024,
    yearMax: 2024,
    active: true,
    pyqStatus: "partial",
    sourceIds: ["official"],
  },
  {
    branchCode: "CH",
    branchName: "Chemical Engineering",
    displayName: "Chemical Engineering",
    examCode: "CH",
    questionCount: 10,
    yearMin: 2024,
    yearMax: 2024,
    active: true,
    pyqStatus: "partial",
    sourceIds: ["official"],
  },
  {
    branchCode: "BT",
    branchName: "Biotechnology",
    displayName: "Biotechnology",
    examCode: "BT",
    questionCount: 10,
    yearMin: 2024,
    yearMax: 2024,
    active: true,
    pyqStatus: "partial",
    sourceIds: ["official"],
  },
  {
    branchCode: "MT",
    branchName: "Metallurgical Engineering",
    displayName: "Metallurgy",
    examCode: "MT",
    questionCount: 10,
    yearMin: 2024,
    yearMax: 2024,
    active: true,
    pyqStatus: "partial",
    sourceIds: ["official"],
  },
  {
    branchCode: "XE",
    branchName: "Engineering Sciences",
    displayName: "Engineering Sciences",
    examCode: "XE",
    questionCount: 10,
    yearMin: 2024,
    yearMax: 2024,
    active: true,
    pyqStatus: "partial",
    sourceIds: ["official"],
  },
  {
    branchCode: "XL",
    branchName: "Life Sciences",
    displayName: "Life Sciences",
    examCode: "XL",
    questionCount: 10,
    yearMin: 2024,
    yearMax: 2024,
    active: true,
    pyqStatus: "partial",
    sourceIds: ["official"],
  },
  {
    branchCode: "TF",
    branchName: "Textile Engineering and Fibre Science",
    displayName: "Textile Engineering",
    examCode: "TF",
    questionCount: 10,
    yearMin: 2024,
    yearMax: 2024,
    active: true,
    pyqStatus: "partial",
    sourceIds: ["official"],
  },
  {
    branchCode: "PE",
    branchName: "Petroleum Engineering",
    displayName: "Petroleum Engineering",
    examCode: "PE",
    questionCount: 10,
    yearMin: 2024,
    yearMax: 2024,
    active: true,
    pyqStatus: "partial",
    sourceIds: ["official"],
  },
  {
    branchCode: "EY",
    branchName: "Ecology and Evolution",
    displayName: "Ecology & Evolution",
    examCode: "EY",
    questionCount: 10,
    yearMin: 2024,
    yearMax: 2024,
    active: true,
    pyqStatus: "partial",
    sourceIds: ["official"],
  },
  {
    branchCode: "MA",
    branchName: "Mathematics",
    displayName: "Mathematics (MA)",
    examCode: "MA",
    questionCount: 10,
    yearMin: 2024,
    yearMax: 2024,
    active: true,
    pyqStatus: "partial",
    sourceIds: ["official"],
  },
  {
    branchCode: "AR",
    branchName: "Architecture and Planning",
    displayName: "Architecture & Planning",
    examCode: "AR",
    questionCount: 10,
    yearMin: 2024,
    yearMax: 2024,
    active: true,
    pyqStatus: "partial",
    sourceIds: ["official"],
  },
  {
    branchCode: "AG",
    branchName: "Agricultural Engineering",
    displayName: "Agricultural Engineering",
    examCode: "AG",
    questionCount: 10,
    yearMin: 2024,
    yearMax: 2024,
    active: true,
    pyqStatus: "partial",
    sourceIds: ["official"],
  },
  {
    branchCode: "GG",
    branchName: "Geology and Geophysics",
    displayName: "Geology & Geophysics",
    examCode: "GG",
    questionCount: 10,
    yearMin: 2024,
    yearMax: 2024,
    active: true,
    pyqStatus: "partial",
    sourceIds: ["official"],
  },
  {
    branchCode: "PH",
    branchName: "Engineering Physics",
    displayName: "Engineering Physics",
    examCode: "PH",
    questionCount: 10,
    yearMin: 2024,
    yearMax: 2024,
    active: true,
    pyqStatus: "partial",
    sourceIds: ["official"],
  },
];

// ─── Subject Taxonomy ─────────────────────────────────────────────────────────

export const SUBJECT_REGISTRY: Record<string, PYQSubject[]> = {
  CS: [
    {
      subjectName: "General Aptitude",
      displayName: "General Aptitude",
      displayOrder: 1,
      topics: [
        { topicName: "Verbal Aptitude", displayName: "Verbal Aptitude", displayOrder: 1, subtopics: ["Reading Comprehension", "Grammar", "Vocabulary"], questionCount: 180 },
        { topicName: "Quantitative Aptitude", displayName: "Quantitative Aptitude", displayOrder: 2, subtopics: ["Percentages", "Ratios", "Time & Work", "Profit & Loss", "Geometry"], questionCount: 200 },
        { topicName: "Analytical Reasoning", displayName: "Analytical Reasoning", displayOrder: 3, subtopics: ["Data Interpretation", "Critical Reasoning", "Syllogism"], questionCount: 150 },
      ],
    },
    {
      subjectName: "Engineering Mathematics",
      displayName: "Engineering Mathematics",
      displayOrder: 2,
      topics: [
        { topicName: "Linear Algebra", displayName: "Linear Algebra", displayOrder: 1, subtopics: ["Matrix Rank", "Eigenvalues", "Systems of Equations"], questionCount: 120 },
        { topicName: "Calculus", displayName: "Calculus", displayOrder: 2, subtopics: ["Limits", "Differentiation", "Integration", "Maxima/Minima"], questionCount: 100 },
        { topicName: "Probability & Statistics", displayName: "Probability & Statistics", displayOrder: 3, subtopics: ["Bayes Theorem", "Random Variables", "Distributions", "Expectation"], questionCount: 130 },
        { topicName: "Discrete Mathematics", displayName: "Discrete Mathematics", displayOrder: 4, subtopics: ["Sets", "Relations", "Graphs", "Combinatorics"], questionCount: 90 },
      ],
    },
    {
      subjectName: "Digital Logic",
      displayName: "Digital Logic",
      displayOrder: 3,
      topics: [
        { topicName: "Number Systems & Boolean Algebra", displayName: "Number Systems & Boolean Algebra", displayOrder: 1, subtopics: ["K-maps", "Logic Gates", "Minimization"], questionCount: 80 },
        { topicName: "Combinational Circuits", displayName: "Combinational Circuits", displayOrder: 2, subtopics: ["Adders", "Multiplexers", "Decoders"], questionCount: 60 },
        { topicName: "Sequential Circuits", displayName: "Sequential Circuits", displayOrder: 3, subtopics: ["Flip-Flops", "Counters", "Registers"], questionCount: 70 },
      ],
    },
    {
      subjectName: "Computer Organization & Architecture",
      displayName: "Computer Organization & Architecture",
      displayOrder: 4,
      topics: [
        { topicName: "Machine Instructions & Addressing", displayName: "Machine Instructions & Addressing", displayOrder: 1, subtopics: ["Instruction Formats", "Addressing Modes"], questionCount: 70 },
        { topicName: "ALU & Data Path", displayName: "ALU & Data Path", displayOrder: 2, subtopics: ["Arithmetic Circuits", "Overflow"], questionCount: 50 },
        { topicName: "Memory Hierarchy & Cache", displayName: "Memory Hierarchy & Cache", displayOrder: 3, subtopics: ["Cache Mapping", "Replacement", "Write Policy"], questionCount: 90 },
        { topicName: "Pipelining", displayName: "Pipelining", displayOrder: 4, subtopics: ["Data Hazards", "Control Hazards", "Speedup"], questionCount: 80 },
        { topicName: "I/O & Interrupts", displayName: "I/O & Interrupts", displayOrder: 5, subtopics: ["Interrupt Handling", "DMA"], questionCount: 40 },
      ],
    },
    {
      subjectName: "Programming & Data Structures",
      displayName: "Programming & Data Structures",
      displayOrder: 5,
      topics: [
        { topicName: "Arrays & Linked Lists", displayName: "Arrays & Linked Lists", displayOrder: 1, subtopics: ["Traversal", "Reversal", "Loop Detection"], questionCount: 60 },
        { topicName: "Stacks & Queues", displayName: "Stacks & Queues", displayOrder: 2, subtopics: ["Implementation", "Applications"], questionCount: 50 },
        { topicName: "Trees", displayName: "Trees", displayOrder: 3, subtopics: ["Binary Trees", "BST", "Traversals", "Threaded Trees"], questionCount: 90 },
        { topicName: "Graphs", displayName: "Graphs", displayOrder: 4, subtopics: ["Representations", "BFS/DFS", "Topological Sort"], questionCount: 70 },
        { topicName: "Hashing", displayName: "Hashing", displayOrder: 5, subtopics: ["Hash Functions", "Collision Resolution"], questionCount: 40 },
        { topicName: "Recursion", displayName: "Recursion", displayOrder: 6, subtopics: ["Base Cases", "Recurrence Relations"], questionCount: 30 },
      ],
    },
    {
      subjectName: "Algorithms",
      displayName: "Algorithms",
      displayOrder: 6,
      topics: [
        { topicName: "Graph Algorithms", displayName: "Graph Algorithms", displayOrder: 1, subtopics: ["Shortest Paths", "MST", "DFS/BFS", "Topological Sort"], questionCount: 100 },
        { topicName: "Sorting & Searching", displayName: "Sorting & Searching", displayOrder: 2, subtopics: ["Merge Sort", "Quick Sort", "Heap Sort", "Binary Search"], questionCount: 80 },
        { topicName: "Dynamic Programming", displayName: "Dynamic Programming", displayOrder: 3, subtopics: ["Knapsack", "LCS", "Matrix Chain", "Optimal Substructure"], questionCount: 90 },
        { topicName: "Greedy Algorithms", displayName: "Greedy Algorithms", displayOrder: 4, subtopics: ["Activity Selection", "Huffman Coding", "Fractional Knapsack"], questionCount: 50 },
        { topicName: "Divide & Conquer", displayName: "Divide & Conquer", displayOrder: 5, subtopics: ["Master Theorem", "Recurrence Relations"], questionCount: 60 },
        { topicName: "Complexity Analysis", displayName: "Complexity Analysis", displayOrder: 6, subtopics: ["Time Complexity", "Space Complexity", "NP-Completeness"], questionCount: 70 },
      ],
    },
    {
      subjectName: "Theory of Computation",
      displayName: "Theory of Computation",
      displayOrder: 7,
      topics: [
        { topicName: "Finite Automata & DFA/NFA Minimization", displayName: "Finite Automata & DFA/NFA Minimization", displayOrder: 1, subtopics: ["DFA", "NFA", "Minimization", "Regular Languages"], questionCount: 90 },
        { topicName: "Regular Expressions (RE)", displayName: "Regular Expressions (RE)", displayOrder: 2, subtopics: ["Equivalence", "Closure Properties", "Pumping Lemma"], questionCount: 60 },
        { topicName: "Context-Free Grammars", displayName: "Context-Free Grammars", displayOrder: 3, subtopics: ["CFG", "CNF", "Greibach Normal Form"], questionCount: 70 },
        { topicName: "Pushdown Automata", displayName: "Pushdown Automata", displayOrder: 4, subtopics: ["PDA", "Deterministic PDA"], questionCount: 50 },
        { topicName: "Turing Machines", displayName: "Turing Machines", displayOrder: 5, subtopics: ["TM Design", "Undecidability", "Rice's Theorem"], questionCount: 70 },
        { topicName: "Decidability & Reducibility", displayName: "Decidability & Reducibility", displayOrder: 6, subtopics: ["Halting Problem", "Reduction", "Recursive Enumerable"], questionCount: 60 },
        { topicName: "Closure Properties", displayName: "Closure Properties", displayOrder: 7, subtopics: ["Closure under Union", "Closure under Intersection"], questionCount: 40 },
      ],
    },
    {
      subjectName: "Compiler Design",
      displayName: "Compiler Design",
      displayOrder: 8,
      topics: [
        { topicName: "Lexical Analysis", displayName: "Lexical Analysis", displayOrder: 1, subtopics: ["Tokenization", "Regular Expressions", "Lexer"], questionCount: 40 },
        { topicName: "Parsing", displayName: "Parsing", displayOrder: 2, subtopics: ["Top-Down Parsing", "Bottom-Up Parsing", "LR Parsers"], questionCount: 80 },
        { topicName: "Syntax Analysis", displayName: "Syntax Analysis", displayOrder: 3, subtopics: ["Parse Trees", "Ambiguity"], questionCount: 40 },
        { topicName: "Intermediate Code Generation", displayName: "Intermediate Code Generation", displayOrder: 4, subtopics: ["Three-Address Code", "Quadruples"], questionCount: 30 },
        { topicName: "Code Optimization", displayName: "Code Optimization", displayOrder: 5, subtopics: ["Constant Folding", "Loop Optimization"], questionCount: 30 },
      ],
    },
    {
      subjectName: "Operating Systems",
      displayName: "Operating Systems",
      displayOrder: 9,
      topics: [
        { topicName: "Process Management", displayName: "Process Management", displayOrder: 1, subtopics: ["Process States", "PCB", "Context Switch"], questionCount: 50 },
        { topicName: "CPU Scheduling", displayName: "CPU Scheduling", displayOrder: 2, subtopics: ["FCFS", "SJF", "Round Robin", "Priority", "Multilevel Queue"], questionCount: 80 },
        { topicName: "Synchronization", displayName: "Synchronization", displayOrder: 3, subtopics: ["Mutex", "Semaphores", "Peterson's Algorithm", "Dining Philosophers"], questionCount: 90 },
        { topicName: "Deadlocks", displayName: "Deadlocks", displayOrder: 4, subtopics: ["Banker's Algorithm", "Safety", "Prevention", "Avoidance", "Detection"], questionCount: 70 },
        { topicName: "Memory Management", displayName: "Memory Management", displayOrder: 5, subtopics: ["Paging", "Segmentation", "Virtual Memory", "Page Replacement"], questionCount: 90 },
        { topicName: "File Systems", displayName: "File Systems", displayOrder: 6, subtopics: ["Inodes", "Directory Structure", "Free Space Management"], questionCount: 40 },
        { topicName: "Disk Scheduling", displayName: "Disk Scheduling", displayOrder: 7, subtopics: ["FCFS", "SCAN", "C-SCAN", "Look"], questionCount: 30 },
      ],
    },
    {
      subjectName: "Databases",
      displayName: "Databases",
      displayOrder: 10,
      topics: [
        { topicName: "Relational Model", displayName: "Relational Model", displayOrder: 1, subtopics: ["Keys", "Integrity Constraints", "Normalization"], questionCount: 80 },
        { topicName: "SQL & Relational Algebra", displayName: "SQL & Relational Algebra", displayOrder: 2, subtopics: ["Joins", "Subqueries", "Aggregation", "Relational Algebra"], questionCount: 90 },
        { topicName: "Transaction Management", displayName: "Transaction Management", displayOrder: 3, subtopics: ["ACID Properties", "Concurrency Control", "Locking"], questionCount: 70 },
        { topicName: "Indexing", displayName: "Indexing", displayOrder: 4, subtopics: ["B+ Trees", "Hashing", "ISAM"], questionCount: 50 },
        { topicName: "ER Diagrams", displayName: "ER Diagrams", displayOrder: 5, subtopics: ["Entities", "Relationships", "Cardinality"], questionCount: 30 },
      ],
    },
    {
      subjectName: "Computer Networks",
      displayName: "Computer Networks",
      displayOrder: 11,
      topics: [
        { topicName: "Physical & Data Link Layer", displayName: "Physical & Data Link Layer", displayOrder: 1, subtopics: ["Framing", "Error Detection", "Switching"], questionCount: 50 },
        { topicName: "Network Layer", displayName: "Network Layer", displayOrder: 2, subtopics: ["IP Addressing", "Subnetting", "Routing", "NAT"], questionCount: 80 },
        { topicName: "Transport Layer", displayName: "Transport Layer", displayOrder: 3, subtopics: ["TCP", "UDP", "Congestion Control", "Flow Control", "Sliding Window"], questionCount: 100 },
        { topicName: "Application Layer", displayName: "Application Layer", displayOrder: 4, subtopics: ["DNS", "HTTP", "SMTP", "FTP", "Socket Programming"], questionCount: 60 },
        { topicName: "Network Security", displayName: "Network Security", displayOrder: 5, subtopics: ["Firewalls", "Encryption", "Digital Signatures", "SSL/TLS"], questionCount: 40 },
        { topicName: "Network Hardware", displayName: "Network Hardware", displayOrder: 6, subtopics: ["Switches", "Routers", "Hubs"], questionCount: 20 },
      ],
    },
  ],
  EC: [
    {
      subjectName: "General Aptitude",
      displayName: "General Aptitude",
      displayOrder: 1,
      topics: [
        { topicName: "Verbal Aptitude", displayName: "Verbal Aptitude", displayOrder: 1, subtopics: ["Reading Comprehension", "Grammar", "Vocabulary"], questionCount: 170 },
        { topicName: "Quantitative Aptitude", displayName: "Quantitative Aptitude", displayOrder: 2, subtopics: ["Percentages", "Ratios", "Geometry"], questionCount: 190 },
        { topicName: "Analytical Reasoning", displayName: "Analytical Reasoning", displayOrder: 3, subtopics: ["Data Interpretation", "Critical Reasoning"], questionCount: 140 },
      ],
    },
    {
      subjectName: "Engineering Mathematics",
      displayName: "Engineering Mathematics",
      displayOrder: 2,
      topics: [
        { topicName: "Linear Algebra", displayName: "Linear Algebra", displayOrder: 1, subtopics: ["Matrix Rank", "Eigenvalues", "Systems of Equations"], questionCount: 100 },
        { topicName: "Calculus", displayName: "Calculus", displayOrder: 2, subtopics: ["Limits", "Differentiation", "Integration"], questionCount: 80 },
        { topicName: "Probability & Statistics", displayName: "Probability & Statistics", displayOrder: 3, subtopics: ["Bayes Theorem", "Random Variables", "Distributions"], questionCount: 90 },
        { topicName: "Complex Analysis", displayName: "Complex Analysis", displayOrder: 4, subtopics: ["Contour Integration", "Residue Theorem"], questionCount: 40 },
      ],
    },
    {
      subjectName: "Network, Signals & Systems",
      displayName: "Network, Signals & Systems",
      displayOrder: 3,
      topics: [
        { topicName: "Network Theorems", displayName: "Network Theorems", displayOrder: 1, subtopics: ["KVL/KCL", "Thevenin", "Norton", "Superposition"], questionCount: 80 },
        { topicName: "Time & Frequency Domain", displayName: "Time & Frequency Domain", displayOrder: 2, subtopics: ["Fourier Series", "Laplace Transform", "Z-Transform"], questionCount: 100 },
        { topicName: "Filters & Two-Port Networks", displayName: "Filters & Two-Port Networks", displayOrder: 3, subtopics: ["Low/High Pass", "Transmission Parameters"], questionCount: 70 },
      ],
    },
    {
      subjectName: "Electronic Devices",
      displayName: "Electronic Devices",
      displayOrder: 4,
      topics: [
        { topicName: "Semiconductor Physics", displayName: "Semiconductor Physics", displayOrder: 1, subtopics: ["PN Junction", "MOSFET", "BJT", "Op-Amps"], questionCount: 100 },
        { topicName: "IC Fabrication", displayName: "IC Fabrication", displayOrder: 2, subtopics: ["Oxidation", "Diffusion", "Photolithography"], questionCount: 40 },
      ],
    },
    {
      subjectName: "Analog Circuits",
      displayName: "Analog Circuits",
      displayOrder: 5,
      topics: [
        { topicName: "Diode & BJT Circuits", displayName: "Diode & BJT Circuits", displayOrder: 1, subtopics: ["Rectifiers", "Amplifiers", "Biasing"], questionCount: 70 },
        { topicName: "Op-Amp Circuits", displayName: "Op-Amp Circuits", displayOrder: 2, subtopics: ["Inverting/Non-inverting", "Integrators", "Filters"], questionCount: 80 },
        { topicName: "Oscillators & Feedback", displayName: "Oscillators & Feedback", displayOrder: 3, subtopics: ["RC/LC Oscillators", "Feedback Topology"], questionCount: 50 },
      ],
    },
    {
      subjectName: "Digital Circuits",
      displayName: "Digital Circuits",
      displayOrder: 6,
      topics: [
        { topicName: "Number Systems & Boolean Algebra", displayName: "Number Systems & Boolean Algebra", displayOrder: 1, subtopics: ["K-maps", "Logic Gates"], questionCount: 50 },
        { topicName: "Combinational Circuits", displayName: "Combinational Circuits", displayOrder: 2, subtopics: ["Adders", "Multiplexers", "Decoders"], questionCount: 60 },
        { topicName: "Sequential Circuits", displayName: "Sequential Circuits", displayOrder: 3, subtopics: ["Flip-Flops", "Counters", "Registers"], questionCount: 70 },
        { topicName: "Microprocessor & Microcontroller", displayName: "Microprocessor & Microcontroller", displayOrder: 4, subtopics: ["8085/8086", "Assembly", "Interfacing"], questionCount: 80 },
      ],
    },
    {
      subjectName: "Control Systems",
      displayName: "Control Systems",
      displayOrder: 7,
      topics: [
        { topicName: "Signal Flow Graph & Block Diagram", displayName: "Signal Flow Graph & Block Diagram", displayOrder: 1, subtopics: ["Mason's Rule", "Transfer Function"], questionCount: 60 },
        { topicName: "Time Response Analysis", displayName: "Time Response Analysis", displayOrder: 2, subtopics: ["Step Response", "Rise Time", "Settling Time"], questionCount: 70 },
        { topicName: "Stability & Root Locus", displayName: "Stability & Root Locus", displayOrder: 3, subtopics: ["Routh-Hurwitz", "Root Locus Rules"], questionCount: 80 },
        { topicName: "Frequency Response & Bode Plot", displayName: "Frequency Response & Bode Plot", displayOrder: 4, subtopics: ["Bode Plot", "Nyquist", "Gain/Phase Margin"], questionCount: 70 },
        { topicName: "Compensators", displayName: "Compensators", displayOrder: 5, subtopics: ["Lead", "Lag", "Lead-Lag"], questionCount: 50 },
      ],
    },
    {
      subjectName: "Communication Systems",
      displayName: "Communication Systems",
      displayOrder: 8,
      topics: [
        { topicName: "Analog Communication", displayName: "Analog Communication", displayOrder: 1, subtopics: ["AM", "FM", "PM", "Noise"], questionCount: 80 },
        { topicName: "Digital Communication", displayName: "Digital Communication", displayOrder: 2, subtopics: ["PCM", "Sampling", "Error Control", "Modulation"], questionCount: 100 },
        { topicName: "Information Theory", displayName: "Information Theory", displayOrder: 3, subtopics: ["Entropy", "Channel Capacity", "Source Coding"], questionCount: 60 },
        { topicName: "Probability & Random Processes", displayName: "Probability & Random Processes", displayOrder: 4, subtopics: ["Gaussian Processes", "PSD", "Auto-correlation"], questionCount: 70 },
      ],
    },
    {
      subjectName: "Electromagnetics",
      displayName: "Electromagnetics",
      displayOrder: 9,
      topics: [
        { topicName: "Electrostatics & Magnetostatics", displayName: "Electrostatics & Magnetostatics", displayOrder: 1, subtopics: ["Gauss Law", "Boundary Conditions"], questionCount: 50 },
        { topicName: "Transmission Lines", displayName: "Transmission Lines", displayOrder: 2, subtopics: ["Impedance", "SWR", "Standing Waves"], questionCount: 70 },
        { topicName: "Waveguides & Antennas", displayName: "Waveguides & Antennas", displayOrder: 3, subtopics: ["Waveguide Modes", "Antenna Parameters", "Radiation Pattern"], questionCount: 80 },
      ],
    },
  ],
  EE: [
    {
      subjectName: "General Aptitude",
      displayName: "General Aptitude",
      displayOrder: 1,
      topics: [
        { topicName: "Verbal Aptitude", displayName: "Verbal Aptitude", displayOrder: 1, subtopics: ["Reading Comprehension", "Grammar", "Vocabulary"], questionCount: 165 },
        { topicName: "Quantitative Aptitude", displayName: "Quantitative Aptitude", displayOrder: 2, subtopics: ["Percentages", "Ratios", "Geometry"], questionCount: 185 },
        { topicName: "Analytical Reasoning", displayName: "Analytical Reasoning", displayOrder: 3, subtopics: ["Data Interpretation", "Critical Reasoning"], questionCount: 135 },
      ],
    },
    {
      subjectName: "Engineering Mathematics",
      displayName: "Engineering Mathematics",
      displayOrder: 2,
      topics: [
        { topicName: "Linear Algebra", displayName: "Linear Algebra", displayOrder: 1, subtopics: ["Matrix Rank", "Eigenvalues", "Systems of Equations"], questionCount: 95 },
        { topicName: "Calculus", displayName: "Calculus", displayOrder: 2, subtopics: ["Limits", "Differentiation", "Integration"], questionCount: 75 },
        { topicName: "Probability & Statistics", displayName: "Probability & Statistics", displayOrder: 3, subtopics: ["Bayes Theorem", "Random Variables", "Distributions"], questionCount: 85 },
        { topicName: "Differential Equations", displayName: "Differential Equations", displayOrder: 4, subtopics: ["First Order", "Second Order", "Laplace"], questionCount: 50 },
      ],
    },
    {
      subjectName: "Electric Circuits",
      displayName: "Electric Circuits",
      displayOrder: 3,
      topics: [
        { topicName: "Network Theorems", displayName: "Network Theorems", displayOrder: 1, subtopics: ["KVL/KCL", "Thevenin", "Norton", "Superposition"], questionCount: 90 },
        { topicName: "AC Circuit Analysis", displayName: "AC Circuit Analysis", displayOrder: 2, subtopics: ["Phasors", "Impedance", "Power Factor", "Resonance"], questionCount: 80 },
        { topicName: "Two-Port Networks", displayName: "Two-Port Networks", displayOrder: 3, subtopics: ["Z/Y Parameters", "ABCD Parameters"], questionCount: 60 },
        { topicName: "Transient Analysis", displayName: "Transient Analysis", displayOrder: 4, subtopics: ["RL/RLC Circuits", "Switching"], questionCount: 50 },
      ],
    },
    {
      subjectName: "Electrical Machines",
      displayName: "Electrical Machines",
      displayOrder: 4,
      topics: [
        { topicName: "Transformers", displayName: "Transformers", displayOrder: 1, subtopics: ["Equivalent Circuit", "Regulation", "Efficiency"], questionCount: 80 },
        { topicName: "DC Machines", displayName: "DC Machines", displayOrder: 2, subtopics: ["DC Generator", "DC Motor", "Starting", "Speed Control"], questionCount: 70 },
        { topicName: "Synchronous Machines", displayName: "Synchronous Machines", displayOrder: 3, subtopics: ["Synchronous Motor", "Alternator", "V-Curves"], questionCount: 80 },
        { topicName: "Induction Motors", displayName: "Induction Motors", displayOrder: 4, subtopics: ["Equivalent Circuit", "Torque-Slip", "Starting Methods"], questionCount: 70 },
      ],
    },
    {
      subjectName: "Power Systems",
      displayName: "Power Systems",
      displayOrder: 5,
      topics: [
        { topicName: "Power Generation & Economics", displayName: "Power Generation & Economics", displayOrder: 1, subtopics: ["Tariffs", "Load Factor", "Power Factor"], questionCount: 50 },
        { topicName: "Load Flow Studies", displayName: "Load Flow Studies", displayOrder: 2, subtopics: ["Gauss-Seidel", "Newton-Raphson", "Fast Decoupled"], questionCount: 60 },
        { topicName: "Fault Analysis", displayName: "Fault Analysis", displayOrder: 3, subtopics: ["Symmetrical Fault", "Unsymmetrical Fault"], questionCount: 70 },
        { topicName: "Protection & Switchgear", displayName: "Protection & Switchgear", displayOrder: 4, subtopics: ["Relays", "Circuit Breakers"], questionCount: 50 },
        { topicName: "Power System Stability", displayName: "Power System Stability", displayOrder: 5, subtopics: ["Steady State Stability", "Transient Stability", "Swing Equation"], questionCount: 40 },
      ],
    },
    {
      subjectName: "Control Systems",
      displayName: "Control Systems",
      displayOrder: 6,
      topics: [
        { topicName: "Block Diagrams & Signal Flow", displayName: "Block Diagrams & Signal Flow", displayOrder: 1, subtopics: ["Mason's Rule", "Transfer Function"], questionCount: 50 },
        { topicName: "Time Response Analysis", displayName: "Time Response Analysis", displayOrder: 2, subtopics: ["Step Response", "Time Constants"], questionCount: 60 },
        { topicName: "Stability & Root Locus", displayName: "Stability & Root Locus", displayOrder: 3, subtopics: ["Routh-Hurwitz", "Root Locus Rules"], questionCount: 70 },
        { topicName: "Frequency Response", displayName: "Frequency Response", displayOrder: 4, subtopics: ["Bode Plot", "Nyquist", "Gain Margin"], questionCount: 70 },
        { topicName: "State Space Analysis", displayName: "State Space Analysis", displayOrder: 5, subtopics: ["State Equations", "Controllability", "Observability"], questionCount: 60 },
      ],
    },
    {
      subjectName: "Electrical & Electronic Measurements",
      displayName: "Electrical & Electronic Measurements",
      displayOrder: 7,
      topics: [
        { topicName: "Measuring Instruments", displayName: "Measuring Instruments", displayOrder: 1, subtopics: ["PMMC", "Moving Iron", "Dynamometer"], questionCount: 50 },
        { topicName: "Bridges & Potentiometers", displayName: "Bridges & Potentiometers", displayOrder: 2, subtopics: ["Wheatstone Bridge", "Kelvin Bridge", "CRO"], questionCount: 60 },
        { topicName: "Error Analysis", displayName: "Error Analysis", displayOrder: 3, subtopics: ["Accuracy", "Precision", "Errors"], questionCount: 30 },
      ],
    },
    {
      subjectName: "Analog & Digital Electronics",
      displayName: "Analog & Digital Electronics",
      displayOrder: 8,
      topics: [
        { topicName: "Diode & BJT Circuits", displayName: "Diode & BJT Circuits", displayOrder: 1, subtopics: ["Rectifiers", "Amplifiers", "Clippers"], questionCount: 60 },
        { topicName: "Op-Amps", displayName: "Op-Amps", displayOrder: 2, subtopics: ["Inverting/Non-inverting", "Integrators", "Filters"], questionCount: 70 },
        { topicName: "Digital Logic", displayName: "Digital Logic", displayOrder: 3, subtopics: ["K-maps", "Logic Gates", "Flip-Flops"], questionCount: 50 },
        { topicName: "ADC & DAC", displayName: "ADC & DAC", displayOrder: 4, subtopics: ["Sampling", "Resolution", "Quantization"], questionCount: 40 },
      ],
    },
    {
      subjectName: "Power Electronics",
      displayName: "Power Electronics",
      displayOrder: 9,
      topics: [
        { topicName: "Diodes & Rectifiers", displayName: "Diodes & Rectifiers", displayOrder: 1, subtopics: ["Half-Wave", "Full-Wave", "Bridge"], questionCount: 50 },
        { topicName: "Thyristors & Inverters", displayName: "Thyristors & Inverters", displayOrder: 2, subtopics: ["SCR", "Triac", "Inverters"], questionCount: 70 },
        { topicName: "Chopper & DC-DC Converters", displayName: "Chopper & DC-DC Converters", displayOrder: 3, subtopics: ["Step-down", "Step-up"], questionCount: 50 },
        { topicName: "Voltage Control", displayName: "Voltage Control", displayOrder: 4, subtopics: ["AC Voltage Controllers", "PWM"], questionCount: 40 },
      ],
    },
  ],
  ME: [
    {
      subjectName: "General Aptitude",
      displayName: "General Aptitude",
      displayOrder: 1,
      topics: [
        { topicName: "Verbal Aptitude", displayName: "Verbal Aptitude", displayOrder: 1, subtopics: ["Reading Comprehension", "Grammar", "Vocabulary"], questionCount: 160 },
        { topicName: "Quantitative Aptitude", displayName: "Quantitative Aptitude", displayOrder: 2, subtopics: ["Percentages", "Ratios", "Geometry"], questionCount: 180 },
        { topicName: "Analytical Reasoning", displayName: "Analytical Reasoning", displayOrder: 3, subtopics: ["Data Interpretation", "Critical Reasoning"], questionCount: 130 },
      ],
    },
    {
      subjectName: "Engineering Mathematics",
      displayName: "Engineering Mathematics",
      displayOrder: 2,
      topics: [
        { topicName: "Linear Algebra", displayName: "Linear Algebra", displayOrder: 1, subtopics: ["Matrix Rank", "Eigenvalues", "Systems of Equations"], questionCount: 90 },
        { topicName: "Calculus", displayName: "Calculus", displayOrder: 2, subtopics: ["Limits", "Differentiation", "Integration"], questionCount: 70 },
        { topicName: "Probability & Statistics", displayName: "Probability & Statistics", displayOrder: 3, subtopics: ["Bayes Theorem", "Random Variables", "Distributions"], questionCount: 80 },
        { topicName: "Differential Equations", displayName: "Differential Equations", displayOrder: 4, subtopics: ["First Order", "Second Order", "Laplace"], questionCount: 50 },
      ],
    },
    {
      subjectName: "Applied Mechanics & Design",
      displayName: "Applied Mechanics & Design",
      displayOrder: 3,
      topics: [
        { topicName: "Engineering Mechanics", displayName: "Engineering Mechanics", displayOrder: 1, subtopics: ["Force Systems", "Equilibrium", "Friction"], questionCount: 80 },
        { topicName: "Strength of Materials", displayName: "Strength of Materials", displayOrder: 2, subtopics: ["Stress & Strain", "Bending", "Torsion", "Columns"], questionCount: 100 },
        { topicName: "Theory of Machines", displayName: "Theory of Machines", displayOrder: 3, subtopics: ["Kinematics", "Cams", "Gears", "Gyroscope"], questionCount: 80 },
        { topicName: "Machine Design", displayName: "Machine Design", displayOrder: 4, subtopics: ["Shafts", "Keys", "Bearings", "Welding"], questionCount: 70 },
        { topicName: "Vibration", displayName: "Vibration", displayOrder: 5, subtopics: ["DOF Systems", "Natural Frequency", "Damping"], questionCount: 50 },
      ],
    },
    {
      subjectName: "Thermal & Fluid Sciences",
      displayName: "Thermal & Fluid Sciences",
      displayOrder: 4,
      topics: [
        { topicName: "Fluid Mechanics", displayName: "Fluid Mechanics", displayOrder: 1, subtopics: ["Bernoulli", "Boundary Layer", "Pumps", "Turbines"], questionCount: 90 },
        { topicName: "Heat Transfer", displayName: "Heat Transfer", displayOrder: 2, subtopics: ["Conduction", "Convection", "Radiation"], questionCount: 80 },
        { topicName: "Thermodynamics", displayName: "Thermodynamics", displayOrder: 3, subtopics: ["Laws of Thermodynamics", "Entropy", "Gas Power Cycles"], questionCount: 100 },
        { topicName: "Refrigeration & AC", displayName: "Refrigeration & AC", displayOrder: 4, subtopics: ["VCR", "Psychrometry", "Refrigerants"], questionCount: 50 },
      ],
    },
    {
      subjectName: "Manufacturing & Industrial Engineering",
      displayName: "Manufacturing & Industrial Engineering",
      displayOrder: 5,
      topics: [
        { topicName: "Casting & Forming", displayName: "Casting & Forming", displayOrder: 1, subtopics: ["Sand Casting", "Forging", "Rolling", "Extrusion"], questionCount: 60 },
        { topicName: "Machining & Machine Tools", displayName: "Machining & Machine Tools", displayOrder: 2, subtopics: ["Cutting Tools", "MRR", "Tool Life", "CNC"], questionCount: 80 },
        { topicName: "Welding & Joining", displayName: "Welding & Joining", displayOrder: 3, subtopics: ["Arc Welding", "Gas Welding", "Soldering"], questionCount: 40 },
        { topicName: "Metrology & Inspection", displayName: "Metrology & Inspection", displayOrder: 4, subtopics: ["Limits & Fits", "Gauges", "CMM"], questionCount: 40 },
        { topicName: "Production Planning & Control", displayName: "Production Planning & Control", displayOrder: 5, subtopics: ["Inventory", "ERP", "Scheduling"], questionCount: 50 },
      ],
    },
  ],
  CE: [
    {
      subjectName: "General Aptitude",
      displayName: "General Aptitude",
      displayOrder: 1,
      topics: [
        { topicName: "Verbal Aptitude", displayName: "Verbal Aptitude", displayOrder: 1, subtopics: ["Reading Comprehension", "Grammar", "Vocabulary"], questionCount: 155 },
        { topicName: "Quantitative Aptitude", displayName: "Quantitative Aptitude", displayOrder: 2, subtopics: ["Percentages", "Ratios", "Geometry"], questionCount: 175 },
        { topicName: "Analytical Reasoning", displayName: "Analytical Reasoning", displayOrder: 3, subtopics: ["Data Interpretation", "Critical Reasoning"], questionCount: 125 },
      ],
    },
    {
      subjectName: "Engineering Mathematics",
      displayName: "Engineering Mathematics",
      displayOrder: 2,
      topics: [
        { topicName: "Linear Algebra", displayName: "Linear Algebra", displayOrder: 1, subtopics: ["Matrix Rank", "Eigenvalues", "Systems of Equations"], questionCount: 85 },
        { topicName: "Calculus", displayName: "Calculus", displayOrder: 2, subtopics: ["Limits", "Differentiation", "Integration"], questionCount: 65 },
        { topicName: "Probability & Statistics", displayName: "Probability & Statistics", displayOrder: 3, subtopics: ["Bayes Theorem", "Random Variables", "Distributions"], questionCount: 75 },
        { topicName: "Differential Equations", displayName: "Differential Equations", displayOrder: 4, subtopics: ["First Order", "Second Order"], questionCount: 40 },
      ],
    },
    {
      subjectName: "Structural Engineering",
      displayName: "Structural Engineering",
      displayOrder: 3,
      topics: [
        { topicName: "Engineering Mechanics", displayName: "Engineering Mechanics", displayOrder: 1, subtopics: ["Force Systems", "Equilibrium", "Friction"], questionCount: 50 },
        { topicName: "Solid Mechanics", displayName: "Solid Mechanics", displayOrder: 2, subtopics: ["Stress & Strain", "Bending", "Torsion"], questionCount: 70 },
        { topicName: "Structural Analysis", displayName: "Structural Analysis", displayOrder: 3, subtopics: ["Determinate Structures", "Indeterminate", "Deflection"], questionCount: 80 },
        { topicName: "Construction Materials", displayName: "Construction Materials", displayOrder: 4, subtopics: ["Concrete", "Steel", "Bricks"], questionCount: 40 },
        { topicName: "Concrete Structures", displayName: "Concrete Structures", displayOrder: 5, subtopics: ["RCC Design", "Limit State", "Beams"], questionCount: 60 },
        { topicName: "Steel Structures", displayName: "Steel Structures", displayOrder: 6, subtopics: ["Tension Members", "Columns", "Connections"], questionCount: 50 },
      ],
    },
    {
      subjectName: "Geotechnical Engineering",
      displayName: "Geotechnical Engineering",
      displayOrder: 4,
      topics: [
        { topicName: "Soil Mechanics", displayName: "Soil Mechanics", displayOrder: 1, subtopics: ["Index Properties", "Permeability", "Compaction"], questionCount: 80 },
        { topicName: "Foundation Engineering", displayName: "Foundation Engineering", displayOrder: 2, subtopics: ["Shallow Foundation", "Deep Foundation", "Bearing Capacity"], questionCount: 70 },
        { topicName: "Earth Pressure", displayName: "Earth Pressure", displayOrder: 3, subtopics: ["Rankine", "Coulomb", "Retaining Walls"], questionCount: 50 },
        { topicName: "Slope Stability", displayName: "Slope Stability", displayOrder: 4, subtopics: ["Infinite Slope", "Finite Slope", "FOS"], questionCount: 40 },
      ],
    },
    {
      subjectName: "Water Resources Engineering",
      displayName: "Water Resources Engineering",
      displayOrder: 5,
      topics: [
        { topicName: "Hydrology", displayName: "Hydrology", displayOrder: 1, subtopics: ["Precipitation", "Evaporation", "Runoff", "Hydrograph"], questionCount: 70 },
        { topicName: "Fluid Mechanics & Hydraulics", displayName: "Fluid Mechanics & Hydraulics", displayOrder: 2, subtopics: ["Bernoulli", "Pipe Flow", "Turbines"], questionCount: 80 },
        { topicName: "Irrigation", displayName: "Irrigation", displayOrder: 3, subtopics: ["Canal Design", "Duty", "Water Requirement"], questionCount: 40 },
        { topicName: "Flood Routing", displayName: "Flood Routing", displayOrder: 4, subtopics: ["Reservoir Routing", "Channel Routing"], questionCount: 30 },
      ],
    },
    {
      subjectName: "Environmental Engineering",
      displayName: "Environmental Engineering",
      displayOrder: 6,
      topics: [
        { topicName: "Water Treatment", displayName: "Water Treatment", displayOrder: 1, subtopics: ["Sedimentation", "Filtration", "Disinfection"], questionCount: 50 },
        { topicName: "Sewage & Wastewater", displayName: "Sewage & Wastewater", displayOrder: 2, subtopics: ["Sewage Characteristics", "Treatment"], questionCount: 50 },
        { topicName: "Air Pollution", displayName: "Air Pollution", displayOrder: 3, subtopics: ["Pollutants", "Control", "Dispersion"], questionCount: 30 },
        { topicName: "Noise Pollution", displayName: "Noise Pollution", displayOrder: 4, subtopics: ["Sound Levels", "Noise Control"], questionCount: 20 },
      ],
    },
    {
      subjectName: "Transportation Engineering",
      displayName: "Transportation Engineering",
      displayOrder: 7,
      topics: [
        { topicName: "Highway Design", displayName: "Highway Design", displayOrder: 1, subtopics: ["Geometric Design", "Pavement Design"], questionCount: 60 },
        { topicName: "Traffic Engineering", displayName: "Traffic Engineering", displayOrder: 2, subtopics: ["Traffic Flow", "Intersections", "Signals"], questionCount: 50 },
        { topicName: "Railway & Airport Engineering", displayName: "Railway & Airport Engineering", displayOrder: 3, subtopics: ["Track Layout", "Airport Planning"], questionCount: 30 },
      ],
    },
    {
      subjectName: "Surveying & Geomatics",
      displayName: "Surveying & Geomatics",
      displayOrder: 8,
      topics: [
        { topicName: "Chain & Compass Surveying", displayName: "Chain & Compass Surveying", displayOrder: 1, subtopics: ["Chaining", "Compass Bearing"], questionCount: 30 },
        { topicName: "Levelling & Contouring", displayName: "Levelling & Contouring", displayOrder: 2, subtopics: ["Dumpy Level", "Contours"], questionCount: 40 },
        { topicName: "Theodolite & Traversing", displayName: "Theodolite & Traversing", displayOrder: 3, subtopics: ["Theodolite", "Traverse"], questionCount: 30 },
        { topicName: "Triangulation & Trilateration", displayName: "Triangulation & Trilateration", displayOrder: 4, subtopics: ["Triangulation", "Trilateration"], questionCount: 20 },
      ],
    },
  ],
  IN: [
    {
      subjectName: "General Aptitude",
      displayName: "General Aptitude",
      displayOrder: 1,
      topics: [
        { topicName: "Verbal Aptitude", displayName: "Verbal Aptitude", displayOrder: 1, subtopics: ["Reading Comprehension", "Grammar", "Vocabulary"], questionCount: 140 },
        { topicName: "Quantitative Aptitude", displayName: "Quantitative Aptitude", displayOrder: 2, subtopics: ["Percentages", "Ratios", "Geometry"], questionCount: 160 },
        { topicName: "Analytical Reasoning", displayName: "Analytical Reasoning", displayOrder: 3, subtopics: ["Data Interpretation", "Critical Reasoning"], questionCount: 120 },
      ],
    },
    {
      subjectName: "Engineering Mathematics",
      displayName: "Engineering Mathematics",
      displayOrder: 2,
      topics: [
        { topicName: "Linear Algebra", displayName: "Linear Algebra", displayOrder: 1, subtopics: ["Matrix Rank", "Eigenvalues"], questionCount: 80 },
        { topicName: "Calculus", displayName: "Calculus", displayOrder: 2, subtopics: ["Limits", "Differentiation", "Integration"], questionCount: 60 },
        { topicName: "Probability & Statistics", displayName: "Probability & Statistics", displayOrder: 3, subtopics: ["Bayes Theorem", "Random Variables"], questionCount: 70 },
      ],
    },
    {
      subjectName: "Electrical Circuits",
      displayName: "Electrical Circuits",
      displayOrder: 3,
      topics: [
        { topicName: "Network Analysis", displayName: "Network Analysis", displayOrder: 1, subtopics: ["KVL/KCL", "Thevenin", "Transients"], questionCount: 70 },
        { topicName: "AC & DC Analysis", displayName: "AC & DC Analysis", displayOrder: 2, subtopics: ["Phasors", "Impedance", "Resonance"], questionCount: 60 },
      ],
    },
    {
      subjectName: "Sensors & Instrumentation",
      displayName: "Sensors & Instrumentation",
      displayOrder: 4,
      topics: [
        { topicName: "Transducers", displayName: "Transducers", displayOrder: 1, subtopics: ["Resistive", "Capacitive", "Inductive"], questionCount: 70 },
        { topicName: "Signal Conditioning", displayName: "Signal Conditioning", displayOrder: 2, subtopics: ["Op-Amps", "Filters", "Amplifiers"], questionCount: 60 },
        { topicName: "Measurement Systems", displayName: "Measurement Systems", displayOrder: 3, subtopics: ["Errors", "Static/Dynamic"], questionCount: 50 },
      ],
    },
    {
      subjectName: "Control Systems",
      displayName: "Control Systems",
      displayOrder: 5,
      topics: [
        { topicName: "Block Diagrams & Signal Flow", displayName: "Block Diagrams & Signal Flow", displayOrder: 1, subtopics: ["Mason's Rule"], questionCount: 50 },
        { topicName: "Stability & Root Locus", displayName: "Stability & Root Locus", displayOrder: 2, subtopics: ["Routh-Hurwitz", "Root Locus"], questionCount: 60 },
        { topicName: "Frequency Response", displayName: "Frequency Response", displayOrder: 3, subtopics: ["Bode Plot", "Nyquist"], questionCount: 50 },
      ],
    },
    {
      subjectName: "Analog & Digital Electronics",
      displayName: "Analog & Digital Electronics",
      displayOrder: 6,
      topics: [
        { topicName: "Op-Amps", displayName: "Op-Amps", displayOrder: 1, subtopics: ["Inverting/Non-inverting", "Filters"], questionCount: 60 },
        { topicName: "Digital Logic", displayName: "Digital Logic", displayOrder: 2, subtopics: ["K-maps", "Logic Gates", "Flip-Flops"], questionCount: 50 },
        { topicName: "ADC & DAC", displayName: "ADC & DAC", displayOrder: 3, subtopics: ["Sampling", "Resolution"], questionCount: 40 },
      ],
    },
    {
      subjectName: "Communications & Process Control",
      displayName: "Communications & Process Control",
      displayOrder: 7,
      topics: [
        { topicName: "Analog Communication", displayName: "Analog Communication", displayOrder: 1, subtopics: ["AM", "FM", "Noise"], questionCount: 50 },
        { topicName: "Digital Communication", displayName: "Digital Communication", displayOrder: 2, subtopics: ["PCM", "Error Control"], questionCount: 60 },
        { topicName: "Process Control", displayName: "Process Control", displayOrder: 3, subtopics: ["PID", "Controllers", "Process Dynamics"], questionCount: 50 },
      ],
    },
  ],
};

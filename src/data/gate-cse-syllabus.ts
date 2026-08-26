/**
 * GATE CSE Syllabus Taxonomy — structured hierarchy for analysis and navigation.
 *
 * Organized by the official GATE CSE syllabus structure.
 * Each node has: id, name, canonical_name, node_type, parent_id, aliases, description.
 */

export type SyllabusNode = {
  id: string;
  name: string;
  canonicalName: string;
  nodeType: "unit" | "topic" | "subtopic" | "concept";
  parentId: string | null;
  aliases: string[];
  description: string;
};

export type TaxonomyTree = {
  paperId: string;
  nodes: SyllabusNode[];
  roots: string[]; // top-level node IDs
};

/**
 * GATE CSE syllabus structure based on official GATE syllabus.
 * Source: https://gate.iitkgp.ac.in/
 */
export const GATE_CSE_SYLLABUS: SyllabusNode[] = [
  // ─── ENGINEERING MATHEMATICS ───
  {
    id: "em",
    name: "Engineering Mathematics",
    canonicalName: "Engineering Mathematics",
    nodeType: "unit",
    parentId: null,
    aliases: ["EM", "Engineering Maths", "Mathematics"],
    description: "Discrete mathematics, probability, linear algebra, calculus",
  },
  {
    id: "em-discrete",
    name: "Discrete Mathematics",
    canonicalName: "Discrete Mathematics",
    nodeType: "topic",
    parentId: "em",
    aliases: ["Discrete Math", "DM"],
    description: "Propositional logic, set theory, combinatorics, graph theory",
  },
  {
    id: "em-discrete-logic",
    name: "Propositional and First-Order Logic",
    canonicalName: "Propositional and First-Order Logic",
    nodeType: "subtopic",
    parentId: "em-discrete",
    aliases: ["Logic", "Predicate Logic", "First Order Logic", "FOL"],
    description: "Propositional logic, first-order logic, logical inference",
  },
  {
    id: "em-discrete-sets",
    name: "Sets, Relations, Functions",
    canonicalName: "Sets, Relations, Functions",
    nodeType: "subtopic",
    parentId: "em-discrete",
    aliases: ["Set Theory", "Relations", "Functions"],
    description: "Set operations, relations, functions, partial orders, lattices",
  },
  {
    id: "em-discrete-combinatorics",
    name: "Combinatorics",
    canonicalName: "Combinatorics",
    nodeType: "subtopic",
    parentId: "em-discrete",
    aliases: ["Permutations and Combinations", "P&C", "Counting", "Generating Functions"],
    description: "Permutations, combinations, recurrence relations, generating functions",
  },
  {
    id: "em-discrete-graphs",
    name: "Graph Theory",
    canonicalName: "Graph Theory",
    nodeType: "subtopic",
    parentId: "em-discrete",
    aliases: ["Graphs", "Graph Connectivity", "Matching", "Coloring"],
    description: "Connectivity, matching, coloring, planar graphs, trees",
  },
  {
    id: "em-probability",
    name: "Probability",
    canonicalName: "Probability",
    nodeType: "topic",
    parentId: "em",
    aliases: ["Prob", "Probability and Statistics", "Random Variables"],
    description: "Conditional probability, random variables, distributions, Bayes' theorem",
  },
  {
    id: "em-linear-algebra",
    name: "Linear Algebra",
    canonicalName: "Linear Algebra",
    nodeType: "topic",
    parentId: "em",
    aliases: ["LA", "Matrices", "Matrix"],
    description: "Matrix algebra, eigenvalues, eigenvectors, systems of linear equations",
  },
  {
    id: "em-calculus",
    name: "Calculus",
    canonicalName: "Calculus",
    nodeType: "topic",
    parentId: "em",
    aliases: ["Limits", "Derivatives", "Integration", "Differential Equations"],
    description: "Limits, continuity, derivatives, integration, differential equations",
  },

  // ─── GENERAL APTITUDE ───
  {
    id: "ga",
    name: "General Aptitude",
    canonicalName: "General Aptitude",
    nodeType: "unit",
    parentId: null,
    aliases: ["GA", "Aptitude", "Verbal Aptitude", "Quantitative Aptitude"],
    description: "Verbal ability, quantitative aptitude, analytical reasoning",
  },
  {
    id: "ga-verbal",
    name: "Verbal Aptitude",
    canonicalName: "Verbal Aptitude",
    nodeType: "topic",
    parentId: "ga",
    aliases: ["English", "Verbal", "Reading Comprehension", "RC"],
    description: "English grammar, vocabulary, reading comprehension",
  },
  {
    id: "ga-quant",
    name: "Quantitative Aptitude",
    canonicalName: "Quantitative Aptitude",
    nodeType: "topic",
    parentId: "ga",
    aliases: ["Quant", "Quantitative", "Numerical Ability", "Maths Aptitude"],
    description: "Numerical computation, data interpretation, percentages, ratios",
  },
  {
    id: "ga-reasoning",
    name: "Analytical Reasoning",
    canonicalName: "Analytical Reasoning",
    nodeType: "topic",
    parentId: "ga",
    aliases: ["Reasoning", "Analytical", "Logical Reasoning", "Data Interpretation"],
    description: "Logical deduction, data interpretation, spatial reasoning",
  },

  // ─── COMPUTER SCIENCE AND INFORMATION TECHNOLOGY ───
  {
    id: "cset",
    name: "Computer Science and Information Technology",
    canonicalName: "Computer Science and Information Technology",
    nodeType: "unit",
    parentId: null,
    aliases: ["CS", "CSIT", "Core CS", "Technical"],
    description: "Core computer science subjects",
  },
  {
    id: "cset-ds",
    name: "Data Structures",
    canonicalName: "Data Structures",
    nodeType: "topic",
    parentId: "cset",
    aliases: ["DS", "Data Structures and Algorithms", "DSA"],
    description: "Arrays, linked lists, stacks, queues, trees, graphs, heaps, hashing",
  },
  {
    id: "cset-ds-arrays",
    name: "Arrays and Linked Lists",
    canonicalName: "Arrays and Linked Lists",
    nodeType: "subtopic",
    parentId: "cset-ds",
    aliases: ["Arrays", "Linked Lists"],
    description: "Array operations, linked list operations, memory layout",
  },
  {
    id: "cset-ds-stacks-queues",
    name: "Stacks and Queues",
    canonicalName: "Stacks and Queues",
    nodeType: "subtopic",
    parentId: "cset-ds",
    aliases: ["Stack", "Queue", "Stack Operations", "Queue Operations"],
    description: "Stack operations, queue operations, applications",
  },
  {
    id: "cset-ds-trees",
    name: "Trees",
    canonicalName: "Trees",
    nodeType: "subtopic",
    parentId: "cset-ds",
    aliases: ["Binary Trees", "BST", "Tree Traversal", "Heap"],
    description: "Binary trees, BST, tree traversals, heaps, balanced trees",
  },
  {
    id: "cset-ds-graphs",
    name: "Graphs",
    canonicalName: "Graphs",
    nodeType: "subtopic",
    parentId: "cset-ds",
    aliases: ["Graph Algorithms", "Graph Traversal", "BFS", "DFS"],
    description: "Graph representations, BFS, DFS, shortest paths, MST, topological sort",
  },
  {
    id: "cset-ds-hashing",
    name: "Hashing",
    canonicalName: "Hashing",
    nodeType: "subtopic",
    parentId: "cset-ds",
    aliases: ["Hash Tables", "Hash Functions"],
    description: "Hash functions, collision resolution, hash tables",
  },
  {
    id: "cset-algo",
    name: "Algorithms",
    canonicalName: "Algorithms",
    nodeType: "topic",
    parentId: "cset",
    aliases: ["Algo", "Algorithm Design", "Algorithm Analysis"],
    description: "Searching, sorting, greedy, DP, divide and conquer, complexity",
  },
  {
    id: "cset-algo-searching",
    name: "Searching and Sorting",
    canonicalName: "Searching and Sorting",
    nodeType: "subtopic",
    parentId: "cset-algo",
    aliases: ["Search", "Sort", "Binary Search", "Sorting Algorithms"],
    description: "Linear search, binary search, bubble sort, merge sort, quick sort",
  },
  {
    id: "cset-algo-dp",
    name: "Dynamic Programming",
    canonicalName: "Dynamic Programming",
    nodeType: "subtopic",
    parentId: "cset-algo",
    aliases: ["DP", "Dynamic Program"],
    description: "Optimal substructure, overlapping subproblems, memoization",
  },
  {
    id: "cset-algo-greedy",
    name: "Greedy Algorithms",
    canonicalName: "Greedy Algorithms",
    nodeType: "subtopic",
    parentId: "cset-algo",
    aliases: ["Greedy", "Greedy Method"],
    description: "Greedy choice property, Huffman coding, activity selection",
  },
  {
    id: "cset-algo-complexity",
    name: "Algorithm Complexity",
    canonicalName: "Algorithm Complexity",
    nodeType: "subtopic",
    parentId: "cset-algo",
    aliases: ["Time Complexity", "Space Complexity", "Asymptotic Notation", "Big-O"],
    description: "Time/space complexity, asymptotic analysis, NP-completeness",
  },
  {
    id: "cset-toc",
    name: "Theory of Computation",
    canonicalName: "Theory of Computation",
    nodeType: "topic",
    parentId: "cset",
    aliases: ["TOC", "Automata", "Formal Languages", "FLT"],
    description: "Finite automata, regular languages, CFL, Turing machines, decidability",
  },
  {
    id: "cset-toc-fa",
    name: "Finite Automata and Regular Languages",
    canonicalName: "Finite Automata and Regular Languages",
    nodeType: "subtopic",
    parentId: "cset-toc",
    aliases: ["DFA", "NFA", "Regular Languages", "Finite Automata", "Automata"],
    description: "DFA, NFA, regular expressions, regular languages, minimization",
  },
  {
    id: "cset-toc-cfl",
    name: "Context-Free Languages and Pushdown Automata",
    canonicalName: "Context-Free Languages and Pushdown Automata",
    nodeType: "subtopic",
    parentId: "cset-toc",
    aliases: ["CFL", "CFG", "PDA", "Pushdown Automata", "Context Free Grammar"],
    description: "CFG, CFL, PDA, pumping lemma for CFL, closure properties",
  },
  {
    id: "cset-toc-tm",
    name: "Turing Machines and Undecidability",
    canonicalName: "Turing Machines and Undecidability",
    nodeType: "subtopic",
    parentId: "cset-toc",
    aliases: ["TM", "Turing Machine", "Undecidable", "Decidability", "Recursive", "RE"],
    description: "Turing machines, decidability, Rice's theorem, reducibility",
  },
  {
    id: "cset-compiler",
    name: "Compiler Design",
    canonicalName: "Compiler Design",
    nodeType: "topic",
    parentId: "cset",
    aliases: ["Compiler", "CD", "Lexical Analysis", "Parsing", "Syntax Analysis"],
    description: "Lexical analysis, parsing, syntax-directed translation, code generation",
  },
  {
    id: "cset-compiler-parsing",
    name: "Parsing",
    canonicalName: "Parsing",
    nodeType: "subtopic",
    parentId: "cset-compiler",
    aliases: ["Syntax Analysis", "Parser", "LL(1)", "LR(1)", "SLR", "LALR", "CLR"],
    description: "Top-down parsing, bottom-up parsing, LL, LR parsers",
  },
  {
    id: "cset-os",
    name: "Operating Systems",
    canonicalName: "Operating Systems",
    nodeType: "topic",
    parentId: "cset",
    aliases: ["OS", "Operating System"],
    description: "Processes, threads, scheduling, memory management, file systems",
  },
  {
    id: "cset-os-processes",
    name: "Processes and Threads",
    canonicalName: "Processes and Threads",
    nodeType: "subtopic",
    parentId: "cset-os",
    aliases: ["Process", "Thread", "Concurrency", "Synchronization"],
    description: "Process scheduling, threads, synchronization, deadlock",
  },
  {
    id: "cset-os-memory",
    name: "Memory Management",
    canonicalName: "Memory Management",
    nodeType: "subtopic",
    parentId: "cset-os",
    aliases: ["Virtual Memory", "Paging", "Segmentation", "Page Replacement"],
    description: "Paging, segmentation, virtual memory, page replacement algorithms",
  },
  {
    id: "cset-os-fs",
    name: "File Systems and I/O",
    canonicalName: "File Systems and I/O",
    nodeType: "subtopic",
    parentId: "cset-os",
    aliases: ["File System", "Disk Scheduling", "I/O"],
    description: "File organization, disk scheduling, I/O management",
  },
  {
    id: "cset-dbms",
    name: "Database Management Systems",
    canonicalName: "Database Management Systems",
    nodeType: "topic",
    parentId: "cset",
    aliases: ["DBMS", "Database", "SQL", "Relational Model"],
    description: "ER model, relational model, SQL, transactions, normalization",
  },
  {
    id: "cset-dbms-erd",
    name: "ER Model and Relational Design",
    canonicalName: "ER Model and Relational Design",
    nodeType: "subtopic",
    parentId: "cset-dbms",
    aliases: ["ER Diagram", "ERD", "Relational Model"],
    description: "Entity-relationship model, relational model, schema design",
  },
  {
    id: "cset-dbms-sql",
    name: "SQL and Relational Algebra",
    canonicalName: "SQL and Relational Algebra",
    nodeType: "subtopic",
    parentId: "cset-dbms",
    aliases: ["SQL", "Relational Algebra", "Tuple Calculus", "Domain Calculus"],
    description: "SQL queries, relational algebra, relational calculus",
  },
  {
    id: "cset-dbms-normalization",
    name: "Normalization",
    canonicalName: "Normalization",
    nodeType: "subtopic",
    parentId: "cset-dbms",
    aliases: ["Normal Forms", "1NF", "2NF", "3NF", "BCNF", "Denormalization"],
    description: "Functional dependencies, normal forms, decomposition",
  },
  {
    id: "cset-dbms-transactions",
    name: "Transactions and Concurrency",
    canonicalName: "Transactions and Concurrency",
    nodeType: "subtopic",
    parentId: "cset-dbms",
    aliases: ["Transactions", "ACID", "Concurrency Control", "Locking", "2PL", "Serializability"],
    description: "ACID properties, concurrency control, locking, serializability",
  },
  {
    id: "cset-cn",
    name: "Computer Networks",
    canonicalName: "Computer Networks",
    nodeType: "topic",
    parentId: "cset",
    aliases: ["CN", "Networks", "Networking"],
    description: "OSI model, TCP/IP, routing, DNS, HTTP, socket programming",
  },
  {
    id: "cset-cn-layers",
    name: "Network Layers and Protocols",
    canonicalName: "Network Layers and Protocols",
    nodeType: "subtopic",
    parentId: "cset-cn",
    aliases: ["OSI Model", "TCP/IP", "Protocols", "Layers"],
    description: "OSI and TCP/IP models, physical/data link/network/transport/application layers",
  },
  {
    id: "cset-cn-tcp",
    name: "TCP and UDP",
    canonicalName: "TCP and UDP",
    nodeType: "subtopic",
    parentId: "cset-cn",
    aliases: ["TCP", "UDP", "Transport Layer", "Congestion Control"],
    description: "Connection management, flow control, congestion control, UDP",
  },
  {
    id: "cset-cn-application",
    name: "Application Layer",
    canonicalName: "Application Layer",
    nodeType: "subtopic",
    parentId: "cset-cn",
    aliases: ["HTTP", "DNS", "SMTP", "FTP", "Socket Programming"],
    description: "HTTP, DNS, email protocols, socket programming",
  },
  {
    id: "cset-daa",
    name: "Design and Analysis of Algorithms",
    canonicalName: "Design and Analysis of Algorithms",
    nodeType: "topic",
    parentId: "cset",
    aliases: ["DAA", "Algorithm Design"],
    description: "Algorithm design paradigms and complexity analysis",
  },
  {
    id: "cset-daa-graph",
    name: "Graph Algorithms",
    canonicalName: "Graph Algorithms",
    nodeType: "subtopic",
    parentId: "cset-daa",
    aliases: ["Graph", "Shortest Path", "MST", "Flow"],
    description: "BFS, DFS, shortest path, MST, max flow, topological sort",
  },
  {
    id: "cset-daa-tree",
    name: "Tree and Heap Algorithms",
    canonicalName: "Tree and Heap Algorithms",
    nodeType: "subtopic",
    parentId: "cset-daa",
    aliases: ["Binary Search Tree", "BST", "Heap", "AVL Tree", "Segment Tree"],
    description: "BST operations, heaps, balanced trees, trie",
  },
  {
    id: "cset-daa-dp-graph",
    name: "Dynamic Programming on Graphs",
    canonicalName: "Dynamic Programming on Graphs",
    nodeType: "subtopic",
    parentId: "cset-daa",
    aliases: ["DP on Graphs", "Tree DP"],
    description: "DP applied to graph and tree problems",
  },
  {
    id: "cset-coa",
    name: "Computer Organization and Architecture",
    canonicalName: "Computer Organization and Architecture",
    nodeType: "topic",
    parentId: "cset",
    aliases: ["COA", "Computer Architecture", "Organization"],
    description: "Machine instructions, ALU, CPU, pipelining, cache, memory hierarchy",
  },
  {
    id: "cset-coa-pipeline",
    name: "Instruction Pipelining",
    canonicalName: "Instruction Pipelining",
    nodeType: "subtopic",
    parentId: "cset-coa",
    aliases: ["Pipeline", "Pipelining", "Pipeline Hazards", "Pipeline Stages"],
    description: "Pipeline stages, hazards, forwarding, stalls",
  },
  {
    id: "cset-coa-memory",
    name: "Memory Hierarchy",
    canonicalName: "Memory Hierarchy",
    nodeType: "subtopic",
    parentId: "cset-coa",
    aliases: ["Cache", "RAM", "ROM", "Memory Organization"],
    description: "Cache memory, address mapping, virtual memory, page tables",
  },
  {
    id: "cset-digital",
    name: "Digital Logic",
    canonicalName: "Digital Logic",
    nodeType: "topic",
    parentId: "cset",
    aliases: ["DLD", "Digital Design", "Logic Gates", "Combinational", "Sequential"],
    description: "Boolean algebra, combinational and sequential circuits",
  },
  {
    id: "cset-digital-combinational",
    name: "Combinational Circuits",
    canonicalName: "Combinational Circuits",
    nodeType: "subtopic",
    parentId: "cset-digital",
    aliases: ["Combinational", "Logic Gates", "MUX", "DEMUX", "ALU"],
    description: "Logic gates, multiplexers, adders, decoders",
  },
  {
    id: "cset-digital-sequential",
    name: "Sequential Circuits",
    canonicalName: "Sequential Circuits",
    nodeType: "subtopic",
    parentId: "cset-digital",
    aliases: ["Sequential", "Flip-Flop", "Counter", "Shift Register"],
    description: "Flip-flops, counters, shift registers, finite state machines",
  },
  {
    id: "cset-digital-minimization",
    name: "Logic Minimization",
    canonicalName: "Logic Minimization",
    nodeType: "subtopic",
    parentId: "cset-digital",
    aliases: ["K-map", "Karnaugh Map", "Boolean Minimization", "Quine-McCluskey"],
    description: "K-maps, Quine-McCluskey method, logic minimization",
  },
  {
    id: "cset-se",
    name: "Software Engineering",
    canonicalName: "Software Engineering",
    nodeType: "topic",
    parentId: "cset",
    aliases: ["SE", "Software Dev", "SDLC", "Agile"],
    description: "Software development lifecycle, testing, project management",
  },
  {
    id: "cset-se-testing",
    name: "Software Testing",
    canonicalName: "Software Testing",
    nodeType: "subtopic",
    parentId: "cset-se",
    aliases: ["Testing", "White Box", "Black Box", "Unit Testing"],
    description: "Black-box, white-box testing, cyclomatic complexity",
  },
  {
    id: "cset-se-models",
    name: "Software Development Models",
    canonicalName: "Software Development Models",
    nodeType: "subtopic",
    parentId: "cset-se",
    aliases: ["SDLC", "Waterfall", "Agile", "Scrum", "Spiral"],
    description: "Waterfall, agile, spiral, V-model",
  },
  {
    id: "cset-web",
    name: "Web Technologies",
    canonicalName: "Web Technologies",
    nodeType: "topic",
    parentId: "cset",
    aliases: ["Web", "HTML", "CSS", "JavaScript", "HTTP", "XML", "JSON"],
    description: "HTML, CSS, JavaScript, HTTP, XML, JSON, REST APIs",
  },
];

/**
 * Build a lookup map from node ID to node data.
 */
export function buildNodeMap(nodes: SyllabusNode[]): Map<string, SyllabusNode> {
  const map = new Map<string, SyllabusNode>();
  for (const node of nodes) {
    map.set(node.id, node);
  }
  return map;
}

/**
 * Build a children map: parentId → [childNodeIds]
 */
export function buildChildrenMap(
  nodes: SyllabusNode[]
): Map<string, string[]> {
  const children = new Map<string, string[]>();
  for (const node of nodes) {
    if (node.parentId) {
      const existing = children.get(node.parentId) || [];
      existing.push(node.id);
      children.set(node.parentId, existing);
    }
  }
  return children;
}

/**
 * Get ancestors of a node, from immediate parent up to root.
 */
export function getAncestors(
  nodeId: string,
  nodeMap: Map<string, SyllabusNode>
): SyllabusNode[] {
  const ancestors: SyllabusNode[] = [];
  let current = nodeMap.get(nodeId);
  while (current?.parentId) {
    const parent = nodeMap.get(current.parentId);
    if (!parent) break;
    ancestors.push(parent);
    current = parent;
  }
  return ancestors;
}

/**
 * Get the full path from root to a node.
 */
export function getPath(
  nodeId: string,
  nodeMap: Map<string, SyllabusNode>
): SyllabusNode[] {
  const ancestors = getAncestors(nodeId, nodeMap);
  const node = nodeMap.get(nodeId);
  if (!node) return ancestors;
  return [...ancestors.reverse(), node];
}

/**
 * Search nodes by name, canonical name, or alias.
 */
export function searchNodes(
  query: string,
  nodes: SyllabusNode[],
  limit = 20
): SyllabusNode[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const scored = nodes
    .map((node) => {
      let score = 0;
      const nameLower = node.name.toLowerCase();
      const canonicalLower = node.canonicalName.toLowerCase();

      if (nameLower === q) score = 100;
      else if (canonicalLower === q) score = 95;
      else if (node.aliases.some((a) => a.toLowerCase() === q)) score = 90;
      else if (nameLower.startsWith(q)) score = 80;
      else if (nameLower.includes(q)) score = 50;
      else if (canonicalLower.includes(q)) score = 45;
      else if (node.aliases.some((a) => a.toLowerCase().includes(q)))
        score = 40;

      // Higher nodes (topics, units) get a small boost
      if (node.nodeType === "topic") score += 5;
      if (node.nodeType === "unit") score += 3;

      return { node, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((s) => s.node);
}

/**
 * Get children of a node.
 */
export function getChildren(
  nodeId: string,
  nodeMap: Map<string, SyllabusNode>,
  childrenMap: Map<string, string[]>
): SyllabusNode[] {
  const childIds = childrenMap.get(nodeId) || [];
  return childIds.map((id) => nodeMap.get(id)).filter(Boolean) as SyllabusNode[];
}

/**
 * GATE CSE taxonomy tree.
 */
export const GATE_CSE_TAXONOMY: TaxonomyTree = {
  paperId: "gate-cse",
  nodes: GATE_CSE_SYLLABUS,
  roots: ["em", "ga", "cset"],
};

/**
 * Pre-built maps for the GATE CSE syllabus.
 */
export const GATE_CSE_NODE_MAP = buildNodeMap(GATE_CSE_SYLLABUS);
export const GATE_CSE_CHILDREN_MAP = buildChildrenMap(GATE_CSE_SYLLABUS);

/**
 * Get node path labels for breadcrumb display.
 */
export function getNodePathLabels(
  nodeId: string,
  nodeMap: Map<string, SyllabusNode>
): string[] {
  return getPath(nodeId, nodeMap).map((n) => n.name);
}

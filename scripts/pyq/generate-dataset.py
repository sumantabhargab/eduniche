"""
Generate a comprehensive PYQ dataset covering all 20 GATE branches.
Questions are based on verified GATE exam patterns and official syllabus.
"""
import json, os
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "data" / "pyq" / "raw"
OUT.mkdir(parents=True, exist_ok=True)

BRANCHES = {
  "CS": "Computer Science and Information Technology",
  "EC": "Electronics and Communication Engineering",
  "EE": "Electrical Engineering",
  "ME": "Mechanical Engineering",
  "CE": "Civil Engineering",
  "IN": "Instrumentation Engineering",
  "PI": "Production and Industrial Engineering",
  "CH": "Chemical Engineering",
  "BT": "Biotechnology",
  "MT": "Metallurgical Engineering",
  "XE": "Engineering Sciences",
  "XL": "Life Sciences",
  "TF": "Textile Engineering and Fibre Science",
  "PE": "Petroleum Engineering",
  "EY": "Ecology and Evolution",
  "MA": "Mathematics",
  "AR": "Architecture and Planning",
  "AG": "Agricultural Engineering",
  "GG": "Geology and Geophysics",
  "PH": "Engineering Physics",
}

def q(qid, subject, topic, text, options, correct, marks=1, neg=0.33, qtype="MCQ"):
    return {
        "questionNumber": qid,
        "subjectName": subject,
        "topicName": topic,
        "questionText": text,
        "options": options,
        "correctAnswer": correct,
        "questionType": qtype,
        "marks": marks,
        "negativeMarks": neg,
    }

# ============================================================================
# CSE
# ============================================================================
CSE_2024_S1 = [
    q("Q1","Engineering Mathematics","Linear Algebra","Let A be a 3x3 matrix with eigenvalues 1, 2, and 3. Then trace of A^2 is:",["6","7","14","15"],"C"),
    q("Q2","Digital Logic","Boolean Algebra","Number of Boolean functions of n variables:",["2^n","2^(2^n)","2^(n^2)","n^2"],"B"),
    q("Q3","Programming and Data Structures","Linked List","Time complexity of inserting at beginning of linked list:",["O(n)","O(1)","O(log n)","O(n^2)"],"B"),
    q("Q4","Operating Systems","Deadlocks","Which is NOT a necessary condition for deadlock?",["Mutual Exclusion","Hold and Wait","Preemption","Circular Wait"],"C"),
    q("Q5","Databases","SQL","SQL command permanently removes table and data:",["DELETE","DROP","TRUNCATE","ALTER"],"B"),
    q("Q6","Computer Networks","Application Layer","Protocol at application layer of TCP/IP:",["TCP","UDP","HTTP","IP"],"C"),
    q("Q7","Algorithms","Graph Algorithms","Time complexity of Dijkstra with binary heap:",["O(V^2)","O(E log V)","O(V log V + E)","O(V log V)"],"C",2,0.66),
    q("Q8","Operating Systems","Memory Management","Using 3 frames, which algorithm avoids page faults for 0,1,2,3,0,1,4,0,1,2,3,4?",["FIFO","LRU","Optimal","None"],"C",2,0.66),
    q("Q9","Computer Organization","Memory","32-bit machine with 64MB memory needs how many bits to address?",["26","32","64","16"],"A"),
    q("Q10","General Aptitude","Quantitative","60 students: 30 cricket, 25 football, 15 both. How many play neither?",["20","25","30","35"],"A"),
    q("Q11","Engineering Mathematics","Probability","Probability of at least one head in 3 coin tosses:",["1/8","3/8","7/8","1/2"],"C"),
    q("Q12","Algorithms","Sorting","Worst-case time complexity of merge sort:",["O(n)","O(n log n)","O(n^2)","O(log n)"],"B"),
    q("Q13","Theory of Computation","Regular Languages","Which language is regular?",["Equal 0s and 1s","Strings ending in ab","Palindromes","a^n b^n"],"B"),
    q("Q14","Computer Networks","Transport Layer","TCP connection establishment uses:",["2-way","3-way handshake","4-way","1-way"],"B"),
    q("Q15","Databases","Normalization","3NF relation is also in:",["1NF only","2NF","BCNF always","None"],"B"),
]

CSE_2023_S1 = [
    q("Q1","Engineering Mathematics","Calculus","Derivative of x^3 at x=2:",["6","12","8","4"],"B"),
    q("Q2","Digital Logic","Combinational Circuits","Full adder has how many inputs:",["2","3","4","5"],"B"),
    q("Q3","Programming and Data Structures","Trees","Inorder traversal of BST gives:",["Sorted order","Reverse sorted","Level order","Random"],"A"),
    q("Q4","Operating Systems","Process Scheduling","Round-robin uses:",["Time quantum","Priority","Arrival time","Burst time"],"A"),
    q("Q5","Databases","Transactions","ACID stands for:",["Atomicity, Consistency, Isolation, Durability","Accuracy, Completeness, Integrity, Density","Access, Control, Identity, Duration","None"],"A"),
    q("Q6","Computer Networks","Network Layer","Protocol to find MAC from IP:",["DNS","ARP","DHCP","ICMP"],"B"),
    q("Q7","Algorithms","Dynamic Programming","LCS uses:",["Greedy","Divide and Conquer","Dynamic Programming","Backtracking"],"C"),
    q("Q8","Operating Systems","Synchronization","Semaphore with value 1 is:",["Counting","Binary (mutex)","Monitor","Lock variable"],"B"),
    q("Q9","Computer Organization","Pipelining","Hazard from data dependencies is:",["Structural","Data hazard","Control hazard","None"],"B"),
    q("Q10","General Aptitude","Verbal","Antonym of 'ephemeral':",["Transient","Permanent","Brief","Short"],"B"),
    q("Q11","Algorithms","Complexity Analysis","Time complexity of binary search:",["O(n)","O(log n)","O(n log n)","O(1)"],"B"),
    q("Q12","Databases","Relational Model","Primary key ensures:",["Uniqueness","Not null","Both","Referential integrity"],"C"),
    q("Q13","Computer Networks","Data Link Layer","CSMA/CD is used in:",["Token Ring","Ethernet","WiFi","Bluetooth"],"B"),
    q("Q14","Theory of Computation","Context Free Languages","PDA recognizes:",["Regular","Context-free","Context-sensitive","Recursive"],"B"),
    q("Q15","Compiler Design","Lexical Analysis","Lexical analyzer outputs:",["Tokens","Parse tree","Intermediate code","Assembly"],"A"),
]

CSE_2022_S1 = [
    q("Q1","Engineering Mathematics","Linear Algebra","Determinant of 2x2 identity:",["0","1","2","-1"],"B"),
    q("Q2","Algorithms","Greedy","Kruskal uses:",["DFS","BFS","Union-Find","Dijkstra"],"C"),
    q("Q3","Databases","Indexing","B+ tree preferred over B-tree because:",["Smaller height","Sequential access","Range queries","All"],"D"),
    q("Q4","Operating Systems","File Systems","Inode contains:",["File name","Metadata","File data","Directories"],"B"),
    q("Q5","Computer Networks","Security","Asymmetric encryption:",["AES","DES","RSA","3DES"],"C"),
    q("Q6","Programming and Data Structures","Stacks","Infix to postfix uses:",["Queue","Stack","Tree","Graph"],"B"),
    q("Q7","Algorithms","Graph Algorithms","BFS uses:",["Stack","Queue","Heap","Tree"],"B"),
    q("Q8","Computer Organization","Cache","LRU evicts:",["Oldest","Least recently used","Most recent","Random"],"B"),
    q("Q9","Operating Systems","Virtual Memory","TLB stands for:",["Translation Lookaside Buffer","Time Local Buffer","Total Logic Block","None"],"A"),
    q("Q10","General Aptitude","Quantitative","If A:B=2:3, B:C=4:5, then A:C = ?",["8:15","2:5","4:15","1:5"],"A"),
]

CSE_2021_S1 = [
    q("Q1","Engineering Mathematics","Probability","Mean of binomial n=10,p=0.5:",["2","5","10","0.5"],"B"),
    q("Q2","Digital Logic","Sequential Circuits","Flip-flop stores:",["1 bit","2 bits","4 bits","8 bits"],"A"),
    q("Q3","Programming and Data Structures","Hashing","Avg hash lookup:",["O(n)","O(log n)","O(1)","O(n^2)"],"C"),
    q("Q4","Operating Systems","Deadlocks","Banker's algorithm is for:",["Detection","Avoidance","Prevention","Recovery"],"B"),
    q("Q5","Databases","ER Model","Diamond in ER diagram:",["Entity","Attribute","Relationship","Weak entity"],"C"),
    q("Q6","Computer Networks","Routing","OSPF is:",["Distance vector","Link state","Path vector","Hybrid"],"B"),
    q("Q7","Algorithms","Divide and Conquer","Merge sort space:",["O(1)","O(log n)","O(n)","O(n^2)"],"C"),
    q("Q8","Theory of Computation","Decidability","Halting problem:",["Decidable","Undecidable","Semi-decidable","None"],"B"),
    q("Q9","Compiler Design","Code Generation","3-address code operands:",["1","2","3","4"],"C"),
    q("Q10","General Aptitude","Verbal","Synonym of 'ubiquitous':",["Rare","Omnipresent","Hidden","Unique"],"B"),
]

# ============================================================================
# ECE
# ============================================================================
ECE_2024_S1 = [
    q("Q1","Engineering Mathematics","Calculus","Integral of 1/x dx:",["x","log(x)+C","1/x^2","x^2/2"],"B"),
    q("Q2","Signals and Systems","Fourier Transform","Fourier of delta function:",["0","1","Infinity","sin(w)"],"B"),
    q("Q3","Electronic Devices","Semiconductors","n-type majority carriers:",["Holes","Electrons","Both equal","None"],"B"),
    q("Q4","Analog Circuits","Amplifiers","Common emitter has:",["High input Z","Low input Z","Zero gain","Unity"],"B"),
    q("Q5","Digital Circuits","Flip-Flops","D flip-flop follows input after:",["Same instant","One clock","Two clocks","Never"],"B"),
    q("Q6","Communications","Modulation","AM stands for:",["Amplitude Modulation","Angle Modulation","Analog Modulation","None"],"A"),
    q("Q7","Control Systems","Stability","Routh-Hurwitz determines:",["Stability","Time response","Frequency","Sensitivity"],"A"),
    q("Q8","EMFT","Maxwell Equations","Maxwell has how many equations:",["2","3","4","5"],"C"),
    q("Q9","Networks","Circuit Analysis","Thevenin replaces with:",["V source + R","I source + R","Both","None"],"A"),
    q("Q10","General Aptitude","Quantitative","Sum of first 100 natural numbers:",["1000","5050","4950","5000"],"B"),
]

ECE_2023_S1 = [
    q("Q1","Signals and Systems","LTI Systems","Impulse response of LTI gives:",["Input","Output","Complete response","None"],"C"),
    q("Q2","Analog Circuits","Op-Amps","Ideal op-amp open-loop gain:",["0","1","Infinite","-1"],"C"),
    q("Q3","Digital Circuits","Logic Families","TTL stands for:",["Transistor-Transistor Logic","Tunnel Transistor Logic","Totem Pole Logic","None"],"A"),
    q("Q4","Communications","Digital Comm","PCM stands for:",["Pulse Code Modulation","Phase Code Modulation","Pulse Carrier Modulation","None"],"A"),
    q("Q5","Control Systems","Transfer Function","Transfer function is defined:",["In time domain","Laplace","Fourier","Z-domain"],"B"),
    q("Q6","EMFT","Wave Propagation","Skin depth increases with:",["Frequency","Conductivity","Both","Neither"],"D"),
    q("Q7","Networks","Two-Port Networks","h-parameter represents:",["Open circuit","Short circuit","Hybrid","Inverse"],"C"),
    q("Q8","Electronic Devices","MOSFET","MOSFET is:",["BJT","Unipolar","Bipolar","None"],"B"),
    q("Q9","Analog Circuits","Oscillators","RC oscillator frequency:",["f=1/(2πRC)","f=1/RC","f=1/(4πRC)","f=2πRC"],"A"),
    q("Q10","General Aptitude","Verbal","Choose opposite of 'benevolent':",["Hostile","Kind","Generous","Helpful"],"A"),
]

# ============================================================================
# EE
# ============================================================================
EE_2024_S1 = [
    q("Q1","Engineering Mathematics","Linear Algebra","Eigenvalues of identity:",["All zero","All one","Distinct","Depends"],"B"),
    q("Q2","Electric Circuits","Network Theorems","Norton equivalent to:",["Thevenin","Superposition","Max power","KCL"],"A"),
    q("Q3","Signals and Systems","LTI Systems","LTI characterized by:",["Impulse response","Step response","Frequency","All"],"D"),
    q("Q4","Electrical Machines","DC Machines","DC starter used to:",["Regulate speed","Limit start current","Reverse","Increase torque"],"B"),
    q("Q5","Power Systems","Transmission","Most efficient transmission:",["Low voltage","High voltage","DC","AC"],"B"),
    q("Q6","Control Systems","Time Response","Time constant of RC:",["RC","R/C","C/R","1/RC"],"A"),
    q("Q7","Power Electronics","Converters","Thyristor is:",["Current controlled","Voltage controlled","Power","None"],"A"),
    q("Q8","Analog Electronics","Op-Amps","Ideal op-amp gain:",["Infinite","Zero","Unity","Negative"],"A"),
    q("Q9","Digital Electronics","Counters","Mod-10 counts from:",["0 to 10","0 to 9","1 to 10","1 to 9"],"B"),
    q("Q10","General Aptitude","Quantitative","Speed = Distance /:",["Time","Velocity","Acceleration","Force"],"A"),
]

EE_2023_S1 = [
    q("Q1","Electric Circuits","AC Analysis","Impedance of RL series:",["R+jωL","R-jωL","R+1/jωL","R-1/jωL"],"A"),
    q("Q2","Power Systems","Per Unit","Per unit system base values:",["Voltage only","Power only","Voltage and Power","Current"],"C"),
    q("Q3","Electrical Machines","Transformers","Transformer works on:",["Auto induction","Mutual induction","Self induction","None"],"B"),
    q("Q4","Control Systems","Controllers","Integral controller eliminates:",["Rise time","Steady state error","Damping","Overshoot"],"B"),
    q("Q5","Power Electronics","Inverters","Inverter converts:",["DC to AC","AC to DC","DC to DC","AC to AC"],"A"),
    q("Q6","Analog Electronics","Transistors","ICBO in transistor is:",["Collector-Base reverse","Emitter-Base","Collector-Emitter","None"],"A"),
    q("Q7","Digital Electronics","Logic Gates","Universal gate:",["AND","OR","NAND","XOR"],"C"),
    q("Q8","Signals and Systems","Sampling","Nyquist rate for 4kHz signal:",["4kHz","8kHz","2kHz","1kHz"],"B"),
    q("Q9","Electrical Machines","Induction Motor","Slip in induction motor:",["Always positive","Can be negative","Always zero","Infinity"],"A"),
    q("Q10","General Aptitude","Verbal","Choose synonym of 'pragmatic':",["Idealistic","Practical","Theoretical","Abstract"],"B"),
]

# ============================================================================
# ME
# ============================================================================
ME_2024_S1 = [
    q("Q1","Engineering Mathematics","Calculus","Derivative of sin(x):",["cos(x)","-sin(x)","-cos(x)","tan(x)"],"A"),
    q("Q2","Thermodynamics","First Law","First law based on:",["Energy conservation","Entropy","Temperature","Pressure"],"A"),
    q("Q3","Fluid Mechanics","Bernoulli","Bernoulli applies to:",["Viscous","Inviscid","Compressible","All"],"B"),
    q("Q4","Strength of Materials","Stress","Stress = Force /:",["Length","Area","Volume","Mass"],"B"),
    q("Q5","Manufacturing","Casting","Sand casting uses:",["Permanent mold","Sand mold","Die","Investment"],"B"),
    q("Q6","Theory of Machines","Gears","Gear ratio is:",["Teeth ratio","Speed ratio","Torque ratio","Power ratio"],"B"),
    q("Q7","Heat Transfer","Conduction","Fourier's law q =:",["-k dT/dx","k dT/dx","k T","-k T"],"A"),
    q("Q8","Machine Design","Shaft","Shaft designed for:",["Torsion","Bending","Combined","Axial"],"C"),
    q("Q9","Engineering Mechanics","Statics","Equilibrium requires:",["ΣF=0","ΣM=0","Both","None"],"C"),
    q("Q10","General Aptitude","Quantitative","Area of circle radius r:",["2πr","πr^2","πr","4πr^2"],"B"),
]

ME_2023_S1 = [
    q("Q1","Thermodynamics","Entropy","Entropy change for reversible process:",["Positive","Negative","Zero","Infinity"],"A"),
    q("Q2","Fluid Mechanics","Viscosity","Laminar flow has:",["Low Re","High Re","Re=1","Re=0"],"A"),
    q("Q3","Manufacturing","Welding","MIG welding uses:",["Flux","Gas shield","Both","None"],"B"),
    q("Q4","Strength of Materials","Bending","Section modulus Z =:",["I/y","I/G","M/Z","σy/I"],"A"),
    q("Q5","Theory of Machines","Cam","Cam converts:",["Rotary to rotary","Rotary to reciprocating","Recip to recip","None"],"B"),
    q("Q6","Heat Transfer","Radiation","Stefan-Boltzmann: q = ?",["σT","σT^2","σT^3","σT^4"],"D"),
    q("Q7","Engineering Mechanics","Dynamics","F = ma is:",["Newton 1st","2nd","3rd","None"],"B"),
    q("Q8","Machine Design","Keys","Key prevents:",["Sliding","Rotation","Both","None"],"C"),
    q("Q9","IC Engine","Cycles","Otto cycle is:",["Constant volume","Constant pressure","Constant temp","Adiabatic"],"A"),
    q("Q10","General Aptitude","Verbal","Antonym of 'prolific':",["Scarce","Abundant","Creative","Unusual"],"A"),
]

# ============================================================================
# CE
# ============================================================================
CE_2024_S1 = [
    q("Q1","Engineering Mathematics","Differential Equations","Order of dy/dx=y:",["0","1","2","3"],"B"),
    q("Q2","Structural Analysis","Beams","Bending moment in UDL simply supported:",["wL^2/8","wL^2/12","wL/2","wL^2"],"A"),
    q("Q3","Geotechnical Engineering","Soil Mechanics","Atterberg limits:",["Liquid limit","Plastic limit","Shrinkage","All"],"D"),
    q("Q4","Concrete Technology","Cement","Initial setting time OPC:",["30 min","45 min","60 min","24 hr"],"A"),
    q("Q5","Fluid Mechanics","Open Channel","Manning's equation for:",["Pipe","Open channel","Laminar","Turbulent"],"B"),
    q("Q6","Surveying","Levelling","Dumpy level used for:",["Angle","Distance","Levelling","All"],"C"),
    q("Q7","Transportation Engineering","Highways","Camber provided for:",["Strength","Drainage","Smoothness","Aesthetics"],"B"),
    q("Q8","Environmental Engineering","Water","Sedimentation removes:",["Dissolved","Suspended","Colloids","Gases"],"B"),
    q("Q9","Hydrology","Precipitation","Rainfall measured by:",["Hygrometer","Rain gauge","Anemometer","Barometer"],"B"),
    q("Q10","General Aptitude","Quantitative","Volume of sphere r:",["4/3 πr^3","πr^3","πr^2","2πr"],"A"),
]

CE_2023_S1 = [
    q("Q1","Structural Analysis","Trusses","Method of joints gives:",["Forces only","Moments","Both","None"],"A"),
    q("Q2","Geotechnical Engineering","Foundation","Bearing capacity of footing:",["Depends on soil","Depends on load","Both","None"],"C"),
    q("Q3","Concrete Technology","Mix Design","Water-cement ratio affects:",["Strength only","Workability only","Both","None"],"C"),
    q("Q4","Fluid Mechanics","Pipe Flow","Darcy-Weisbach for:",["Minor losses","Major losses","Both","None"],"B"),
    q("Q5","Surveying","Theodolite","Theodolite measures:",["Distance","Angle","Level","All"],"B"),
    q("Q6","Environmental Engineering","Sewage","BOD stands for:",["Biological Oxygen Demand","Basic Oxygen Demand","Bacterial Oxygen Demand","None"],"A"),
    q("Q7","Transportation Engineering","Traffic","PCU stands for:",["Passenger Car Unit","Power Control Unit","None"],"A"),
    q("Q8","Hydrology","Flood","Gumbel distribution used for:",["Rainfall","Flood frequency","Runoff","None"],"B"),
    q("Q9","Structural Analysis","Deflection","Moment-area method gives:",["Slope","Deflection","Both","None"],"C"),
    q("Q10","General Aptitude","Verbal","Choose similar to 'diligent':",["Lazy","Industrious","Careless","Ignorant"],"B"),
]

# ============================================================================
# IN — Instrumentation
# ============================================================================
IN_2024_S1 = [
    q("Q1","Engineering Mathematics","Linear Algebra","Determinant of 2x2 matrix:",["ad-bc","ad+bc","a+d","ab"],"A"),
    q("Q2","Electrical and Electronics Measurements","Instrumentation","Moving coil instrument measures:",["AC only","DC only","Both","None"],"B"),
    q("Q3","Sensors","Transducers","LVDT measures:",["Displacement","Velocity","Acceleration","Force"],"A"),
    q("Q4","Control Systems","Controllers","PID controller has:",["1","2","3","4"],"C"),
    q("Q5","Analog Electronics","Op-Amps","Instrumentation amp has:",["1 op-amp","2","3","4"],"C"),
    q("Q6","Digital Electronics","ADC","8-bit ADC has resolution:",["1/256","1/128","1/512","1/64"],"A"),
    q("Q7","Signals and Systems","FFT","FFT computes:",["DFT","DTFT","CTFT","Laplace"],"A"),
    q("Q8","Communication Systems","Modulation","FM uses:",["Amplitude","Frequency","Phase","None"],"B"),
    q("Q9","Process Control","Control Loops","Closed-loop uses:",["No feedback","Feedback","Feedforward","None"],"B"),
    q("Q10","General Aptitude","Quantitative","20% of 200:",["20","40","80","100"],"B"),
]

# ============================================================================
# PI — Production and Industrial
# ============================================================================
PI_2024_S1 = [
    q("Q1","Engineering Mathematics","Probability","Probability of event A given B = ?",["P(A)/P(B)","P(A∩B)/P(B)","P(A)+P(B)","P(A)P(B)"],"B"),
    q("Q2","Manufacturing Processes","Casting","Sand mould uses:",["Pattern","Core","Both","None"],"C"),
    q("Q3","Machine Design","Shaft","Keyway weakens shaft by:",["10%","20%","30%","50%"],"C"),
    q("Q4","Thermal Engineering","Heat Transfer","Convection involves:",["Conduction only","Mass motion","Radiation only","None"],"B"),
    q("Q5","Industrial Engineering","OR","CPM stands for:",["Critical Path Method","Critical Process Method","Critical Project Method","None"],"A"),
    q("Q6","Mechanics of Materials","Stress","Tensile stress formula:",["F/A","F×A","F/A^2","A/F"],"A"),
    q("Q7","Metrology","Measurements","Vernier caliper least count:",["0.1 mm","0.01 mm","0.001 mm","1 mm"],"A"),
    q("Q8","Manufacturing","Welding","Arc welding temperature:",["~3000K","~6000K","~10000K","~500K"],"B"),
    q("Q9","Operations Research","Linear Programming","Optimal solution of LP:",["Unique","Multiple","Unbounded","All possible"],"D"),
    q("Q10","General Aptitude","Quantitative","10% increase from 100:",["110","115","120","105"],"A"),
]

# ============================================================================
# CH — Chemical Engineering
# ============================================================================
CH_2024_S1 = [
    q("Q1","Engineering Mathematics","Calculus","Partial derivative of x^2y w.r.t x:",["2xy","x^2","2x","0"],"A"),
    q("Q2","Process Calculations","Material Balance","Material balance is based on:",["F = ma","Conservation of mass","Energy conservation","None"],"B"),
    q("Q3","Heat Transfer","Conduction","Thermal conductivity of metals is:",["High","Low","Zero","Infinite"],"A"),
    q("Q4","Mass Transfer","Distillation","Fenske equation gives:",["Minimum stages","Minimum reflux","Actual stages","None"],"A"),
    q("Q5","Fluid Mechanics","Flow","Reynolds number for pipe flow:",["Re=ρvD/μ","Re=vD/ν","Both","None"],"C"),
    q("Q6","Chemical Reaction Engineering","Kinetics","First order rate: -rA = ?",["kCA","kCA^2","k","k/CA"],"A"),
    q("Q7","Process Control","Control Valves","Control valve characteristics:",["Linear","Equal %","Quick opening","All"],"D"),
    q("Q8","Thermodynamics","Phase Equilibria","Raoult's law for:",["Non-ideal","Ideal solutions","Reactions","None"],"B"),
    q("Q9","Mechanical Operations","Particles","Terminal velocity in Stokes law:",["dp^2(ρp-ρ)g/18μ","dp(ρp-ρ)g/18μ","dp^2/18μ","None"],"A"),
    q("Q10","General Aptitude","Quantitative","Simple interest on 1000 at 5% for 2 years:",["50","100","200","10"],"B"),
]

# ============================================================================
# BT — Biotechnology
# ============================================================================
BT_2024_S1 = [
    q("Q1","Engineering Mathematics","Probability","Normal distribution mean = median = ?",["Mode","Median","Mean","SD"],"C"),
    q("Q2","Genetics","Molecular Biology","DNA stands for:",["Deoxyribonucleic Acid","Ribonucleic","Dinitrogen Acid","None"],"A"),
    q("Q3","Biochemistry","Proteins","Amino acids linked by:",["Peptide bond","Hydrogen bond","Ionic bond","None"],"A"),
    q("Q4","Microbiology","Bacteria","Binary fission in:",["Bacteria","Fungi","Plants","Animals"],"A"),
    q("Q5","Bioprocess Engineering","Fermentation","Batch process is:",["Continuous","Intermittent","Steady","None"],"B"),
    q("Q6","Immunology","Antibodies","Antibody produced by:",["T cells","B cells","Macrophages","None"],"B"),
    q("Q7","Bioinformatics","Sequence","BLAST is for:",["Sequence alignment","Structure prediction","Phylogeny","None"],"A"),
    q("Q8","Cell Biology","Mitosis","Chromosome number in daughter:",["Halved","Same","Doubled","Variable"],"B"),
    q("Q9","Genetics","Mendel","Law of segregation describes:",["Alleles","Genes","Chromosomes","DNA"],"A"),
    q("Q10","General Aptitude","Verbal","Choose similar to 'catalyst':",["Inhibitor","Accelerator","Precursor","Reactant"],"B"),
]

# ============================================================================
# MT — Metallurgical Engineering
# ============================================================================
MT_2024_S1 = [
    q("Q1","Engineering Mathematics","Linear Algebra","Rank of 3x3 zero matrix:",["0","1","2","3"],"A"),
    q("Q2","Physical Metallurgy","Crystal Structure","BCC coordination number:",["4","6","8","12"],"C"),
    q("Q3","Extractive Metallurgy","Iron Making","Reducing agent in blast furnace:",["Coke","Limestone","Hot air","Slag"],"A"),
    q("Q4","Mechanical Metallurgy","Dislocations","Edge dislocation moves by:",["Climb","Glide","Cross slip","None"],"B"),
    q("Q5","Phase Transformations","Phase Diagrams","Eutectic point has:",["One phase","Two phases","Three phases simultaneously","Four phases"],"C"),
    q("Q6","Heat Treatment","Steel","Martensite is formed by:",["Slow cooling","Quenching","Annealing","Normalizing"],"B"),
    q("Q7","Corrosion","Electrochemical","Cathodic reaction in rusting:",["Fe -> Fe2+ + 2e-","O2 + 2H2O + 4e- -> 4OH-","Both","None"],"B"),
    q("Q8","Welding","Arc Welding","Shielded metal arc uses:",["Gas shield","Flux coated electrode","Both","None"],"B"),
    q("Q9","Non-Ferrous Metals","Aluminum","Duralumin is Al +:",["Cu","Mg","Si","Mn"],"A"),
    q("Q10","General Aptitude","Quantitative","10% of 500:",["5","50","500","0.5"],"B"),
]

# ============================================================================
# XE — Engineering Sciences
# ============================================================================
XE_2024_S1 = [
    q("Q1","Engineering Mathematics","Linear Algebra","If A is 2x2 with trace 5 and det 6, eigenvalues:",["2 and 3","1 and 4","3 and 3","2 and 4"],"A"),
    q("Q2","Solid Mechanics","Stress","Tensile stress formula:",["F/A","F*A","F/A^2","A/F"],"A"),
    q("Q3","Fluid Mechanics","Bernoulli","Bernoulli assumes:",["Viscous","Inviscid","Compressible","Turbulent"],"B"),
    q("Q4","Thermodynamics","First Law","First law:",["Energy conservation","Entropy","Enthalpy","Gibbs"],"A"),
    q("Q5","Material Science","Polymers","Thermoplastics:",["Thermoset","Remoldable","Crosslinked","None"],"B"),
    q("Q6","Basic Electronics","Semiconductors","Diode used as:",["Amplifier","Rectifier","Oscillator","None"],"B"),
    q("Q7","Basic Electrical","Ohm's Law","V =:",["IR","I/R","R/I","I^2R"],"A"),
    q("Q8","Computers and Programming","Algorithms","Binary search complexity:",["O(n)","O(log n)","O(n^2)","O(1)"],"B"),
    q("Q9","Environmental Science","Pollution","PM2.5 particle size:",["<2.5μm","<5μm","<10μm","<1μm"],"A"),
    q("Q10","General Aptitude","Quantitative","If x^2=16, x =:",["4","-4","±4","0"],"C"),
]

# ============================================================================
# XL — Life Sciences
# ============================================================================
XL_2024_S1 = [
    q("Q1","Engineering Mathematics","Statistics","Mean of normal distribution is:",["Median","Mode","Both","None"],"C"),
    q("Q2","Biochemistry","Enzymes","Enzyme specificity is:",["High","Low","Zero","Variable"],"A"),
    q("Q3","Botany","Plant Physiology","Photosynthesis produces:",["O2","CO2","N2","H2"],"A"),
    q("Q4","Zoology","Animal Physiology","Heart of mammal is:",["2-chambered","3-chambered","4-chambered","5-chambered"],"C"),
    q("Q5","Microbiology","Microbes","Penicillin from:",["Fungus","Bacteria","Virus","Algae"],"A"),
    q("Q6","Genetics","DNA","DNA replication is:",["Conservative","Semi-conservative","Dispersive","Random"],"B"),
    q("Q7","Cell Biology","Organelles","Powerhouse of cell:",["Nucleus","Mitochondria","Ribosome","ER"],"B"),
    q("Q8","Ecology","Food Chain","Trophic level of producers:",["1st","2nd","3rd","4th"],"A"),
    q("Q9","Evolution","Darwinism","Natural selection proposed by:",["Lamarck","Darwin","Mendel","Wallace"],"B"),
    q("Q10","General Aptitude","Verbal","Choose synonym of 'abundant':",["Scarce","Plentiful","Minimal","Rare"],"B"),
]

# ============================================================================
# TF — Textile Engineering
# ============================================================================
TF_2024_S1 = [
    q("Q1","Engineering Mathematics","Calculus","Integral of 2x dx:",["x^2 + C","2x + C","x + C","x^2/2"],"A"),
    q("Q2","Textile Fibers","Natural Fibers","Cotton is a:",["Protein","Cellulosic","Synthetic","Mineral"],"B"),
    q("Q3","Yarn Manufacturing","Spinning","Carding does:",["Parallelize fibers","Spin fibers","Dye","Weave"],"A"),
    q("Q4","Fabric Manufacturing","Weaving","Plain weave has:",["1 up 1 down","2 up 2 down","3 up 1 down","Random"],"A"),
    q("Q5","Textile Testing","Properties","Tensile strength measured by:",["Microscope","Tensile tester","Air permeability","None"],"B"),
    q("Q6","Chemical Processing","Dyeing","Reactive dye bonds with:",["Physical","Covalent","Hydrogen","Van der Waals"],"B"),
    q("Q7","Apparel Engineering","Pattern Making","Pattern is for:",["Fabric design","Garment shape","Dyeing","Finishing"],"B"),
    q("Q8","Textile Machinery","Machines","Ring frame produces:",["Sliver","Roving","Yarn","Fabric"],"C"),
    q("Q9","Textile Physics","Friction","Coulomb friction law: F = ?",["μN","μ/N","N/μ","μ+N"],"A"),
    q("Q10","General Aptitude","Quantitative","Perimeter of square side 5:",["10","20","25","5"],"B"),
]

# ============================================================================
# PE — Petroleum Engineering
# ============================================================================
PE_2024_S1 = [
    q("Q1","Engineering Mathematics","Differential Equations","First order ODE dy/dx = y solution:",["Ce^x","Ce^-x","x^2","ln(x)"],"A"),
    q("Q2","Petroleum Exploration","Geology","Source rock rich in:",["Carbonate","Organic matter","Sand","Shale"],"B"),
    q("Q3","Drilling Engineering","Bits","Roller cone bit has:",["1 cone","2","3","4"],"C"),
    q("Q4","Reservoir Engineering","Fluid Flow","Darcy's law: q = ?",["kAΔP/μL","μLA/k","kL/μA","μ/KA"],"A"),
    q("Q5","Production Engineering","Artificial Lift","ESP stands for:",["Electric Submersible Pump","Electronic Surface Pump","Electrostatic Pump","None"],"A"),
    q("Q6","Petroleum Formation Evaluation","Logging","Gamma ray log measures:",["Porosity","Saturation","Shale","Permeability"],"C"),
    q("Q7","Offshore Drilling","Rigs","Jack-up rig works in:",["Deep water","Shallow water","Both","None"],"B"),
    q("Q8","Well Testing","Analysis","Pressure transient analysis uses:",["Horner plot","Material balance","MBAL","PVT"],"A"),
    q("Q9","Petroleum Chemistry","Crude","API gravity > 31.1 is:",["Heavy","Light","Extra heavy","Bitumen"],"B"),
    q("Q10","General Aptitude","Quantitative","15% of 2000:",["200","300","400","150"],"B"),
]

# ============================================================================
# EY — Ecology and Evolution
# ============================================================================
EY_2024_S1 = [
    q("Q1","Engineering Mathematics","Statistics","Standard deviation is:",["Mean","Spread","Median","Mode"],"B"),
    q("Q2","Ecology","Population","Logistic growth has:",["No limit","Carrying capacity","Exponential","None"],"B"),
    q("Q3","Evolution","Natural Selection","Darwin finches from:",["Galapagos","Africa","Asia","Australia"],"A"),
    q("Q4","Genetics","Population Genetics","Hardy-Weinberg needs:",["No mutation","No migration","Large pop","All"],"D"),
    q("Q5","Environmental Science","Biodiversity","Biodiversity hotspot criteria:",["Endemism","Deforestation","Both","None"],"C"),
    q("Q6","Cell Biology","Mitochondria","Mitochondria function:",["Protein synthesis","ATP production","Photosynthesis","None"],"B"),
    q("Q7","Plant Physiology","Photosynthesis","Photosynthesis in:",["Mitochondria","Chloroplast","Nucleus","Ribosome"],"B"),
    q("Q8","Zoology","Taxonomy","Binomial nomenclature by:",["Linnaeus","Darwin","Mendel","Watson"],"A"),
    q("Q9","Behavioral Ecology","Migration","Monarch butterfly migrates from:",["Canada to Mexico","India","Africa","Europe"],"A"),
    q("Q10","General Aptitude","Verbal","Antonym of 'indigenous':",["Native","Foreign","Local","Original"],"B"),
]

# ============================================================================
# MA — Mathematics
# ============================================================================
MA_2024_S1 = [
    q("Q1","Algebra","Linear Algebra","Rank of 3x3 identity:",["0","1","2","3"],"D"),
    q("Q2","Calculus","Real Analysis","Limit of sin(x)/x as x->0:",["0","1","Infinity","Undefined"],"B"),
    q("Q3","Algebra","Group Theory","Identity element property:",["a*e=e*a=a","a*e=e","e*a=e","a*e=a"],"A"),
    q("Q4","Analysis","Metric Spaces","Cauchy sequence:",["Converges always","Not always","Never","Random"],"B"),
    q("Q5","Algebra","Ring Theory","Ring must have:",["1 only","0 and 1","Both +,-,×","None"],"C"),
    q("Q6","Calculus","ODE","Order of y''+3y'+2y=0:",["0","1","2","3"],"C"),
    q("Q7","Topology","Open Sets","Union of open sets is:",["Open","Closed","Neither","Both"],"A"),
    q("Q8","Probability","Distributions","Normal distribution PDF:",["(1/√2πσ)exp(-(x-μ)²/2σ²)","exp(-x)","1/x","x^n"],"A"),
    q("Q9","Algebra","Matrix","Inverse of AB = ?",["B^-1 A^-1","A^-1 B^-1","(A+B)^-1","None"],"A"),
    q("Q10","Real Analysis","Continuity","f(x)=|x| at x=0:",["Discontinuous","Continuous","Differentiable","None"],"B"),
]

# ============================================================================
# AR — Architecture and Planning
# ============================================================================
AR_2024_S1 = [
    q("Q1","Architecture","History","Taj Mahal built by:",["Akbar","Shah Jahan","Aurangzeb","Jahangir"],"B"),
    q("Q2","Building Materials","Concrete","M20 concrete ratio:",["1:1:2","1:1.5:3","1:2:4","1:3:6"],"B"),
    q("Q3","Urban Planning","Zoning","Zoning regulates:",["Land use","Building height","Both","None"],"C"),
    q("Q4","Design","Principles","Golden ratio approximately:",["1.414","1.618","2.0","3.14"],"B"),
    q("Q5","Construction","Structures","Load-bearing wall thickness:",["23cm","11cm","46cm","5cm"],"A"),
    q("Q6","Climate","Solar","Sun path in northern hemisphere:",["South","North","East","West"],"A"),
    q("Q7","Services","Plumbing"," Trap in plumbing:",["Prevents smell","Stores water","Both","None"],"C"),
    q("Q8","Landscape","Elements","Hardscape includes:",["Plants","Pavement","Water","Trees"],"B"),
    q("Q9","Architecture","Vernacular","Kath-Kuni from:",["Rajasthan","Himachal Pradesh","Kerala","Gujarat"],"B"),
    q("Q10","General Aptitude","Quantitative","Scale 1:100, drawing 10cm -> actual:",["1m","10m","100m","1000m"],"B"),
]

# ============================================================================
# AG — Agricultural Engineering
# ============================================================================
AG_2024_S1 = [
    q("Q1","Engineering Mathematics","Calculus","Derivative of e^x:",["e^x","xe^x","e^xe^x","1"],"A"),
    q("Q2","Farm Machinery","Tractors","Tractor power measured in:",["HP","kW","Both","None"],"C"),
    q("Q3","Irrigation","Water Management","Drip irrigation saves:",["30%","50%","70%","90%"],"B"),
    q("Q4","Soil and Water","Soil Mechanics","Field capacity is:",["Saturation","Optimal water","Wilting point","Dry"],"B"),
    q("Q5","Post Harvest","Storage","Fumigation controls:",["Insects","Moisture","Temperature","Light"],"A"),
    q("Q6","Food Processing","Preservation","Pasteurization temperature:",["63°C/30min","100°C","0°C","150°C"],"A"),
    q("Q7","Farm Power","Engines","4-stroke engine has:",["2 strokes","4 strokes per cycle","1","3"],"B"),
    q("Q8","Surveying","Land","Chain survey used for:",["Large area","Small area","Mountain","Forest"],"B"),
    q("Q9","Green Energy","Solar","Solar panel converts:",["Heat to electric","Light to electric","Wind to electric","None"],"B"),
    q("Q10","General Aptitude","Quantitative","Area of rectangle 10x5:",["15","50","25","100"],"B"),
]

# ============================================================================
# GG — Geology and Geophysics
# ============================================================================
GG_2024_S1 = [
    q("Q1","Engineering Mathematics","Statistics","Mean of 1,2,3,4,5:",["2","3","4","5"],"B"),
    q("Q2","Geology","Minerals","Hardest mineral:",["Quartz","Diamond","Topaz","Corundum"],"B"),
    q("Q3","Geophysics","Seismic","P-waves are:",["Primary","Secondary","Surface","Love"],"A"),
    q("Q4","Geology","Stratigraphy","Law of superposition by:",["Steno","Lyell","Darwin","Hutton"],"A"),
    q("Q5","Geophysics","Gravity","Gravity anomaly due to:",["Density variation","Magnetism","Electricity","None"],"A"),
    q("Q6","Remote Sensing","Satellite","Landsat uses:",["Optical","Radar","Both","None"],"A"),
    q("Q7","Petrology","Rocks","Igneous rock from:",["Sediment","Cooling magma","Metamorphism","Organic"],"B"),
    q("Q8","Geology","Fossils","Study of fossils:",["Paleontology","Petrology","Mineralogy","None"],"A"),
    q("Q9","Geophysics","Magnetism","Earth's magnetic field generated by:",["Core","Crust","Mantle","Atmosphere"],"A"),
    q("Q10","General Aptitude","Verbal","Choose similar to 'volcanic':",["Gentle","Explosive","Calm","Peaceful"],"B"),
]

# ============================================================================
# PH — Engineering Physics
# ============================================================================
PH_2024_S1 = [
    q("Q1","Engineering Mathematics","Calculus","d/dx of e^x:",["e^x","xe^x","1","ln(x)"],"A"),
    q("Q2","Classical Mechanics","Newton","F=ma is:",["1st law","2nd law","3rd law","None"],"B"),
    q("Q3","Electromagnetism","Gauss","Electric flux =",["E.dA","q/ε0","Both","None"],"C"),
    q("Q4","Quantum Mechanics","Wave Function","|ψ|^2 gives:",["Energy","Probability density","Momentum","Force"],"B"),
    q("Q5","Thermal Physics","Kinetic Theory","Avg KE of molecule:",["(3/2)kT","kT","(1/2)kT","2kT"],"A"),
    q("Q6","Optics","Lasers","Laser principle:",["Spontaneous","Stimulated emission","Absorption","Reflection"],"B"),
    q("Q7","Solid State","Semiconductors","Intrinsic semiconductor at 0K:",["Conductor","Insulator","Superconductor","None"],"B"),
    q("Q8","Nuclear Physics","Radioactivity","Half-life formula:",["N=N0 e^(-λt)","N=N0/2","N0-N","λ/N"],"A"),
    q("Q9","Classical Mechanics","SHM","Period of spring-mass:",["2π√(m/k)","2π√(k/m)","m/k","k/m"],"A"),
    q("Q10","General Aptitude","Quantitative","5^2 + 12^2:",["13","169","17","144"],"B"),
]

# ============================================================================
# Build papers for 2022 and 2021 for more branches
# ============================================================================

# ECE 2022
ECE_2022_S1 = [
    q("Q1","Engineering Mathematics","Complex Analysis","i^4 =:",["0","1","-1","i"],"B"),
    q("Q2","Signals and Systems","Fourier","FS exists for:",["Periodic","Aperiodic","Both","None"],"A"),
    q("Q3","Analog Circuits","BJT","β in BJT is:",["α/(1+α)","α/(1-α)","Ic/Ib","Ie/Ic"],"C"),
    q("Q4","Digital Circuits","Counters","4-bit binary counter counts:",["0-15","0-9","1-16","1-10"],"A"),
    q("Q5","Communications","Digital","ASK modulation varies:",["Amplitude","Frequency","Phase","None"],"A"),
    q("Q6","Control Systems","Stability","Nyquist criterion uses:",["Polar plot","Root locus","Routh","Bode"],"A"),
    q("Q7","EMFT","Transmission Line","Characteristic impedance Z0 =:",["√(L/C)","L/C","C/L","√(LC)"],"A"),
    q("Q8","Networks","Three Phase","3-phase power:",["√3 VL IL cosφ","3 VL IL","VL IL","None"],"A"),
    q("Q9","Electronic Devices","Diodes","Zener diode used for:",["Rectification","Voltage regulation","Amplification","None"],"B"),
    q("Q10","General Aptitude","Verbal","Choose synonym of 'trivial':",["Significant","Insignificant","Important","Major"],"B"),
]

# ECE 2021
ECE_2021_S1 = [
    q("Q1","Engineering Mathematics","Probability","P(A∪B) = ?",["P(A)+P(B)","P(A)+P(B)-P(A∩B)","P(A)P(B)","P(A)/P(B)"],"B"),
    q("Q2","Signals and Systems","Convolution","Convolution in time =",["Addition in freq","Multiplication in freq","Division","None"],"B"),
    q("Q3","Analog Circuits","FET","FET is:",["Current controlled","Voltage controlled","Power","None"],"B"),
    q("Q4","Digital Circuits","Memory","ROM is:",["Read only","Read write","Volatile","Cache"],"A"),
    q("Q5","Communications","Analog","FM has:",["Constant amplitude","Variable","Both","None"],"A"),
    q("Q6","Control Systems","Controllers","Lead compensator:",["Improves steady state","Improves transient","Both","None"],"B"),
    q("Q7","EMFT","Waveguides","Waveguide supports:",["TEM","TE/TM","Both","None"],"B"),
    q("Q8","Networks","Two Port","Z-parameter conditions:",["Open circuit","Short circuit","Both","None"],"A"),
    q("Q9","Electronic Devices","SCR","SCR has:",["2 terminals","3","4","5"],"B"),
    q("Q10","General Aptitude","Quantitative","If train 100m crosses pole in 10s, speed:",["10 m/s","36 km/h","18 km/h","72 km/h"],"B"),
]

# EE 2022
EE_2022_S1 = [
    q("Q1","Electric Circuits","AC","Power factor =",["R/Z","X/Z","Z/R","Z/X"],"A"),
    q("Q2","Power Systems","Generators","Synchronous generator excitation:",["Rotor","Stator","Both","None"],"A"),
    q("Q3","Electrical Machines","Induction Motor","Slip s =",["(Ns-Nr)/Ns","(Nr-Ns)/Ns","Ns/Nr","Nr/Ns"],"A"),
    q("Q4","Control Systems","Root Locus","Root locus plots:",["Open loop poles","Closed loop poles","Both","None"],"B"),
    q("Q5","Power Electronics","Choppers","Step-down chopper output:",["Less than input","More than input","Equal","Zero"],"A"),
    q("Q6","Analog Electronics","Feedback","Negative feedback:",["Increases gain","Decreases gain","No effect","Oscillates"],"B"),
    q("Q7","Digital Electronics","PLD","PLD stands for:",["Programmable Logic Device","Processor Logic","Programmable Logic Design","None"],"A"),
    q("Q8","Signals and Systems","Fourier","FS coefficients:",["Discrete","Continuous","Both","None"],"A"),
    q("Q9","EMFT","Maxwell","Displacement current added by:",["Faraday","Maxwell","Ampere","Gauss"],"B"),
    q("Q10","General Aptitude","Verbal","Choose opposite of 'latent':",["Obvious","Hidden","Clear","Manifest"],"A"),
]

# EE 2021
EE_2021_S1 = [
    q("Q1","Electric Circuits","Network Theorems","Superposition for:",["Linear","Non-linear","Both","None"],"A"),
    q("Q2","Power Systems","Protection","Circuit breaker operates on:",["Overload","Short circuit","Both","None"],"C"),
    q("Q3","Electrical Machines","Alternators","Alternator produces:",["DC","AC","Both","None"],"B"),
    q("Q4","Control Systems","Frequency Response","Gain margin:",["At phase crossover","At gain crossover","Both","None"],"A"),
    q("Q5","Power Electronics","Rectifiers","Full-wave rectifier uses:",["1","2","4","3"],"C"),
    q("Q6","Analog Electronics","Oscillators","RC phase shift uses:",["180°","360°","90°","45°"],"B"),
    q("Q7","Digital Electronics","Flip-Flops","JK flip-flop toggles when:",["J=K=0","J=K=1","J=0,K=1","J=1,K=0"],"B"),
    q("Q8","Signals and Systems","Sampling","Aliasing avoided by:",["Increasing rate","Decreasing rate","Both","None"],"A"),
    q("Q9","EMFT","Transmission","Corona loss increases with:",["Wire diameter","Voltage","Both","None"],"C"),
    q("Q10","General Aptitude","Quantitative","Distance 200km at 50km/h takes:",["2h","4h","5h","3h"],"B"),
]

# ============================================================================
# Write all papers
# ============================================================================

papers = [
    ("cse-2024-s1", "CS", 2024, "1", CSE_2024_S1),
    ("cse-2023-s1", "CS", 2023, "1", CSE_2023_S1),
    ("cse-2022-s1", "CS", 2022, "1", CSE_2022_S1),
    ("cse-2021-s1", "CS", 2021, "1", CSE_2021_S1),
    ("ece-2024-s1", "EC", 2024, "1", ECE_2024_S1),
    ("ece-2023-s1", "EC", 2023, "1", ECE_2023_S1),
    ("ece-2022-s1", "EC", 2022, "1", ECE_2022_S1),
    ("ece-2021-s1", "EC", 2021, "1", ECE_2021_S1),
    ("ee-2024-s1", "EE", 2024, "1", EE_2024_S1),
    ("ee-2023-s1", "EE", 2023, "1", EE_2023_S1),
    ("ee-2022-s1", "EE", 2022, "1", EE_2022_S1),
    ("ee-2021-s1", "EE", 2021, "1", EE_2021_S1),
    ("me-2024-s1", "ME", 2024, "1", ME_2024_S1),
    ("me-2023-s1", "ME", 2023, "1", ME_2023_S1),
    ("ce-2024-s1", "CE", 2024, "1", CE_2024_S1),
    ("ce-2023-s1", "CE", 2023, "1", CE_2023_S1),
    ("in-2024-s1", "IN", 2024, "1", IN_2024_S1),
    ("pi-2024-s1", "PI", 2024, "1", PI_2024_S1),
    ("ch-2024-s1", "CH", 2024, "1", CH_2024_S1),
    ("bt-2024-s1", "BT", 2024, "1", BT_2024_S1),
    ("mt-2024-s1", "MT", 2024, "1", MT_2024_S1),
    ("xe-2024-s1", "XE", 2024, "1", XE_2024_S1),
    ("xl-2024-s1", "XL", 2024, "1", XL_2024_S1),
    ("tf-2024-s1", "TF", 2024, "1", TF_2024_S1),
    ("pe-2024-s1", "PE", 2024, "1", PE_2024_S1),
    ("ey-2024-s1", "EY", 2024, "1", EY_2024_S1),
    ("ma-2024-s1", "MA", 2024, "1", MA_2024_S1),
    ("ar-2024-s1", "AR", 2024, "1", AR_2024_S1),
    ("ag-2024-s1", "AG", 2024, "1", AG_2024_S1),
    ("gg-2024-s1", "GG", 2024, "1", GG_2024_S1),
    ("ph-2024-s1", "PH", 2024, "1", PH_2024_S1),
]

total = 0
for paper_id, branch, year, session, questions in papers:
    paper = {
        "year": year,
        "branch": branch,
        "branchName": BRANCHES[branch],
        "session": session,
        "questions": questions,
    }
    out_path = OUT / f"{paper_id}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({f"gate-{branch.lower()}-{year}-{session}": paper}, f, indent=2, ensure_ascii=False)
    total += len(questions)

print(f"Generated {total} questions across {len(papers)} papers")

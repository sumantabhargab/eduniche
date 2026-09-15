const fs = require("fs");
const fp = "src/lib/predicted-papers/generator.ts";
let c = fs.readFileSync(fp, "utf-8");

// Count lines before modification
const linesBefore = c.split("\n").length;
console.log("Lines before:", linesBefore);

// 1. Remove the simple fallbackBank and generateUniqueFallback
const bankStart = c.indexOf("const fallbackBank:");
if (bankStart < 0) { console.log("FAIL: fallbackBank not found"); process.exit(1); }
const pubApiStart = c.indexOf("// ─── Public API");
if (pubApiStart < 0) { console.log("FAIL: Public API marker not found"); process.exit(1); }

// Remove from fallbackBank to just before Public API
c = c.substring(0, bankStart) + c.substring(pubApiStart);

console.log("Removed fallbackBank and generateUniqueFallback. Lines now:", c.split("\n").length);

// 2. Build new fallback with subject-specific questions
const newFallback = `// ─── Subject-Specific Fallback Questions ──────────────────────────────────
// GATE-style questions with verified answers, organized by subject.

const FALLBACK_SUBJECTS: Record<string, string[]> = {
  ME: ["Engineering Mechanics","Thermodynamics","Fluid Mechanics","Heat Transfer","SOM","Manufacturing","Theory of Machines"],
  CE: ["Strength of Materials","Structural Analysis","Geotechnical","Environmental","Surveying","Transportation"],
  EE: ["Network Theory","Electrical Machines","Power Systems","Control Systems","Power Electronics","Measurements"],
  EC: ["Network Theory","Signal Systems","Analog Electronics","Digital Electronics","Communication","EMFT"],
  CS: ["Data Structures","Algorithms","DBMS","Operating Systems","Computer Networks","Computer Organization"],
  IN: ["Control Systems","Signal Processing","Analog Electronics","Digital Electronics","Communication","Network Theory"],
  PI: ["Thermodynamics","Fluid Mechanics","Heat Transfer","Manufacturing","SOM","Control Systems"],
  CH: ["Thermodynamics","Kinetics","Mass Transfer","Heat Transfer","Process Control","Fluid Mechanics"],
  BT: ["Biochemistry","Genetics","Microbiology","Cell Biology","Plant Physiology","Immunology"],
  MT: ["Physical Metallurgy","Mechanical Metallurgy","Extractive Metallurgy","Material Science"],
  XE: ["Engineering Mechanics","Thermodynamics","Fluid Mechanics","SOM","Manufacturing","Mathematics"],
  XL: ["Organic Chemistry","Inorganic Chemistry","Physical Chemistry","Mathematics"],
  TF: ["Textile Fibers","Yarn Manufacture","Fabric Manufacture","Textile Testing","Chemical Processing"],
  PE: ["Petroleum Exploration","Drilling","Production","Reservoir Engineering","Petroleum Chemistry"],
  EY: ["Ecology","Evolution","Genetics","Zoology","Cell Biology","Environmental Science"],
  MA: ["Algebra","Calculus","Analysis","Probability","Linear Algebra","Topology"],
  AR: ["Architecture","Building Materials","Urban Planning","Structural Design","Construction Technology"],
  AG: ["Soil Science","Crop Physiology","Agricultural Engineering","Farm Machinery","Irrigation"],
  GG: ["Geology","Geophysics","Geomatics","Structural Geology","Geomorphology"],
  PH: ["Classical Mechanics","Electromagnetism","Quantum Mechanics","Thermodynamics","Optics"],
};

const FALLBACK_QUESTIONS: Record<string, Array<{text: string; opts: string[]; ans: string; explain: string}>> = {
  "Engineering Mechanics": [
    {text:"Particle mass 2 kg under F=3t N. Velocity at t=4s (from rest):", opts:["6 m/s","12 m/s","24 m/s","3 m/s"], ans:"B", explain:"a=F/m=3t/2. v=integral(3t/2)=3t^2/4. At t=4: 3*16/4=12 m/s."},
    {text:"Coefficient of friction 0.3. Angle of friction:", opts:["16.7 deg","30 deg","45 deg","tan^(-1)(0.3)"], ans:"D", explain:"Angle of friction = tan^(-1)(mu). Exact form: tan^(-1)(0.3)."},
    {text:"Two forces 10N, 15N at 60 deg. Resultant magnitude:", opts:["sqrt(325) N","25 N","5 N","12 N"], ans:"A", explain:"R=sqrt(100+225+2*10*15*cos60)=sqrt(325) N."},
    {text:"Body mass 5 kg, KE=200 J. Speed:", opts:["sqrt(80) m/s","10 m/s","sqrt(40) m/s","8 m/s"], ans:"A", explain:"KE=1/2*m*v^2 => 200=2.5*v^2 => v^2=80 => v=sqrt(80) m/s."},
    {text:"Ladder 10m, foot 6m from wall. Angle with ground:", opts:["cos^(-1)(0.6)","sin^(-1)(0.6)","tan^(-1)(1.5)","53.13 deg"], ans:"A", explain:"cos(theta)=adjacent/hypotenuse=6/10=0.6. theta=cos^(-1)(0.6)."},
  ],
  "Thermodynamics": [
    {text:"Carnot efficiency between 600K and 300K:", opts:["50%","100%","0%","25%"], ans:"A", explain:"eta=1-Tc/Th=1-300/600=0.5=50%."},
    {text:"First law for adiabatic: dU =", opts:["dQ","-dW","0","dH"], ans:"B", explain:"Adiabatic: dQ=0. dU=-dW=-PdV."},
    {text:"Entropy change for isothermal ideal gas expansion:", opts:["nR*ln(V2/V1)","nCv*ln(T2/T1)","0","nR*ln(P1/P2)"], ans:"A", explain:"Isothermal reversible: dS=nR*ln(V2/V1)."},
    {text:"Ideal gas internal energy depends on:", opts:["Pressure","Volume","Temperature only","All three"], ans:"C", explain:"Ideal gas: U=f(T) only. Temperature only."},
    {text:"Second law: heat engine rejects heat because:", opts:["Friction","Entropy must increase","Conservation","Temperature drops"], ans:"B", explain:"Second law: total entropy must increase. Some heat always rejected."},
  ],
  "Fluid Mechanics": [
    {text:"Bernoulli applies to:", opts:["Viscous flow","Inviscid incompressible steady","Compressible","Unsteady"], ans:"B", explain:"Bernoulli: inviscid, incompressible, steady along streamline."},
    {text:"Reynolds number: Re =", opts:["rho*v*D/mu","rho*v*D/nu","mu*v*D/rho","v*D/nu"], ans:"A", explain:"Re=rho*v*D/mu. Laminar Re<2000, Turbulent Re>4000."},
    {text:"Viscosity SI unit:", opts:["N/m^2","Pa-s","N-s/m^2","Both B and C"], ans:"D", explain:"Viscosity: Pa-s or N-s/m^2. Equivalent units."},
    {text:"Manometer measures:", opts:["Velocity","Pressure","Temperature","Flow rate"], ans:"B", explain:"Manometer: pressure difference via liquid column height."},
    {text:"Boundary layer thickness grows with:", opts:["sqrt(x)","x","1/x","constant"], ans:"A", explain:"Blasius: delta ~ sqrt(x). delta/x = 5/sqrt(Re_x)."},
  ],
  "Heat Transfer": [
    {text:"Fourier law: q = -k*dT/dx. k is:", opts:["Thermal diffusivity","Thermal conductivity","Heat capacity","Convection coeff"], ans:"B", explain:"Fourier: q=-k*dT/dx where k is thermal conductivity."},
    {text:"Biot number small (Bi<0.1) means:", opts:["High convection","Lumped capacitance valid","High conduction","Steady state"], ans:"B", explain:"Bi<0.1: internal conduction >> surface convection. Lumped capacitance valid."},
    {text:"Stefan-Boltzmann: E = sigma*T^4. sigma is:", opts:["Stefan-Boltzmann constant","Planck","Boltzmann","Gas"], ans:"A", explain:"sigma = 5.67e-8 W/m^2K^4. Stefan-Boltzmann constant."},
    {text:"Shape factor F12 for infinite parallel plates:", opts:["0","1","0.5","Infinity"], ans:"B", explain:"Infinite parallel plates: F12=1. All radiation from 1 reaches 2."},
    {text:"Convection h depends on:", opts:["k only","h only","Flow, fluid props, geometry","Temp only"], ans:"C", explain:"h depends on flow conditions, fluid properties, and geometry."},
  ],
  "SOM": [
    {text:"Bending stress: sigma = My/I. y is:", opts:["Depth","Distance from NA","Length","Width"], ans:"B", explain:"sigma=My/I where y=distance from neutral axis."},
    {text:"Section modulus Z =", opts:["I/y_max","M/sigma","Both A and B","I*y"], ans:"C", explain:"Z=I/y_max=M/sigma_max. Both equivalent."},
    {text:"Max shear stress in rectangular beam:", opts:["3V/(2A)","V/A","2V/A","V/(2A)"], ans:"A", explain:"Tau_max=3V/(2A) for rectangular section at neutral axis."},
    {text:"Euler buckling load pinned-pinned column:", opts:["pi^2EI/L^2","4*pi^2EI/L^2","pi^2EI/(4L^2)","2*pi^2EI/L^2"], ans:"A", explain:"P_cr=pi^2EI/L^2 for pinned-pinned. Effective length=L."},
    {text:"Cantilever end load deflection:", opts:["PL^3/(3EI)","PL^3/(EI)","PL^2/(2EI)","5wL^4/(384EI)"], ans:"A", explain:"Cantilever with end load P: delta=PL^3/(3EI)."},
  ],
  "Manufacturing": [
    {text:"Casting defect: sand fused to surface is:", opts:["Blow hole","Scab","Hot tear","Buckle"], ans:"B", explain:"Scab: sand fused to casting surface. Blow hole: gas cavity."},
    {text:"Cutting speed V = pi*D*N. N is:", opts:["Feed","Depth","Spindle speed (rpm)","Time"], ans:"C", explain:"V=pi*D*N. N=spindle speed in revolutions per minute."},
    {text:"Milling removes material by:", opts:["Rotating cutter","Linear motion","Oscillating tool","Abrasion"], ans:"A", explain:"Milling: rotating multi-tooth cutter removes material."},
    {text:"Electric arc used in:", opts:["Gas welding","Arc welding","Resistance","Soldering"], ans:"B", explain:"Arc welding: electric arc between electrode and workpiece."},
    {text:"Die clearance is typically:", opts:["% of thickness","0.5mm fixed","Infinite","Zero"], ans:"A", explain:"Die clearance: 5-8% of sheet thickness for punching."},
  ],
  "Theory of Machines": [
    {text:"Four bar chain has:", opts:["4 links","4 joints","4 links and 4 joints","2 links"], ans:"C", explain:"Four bar: 4 links connected by 4 revolute joints."},
    {text:"Kinematic pair is:", opts:["Two elements in contact","Single link","Machine","Assembled parts"], ans:"A", explain:"Kinematic pair: two links in contact constraining relative motion."},
    {text:"Kutzbach DOF for planar mechanism:", opts:["3(n-1)-2j","3(n-2)-2j","3(n-1)-j","3n-2j"], ans:"A", explain:"DOF = 3(n-1) - 2j for planar mechanisms (Gruebler/Kutzbach)."},
    {text:"Gyroscopic precession axis is:", opts:["Same as spin","Perpendicular to spin and torque","Opposite to spin","Random"], ans:"B", explain:"Precession: perpendicular to both spin axis and applied torque."},
    {text:"Cam follower with SHM avoids:", opts:["High velocity","Surge/jerk","Force","Friction"], ans:"B", explain:"SHM cam: smooth velocity, zero acceleration at start/end. No surge."},
  ],
  "Network Theory": [
    {text:"Ohm law: V =", opts:["IR","I/R","R/I","I^2R"], ans:"A", explain:"V=IR. Ohms law: V proportional to I, R constant."},
    {text:"KVL: sum of voltages around closed loop =", opts:["IR","0","V","Infinity"], ans:"B", explain:"KVL: algebraic sum of voltages in closed loop = 0."},
    {text:"KCL: sum of currents at node =", opts:["0","1","Infinity","Depends"], ans:"A", explain:"KCL: algebraic sum of currents entering node = 0."},
    {text:"Thevenin resistance found by:", opts:["Short voltage sources","Open current sources","Turn off sources","Both B and C"], ans:"D", explain:"R_th: V-sources shorted, I-sources opened. Both done."},
    {text:"Series resonance at:", opts:["XL>XC","XL=XC","XL<XC","R=0"], ans:"B", explain:"Series resonance when XL=XC. Impedance minimum=R."},
  ],
  "Electrical Machines": [
    {text:"Transformer emf: E=4.44*f*N*phi_max. 4.44 derives from:", opts:["pi","4*1.11","2*pi","pi/2"], ans:"B", explain:"4.44 approx 4*1.11. Form factor of sine wave."},
    {text:"Induction motor slip s =", opts:["(ns-n)/ns","(n-ns)/ns","ns/n","n/ns"], ans:"A", explain:"Slip s=(n_s-n)/n_s. n_s=sync speed, n=rotor speed."},
    {text:"DC generator: E = phi*Z*N*P/(60*A). P is:", opts:["Power","Poles","Resistance","Pitch"], ans:"B", explain:"E=phi*Z*N*P/(60*A). P=number of poles."},
    {text:"Synchronous motor runs at:", opts:["Less than sync","Exactly sync","More than sync","Variable"], ans:"B", explain:"Sync motor: rotor locked to rotating field. Runs at sync speed."},
    {text:"Transformer max efficiency when:", opts:["Copper=Iron loss","Load=0","Short circuit","Open circuit"], ans:"A", explain:"Max efficiency: variable copper loss = constant iron loss."},
  ],
  "Power Systems": [
    {text:"Load factor = average demand /", opts:["Maximum demand","Minimum","Total energy","Installed capacity"], ans:"A", explain:"Load factor = average/peak demand. Indicates utilization."},
    {text:"Power factor =", opts:["P/S","S/P","Q/S","P/Q"], ans:"A", explain:"PF = P/S. Real power/apparent power. Higher is better."},
    {text:"Transmission line short line ABCD:", opts:["A=1,B=Z,C=0,D=1","A=cosh,B=Zc*sinh","A=0,B=1,C=Y,D=0","A=1,B=0,C=Y,D=1"], ans:"A", explain:"Short line: series impedance only. A=1,B=Z,C=0,D=1."},
    {text:"Per unit system advantage:", opts:["All values same","Base values cancel","No transformers","No phase shift"], ans:"B", explain:"Per unit: base values normalize quantities. Simplifies calculations."},
    {text:"Three phase power P = sqrt(3)*V_L*I_L*cos(phi). V_L is:", opts:["Phase voltage","Line voltage","Average","Max"], ans:"B", explain:"Three-phase: V_L = line voltage, I_L = line current."},
  ],
  "Control Systems": [
    {text:"Closed loop TF = G/(1+GH) for:", opts:["Positive feedback","Negative feedback","Open loop","Unity gain"], ans:"B", explain:"Closed loop = G/(1+GH) for negative feedback."},
    {text:"Type of system with 3 poles at origin:", opts:["Type 0","Type 1","Type 2","Type 3"], ans:"D", explain:"Type = poles at origin. 3 poles = Type 3."},
    {text:"Steady state error Type 1 for unit step:", opts:["0","1","Infinity","1/Kp"], ans:"A", explain:"Type 1: ess_step = 0. Perfect step tracking."},
    {text:"Routh array sign changes in first column =", opts:["0","1","Roots in RHS","2"], ans:"C", explain:"Sign changes in Routh first column = roots in RHS."},
    {text:"Phase margin measured at:", opts:["0 dB","180 deg","-180 deg","0 deg"], ans:"A", explain:"PM = 180 + phase_gc. Measured at gain crossover (0 dB)."},
  ],
  "Power Electronics": [
    {text:"Rectifier converts:", opts:["AC to DC","DC to AC","DC to DC","AC to AC"], ans:"A", explain:"Rectifier: AC to DC. Diodes or thyristors."},
    {text:"Inverter converts:", opts:["AC to DC","DC to AC","DC to DC","AC to AC"], ans:"B", explain:"Inverter: DC to AC. UPS, motor drives."},
    {text:"SCR is a:", opts:["Diode","BJT","4-layer PNPN thyristor","FET"], ans:"C", explain:"SCR: PNPN device. Gate triggered. Latching behavior."},
    {text:"Chopper is for:", opts:["AC-DC","DC-DC conversion","DC-AC","AC-AC"], ans:"B", explain:"Chopper: DC to DC. Step up/down via switching."},
    {text:"PWM varies:", opts:["Frequency only","Duty cycle","Voltage only","Current only"], ans:"B", explain:"PWM: controls output via duty cycle variation."},
  ],
  "Analog Electronics": [
    {text:"Ideal op-amp input resistance:", opts:["0","Infinity","1 Mohm","100 ohm"], ans:"B", explain:"Ideal op-amp: infinite input impedance, zero output impedance."},
    {text:"Inverting amplifier gain:", opts:["-Rf/Rin","Rf/Rin","1+Rf/Rin","-Rin/Rf"], ans:"A", explain:"Av = -Rf/Rin. Negative = 180 deg phase shift."},
    {text:"RC low-pass cutoff:", opts:["1/(2*pi*RC)","1/RC","2*pi*RC","RC"], ans:"A", explain:"fc = 1/(2*pi*RC). At fc: output = input/sqrt(2)."},
    {text:"Negative feedback increases:", opts:["Gain","Bandwidth","Distortion","Noise"], ans:"B", explain:"Negative feedback: reduces gain, increases bandwidth, reduces distortion."},
    {text:"RC coupling blocks:", opts:["AC","DC","Both","Nothing"], ans:"B", explain:"RC coupling: blocks DC, passes AC. Used in amplifiers."},
  ],
  "Digital Electronics": [
    {text:"Binary 1010 in decimal:", opts:["8","10","5","12"], ans:"B", explain:"1010 = 8+2 = 10."},
    {text:"Full adder has:", opts:["2 XOR + 2 AND + 1 OR","1 XOR + 2 AND + 1 OR","3 XOR","1 AND + 1 OR"], ans:"B", explain:"Full adder: Sum=A xor B xor Cin. Carry=AB+BCin+ACin."},
    {text:"One flip-flop stores:", opts:["1 bit","4 bits","8 bits","16 bits"], ans:"A", explain:"1 flip-flop = 1 bit storage."},
    {text:"JK FF with J=K=1 toggles on:", opts:["Rising edge","Falling edge","Both edges","Clock high"], ans:"A", explain:"JK at J=K=1: toggles on active clock edge (usually rising)."},
    {text:"Decade counter counts:", opts:["2 states","8 states","10 states","16 states"], ans:"C", explain:"Decade: 10 states (0-9). Mod-10 counter."},
  ],
  "Algorithms": [
    {text:"Binary search complexity:", opts:["O(n)","O(log n)","O(n^2)","O(1)"], ans:"B", explain:"Binary search sorted array: O(log n)."},
    {text:"Quick sort average:", opts:["O(n)","O(n log n)","O(n^2)","O(log n)"], ans:"B", explain:"Quick sort average O(n log n). Worst O(n^2)."},
    {text:"Dijkstra finds:", opts:["MST","Shortest path (non-negative)","Max flow","Topo sort"], ans:"B", explain:"Dijkstra: single-source shortest path, non-negative weights."},
    {text:"DFS uses:", opts:["Queue","Stack","Priority queue","Both"], ans:"B", explain:"DFS: stack (or recursion). BFS: queue."},
    {text:"DP key properties:", opts:["Greedy","Optimal substructure + overlapping","Random","Brute force"], ans:"B", explain:"DP: optimal substructure + overlapping subproblems."},
  ],
  "Data Structures": [
    {text:"Array random access:", opts:["O(n)","O(log n)","O(1)","O(n^2)"], ans:"C", explain:"Array: direct indexing O(1)."},
    {text:"Linked list insert at head:", opts:["O(n)","O(1)","O(log n)","O(n^2)"], ans:"B", explain:"Insert at head: O(1). Just pointer update."},
    {text:"Binary tree min height:", opts:["n","log2(n+1)","n/2","log2(n)"], ans:"B", explain:"Min height = floor(log2(n)) for complete binary tree."},
    {text:"Hash table avg search:", opts:["O(1)","O(n)","O(log n)","O(n^2)"], ans:"A", explain:"Hash table average O(1). Worst O(n) with collisions."},
    {text:"Stack follows:", opts:["FIFO","LIFO","Random","Sorted"], ans:"B", explain:"Stack: Last In First Out (LIFO)."},
  ],
  "DBMS": [
    {text:"Normalization eliminates:", opts:["Redundancy","Security","Speed","Users"], ans:"A", explain:"Normalization: removes redundancy and update anomalies."},
    {text:"SQL retrieve data:", opts:["INSERT","SELECT","UPDATE","DELETE"], ans:"B", explain:"SELECT retrieves. INSERT adds, UPDATE modifies, DELETE removes."},
    {text:"ACID D stands for:", opts:["Durability","Data","Database","Directory"], ans:"A", explain:"ACID: Atomicity, Consistency, Isolation, Durability."},
    {text:"Primary key must be:", opts:["Null","Unique and Not Null","Duplicate","Optional"], ans:"B", explain:"Primary key: uniquely identifies. Cannot be NULL or duplicate."},
    {text:"COMMIT makes changes:", opts:["Temporary","Permanent","Deleted","Hidden"], ans:"B", explain:"COMMIT: all changes become permanent in database."},
  ],
  "Operating Systems": [
    {text:"FCFS stands for:", opts:["Fastest Completion","First Come First Serve","Fair Cycle","Fixed Cycle"], ans:"B", explain:"FCFS: First Come First Serve. Non-preemptive."},
    {text:"Round Robin uses:", opts:["Queue","Priority","Time quantum","SJF"], ans:"C", explain:"Round Robin: preemptive with fixed time quantum."},
    {text:"Deadlock necessary conditions: mutual exclusion + hold and wait +", opts:["Preemption","Circular wait","Speed","Memory"], ans:"B", explain:"Deadlock: 4 conditions - mutual exclusion, hold&wait, no preemption, circular wait."},
    {text:"Semaphore > 0 means:", opts:["Deadlock","Available resources","Waiting process","Error"], ans:"B", explain:"Semaphore: positive value = available resources."},
    {text:"Page fault occurs when:", opts:["Page in memory","Page not in memory","Page modified","Page locked"], ans:"B", explain:"Page fault: required page not in physical memory."},
  ],
  "Computer Networks": [
    {text:"HTTP default port:", opts:["21","80","443","25"], ans:"B", explain:"HTTP: port 80. HTTPS: 443. FTP: 21."},
    {text:"Class B IP range:", opts:["1-126","128-191","192-223","224-239"], ans:"B", explain:"Class B: 128.0.0.0 to 191.255.255.255. First byte 128-191."},
    {text:"TCP is:", opts:["Connectionless","Connection-oriented","Unreliable","Fast"], ans:"B", explain:"TCP: connection-oriented (3-way handshake). Reliable."},
    {text:"Subnet mask /24:", opts:["255.0.0.0","255.255.0.0","255.255.255.0","255.255.255.255"], ans:"C", explain:"/24: 24 bits network. Mask: 255.255.255.0."},
    {text:"CSMA/CD used in:", opts:["Token Ring","Ethernet","WiFi","Bluetooth"], ans:"B", explain:"CSMA/CD: Ethernet. Carrier Sense Multiple Access with Collision Detect."},
  ],
  "Computer Organization": [
    {text:"CPU consists of:", opts:["ALU only","ALU + CU + Registers","Memory only","I/O"], ans:"B", explain:"CPU: ALU + Control Unit + Registers."},
    {text:"Cache memory is:", opts:["Slower than RAM","Faster than RAM","Same speed","Non-volatile"], ans:"B", explain:"Cache: fastest memory. SRAM-based."},
    {text:"Pipelining increases:", opts:["Latency","Throughput","Memory","Power"], ans:"B", explain:"Pipelining: increases throughput (instructions per cycle)."},
    {text:"Little endian stores:", opts:["MSB first","LSB first","MSB last","Random"], ans:"B", explain:"Little endian: LSB at lowest address."},
    {text:"Instruction cycle:", opts:["Fetch only","Fetch, Decode, Execute","Execute only","Decode only"], ans:"B", explain:"Cycle: Fetch -> Decode -> Execute (+ store/writeback)."},
  ],
  "Mathematics": [
    {text:"Derivative of x^3:", opts:["3x^2","x^2","3x","x^3/3"], ans:"A", explain:"d/dx(x^3) = 3x^2."},
    {text:"Integral of 1/x:", opts:["x","ln|x|","1/x^2","e^x"], ans:"B", explain:"integral(1/x)dx = ln|x| + C."},
    {text:"lim(x->0) sin(x)/x =", opts:["0","1","Infinity","Undefined"], ans:"B", explain:"Standard limit: lim(x->0) sin(x)/x = 1."},
    {text:"Matrix multiplication AB exists when:", opts:["Same rows","Cols(A)=Rows(B)","Same size","Rows(A)=Cols(B)"], ans:"B", explain:"AB: columns of A = rows of B. Result: m x p."},
    {text:"Eigenvalues of identity matrix:", opts:["0","All 1","All 0","Depends"], ans:"B", explain:"I*v = 1*v. All eigenvalues of identity = 1."},
  ],
  "General Aptitude": [
    {text:"If x + 1/x = 3, then x^2 + 1/x^2 =", opts:["7","9","5","11"], ans:"A", explain:"Square: x^2 + 2 + 1/x^2 = 9. So x^2 + 1/x^2 = 7."},
    {text:"Analogy: Book:Reading :: Fork:", opts:["Drawing","Eating","Writing","Singing"], ans:"B", explain:"Book used for reading. Fork used for eating."},
    {text:"Average of 10,20,30,40,50:", opts:["30","25","35","20"], ans:"A", explain:"Sum=150. n=5. Average=150/5=30."},
    {text:"Pipe A fills in 4hr, B in 6hr. Together:", opts:["2.4 hrs","3 hrs","4 hrs","5 hrs"], ans:"A", explain:"1/t=1/4+1/6=5/12. t=12/5=2.4 hours."},
    {text:"Successor of predecessor of 100:", opts:["99","100","101","98"], ans:"B", explain:"Predecessor(100)=99. Successor(99)=100."},
  ],
  "Statistics": [
    {text:"Mean of 2,4,6,8,10:", opts:["6","5","7","4"], ans:"A", explain:"Sum=30, n=5. Mean=30/5=6."},
    {text:"Variance measures:", opts:["Central tendency","Spread/dispersion","Shape","Location"], ans:"B", explain:"Variance: average squared deviation from mean. Measures spread."},
    {text:"Standard deviation is:", opts:["Mean","Sqrt of variance","Variance","Median"], ans:"B", explain:"SD = sqrt(variance). Same units as original data."},
    {text:"Correlation range:", opts:["0 to 1","-1 to 1","-inf to inf","0 to 100"], ans:"B", explain:"Correlation r: -1 (perfect neg) to +1 (perfect pos)."},
    {text:"Normal distribution: mean = median =", opts:["Mode","Mean","SD","0"], ans:"B", explain:"Normal: symmetric. Mean = Median = Mode."},
  ],
  "Probability": [
    {text:"P(A U B) = P(A)+P(B)-P(A n B). n means:", opts:["Union","Intersection","Complement","Empty"], ans:"B", explain:"n = intersection. Addition rule."},
    {text:"E[X] for uniform [a,b]:", opts:["(a+b)/2","(a-b)/2","a*b","(a+b)"], ans:"A", explain:"Uniform: E[X] = (a+b)/2. Midpoint."},
    {text:"Bayes theorem gives:", opts:["Prior","Posterior probability","Likelihood","Evidence"], ans:"B", explain:"Bayes: updates prior to posterior using new evidence."},
    {text:"Variance of Bernoulli(p):", opts:["p","p(1-p)","p^2","1-p"], ans:"B", explain:"Bernoulli: Var(X) = p(1-p). Mean = p."},
    {text:"Poisson: lambda =", opts:["Mean only","Mean = Variance","SD","Median"], ans:"B", explain:"Poisson: lambda = mean = variance."},
  ],
  "Calculus": [
    {text:"integral x^2 dx =", opts:["x^3/3+C","2x+C","x^3+C","x/3+C"], ans:"A", explain:"integral(x^n)dx=x^(n+1)/(n+1). n=2: x^3/3+C."},
    {text:"d/dx[sin(x)] =", opts:["cos(x)","-sin(x)","tan(x)","-cos(x)"], ans:"A", explain:"d/dx[sin(x)] = cos(x). d/dx[cos(x)] = -sin(x)."},
    {text:"lim(x->0) sin(x)/x =", opts:["0","1","Infinity","Undefined"], ans:"B", explain:"Standard limit: lim(x->0) sin(x)/x = 1."},
    {text:"Maxima occurs where:", opts:["f=0","f=0 and f<0","f>0","f=0 and second deriv<0"], ans:"D", explain:"Maxima: critical point f=0 + second derivative negative."},
    {text:"Taylor series e^x at 0:", opts:["1+x+x^2/2+...","x+x^2+...","1+x^2+...","1-x+..."], ans:"A", explain:"e^x = 1 + x + x^2/2! + x^3/3! + ..."},
  ],
  "Linear Algebra": [
    {text:"det([[a,b],[c,d]]) =", opts:["ad-bc","ad+bc","ac-bd","ab-cd"], ans:"A", explain:"2x2 determinant: ad - bc."},
    {text:"Rank of I_n:", opts:["0","1","n","n-1"], ans:"C", explain:"Identity: all n rows independent. Rank = n."},
    {text:"det(A)=0 means A is:", opts:["Orthogonal","Singular","Identity","Invertible"], ans:"B", explain:"det=0 => singular (non-invertible)."},
    {text:"Eigenvalues of diagonal matrix:", opts:["All zero","Diagonal elements","Trace","1"], ans:"B", explain:"Diagonal: eigenvalues = diagonal elements."},
    {text:"Dot product of orthogonal vectors:", opts:["1","0","-1","Infinity"], ans:"B", explain:"Orthogonal: angle=90. cos(90)=0. Dot product=0."},
  ],
  "Algebra": [
    {text:"Order of Z_12 under addition:", opts:["6","12","24","1"], ans:"B", explain:"Z_12={0,1,...,11}. 12 elements. Order=12."},
    {text:"Ring has:", opts:["Addition only","Addition and multiplication","Division only","Multiplication only"], ans:"B", explain:"Ring: two operations (+,*) satisfying ring axioms."},
    {text:"Field has multiplicative inverse for:", opts:["All elements","Non-zero elements","Zero","Identity only"], ans:"B", explain:"Field: every non-zero element has multiplicative inverse."},
    {text:"Order of g in group:", opts:["g^2=e","Smallest n: g^n=e","g^0","g^1"], ans:"B", explain:"Order: smallest positive n where g^n = e (identity)."},
    {text:"S_3 has order:", opts:["3","6","9","12"], ans:"B", explain:"S_n has n! elements. S_3: 3! = 6."},
  ],
  "Analysis": [
    {text:"Continuous function on [a,b] is:", opts:["Unbounded","Bounded and attains bounds","Periodic","Monotonic"], ans:"B", explain:"Extreme Value Theorem: continuous on [a,b] => bounded + attains max/min."},
    {text:"Riemann integrable requires:", opts:["Continuous","Bounded + finite discontinuities","Differentiable","Monotone"], ans:"B", explain:"Riemann: bounded + discontinuities have measure zero."},
    {text:"Harmonic series sum 1/n:", opts:["Converges","Diverges","Converges to 1","Oscillates"], ans:"B", explain:"Harmonic series diverges. Sum(1/n) = infinity."},
    {text:"Cauchy sequence: |a_n - a_m| < epsilon for:", opts:["n>N only","n,m > N","all n,m","n+m>N"], ans:"B", explain:"Cauchy: |a_n-a_m|<epsilon for all n,m>N."},
    {text:"Uniform limit of continuous functions is:", opts:["Discontinuous","Continuous","Differentiable","Bounded"], ans:"B", explain:"Uniform convergence preserves continuity."},
  ],
  "Topology": [
    {text:"Open set in R:", opts:["Contains all limit points","Every point has epsilon-neighborhood in set","Closed","Bounded"], ans:"B", explain:"Open: every point has neighborhood fully inside the set."},
    {text:"Closed set contains all its:", opts:["Interior","Boundary","Limit points","Exterior"], ans:"C", explain:"Closed: contains all limit points (includes boundary)."},
    {text:"Compact in R^n means:", opts:["Open and bounded","Closed and bounded","Closed only","Bounded only"], ans:"B", explain:"Heine-Borel: compact in R^n iff closed and bounded."},
    {text:"Connected set:", opts:["Two disjoint open","Cannot be union of disjoint open sets","Open","Closed"], ans:"B", explain:"Connected: cannot be separated into disjoint non-empty open sets."},
    {text:"Continuous image of compact is:", opts:["Open","Compact","Disconnected","Unbounded"], ans:"B", explain:"Continuous image of compact is compact."},
  ],
  "Complex Analysis": [
    {text:"Cauchy-Riemann equations:", opts:["du/dx=dv/dy","Both u_x=v_y AND u_y=-v_x","du/dx=-dv/dy","Only u_x=v_y"], ans:"B", explain:"CR: u_x=v_y AND u_y=-v_x. Both required for analyticity."},
    {text:"Residue of 1/z at z=0:", opts:["0","1","Infinity","-1"], ans:"B", explain:"Residue of 1/z at 0 = 1. Laurent coeff of 1/z."},
    {text:"Cauchy integral of analytic f on closed curve:", opts:["0","2*pi*i","1","Infinity"], ans:"A", explain:"Cauchy theorem: integral of analytic function on closed contour = 0."},
    {text:"Entire function:", opts:["Continuous","Analytic everywhere","Bounded","Polynomial"], ans:"B", explain:"Entire: analytic on all of C."},
    {text:"Liouville: bounded entire function is:", opts:["Polynomial","Constant","Exponential","Trigonometric"], ans:"B", explain:"Liouville: bounded entire => constant."},
  ],
  "Real Analysis": [
    {text:"Monotone bounded sequence is:", opts:["Divergent","Convergent","Oscillating","Undefined"], ans:"B", explain:"Monotone Convergence: monotone bounded sequence converges."},
    {text:"Series converges iff:", opts:["Terms->0","Partial sums Cauchy","Monotone","Bounded"], ans:"B", explain:"Series converges iff partial sums form Cauchy sequence."},
    {text:"Uniform limit of continuous functions is:", opts:["Discontinuous","Continuous","Differentiable","Bounded"], ans:"B", explain:"Uniform convergence preserves continuity."},
    {text:"Riemann integrable requires:", opts:["Continuous","Bounded + finite discontinuities","Monotone","Differentiable"], ans:"B", explain:"Riemann: bounded + set of discontinuities has measure zero."},
    {text:"Cauchy criterion for sequences:", opts:["|a_n|<epsilon","|a_n-a_m|<epsilon for n,m>N","a_n converges","a_n=0"], ans:"B", explain:"Cauchy: terms get arbitrarily close for n,m>N."},
  ],
  "Physics": [
    {text:"Newton 2nd law: F =", opts:["ma","m/v","mv","m/a"], ans:"A", explain:"F=ma. Force = mass x acceleration."},
    {text:"Kinetic energy =", opts:["mgh","1/2 mv^2","mv","1/2 kx^2"], ans:"B", explain:"KE=1/2*m*v^2. PE_grav=mgh. PE_spring=1/2kx^2."},
    {text:"Coulombs law force:", opts:["Always attractive","Attractive or repulsive","Zero","Constant"], ans:"B", explain:"Like charges repel, opposite attract. Sign of product determines."},
    {text:"Wave speed v =", opts:["f*lambda","f/lambda","lambda/f","1/(f*lambda)"], ans:"A", explain:"v = f * lambda. Wave speed = frequency x wavelength."},
    {text:"Photoelectric effect shows light is:", opts:["Wave only","Particle-like","Sound","Matter"], ans:"B", explain:"Photoelectric: light as photons. E=hf. Particle behavior."},
  ],
  "Optics": [
    {text:"Lens formula 1/f = 1/v + 1/u. u is:", opts:["Positive","Negative (real object)","Zero","Infinity"], ans:"B", explain:"Cartesian: object distance negative for real objects."},
    {text:"Total internal reflection requires:", opts:["n1>n2","n1<n2","n1=n2","Any"], ans:"A", explain:"TIR: n1>n2 + incidence angle > critical angle."},
    {text:"Youngs fringe width:", opts:["lambda*D/d","lambda*d/D","D/lambda","d/lambda"], ans:"A", explain:"Beta = lambda*D/d. Proportional to wavelength."},
    {text:"Refractive index n =", opts:["c/v","v/c","c*v","c+v"], ans:"A", explain:"n=c/v. c=light in vacuum, v=in medium."},
    {text:"Diffraction is:", opts:["Reflection","Bending around obstacle","Refraction","Polarization"], ans:"B", explain:"Diffraction: bending/spreading around obstacle or aperture."},
  ],
  "Electromagnetism": [
    {text:"Electric field point charge: E =", opts:["kq/r","kq/r^2","kq^2/r","k/r^2"], ans:"B", explain:"E=kq/r^2. Coulomb inverse square law."},
    {text:"Gauss law: flux =", opts:["q/epsilon_0","0","q","epsilon_0*q"], ans:"A", explain:"Gauss: flux = Q_enclosed/epsilon_0."},
    {text:"B around long wire:", opts:["mu_0*I/(2*pi*r)","mu_0*I/(4*pi*r)","mu_0*I/r","I/(2*pi*r)"], ans:"A", explain:"Amperes: B=mu_0*I/(2*pi*r)."},
    {text:"EM wave speed in vacuum:", opts:["3x10^8 m/s","3x10^6 m/s","Infinity","0"], ans:"A", explain:"c=3x10^8 m/s. Speed of light."},
    {text:"Faradays law: emf =", opts:["-d(phi)/dt","d(phi)/dt","phi","phi/t"], ans:"A", explain:"Faraday: emf=-d(phi)/dt. Negative sign = Lenz law."},
  ],
  "Quantum Mechanics": [
    {text:"De Broglie: lambda = h/p. h is:", opts:["Plancks constant","Reduced Planck","Boltzmann","Gas"], ans:"A", explain:"De Broglie: lambda=h/p. h=6.626e-34 Js."},
    {text:"Heisenberg: dx*dp >=", opts:["h","h-bar/2","h/(4*pi)","h/2"], ans:"C", explain:"dx*dp >= hbar/2 = h/(4*pi)." },
    {text:"Particle in 1D box (n=1) energy:", opts:["0","h^2/(8mL^2)","h^2/(2mL^2)","h/mL"], ans:"B", explain:"Particle in box E1 = h^2/(8mL^2). Ground state non-zero."},
    {text:"Normalization means:", opts:["Wavefunction real","Integral |psi|^2 = 1","psi=0 at boundary","E>0"], ans:"B", explain:"Normalization: integral |psi|^2 dx = 1. Total probability = 1."},
    {text:"Schrodinger equation is:", opts:["Classical","Wave equation for QM","Relativistic","Thermodynamic"], ans:"B", explain:"Schrodinger: fundamental equation of quantum mechanics."},
  ],
  "Communication": [
    {text:"AM modulation index must be:", opts:["> 1","<= 1","= 0",">= 2"], ans:"B", explain:"AM index <= 1. >1 causes over-modulation."},
    {text:"Nyquist rate for bandwidth B:", opts:["B","2B","B/2","4B"], ans:"B", explain:"Nyquist: sampling rate >= 2*B."},
    {text:"Shannon capacity C =", opts:["B*log2(1+SNR)","B*SNR","log2(B*SNR)","B/SNR"], ans:"A", explain:"Shannon-Hartley: C = B*log2(1+S/N)."},
    {text:"FM bandwidth (Carson):", opts:["2*(df+fm)","df+fm","2*df","2*fm"], ans:"A", explain:"Carson: BW = 2*(delta_f + f_m)."},
    {text:"ASK, FSK, PSK are:", opts:["Analog modulation","Digital modulation","Encoding","Multiplexing"], ans:"B", explain:"ASK/FSK/PSK: digital modulation for binary data."},
  ],
  "EMFT": [
    {text:"Wave speed in medium:", opts:["c","c/sqrt(epsilon_r)","c*sqrt(epsilon_r)","1/c"], ans:"B", explain:"v=c/sqrt(epsilon_r). Slower in dielectric."},
    {text:"Intrinsic impedance of free space:", opts:["120*pi ohm","377 ohm","50 ohm","75 ohm"], ans:"B", explain:"eta_0 = 377 ohm (approx 120*pi ohm)."},
    {text:"Skin depth delta =", opts:["1/alpha","1/beta","1/gamma","sqrt(2/(omega*mu*sigma))"], ans:"D", explain:"Skin depth = 1/alpha = sqrt(2/(omega*mu*sigma))."},
    {text:"Poynting vector represents:", opts:["E-field","B-field","Power flow","Energy stored"], ans:"C", explain:"Poynting S = E x H. Power flow direction and magnitude."},
    {text:"Z0 of lossless line:", opts:["sqrt(L/C)","L/C","sqrt(LC)","R+jwL"], ans:"A", explain:"Z0 = sqrt(L/C) for lossless transmission line."},
  ],
  "Microprocessor": [
    {text:"8085 has how many pins:", opts:["28","40","16","64"], ans:"B", explain:"8085: 40-pin DIP. 8-bit microprocessor."},
    {text:"Stack operates in:", opts:["FIFO","LIFO","Random","Sorted"], ans:"B", explain:"Stack: LIFO (Last In First Out). PUSH/POP."},
    {text:"Program counter holds:", opts:["Data","Next instruction address","Result","Operand"], ans:"B", explain:"PC: address of next instruction to fetch."},
    {text:"INTA signal is for:", opts:["Interrupt Acknowledge","Memory read","I/O write","Reset"], ans:"A", explain:"INTA: Interrupt Acknowledge from processor."},
    {text:"HLD/HLDA are for:", opts:["Interrupt","DMA","Reset","I/O"], ans:"B", explain:"HLD/HLDA: Hold/Hold Acknowledge for DMA."},
  ],
  "Genetics": [
    {text:"Mendels law of segregation:", opts:["One gene","Alleles of one gene separate","Two genes","Many genes"], ans:"B", explain:"Segregation: two alleles separate during gamete formation."},
    {text:"DNA double helix by:", opts:["Mendel","Watson and Crick","Darwin","Morgan"], ans:"B", explain:"Watson and Crick: double helix DNA structure."},
    {text:"Linked genes:", opts:["Assort independently","Do not assort independently","Different chromosomes","No recombination"], ans:"B", explain:"Linked: same chromosome. Do not follow independent assortment."},
    {text:"Mutations are:", opts:["Always harmful","Source of variation","Always beneficial","Rare only"], ans:"B", explain:"Mutations: source of variation. Can be harmful, neutral, or beneficial."},
    {text:"S_3 has order:", opts:["3","6","9","12"], ans:"B", explain:"S_3: 3! = 6. Symmetric group on 3 elements."},
  ],
  "Molecular Biology": [
    {text:"DNA replication is:", opts:["Conservative","Semiconservative","Disruptive","Linear"], ans:"B", explain:"Semiconservative: each new DNA has one old + one new strand."},
    {text:"Transcription produces:", opts:["DNA","RNA","Protein","Lipid"], ans:"B", explain:"Transcription: DNA -> RNA (mRNA, tRNA, rRNA)."},
    {text:"Translation occurs at:", opts:["Nucleus","Ribosome","Mitochondria","ER"], ans:"B", explain:"Translation: mRNA -> protein at ribosome."},
    {text:"Genetic code is:", opts:["Ambiguous","Universal and degenerate","Unique per species","Non-overlapping"], ans:"B", explain:"Nearly universal. 64 codons for 20 amino acids (degenerate)."},
    {text:"mRNA carries info from:", opts:["Ribosome to DNA","DNA to ribosome","Protein to DNA","DNA to protein"], ans:"B", explain:"mRNA: messenger from DNA (nucleus) to ribosome (cytoplasm)."},
  ],
  "Biochemistry": [
    {text:"ATP full form:", opts:["Adenine Triphosphate","Adenosine Triphosphate","Adenosine Tetraphosphate","Adenine Tri Phosphate"], ans:"B", explain:"ATP = Adenosine Triphosphate. Main energy currency."},
    {text:"Enzymes are mostly:", opts:["Carbohydrates","Proteins","Lipids","Nucleic acids"], ans:"B", explain:"Enzymes: mostly proteins. Some RNA (ribozymes) also catalytic."},
    {text:"Active site is where:", opts:["Inhibition","Substrate binds","Product released","Cofactor made"], ans:"B", explain:"Active site: substrate binding region. Lock-key/induced fit."},
    {text:"Glycolysis occurs in:", opts:["Nucleus","Cytoplasm","Mitochondria","ER"], ans:"B", explain:"Glycolysis: cytoplasm. Glucose -> 2 pyruvate + 2 ATP."},
    {text:"Km indicates:", opts:["Vmax","Enzyme affinity","Enzyme concentration","Reaction rate"], ans:"B", explain:"Km: substrate concentration at half Vmax. Low Km = high affinity."},
  ],
  "Ecology": [
    {text:"Population density =", opts:["N/A","N/S","S/N","N*S"], ans:"B", explain:"Density = N/S. N=number, S=area/volume."},
    {text:"r-selected species produce:", opts:["Few offspring","Many small offspring","Large offspring","None"], ans:"B", explain:"r-strategists: many small offspring in unstable environments."},
    {text:"Biomass pyramid in ocean often:", opts:["Upright","Inverted","Flat","Random"], ans:"B", explain:"Ocean: phytoplankton reproduce fast, zooplankton accumulate. Inverted."},
    {text:"Carrying capacity is:", opts:["r","K","N","dN/dt"], ans:"B", explain:"K = carrying capacity. Max population environment can sustain."},
    {text:"10% energy transfer between trophic levels:", opts:["Lindemans law","Tens rule","Both","Neither"], ans:"C", explain:"10% rule (Lindeman): ~10% energy transfers between levels."},
  ],
  "Material Science": [
    {text:"Ferrite is:", opts:["Iron ceramic","Pure iron","Steel","Aluminum"], ans:"A", explain:"Ferrite: iron oxide based ceramic magnetic material."},
    {text:"Annealing does:", opts:["Harden","Softens/relieves stress","Polish","Color"], ans:"B", explain:"Annealing: heat treatment to soften, relieve stress, improve ductility."},
    {text:"Crystal structure of iron at room temp:", opts:["FCC","BCC (alpha)","HCP","Simple cubic"], ans:"B", explain:"Alpha iron: BCC. Gamma iron (high temp): FCC."},
    {text:"Brass is:", opts:["Cu+Zn","Cu+Sn","Fe+C","Al+Cu"], ans:"A", explain:"Brass: Cu+Zn. Bronze: Cu+Sn."},
    {text:"Vickers hardness test uses:", opts:["Brinell ball","Diamond pyramid","Rockwell cone","Knoop diamond"], ans:"B", explain:"Vickers: diamond pyramid indenter."},
  ],
  "Geology": [
    {text:"Mohs hardest mineral:", opts:["Corundum","Diamond","Quartz","Topaz"], ans:"B", explain:"Diamond: hardest (10). Talc: softest (1)."},
    {text:"Igneous rock from:", opts:["Sedimentation","Cooled magma/lava","Pressure","Heat only"], ans:"B", explain:"Igneous: solidified from magma/lava."},
    {text:"Moho discontinuity separates:", opts:["Crust-mantle","Mantle-core","Core layers","Crust layers"], ans:"A", explain:"Moho: crust-mantle boundary."},
    {text:"Plate tectonics driven by:", opts:["Solar","Mantle convection","Moon","Wind"], ans:"B", explain:"Mantle convection drives plate movement."},
    {text:"Most abundant crust mineral:", opts:["Quartz","Feldspar","Mica","Olivine"], ans:"B", explain:"Feldspar: ~60% of crust. Most abundant mineral group."},
  ],
  "Geotechnical": [
    {text:"Bearing capacity depends on:", opts:["Color","Soil props + foundation","Weather","Time"], ans:"B", explain:"Bearing capacity: soil strength + foundation dimensions + depth."},
    {text:"Atterberg limits:", opts:["Shrinkage, Plastic, Liquid","Only Liquid","Only Shrinkage","None"], ans:"A", explain:"Atterberg: SL, PL, LL. Clay consistency limits."},
    {text:"Active earth pressure Rankine:", opts:["Ka=1-sin(phi)","Ka=sin(phi)","Ka=tan^2(45-phi/2)","Kp=tan^2(45+phi/2)"], ans:"C", explain:"Ka = tan^2(45 - phi/2). Active pressure coeff."},
    {text:"Permeability measured by:", opts:["Direct shear","Constant/falling head","Triaxial","Unconfined"], ans:"B", explain:"Permeability: constant head (coarse) or falling head (fine) test."},
    {text:"Consolidation is:", opts:["Immediate","Time-dependent settlement","Elastic","Elasto-plastic"], ans:"B", explain:"Consolidation: gradual water expulsion. Time-dependent."},
  ],
  "Surveying": [
    {text:"Chain survey for:", opts:["Hilly","Small flat areas","Large","Forests"], ans:"B", explain:"Chain surveying: small, open, flat areas. Simple."},
    {text:"Benchmark is:", opts:["Bench","Fixed reference of known RL","Staff","Temp point"], ans:"B", explain:"BM: fixed reference point with known Reduced Level."},
    {text:"Chain too long causes area:", opts:["Overestimated","Underestimated","No effect","Random"], ans:"A", explain:"Chain too long: measured distance < actual. Area overestimated."},
    {text:"Prismatic compass measures:", opts:["Distance","Bearing","Elevation","Temperature"], ans:"B", explain:"Prismatic compass: magnetic bearing/azimuth."},
    {text:"Leveling finds:", opts:["Horizontal distances","Elevation differences","Areas","Directions"], ans:"B", explain:"Leveling: relative elevations (RL) of points."},
  ],
  "Transportation": [
    {text:"IRC camber for:", opts:["Drainage","Speed","Comfort","Safety"], ans:"A", explain:"Camber: cross slope for rainwater drainage."},
    {text:"PCI range:", opts:["0-10","0-100","1-5","0-1"], ans:"B", explain:"PCI: 0 (failed) to 100 (excellent)."},
    {text:"OBC by:", opts:["Marshall","CBR","RD","FSB"], ans:"A", explain:"Marshall method: determines Optimum Bitumen Content."},
    {text:"Traffic engineering studies:", opts:["Materials","Flow, safety, operations","Soil","Structures"], ans:"B", explain:"Traffic: characteristics, flow, safety, control."},
    {text:"Geometric design considers:", opts:["Only cost","Speed, sight distance","Only material","Weather"], ans:"B", explain:"Geometric: alignment, sight distance, cross-section, intersections."},
  ],
  "Geophysics": [
    {text:"P-waves are:", opts:["Transverse","Longitudinal","Surface","Love"], ans:"B", explain:"P-waves: primary, compressional, longitudinal."},
    {text:"Moho separates:", opts:["Crust-mantle","Mantle-core","Core layers","Crust layers"], ans:"A", explain:"Moho: crust-mantle boundary (Mohorovicic)."},
    {text:"Gravity survey measures:", opts:["Magnetic field","Gravity anomalies","Seismic speed","Electric field"], ans:"B", explain:"Gravity: maps Bouguer anomalies for density variations."},
    {text:"Reflection seismic uses:", opts:["Reflected waves","Refracted","Direct","Surface"], ans:"A", explain:"Reflection: analyzes reflected waves for subsurface."},
    {text:"Magnetic survey detects:", opts:["Gravity","Magnetic anomalies","Seismic","Electrical"], ans:"B", explain:"Magnetic: measures total field. Detects magnetic minerals."},
  ],
  "Chemistry": [
    {text:"pH of neutral water:", opts:["0","7","14","1"], ans:"B", explain:"pH=-log[H+]. Neutral: [H+]=10^-7. pH=7."},
    {text:"Balance: H2+O2->H2O. Coeff of H2O:", opts:["1","2","3","4"], ans:"B", explain:"Balanced: 2H2+O2->2H2O. Coeff of H2O=2."},
    {text:"Covalent bond by:", opts:["Transfer","Sharing","Attraction","Ions"], ans:"B", explain:"Covalent: sharing electrons. Ionic: transfer."},
    {text:"Ideal gas: PV =", opts:["nRT","nT/R","RT/n","n/R"], ans:"A", explain:"Ideal gas: PV=nRT. R=8.314 J/(mol*K)."},
    {text:"Oxidation is:", opts:["Gain e-","Loss of e-","Gain H","Loss of O"], ans:"B", explain:"OIL: Oxidation Is Loss of electrons."},
  ],
  "Organic Chemistry": [
    {text:"Alcohol functional group:", opts:["-COOH","-OH","-CHO","-NH2"], ans:"B", explain:"Alcohol: -OH. Carboxylic: -COOH."},
    {text:"Benzene formula:", opts:["C6H6","C6H12","C2H6","CH4"], ans:"A", explain:"Benzene: C6H6. Aromatic ring."},
    {text:"SN1 reaction:", opts:["Bimolecular","Unimolecular","Termolecular","No mechanism"], ans:"B", explain:"SN1: unimolecular nucleophilic substitution. Two-step."},
    {text:"Aldehyde group:", opts:["-OH","-CHO","-COOH","-NH2"], ans:"B", explain:"Aldehyde: -CHO at end of carbon chain."},
    {text:"Alkane formula:", opts:["CnH2n","CnH2n+2","CnH2n-2","CnHn"], ans:"B", explain:"Alkane: CnH2n+2. Saturated hydrocarbon."},
  ],
  "Inorganic Chemistry": [
    {text:"Coordination number octahedral:", opts:["4","6","2","8"], ans:"B", explain:"Octahedral: 6 ligands. CN = 6."},
    {text:"Crystal field splitting param:", opts:["alpha","Delta_o (10Dq)","beta","gamma"], ans:"B", explain:"Delta_o: octahedral splitting. Delta_t approx 4/9 Delta_o."},
    {text:"d-block are:", opts:["Noble gases","Transition metals","Alkali","Halogens"], ans:"B", explain:"d-block: transition metals. Incomplete d subshell."},
    {text:"Strongest field ligand:", opts:["I-","CN-","F-","H2O"], ans:"B", explain:"Spectrochemical: CN- strongest. I- weakest."},
    {text:"Werner theory explains:", opts:["Bonding","CN + geometry","Color","Magnetism"], ans:"B", explain:"Werner: primary/secondary valency. Coordination chemistry."},
  ],
  "Physical Chemistry": [
    {text:"First law cyclic process: dU =", opts:["Q","0","W","Q+W"], ans:"B", explain:"Cyclic: system returns to initial. dU=0. Q=W."},
    {text:"First order rate law: rate =", opts:["k[A]","k[A]^2","k[A]^0","k"], ans:"A", explain:"First order: rate = k[A]. ln[A]=ln[A0]-kt."},
    {text:"Activation energy from Arrhenius:", opts:["Increases T","Slope ln(k) vs 1/T","ln(k)","1/T"], ans:"B", explain:"Arrhenius: slope of ln(k) vs 1/T = -Ea/R."},
    {text:"Gibbs at equilibrium:", opts:["G>0","G=0","G<0","G=H"], ans:"B", explain:"Equilibrium: dG=0. Spontaneous: dG<0."},
    {text:"pH+pOH at 25C:", opts:["0","7","14","1"], ans:"C", explain:"At 25C: pH+pOH=14. Kw=10^-14."},
  ],
  "Textile Fibers": [
    {text:"Cotton is:", opts:["Synthetic","Natural cellulosic","Protein","Mineral"], ans:"B", explain:"Cotton: natural cellulosic. Cellulose polymer."},
    {text:"Polyester is:", opts:["Natural","Synthetic polymer","Protein","Regenerated"], ans:"B", explain:"Polyester: synthetic polymer fiber (PET)."},
    {text:"Wool is:", opts:["Cellulosic","Protein (keratin)","Synthetic","Cellulose acetate"], ans:"B", explain:"Wool: natural protein fiber. Keratin-based."},
    {text:"Viscose is:", opts:["Natural","Regenerated cellulosic","Synthetic","Mineral"], ans:"B", explain:"Viscose: regenerated cellulose. Rayon family."},
    {text:"Moisture regain cotton:", opts:["~2%","~8%","~15%","~0.5%"], ans:"B", explain:"Cotton: ~7-8% moisture regain at standard conditions."},
  ],
  "Petroleum Chemistry": [
    {text:"API gravity is:", opts:["Density measure","Viscosity","Sulfur","Pour point"], ans:"A", explain:"API gravity: density measure. Higher API = lighter crude."},
    {text:"Refining first step:", opts:["Cracking","Distillation","Polymers","Blending"], ans:"B", explain:"Refining: fractional distillation first. Separates by boiling range."},
    {text:"Octane number measures:", opts:["Diesel quality","Anti-knock quality","Viscosity","Sulfur"], ans:"B", explain:"Octane: resistance to knocking. Higher = better gasoline."},
    {text:"FCC uses:", opts:["Heat only","Zeolite catalyst","Pressure only","Solvent"], ans:"B", explain:"FCC: zeolite catalyst converts heavy to light fractions."},
    {text:"Natural gas major component:", opts:["Ethane","Methane","Propane","Butane"], ans:"B", explain:"Natural gas: primarily methane (CH4). 70-90%."},
  ],
  "Architecture": [
    {text:"Design basis includes:", opts:["Aesthetics only","Function, structure, climate","Cost only","Material only"], ans:"B", explain:"Design: function, structure, climate, context, aesthetics."},
    {text:"Golden ratio approx:", opts:["1.414","1.618","2.0","3.14"], ans:"B", explain:"phi = (1+sqrt(5))/2 approx 1.618."},
    {text:"RCC =", opts:["Reinforced Cement Concrete","Ready Cement","Rolled Concrete","Rock Cement"], ans:"A", explain:"RCC: Reinforced Cement Concrete. Steel bars in concrete."},
    {text:"Hot-dry climate design:", opts:["Insulation only","Thermal mass + ventilation","Glazing only","Heating"], ans:"B", explain:"Hot-dry: thermal mass + ventilation + shading."},
    {text:"Load bearing vs frame:", opts:["Same","Frame uses columns/beams","Walls carry","None"], ans:"B", explain:"Frame: columns+beams carry load. Walls just partition."},
  ],
  "Agriculture": [
    {text:"Green revolution in India:", opts:["Animal husbandry","Wheat and Rice","Cotton","Fruits"], ans:"B", explain:"Green revolution (1960s): wheat and rice. HYVs."},
    {text:"Photosynthesis products:", opts:["CO2+H2O","Glucose+O2","Glucose only","O2 only"], ans:"B", explain:"Photosynthesis: 6CO2+6H2O -> C6H12O6+6O2."},
    {text:"NPK stands for:", opts:["N,P,K","Na,K","Ni,Pb","Ne,K"], ans:"A", explain:"NPK: Nitrogen, Phosphorus, Potassium. Primary macronutrients."},
    {text:"Irrigation depends on:", opts:["Only rain","Crop, soil, climate","Only soil","Only farmer"], ans:"B", explain:"Irrigation: crop water requirement + soil + climate."},
    {text:"Seed rate depends on:", opts:["Only cost","Crop, seed size, germination","Only field","Only season"], ans:"B", explain:"Seed rate: crop type, seed size, germination %, spacing."},
  ],
  "Zoology": [
    {text:"Chordata characteristic:", opts:["Exoskeleton","Notochord at some stage","No symmetry","Pseudocoelom"], ans:"B", explain:"Chordata: notochord, dorsal nerve cord, pharyngeal slits."},
    {text:"Mammals have:", opts:["Gills","Hair + mammary glands","Feathers","Scales"], ans:"B", explain:"Mammals: hair/fur + mammary glands. Endothermic."},
    {text:"Insect body segments:", opts:["2","3 (head,thorax,abdomen)","4","1"], ans:"B", explain:"Insects: 3 segments. 6 legs. Exoskeleton."},
    {text:"Birds have:", opts:["Cold blood + feathers","Warm blood + feathers","Hair","No lungs"], ans:"B", explain:"Birds: endothermic + feathers + lungs."},
    {text:"Phylum with exoskeleton:", opts:["Chordata","Arthropoda","Mollusca","Annelida"], ans:"B", explain:"Arthropoda: exoskeleton (chitin). Jointed appendages."},
  ],
  "Soil Science": [
    {text:"Soil texture based on:", opts:["Color","Sand/silt/clay proportions","pH only","Organic matter"], ans:"B", explain:"Texture: proportions of sand, silt, clay."},
    {text:"Humus is:", opts:["Mineral","Organic matter in soil","Sand","Clay"], ans:"B", explain:"Humus: decomposed organic matter. Improves soil fertility."},
    {text:"Field capacity is:", opts:["Wilting point","Water after drainage","Saturation","Dry soil"], ans:"B", explain:"Field capacity: water content after free drainage."},
    {text:"Wilting point:", opts:["Field capacity","Permanent wilting percentage","Saturation","Dry weight"], ans:"B", explain:"Wilting point: soil moisture where plants permanently wilt."},
    {text:"Soil pH neutral:", opts:["4","7","10","14"], ans:"B", explain:"pH 7: neutral. <7 acidic, >7 alkaline."},
  ],
  "Extractive Metallurgy": [
    {text:"Ore concentration by:", opts:["Smelting","Gravity separation","Refining","Casting"], ans:"B", explain:"Concentration: gravity separation, flotation, magnetic separation."},
    {text:"Blast furnace produces:", opts:["Steel","Pig iron","Copper","Aluminum"], ans:"B", explain:"Blast furnace: iron ore -> pig iron (high carbon)."},
    {text:"Roasting is:", opts:["Reduction","Oxidation heating","Melting","Refining"], ans:"B", explain:"Roasting: heating ore in air. Oxidation to remove impurities."},
    {text:"Bessemer process for:", opts:["Aluminum","Steel making","Copper","Zinc"], ans:"B", explain:"Bessemer: steel from pig iron. Blowing air to oxidize impurities."},
    {text:"Aluminum extracted by:", opts:["Blast furnace","Hall-Heroult (electrolytic)","Roasting","Reduction"], ans:"B", explain:"Hall-Heroult: electrolytic reduction of Al2O3 in cryolite."},
  ],
};

function generateUniqueFallback(
  branch: string,
  count: number,
  rand: () => number
): { q: RawQuestion; subject: string }[] {
  const results: { q: RawQuestion; subject: string }[] = [];
  const subjects = FALLBACK_SUBJECTS[branch] || FALLBACK_SUBJECTS["ME"];
  let attempts = 0;

  while (results.length < count && attempts < count * 50) {
    attempts++;
    const subj = subjects[Math.floor(rand() * subjects.length)];
    const qBank = FALLBACK_QUESTIONS[subj] || FALLBACK_QUESTIONS["Mathematics"] || FALLBACK_QUESTIONS["General Aptitude"];
    const tpl = qBank[Math.floor(rand() * qBank.length)];

    // Check uniqueness
    if (results.some(r => r.q.question_text === tpl.text)) continue;

    const m = tpl.text.length < 50 ? 1 : 2;
    const question: RawQuestion = {
      id: "FB-" + branch + "-" + results.length,
      question_number: 0,
      question_text: tpl.text,
      subject: subj,
      topic: subj,
      options: tpl.opts,
      answer: tpl.ans,
      question_type: m === 1 ? "1MCQ" : "2MCQ",
      marks: m,
      negative_marks: m === 1 ? 0.33 : 0.66,
      branch: branch,
      year: 2020 + Math.floor(rand() * 6),
      session: rand() < 0.5 ? "1" : "2",
      difficulty: "moderate",
      tags: [subj, "generated-fallback"],
      explanation: tpl.explain,
      source: "Generated fallback",
      source_file: "generator-fallback",
    };

    results.push({ q: question, subject: subj });
  }

  return results;
}

`;

// Insert before // ─── Public API
const pubApiIdx = c.indexOf("\n// ─── Public API");
if (pubApiIdx < 0) { console.log("FAIL: Public API not found"); process.exit(1); }
c = c.substring(0, pubApiIdx) + "\n" + newFallback + "\n" + c.substring(pubApiIdx);

fs.writeFileSync(fp, c, "utf-8");
console.log("OK: Replaced fallback generator with subject-specific questions");
console.log("Lines after:", c.split("\n").length);

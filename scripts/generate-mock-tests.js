// Mock Test PDF Generator - Entry Point
// Generates 3 full-scale mock papers for each of the 20 GATE branches
const fs = require('fs');
const path = require('path');

const BRANCHES = [
  { code: 'cse', name: 'Computer Science and Information Technology', short: 'CSE', subjects: ['Engineering Mathematics','Data Structures','Algorithms','TOC','Compiler Design','DBMS','OS','CN','COA','Digital Logic','Programming','Software Engineering'] },
  { code: 'ece', name: 'Electronics and Communication Engineering', short: 'ECE', subjects: ['Network Theory','Signals & Systems','Control Systems','Digital Electronics','Analog Circuits','EMFT','Communication Systems','Microprocessors','EDC','Maths'] },
  { code: 'me', name: 'Mechanical Engineering', short: 'ME', subjects: ['Engineering Mechanics','SOM','TOM','Heat Transfer','Thermodynamics','Manufacturing','Fluid Mechanics','RAC','IC Engines','Design of Machine Elements'] },
  { code: 'civil', name: 'Civil Engineering', short: 'Civil', subjects: ['Structural Engineering','Geotechnical Engineering','Transportation Engineering','Water Resources','Environmental Engineering','Construction Management','Surveying','RCC & Steel'] },
  { code: 'ee', name: 'Electrical Engineering', short: 'EE', subjects: ['Electrical Machines','Power Systems','Control Systems','Power Electronics','Signals & Systems','Analog Electronics','Digital Electronics','EMFT','Measurements','Maths'] },
  { code: 'in', name: 'Instrumentation Engineering', short: 'IN', subjects: ['Sensors & Transducers','Measurement Systems','Control Systems','Digital Electronics','Analog Electronics','Signals & Systems','Communication','Microprocessors','Maths'] },
  { code: 'pi', name: 'Production and Industrial Engineering', short: 'PI', subjects: ['Manufacturing Processes','Production Planning','Industrial Engineering','Metrology','Thermodynamics','Machine Design','Material Science','Quality Control'] },
  { code: 'ch', name: 'Chemical Engineering', short: 'CH', subjects: ['Process Calculation','Mass Transfer','Heat Transfer','CRE','Fluid Mechanics','Thermodynamics','Chemical Technology','Plant Design','Process Control','Maths'] },
  { code: 'bt', name: 'Biotechnology', short: 'BT', subjects: ['Bioprocess Technology','Biochemistry','Microbiology','Molecular Biology','Genetic Engineering','Bioinformatics','Bioseparation','Maths'] },
  { code: 'mt', name: 'Metallurgical Engineering', short: 'MT', subjects: ['Physical Metallurgy','Mechanical Metallurgy','Extractive Metallurgy','Phase Transformation','Iron Making','Steel Making','Corrosion','Heat Treatment'] },
  { code: 'xe', name: 'Engineering Sciences', short: 'XE', subjects: ['Engineering Mathematics','Solid Mechanics','Thermodynamics','Polymer Science','Material Science','Food Technology'] },
  { code: 'xl', name: 'Life Sciences', short: 'XL', subjects: ['Chemistry','Biochemistry','Botany','Microbiology','Zoology','Food Technology'] },
  { code: 'tf', name: 'Textile Engineering', short: 'TF', subjects: ['Fibres','Yarn Manufacturing','Fabric Manufacturing','Textile Processing','Apparel Production','Technical Textiles','Maths'] },
  { code: 'pe', name: 'Petroleum Engineering', short: 'PE', subjects: ['Reservoir Engineering','Production Operations','Drilling Engineering','Formation Evaluation','Petroleum Geology','Offshore Engineering','Maths'] },
  { code: 'ey', name: 'Ecology and Evolution', short: 'EY', subjects: ['Evolutionary Biology','Population Ecology','Community Ecology','Ecosystem Ecology','Conservation Biology','Behavioral Ecology'] },
  { code: 'ma', name: 'Mathematics', short: 'MA', subjects: ['Abstract Algebra','Real Analysis','Linear Algebra','Topology','ODE & PDE','Complex Analysis','Numerical Methods'] },
  { code: 'ar', name: 'Architecture and Planning', short: 'AR', subjects: ['Architecture Design','Building Materials','Building Services','Urban Planning','Construction Management','Structural Systems','History of Architecture'] },
  { code: 'ag', name: 'Agricultural Engineering', short: 'AG', subjects: ['Farm Machinery','Soil and Water Conservation','Food Processing','Irrigation and Drainage','Post Harvest Technology','Renewable Energy'] },
  { code: 'gg', name: 'Geology and Geophysics', short: 'GG', subjects: ['Physical Geology','Mineralogy','Petrology','Structural Geology','Geophysics','Stratigraphy'] },
  { code: 'ph', name: 'Engineering Physics', short: 'PH', subjects: ['Quantum Mechanics','Electrodynamics','Mathematical Physics','Optics','Solid State Physics','Nuclear & Particle Physics','Thermal Physics'] }
];

const ROOT = path.join(__dirname, '..', 'premium_mock_tests');
fs.mkdirSync(ROOT, { recursive: true });

console.log('Branch inventory created:', BRANCHES.length, 'branches');
console.log('Total mock papers to generate:', BRANCHES.length * 3);
BRANCHES.forEach((b, i) => console.log(`  ${i+1}. ${b.code.padEnd(5)} - ${b.name}`));

module.exports = { BRANCHES, ROOT };

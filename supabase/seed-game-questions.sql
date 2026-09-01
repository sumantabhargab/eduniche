-- Seed questions for the GATE Arcade game
-- Run after the table migration is applied

INSERT INTO gate_game_questions (question_text, option_a, option_b, option_c, option_d, correct_option, branch, topic, difficulty) VALUES
-- CSE questions
('Which data structure is primarily used for BFS?', 'Stack', 'Queue', 'Heap', 'Tree', 'B', 'cse', 'Data Structures', 'easy'),
('What is the time complexity of binary search?', 'O(n)', 'O(log n)', 'O(n^2)', 'O(1)', 'B', 'cse', 'Algorithms', 'easy'),
('Which TCP/IP layer does IP operate at?', 'Application', 'Transport', 'Network', 'Data Link', 'C', 'cse', 'Computer Networks', 'easy'),
('What does DBMS stand for?', 'Data Base Management System', 'Database Machine System', 'Data Binary Management System', 'None of the above', 'A', 'cse', 'DBMS', 'easy'),
('Which sorting algorithm has O(n log n) worst-case complexity?', 'Quick Sort', 'Merge Sort', 'Bubble Sort', 'Insertion Sort', 'B', 'cse', 'Algorithms', 'medium'),
('In which addressing mode is the operand in memory?', 'Register', 'Immediate', 'Direct', 'Implied', 'C', 'cse', 'COA', 'medium'),
('What is the size of a MAC address?', '32 bits', '64 bits', '128 bits', '48 bits', 'D', 'cse', 'Computer Networks', 'easy'),
('Which of these is not a page replacement algorithm?', 'FIFO', 'LRU', 'Optimal', 'BFS', 'D', 'cse', 'OS', 'easy'),
('What is the normal form where every non-key attribute is functionally dependent on the key?', '1NF', '2NF', '3NF', 'BCNF', 'C', 'cse', 'DBMS', 'medium'),
('Which language accepts context-free grammars?', 'Finite Automata', 'Pushdown Automata', 'Turing Machine', 'Linear Bounded Automata', 'B', 'cse', 'TOC', 'medium'),

-- ECE questions
('What is the frequency range of VHF?', '30-300 Hz', '30-300 kHz', '30-300 MHz', '300-3000 MHz', 'C', 'ece', 'Communication Systems', 'easy'),
('Which number system is used in digital electronics?', 'Decimal', 'Binary', 'Octal', 'Hexadecimal', 'B', 'ece', 'Digital Electronics', 'easy'),
('Ohm's Law relates: ', 'V and I', 'I and R', 'V and R', 'V, I and R', 'D', 'ece', 'Network Theory', 'easy'),
('What is the Fourier transform of a real and even signal?', 'Real and odd', 'Imaginary and even', 'Real and even', 'Imaginary and odd', 'C', 'ece', 'Signals and Systems', 'medium'),
('Op-amp stands for: ', 'Operational amplifier', 'Optical amplifier', 'Organic amplifier', 'None', 'A', 'ece', 'Analog Electronics', 'easy'),
('Zener diode operates in: ', 'Forward bias', 'Reverse bias breakdown', 'Both', 'Neither', 'B', 'ece', 'Electronic Devices', 'medium'),
('Which modulation is used in AM radio? ', 'FM', 'PM', 'AM', 'PCM', 'C', 'ece', 'Communication Systems', 'easy'),
('A 4-bit ADC has how many quantization levels? ', '8', '16', '32', '64', 'B', 'ece', 'Signal Processing', 'medium'),
('Thevenin equivalent uses: ', 'Current source only', 'Voltage source only', 'Both', 'Neither', 'B', 'ece', 'Network Theory', 'easy'),
('Nyquist rate for signal with max freq 5kHz: ', '5 kHz', '10 kHz', '15 kHz', '20 kHz', 'B', 'ece', 'Signals and Systems', 'medium'),

-- EE questions
('What is the unit of electrical resistance?', 'Volt', 'Ampere', 'Ohm', 'Watt', 'C', 'ee', 'Electrical Machines', 'easy'),
('Transformer works on the principle of: ', 'Electromagnetic induction', 'Electrostatic induction', 'Magnetostriction', 'Self-induction', 'A', 'ee', 'Electrical Machines', 'easy'),
('Which motor has the highest efficiency?', 'DC Series', 'DC Shunt', 'Synchronous', 'Induction', 'C', 'ee', 'Electrical Machines', 'medium'),
('The speed of a DC shunt motor is proportional to: ', 'Flux × V', 'V / Flux', 'Flux / V', 'V × Flux', 'B', 'ee', 'Electrical Machines', 'medium'),
('What is the power factor of a purely resistive circuit?', '0', '0.5', '1', '-1', 'C', 'ee', 'Power Systems', 'easy'),
('Synchronous condenser is used for: ', 'Power factor improvement', 'Voltage regulation', 'Frequency control', 'Load balancing', 'A', 'ee', 'Power Systems', 'medium'),
('Insulation resistance of a cable is: ', 'Directly proportional to length', 'Inversely proportional to length', 'Independent of length', 'None', 'B', 'ee', 'Power Systems', 'medium'),
('Z-transform is used for: ', 'Continuous signals', 'Discrete signals', 'Both', 'Neither', 'B', 'ee', 'Control Systems', 'medium'),
('A 3-phase transformer has: ', '3 windings', '6 windings', '9 windings', '12 windings', 'B', 'ee', 'Electrical Machines', 'medium'),
('Load factor is defined as: ', 'Max load / Avg load', 'Avg load / Max load', 'Avg load / Rated capacity', 'Max load / Rated capacity', 'B', 'ee', 'Power Systems', 'easy'),

-- ME questions
('The unit of stress is: ', 'N/m', 'N/mm^2', 'N-m', 'J', 'B', 'me', 'Mechanics of Materials', 'easy'),
('Which theory is used for brittle materials? ', 'Maximum Shear Stress', 'Maximum Principal Stress', 'Distortion Energy', 'Strain Energy', 'B', 'me', 'Mechanics of Materials', 'medium'),
('Carnot cycle consists of: ', '2 processes', '3 processes', '4 processes', '5 processes', 'C', 'me', 'Thermodynamics', 'easy'),
('Which engine has the highest efficiency? ', 'Otto cycle', 'Diesel cycle', 'Dual cycle', 'Carnot cycle', 'D', 'me', 'Thermodynamics', 'medium'),
('Hooke''s Law relates stress and: ', 'Strain', 'Modulus', 'Poisson ratio', 'Density', 'A', 'me', 'Mechanics of Materials', 'easy'),
('The degree of freedom for a planar mechanism is given by: ', 'Kutzbach criterion', 'Grashof criterion', 'Euler criterion', 'Bernoulli criterion', 'A', 'me', 'TOM', 'medium'),
('Newtonian fluid has: ', 'Non-constant viscosity', 'Constant viscosity', 'Zero viscosity', 'Infinite viscosity', 'B', 'me', 'Fluid Mechanics', 'medium'),
('The Reynolds number signifies: ', 'Inertia/Viscous', 'Viscous/Inertia', 'Gravity/Viscous', 'Surface tension/Gravity', 'A', 'me', 'Fluid Mechanics', 'medium'),
('Gear ratio is the ratio of: ', 'Speed of driven/Speed of driver', 'Speed of driver/Speed of driven', 'Teeth of driver/Teeth of driven', 'Pitch of driver/Pitch of driven', 'B', 'me', 'TOM', 'easy'),
('The efficiency of a Carnot engine depends on: ', 'Working substance', 'Temperature limits', 'Engine design', 'All of the above', 'B', 'me', 'Thermodynamics', 'easy'),

-- CE questions
('The fineness modulus of fine aggregate lies between: ', '1 to 2', '2 to 3.5', '3.5 to 5', '5 to 7', 'B', 'ce', 'Concrete Technology', 'medium'),
('Specific gravity of cement is: ', '2.5', '3.15', '3.5', '4.0', 'B', 'ce', 'Building Materials', 'easy'),
('The ratio of active earth pressure to passive earth pressure is: ', '1:1', '1:2', '1:3', '1:4', 'C', 'ce', 'Geotechnical Engineering', 'medium'),
('Grade of concrete M25 means: ', 'Compressive strength of 25 N/mm²', 'Tensile strength of 25 N/mm²', 'Shear strength of 25 N/mm²', 'Modulus of elasticity of 25 N/mm²', 'A', 'ce', 'Concrete Technology', 'easy'),
('Flexible pavement design is based on: ', 'CBR method', 'Westergaard analysis', 'Both', 'None', 'C', 'ce', 'Transportation Engineering', 'medium'),
('The slenderness ratio of a column is: ', 'L/r', 'L/d', 'd/r', 'r/L', 'A', 'ce', 'Structural Engineering', 'medium'),
('IS code for plain and reinforced concrete is: ', 'IS 456:2000', 'IS 800:2007', 'IS 1893:2002', 'IS 875:1987', 'A', 'ce', 'Concrete Technology', 'easy'),
('The camber in roads is provided for: ', 'Drainage', 'Riding comfort', 'Both', 'None', 'C', 'ce', 'Transportation Engineering', 'easy'),
('Prismatic compass measures: ', 'Whole circle bearing', 'Quadrantal bearing', 'Included angle', 'Deflection angle', 'A', 'ce', 'Surveying', 'medium'),
('The allowable bearing pressure for sandy soil is: ', '100 kN/m²', '200 kN/m²', '300 kN/m²', '400 kN/m²', 'B', 'ce', 'Geotechnical Engineering', 'medium'),

-- IN questions
('RTD stands for: ', 'Resistance Temperature Detector', 'Resistance Thermistor Detector', 'Radio Temperature Detector', 'None', 'A', 'in', 'Sensors', 'easy'),
('The output of a thermocouple is: ', 'Resistance', 'Voltage', 'Current', 'Power', 'B', 'in', 'Transducers', 'easy'),
('LVDT measures: ', 'Velocity', 'Displacement', 'Acceleration', 'Force', 'B', 'in', 'Transducers', 'easy'),
('Strain gauge works on the principle of: ', 'Piezoelectric', 'Piezoresistive', 'Capacitive', 'Inductive', 'B', 'in', 'Sensors', 'medium'),
('The unit of luminous intensity is: ', 'Lumen', 'Lux', 'Candela', 'Watt', 'C', 'in', 'Measurement Systems', 'easy'),
('A DVM measures: ', 'Analog quantity', 'Digital quantity', 'Both', 'Neither', 'B', 'in', 'Digital Instruments', 'medium'),
('The sensitivity of a system is: ', 'Output/Input', 'Change in output / Change in input', 'Input/Output', 'None', 'B', 'in', 'Control Systems', 'medium'),
('The bandwidth of an oscilloscope depends on: ', 'Vertical amplifier', 'Horizontal amplifier', 'Both', 'Neither', 'A', 'in', 'Oscilloscopes', 'medium'),
('PID controller is a: ', 'Proportional controller', 'Integral controller', 'Derivative controller', 'Combined controller', 'D', 'in', 'Control Systems', 'medium'),
('The resolution of a 4-bit DAC with Vref=5V is: ', '1.25V', '0.3125V', '0.625V', '0.15625V', 'B', 'in', 'Digital Electronics', 'medium'),

-- PI questions
('The method study is also known as: ', 'Method Engineering', 'Work Study', 'Time Study', 'Motion Study', 'B', 'pi', 'Industrial Engineering', 'easy'),
('EOQ model assumes: ', 'Constant demand', 'Instantaneous replenishment', 'No shortages', 'All of the above', 'D', 'pi', 'Production Planning', 'medium'),
('The break-even point is where: ', 'Profit = Loss', 'Revenue = Cost', 'Fixed cost = Variable cost', 'Margin = Zero', 'B', 'pi', 'Cost Accounting', 'medium'),
('CMM stands for: ', 'Capability Maturity Model', 'Computer Managed Manufacturing', 'Central Manufacturing Module', 'None', 'A', 'pi', 'Manufacturing Management', 'easy'),
('PERT is used for: ', 'Time-cost trade-off', 'Project scheduling', 'Quality control', 'Inventory control', 'B', 'pi', 'Operations Research', 'medium'),
('The Hawthorne experiment was conducted at: ', 'Ford Motor Company', 'Western Electric Company', 'General Motors', 'IBM', 'B', 'pi', 'Industrial Management', 'easy'),
('Work measurement determines: ', 'Best method', 'Time required', 'Cost involved', 'Quality standards', 'B', 'pi', 'Industrial Engineering', 'easy'),
('ABC analysis is used in: ', 'Quality control', 'Inventory management', 'Production planning', 'Maintenance management', 'B', 'pi', 'Production Planning', 'medium'),
('ERP stands for: ', 'Enterprise Resource Planning', 'Extended Resource Program', 'Enterprise Results Program', 'None', 'A', 'pi', 'Manufacturing Management', 'easy'),
('SQC stands for: ', 'Statistical Quality Control', 'Standard Quality Check', 'System Quality Control', 'Scientific Quality Check', 'A', 'pi', 'Quality Control', 'easy');

-- Mark all as active and set created_at
UPDATE gate_game_questions
SET created_at = now() - (random() * INTERVAL '30 days')
WHERE created_at > now();

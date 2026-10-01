const { getDb } = require('./database');
const db = getDb();

// Clear and replace transport tables with Gurgaon & Delhi NCR data
db.exec(`
  DELETE FROM student_transport;
  DELETE FROM bus_stops;
  DELETE FROM bus_routes;
`);

const routes = [
  ['BUS-R1', 'Route 101 — Gurgaon Golf Course & Cyber City', 'STF-008', 'HR-26-EA-4521', 45],
  ['BUS-R2', 'Route 102 — Sohna Road & Subhash Chowk', 'STF-009', 'HR-26-DK-8910', 38],
  ['BUS-R3', 'Route 103 — Dwarka & West Delhi NCR Express', 'STF-012', 'DL-1C-AA-9082', 42],
  ['BUS-R4', 'Route 104 — South Delhi & Vasant Kunj Corridor', 'STF-004', 'DL-1P-CB-3341', 35],
];

const insertRoute = db.prepare('INSERT INTO bus_routes (id, route_name, driver_id, vehicle_number, capacity) VALUES (?,?,?,?,?)');
routes.forEach(r => insertRoute.run(...r));

const stops = [
  // Route 101 - Golf Course & Cyber City, Gurgaon
  ['BUS-R1', 'Sector 56 HUDA Market, Golf Course Ext Rd, Gurgaon', 1, '06:35 AM', 28.4232, 77.0984],
  ['BUS-R1', 'Sector 54 Rapid Metro / DLF Phase 5, Gurgaon', 2, '06:50 AM', 28.4418, 77.1082],
  ['BUS-R1', 'Genpact Chowk, Golf Course Road, DLF Phase 1', 3, '07:05 AM', 28.4721, 77.0987],
  ['BUS-R1', 'Sikanderpur Metro Interchange / MG Road Gurgaon', 4, '07:18 AM', 28.4812, 77.0935],
  ['BUS-R1', 'DLF Cyber City (Building 10 Gate), Gurgaon', 5, '07:32 AM', 28.4950, 77.0892],
  ['BUS-R1', 'School Main Campus (Sector 48, Sohna Road, Gurgaon)', 6, '07:50 AM', 28.4250, 77.0390],

  // Route 102 - Sohna Road & Subhash Chowk, Gurgaon
  ['BUS-R2', 'Vatika City / Badshahpur Chowk, Sohna Road, Gurgaon', 1, '06:45 AM', 28.3970, 77.0490],
  ['BUS-R2', 'Subhash Chowk (Opp. Omaxe Mall), Sector 47, Gurgaon', 2, '07:00 AM', 28.4320, 77.0420],
  ['BUS-R2', 'Rajiv Chowk / Civil Lines, Old Gurgaon', 3, '07:15 AM', 28.4550, 77.0320],
  ['BUS-R2', 'Millennium City Centre Metro (HUDA City Centre), Gurgaon', 4, '07:30 AM', 28.4595, 77.0725],
  ['BUS-R2', 'School Main Campus (Sector 48, Sohna Road, Gurgaon)', 5, '07:50 AM', 28.4250, 77.0390],

  // Route 103 - Dwarka & West Delhi NCR Link
  ['BUS-R3', 'Dwarka Sector 21 Metro Interchange, New Delhi', 1, '06:30 AM', 28.5520, 77.0580],
  ['BUS-R3', 'Dwarka Expressway Toll / Bajghera Chowk, Gurgaon Border', 2, '06:48 AM', 28.5190, 77.0180],
  ['BUS-R3', 'Palam Vihar Vyapar Kendra, Sector 2, Gurgaon', 3, '07:05 AM', 28.5080, 77.0380],
  ['BUS-R3', 'Sector 14 HUDA Market, Old Gurgaon', 4, '07:22 AM', 28.4750, 77.0450],
  ['BUS-R3', 'School Main Campus (Sector 48, Sohna Road, Gurgaon)', 5, '07:48 AM', 28.4250, 77.0390],

  // Route 104 - South Delhi & Vasant Kunj Corridor
  ['BUS-R4', 'Vasant Kunj Promenade, Nelson Mandela Marg, New Delhi', 1, '06:35 AM', 28.5410, 77.1550],
  ['BUS-R4', 'Mahipalpur Aerocity Junction, Delhi NCR', 2, '06:50 AM', 28.5480, 77.1230],
  ['BUS-R4', 'Ambience Mall / Shankar Chowk, NH-48 Border, Gurgaon', 3, '07:10 AM', 28.5030, 77.0970],
  ['BUS-R4', 'IFFCO Chowk Metro Station, Gurgaon', 4, '07:28 AM', 28.4720, 77.0710],
  ['BUS-R4', 'School Main Campus (Sector 48, Sohna Road, Gurgaon)', 5, '07:50 AM', 28.4250, 77.0390],
];

const insertStop = db.prepare('INSERT INTO bus_stops (route_id, stop_name, stop_order, pickup_time, lat, lng) VALUES (?,?,?,?,?,?)');
stops.forEach(s => insertStop.run(...s));

// Assign students to transport
const assignTransport = db.prepare('INSERT OR IGNORE INTO student_transport (student_id, route_id, stop_id) VALUES (?,?,?)');
assignTransport.run('STU-001', 'BUS-R1', 2);
assignTransport.run('STU-002', 'BUS-R1', 3);
assignTransport.run('STU-003', 'BUS-R1', 4);
assignTransport.run('STU-006', 'BUS-R2', 2);
assignTransport.run('STU-007', 'BUS-R2', 3);
assignTransport.run('STU-009', 'BUS-R2', 4);
assignTransport.run('STU-013', 'BUS-R3', 2);
assignTransport.run('STU-014', 'BUS-R3', 3);
assignTransport.run('STU-016', 'BUS-R4', 2);
assignTransport.run('STU-017', 'BUS-R4', 3);

console.log('✅ Successfully seeded Gurgaon & Delhi NCR transport routes and stops');

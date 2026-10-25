const express = require('express');
const cors = require('cors');
const { getDb } = require('./db/database');

const LedgerService = require('./services/ledgerService');
const PayrollService = require('./services/payrollService');
const TCService = require('./services/tcService');
const SearchService = require('./services/searchService');

const dashboardRoutes = require('./routes/dashboard');
const studentsRoutes = require('./routes/students');
const admissionsRoutes = require('./routes/admissions');
const academicsRoutes = require('./routes/academics');
const financeRoutes = require('./routes/finance');
const posRoutes = require('./routes/pos');
const staffRoutes = require('./routes/staff');
const payrollRoutes = require('./routes/payroll');
const transportRoutes = require('./routes/transport');
const tcRoutes = require('./routes/tc');
const safetyRoutes = require('./routes/safetyClinic');
const noticesRoutes = require('./routes/notices');
const searchRoutes = require('./routes/search');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const db = getDb();

const ledgerService = new LedgerService(db);
const payrollService = new PayrollService(db);
const tcService = new TCService(db);
const searchService = new SearchService(db);

app.locals.db = db;
app.locals.ledgerService = ledgerService;
app.locals.payrollService = payrollService;
app.locals.tcService = tcService;
app.locals.searchService = searchService;

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/admissions', admissionsRoutes);
app.use('/api', academicsRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/tc', tcRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/notices', noticesRoutes);
app.use('/api/search', searchRoutes);

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

const express = require('express');
const cors = require('cors');
const { getDb } = require('../server/src/db/database');

const LedgerService = require('../server/src/services/ledgerService');
const PayrollService = require('../server/src/services/payrollService');
const TCService = require('../server/src/services/tcService');

const dashboardRoutes = require('../server/src/routes/dashboard');
const studentsRoutes = require('../server/src/routes/students');
const admissionsRoutes = require('../server/src/routes/admissions');
const academicsRoutes = require('../server/src/routes/academics');
const financeRoutes = require('../server/src/routes/finance');
const posRoutes = require('../server/src/routes/pos');
const staffRoutes = require('../server/src/routes/staff');
const payrollRoutes = require('../server/src/routes/payroll');
const transportRoutes = require('../server/src/routes/transport');
const tcRoutes = require('../server/src/routes/tc');
const safetyRoutes = require('../server/src/routes/safetyClinic');
const noticesRoutes = require('../server/src/routes/notices');

const app = express();

app.use(cors());
app.use(express.json());

const db = getDb();

const ledgerService = new LedgerService(db);
const payrollService = new PayrollService(db);
const tcService = new TCService(db);

app.locals.db = db;
app.locals.ledgerService = ledgerService;
app.locals.payrollService = payrollService;
app.locals.tcService = tcService;

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

module.exports = app;

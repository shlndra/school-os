const router = require('express').Router();
const { v4: uuid } = require('uuid');

router.get('/stats', (req, res) => {
    try {
        const db = req.app.locals.db;
        const totalInvoiced = db.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM fee_invoices').get().total;
        const totalCollected = db.prepare('SELECT COALESCE(SUM(paid_amount), 0) as paid FROM fee_invoices').get().paid;
        const outstanding = totalInvoiced - totalCollected;
        const totalCount = db.prepare('SELECT COUNT(*) as c FROM fee_invoices').get().c;
        const paidCount = db.prepare("SELECT COUNT(*) as c FROM fee_invoices WHERE status = 'PAID'").get().c;
        const unpaidCount = db.prepare("SELECT COUNT(*) as c FROM fee_invoices WHERE status IN ('UNPAID', 'OVERDUE')").get().c;
        const partialCount = db.prepare("SELECT COUNT(*) as c FROM fee_invoices WHERE status = 'PARTIAL'").get().c;

        res.json({
            totalInvoiced,
            totalCollected,
            outstanding,
            totalCount,
            paidCount,
            unpaidCount,
            partialCount,
            collectionRate: totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 100
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/invoices', (req, res) => {
    try {
        const db = req.app.locals.db;
        const invoices = db.prepare(`
            SELECT f.*, 
                   s.first_name, s.last_name, 
                   (s.first_name || ' ' || COALESCE(s.last_name, '')) as studentName, 
                   s.grade, s.section,
                   f.total_amount as total, 
                   f.paid_amount as paid,
                   (f.total_amount - f.paid_amount) as balance
            FROM fee_invoices f 
            JOIN students s ON f.student_id = s.id
            ORDER BY f.created_at DESC
        `).all();
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/invoices', (req, res) => {
    try {
        const ledger = req.app.locals.ledgerService;
        const { studentId, description, amount, dueDate, feeType } = req.body;

        if (!studentId || !amount || Number(amount) <= 0) {
            return res.status(400).json({ error: 'Valid student and amount are required' });
        }

        const due = dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
        const desc = description || 'Tuition & Academic Term Fee';
        
        // Map feeType string to valid Chart of Accounts revenue code
        let revenueAccount = '4000';
        if (feeType) {
            const upper = String(feeType).toUpperCase();
            if (upper.includes('TRANSPORT')) revenueAccount = '4100';
            else if (upper.includes('LAB') || upper.includes('COMPUTER')) revenueAccount = '4200';
            else if (upper.includes('ADMISSION') || upper.includes('ANNUAL') || upper.includes('DEVELOPMENT')) revenueAccount = '4600';
            else if (['4000', '4100', '4200', '4300', '4400', '4500', '4600'].includes(feeType)) revenueAccount = feeType;
            else revenueAccount = '4000';
        }

        const result = ledger.generateInvoice(studentId, desc, Number(amount), due, revenueAccount);
        res.json({ message: 'Invoice generated successfully', ...result });
    } catch (err) {
        console.error('Generate invoice error:', err);
        res.status(400).json({ error: err.message });
    }
});

router.post('/pay', (req, res) => {
    try {
        const ledger = req.app.locals.ledgerService;
        const db = req.app.locals.db;
        const { invoiceId, amount, paymentMethod, referenceNo } = req.body;

        if (!invoiceId || !amount || Number(amount) <= 0) {
            return res.status(400).json({ error: 'Valid invoiceId and amount are required' });
        }

        const result = ledger.processInvoicePayment(invoiceId, Number(amount));
        
        // Fetch invoice with student details for receipt
        const invoice = db.prepare(`
            SELECT f.*, s.first_name, s.last_name, 
                   (s.first_name || ' ' || COALESCE(s.last_name, '')) as studentName, 
                   s.grade, s.section,
                   g.name as guardianName, g.phone as guardianPhone
            FROM fee_invoices f
            JOIN students s ON f.student_id = s.id
            LEFT JOIN guardians g ON s.id = g.student_id AND g.is_primary = 1
            WHERE f.id = ?
        `).get(invoiceId);

        const receiptNo = 'RCP-' + uuid().slice(0, 8).toUpperCase();

        const receipt = {
            receiptNo,
            invoiceId,
            studentId: invoice?.student_id,
            studentName: invoice?.studentName,
            grade: invoice?.grade,
            section: invoice?.section,
            guardianName: invoice?.guardianName || 'Guardian',
            amountPaid: Number(amount),
            newStatus: result.newStatus,
            totalAmount: invoice?.total_amount,
            totalPaid: invoice?.paid_amount,
            remainingBalance: Math.max(0, invoice?.total_amount - invoice?.paid_amount),
            paymentMethod: paymentMethod || 'UPI / NetBanking',
            referenceNo: referenceNo || 'TXN-' + Math.floor(Math.random() * 1000000),
            date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        };

        res.json({ message: 'Payment processed successfully', receipt, ...result });
    } catch (err) {
        console.error('Invoice Payment Error:', err);
        res.status(400).json({ error: err.message });
    }
});

router.get('/trial-balance', (req, res) => {
    try {
        const ledger = req.app.locals.ledgerService;
        const result = ledger.getTrialBalance();
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

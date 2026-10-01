const router = require('express').Router();

router.get('/items', (req, res) => {
    try {
        const db = req.app.locals.db;
        const items = db.prepare(`SELECT * FROM pos_items WHERE is_active = 1 ORDER BY category, name`).all();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/items', (req, res) => {
    try {
        const db = req.app.locals.db;
        const { v4: uuid } = require('uuid');
        const { name, category, price, stock } = req.body;
        
        if (!name || !price) {
            return res.status(400).json({ error: 'Item name and price are required' });
        }
        
        const id = 'POS-' + uuid().slice(0, 8).toUpperCase();
        db.prepare(`
            INSERT INTO pos_items (id, name, category, price, stock, is_active)
            VALUES (?, ?, ?, ?, ?, 1)
        `).run(id, name.trim(), category || 'FOOD', Number(price), Number(stock) || 100);
        
        const newItem = db.prepare('SELECT * FROM pos_items WHERE id = ?').get(id);
        res.json({ message: 'Item created successfully', item: newItem });
    } catch (err) {
        console.error('Error creating POS item:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/checkout', (req, res) => {
    try {
        const ledger = req.app.locals.ledgerService;
        const { studentId, items } = req.body;
        if (!studentId) return res.status(400).json({ error: 'studentId is required' });
        if (!items || !items.length) return res.status(400).json({ error: 'Cart is empty' });

        const result = ledger.processPOSCheckout(studentId, items);
        res.json({ message: 'Checkout successful', ...result, result });
    } catch (err) {
        console.error('POS Checkout Error:', err);
        res.status(400).json({ error: err.message });
    }
});

router.post('/recharge', (req, res) => {
    try {
        const ledger = req.app.locals.ledgerService;
        const { studentId, amount } = req.body;
        if (!studentId) return res.status(400).json({ error: 'studentId is required' });
        if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid recharge amount' });

        const result = ledger.processWalletRecharge(studentId, Number(amount));
        res.json({ message: 'Wallet recharged', ...result, result });
    } catch (err) {
        console.error('Wallet Recharge Error:', err);
        res.status(400).json({ error: err.message });
    }
});

router.get('/transactions', (req, res) => {
    try {
        const db = req.app.locals.db;
        const txns = db.prepare(`SELECT * FROM pos_transactions ORDER BY created_at DESC LIMIT 50`).all();
        res.json(txns);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

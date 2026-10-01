const { v4: uuid } = require('uuid');

/**
 * Double-Entry Ledger Service
 * Invariant: For every journal entry, sum(debits) === sum(credits)
 */
class LedgerService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create a balanced journal entry with multiple lines.
   * Throws if debits != credits.
   */
  createJournalEntry(date, description, lines, referenceType = null, referenceId = null, createdBy = 'SYSTEM') {
    const totalDebits = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredits = lines.reduce((sum, l) => sum + (l.credit || 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.001) {
      throw new Error(`LEDGER VIOLATION: Debits (${totalDebits}) != Credits (${totalCredits}). Transaction rejected.`);
    }

    const journalId = uuid();
    const insertJournal = this.db.prepare(
      'INSERT INTO journal_entries (id, date, description, reference_type, reference_id, created_by) VALUES (?,?,?,?,?,?)'
    );
    const insertLine = this.db.prepare(
      'INSERT INTO journal_lines (journal_id, account_code, debit, credit) VALUES (?,?,?,?)'
    );

    const txn = this.db.transaction(() => {
      insertJournal.run(journalId, date, description, referenceType, referenceId, createdBy);
      lines.forEach(line => {
        insertLine.run(journalId, line.accountCode, line.debit || 0, line.credit || 0);
      });
    });

    txn();
    return journalId;
  }

  /**
   * Generate a fee invoice with proper double-entry journal.
   * Debit: Accounts Receivable (1100) | Credit: Revenue Account
   */
  generateInvoice(studentId, description, amount, dueDate, revenueAccount = '4000') {
    const invoiceId = 'INV-' + uuid().slice(0, 8).toUpperCase();
    const today = new Date().toISOString().split('T')[0];

    const journalId = this.createJournalEntry(
      today,
      `Invoice: ${description} for student ${studentId}`,
      [
        { accountCode: '1100', debit: amount, credit: 0 },
        { accountCode: revenueAccount, debit: 0, credit: amount },
      ],
      'INVOICE', invoiceId
    );

    this.db.prepare(
      'INSERT INTO fee_invoices (id, student_id, description, total_amount, paid_amount, due_date, status, journal_id) VALUES (?,?,?,?,0,?,?,?)'
    ).run(invoiceId, studentId, description, amount, dueDate, 'UNPAID', journalId);

    return { invoiceId, journalId };
  }

  /**
   * Record a fee payment.
   * Debit: Cash/Bank (1000) | Credit: Accounts Receivable (1100)
   */
  recordPayment(invoiceId, amount) {
    const invoice = this.db.prepare('SELECT * FROM fee_invoices WHERE id = ?').get(invoiceId);
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

    const remaining = invoice.total_amount - invoice.paid_amount;
    if (amount > remaining + 0.01) {
      throw new Error(`Payment ${amount} exceeds remaining balance ${remaining}`);
    }

    const today = new Date().toISOString().split('T')[0];
    const journalId = this.createJournalEntry(
      today,
      `Payment received for Invoice ${invoiceId}`,
      [
        { accountCode: '1000', debit: amount, credit: 0 },
        { accountCode: '1100', debit: 0, credit: amount },
      ],
      'PAYMENT', invoiceId
    );

    const newPaid = invoice.paid_amount + amount;
    const newStatus = newPaid >= invoice.total_amount ? 'PAID' : 'PARTIAL';

    this.db.prepare('UPDATE fee_invoices SET paid_amount = ?, status = ? WHERE id = ?')
      .run(newPaid, newStatus, invoiceId);

    return { journalId, newStatus, newPaid };
  }

  /**
   * Process a POS (cafeteria/store) transaction.
   * Deducts from student wallet, records journal entry.
   */
  processPosTransaction(studentId, items) {
    const student = this.db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    if (!student) throw new Error(`Student ${studentId} not found`);

    let totalAmount = 0;
    const itemDetails = items.map(item => {
      const posItem = this.db.prepare('SELECT * FROM pos_items WHERE id = ?').get(item.itemId);
      if (!posItem) throw new Error(`POS Item ${item.itemId} not found`);
      if (posItem.stock < item.quantity) throw new Error(`Insufficient stock for ${posItem.name}`);
      const lineTotal = posItem.price * item.quantity;
      totalAmount += lineTotal;
      return { ...posItem, quantity: item.quantity, lineTotal };
    });

    if (student.wallet_balance < totalAmount) {
      throw new Error(`Insufficient wallet balance. Available: ₹${student.wallet_balance}, Required: ₹${totalAmount}`);
    }

    const txnId = 'POS-' + uuid().slice(0, 8).toUpperCase();
    const today = new Date().toISOString().split('T')[0];

    // Determine revenue account based on item categories
    const revenueAccount = itemDetails[0].category === 'FOOD' || itemDetails[0].category === 'BEVERAGE' 
      ? '4300' : itemDetails[0].category === 'BOOK' ? '4400' 
      : itemDetails[0].category === 'UNIFORM' ? '4500' : '4400';

    const journalId = this.createJournalEntry(
      today,
      `POS Sale: ${txnId} for ${student.first_name} ${student.last_name}`,
      [
        { accountCode: '1200', debit: totalAmount, credit: 0 },
        { accountCode: revenueAccount, debit: 0, credit: totalAmount },
      ],
      'POS', txnId
    );

    const txn = this.db.transaction(() => {
      // Record POS transaction
      this.db.prepare(
        'INSERT INTO pos_transactions (id, student_id, total_amount, payment_method, journal_id) VALUES (?,?,?,?,?)'
      ).run(txnId, studentId, totalAmount, 'WALLET', journalId);

      // Record each item
      const insertItem = this.db.prepare(
        'INSERT INTO pos_transaction_items (transaction_id, item_id, quantity, unit_price) VALUES (?,?,?,?)'
      );
      itemDetails.forEach(item => {
        insertItem.run(txnId, item.id, item.quantity, item.price);
      });

      // Deduct from student wallet
      this.db.prepare('UPDATE students SET wallet_balance = wallet_balance - ? WHERE id = ?')
        .run(totalAmount, studentId);

      // Reduce stock
      const updateStock = this.db.prepare('UPDATE pos_items SET stock = stock - ? WHERE id = ?');
      itemDetails.forEach(item => {
        updateStock.run(item.quantity, item.id);
      });
    });

    txn();

    return {
      transactionId: txnId,
      items: itemDetails.map(i => ({ name: i.name, qty: i.quantity, quantity: i.quantity, price: i.price, total: i.lineTotal })),
      totalAmount,
      total: totalAmount,
      newBalance: student.wallet_balance - totalAmount,
      journalId
    };
  }

  // Aliases for route compatibility
  processPOSCheckout(studentId, items) {
    return this.processPosTransaction(studentId, items);
  }

  processWalletRecharge(studentId, amount) {
    return this.rechargeWallet(studentId, amount);
  }

  processInvoicePayment(invoiceId, amount) {
    return this.recordPayment(invoiceId, amount);
  }

  /**
   * Recharge a student's wallet.
   */
  rechargeWallet(studentId, amount) {
    const student = this.db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    if (!student) throw new Error(`Student ${studentId} not found`);

    const today = new Date().toISOString().split('T')[0];
    this.createJournalEntry(
      today,
      `Wallet Recharge for ${student.first_name} ${student.last_name}`,
      [
        { accountCode: '1000', debit: amount, credit: 0 },
        { accountCode: '1200', debit: 0, credit: amount },
      ],
      'WALLET_RECHARGE', studentId
    );

    this.db.prepare('UPDATE students SET wallet_balance = wallet_balance + ? WHERE id = ?')
      .run(amount, studentId);

    return { newBalance: student.wallet_balance + amount };
  }

  /**
   * Get account balances for trial balance.
   */
  getTrialBalance() {
    const rows = this.db.prepare(`
      SELECT 
        ca.code, ca.name, ca.type,
        COALESCE(SUM(jl.debit), 0) as total_debits,
        COALESCE(SUM(jl.credit), 0) as total_credits
      FROM chart_of_accounts ca
      LEFT JOIN journal_lines jl ON ca.code = jl.account_code
      GROUP BY ca.code, ca.name, ca.type
      ORDER BY ca.code
    `).all();
    return rows;
  }

  getRecentTransactions(limit = 20) {
    return this.db.prepare(`
      SELECT je.*, 
        json_group_array(json_object('account', jl.account_code, 'debit', jl.debit, 'credit', jl.credit)) as lines
      FROM journal_entries je
      JOIN journal_lines jl ON je.id = jl.journal_id
      GROUP BY je.id
      ORDER BY je.created_at DESC
      LIMIT ?
    `).all(limit);
  }
}

module.exports = LedgerService;

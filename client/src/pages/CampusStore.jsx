import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Wallet, 
  CreditCard, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Receipt as ReceiptIcon,
  Sparkles,
  ArrowRight,
  User,
  AlertCircle
} from 'lucide-react';

export default function CampusStore() {
  const [items, setItems] = useState([]);
  const [students, setStudents] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'FOOD', price: '', stock: 100 });

  const categories = [
    { id: 'ALL', label: 'All Items', icon: '🌟' },
    { id: 'FOOD', label: 'Food & Meals', icon: '🍲' },
    { id: 'BEVERAGE', label: 'Drinks & Beverages', icon: '🥤' },
    { id: 'STATIONERY', label: 'Stationery', icon: '✏️' },
    { id: 'UNIFORM', label: 'Uniforms', icon: '👔' },
    { id: 'BOOK', label: 'Books', icon: '📚' },
  ];

  const fetchStudents = () => {
    fetch('/api/students')
      .then(res => res.json())
      .then(data => setStudents(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to load students:', err));
  };

  const [receipt, setReceipt] = useState(null);

  const fetchItems = () => {
    fetch('/api/pos/items')
      .then(res => res.json())
      .then(data => setItems(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to load POS items:', err));
  };

  useEffect(() => {
    fetchItems();
    fetchStudents();
  }, []);

  const handleCreateItem = (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) return alert('Please enter an item name');
    if (!newItem.price || Number(newItem.price) <= 0) return alert('Please enter a valid price');

    setAddingItem(true);
    fetch('/api/pos/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newItem.name.trim(),
        category: newItem.category,
        price: Number(newItem.price),
        stock: Number(newItem.stock) || 100
      })
    })
      .then(res => res.json())
      .then(data => {
        setAddingItem(false);
        if (data.error) return alert(data.error);
        setShowAddItemModal(false);
        setNewItem({ name: '', category: 'FOOD', price: '', stock: 100 });
        setActiveCategory(data.item?.category || newItem.category);
        fetchItems();
      })
      .catch(err => {
        setAddingItem(false);
        alert('Failed to add item: ' + err.message);
      });
  };

  const addToCart = (item) => {
    // If a completed order was showing, clear it to start a new one
    if (receipt) setReceipt(null);

    const existing = cart.find(c => c.itemId === item.id);
    if (existing) {
      setCart(cart.map(c => c.itemId === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { itemId: item.id, name: item.name, price: item.price, category: item.category, quantity: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(c => {
      if (c.itemId === id) return { ...c, quantity: Math.max(0, c.quantity + delta) };
      return c;
    }).filter(c => c.quantity > 0));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(c => c.itemId !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const selectedStudentObj = students.find(s => s.id === selectedStudent);
  const studentBalance = selectedStudentObj?.wallet_balance || 0;
  const isBalanceInsufficient = selectedStudentObj && studentBalance < cartTotal;

  const handleCheckout = () => {
    if (!selectedStudent) return alert('Please select a student first.');
    if (cart.length === 0) return alert('Your cart is empty. Tap items to add them.');
    if (isBalanceInsufficient) {
      return alert(`Insufficient wallet balance. Student has ₹${studentBalance.toLocaleString('en-IN')}, but order total is ₹${cartTotal.toLocaleString('en-IN')}. Please recharge the wallet.`);
    }

    fetch('/api/pos/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        studentId: selectedStudent, 
        items: cart.map(c => ({ itemId: c.itemId, quantity: c.quantity })) 
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) return alert(data.error);
        
        // Build receipt object
        const completedReceipt = {
          transactionId: data.transactionId || data.result?.transactionId || 'POS-' + Math.floor(Math.random() * 100000),
          studentName: selectedStudentObj?.name || `${selectedStudentObj?.first_name || ''} ${selectedStudentObj?.last_name || ''}`.trim(),
          studentGrade: `${selectedStudentObj?.grade || ''} ${selectedStudentObj?.section || ''}`.trim(),
          items: data.items || data.result?.items || cart.map(c => ({ name: c.name, quantity: c.quantity, price: c.price, total: c.price * c.quantity })),
          total: data.total || data.totalAmount || cartTotal,
          newBalance: data.newBalance !== undefined ? data.newBalance : (data.result?.newBalance !== undefined ? data.result.newBalance : (studentBalance - cartTotal)),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };

        setReceipt(completedReceipt);
        setCart([]);
        fetchStudents();
      })
      .catch(err => alert('Checkout failed: ' + err.message));
  };

  const handleRecharge = (e) => {
    e.preventDefault();
    if (!selectedStudent) return alert('Please select a student from the dropdown first.');
    if (!rechargeAmount || Number(rechargeAmount) <= 0) return alert('Please enter a valid recharge amount.');

    fetch('/api/pos/recharge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: selectedStudent, amount: Number(rechargeAmount) })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) return alert(data.error);
        const newBal = data.newBalance !== undefined ? data.newBalance : data.result?.newBalance;
        alert(`Wallet recharged successfully! New balance: ₹${Number(newBal).toLocaleString('en-IN')}`);
        setRechargeAmount('');
        fetchStudents();
      })
      .catch(err => alert('Recharge failed: ' + err.message));
  };

  const getCategoryTheme = (category) => {
    switch (category) {
      case 'FOOD': return { bg: 'bg-amber-50', border: 'border-amber-200', tag: 'bg-amber-100 text-amber-800', hover: 'hover:border-amber-400' };
      case 'BEVERAGE': return { bg: 'bg-blue-50', border: 'border-blue-200', tag: 'bg-blue-100 text-blue-800', hover: 'hover:border-blue-400' };
      case 'STATIONERY': return { bg: 'bg-purple-50', border: 'border-purple-200', tag: 'bg-purple-100 text-purple-800', hover: 'hover:border-purple-400' };
      case 'UNIFORM': return { bg: 'bg-rose-50', border: 'border-rose-200', tag: 'bg-rose-100 text-rose-800', hover: 'hover:border-rose-400' };
      case 'BOOK': return { bg: 'bg-emerald-50', border: 'border-emerald-200', tag: 'bg-emerald-100 text-emerald-800', hover: 'hover:border-emerald-400' };
      default: return { bg: 'bg-slate-50', border: 'border-slate-200', tag: 'bg-slate-100 text-slate-800', hover: 'hover:border-slate-400' };
    }
  };

  // Filter items by category & search query
  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-110px)] pb-6">
      {/* Left side: Item Catalog with Category Tabs */}
      <div className="w-full lg:w-3/5 xl:w-2/3 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Campus Store & Cafeteria</h2>
            <p className="text-slate-500 text-sm mt-0.5">Select category or tap items to build customer order</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Quick search */}
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-1.5 text-sm bg-white w-full sm:w-44 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            />
            {/* Add New Item Button */}
            <button
              onClick={() => setShowAddItemModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap shadow-sm transition-colors"
            >
              <Plus size={16} />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {/* Category Pills / Filter Tabs */}
        <div className="flex flex-wrap gap-2 pb-1">
          {categories.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 shadow-2xs ${
                  isActive 
                    ? 'bg-slate-800 text-white shadow-sm scale-102' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                {cat.id !== 'ALL' && (
                  <span className={`text-xs ml-1 px-1.5 py-0.2 rounded-full ${isActive ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'}`}>
                    {items.filter(i => i.category === cat.id).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Item Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 overflow-y-auto max-h-[calc(100vh-250px)] pr-1">
          {filteredItems.map(item => {
            const theme = getCategoryTheme(item.category);
            const inCart = cart.find(c => c.itemId === item.id);
            return (
              <div 
                key={item.id} 
                onClick={() => addToCart(item)}
                className={`relative p-4 rounded-xl border-2 cursor-pointer shadow-2xs hover:shadow-md transition-all active:scale-97 flex flex-col justify-between h-36 ${theme.bg} ${theme.border} ${theme.hover} bg-white`}
              >
                {inCart && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-scale">
                    {inCart.quantity}
                  </span>
                )}
                <div>
                  <div className="font-semibold text-slate-800 text-base leading-snug">{item.name}</div>
                  <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md mt-1.5 ${theme.tag}`}>
                    {item.category}
                  </span>
                </div>
                <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-100/80">
                  <span className="text-xs text-slate-400 font-medium">Stock: {item.stock || 100}</span>
                  <span className="font-bold text-lg text-slate-900">₹{item.price}</span>
                </div>
              </div>
            );
          })}
          {filteredItems.length === 0 && (
            <div className="col-span-full p-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
              No items found in this category.
            </div>
          )}
        </div>
      </div>

      {/* Right side: Current Order OR Order Successful Receipt */}
      <div className="w-full lg:w-2/5 xl:w-1/3 flex flex-col gap-4">
        {/* Main POS Right Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col flex-1 overflow-hidden">
          
          {/* STATE A: ORDER SUCCESSFUL RECEIPT */}
          {receipt ? (
            <div className="p-6 flex flex-col h-full justify-between bg-gradient-to-b from-emerald-50/40 to-white">
              <div>
                {/* Success Header */}
                <div className="text-center pb-4 border-b border-emerald-100">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-900">Order Successful!</h3>
                  <p className="text-xs text-emerald-700 font-medium mt-0.5">
                    Receipt #{receipt.transactionId} • {receipt.timestamp}
                  </p>
                </div>

                {/* Customer Info */}
                <div className="bg-white rounded-xl p-3.5 my-4 border border-emerald-100/80 shadow-2xs">
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Student Account</div>
                  <div className="font-bold text-slate-800 text-base mt-0.5">{receipt.studentName}</div>
                  <div className="text-xs text-slate-500">{receipt.studentGrade}</div>
                </div>

                {/* Itemized Lines */}
                <div className="border-t border-b border-dashed border-slate-200 py-3 space-y-2 max-h-48 overflow-y-auto">
                  {receipt.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-slate-600">
                        {item.name} <span className="text-slate-400 text-xs font-semibold">x{item.quantity || item.qty}</span>
                      </span>
                      <span className="font-semibold text-slate-800">
                        ₹{(item.total || (item.price * (item.quantity || item.qty))).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="py-3.5 space-y-1.5">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Payment Method</span>
                    <span className="font-medium text-slate-700">Student Smart ID Wallet</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-slate-900 pt-1">
                    <span>Total Paid</span>
                    <span className="text-emerald-700 text-xl">₹{receipt.total?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span>Remaining Wallet Balance</span>
                    <span className="font-bold text-blue-600 text-sm">₹{Number(receipt.newBalance).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => {
                    setReceipt(null);
                    fetchStudents();
                  }}
                  className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Start Next Order</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ) : (
            /* STATE B: CURRENT ORDER CART */
            <div className="flex flex-col h-full">
              {/* Cart Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="text-slate-700" />
                  <h3 className="font-bold text-slate-800">Current Order</h3>
                  {cart.length > 0 && (
                    <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                      {cart.reduce((sum, i) => sum + i.quantity, 0)} items
                    </span>
                  )}
                </div>
                {cart.length > 0 && (
                  <button 
                    onClick={clearCart}
                    className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 size={13} /> Clear
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[160px] max-h-[300px]">
                {cart.map(item => (
                  <div key={item.itemId} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="font-medium text-slate-800 text-sm truncate">{item.name}</div>
                      <div className="text-xs text-slate-500 font-semibold mt-0.5">₹{item.price} each</div>
                    </div>
                    
                    {/* Quantity controls */}
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => updateQty(item.itemId, -1)} 
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold text-sm shadow-2xs"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="font-bold text-sm w-4 text-center text-slate-800">{item.quantity}</span>
                      <button 
                        onClick={() => updateQty(item.itemId, 1)} 
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold text-sm shadow-2xs"
                      >
                        <Plus size={13} />
                      </button>
                      <span className="font-bold text-sm text-slate-900 w-16 text-right">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}

                {cart.length === 0 && (
                  <div className="h-full py-12 flex flex-col items-center justify-center text-slate-400">
                    <ShoppingCart size={40} className="mb-2 opacity-25" />
                    <p className="text-sm font-medium">Order is currently empty</p>
                    <p className="text-xs text-slate-400 mt-1">Tap any item from the catalog to add</p>
                  </div>
                )}
              </div>

              {/* Checkout Controls */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3.5">
                {/* Student Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Select Student
                  </label>
                  <select 
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 shadow-2xs"
                    value={selectedStudent}
                    onChange={e => setSelectedStudent(e.target.value)}
                  >
                    <option value="">-- Choose Student (Tap Badge) --</option>
                    {students.map(s => {
                      const displayName = s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || `Student (${s.id})`;
                      return (
                        <option key={s.id} value={s.id}>
                          {displayName} ({s.grade} {s.section || 'A'}) — Balance: ₹{(s.wallet_balance || 0).toLocaleString('en-IN')}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Student Balance Pill */}
                {selectedStudentObj && (
                  <div className={`p-2.5 rounded-xl text-xs flex justify-between items-center ${
                    isBalanceInsufficient ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-blue-50 text-blue-800 border border-blue-100'
                  }`}>
                    <span className="font-medium">
                      {isBalanceInsufficient ? '⚠️ Insufficient Funds' : 'Current Balance'}
                    </span>
                    <span className="font-bold text-sm">
                      ₹{studentBalance.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {/* Live Total */}
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-slate-500 font-medium text-sm">Total Due</span>
                  <span className="text-3xl font-extrabold text-slate-900">
                    ₹{cartTotal.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Pay Button */}
                <button 
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || !selectedStudent || isBalanceInsufficient}
                  className={`w-full py-3.5 rounded-xl font-bold text-white flex justify-center items-center gap-2 text-sm transition-all shadow-sm ${
                    cart.length > 0 && selectedStudent && !isBalanceInsufficient
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' 
                      : 'bg-slate-300 cursor-not-allowed text-slate-500'
                  }`}
                >
                  <CreditCard size={18} />
                  <span>Pay with Student Wallet</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Recharge Wallet Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <Wallet size={16} className="text-slate-600" />
            <h4 className="font-bold text-slate-800 text-sm">Recharge Student Wallet</h4>
          </div>
          <form onSubmit={handleRecharge} className="flex gap-2">
            <input 
              type="number" 
              placeholder="Amount (₹)" 
              required
              min="1"
              value={rechargeAmount}
              onChange={e => setRechargeAmount(e.target.value)}
              className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              type="submit" 
              className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors"
            >
              + Add Funds
            </button>
          </form>
        </div>
      </div>

      {/* Modal: Add New Item */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Add New Campus Store Item</h3>
              <button 
                onClick={() => setShowAddItemModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masala Dosa, Art Sketchbook"
                  value={newItem.name}
                  onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={newItem.category}
                  onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="FOOD">🍲 Food & Meals</option>
                  <option value="BEVERAGE">🥤 Drinks & Beverages</option>
                  <option value="STATIONERY">✏️ Stationery & Art</option>
                  <option value="UNIFORM">👔 Uniforms & Apparel</option>
                  <option value="BOOK">📚 Textbooks & Workbooks</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50"
                    value={newItem.price}
                    onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="100"
                    value={newItem.stock}
                    onChange={e => setNewItem({ ...newItem, stock: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingItem}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  {addingItem ? 'Adding...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

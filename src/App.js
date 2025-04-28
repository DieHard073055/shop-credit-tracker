import React, { useState, useEffect } from 'react';

const App = () => {
  // Main state management
  const [customers, setCustomers] = useState(() => {
    const savedCustomers = localStorage.getItem('creditCustomers');
    return savedCustomers ? JSON.parse(savedCustomers) : [];
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('search'); // 'search', 'add', 'settings'
  const [reminderTemplate, setReminderTemplate] = useState(() => {
    const savedTemplate = localStorage.getItem('reminderTemplate');
    return savedTemplate || 'Hi {name}, this is a reminder that you have an outstanding balance of ${amount} at our shop. Please settle your account soon. Thank you!';
  });
  
  // Customer form state
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    outstandingAmount: '',
    notes: '',
    lastPurchaseDate: new Date().toISOString().split('T')[0]
  });
  
  // Temporary state for editing
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [editingAmount, setEditingAmount] = useState('');
  const [showCustomerDetail, setShowCustomerDetail] = useState(null);

  // Save to localStorage whenever customers or template changes
  useEffect(() => {
    localStorage.setItem('creditCustomers', JSON.stringify(customers));
  }, [customers]);
  
  useEffect(() => {
    localStorage.setItem('reminderTemplate', reminderTemplate);
  }, [reminderTemplate]);

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    customer.phone.includes(searchTerm)
  );

  // Handle adding a new customer
  const handleAddCustomer = (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone || !newCustomer.outstandingAmount) {
      alert("Please fill in name, phone, and amount fields");
      return;
    }
    
    const customerExists = customers.some(c => c.phone === newCustomer.phone);
    if (customerExists) {
      alert("A customer with this phone number already exists");
      return;
    }
    
    const newCustomerWithId = {
      ...newCustomer,
      id: Date.now().toString(),
      outstandingAmount: parseFloat(newCustomer.outstandingAmount),
      transactions: [{
        date: new Date().toISOString(),
        amount: parseFloat(newCustomer.outstandingAmount),
        type: 'credit',
        note: 'Initial credit'
      }]
    };
    
    setCustomers([...customers, newCustomerWithId]);
    setNewCustomer({
      name: '',
      phone: '',
      address: '',
      outstandingAmount: '',
      notes: '',
      lastPurchaseDate: new Date().toISOString().split('T')[0]
    });
    setActiveTab('search');
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer({
      ...newCustomer,
      [name]: value
    });
  };

  // Handle updating customer amount
  const handleUpdateAmount = (id) => {
    if (!editingAmount) {
      alert("Please enter an amount");
      return;
    }
    
    const amount = parseFloat(editingAmount);
    setCustomers(customers.map(customer => {
      if (customer.id === id) {
        const newTransaction = {
          date: new Date().toISOString(),
          amount: amount,
          type: amount > 0 ? 'credit' : 'payment',
          note: amount > 0 ? 'Additional purchase' : 'Payment received'
        };
        
        return {
          ...customer,
          outstandingAmount: customer.outstandingAmount + amount,
          lastPurchaseDate: amount > 0 ? new Date().toISOString().split('T')[0] : customer.lastPurchaseDate,
          transactions: [...customer.transactions, newTransaction]
        };
      }
      return customer;
    }));
    
    setEditingCustomerId(null);
    setEditingAmount('');
  };

  // Handle deleting a customer
  const handleDeleteCustomer = (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      setCustomers(customers.filter(customer => customer.id !== id));
      setShowCustomerDetail(null);
    }
  };

  // Generate SMS message for a customer
  const generateSmsMessage = (customer) => {
    return reminderTemplate
      .replace('{name}', customer.name)
      .replace('{amount}', customer.outstandingAmount.toFixed(2));
  };

  // Open SMS on mobile or copy to clipboard on desktop
  const sendReminder = (customer) => {
    const message = generateSmsMessage(customer);
    const smsUri = `sms:${customer.phone}?body=${encodeURIComponent(message)}`;
    
    // Check if on mobile
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      window.location.href = smsUri;
    } else {
      navigator.clipboard.writeText(message)
        .then(() => alert("Message copied to clipboard:\n\n" + message))
        .catch(err => alert("Could not copy message: " + err));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Shop Credit Tracker</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage customer IOUs and credit balances</p>
        </header>
        
        {/* Navigation Tabs */}
        <div className="flex bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-6">
          <button 
            className={`flex-1 p-4 text-center font-medium transition ${activeTab === 'search' ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            onClick={() => setActiveTab('search')}
          >
            Search Customers
          </button>
          <button 
            className={`flex-1 p-4 text-center font-medium transition ${activeTab === 'add' ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            onClick={() => setActiveTab('add')}
          >
            Add Customer
          </button>
          <button 
            className={`flex-1 p-4 text-center font-medium transition ${activeTab === 'settings' ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>
        
        {/* Search Customers */}
        {activeTab === 'search' && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-6">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name or phone number..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Customer List */}
            <div className="space-y-4">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No customers found' : 'No customers added yet'}
                </div>
              ) : (
                filteredCustomers.map(customer => (
                  <div key={customer.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div onClick={() => setShowCustomerDetail(showCustomerDetail === customer.id ? null : customer.id)} className="cursor-pointer">
                        <h3 className="font-bold text-gray-800 dark:text-white">{customer.name}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{customer.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${customer.outstandingAmount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          ${customer.outstandingAmount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Last update: {new Date(customer.transactions[customer.transactions.length - 1].date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {showCustomerDetail === customer.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        {customer.address && (
                          <p className="text-gray-600 dark:text-gray-300 mb-2">
                            <span className="font-medium">Address:</span> {customer.address}
                          </p>
                        )}
                        {customer.notes && (
                          <p className="text-gray-600 dark:text-gray-300 mb-2">
                            <span className="font-medium">Notes:</span> {customer.notes}
                          </p>
                        )}
                        
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-800 dark:text-white mb-2">Recent Transactions</h4>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 max-h-40 overflow-y-auto">
                            {customer.transactions.slice().reverse().map((transaction, idx) => (
                              <div key={idx} className="text-sm py-1 border-b border-gray-200 dark:border-gray-600 last:border-0">
                                <div className="flex justify-between">
                                  <span>{new Date(transaction.date).toLocaleDateString()}</span>
                                  <span className={transaction.type === 'credit' ? 'text-red-500' : 'text-green-500'}>
                                    {transaction.type === 'credit' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{transaction.note}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          {editingCustomerId === customer.id ? (
                            <div className="flex flex-1 gap-2">
                              <input
                                type="number"
                                placeholder="Enter amount"
                                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                value={editingAmount}
                                onChange={(e) => setEditingAmount(e.target.value)}
                              />
                              <button 
                                className="bg-green-500 text-white px-3 py-2 rounded-lg"
                                onClick={() => handleUpdateAmount(customer.id)}
                              >
                                Save
                              </button>
                              <button 
                                className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white px-3 py-2 rounded-lg"
                                onClick={() => {
                                  setEditingCustomerId(null);
                                  setEditingAmount('');
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <button 
                                className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg"
                                onClick={() => {
                                  setEditingCustomerId(customer.id);
                                  setEditingAmount('');
                                }}
                              >
                                Update Balance
                              </button>
                              <button 
                                className="flex-1 bg-green-500 text-white px-3 py-2 rounded-lg"
                                onClick={() => sendReminder(customer)}
                              >
                                Send Reminder
                              </button>
                              <button 
                                className="bg-red-500 text-white px-3 py-2 rounded-lg"
                                onClick={() => handleDeleteCustomer(customer.id)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Add Customer */}
        {activeTab === 'add' && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Add New Customer</h2>
            
            <form onSubmit={handleAddCustomer}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Customer name"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={newCustomer.name}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="Phone number"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={newCustomer.phone}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1">Address</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Address (optional)"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={newCustomer.address}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1">Initial Credit Amount *</label>
                  <input
                    type="number"
                    name="outstandingAmount"
                    required
                    step="0.01"
                    min="0"
                    placeholder="Amount owed"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={newCustomer.outstandingAmount}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                  <textarea
                    name="notes"
                    placeholder="Additional notes (optional)"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    value={newCustomer.notes}
                    onChange={handleInputChange}
                    rows="3"
                  ></textarea>
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-blue-500 text-white font-medium p-3 rounded-lg hover:bg-blue-600 transition"
                >
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Reminder Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">
                  SMS Reminder Template
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Use {'{name}'} for customer name and {'{amount}'} for the amount owed.
                </p>
                <textarea
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  value={reminderTemplate}
                  onChange={(e) => setReminderTemplate(e.target.value)}
                  rows="5"
                ></textarea>
              </div>
              
              <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-1">Preview:</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {reminderTemplate
                    .replace('{name}', 'John Doe')
                    .replace('{amount}', '100.00')}
                </p>
              </div>
              
              <div className="mt-6 border-t pt-6 border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">About This App</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  This app stores all data locally on your device. No data is sent to any server.
                  Make sure to back up your data periodically.
                </p>
                
                <div className="mt-4 flex gap-2">
                  <button
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg"
                    onClick={() => {
                      const dataStr = JSON.stringify(customers);
                      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                      
                      const exportFileDefaultName = 'credit-customers-backup.json';
                      
                      const linkElement = document.createElement('a');
                      linkElement.setAttribute('href', dataUri);
                      linkElement.setAttribute('download', exportFileDefaultName);
                      linkElement.click();
                    }}
                  >
                    Export Data
                  </button>
                  
                  <label className="flex-1 cursor-pointer">
                    <span className="block text-center bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg">
                      Import Data
                    </span>
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            try {
                              const importedData = JSON.parse(evt.target.result);
                              if (Array.isArray(importedData)) {
                                if (window.confirm(`Import ${importedData.length} customers? This will replace your current data.`)) {
                                  setCustomers(importedData);
                                  alert('Data imported successfully!');
                                }
                              } else {
                                alert('Invalid data format');
                              }
                            } catch (err) {
                              alert('Error importing data: ' + err.message);
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <footer className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
          <p>Shop Credit Tracker | Data stored locally on your device</p>
        </footer>
      </div>
    </div>
  );
};

export default App;

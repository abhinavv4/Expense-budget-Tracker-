// Function to get current date and time
function getCurrentDateTime(dateVal) {
    const now = dateVal ? new Date(dateVal) : new Date();
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return now.toLocaleString('en-IN', options);
}
// DOM elements
const balance = document.getElementById('total-amount');
const list = document.getElementById('list');
const form = document.getElementById('expense-form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const category = document.getElementById('category');
const transactionDate = document.getElementById('transaction-date');
const exportBtn = document.getElementById('export-btn');
const budgetInput = document.getElementById('budget');
const budgetAlert = document.getElementById('budget-alert');

// Retrieve transactions from local storage or initialize an empty array
const localStorageTransactions = JSON.parse(localStorage.getItem('transactions'));
let transactions = localStorage.getItem('transactions') !== null ? localStorageTransactions : [];

// Add a new transaction
function addTransaction(e) {
    e.preventDefault();

    if (text.value.trim() === '' || amount.value.trim() === '') {
        alert('Please add a description and amount');
        return;
    }

    const transaction = {
        id: generateID(),
        text: text.value,
        amount: +amount.value,
        category: category.value,
        date: getCurrentDateTime(transactionDate.value)
    };

    transactions.push(transaction);
    addTransactionDOM(transaction);
    updateValues();
    updateLocalStorage();
    updateChart();

    text.value = '';
    amount.value = '';
    transactionDate.value = '';
}

// Generate a random ID
function generateID() {
    return Math.floor(Math.random() * 100000000);
}

// Add transaction to the DOM
function addTransactionDOM(transaction) {
    const item = document.createElement('li');
    item.classList.add('minus');
    // Store the transaction ID in the DOM element
    item.dataset.id = transaction.id;

    item.innerHTML = `
        <div class="item-info">
            ${transaction.text} 
            <span>${transaction.date} • ${transaction.category}</span>
        </div>
        <div>
            ₹${Math.abs(transaction.amount).toFixed(2)}
            <button class="delete-btn">x</button>
        </div>
    `;

    const deleteBtn = item.querySelector('.delete-btn');
    // Add event listener programmatically
    deleteBtn.addEventListener('click', () => removeTransaction(transaction.id));

    list.appendChild(item);
}

// Update the total balance
function updateValues() {
    const amounts = transactions.map(transaction => transaction.amount);
    const total = amounts.reduce((acc, item) => acc + item, 0).toFixed(2);
    balance.innerText = `₹${total}`;

    // Budget check
    const budgetVal = parseFloat(budgetInput.value);
    if (budgetVal > 0) {
        const totalNum = parseFloat(total);
        if (totalNum > budgetVal) {
            budgetAlert.innerText = `Exceeded by ₹${(totalNum - budgetVal).toFixed(2)}`;
            budgetAlert.style.color = '#ffadad'; // Light red for warning
        } else {
            budgetAlert.innerText = `Remaining: ₹${(budgetVal - totalNum).toFixed(2)}`;
            budgetAlert.style.color = '#fff';
        }
    } else {
        budgetAlert.innerText = '';
    }
}

// Remove transaction by ID
function removeTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        // Remove from the transactions array
        transactions = transactions.filter(transaction => transaction.id !== id);
        
        // Update local storage
        updateLocalStorage();
        
        // Remove from the DOM without re-rendering everything
        const itemToRemove = list.querySelector(`li[data-id="${id}"]`);
        if (itemToRemove) {
            itemToRemove.remove();
        }
        
        // Update the total balance
        updateValues();
        updateChart();
    }
}

// Update local storage with current transactions
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Export transactions to CSV
function exportTransactions() {
    if (transactions.length === 0) {
        alert('No transactions to export');
        return;
    }

    const csvRows = [];
    const headers = ['ID', 'Description', 'Amount', 'Category', 'Date'];
    csvRows.push(headers.join(','));

    transactions.forEach(transaction => {
        const row = [
            transaction.id,
            `"${transaction.text.replace(/"/g, '""')}"`, // Escape quotes
            transaction.amount,
            transaction.category,
            `"${transaction.date}"`
        ];
        csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Chart instance
let expenseChart = null;

// Update the chart
function updateChart() {
    const ctx = document.getElementById('expense-chart').getContext('2d');

    // Group transactions by category
    const categoryTotals = transactions.reduce((acc, transaction) => {
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
        return acc;
    }, {});

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    // Destroy previous chart instance if it exists
    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#2ecc71', '#3498db', '#9b59b6', '#f1c40f', '#e74c3c'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Initialize the application
function init() {
    list.innerHTML = '';
    transactions.forEach(addTransactionDOM);
    updateValues();
    
    // Load budget
    const savedBudget = localStorage.getItem('budget');
    if (savedBudget) {
        budgetInput.value = savedBudget;
        updateValues(); // Re-run to update alert
    }
    updateChart();
}

// Initial load
init();

// Event Listeners
form.addEventListener('submit', addTransaction);
exportBtn.addEventListener('click', exportTransactions);
budgetInput.addEventListener('input', () => {
    localStorage.setItem('budget', budgetInput.value);
    updateValues();
});

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
});

function updateThemeIcon(isDark) {
    const icon = themeToggle.querySelector('i');
    if (isDark) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
}

// Check local storage for theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    updateThemeIcon(true);
}

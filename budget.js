// Global Variables
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let monthlyBudget = parseFloat(localStorage.getItem('monthlyBudget')) || 0;
let charts = {};

// Categories Configuration
const categories = {
    income: [
        'Salary',
        'Freelance',
        'Investments',
        'Business',
        'Other Income'
    ],
    expense: [
        'Food & Dining',
        'Transportation',
        'Housing',
        'Utilities',
        'Healthcare',
        'Entertainment',
        'Shopping',
        'Education',
        'Travel',
        'Other Expenses'
    ]
};

// Initialize Budget Tracker
function initializeBudgetTracker() {
    showLoading(true);
    try {
        populateCategories();
        updateBudgetStats();
        updateTransactionsList();
        updateCharts();
        setupEventListeners();
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize budget tracker');
    }
    showLoading(false);
}

// Show/Hide Loading Spinner
function showLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'flex' : 'none';
}

// Populate Category Dropdown
function populateCategories() {
    const categorySelect = document.getElementById('category');
    const transactionType = document.getElementById('type').value;
    const currentCategories = categories[transactionType];

    categorySelect.innerHTML = currentCategories.map(category => 
        `<option value="${category}">${category}</option>`
    ).join('');
}

// Update Budget Statistics
function updateBudgetStats() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    
    const monthlyTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth;
    });

    const monthlySpent = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const remaining = monthlyBudget - monthlySpent;
    const daysInMonth = new Date(currentDate.getFullYear(), currentMonth + 1, 0).getDate();
    const dailyAverage = monthlySpent / currentDate.getDate();

    // Animate value updates
    animateValue('monthlyBudget', monthlyBudget);
    animateValue('monthlySpent', monthlySpent);
    animateValue('monthlyRemaining', remaining);
    animateValue('dailyAverage', dailyAverage);

    // Update card colors based on status
    updateCardStatus(remaining, monthlyBudget);
}

// Animate Value Change
function animateValue(elementId, value) {
    const element = document.getElementById(elementId);
    const start = parseFloat(element.textContent.replace(/[^0-9.-]+/g, '')) || 0;
    const duration = 1000;
    const steps = 20;
    const increment = (value - start) / steps;
    let current = start;
    let step = 0;

    const animation = setInterval(() => {
        current += increment;
        element.textContent = formatCurrency(current);
        step++;

        if (step >= steps) {
            clearInterval(animation);
            element.textContent = formatCurrency(value);
        }
    }, duration / steps);
}

// Update Card Status Colors
function updateCardStatus(remaining, budget) {
    const remainingCard = document.getElementById('monthlyRemaining').parentElement.parentElement;
    const percentage = (remaining / budget) * 100;

    if (percentage <= 20) {
        remainingCard.className = 'card stat-card danger-gradient';
    } else if (percentage <= 50) {
        remainingCard.className = 'card stat-card warning-gradient';
    } else {
        remainingCard.className = 'card stat-card tertiary-gradient';
    }
}

// Add Transaction
async function addTransaction(e) {
    e.preventDefault();
    showLoading(true);

    try {
        const transaction = {
            id: Date.now(),
            description: document.getElementById('description').value,
            amount: parseFloat(document.getElementById('amount').value),
            type: document.getElementById('type').value,
            category: document.getElementById('category').value,
            date: new Date().toISOString()
        };

        transactions.push(transaction);
        localStorage.setItem('transactions', JSON.stringify(transactions));

        updateBudgetStats();
        updateTransactionsList();
        updateCharts();
        showSuccess('Transaction added successfully');

        e.target.reset();
        populateCategories();
    } catch (error) {
        console.error('Error adding transaction:', error);
        showError('Failed to add transaction');
    }

    showLoading(false);
}

// Delete Transaction
async function deleteTransaction(id) {
    showLoading(true);

    try {
        transactions = transactions.filter(t => t.id !== id);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        
        updateBudgetStats();
        updateTransactionsList();
        updateCharts();
        showSuccess('Transaction deleted successfully');
    } catch (error) {
        console.error('Error deleting transaction:', error);
        showError('Failed to delete transaction');
    }

    showLoading(false);
}

// Update Transactions List
function updateTransactionsList(filter = 'all') {
    const transactionsList = document.getElementById('transactionsList');
    let filteredTransactions = [...transactions];

    if (filter !== 'all') {
        filteredTransactions = transactions.filter(t => t.type === filter);
    }

    if (filteredTransactions.length === 0) {
        transactionsList.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="fas fa-receipt fa-3x mb-3"></i>
                    <p>No transactions found</p>
                </td>
            </tr>
        `;
        return;
    }

    transactionsList.innerHTML = filteredTransactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(t => `
            <tr class="transaction-row">
                <td>${new Date(t.date).toLocaleDateString()}</td>
                <td>${t.description}</td>
                <td>
                    <span class="badge bg-info">
                        ${t.category}
                    </span>
                </td>
                <td>
                    <span class="badge ${t.type === 'income' ? 'bg-success' : 'bg-danger'}">
                        ${t.type}
                    </span>
                </td>
                <td class="${t.type === 'income' ? 'text-success' : 'text-danger'} fw-bold">
                    ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteTransaction(${t.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
}

// Update Charts
function updateCharts() {
    updateBudgetChart();
    updateCategoryChart();
}

// Update Budget Chart
function updateBudgetChart() {
    const ctx = document.getElementById('budgetChart').getContext('2d');
    const monthlySpent = transactions
        .filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === new Date().getMonth();
        })
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    if (charts.budget) {
        charts.budget.destroy();
    }

    charts.budget = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Spent', 'Remaining'],
            datasets: [{
                data: [monthlySpent, Math.max(0, monthlyBudget - monthlySpent)],
                backgroundColor: ['#FF6384', '#36A2EB']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Update Category Chart
function updateCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const categoryData = getCategoryData();

    if (charts.category) {
        charts.category.destroy();
    }

    charts.category = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categoryData.labels,
            datasets: [{
                label: 'Amount',
                data: categoryData.values,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#36A2EB'
                ]
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Get Category Data
function getCategoryData() {
    const categoryTotals = {};
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

    return {
        labels: Object.keys(categoryTotals),
        values: Object.values(categoryTotals)
    };
}

// Set Monthly Budget
function setMonthlyBudget() {
    const amount = parseFloat(document.getElementById('budgetAmount').value);
    if (amount > 0) {
        monthlyBudget = amount;
        localStorage.setItem('monthlyBudget', amount);
        updateBudgetStats();
        updateCharts();
        showSuccess('Monthly budget updated successfully');
        bootstrap.Modal.getInstance(document.getElementById('setBudgetModal')).hide();
    }
}

// Format Currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Show Success Message
function showSuccess(message) {
    // Implement your preferred notification system
    alert(message);
}

// Show Error Message
function showError(message) {
    // Implement your preferred notification system
    alert(message);
}

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('transactionForm').addEventListener('submit', addTransaction);
    document.getElementById('type').addEventListener('change', populateCategories);
    document.getElementById('saveBudget').addEventListener('click', setMonthlyBudget);
    document.getElementById('filterAll').addEventListener('click', () => updateTransactionsList('all'));
    document.getElementById('filterIncome').addEventListener('click', () => updateTransactionsList('income'));
    document.getElementById('filterExpense').addEventListener('click', () => updateTransactionsList('expense'));
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initializeBudgetTracker);
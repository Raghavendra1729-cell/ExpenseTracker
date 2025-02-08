// Global Variables
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let charts = {};

// Initialize Dashboard
async function initializeDashboard() {
    showLoading(true);
    try {
        updateDashboardStats();
        createCharts();
        displayRecentTransactions();
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showError('Failed to initialize dashboard');
    }
    showLoading(false);
}

// Show/Hide Loading
function showLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'flex' : 'none';
}

// Update Dashboard Statistics
function updateDashboardStats() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    
    const monthlyTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth;
    });

    const monthlyIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalBalance = transactions
        .reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0);

    const savings = monthlyIncome - monthlyExpenses;

    // Update stats with animation
    animateValue('totalBalance', totalBalance);
    animateValue('monthlyExpenses', monthlyExpenses);
    animateValue('monthlyIncome', monthlyIncome);
    animateValue('savings', savings);
}

// Animate Value Change
function animateValue(elementId, value) {
    const element = document.getElementById(elementId);
    const start = parseFloat(element.textContent.replace(/[^0-9.-]+/g, '')) || 0;
    const duration = 1000; // 1 second
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

// Create Charts
function createCharts() {
    createTrendChart();
    createExpenseChart();
    createIncomeChart();
}

// Create Trend Chart
function createTrendChart() {
    const ctx = document.getElementById('trendChart').getContext('2d');
    const monthlyData = getMonthlyData();

    if (charts.trend) {
        charts.trend.destroy();
    }

    charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthlyData.labels,
            datasets: [
                {
                    label: 'Income',
                    data: monthlyData.income,
                    borderColor: '#36A2EB',
                    backgroundColor: '#36A2EB20',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Expenses',
                    data: monthlyData.expenses,
                    borderColor: '#FF6384',
                    backgroundColor: '#FF638420',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Monthly Income vs Expenses'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f0f0f0'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Create Expense Distribution Chart
function createExpenseChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    const expenseData = getCategoryDistribution('expense');

    if (charts.expense) {
        charts.expense.destroy();
    }

    charts.expense = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: expenseData.labels,
            datasets: [{
                data: expenseData.values,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#2FDE00', '#00A6B4'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12
                    }
                }
            }
        }
    });
}

// Create Income Distribution Chart
function createIncomeChart() {
    const ctx = document.getElementById('incomeChart').getContext('2d');
    const incomeData = getCategoryDistribution('income');

    if (charts.income) {
        charts.income.destroy();
    }

    charts.income = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: incomeData.labels,
            datasets: [{
                data: incomeData.values,
                backgroundColor: [
                    '#2FDE00', '#00A6B4', '#FF6384', '#36A2EB',
                    '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12
                    }
                }
            }
        }
    });
}

// Get Monthly Data
function getMonthlyData() {
    const labels = [];
    const income = [];
    const expenses = [];
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        labels.push(date.toLocaleString('default', { month: 'short' }));
        
        const monthlyTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === date.getMonth() && 
                   tDate.getFullYear() === date.getFullYear();
        });

        income.push(monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0));
            
        expenses.push(monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0));
    }

    return { labels, income, expenses };
}

// Get Category Distribution
function getCategoryDistribution(type) {
    const categoryTotals = {};
    transactions
        .filter(t => t.type === type)
        .forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

    return {
        labels: Object.keys(categoryTotals),
        values: Object.values(categoryTotals)
    };
}

// Display Recent Transactions
function displayRecentTransactions() {
    const recentTransactions = transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    const transactionsList = document.getElementById('recentTransactions');
    
    if (recentTransactions.length === 0) {
        transactionsList.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    <i class="fas fa-receipt fa-3x mb-3"></i>
                    <p>No transactions found</p>
                </td>
            </tr>
        `;
        return;
    }

    transactionsList.innerHTML = recentTransactions.map(t => `
        <tr class="transaction-row">
            <td>${new Date(t.date).toLocaleDateString()}</td>
            <td>${t.description}</td>
            <td>
                <span class="badge bg-info">
                    ${t.category}
                </span>
            </td>
            <td class="${t.type === 'income' ? 'text-success' : 'text-danger'}">
                ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
            </td>
            <td>
                <span class="badge ${t.type === 'income' ? 'bg-success' : 'bg-danger'}">
                    ${t.type}
                </span>
            </td>
        </tr>
    `).join('');
}

// Format Currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Show Error
function showError(message) {
    // Implement error notification here
    console.error(message);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initializeDashboard);

// Refresh data every 5 minutes
setInterval(initializeDashboard, 300000);
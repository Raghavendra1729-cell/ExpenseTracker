// Global Variables
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let charts = {};
let currentChartType = 'line';

// Initialize Analytics
async function initializeAnalytics() {
    showLoading(true);
    try {
        // Fetch initial advice
        await fetchAdvice();

        if (!transactions || transactions.length === 0) {
            hideLoading();
            showEmptyState();
            return;
        }
        await updateDateRange();
        setupChartControls();
        setupEventListeners();
    } catch (error) {
        console.error('Analytics initialization error:', error);
        showError('Failed to initialize analytics');
    }
    showLoading(false);
}

// Fetch Advice from API
async function fetchAdvice() {
    try {
        const response = await fetch('https://api.adviceslip.com/advice');
        const data = await response.json();
        
        const adviceText = document.getElementById('adviceText');
        if (adviceText) {
            // Add fade-out effect
            adviceText.style.opacity = '0';
            
            setTimeout(() => {
                adviceText.textContent = data.slip.advice;
                adviceText.style.opacity = '1';
            }, 300);
        }
    } catch (error) {
        console.error('Error fetching advice:', error);
        document.getElementById('adviceText').textContent = 
            'Unable to load financial tip. Please try again later.';
    }
}

// Show/Hide Loading
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

function hideLoading() {
    showLoading(false);
}

// Show Empty State
function showEmptyState() {
    const containers = [
        'insights', 'recommendations', 'topExpenses'
    ];

    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <h6 class="mb-0">No Data Available</h6>
                    <p class="mb-0">Add transactions in the Budget Tracker to see analytics.</p>
                </div>
            `;
        }
    });

    // Reset stat cards
    document.getElementById('totalSpending').textContent = '$0.00';
    document.getElementById('averageDaily').textContent = '$0.00';
    document.getElementById('savingsRate').textContent = '0%';
    document.getElementById('budgetStatus').textContent = 'No Data';
}

// Update based on Date Range
function updateDateRange() {
    const range = document.getElementById('dateRange').value;
    
    if (range === 'custom') {
        document.querySelector('.custom-date-range').style.display = 'block';
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        if (startDate && endDate) {
            updateAnalytics(filterTransactionsByCustomDate(startDate, endDate));
        }
    } else {
        document.querySelector('.custom-date-range').style.display = 'none';
        const filteredTransactions = filterTransactionsByDate(parseInt(range));
        updateAnalytics(filteredTransactions);
    }
}

// Filter Transactions by Date
function filterTransactionsByDate(days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return transactions.filter(t => new Date(t.date) >= cutoffDate);
}

// Filter Transactions by Custom Date Range
function filterTransactionsByCustomDate(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return transactions.filter(t => {
        const date = new Date(t.date);
        return date >= start && date <= end;
    });
}

// Update Analytics
function updateAnalytics(filteredTransactions) {
    if (!filteredTransactions || filteredTransactions.length === 0) {
        showEmptyState();
        return;
    }

    updateSummaryCards(filteredTransactions);
    updateCharts(filteredTransactions);
    updateTopExpenses(filteredTransactions);
    updateInsights(filteredTransactions);
}

// Update Summary Cards
function updateSummaryCards(filteredTransactions) {
    const totalSpending = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const days = Math.max(1, Math.ceil((new Date() - new Date(Math.min(...filteredTransactions.map(t => t.date)))) / (1000 * 60 * 60 * 24)));
    const averageDaily = totalSpending / days;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpending) / totalIncome * 100) : 0;

    // Animate value updates
    animateValue('totalSpending', totalSpending);
    animateValue('averageDaily', averageDaily);
    animateValue('savingsRate', savingsRate, '%');
    
    // Update budget status
    const budgetStatus = totalSpending <= totalIncome ? 'On Track' : 'Over Budget';
    document.getElementById('budgetStatus').textContent = budgetStatus;
    document.getElementById('budgetTrend').textContent = 
        `${((totalSpending / (totalIncome || 1)) * 100).toFixed(1)}% of income`;

    // Update card colors
    updateCardColors(totalSpending, totalIncome);
}

// Update Card Colors
function updateCardColors(spending, income) {
    const statusCard = document.getElementById('budgetStatus').closest('.card');
    if (spending > income) {
        statusCard.className = 'card stat-card danger-gradient';
    } else if (spending > income * 0.8) {
        statusCard.className = 'card stat-card warning-gradient';
    } else {
        statusCard.className = 'card stat-card quaternary-gradient';
    }
}

// Animate Value Change
function animateValue(elementId, value, suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;

    const start = parseFloat(element.textContent.replace(/[^0-9.-]+/g, '')) || 0;
    const duration = 1000;
    const steps = 20;
    const increment = (value - start) / steps;
    let current = start;
    let step = 0;

    const animation = setInterval(() => {
        current += increment;
        element.textContent = formatValue(current, suffix);
        step++;

        if (step >= steps) {
            clearInterval(animation);
            element.textContent = formatValue(value, suffix);
        }
    }, duration / steps);
}

// Format Value
function formatValue(value, suffix) {
    if (suffix === '%') {
        return value.toFixed(1) + '%';
    }
    return formatCurrency(value);
}

// Update Charts
function updateCharts(filteredTransactions) {
    updateSpendingChart(filteredTransactions);
    updateCategoryChart(filteredTransactions);
    updatePatternChart(filteredTransactions);
}

// Update Spending Chart
function updateSpendingChart(filteredTransactions) {
    const ctx = document.getElementById('spendingChart')?.getContext('2d');
    if (!ctx) return;

    const data = getSpendingData(filteredTransactions);

    if (charts.spending) {
        charts.spending.destroy();
    }

    charts.spending = new Chart(ctx, {
        type: currentChartType,
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Income',
                    data: data.income,
                    borderColor: '#36A2EB',
                    backgroundColor: '#36A2EB20',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Expenses',
                    data: data.expenses,
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
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Get Spending Data
function getSpendingData(filteredTransactions) {
    const dateGroups = {};
    
    filteredTransactions.forEach(t => {
        const date = new Date(t.date).toLocaleDateString();
        if (!dateGroups[date]) {
            dateGroups[date] = { income: 0, expenses: 0 };
        }
        if (t.type === 'income') {
            dateGroups[date].income += t.amount;
        } else {
            dateGroups[date].expenses += t.amount;
        }
    });

    const sortedDates = Object.keys(dateGroups).sort((a, b) => new Date(a) - new Date(b));

    return {
        labels: sortedDates,
        income: sortedDates.map(date => dateGroups[date].income),
        expenses: sortedDates.map(date => dateGroups[date].expenses)
    };
}

// Update Category Chart
function updateCategoryChart(filteredTransactions) {
    const ctx = document.getElementById('categoryChart')?.getContext('2d');
    if (!ctx) return;

    const data = getCategoryData(filteredTransactions);

    if (charts.category) {
        charts.category.destroy();
    }

    charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#36A2EB'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Get Category Data
function getCategoryData(filteredTransactions) {
    const categoryTotals = {};
    
    filteredTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

    return {
        labels: Object.keys(categoryTotals),
        values: Object.values(categoryTotals)
    };
}

// Update Pattern Chart
function updatePatternChart(filteredTransactions) {
    const ctx = document.getElementById('patternChart')?.getContext('2d');
    if (!ctx) return;

    const data = getPatternData(filteredTransactions);

    if (charts.pattern) {
        charts.pattern.destroy();
    }

    charts.pattern = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Average Daily Spending',
                data: data.values,
                backgroundColor: '#FF638440',
                borderColor: '#FF6384',
                pointBackgroundColor: '#FF6384'
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Get Pattern Data
function getPatternData(filteredTransactions) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyTotals = new Array(7).fill(0);
    const dailyCounts = new Array(7).fill(0);

    filteredTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            const day = new Date(t.date).getDay();
            dailyTotals[day] += t.amount;
            dailyCounts[day]++;
        });

    const dailyAverages = dailyTotals.map((total, index) => 
        dailyCounts[index] ? total / dailyCounts[index] : 0
    );

    return {
        labels: daysOfWeek,
        values: dailyAverages
    };
}

// Update Top Expenses
function updateTopExpenses(filteredTransactions) {
    const topExpenses = getTopExpenses(filteredTransactions);
    const container = document.getElementById('topExpenses');
    if (!container) return;

    container.innerHTML = topExpenses.map(expense => `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
                <h6 class="mb-0">${expense.category}</h6>
                <small class="text-muted">${expense.description}</small>
            </div>
            <span class="text-danger fw-bold">${formatCurrency(expense.amount)}</span>
        </div>
    `).join('');
}

// Get Top Expenses
function getTopExpenses(filteredTransactions) {
    return filteredTransactions
        .filter(t => t.type === 'expense')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
}

// Update Insights
function updateInsights(filteredTransactions) {
    const insights = generateInsights(filteredTransactions);
    const recommendations = generateRecommendations(filteredTransactions);

    const insightsContainer = document.getElementById('insights');
    const recommendationsContainer = document.getElementById('recommendations');

    if (insightsContainer) {
        insightsContainer.innerHTML = insights.map(insight => `
            <div class="alert alert-${insight.type} mb-3">
                <h6 class="mb-1"><i class="${insight.icon} me-2"></i>${insight.title}</h6>
                <p class="mb-0">${insight.description}</p>
            </div>
        `).join('');
    }

    if (recommendationsContainer) {
        recommendationsContainer.innerHTML = recommendations.map(rec => `
            <div class="alert alert-info mb-3">
                <h6 class="mb-1"><i class="fas fa-lightbulb me-2"></i>${rec.title}</h6>
                <p class="mb-0">${rec.description}</p>
            </div>
        `).join('');
    }
}

// Generate Insights
function generateInsights(filteredTransactions) {
    const insights = [];
    
    const totalSpending = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    insights.push({
        title: 'Total Spending',
        description: `Your total spending is ${formatCurrency(totalSpending)}`,
        type: 'primary',
        icon: 'fas fa-chart-line'
    });

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpending) / totalIncome * 100) : 0;
    insights.push({
        title: 'Savings Rate',
        description: `Your savings rate is ${savingsRate.toFixed(1)}%`,
        type: savingsRate > 20 ? 'success' : 'warning',
        icon: 'fas fa-piggy-bank'
    });

    const categoryTotals = {};
    filteredTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

    const topCategory = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)[0];

    if (topCategory) {
        insights.push({
            title: 'Top Spending Category',
            description: `${topCategory[0]}: ${formatCurrency(topCategory[1])}`,
            type: 'info',
            icon: 'fas fa-tags'
        });
    }

    return insights;
}

// Generate Recommendations
function generateRecommendations(filteredTransactions) {
    const recommendations = [];
    
    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalSpending = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpending) / totalIncome * 100) : 0;

    if (savingsRate < 20) {
        recommendations.push({
            title: 'Increase Savings',
            description: 'Try to save at least 20% of your income for long-term financial security.'
        });
    }

    if (totalSpending > totalIncome) {
        recommendations.push({
            title: 'Reduce Spending',
            description: 'Your expenses exceed your income. Consider reviewing your budget.'
        });
    }

    const categoryTotals = {};
    filteredTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

    const topCategory = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)[0];

    if (topCategory && (topCategory[1] / totalSpending > 0.4)) {
        recommendations.push({
            title: 'Diversify Spending',
            description: `${topCategory[0]} represents over 40% of your expenses. Consider balancing your spending across categories.`
        });
    }

    return recommendations;
}

// Format Currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Setup Chart Controls
function setupChartControls() {
    const chartButtons = document.querySelectorAll('[data-chart]');
    chartButtons.forEach(button => {
        button.addEventListener('click', () => {
            chartButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentChartType = button.dataset.chart;
            updateDateRange();
        });
    });
}

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('dateRange')?.addEventListener('change', updateDateRange);
    document.getElementById('startDate')?.addEventListener('change', updateDateRange);
    document.getElementById('endDate')?.addEventListener('change', updateDateRange);
    document.getElementById('downloadPDF')?.addEventListener('click', downloadPDF);
    document.getElementById('downloadCSV')?.addEventListener('click', downloadCSV);

    // Added event listener for advice refresh
    const newAdviceBtn = document.getElementById('newAdviceBtn');
    if (newAdviceBtn) {
        newAdviceBtn.addEventListener('click', fetchAdvice);
    }
}

// Download Functions
function downloadPDF() {
    alert('PDF download feature coming soon!');
}

function downloadCSV() {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'financial_report.csv';
    a.click();
}

// Generate CSV
function generateCSV() {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const rows = transactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.description,
        t.category,
        t.type,
        t.amount
    ]);
    
    return [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');
}

// Show Error
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
    errorDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(errorDiv, container.firstChild);
    }

    setTimeout(() => errorDiv.remove(), 5000);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initializeAnalytics);

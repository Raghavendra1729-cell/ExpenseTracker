// API Configuration
const API_KEY = '197def4d69de4d58bed3620ffaa19d3b';
const BASE_URL = 'https://open.er-api.com/v6/latest/';

// Global Variables
let exchangeRates = {};
let lastUpdate = null;

// Currency Details with Flags and Symbols
const currencyDetails = {
    USD: { name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    EUR: { name: 'Euro', symbol: '€', flag: '🇪🇺' },
    GBP: { name: 'British Pound', symbol: '£', flag: '🇬🇧' },
    JPY: { name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
    AUD: { name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
    CAD: { name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
    CHF: { name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
    CNY: { name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
    INR: { name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
    NZD: { name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
    BRL: { name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
    RUB: { name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
    KRW: { name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
    SGD: { name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
    ZAR: { name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
    SEK: { name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
    NOK: { name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
    MXN: { name: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
    AED: { name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
    THB: { name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
    // Add more currencies as needed
};

// Initialize Converter
async function initializeConverter() {
    showLoading(true);
    try {
        await fetchExchangeRates();
        populateCurrencyDropdowns();
        updatePopularRates();
        updateRatesTable();
        setupEventListeners();
        convertCurrency(); // Initial conversion
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize currency converter');
    }
    showLoading(false);
}

// Show/Hide Loading
function showLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'flex' : 'none';
}

// Fetch Exchange Rates
async function fetchExchangeRates(base = 'USD') {
    try {
        const response = await fetch(`${BASE_URL}${base}`);
        const data = await response.json();
        
        if (data.rates) {
            exchangeRates = data.rates;
            lastUpdate = new Date();
            return true;
        }
        throw new Error('Invalid response from API');
    } catch (error) {
        console.error('Error fetching rates:', error);
        showError('Failed to fetch exchange rates');
        return false;
    }
}

// Populate Currency Dropdowns
function populateCurrencyDropdowns() {
    const fromSelect = document.getElementById('fromCurrency');
    const toSelect = document.getElementById('toCurrency');
    
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';
    
    Object.keys(currencyDetails).sort().forEach(currency => {
        const details = currencyDetails[currency];
        const option = `
            <option value="${currency}">
                ${details.flag} ${currency} - ${details.name}
            </option>
        `;
        
        fromSelect.insertAdjacentHTML('beforeend', option);
        toSelect.insertAdjacentHTML('beforeend', option);
    });

    // Set default values
    fromSelect.value = 'USD';
    toSelect.value = 'EUR';
}

// Convert Currency
function convertCurrency() {
    const amount = parseFloat(document.getElementById('fromAmount').value);
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    
    if (isNaN(amount)) {
        showError('Please enter a valid amount');
        return;
    }

    const rate = exchangeRates[toCurrency] / exchangeRates[fromCurrency];
    const result = amount * rate;
    
    document.getElementById('toAmount').value = result.toFixed(2);
    updateConversionDetails(amount, fromCurrency, toCurrency, rate);
}

// Update Conversion Details
function updateConversionDetails(amount, fromCurrency, toCurrency, rate) {
    const detailsContainer = document.getElementById('conversionDetails');
    const fromDetails = currencyDetails[fromCurrency];
    const toDetails = currencyDetails[toCurrency];
    
    detailsContainer.innerHTML = `
        <div class="conversion-details p-3 rounded bg-light">
            <h6 class="mb-2">Conversion Details</h6>
            <p class="mb-1">
                ${fromDetails.flag} 1 ${fromCurrency} = 
                ${toDetails.flag} ${rate.toFixed(4)} ${toCurrency}
            </p>
            <p class="mb-1">
                ${fromDetails.flag} ${amount} ${fromCurrency} = 
                ${toDetails.flag} ${(amount * rate).toFixed(2)} ${toCurrency}
            </p>
            <small class="text-muted">
                Last updated: ${lastUpdate.toLocaleString()}
            </small>
        </div>
    `;
}

// Update Popular Rates
function updatePopularRates() {
    const popularContainer = document.getElementById('popularRates');
    const baseCurrency = document.getElementById('fromCurrency').value;
    const popularCurrencies = ['EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF'];

    popularContainer.innerHTML = popularCurrencies
        .filter(currency => currency !== baseCurrency)
        .map(currency => {
            const rate = exchangeRates[currency] / exchangeRates[baseCurrency];
            const details = currencyDetails[currency];
            return `
                <div class="col-md-4 col-sm-6 mb-3">
                    <div class="card h-100">
                        <div class="card-body">
                            <h6 class="mb-2">
                                ${details.flag} ${currency}
                            </h6>
                            <p class="mb-0 fs-5">
                                ${details.symbol} ${rate.toFixed(4)}
                            </p>
                            <small class="text-muted">
                                ${details.name}
                            </small>
                        </div>
                    </div>
                </div>
            `;
        })
        .join('');
}

// Update Rates Table
function updateRatesTable() {
    const tableBody = document.getElementById('ratesTable');
    const baseCurrency = document.getElementById('fromCurrency').value;
    const searchTerm = document.getElementById('searchCurrency').value.toLowerCase();
    
    const filteredCurrencies = Object.keys(currencyDetails)
        .filter(currency => currency !== baseCurrency)
        .filter(currency => {
            const details = currencyDetails[currency];
            return currency.toLowerCase().includes(searchTerm) || 
                   details.name.toLowerCase().includes(searchTerm);
        });

    tableBody.innerHTML = filteredCurrencies.map(currency => {
        const rate = exchangeRates[currency] / exchangeRates[baseCurrency];
        const details = currencyDetails[currency];
        
        return `
            <tr>
                <td>
                    <span class="me-2">${details.flag}</span>
                    <strong>${currency}</strong> - ${details.name}
                </td>
                <td>
                    <span class="fs-5">${details.symbol} ${rate.toFixed(4)}</span>
                </td>
                <td>
                    <span class="badge bg-success">
                        <i class="fas fa-clock me-1"></i>Live
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="setConversionCurrency('${currency}')">
                        Convert
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Set Conversion Currency
function setConversionCurrency(currency) {
    document.getElementById('toCurrency').value = currency;
    convertCurrency();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Swap Currencies
function swapCurrencies() {
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');
    const fromAmount = document.getElementById('fromAmount');
    const toAmount = document.getElementById('toAmount');

    [fromCurrency.value, toCurrency.value] = [toCurrency.value, fromCurrency.value];
    [fromAmount.value, toAmount.value] = [toAmount.value, fromAmount.value];

    convertCurrency();
    updatePopularRates();
    updateRatesTable();
}

// Show Error
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
    errorDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const form = document.getElementById('converterForm');
    form.insertBefore(errorDiv, form.firstChild);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('converterForm').addEventListener('submit', (e) => {
        e.preventDefault();
        convertCurrency();
    });

    document.getElementById('fromCurrency').addEventListener('change', async () => {
        showLoading(true);
        await fetchExchangeRates(document.getElementById('fromCurrency').value);
        updatePopularRates();
        updateRatesTable();
        convertCurrency();
        showLoading(false);
    });

    document.getElementById('toCurrency').addEventListener('change', convertCurrency);
    document.getElementById('swapCurrencies').addEventListener('click', swapCurrencies);
    document.getElementById('searchCurrency').addEventListener('input', updateRatesTable);

    // Auto-update rates every 5 minutes
    setInterval(async () => {
        await fetchExchangeRates(document.getElementById('fromCurrency').value);
        updatePopularRates();
        updateRatesTable();
        convertCurrency();
    }, 300000);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initializeConverter);
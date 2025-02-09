Personal Budget and Expense Tracker with Currency Converter

Description

This project is a web-based personal budget and expense tracker that helps users log their expenses, categorize spending, and convert transactions into their preferred currency. It provides insights into spending habits using interactive charts and ensures data persistence using LocalStorage. Real-time exchange rates are fetched from the Open Exchange Rates API.

Features

Expense Management: Add, edit, and delete expenses dynamically.

Categorized Insights: Visual representation of spending breakdown using charts.

Currency Conversion: Converts expenses into the user's preferred currency with real-time exchange rates.

Data Persistence: Uses LocalStorage to save expenses and user preferences.

Interactive UI: Uses DOM manipulation for dynamic updates.

Technologies Used

HTML, CSS, JavaScript for frontend development.

Chart.js for graphical representation of spending trends.

Open Exchange Rates API for real-time currency conversion.

LocalStorage API for data persistence.

How It Works

1.⁠ ⁠Adding an Expense

Users enter the amount, select a category, and add a description.

Clicking the "Add Expense" button updates the list and saves data in LocalStorage.

2.⁠ ⁠Editing/Deleting Expenses

Each expense entry includes an edit and delete button.

Editing allows modifying the amount, category, or description.

Deleting removes the expense from the UI and LocalStorage.

3.⁠ ⁠Currency Conversion

Users select their preferred currency from a dropdown menu.

The app fetches real-time exchange rates and converts expenses accordingly.

Converted values are displayed alongside the original amount.

4.⁠ ⁠Spending Insights

Expenses are categorized and displayed in a pie chart.

The app calculates and visualizes the proportion of spending in each category.

Future Enhancements

User authentication for multiple profiles.

Monthly budget limits and notifications.

Export data as CSV or PDF.

Author

Developed by [Your Name]

License

This project is licensed under the MIT License.

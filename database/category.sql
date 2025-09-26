CREATE TABLE category (
    category_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(50) NOT NULL UNIQUE,
    category_description TEXT,
    category_type ENUM('expense', 'income') NOT NULL
);
INSERT INTO category (category_name, category_description, category_type) VALUES
-- Income Categories
('Salary', 'Primary income from employment or wages', 'income'),
('Freelance Work', 'Earnings from freelance or side jobs', 'income'),
('Business Income', 'Revenue from small business or home business activities', 'income'),
('Investments', 'Income from dividends, stocks, or mutual funds', 'income'),
('Rental Income', 'Money earned from renting out property or rooms', 'income'),
('Government Benefits', 'Social security, unemployment, or welfare benefits', 'income'),
('Child Support', 'Payments received for child support', 'income'),
('Alimony Received', 'Alimony received from ex-spouse', 'income'),
('Pension', 'Retirement pension income', 'income'),
('Interest Income', 'Interest earned from bank savings or deposits', 'income'),
('Gifts & Allowances', 'Monetary gifts or allowances from family/friends', 'income'),
('Tax Refunds', 'Refunds from government tax returns', 'income'),
('Scholarships & Grants', 'Educational scholarships or financial aid', 'income'),
('Bonuses', 'Extra income from work bonuses or incentives', 'income'),

-- Expense Categories
('Mortgage/Rent', 'Monthly mortgage payments or rental costs for housing', 'expense'),
('Utilities', 'Household expenses for electricity, water, gas, and internet', 'expense'),
('Groceries', 'Expenses for food, beverages, and household essentials', 'expense'),
('Transportation', 'Fuel, public transit, or vehicle-related costs', 'expense'),
('Insurance', 'Health, home, auto, or life insurance premiums', 'expense'),
('Healthcare', 'Medical, dental, and prescription expenses', 'expense'),
('Childcare', 'Daycare, babysitting, or after-school care expenses', 'expense'),
('Education', 'Tuition fees, school supplies, and educational materials', 'expense'),
('Clothing', 'Expenses for clothes, shoes, and accessories', 'expense'),
('Household Maintenance', 'Repairs, cleaning, and upkeep of the home', 'expense'),
('Subscriptions', 'Recurring costs for streaming, magazines, or software', 'expense'),
('Phone & Internet', 'Mobile plans and internet bills', 'expense'),
('Entertainment', 'Dining out, movies, games, and recreational activities', 'expense'),
('Debt Payments', 'Loan repayments, credit card bills, or installment plans', 'expense'),
('Gifts & Donations', 'Charity donations and gifts for family or friends', 'expense'),
('Travel & Vacations', 'Expenses for holidays, trips, and family vacations', 'expense'),
('Pet Care', 'Food, vet visits, grooming, and pet supplies', 'expense'),
('Home Improvements', 'Renovations, furniture, and new appliances', 'expense'),
('Emergency Fund Contributions', 'Money set aside for unexpected household emergencies', 'expense'),
('Miscellaneous', 'Uncategorized or irregular household expenses', 'expense');

/* 
- Added UNSIGNED for category_id to ensure no negative numbers are allowed
*/
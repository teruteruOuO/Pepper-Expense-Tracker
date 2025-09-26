CREATE TABLE currency (
    currency_code VARCHAR(3) PRIMARY KEY,
    currency_name VARCHAR(50) NOT NULL UNIQUE,
    currency_sign VARCHAR(5) NOT NULL,
    dollar_to_currency DECIMAL(10, 4) NOT NULL
);

-- Insert sample data for currency
INSERT INTO currency (currency_code, currency_name, currency_sign, dollar_to_currency) VALUES
('USD', 'United States Dollar', '$', 1.0000),
('EUR', 'Euro', '€', 0.8500),
('MXN', 'Mexican Peso', 'MX$', 18.2000),
('GBP', 'British Pound', '£', 0.7500);

/*
Revisions:
- currency_name becomes UNIQUE
*/


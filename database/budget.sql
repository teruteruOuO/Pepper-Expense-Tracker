CREATE TABLE budget (
    budget_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED,
    budget_name VARCHAR(150) NOT NULL,
    budget_description TEXT,
    budget_amount DECIMAL(10, 2) NOT NULL,
    budget_used_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    budget_start_date DATE NOT NULL,
    budget_end_date DATE NOT NULL,
    FOREIGN KEY (user_id) 
        REFERENCES user(user_id) 
        ON DELETE CASCADE
);

ALTER TABLE budget 
ADD CONSTRAINT chk_budget_dates 
CHECK (budget_start_date <= budget_end_date);

ALTER TABLE budget 
ADD CONSTRAINT chk_budget_amount 
CHECK (budget_amount > 0);

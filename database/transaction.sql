CREATE TABLE transaction (
    user_id INT UNSIGNED,
    transaction_sequence INT UNSIGNED NOT NULL,
    transaction_name VARCHAR(100) NOT NULL,
    transaction_description TEXT,
    transaction_amount DECIMAL(10, 2) NOT NULL,
    transaction_type ENUM('expense', 'income') NOT NULL,
    transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    category_id INT UNSIGNED NOT NULL,
    budget_id INT UNSIGNED NULL,
    PRIMARY KEY (user_id, transaction_sequence),
    FOREIGN KEY (user_id) 
        REFERENCES user (user_id) 
        ON DELETE CASCADE,
    FOREIGN KEY (category_id) 
        REFERENCES category(category_id)
        ON UPDATE CASCADE,
    FOREIGN KEY (budget_id) 
        REFERENCES budget(budget_id)
        ON DELETE CASCADE
);

ALTER TABLE transaction
ADD COLUMN transaction_resolved BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE transaction
ADD CONSTRAINT transaction_amount_check CHECK (transaction_amount > 0);

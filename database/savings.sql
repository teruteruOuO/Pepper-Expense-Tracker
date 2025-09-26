CREATE TABLE savings (
    user_id INT UNSIGNED,
    savings_sequence INT UNSIGNED,
    savings_name VARCHAR(100) NOT NULL,
    savings_description TEXT,
    savings_target_amount DECIMAL(10, 2) NOT NULL,
    savings_current_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    savings_deadline_date DATE NOT NULL,
    PRIMARY KEY (user_id, savings_sequence),
    FOREIGN KEY (user_id) 
		REFERENCES user(user_id) 
        ON DELETE CASCADE
);

/* Revisions:
- Added UNSIGNED to user_id and savings_sequence to ensure no negative numbers are allowed
*/
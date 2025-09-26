DELIMITER $$

-- BEFORE INSERT on transaction: Ensures expense transactions are within budget timeframe & updates budget_used_amount
CREATE TRIGGER before_insert_transaction
BEFORE INSERT ON transaction
FOR EACH ROW
BEGIN
    -- Validate that income transactions do not refer to a budget
    IF NEW.transaction_type = 'income' AND NEW.budget_id IS NOT NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Income transactions cannot be associated with a budget.';
    END IF;

    -- Validate expense transactions that reference a budget
    IF NEW.transaction_type = 'expense' AND NEW.budget_id IS NOT NULL THEN
        -- Ensure the transaction date falls within the budget period
        IF NOT EXISTS (
            SELECT 1 FROM budget 
            WHERE budget_id = NEW.budget_id
            AND NEW.transaction_date BETWEEN budget_start_date AND budget_end_date
        ) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Transaction date is outside of budget timeframe.';
        END IF;

        -- Update the budget's used_amount
        UPDATE budget
        SET budget_used_amount = budget_used_amount + NEW.transaction_amount
        WHERE budget_id = NEW.budget_id;
    END IF;
END$$

-- BEFORE UPDATE on transaction: Ensures expense modifications stay within budget & updates budget_used_amount
CREATE TRIGGER before_update_transaction
BEFORE UPDATE ON transaction
FOR EACH ROW
BEGIN
    -- Rule 0: Prevent associating an income transaction with any budget
    IF NEW.transaction_type = 'income' AND NEW.budget_id IS NOT NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot associate income types with any budgets';
    END IF;
    
    -- Rule 1: Switching expense to income with a null budget both previously and newly
    IF OLD.transaction_type = 'income' AND NEW.transaction_type = 'expense' 
		AND OLD.budget_id IS NULL AND NEW.budget_id IS NULL THEN
        SET NEW.transaction_resolved = 0;
    END IF;

    -- Rule 2: Moving a transaction from one budget to another
    IF OLD.transaction_type = 'expense' AND NEW.transaction_type = 'expense' 
       AND OLD.budget_id IS NOT NULL AND NEW.budget_id IS NOT NULL THEN
        -- Ensure new transaction date is within the budget period
        IF NOT EXISTS (
            SELECT 1 FROM budget 
            WHERE budget_id = NEW.budget_id
            AND NEW.transaction_date BETWEEN budget_start_date AND budget_end_date
        ) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Updated transaction date is outside of budget timeframe.';
        END IF;

        -- Deduct old transaction amount from old budget
        UPDATE budget
        SET budget_used_amount = budget_used_amount - OLD.transaction_amount
        WHERE budget_id = OLD.budget_id;

        -- Add new transaction amount to new budget
        UPDATE budget
        SET budget_used_amount = budget_used_amount + NEW.transaction_amount
        WHERE budget_id = NEW.budget_id;
    END IF;

    -- Rule 3: Removing a budget reference from an expense transaction
    IF OLD.transaction_type = 'expense' AND OLD.budget_id IS NOT NULL AND NEW.budget_id IS NULL THEN
        -- Deduct old transaction amount from the budget
        UPDATE budget
        SET budget_used_amount = budget_used_amount - OLD.transaction_amount
        WHERE budget_id = OLD.budget_id;
        
        IF NEW.transaction_type = 'income' THEN
			SET NEW.transaction_resolved = 0;
        END IF;
    END IF;

    -- Rule 4: Assigning a budget to an expense transaction that previously had no budget
    IF NEW.transaction_type = 'expense' AND OLD.budget_id IS NULL AND NEW.budget_id IS NOT NULL THEN
        -- Ensure new transaction date is within the budget period
        IF NOT EXISTS (
            SELECT 1 FROM budget 
            WHERE budget_id = NEW.budget_id
            AND NEW.transaction_date BETWEEN budget_start_date AND budget_end_date
        ) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Updated transaction date is outside of budget timeframe.';
        END IF;

        -- Add transaction amount to the new budget
        UPDATE budget
        SET budget_used_amount = budget_used_amount + NEW.transaction_amount
        WHERE budget_id = NEW.budget_id;
    END IF;
    
END$$


-- AFTER DELETE on transaction: Deducts deleted expense amount from budget_used_amount
CREATE TRIGGER after_delete_transaction
AFTER DELETE ON transaction
FOR EACH ROW
BEGIN
    IF OLD.transaction_type = 'expense' AND OLD.budget_id IS NOT NULL THEN
        UPDATE budget
        SET budget_used_amount = budget_used_amount - OLD.transaction_amount
        WHERE budget_id = OLD.budget_id;
    END IF;
END$$


-- BEFORE UPDATE on budget: Ensures transactions remain in budget timeframe
CREATE TRIGGER before_update_budget
BEFORE UPDATE ON budget
FOR EACH ROW
BEGIN
    -- Ensure that modifying start or end date does not make transactions invalid
    IF OLD.budget_start_date != NEW.budget_start_date OR OLD.budget_end_date != NEW.budget_end_date THEN
        IF EXISTS (
            SELECT 1 FROM transaction 
            WHERE budget_id = OLD.budget_id
            AND (transaction_date < NEW.budget_start_date OR transaction_date > NEW.budget_end_date)
        ) THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot update budget dates. Transactions exist outside the new timeframe.';
        END IF;
    END IF;
END$$


-- BEFORE DELETE on budget: Prevents deletion if referenced by transactions
CREATE TRIGGER before_delete_budget
BEFORE DELETE ON budget
FOR EACH ROW
BEGIN
    -- Check if any transaction references this budget
    IF EXISTS (
        SELECT 1 FROM transaction WHERE budget_id = OLD.budget_id
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot delete budget. Remove all transactions referring to this budget first.';
    END IF;
END$$

DELIMITER ;
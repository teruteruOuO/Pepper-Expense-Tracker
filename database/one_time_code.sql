CREATE TABLE one_time_code (
    user_id INT UNSIGNED PRIMARY KEY,
    code_description VARCHAR(255) NOT NULL,
    code_start_date TIMESTAMP DEFAULT NOW() NOT NULL,
    code_expiration_date TIMESTAMP NOT NULL,
    code_status ENUM('inuse', 'resolved') NOT NULL,
    FOREIGN KEY (user_id) 
		REFERENCES user (user_id) ON DELETE CASCADE
);

/*
Revisions:
- Added UNSIGNED for user_id to ensure no negative numbers are allowed
- Added code_start_date and code_status
*/

-- Adds a 10 minute expiration date for each code
DELIMITER $$
CREATE TRIGGER set_expiration_time
BEFORE INSERT ON one_time_code
FOR EACH ROW
BEGIN
    -- Set code_start_date to the current timestamp if not explicitly provided
    IF NEW.code_start_date IS NULL THEN
        SET NEW.code_start_date = NOW();
    END IF;

    -- Calculate expiration date based on the start date
    SET NEW.code_expiration_date = NEW.code_start_date + INTERVAL 10 MINUTE;
END$$
DELIMITER ;

-- The following triggers avoids multiple "inuse" instances for each user, meaning that only one "inuse" is allowed per user 
DELIMITER //

CREATE TRIGGER before_one_time_code_insert
BEFORE INSERT ON one_time_code
FOR EACH ROW
BEGIN
    DECLARE existing_count INT;

    -- Count the number of existing 'inuse' records for the user
    SELECT COUNT(*) INTO existing_count
    FROM one_time_code
    WHERE user_id = NEW.user_id AND code_status = 'inuse';

    -- If an 'inuse' record already exists, prevent the insertion
    IF existing_count > 0 AND NEW.code_status = 'inuse' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Only one "inuse" code per user is allowed.';
    END IF;
END;
//

CREATE TRIGGER before_one_time_code_update
BEFORE UPDATE ON one_time_code
FOR EACH ROW
BEGIN
    DECLARE existing_count INT;

    -- Count the number of existing 'inuse' records for the user excluding the current record being updated
    SELECT COUNT(*) INTO existing_count
    FROM one_time_code
    WHERE user_id = NEW.user_id AND code_status = 'inuse' AND user_id != OLD.user_id;

    -- If another 'inuse' record already exists, prevent the update
    IF existing_count > 0 AND NEW.code_status = 'inuse' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Only one "inuse" code per user is allowed.';
    END IF;
END;
//

DELIMITER ;


-- Ensure each code are resolved if the current time exceeds or is greater than the expiration date 
DELIMITER $$

CREATE EVENT update_expired_codes
ON SCHEDULE EVERY 5 MINUTE
DO
BEGIN
    UPDATE one_time_code
    SET code_status = 'resolved'
    WHERE code_status = 'inuse' 
      AND code_expiration_date <= NOW();
END $$

DELIMITER ;
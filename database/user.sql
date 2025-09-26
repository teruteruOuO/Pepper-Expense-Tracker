CREATE TABLE user (
    user_id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_username VARCHAR(50) NOT NULL UNIQUE,
    user_password VARCHAR(255) NOT NULL,
    user_first_name VARCHAR(50) NOT NULL,
    user_initial CHAR(1),
    user_last_name VARCHAR(50) NOT NULL,
    user_email VARCHAR(100) NOT NULL UNIQUE,
    user_email_verified BOOLEAN NOT NULL DEFAULT 0,
    user_notification BOOLEAN NOT NULL DEFAULT 1,
    user_start_date TIMESTAMP DEFAULT NOW(),
    currency_code VARCHAR(3) DEFAULT "USD",
    FOREIGN KEY (currency_code) 
		REFERENCES currency (currency_code),
	CONSTRAINT user_email_check
		CHECK (user_email LIKE '%_@_%._%'),
	CONSTRAINT user_username_check 
		CHECK (user_username REGEXP '^[A-Za-z0-9_]+$'),
	CONSTRAINT user_initial_check 
		CHECK (user_initial REGEXP '^[a-z]$')
);

ALTER TABLE user
ADD user_address VARCHAR(255) NULL,
ADD user_city VARCHAR(255) NULL;

ALTER TABLE user
ADD COLUMN user_state ENUM(
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
) NULL;

ALTER TABLE user
ADD COLUMN user_zip CHAR(5) NULL;

/*
Revisions:
- Added user_initial as an attribute.
- Added constraints for user_email attribute (Ensures the email has @XXX.XXX)
- Added username constraint that disables users to have whitespace in their username
- Added user initial constraint disables users to put anything in their initial other than alphabets
- Added UNSIGNED for user_id to ensure no negative numbers are allowed
- Added ON UPDATE CASCADE for currency_code to ensure any changes from a row of currency table is updated to the user table 
- Added user_active to determine if a user currently disables their account from being used
- Added user_email_verified to determine if the user's email is verified in the system
*/

ALTER TABLE user
MODIFY user_email_verified BOOLEAN NOT NULL DEFAULT 1;

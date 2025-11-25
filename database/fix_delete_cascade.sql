-- Fix Delete User Functionality
-- Add CASCADE DELETE to user_roles foreign key

USE CAAutomationStation;
GO

-- Check if the foreign key exists
IF EXISTS (
    SELECT * FROM sys.foreign_keys 
    WHERE name = 'FK_user_roles_users'
)
BEGIN
    -- Drop existing foreign key
    ALTER TABLE user_roles DROP CONSTRAINT FK_user_roles_users;
    PRINT 'Dropped existing foreign key';
END
GO

-- Add foreign key with CASCADE DELETE
ALTER TABLE user_roles
ADD CONSTRAINT FK_user_roles_users
FOREIGN KEY (user_id) REFERENCES users(user_id)
ON DELETE CASCADE;
GO

PRINT '✅ Foreign key added with CASCADE DELETE';
PRINT 'Users can now be deleted successfully!';
GO

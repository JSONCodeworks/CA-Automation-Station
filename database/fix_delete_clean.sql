USE CAAutomationStation;
GO

PRINT 'Fixing foreign key constraints...';

-- Fix 1: user_roles (CASCADE DELETE)
DECLARE @fk1 NVARCHAR(255);
SELECT @fk1 = name FROM sys.foreign_keys 
WHERE parent_object_id = OBJECT_ID('user_roles') 
AND referenced_object_id = OBJECT_ID('users');

IF @fk1 IS NOT NULL 
BEGIN
    EXEC('ALTER TABLE user_roles DROP CONSTRAINT ' + @fk1);
END

ALTER TABLE user_roles
ADD CONSTRAINT FK_user_roles_users
FOREIGN KEY (user_id) REFERENCES users(user_id)
ON DELETE CASCADE;

PRINT 'user_roles: CASCADE DELETE';

-- Fix 2: audit_logs (SET NULL - preserve history)
DECLARE @fk2 NVARCHAR(255);
SELECT @fk2 = name FROM sys.foreign_keys 
WHERE parent_object_id = OBJECT_ID('audit_logs') 
AND referenced_object_id = OBJECT_ID('users');

IF @fk2 IS NOT NULL 
BEGIN
    EXEC('ALTER TABLE audit_logs DROP CONSTRAINT ' + @fk2);
END

-- Make user_id nullable
ALTER TABLE audit_logs ALTER COLUMN user_id INT NULL;

ALTER TABLE audit_logs
ADD CONSTRAINT FK_audit_logs_users
FOREIGN KEY (user_id) REFERENCES users(user_id)
ON DELETE SET NULL;

PRINT 'audit_logs: SET NULL';

-- Fix 3: resources (make nullable then SET NULL)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'resources')
BEGIN
    DECLARE @fk3 NVARCHAR(255);
    SELECT @fk3 = name FROM sys.foreign_keys 
    WHERE parent_object_id = OBJECT_ID('resources') 
    AND referenced_object_id = OBJECT_ID('users');
    
    IF @fk3 IS NOT NULL 
    BEGIN
        EXEC('ALTER TABLE resources DROP CONSTRAINT ' + @fk3);
    END
    
    -- Make created_by nullable
    ALTER TABLE resources ALTER COLUMN created_by INT NULL;
    
    ALTER TABLE resources
    ADD CONSTRAINT FK_resources_users
    FOREIGN KEY (created_by) REFERENCES users(user_id)
    ON DELETE SET NULL;
    
    PRINT 'resources: SET NULL';
END

PRINT '';
PRINT 'All constraints fixed!';
PRINT 'Users can now be deleted successfully.';
GO

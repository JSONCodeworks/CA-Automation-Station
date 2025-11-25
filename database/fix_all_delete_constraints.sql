-- Fix All Delete User Constraints
-- Add CASCADE DELETE to all foreign keys referencing users table

USE CAAutomationStation;
GO

PRINT '🔧 Fixing foreign key constraints for user deletion...';
PRINT '';

-- Fix 1: user_roles foreign key
PRINT '1. Fixing user_roles constraint...';
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_user_roles_users' OR parent_object_id = OBJECT_ID('user_roles') AND referenced_object_id = OBJECT_ID('users'))
BEGIN
    DECLARE @fk_user_roles NVARCHAR(255);
    SELECT @fk_user_roles = name 
    FROM sys.foreign_keys 
    WHERE parent_object_id = OBJECT_ID('user_roles') 
    AND referenced_object_id = OBJECT_ID('users');
    
    IF @fk_user_roles IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE user_roles DROP CONSTRAINT ' + @fk_user_roles);
        PRINT '   ✓ Dropped old user_roles constraint';
    END
END

ALTER TABLE user_roles
ADD CONSTRAINT FK_user_roles_users
FOREIGN KEY (user_id) REFERENCES users(user_id)
ON DELETE CASCADE;
PRINT '   ✓ Added CASCADE DELETE to user_roles';
PRINT '';

-- Fix 2: audit_logs foreign key
PRINT '2. Fixing audit_logs constraint...';
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('audit_logs') AND referenced_object_id = OBJECT_ID('users'))
BEGIN
    DECLARE @fk_audit_logs NVARCHAR(255);
    SELECT @fk_audit_logs = name 
    FROM sys.foreign_keys 
    WHERE parent_object_id = OBJECT_ID('audit_logs') 
    AND referenced_object_id = OBJECT_ID('users');
    
    IF @fk_audit_logs IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE audit_logs DROP CONSTRAINT ' + @fk_audit_logs);
        PRINT '   ✓ Dropped old audit_logs constraint';
    END
END

ALTER TABLE audit_logs
ADD CONSTRAINT FK_audit_logs_users
FOREIGN KEY (user_id) REFERENCES users(user_id)
ON DELETE SET NULL;  -- Use SET NULL for audit logs to preserve history
PRINT '   ✓ Added SET NULL to audit_logs (preserves audit history)';
PRINT '';

-- Fix 3: resources foreign key (if exists)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'resources')
BEGIN
    PRINT '3. Fixing resources constraint...';
    IF EXISTS (SELECT * FROM sys.foreign_keys WHERE parent_object_id = OBJECT_ID('resources') AND referenced_object_id = OBJECT_ID('users'))
    BEGIN
        DECLARE @fk_resources NVARCHAR(255);
        SELECT @fk_resources = name 
        FROM sys.foreign_keys 
        WHERE parent_object_id = OBJECT_ID('resources') 
        AND referenced_object_id = OBJECT_ID('users');
        
        IF @fk_resources IS NOT NULL
        BEGIN
            EXEC('ALTER TABLE resources DROP CONSTRAINT ' + @fk_resources);
            PRINT '   ✓ Dropped old resources constraint';
        END
        
        ALTER TABLE resources
        ADD CONSTRAINT FK_resources_users
        FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON DELETE SET NULL;
        PRINT '   ✓ Added SET NULL to resources';
    END
    PRINT '';
END

PRINT '✅ All constraints fixed!';
PRINT '';
PRINT 'Summary:';
PRINT '  • user_roles: CASCADE DELETE (roles deleted with user)';
PRINT '  • audit_logs: SET NULL (audit history preserved)';
PRINT '  • resources: SET NULL (resources preserved)';
PRINT '';
PRINT '🎉 Users can now be deleted successfully!';
GO

-- Verify the fixes
PRINT '';
PRINT 'Verification:';
SELECT 
    OBJECT_NAME(fk.parent_object_id) AS [Table],
    COL_NAME(fc.parent_object_id, fc.parent_column_id) AS [Column],
    fk.delete_referential_action_desc AS [Delete Action]
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fc ON fk.object_id = fc.constraint_object_id
WHERE fk.referenced_object_id = OBJECT_ID('users')
ORDER BY [Table];
GO

-- Make sure user_id in audit_logs allows NULL
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('audit_logs') AND name = 'user_id')
BEGIN
    ALTER TABLE audit_logs ALTER COLUMN user_id INT NULL;
    PRINT '';
    PRINT '✓ Updated audit_logs.user_id to allow NULL values';
END
GO

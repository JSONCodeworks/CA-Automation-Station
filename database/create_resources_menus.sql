-- Create Resources Menu System
USE CAAutomationStation;
GO

-- Create resources navigation menu table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='navmenu_resources' and xtype='U')
BEGIN
    CREATE TABLE navmenu_resources (
        menu_id INT IDENTITY(1,1) PRIMARY KEY,
        icon NVARCHAR(255) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        route NVARCHAR(500) NOT NULL,
        display_order INT NOT NULL,
        is_active BIT DEFAULT 1,
        description NVARCHAR(MAX),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
    
    PRINT '✓ navmenu_resources table created';
END
GO

-- Insert resource menu items
DELETE FROM navmenu_resources;

INSERT INTO navmenu_resources (icon, title, route, display_order, description, is_active) VALUES
('cloud_queue', 'CyberArk ISP (POC)', '/resources/cyberark-isp', 1, 'Deploy CyberArk Identity Security Platform POC', 1),
('cloud_done', 'CyberArk TestDrive (POV)', '/resources/cyberark-testdrive', 2, 'Deploy CyberArk TestDrive POV Environment', 1),
('computer', 'SkyTap Environment', '/resources/skytap', 3, 'Deploy SkyTap Virtual Environment', 1);

PRINT '✓ Resource menu items created';
GO

-- Create automation_epod_templates table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='automation_epod_templates' and xtype='U')
BEGIN
    CREATE TABLE automation_epod_templates (
        template_id INT IDENTITY(1,1) PRIMARY KEY,
        template_name NVARCHAR(255) NOT NULL,
        template_description NVARCHAR(MAX),
        template_visible BIT DEFAULT 1,
        template_config NVARCHAR(MAX), -- JSON config
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
    
    PRINT '✓ automation_epod_templates table created';
END
GO

-- Insert sample templates
IF NOT EXISTS (SELECT * FROM automation_epod_templates WHERE template_name = 'Standard TestDrive')
BEGIN
    INSERT INTO automation_epod_templates (template_name, template_description, template_visible) VALUES
    ('Standard TestDrive', 'Standard CyberArk TestDrive configuration with all core components', 1),
    ('Privilege Cloud', 'Privilege Cloud focused configuration', 1),
    ('PAM Self-Hosted', 'Self-Hosted PAM suite', 1),
    ('Identity Security', 'Identity Security Platform configuration', 1),
    ('Full Suite', 'Complete CyberArk suite with all products', 1);
    
    PRINT '✓ Sample templates created';
END
GO

-- Add phone number to users table if not exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'phone_number')
BEGIN
    ALTER TABLE users ADD phone_number NVARCHAR(20) NULL;
    PRINT '✓ phone_number column added to users table';
END
GO

PRINT '';
PRINT '✅ Resources menu system created successfully!';
PRINT '';
PRINT 'Created:';
PRINT '  • navmenu_resources table with 3 items';
PRINT '  • automation_epod_templates table with 5 templates';
PRINT '  • phone_number column in users table';
GO

-- Verify
SELECT 'Resources Menu Items:' AS Info;
SELECT menu_id, title, route, display_order FROM navmenu_resources ORDER BY display_order;

SELECT '' AS Separator;
SELECT 'ePOD Templates:' AS Info;
SELECT template_id, template_name, template_visible FROM automation_epod_templates WHERE template_visible = 1;
GO

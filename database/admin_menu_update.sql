-- Add Admin Navigation Menu Table
USE CAAutomationStation;
GO

-- Create admin navigation menu table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='navmenu_admin' and xtype='U')
BEGIN
    CREATE TABLE navmenu_admin (
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
END
GO

-- Insert default admin menu items
IF NOT EXISTS (SELECT * FROM navmenu_admin WHERE title = 'User Management')
BEGIN
    INSERT INTO navmenu_admin (icon, title, route, display_order, description) VALUES
    ('people', 'User Management', '/admin/users', 1, 'Manage users, roles, and permissions'),
    ('menu', 'Menu Management', '/admin/menus', 2, 'Manage navigation menus'),
    ('settings', 'Configuration', '/admin/config', 3, 'Application settings and configuration'),
    ('security', 'Security & Audit', '/admin/security', 4, 'View audit logs and security settings'),
    ('integration', 'Integrations', '/admin/integrations', 5, 'Manage AWS, Slack, and SSO integrations');
END
GO

-- Create index for performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_navmenu_admin_display_order')
BEGIN
    CREATE NONCLUSTERED INDEX IX_navmenu_admin_display_order ON navmenu_admin(display_order);
END
GO

PRINT 'Admin menu table created successfully!';
GO

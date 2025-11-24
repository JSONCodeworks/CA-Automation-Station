-- CA Automation Station Database Schema
-- SQL Server Database Schema

USE master;
GO

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'CAAutomationStation')
BEGIN
    CREATE DATABASE CAAutomationStation;
END
GO

USE CAAutomationStation;
GO

-- Table: Local Users
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' and xtype='U')
BEGIN
    CREATE TABLE users (
        user_id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(255) UNIQUE NOT NULL,
        password_hash NVARCHAR(512) NOT NULL,
        email NVARCHAR(255) UNIQUE NOT NULL,
        full_name NVARCHAR(255),
        title NVARCHAR(255),
        profile_picture NVARCHAR(MAX),
        is_sso_user BIT DEFAULT 0,
        sso_provider NVARCHAR(100),
        sso_user_id NVARCHAR(255),
        is_active BIT DEFAULT 1,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        last_login DATETIME2
    );
END
GO

-- Table: User Roles
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_roles' and xtype='U')
BEGIN
    CREATE TABLE user_roles (
        role_id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        role_name NVARCHAR(50) NOT NULL,
        assigned_at DATETIME2 DEFAULT GETDATE(),
        assigned_by INT,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        CONSTRAINT UQ_user_role UNIQUE(user_id, role_name)
    );
END
GO

-- Table: Navigation Menu - Main Page
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='navmenu_main' and xtype='U')
BEGIN
    CREATE TABLE navmenu_main (
        menu_id INT IDENTITY(1,1) PRIMARY KEY,
        icon NVARCHAR(255) NOT NULL,
        title NVARCHAR(255) NOT NULL,
        route NVARCHAR(500) NOT NULL,
        display_order INT NOT NULL,
        is_active BIT DEFAULT 1,
        required_role NVARCHAR(50),
        created_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Table: Application Configuration
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='app_config' and xtype='U')
BEGIN
    CREATE TABLE app_config (
        config_id INT IDENTITY(1,1) PRIMARY KEY,
        config_key NVARCHAR(255) UNIQUE NOT NULL,
        config_value NVARCHAR(MAX),
        config_type NVARCHAR(50),
        description NVARCHAR(MAX),
        is_editable BIT DEFAULT 1,
        updated_at DATETIME2 DEFAULT GETDATE(),
        updated_by INT
    );
END
GO

-- Table: Audit Logs
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='audit_logs' and xtype='U')
BEGIN
    CREATE TABLE audit_logs (
        log_id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id INT,
        action NVARCHAR(255) NOT NULL,
        entity_type NVARCHAR(100),
        entity_id NVARCHAR(255),
        details NVARCHAR(MAX),
        ip_address NVARCHAR(45),
        user_agent NVARCHAR(MAX),
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(user_id)
    );
END
GO

-- Table: Resources (for provisioning tracking)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='resources' and xtype='U')
BEGIN
    CREATE TABLE resources (
        resource_id INT IDENTITY(1,1) PRIMARY KEY,
        resource_type NVARCHAR(100) NOT NULL,
        resource_name NVARCHAR(255) NOT NULL,
        resource_identifier NVARCHAR(255) UNIQUE,
        status NVARCHAR(50) DEFAULT 'pending',
        created_by INT NOT NULL,
        configuration NVARCHAR(MAX),
        aws_resource_id NVARCHAR(255),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (created_by) REFERENCES users(user_id)
    );
END
GO

-- Insert default admin user
IF NOT EXISTS (SELECT * FROM users WHERE username = 'admin@jsoncloudworks.com')
BEGIN
    -- Password hash for 'T3@mw0rK!' using bcrypt format
    INSERT INTO users (username, password_hash, email, full_name, title, is_sso_user, is_active)
    VALUES (
        'admin@jsoncloudworks.com',
        '$2b$10$rqKZJ9J5kQxW1K.YHxqH3.VGKvVxGXZ8VxWh5KxqH3.VGKvVxGXZ8V', -- This will be replaced by actual bcrypt hash in app
        'admin@jsoncloudworks.com',
        'System Administrator',
        'Administrator',
        0,
        1
    );
    
    -- Assign admin role
    DECLARE @admin_user_id INT = (SELECT user_id FROM users WHERE username = 'admin@jsoncloudworks.com');
    INSERT INTO user_roles (user_id, role_name) VALUES (@admin_user_id, 'admin');
END
GO

-- Insert default navigation menu items for main page
IF NOT EXISTS (SELECT * FROM navmenu_main WHERE title = 'Dashboard')
BEGIN
    INSERT INTO navmenu_main (icon, title, route, display_order, required_role) VALUES
    ('dashboard', 'Dashboard', '/dashboard', 1, NULL),
    ('add_circle', 'Create Resources', '/resources/create', 2, NULL),
    ('assessment', 'Reports', '/reports', 3, NULL),
    ('inventory', 'Resource Inventory', '/resources/inventory', 4, NULL),
    ('settings', 'Administration', '/admin', 5, 'admin');
END
GO

-- Insert default application configuration
IF NOT EXISTS (SELECT * FROM app_config WHERE config_key = 'app_title')
BEGIN
    INSERT INTO app_config (config_key, config_value, config_type, description, is_editable) VALUES
    ('app_title', 'CA Automation Station', 'string', 'Application title displayed in top bar', 1),
    ('app_logo', '/assets/logo.png', 'string', 'Path to application logo', 1),
    ('welcome_message', 'Welcome to CA Automation Station', 'string', 'Welcome message on landing page', 1),
    ('sso_enabled', 'true', 'boolean', 'Enable CyberArk SSO authentication', 1),
    ('slack_enabled', 'false', 'boolean', 'Enable Slack integration', 1),
    ('theme', 'dark', 'string', 'Application theme (dark/light)', 1);
END
GO

-- Create indexes for performance
CREATE NONCLUSTERED INDEX IX_users_email ON users(email);
CREATE NONCLUSTERED INDEX IX_users_username ON users(username);
CREATE NONCLUSTERED INDEX IX_audit_logs_user_id ON audit_logs(user_id);
CREATE NONCLUSTERED INDEX IX_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE NONCLUSTERED INDEX IX_resources_created_by ON resources(created_by);
CREATE NONCLUSTERED INDEX IX_resources_status ON resources(status);
GO

PRINT 'CA Automation Station database schema created successfully!';
GO

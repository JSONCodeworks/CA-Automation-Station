// Database Configuration
const sql = require('mssql');
const { logger } = require('../utils/logger');

const config = {
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT) || 1433,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        enableArithAbort: true,
        connectionTimeout: 30000,
        requestTimeout: 30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool;

async function initializeDatabase() {
    try {
        logger.info('Initializing database connection...');
        pool = await sql.connect(config);
        logger.info('✅ Database connection established successfully');
        
        // Test query
        const result = await pool.request().query('SELECT 1 AS test');
        logger.info('Database connection test successful');
        
        return pool;
    } catch (err) {
        logger.error('Database connection failed:', err);
        throw err;
    }
}

async function getConnection() {
    if (!pool || !pool.connected) {
        logger.info('Pool not connected, reinitializing...');
        await initializeDatabase();
    }
    return pool;
}

async function executeQuery(query, params = {}) {
    try {
        const connection = await getConnection();
        const request = connection.request();
        
        // Add parameters to request
        for (const [key, value] of Object.entries(params)) {
            request.input(key, value);
        }
        
        const result = await request.query(query);
        return result;
    } catch (err) {
        logger.error('Query execution error:', err);
        throw err;
    }
}

async function executeStoredProcedure(procedureName, params = {}) {
    try {
        const connection = await getConnection();
        const request = connection.request();
        
        // Add parameters to request
        for (const [key, value] of Object.entries(params)) {
            request.input(key, value);
        }
        
        const result = await request.execute(procedureName);
        return result;
    } catch (err) {
        logger.error('Stored procedure execution error:', err);
        throw err;
    }
}

module.exports = {
    sql,
    initializeDatabase,
    getConnection,
    executeQuery,
    executeStoredProcedure,
    config
};

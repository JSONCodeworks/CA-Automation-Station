// Passport Configuration for Authentication
const LocalStrategy = require('passport-local').Strategy;
const SAMLStrategy = require('passport-saml').Strategy;
const bcrypt = require('bcryptjs');
const { executeQuery } = require('./database');
const { logger } = require('../utils/logger');

module.exports = function(passport) {
    
    // Serialize user
    passport.serializeUser((user, done) => {
        done(null, user.user_id);
    });

    // Deserialize user
    passport.deserializeUser(async (id, done) => {
        try {
            const result = await executeQuery(
                'SELECT * FROM users WHERE user_id = @userId',
                { userId: id }
            );
            
            if (result.recordset.length > 0) {
                done(null, result.recordset[0]);
            } else {
                done(new Error('User not found'), null);
            }
        } catch (err) {
            done(err, null);
        }
    });

    // Local Strategy for username/password login
    passport.use('local', new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password'
    }, async (username, password, done) => {
        try {
            logger.info(`Local login attempt for user: ${username}`);
            
            const result = await executeQuery(
                'SELECT * FROM users WHERE username = @username AND is_active = 1',
                { username }
            );
            
            if (result.recordset.length === 0) {
                return done(null, false, { message: 'Invalid username or password' });
            }
            
            const user = result.recordset[0];
            
            // Check if user is SSO user
            if (user.is_sso_user) {
                return done(null, false, { message: 'Please login using SSO' });
            }
            
            // Verify password
            const isMatch = await bcrypt.compare(password, user.password_hash);
            
            if (!isMatch) {
                return done(null, false, { message: 'Invalid username or password' });
            }
            
            // Update last login
            await executeQuery(
                'UPDATE users SET last_login = GETDATE() WHERE user_id = @userId',
                { userId: user.user_id }
            );
            
            logger.info(`User ${username} logged in successfully`);
            return done(null, user);
            
        } catch (err) {
            logger.error('Local authentication error:', err);
            return done(err);
        }
    }));

    // CyberArk SAML Strategy
    if (process.env.SSO_ENABLED === 'true') {
        passport.use('cyberark-saml', new SAMLStrategy({
            callbackUrl: process.env.CYBERARK_CALLBACK_URL,
            entryPoint: process.env.CYBERARK_ENTRY_POINT,
            issuer: process.env.CYBERARK_ISSUER,
            cert: process.env.CYBERARK_CERT,
            identifierFormat: null,
            signatureAlgorithm: 'sha256',
            digestAlgorithm: 'sha256'
        }, async (profile, done) => {
            try {
                logger.info('CyberArk SSO login attempt:', profile);
                
                const email = profile.email || profile.nameID;
                const fullName = profile.displayName || profile.name || '';
                const ssoUserId = profile.nameID;
                
                // Check if user exists
                let result = await executeQuery(
                    'SELECT * FROM users WHERE sso_user_id = @ssoUserId OR email = @email',
                    { ssoUserId, email }
                );
                
                let user;
                
                if (result.recordset.length === 0) {
                    // Create new SSO user
                    logger.info(`Creating new SSO user: ${email}`);
                    
                    const insertResult = await executeQuery(
                        `INSERT INTO users (username, email, full_name, is_sso_user, sso_provider, sso_user_id, password_hash, profile_picture)
                         OUTPUT INSERTED.*
                         VALUES (@email, @email, @fullName, 1, 'CyberArk Identity', @ssoUserId, 'SSO_USER', @picture)`,
                        {
                            email,
                            fullName,
                            ssoUserId,
                            picture: profile.picture || null
                        }
                    );
                    
                    user = insertResult.recordset[0];
                } else {
                    user = result.recordset[0];
                    
                    // Update user information from SSO
                    await executeQuery(
                        `UPDATE users 
                         SET full_name = @fullName,
                             profile_picture = @picture,
                             last_login = GETDATE()
                         WHERE user_id = @userId`,
                        {
                            userId: user.user_id,
                            fullName,
                            picture: profile.picture || user.profile_picture
                        }
                    );
                }
                
                logger.info(`SSO user ${email} logged in successfully`);
                return done(null, user);
                
            } catch (err) {
                logger.error('CyberArk SSO authentication error:', err);
                return done(err);
            }
        }));
    }
};

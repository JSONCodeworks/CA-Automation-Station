// SAML Configuration for CyberArk Identity
const { executeQuery } = require('./database');
const { logger } = require('../utils/logger');

let SamlStrategy;
try {
  SamlStrategy = require('passport-saml').Strategy;
} catch (err) {
  logger.warn('passport-saml not installed - SSO disabled');
  SamlStrategy = null;
}

// Function to format certificate properly
function formatCertificate(cert) {
  if (!cert) return '';
  
  // Remove any existing formatting
  let cleaned = cert
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\s/g, '');
  
  // Add proper line breaks every 64 characters
  const formatted = cleaned.match(/.{1,64}/g).join('\n');
  
  // Return with proper BEGIN/END markers
  return `-----BEGIN CERTIFICATE-----\n${formatted}\n-----END CERTIFICATE-----`;
}

const rawCert = process.env.SAML_CERT || '';
const formattedCert = formatCertificate(rawCert);

const samlConfig = {
  // CyberArk Identity URLs
  entryPoint: process.env.SAML_ENTRY_POINT || 'https://acd4365.id.cyberark.cloud/saml/sso',
  issuer: process.env.SAML_ISSUER || 'ca-automation-station',
  callbackUrl: process.env.SAML_CALLBACK_URL || 'http://localhost:5000/api/auth/saml/callback',
  
  // Certificate from CyberArk Identity (properly formatted)
  cert: formattedCert,
  
  // Identity Provider URLs
  identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  
  // Attribute mapping
  attributeConsumingServiceIndex: false,
  disableRequestedAuthnContext: true,
  
  // Security
  signatureAlgorithm: 'sha256',
  digestAlgorithm: 'sha256',
  
  // Accept unsigned responses for debugging (remove in production)
  wantAssertionsSigned: false,
  wantAuthnResponseSigned: false
};

let samlStrategy = null;

if (SamlStrategy) {
  samlStrategy = new SamlStrategy(
    samlConfig,
    async (profile, done) => {
      try {
        logger.info('SAML profile received', { 
          email: profile.nameID || profile.email,
          attributes: Object.keys(profile) 
        });

        // Extract user info from SAML response
        const email = profile.nameID || profile.email || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'];
        const firstName = profile.firstName || profile.givenName || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] || '';
        const lastName = profile.lastName || profile.surname || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'] || '';
        const fullName = profile.displayName || `${firstName} ${lastName}`.trim() || email;

        if (!email) {
          return done(new Error('Email not provided in SAML response'));
        }

        // Check if user exists
        let result = await executeQuery(
          'SELECT * FROM users WHERE email = @email',
          { email }
        );

        let user;
        
        if (result.recordset.length === 0) {
          // Create new SSO user
          // Note: password_hash is set to NULL for SSO users (they use Identity for auth)
          const insertResult = await executeQuery(
            `INSERT INTO users (username, email, full_name, password_hash, is_sso_user, is_active, created_at, updated_at)
             OUTPUT INSERTED.*
             VALUES (@email, @email, @fullName, NULL, 1, 1, GETDATE(), GETDATE())`,
            { email, fullName }
          );
          
          user = insertResult.recordset[0];
          
          // Assign default role
          await executeQuery(
            `INSERT INTO user_roles (user_id, role_name) VALUES (@userId, 'viewer')`,
            { userId: user.user_id }
          );
          
          logger.info('Created new SSO user', { email, user_id: user.user_id });
        } else {
          user = result.recordset[0];
          
          // Update last login
          await executeQuery(
            `UPDATE users SET last_login = GETDATE(), updated_at = GETDATE() WHERE user_id = @userId`,
            { userId: user.user_id }
          );
          
          logger.info('SSO user logged in', { email, user_id: user.user_id });
        }

        // Get user roles
        const rolesResult = await executeQuery(
          'SELECT role_name FROM user_roles WHERE user_id = @userId',
          { userId: user.user_id }
        );
        
        user.roles = rolesResult.recordset.map(r => r.role_name).join(',');

        return done(null, user);
        
      } catch (err) {
        logger.error('SAML authentication error:', err);
        return done(err);
      }
    }
  );
}

module.exports = { samlStrategy, samlConfig };

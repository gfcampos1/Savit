require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { csrfMiddleware } = require('./middleware/csrf');
const { requestLogger } = require('./middleware/requestLogger');
const { getRateLimitStore } = require('./utils/rateLimitStore');

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const categoryRoutes = require('./routes/categories');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;

// Railway/Reverse proxy support (needed for correct req.ip, secure cookies, etc.)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.disable('x-powered-by');

const encryptionKey = String(process.env.ENCRYPTION_KEY || '').trim();
const encryptionKeys = String(process.env.ENCRYPTION_KEYS || '').trim();
const hasEncryption = (encryptionKeys && encryptionKeys.split(',').some(k => k.trim().length >= 16)) || (encryptionKey && encryptionKey.length >= 16);
if (!hasEncryption) {
    console.error('❌ ENCRYPTION_KEY(S) ausente/fraca. Defina ENCRYPTION_KEY (>=16 chars) ou ENCRYPTION_KEYS (csv, ideal 32+).');
    process.exit(1);
}

if (process.env.NODE_ENV === 'production') {
    if (!String(process.env.HMAC_KEY || '').trim()) {
        console.warn('⚠️  HMAC_KEY não configurado. Hashes determinísticos vão usar ENCRYPTION_KEY(S) (evite rotacionar sem HMAC_KEY estável).');
    }
    if (!String(process.env.SESSION_SECRET || '').trim()) {
        console.warn('⚠️  SESSION_SECRET não configurado. Refresh token hashing vai usar JWT_SECRET (recomendado definir SESSION_SECRET em produção).');
    }
}

// Security middleware
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    // Keep CSP on (defense-in-depth against XSS)
    contentSecurityPolicy: {
        useDefaults: true,
        directives: (() => {
            const directives = {
            "default-src": ["'self'"],
            "base-uri": ["'self'"],
            "object-src": ["'none'"],
            "frame-ancestors": ["'none'"],
            "img-src": ["'self'", "data:", "blob:"],
            "script-src": ["'self'"],
            "style-src": ["'self'", "'unsafe-inline'"],
            "font-src": ["'self'", "data:"],
            "connect-src": ["'self'"]
            };
            if (process.env.NODE_ENV === 'production') {
                directives['upgrade-insecure-requests'] = [];
            }
            return directives;
        })()
    }
}));

// Extra security headers
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
app.use((req, res, next) => {
    // helmet v7+ may not ship permissionsPolicy middleware in this build; set header explicitly.
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    next();
});

// Structured request logging
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    store: getRateLimitStore('rl:api:'),
    message: { error: 'Muitas requisições, tente novamente mais tarde.' }
});
app.use('/api/', limiter);

// CORS
function parseAllowedOrigins() {
    const urls = String(process.env.FRONTEND_URLS || '').split(',').map(s => s.trim()).filter(Boolean);
    const single = String(process.env.FRONTEND_URL || '').trim();
    const allowed = new Set(urls);
    if (single) allowed.add(single);
    if (allowed.size === 0) {
        allowed.add('http://localhost:3000');
    }
    return allowed;
}

const allowedOrigins = parseAllowedOrigins();

app.use(cors({
    origin: (origin, cb) => {
        // Allow same-origin / server-to-server requests (no Origin header)
        if (!origin) return cb(null, true);
        if (allowedOrigins.has(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CSRF protection (for cookie-based auth)
app.use(csrfMiddleware());

// Health check (public - for Railway)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stats', statsRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (err && err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: 'CORS bloqueado para esta origem.' });
    }
    req.log?.error({ err }, 'Unhandled error');
    res.status(500).json({ error: 'Algo deu errado!' });
});

app.listen(PORT, () => {
    console.log(`🚀 Savit server running on port ${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} in your browser`);
});

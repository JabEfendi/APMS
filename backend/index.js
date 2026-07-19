
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());

const ensureBrandsTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS brands (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
};

const syncBrandsTable = async () => {
    await ensureBrandsTable();

    await pool.query(`
        INSERT INTO brands (name)
        SELECT DISTINCT brand_name
        FROM (
            SELECT BTRIM("Brand") AS brand_name
            FROM "VENDOR_PRICE"
            WHERE "Brand" IS NOT NULL

            UNION

            SELECT BTRIM("Brand") AS brand_name
            FROM "DATA_INQUIRY"
            WHERE "Brand" IS NOT NULL
        ) AS source_brands
        WHERE brand_name <> ''
          AND UPPER(brand_name) <> 'NAN'
          AND UPPER(brand_name) <> 'LEGEND'
        ON CONFLICT (name) DO UPDATE
        SET is_active = TRUE,
            updated_at = CURRENT_TIMESTAMP
    `);
};

// Helper function to get table name from slug
const getTableName = (slug) => {
    const tableMap = {
        'inquiries': 'DATA_INQUIRY',
        'customers': 'CUST_MASTER',
        'vendors': 'VENDOR_MASTER',
        'master-items': 'VENDOR_PRICE',
        'tracking': 'DATA_TRACKING',
        'logbook-ba': 'LOGBOOK_BA',
        'quotations': 'Quotation_Generator',
        'cost-saving': 'Cost_Saving_calculator',
        'requests': 'new_item_requests'
    };
    return tableMap[slug] || null;
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Helper function to build dynamic query with filters
const buildQuery = (table, filters = {}, page = 1, limit = 15) => {
    let query = `SELECT * FROM "${table}" WHERE 1=1`;
    const values = [];
    let paramIndex = 1;

    // Define filter column mappings per table
    const tableFilterColumns = {
        'DATA_INQUIRY': {
            'customer': 'Customer_Name',
            'status': 'Data_Status',
            'search': ['Inquiry_ID', 'Customer_Name', 'Part_Number', 'Part_Name']
        },
        'VENDOR_PRICE': {
            'brand': 'Brand',
            'model': 'Model',
            'search': ['Int__Part_Number', 'Part_Name', 'Brand', 'Model']
        }
    };

    const filterConfig = tableFilterColumns[table] || {};

    Object.keys(filters).forEach(key => {
        if (filters[key] && key !== 'page' && key !== 'limit') {
            if (key === 'search') {
                // For search queries
                const searchFields = filterConfig.search || [];
                if (searchFields.length > 0) {
                    const searchClauses = searchFields.map(field => `"${field}" ILIKE $${paramIndex}`);
                    query += ` AND (${searchClauses.join(' OR ')})`;
                    values.push(`%${filters[key]}%`);
                    paramIndex++;
                }
            } else {
                // For regular filters
                const column = filterConfig[key] || key;
                query += ` AND "${column}" = $${paramIndex}`;
                values.push(filters[key]);
                paramIndex++;
            }
        }
    });

    // Add order by id (default)
    query += ` ORDER BY id`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    return { query, values };
};

// Helper function to count total items
const buildCountQuery = (table, filters = {}) => {
    let query = `SELECT COUNT(*) as total FROM "${table}" WHERE 1=1`;
    const values = [];
    let paramIndex = 1;

    // Define filter column mappings per table
    const tableFilterColumns = {
        'DATA_INQUIRY': {
            'customer': 'Customer_Name',
            'status': 'Data_Status',
            'search': ['Inquiry_ID', 'Customer_Name', 'Part_Number', 'Part_Name']
        },
        'VENDOR_PRICE': {
            'brand': 'Brand',
            'model': 'Model',
            'search': ['Int__Part_Number', 'Part_Name', 'Brand', 'Model']
        }
    };

    const filterConfig = tableFilterColumns[table] || {};

    Object.keys(filters).forEach(key => {
        if (filters[key] && key !== 'page' && key !== 'limit') {
            if (key === 'search') {
                const searchFields = filterConfig.search || [];
                if (searchFields.length > 0) {
                    const searchClauses = searchFields.map(field => `"${field}" ILIKE $${paramIndex}`);
                    query += ` AND (${searchClauses.join(' OR ')})`;
                    values.push(`%${filters[key]}%`);
                    paramIndex++;
                }
            } else {
                const column = filterConfig[key] || key;
                query += ` AND "${column}" = $${paramIndex}`;
                values.push(filters[key]);
                paramIndex++;
            }
        }
    });

    return { query, values };
};

// Test endpoint
app.get('/', (req, res) => {
    res.send('APMS Backend API is running');
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            status: 'ok',
            database: 'connected'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            status: 'error',
            database: 'disconnected'
        });
    }
});

// Brand master endpoint
app.get('/api/brands', async (req, res) => {
    try {
        await syncBrandsTable();

        const result = await pool.query(`
            SELECT id, name
            FROM brands
            WHERE is_active = TRUE
            ORDER BY name ASC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        
        if (!username || !email || !password || !role) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const validRoles = ['requester', 'validator', 'approver', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
            [username, email, passwordHash, role]
        );
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current user endpoint
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [req.user.id]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Stats endpoint for dashboard
app.get('/api/stats', async (req, res) => {
    try {
        const [inquiriesResult, customersResult, vendorsResult, masterItemsResult] = await Promise.all([
            pool.query(`SELECT COUNT(*) as total FROM "DATA_INQUIRY"`),
            pool.query(`SELECT COUNT(*) as total FROM "CUST_MASTER"`),
            pool.query(`SELECT COUNT(*) as total FROM "VENDOR_MASTER"`),
            pool.query(`SELECT COUNT(*) as total FROM "VENDOR_PRICE" WHERE "Data_Status" != 'LEGEND'`)
        ]);

        const pendingCheckResult = await pool.query(`SELECT COUNT(*) as total FROM "DATA_INQUIRY" WHERE "Data_Status" IN ('Pending', 'Checking')`);
        const pendingApprovalResult = await pool.query(`SELECT COUNT(*) as total FROM "DATA_INQUIRY" WHERE "Data_Status" IN ('Waiting Approval', 'Approval')`);

        res.json({
            totalInquiries: parseInt(inquiriesResult.rows[0].total),
            totalCustomers: parseInt(customersResult.rows[0].total),
            totalVendors: parseInt(vendorsResult.rows[0].total),
            totalMasterItems: parseInt(masterItemsResult.rows[0].total),
            pendingCheck: parseInt(pendingCheckResult.rows[0].total),
            pendingApproval: parseInt(pendingApprovalResult.rows[0].total)
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST endpoint for new item request
app.post('/api/new-item-request', async (req, res) => {
    try {
        const { partNo, partName, brand, model, vin } = req.body;
        const requestNumber = `REQ-${Date.now()}`;

        const result = await pool.query(
            `INSERT INTO new_item_requests (request_number, part_no, part_name, brand, model, vin, status) VALUES ($1, $2, $3, $4, $5, $6, 'validation') RETURNING *`,
            [requestNumber, partNo, partName, brand, model, vin]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// Validate request endpoint (for validators)
app.put('/api/requests/:id/validate', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'approve' or 'reject'
        
        if (req.user.role !== 'validator' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        let newStatus;
        if (action === 'approve') {
            newStatus = 'approval';
        } else if (action === 'reject') {
            newStatus = 'rejected';
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }
        
        const result = await pool.query(
            'UPDATE new_item_requests SET status = $1, validated_by = $2, validated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [newStatus, req.user.id, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// Approve request endpoint (for approvers)
app.put('/api/requests/:id/approve', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'approve' or 'reject'
        
        if (req.user.role !== 'approver' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        let newStatus;
        if (action === 'approve') {
            newStatus = 'approved';
        } else if (action === 'reject') {
            newStatus = 'rejected';
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }
        
        const result = await pool.query(
            'UPDATE new_item_requests SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [newStatus, req.user.id, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// Get detail request by row id
app.get('/api/requests/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM new_item_requests WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// Get detail inquiry by row id
app.get('/api/inquiries/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM "DATA_INQUIRY" WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inquiry not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// Get detail master item by row id
app.get('/api/master-items/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM "VENDOR_PRICE" WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Master item not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// Generic GET endpoint for all tables
app.get('/api/:tableSlug', async (req, res) => {
    try {
        const table = getTableName(req.params.tableSlug);
        if (!table) {
            return res.status(404).json({ error: 'Table not found' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;

        // Get data with pagination
        const { query: dataQuery, values: dataValues } = buildQuery(table, req.query, page, limit);
        const dataResult = await pool.query(dataQuery, dataValues);

        // Get total count
        const { query: countQuery, values: countValues } = buildCountQuery(table, req.query);
        const countResult = await pool.query(countQuery, countValues);

        res.json({
            data: dataResult.rows,
            total: parseInt(countResult.rows[0].total),
            page,
            limit,
            totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

syncBrandsTable()
    .then(() => {
        console.log('Brand master synchronized');
    })
    .catch((err) => {
        console.error('Failed to synchronize brand master:', err.message);
    })
    .finally(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    });

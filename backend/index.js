
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
app.use(express.json({ limit: '20mb' }));

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

const ensureNewItemRequestsTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS new_item_requests (
            id SERIAL PRIMARY KEY,
            request_number VARCHAR(255) NOT NULL,
            inquiry_id VARCHAR(255),
            customer VARCHAR(255),
            part_no VARCHAR(255),
            part_name VARCHAR(255),
            brand VARCHAR(255),
            model VARCHAR(255),
            series_type VARCHAR(255),
            year VARCHAR(50),
            workshop_name VARCHAR(255),
            vin VARCHAR(255),
            data_status VARCHAR(255),
            vendor_id VARCHAR(255),
            vendor_name VARCHAR(255),
            category_part VARCHAR(255),
            currency VARCHAR(50),
            atpm_price VARCHAR(255),
            cost_price VARCHAR(255),
            hpp_idr VARCHAR(255),
            update_date VARCHAR(50),
            item_image_url TEXT,
            item_image_name VARCHAR(255),
            item_image_mime_type VARCHAR(255),
            attachment_url TEXT,
            attachment_name VARCHAR(255),
            attachment_mime_type VARCHAR(255),
            notes TEXT,
            status VARCHAR(255) DEFAULT 'validation',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS request_number VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS inquiry_id VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS customer VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS part_no VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS part_name VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS brand VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS model VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS series_type VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS year VARCHAR(50)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS workshop_name VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS vin VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS data_status VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS vendor_id VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS category_part VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS currency VARCHAR(50)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS atpm_price VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS cost_price VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS hpp_idr VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS update_date VARCHAR(50)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS item_image_url TEXT`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS item_image_name VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS item_image_mime_type VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS attachment_url TEXT`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS attachment_mime_type VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS notes TEXT`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'validation'`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS validated_by INTEGER`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS approved_by INTEGER`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
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
        const {
            inquiryId,
            customer,
            partNo,
            partName,
            brand,
            model,
            seriesType,
            year,
            workshopName,
            vin,
            dataStatus,
            vendorId,
            vendorName,
            categoryPart,
            currency,
            atpmPrice,
            costPrice,
            hppIdr,
            updateDate,
            itemImageUrl,
            itemImageName,
            itemImageMimeType,
            attachmentUrl,
            attachmentName,
            attachmentMimeType,
            notes
        } = req.body;

        if (!inquiryId || !partNo || !partName || !brand || !model || !vendorName) {
            return res.status(400).json({ error: 'Inquiry ID, part number, part name, brand, model, and vendor are required' });
        }

        const requestNumber = `REQ-${Date.now()}`;

        const result = await pool.query(
            `INSERT INTO new_item_requests (
                request_number,
                inquiry_id,
                customer,
                part_no,
                part_name,
                brand,
                model,
                series_type,
                year,
                workshop_name,
                vin,
                data_status,
                vendor_id,
                vendor_name,
                category_part,
                currency,
                atpm_price,
                cost_price,
                hpp_idr,
                update_date,
                item_image_url,
                item_image_name,
                item_image_mime_type,
                attachment_url,
                attachment_name,
                attachment_mime_type,
                notes,
                status
            )
             VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, 'validation'
             )
             RETURNING *`,
            [
                requestNumber,
                inquiryId,
                customer || null,
                partNo,
                partName,
                brand,
                model,
                seriesType || null,
                year || null,
                workshopName || null,
                vin || null,
                dataStatus || null,
                vendorId || null,
                vendorName,
                categoryPart || null,
                currency || null,
                atpmPrice || null,
                costPrice || null,
                hppIdr || null,
                updateDate || null,
                itemImageUrl || null,
                itemImageName || null,
                itemImageMimeType || null,
                attachmentUrl || null,
                attachmentName || null,
                attachmentMimeType || null,
                notes || null
            ]
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

Promise.all([syncBrandsTable(), ensureNewItemRequestsTable()])
    .then(() => {
        console.log('Brand master synchronized');
        console.log('Request table synchronized');
    })
    .catch((err) => {
        console.error('Failed to synchronize brand master:', err.message);
    })
    .finally(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    });

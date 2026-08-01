
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const VALID_USER_ROLES = ['sales', 'purchasing', 'admin'];
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

const normalizeRole = (role) => {
    if (!role) {
        return '';
    }

    if (role === 'requester') {
        return 'sales';
    }

    if (role === 'validator' || role === 'approver') {
        return 'purchasing';
    }

    return role;
};

const canManagePurchasingFlow = (role) => {
    const normalizedRole = normalizeRole(role);
    return normalizedRole === 'purchasing' || normalizedRole === 'admin';
};

const isSalesRole = (role) => normalizeRole(role) === 'sales';

const REQUEST_SALES_HIDDEN_FIELDS = [
    'vendor_id',
    'vendor_name',
    'category_part',
    'currency',
    'atpm_price',
    'cost_price',
    'hpp_idr',
    'status',
    'status_id',
    'po_process',
    'po_number',
    'po_date',
    'validated_by',
    'validated_at',
    'approved_by',
    'approved_at',
    'created_by'
];
const INQUIRY_SALES_HIDDEN_FIELDS = [
    'ATPM_Price',
    'HPP',
    'Total_HPP',
    'Vendor_ID',
    'Vendor_Name',
    'PROCUREMNT_NAME_FIX',
    'ID_FIX',
    'Diskon__',
    'Diskon_',
    'Selling_Price_After_Disc_',
    'Checklist_PO',
    'No__PO',
    'PO_Date'
];
const INQUIRY_INTERNAL_FIELDS = [
    'Source_Request_Id',
    'Source_Request_Number',
    'Request_Workflow_Status'
];

const REQUEST_SALES_EDITABLE_FIELD_MAP = {
    inquiryId: 'inquiry_id',
    inquiryDate: 'inquiry_date',
    salesName: 'sales_name',
    customer: 'customer',
    customerType: 'customer_type',
    partNo: 'part_no',
    partName: 'part_name',
    brand: 'brand',
    model: 'model',
    seriesType: 'series_type',
    year: 'year',
    quantity: 'quantity',
    uom: 'uom',
    vin: 'vin',
    notes: 'notes',
    itemImages: 'item_images',
    itemImageUrl: 'item_image_url',
    itemImageName: 'item_image_name',
    itemImageMimeType: 'item_image_mime_type',
    attachmentUrl: 'attachment_url',
    attachmentName: 'attachment_name',
    attachmentMimeType: 'attachment_mime_type'
};

const REQUEST_PURCHASING_EDITABLE_FIELD_MAP = {
    ...REQUEST_SALES_EDITABLE_FIELD_MAP,
    dataStatus: 'data_status',
    statusReason: 'status_reason',
    progressNotes: 'progress_notes',
    statusId: 'status_id',
    poProcess: 'po_process',
    poNumber: 'po_number',
    poDate: 'po_date',
    vendorId: 'vendor_id',
    vendorName: 'vendor_name',
    categoryPart: 'category_part',
    currency: 'currency',
    atpmPrice: 'atpm_price',
    costPrice: 'cost_price',
    sellingPrice: 'selling_price',
    updateDate: 'update_date'
};

const INQUIRY_EDITABLE_FIELD_MAP = {
    inquiryId: 'Inquiry_ID',
    inquiryDate: 'Inquiry_Date',
    salesName: 'Sales_Name',
    customer: 'Customer_Name',
    customerType: 'Customer_Type',
    partNo: 'Part_Number',
    workshopPartName: 'Workshop_Part_Name',
    partName: 'Part_Name',
    brand: 'Brand',
    model: 'Model',
    year: 'Year',
    uom: 'UOM',
    progressNotes: 'Progress_Notes'
};

const MASTER_ITEM_EDITABLE_FIELD_MAP = {
    dataStatus: 'Data_Status',
    partNumber: 'Int__Part_Number',
    partName: 'Part_Name',
    workshopName: 'Workshop_Name',
    brand: 'Brand',
    model: 'Model',
    seriesType: 'Series___Type',
    year: 'Year',
    stockStatus: 'Stock_Status',
    stockQty: 'Stock_Qty',
    vendorId: 'Vendor_ID',
    vendorName: 'Vendor_Name',
    categoryPart: 'Category_Part',
    currency: 'Currency',
    atpmPrice: 'ATPM_PRICE',
    costPrice: 'Cost_Price',
    sellingPrice: 'Selling_Price',
    updateDate: 'Update_Date'
};

const omitFields = (row, fields = []) => {
    if (!row) {
        return row;
    }

    const sanitizedRow = { ...row };
    fields.forEach((field) => {
        delete sanitizedRow[field];
    });

    return sanitizedRow;
};

const sanitizeRequestRow = (row, role) => {
    if (!row) {
        return row;
    }

    if (isSalesRole(role)) {
        return omitFields(row, REQUEST_SALES_HIDDEN_FIELDS);
    }

    return row;
};

const sanitizeInquiryRow = (row, role) => {
    if (!row) {
        return row;
    }

    const sanitizedRow = omitFields(row, INQUIRY_INTERNAL_FIELDS);

    if (isSalesRole(role)) {
        return omitFields(sanitizedRow, INQUIRY_SALES_HIDDEN_FIELDS);
    }

    return sanitizedRow;
};

const normalizeFileEntry = (file) => {
    if (!file || typeof file !== 'object') {
        return null;
    }

    const url = typeof file.url === 'string' ? file.url.trim() : '';
    if (!url) {
        return null;
    }

    return {
        url,
        name: typeof file.name === 'string' ? file.name.trim() : '',
        mimeType: typeof file.mimeType === 'string' ? file.mimeType.trim() : ''
    };
};

const normalizeItemImages = (itemImages) => {
    if (!Array.isArray(itemImages)) {
        return [];
    }

    return itemImages
        .map(normalizeFileEntry)
        .filter(Boolean);
};

const getPrimaryImageFromGallery = (itemImages = []) => {
    if (!Array.isArray(itemImages) || itemImages.length === 0) {
        return {
            itemImageUrl: null,
            itemImageName: null,
            itemImageMimeType: null
        };
    }

    return {
        itemImageUrl: itemImages[0].url || null,
        itemImageName: itemImages[0].name || null,
        itemImageMimeType: itemImages[0].mimeType || null
    };
};

const fillMissingInquiryIds = (rows = []) => {
    let currentInquiryId = '';

    return rows.map((row) => {
        const inquiryId = String(row?.Inquiry_ID || '').trim();

        if (inquiryId) {
            currentInquiryId = inquiryId;
            return row;
        }

        if (!currentInquiryId) {
            return row;
        }

        return {
            ...row,
            Inquiry_ID: currentInquiryId
        };
    });
};

const resolveFilledInquiryRow = async (row) => {
    if (!row) {
        return row;
    }

    const inquiryId = String(row.Inquiry_ID || '').trim();
    if (inquiryId || !row.id) {
        return row;
    }

    const fallbackResult = await pool.query(
        `SELECT "Inquiry_ID"
         FROM "DATA_INQUIRY"
         WHERE id <= $1
           AND NULLIF(BTRIM(COALESCE("Inquiry_ID", '')), '') IS NOT NULL
         ORDER BY id DESC
         LIMIT 1`,
        [row.id]
    );

    if (fallbackResult.rows.length === 0) {
        return row;
    }

    return {
        ...row,
        Inquiry_ID: fallbackResult.rows[0].Inquiry_ID
    };
};

const sanitizeRowsForTable = (table, rows, role) => {
    if (table === 'new_item_requests') {
        return rows.map((row) => sanitizeRequestRow(row, role));
    }

    if (table === 'DATA_INQUIRY') {
        return fillMissingInquiryIds(rows).map((row) => sanitizeInquiryRow(row, role));
    }

    return rows;
};

const normalizeComparableText = (value) => String(value || '').trim().toLowerCase();

const isSameSalesIdentity = (user, salesName) => {
    if (!user) {
        return false;
    }

    return normalizeComparableText(user.username) === normalizeComparableText(salesName);
};

const canSalesAccessInquiry = (user, inquiryRow) => {
    if (!isSalesRole(user?.role)) {
        return true;
    }

    return isSameSalesIdentity(user, inquiryRow?.Sales_Name);
};

const canSalesAccessRequest = (user, requestRow) => {
    if (!isSalesRole(user?.role)) {
        return true;
    }

    if (requestRow?.created_by === user.id) {
        return true;
    }

    return isSameSalesIdentity(user, requestRow?.sales_name);
};

const buildSalesOwnershipClause = (table, user, startParamIndex) => {
    if (!isSalesRole(user?.role)) {
        return { clause: '', values: [], nextParamIndex: startParamIndex };
    }

    if (table === 'DATA_INQUIRY') {
        return {
            clause: ` AND LOWER(BTRIM(COALESCE("Sales_Name", ''))) = $${startParamIndex}`,
            values: [normalizeComparableText(user.username)],
            nextParamIndex: startParamIndex + 1
        };
    }

    if (table === 'new_item_requests') {
        return {
            clause: ` AND (created_by = $${startParamIndex} OR LOWER(BTRIM(COALESCE(sales_name, ''))) = $${startParamIndex + 1})`,
            values: [user.id, normalizeComparableText(user.username)],
            nextParamIndex: startParamIndex + 2
        };
    }

    return { clause: '', values: [], nextParamIndex: startParamIndex };
};

const parseNumericInput = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    let normalized = String(value).trim().replace(/[^\d.,-]/g, '');
    if (!normalized) {
        return null;
    }

    const dotMatches = normalized.match(/\./g) || [];
    const commaMatches = normalized.match(/,/g) || [];

    if (normalized.includes(',') && normalized.includes('.')) {
        if (normalized.lastIndexOf(',') > normalized.lastIndexOf('.')) {
            normalized = normalized.replace(/\./g, '').replace(',', '.');
        } else {
            normalized = normalized.replace(/,/g, '');
        }
    } else if (commaMatches.length > 0 && dotMatches.length === 0) {
        if (commaMatches.length > 1) {
            normalized = normalized.replace(/,/g, '');
        } else {
            const separatorIndex = normalized.indexOf(',');
            const digitsAfterSeparator = normalized.length - separatorIndex - 1;
            normalized = digitsAfterSeparator === 3
                ? normalized.replace(/,/g, '')
                : normalized.replace(',', '.');
        }
    } else if (dotMatches.length > 0 && commaMatches.length === 0) {
        if (dotMatches.length > 1) {
            normalized = normalized.replace(/\./g, '');
        } else {
            const separatorIndex = normalized.indexOf('.');
            const digitsAfterSeparator = normalized.length - separatorIndex - 1;
            if (digitsAfterSeparator === 3) {
                normalized = normalized.replace(/\./g, '');
            }
        }
    }

    const parsedValue = Number(normalized);
    return Number.isFinite(parsedValue) ? parsedValue : null;
};

const calculateHppIdr = (costPrice) => {
    const parsedCost = parseNumericInput(costPrice);

    if (parsedCost === null) {
        return null;
    }

    // Formula revisi saat ini: HPP mengikuti 100% dari cost.
    return String(parsedCost);
};

const calculateTotalHpp = (hppValue, quantity) => {
    const parsedHpp = parseNumericInput(hppValue);
    const parsedQuantity = parseNumericInput(quantity);

    if (parsedHpp === null || parsedQuantity === null) {
        return null;
    }

    return String(parsedHpp * parsedQuantity);
};

const calculateAgingDaysFromDate = (value) => {
    if (!value) {
        return null;
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    return String(Math.max(0, Math.floor((Date.now() - parsedDate.getTime()) / (1000 * 60 * 60 * 24))));
};

const syncApprovedRequestToInquiry = async (client, requestRow, actingUser = null) => {
    if (!requestRow || requestRow.status !== 'approved') {
        return null;
    }

    const sourceRequestId = requestRow.id;
    const inquiryPayload = {
        dataStatus: requestRow.data_status || 'Complete',
        salesName: requestRow.sales_name || null,
        inquiryId: requestRow.inquiry_id || null,
        purchasingOfficer: actingUser?.username || null,
        inquiryDate: requestRow.inquiry_date || null,
        agingDays: calculateAgingDaysFromDate(requestRow.inquiry_date || requestRow.created_at),
        customerType: requestRow.customer_type || null,
        customerName: requestRow.customer || null,
        partNumber: requestRow.part_no || null,
        workshopPartName: null,
        partName: requestRow.part_name || null,
        brand: requestRow.brand || null,
        model: requestRow.model || null,
        year: requestRow.year || null,
        atpmPrice: requestRow.atpm_price || null,
        uom: requestRow.uom || null,
        progressNotes: requestRow.progress_notes || requestRow.notes || null,
        itemStatus: 'Approved',
        statusReason: requestRow.status_reason || null,
        vendorId: requestRow.vendor_id || null,
        vendorName: requestRow.vendor_name || null,
        hpp: requestRow.hpp_idr || null,
        categoryPart: requestRow.category_part || null,
        totalHpp: calculateTotalHpp(requestRow.hpp_idr, requestRow.quantity),
        sellingPrice: requestRow.selling_price || null,
        diskon: null,
        sellingPriceAfterDisc: requestRow.selling_price || null,
        finalSellingPrice: requestRow.selling_price || null,
        checklistPo: requestRow.po_process || null,
        poNumber: requestRow.po_number || null,
        poDate: requestRow.po_date || null,
        procurementNameFix: actingUser?.username || null,
        idFix: requestRow.vendor_id || null,
        salesNameFix: requestRow.sales_name || null,
        sourceRequestNumber: requestRow.request_number || null,
        workflowStatus: requestRow.status || null
    };

    const existingInquiryResult = await client.query(
        'SELECT id FROM "DATA_INQUIRY" WHERE "Source_Request_Id" = $1 LIMIT 1',
        [sourceRequestId]
    );

    if (existingInquiryResult.rows.length > 0) {
        const inquiryId = existingInquiryResult.rows[0].id;
        const updateResult = await client.query(
            `UPDATE "DATA_INQUIRY"
             SET "Data_Status" = $1,
                 "Sales_Name" = $2,
                 "Inquiry_ID" = $3,
                 "Purchasing_Officer" = $4,
                 "Inquiry_Date" = $5,
                 "Aging__Days_" = $6,
                 "Customer_Type" = $7,
                 "Customer_Name" = $8,
                 "Part_Number" = $9,
                 "Workshop_Part_Name" = $10,
                 "Part_Name" = $11,
                 "Brand" = $12,
                 "Model" = $13,
                 "Year" = $14,
                 "ATPM_Price" = $15,
                 "UOM" = $16,
                 "Progress_Notes" = $17,
                 "Item_Status" = $18,
                 "Status_Reason" = $19,
                 "Vendor_ID" = $20,
                 "Vendor_Name" = $21,
                 "HPP" = $22,
                 "Category_Part" = $23,
                 "Total_HPP" = $24,
                 "Selling_Price" = $25,
                 "Diskon__" = $26,
                 "Selling_Price_After_Disc_" = $27,
                 "Final_Selling_Price" = $28,
                 "Checklist_PO" = $29,
                 "No__PO" = $30,
                 "PO_Date" = $31,
                 "PROCUREMNT_NAME_FIX" = $32,
                 "ID_FIX" = $33,
                 "SALES_NAME_FIX" = $34,
                 "Source_Request_Number" = $35,
                 "Request_Workflow_Status" = $36
             WHERE id = $37
             RETURNING *`,
            [
                inquiryPayload.dataStatus,
                inquiryPayload.salesName,
                inquiryPayload.inquiryId,
                inquiryPayload.purchasingOfficer,
                inquiryPayload.inquiryDate,
                inquiryPayload.agingDays,
                inquiryPayload.customerType,
                inquiryPayload.customerName,
                inquiryPayload.partNumber,
                inquiryPayload.workshopPartName,
                inquiryPayload.partName,
                inquiryPayload.brand,
                inquiryPayload.model,
                inquiryPayload.year,
                inquiryPayload.atpmPrice,
                inquiryPayload.uom,
                inquiryPayload.progressNotes,
                inquiryPayload.itemStatus,
                inquiryPayload.statusReason,
                inquiryPayload.vendorId,
                inquiryPayload.vendorName,
                inquiryPayload.hpp,
                inquiryPayload.categoryPart,
                inquiryPayload.totalHpp,
                inquiryPayload.sellingPrice,
                inquiryPayload.diskon,
                inquiryPayload.sellingPriceAfterDisc,
                inquiryPayload.finalSellingPrice,
                inquiryPayload.checklistPo,
                inquiryPayload.poNumber,
                inquiryPayload.poDate,
                inquiryPayload.procurementNameFix,
                inquiryPayload.idFix,
                inquiryPayload.salesNameFix,
                inquiryPayload.sourceRequestNumber,
                inquiryPayload.workflowStatus,
                inquiryId
            ]
        );

        return updateResult.rows[0];
    }

    const insertResult = await client.query(
        `INSERT INTO "DATA_INQUIRY" (
            "Data_Status",
            "Sales_Name",
            "Inquiry_ID",
            "Purchasing_Officer",
            "Inquiry_Date",
            "Aging__Days_",
            "Customer_Type",
            "Customer_Name",
            "Part_Number",
            "Workshop_Part_Name",
            "Part_Name",
            "Brand",
            "Model",
            "Year",
            "ATPM_Price",
            "UOM",
            "Progress_Notes",
            "Item_Status",
            "Status_Reason",
            "Vendor_ID",
            "Vendor_Name",
            "HPP",
            "Category_Part",
            "Total_HPP",
            "Selling_Price",
            "Diskon__",
            "Selling_Price_After_Disc_",
            "Final_Selling_Price",
            "Checklist_PO",
            "No__PO",
            "PO_Date",
            "PROCUREMNT_NAME_FIX",
            "ID_FIX",
            "SALES_NAME_FIX",
            "Source_Request_Id",
            "Source_Request_Number",
            "Request_Workflow_Status"
        )
        VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
            $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34,
            $35, $36, $37
        )
        RETURNING *`,
        [
            inquiryPayload.dataStatus,
            inquiryPayload.salesName,
            inquiryPayload.inquiryId,
            inquiryPayload.purchasingOfficer,
            inquiryPayload.inquiryDate,
            inquiryPayload.agingDays,
            inquiryPayload.customerType,
            inquiryPayload.customerName,
            inquiryPayload.partNumber,
            inquiryPayload.workshopPartName,
            inquiryPayload.partName,
            inquiryPayload.brand,
            inquiryPayload.model,
            inquiryPayload.year,
            inquiryPayload.atpmPrice,
            inquiryPayload.uom,
            inquiryPayload.progressNotes,
            inquiryPayload.itemStatus,
            inquiryPayload.statusReason,
            inquiryPayload.vendorId,
            inquiryPayload.vendorName,
            inquiryPayload.hpp,
            inquiryPayload.categoryPart,
            inquiryPayload.totalHpp,
            inquiryPayload.sellingPrice,
            inquiryPayload.diskon,
            inquiryPayload.sellingPriceAfterDisc,
            inquiryPayload.finalSellingPrice,
            inquiryPayload.checklistPo,
            inquiryPayload.poNumber,
            inquiryPayload.poDate,
            inquiryPayload.procurementNameFix,
            inquiryPayload.idFix,
            inquiryPayload.salesNameFix,
            sourceRequestId,
            inquiryPayload.sourceRequestNumber,
            inquiryPayload.workflowStatus
        ]
    );

    return insertResult.rows[0];
};

const buildUpdateStatement = (fieldMap, payload = {}) => {
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(fieldMap).forEach(([payloadKey, columnName]) => {
        if (Object.prototype.hasOwnProperty.call(payload, payloadKey)) {
            setClauses.push(`"${columnName}" = $${paramIndex}`);
            values.push(payload[payloadKey] === '' ? null : payload[payloadKey]);
            paramIndex++;
        }
    });

    return { setClauses, values, nextParamIndex: paramIndex };
};

const ensureUsersRoleCompatibility = async () => {
    await pool.query(`
        UPDATE users
        SET role = CASE
            WHEN role = 'requester' THEN 'sales'
            WHEN role IN ('validator', 'approver') THEN 'purchasing'
            ELSE role
        END
        WHERE role IN ('requester', 'validator', 'approver')
    `);

    const constraintResult = await pool.query(`
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'users'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%role%'
    `);

    for (const row of constraintResult.rows) {
        await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS "${row.conname}"`);
    }

    await pool.query(`
        ALTER TABLE users
        ADD CONSTRAINT users_role_check
        CHECK (role IN ('sales', 'purchasing', 'admin'))
    `);
};

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
            inquiry_date VARCHAR(50),
            sales_name VARCHAR(255),
            customer VARCHAR(255),
            customer_type VARCHAR(255),
            part_no VARCHAR(255),
            part_name VARCHAR(255),
            brand VARCHAR(255),
            model VARCHAR(255),
            series_type VARCHAR(255),
            year VARCHAR(50),
            quantity INTEGER,
            uom VARCHAR(50),
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
            selling_price VARCHAR(255),
            update_date VARCHAR(50),
            item_image_url TEXT,
            item_image_name VARCHAR(255),
            item_image_mime_type VARCHAR(255),
            item_images JSONB DEFAULT '[]'::jsonb,
            attachment_url TEXT,
            attachment_name VARCHAR(255),
            attachment_mime_type VARCHAR(255),
            notes TEXT,
            status_reason TEXT,
            progress_notes TEXT,
            status_id VARCHAR(255),
            po_process VARCHAR(255),
            po_number VARCHAR(255),
            po_date VARCHAR(50),
            status VARCHAR(255) DEFAULT 'validation',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS request_number VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS inquiry_id VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS inquiry_date VARCHAR(50)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS sales_name VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS customer VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS customer_type VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS part_no VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS part_name VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS brand VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS model VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS series_type VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS year VARCHAR(50)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS quantity INTEGER`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS uom VARCHAR(50)`);
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
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS selling_price VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS update_date VARCHAR(50)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS item_image_url TEXT`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS item_image_name VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS item_image_mime_type VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS item_images JSONB DEFAULT '[]'::jsonb`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS attachment_url TEXT`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS attachment_mime_type VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS notes TEXT`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS status_reason TEXT`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS progress_notes TEXT`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS status_id VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS po_process VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS po_number VARCHAR(255)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS po_date VARCHAR(50)`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'validation'`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS validated_by INTEGER`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS approved_by INTEGER`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS created_by INTEGER`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    await pool.query(`ALTER TABLE new_item_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
};

const ensureVendorPriceExtensions = async () => {
    await pool.query(`ALTER TABLE "VENDOR_PRICE" ADD COLUMN IF NOT EXISTS "Stock_Status" VARCHAR(255)`);
    await pool.query(`ALTER TABLE "VENDOR_PRICE" ADD COLUMN IF NOT EXISTS "Stock_Qty" INTEGER`);
    await pool.query(`ALTER TABLE "VENDOR_PRICE" ADD COLUMN IF NOT EXISTS "Selling_Price" VARCHAR(255)`);
};

const ensureDataInquiryExtensions = async () => {
    await pool.query(`ALTER TABLE "DATA_INQUIRY" ADD COLUMN IF NOT EXISTS "Source_Request_Id" INTEGER`);
    await pool.query(`ALTER TABLE "DATA_INQUIRY" ADD COLUMN IF NOT EXISTS "Source_Request_Number" VARCHAR(255)`);
    await pool.query(`ALTER TABLE "DATA_INQUIRY" ADD COLUMN IF NOT EXISTS "Request_Workflow_Status" VARCHAR(255)`);
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

const requireNormalizedRole = (...allowedRoles) => (req, res, next) => {
    const normalizedRole = normalizeRole(req.user?.role);

    if (!allowedRoles.includes(normalizedRole)) {
        return res.status(403).json({ error: 'Not authorized' });
    }

    next();
};

// Helper function to build dynamic query with filters
const buildQuery = (table, filters = {}, page = 1, limit = 15, user = null) => {
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
    const ownershipFilter = buildSalesOwnershipClause(table, user, paramIndex);
    query += ownershipFilter.clause;
    values.push(...ownershipFilter.values);
    paramIndex = ownershipFilter.nextParamIndex;

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
const buildCountQuery = (table, filters = {}, user = null) => {
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
    const ownershipFilter = buildSalesOwnershipClause(table, user, paramIndex);
    query += ownershipFilter.clause;
    values.push(...ownershipFilter.values);
    paramIndex = ownershipFilter.nextParamIndex;

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
app.get('/api/brands', authenticateToken, async (req, res) => {
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
        
        if (!VALID_USER_ROLES.includes(role)) {
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
        res.json(sanitizeRequestRow(result.rows[0], req.user.role));
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Stats endpoint for dashboard
app.get('/api/stats', authenticateToken, async (req, res) => {
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
app.post('/api/new-item-request', authenticateToken, requireNormalizedRole('sales', 'purchasing', 'admin'), async (req, res) => {
    const client = await pool.connect();

    try {
        const isPurchasingInput = canManagePurchasingFlow(req.user.role);
        const normalizedSalesName = isSalesRole(req.user.role) ? req.user.username : req.body.salesName;
        const {
            inquiryId,
            inquiryDate,
            customer,
            customerType,
            dataStatus,
            statusReason,
            progressNotes,
            statusId,
            poProcess,
            poNumber,
            poDate,
            vendorId,
            vendorName,
            categoryPart,
            currency,
            atpmPrice,
            costPrice,
            sellingPrice,
            updateDate,
            attachmentUrl,
            attachmentName,
            attachmentMimeType,
            notes
        } = req.body;

        const rawRequestItems = Array.isArray(req.body.requestItems) && req.body.requestItems.length > 0
            ? req.body.requestItems
            : [req.body];

        if (!inquiryId || !inquiryDate || !normalizedSalesName || !customer) {
            return res.status(400).json({ error: 'Inquiry ID, Inquiry Date, Sales Name, dan Customer Name wajib diisi' });
        }

        for (const item of rawRequestItems) {
            if (!item.partName || !item.brand || !item.model) {
                return res.status(400).json({ error: 'Setiap item wajib memiliki Nama Part, Brand, dan Model' });
            }
        }

        const requestNumberBase = `REQ-${Date.now()}`;
        const createdRows = [];
        await client.query('BEGIN');

        for (let index = 0; index < rawRequestItems.length; index += 1) {
            const item = rawRequestItems[index];
            const normalizedImages = normalizeItemImages(item.itemImages);

            if (normalizedImages.length === 0) {
                const legacyImage = normalizeFileEntry({
                    url: item.itemImageUrl || '',
                    name: item.itemImageName || '',
                    mimeType: item.itemImageMimeType || ''
                });

                if (legacyImage) {
                    normalizedImages.push(legacyImage);
                }
            }

            const primaryImage = getPrimaryImageFromGallery(normalizedImages);
            const currentCostPrice = item.costPrice ?? costPrice;
            const computedHppIdr = isPurchasingInput ? calculateHppIdr(currentCostPrice) : null;
            const requestNumber = rawRequestItems.length > 1
                ? `${requestNumberBase}-${index + 1}`
                : requestNumberBase;

            const result = await client.query(
                `INSERT INTO new_item_requests (
                    request_number,
                    inquiry_id,
                    inquiry_date,
                    sales_name,
                    customer,
                    customer_type,
                    part_no,
                    part_name,
                    brand,
                    model,
                    series_type,
                    year,
                    quantity,
                    uom,
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
                    selling_price,
                    update_date,
                    item_image_url,
                    item_image_name,
                    item_image_mime_type,
                    item_images,
                    attachment_url,
                    attachment_name,
                    attachment_mime_type,
                    notes,
                    status_reason,
                    progress_notes,
                    status_id,
                    po_process,
                    po_number,
                    po_date,
                    status,
                    created_by
                )
                 VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NULL, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, 'validation', $40
                 )
                 RETURNING *`,
                [
                    requestNumber,
                    inquiryId,
                    inquiryDate,
                    normalizedSalesName,
                    customer,
                    customerType || null,
                    item.partNo || null,
                    item.partName,
                    item.brand,
                    item.model,
                    item.seriesType || null,
                    item.year || null,
                    item.quantity || null,
                    item.uom || null,
                    item.vin || null,
                    item.dataStatus || dataStatus || 'Tidak Complete',
                    isPurchasingInput ? (item.vendorId ?? vendorId ?? null) : null,
                    isPurchasingInput ? (item.vendorName ?? vendorName ?? null) : null,
                    isPurchasingInput ? (item.categoryPart ?? categoryPart ?? null) : null,
                    isPurchasingInput ? (item.currency ?? currency ?? 'IDR') : null,
                    isPurchasingInput ? (item.atpmPrice ?? atpmPrice ?? null) : null,
                    isPurchasingInput ? (currentCostPrice || null) : null,
                    computedHppIdr,
                    isPurchasingInput ? (item.sellingPrice ?? sellingPrice ?? null) : null,
                    item.updateDate || updateDate || null,
                    primaryImage.itemImageUrl,
                    primaryImage.itemImageName,
                    primaryImage.itemImageMimeType,
                    JSON.stringify(normalizedImages),
                    item.attachmentUrl || attachmentUrl || null,
                    item.attachmentName || attachmentName || null,
                    item.attachmentMimeType || attachmentMimeType || null,
                    item.notes || notes || null,
                    item.statusReason || statusReason || null,
                    item.progressNotes || progressNotes || null,
                    isPurchasingInput ? (item.statusId ?? statusId ?? null) : null,
                    isPurchasingInput ? (item.poProcess ?? poProcess ?? null) : null,
                    isPurchasingInput ? (item.poNumber ?? poNumber ?? null) : null,
                    isPurchasingInput ? (item.poDate ?? poDate ?? null) : null,
                    req.user.id
                ]
            );

            createdRows.push(result.rows[0]);
        }

        await client.query('COMMIT');

        if (createdRows.length === 1) {
            return res.json(sanitizeRequestRow(createdRows[0], req.user.role));
        }

        return res.json({
            inquiryId,
            totalItems: createdRows.length,
            requests: createdRows.map((row) => sanitizeRequestRow(row, req.user.role))
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Validate request endpoint (for validators)
app.put('/api/requests/:id/validate', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'approve' or 'reject'
        
        if (!canManagePurchasingFlow(req.user.role)) {
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
    const client = await pool.connect();

    try {
        const { id } = req.params;
        const { action } = req.body; // 'approve' or 'reject'
        
        if (!canManagePurchasingFlow(req.user.role)) {
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
        
        await client.query('BEGIN');

        const result = await client.query(
            'UPDATE new_item_requests SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [newStatus, req.user.id, id]
        );
        
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Request not found' });
        }
        
        if (newStatus === 'approved') {
            await syncApprovedRequestToInquiry(client, result.rows[0], req.user);
        }

        await client.query('COMMIT');
        res.json(sanitizeRequestRow(result.rows[0], req.user.role));
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

app.put('/api/requests/:id/pricing', authenticateToken, async (req, res) => {
    try {
        if (!canManagePurchasingFlow(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { id } = req.params;
        const {
            vendorId,
            vendorName,
            categoryPart,
            currency,
            atpmPrice,
            costPrice,
            sellingPrice,
            updateDate,
            dataStatus,
            statusReason,
            progressNotes,
            statusId,
            poProcess,
            poNumber,
            poDate
        } = req.body;
        const computedHppIdr = calculateHppIdr(costPrice);

        const result = await pool.query(
            `UPDATE new_item_requests
             SET vendor_id = $1,
                 vendor_name = $2,
                 category_part = $3,
                 currency = $4,
                 atpm_price = $5,
                 cost_price = $6,
                 hpp_idr = $7,
                 selling_price = $8,
                 update_date = $9,
                 data_status = COALESCE($10, data_status),
                 status_reason = COALESCE($11, status_reason),
                 progress_notes = COALESCE($12, progress_notes),
                 status_id = COALESCE($13, status_id),
                 po_process = COALESCE($14, po_process),
                 po_number = COALESCE($15, po_number),
                 po_date = COALESCE($16, po_date),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $17
             RETURNING *`,
            [
                vendorId || null,
                vendorName || null,
                categoryPart || null,
                currency || null,
                atpmPrice || null,
                costPrice || null,
                computedHppIdr,
                sellingPrice || null,
                updateDate || null,
                dataStatus || null,
                statusReason || null,
                progressNotes || null,
                statusId || null,
                poProcess || null,
                poNumber || null,
                poDate || null,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json(sanitizeRequestRow(result.rows[0], req.user.role));
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/master-items/manual', authenticateToken, async (req, res) => {
    try {
        if (!canManagePurchasingFlow(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const {
            partNumber,
            partName,
            workshopName,
            brand,
            model,
            seriesType,
            year,
            stockStatus,
            stockQty,
            atpmPrice,
            vendorId,
            vendorName,
            categoryPart,
            currency,
            costPrice,
            sellingPrice,
            updateDate,
            dataStatus
        } = req.body;
        const computedHppIdr = calculateHppIdr(costPrice);

        if (!partNumber || !partName || !brand || !model) {
            return res.status(400).json({ error: 'Part Number, Part Name, Brand, dan Model wajib diisi' });
        }

        const result = await pool.query(
            `INSERT INTO "VENDOR_PRICE" (
                "Data_Status",
                "Int__Part_Number",
                "Part_Name",
                "Workshop_Name",
                "Brand",
                "Model",
                "Series___Type",
                "Year",
                "ATPM_PRICE",
                "Vendor_ID",
                "Vendor_Name",
                "Category_Part",
                "Currency",
                "Cost_Price",
                "HPP__IDR_",
                "Update_Date",
                "Stock_Status",
                "Stock_Qty",
                "Selling_Price"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING *`,
            [
                dataStatus || 'Manual Entry',
                partNumber,
                partName,
                workshopName || '-',
                brand,
                model,
                seriesType || null,
                year || null,
                atpmPrice || null,
                vendorId || null,
                vendorName || null,
                categoryPart || null,
                currency || 'IDR',
                costPrice || null,
                computedHppIdr,
                updateDate || new Date().toISOString().split('T')[0],
                stockStatus || 'Out of Stock',
                stockQty ? parseInt(stockQty, 10) : null,
                sellingPrice || null
            ]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/master-items/:id', authenticateToken, async (req, res) => {
    try {
        if (!canManagePurchasingFlow(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const { setClauses, values, nextParamIndex } = buildUpdateStatement(MASTER_ITEM_EDITABLE_FIELD_MAP, req.body);

        if (setClauses.length === 0) {
            return res.status(400).json({ error: 'Tidak ada field master item yang diperbarui' });
        }

        if (Object.prototype.hasOwnProperty.call(req.body, 'costPrice')) {
            setClauses.push(`"HPP__IDR_" = $${nextParamIndex}`);
            values.push(calculateHppIdr(req.body.costPrice));
        }

        const result = await pool.query(
            `UPDATE "VENDOR_PRICE"
             SET ${setClauses.join(', ')}
             WHERE id = $${values.length + 1}
             RETURNING *`,
            [...values, req.params.id]
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

app.put('/api/requests/:id', authenticateToken, requireNormalizedRole('sales', 'purchasing', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const existingResult = await pool.query('SELECT * FROM new_item_requests WHERE id = $1', [id]);

        if (existingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const existingRequest = existingResult.rows[0];

        if (!canSalesAccessRequest(req.user, existingRequest)) {
            return res.status(403).json({ error: 'Sales hanya dapat mengubah request miliknya sendiri' });
        }

        if (existingRequest.status === 'approved') {
            return res.status(400).json({ error: 'Request yang sudah approved tidak bisa diubah' });
        }

        const fieldMap = canManagePurchasingFlow(req.user.role)
            ? REQUEST_PURCHASING_EDITABLE_FIELD_MAP
            : REQUEST_SALES_EDITABLE_FIELD_MAP;
        const { setClauses, values, nextParamIndex } = buildUpdateStatement(fieldMap, req.body);

        if (setClauses.length === 0) {
            return res.status(400).json({ error: 'Tidak ada field yang dapat diperbarui' });
        }

        if (canManagePurchasingFlow(req.user.role) && Object.prototype.hasOwnProperty.call(req.body, 'costPrice')) {
            setClauses.push(`"hpp_idr" = $${nextParamIndex}`);
            values.push(calculateHppIdr(req.body.costPrice));
        }

        const result = await pool.query(
            `UPDATE new_item_requests
             SET ${setClauses.join(', ')},
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $${values.length + 1}
             RETURNING *`,
            [...values, id]
        );

        res.json(sanitizeRequestRow(result.rows[0], req.user.role));
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/inquiries/:id', authenticateToken, requireNormalizedRole('sales', 'purchasing', 'admin'), async (req, res) => {
    try {
        const existingResult = await pool.query('SELECT * FROM "DATA_INQUIRY" WHERE id = $1', [req.params.id]);

        if (existingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Inquiry not found' });
        }

        if (!canSalesAccessInquiry(req.user, existingResult.rows[0])) {
            return res.status(403).json({ error: 'Sales hanya dapat mengubah inquiry miliknya sendiri' });
        }

        const { setClauses, values, nextParamIndex } = buildUpdateStatement(INQUIRY_EDITABLE_FIELD_MAP, req.body);

        if (setClauses.length === 0) {
            return res.status(400).json({ error: 'Tidak ada field yang dapat diperbarui' });
        }

        const result = await pool.query(
            `UPDATE "DATA_INQUIRY"
             SET ${setClauses.join(', ')}
             WHERE id = $${nextParamIndex}
             RETURNING *`,
            [...values, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inquiry not found' });
        }

        res.json(sanitizeInquiryRow(result.rows[0], req.user.role));
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// Get detail request by row id
app.get('/api/requests/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM new_item_requests WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        if (!canSalesAccessRequest(req.user, result.rows[0])) {
            return res.status(403).json({ error: 'Sales hanya dapat melihat request miliknya sendiri' });
        }

        res.json(sanitizeRequestRow(result.rows[0], req.user.role));
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// Get detail inquiry by row id
app.get('/api/inquiries/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM "DATA_INQUIRY" WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Inquiry not found' });
        }

        if (!canSalesAccessInquiry(req.user, result.rows[0])) {
            return res.status(403).json({ error: 'Sales hanya dapat melihat inquiry miliknya sendiri' });
        }

        const normalizedInquiryRow = await resolveFilledInquiryRow(result.rows[0]);
        res.json(sanitizeInquiryRow(normalizedInquiryRow, req.user.role));
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// Get detail master item by row id
app.get('/api/master-items/:id', authenticateToken, async (req, res) => {
    try {
        if (!canManagePurchasingFlow(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

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
app.get('/api/:tableSlug', authenticateToken, async (req, res) => {
    try {
        const table = getTableName(req.params.tableSlug);
        if (!table) {
            return res.status(404).json({ error: 'Table not found' });
        }

        if (req.params.tableSlug === 'master-items' && !canManagePurchasingFlow(req.user.role)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;

        // Get data with pagination
        const { query: dataQuery, values: dataValues } = buildQuery(table, req.query, page, limit, req.user);
        const dataResult = await pool.query(dataQuery, dataValues);

        // Get total count
        const { query: countQuery, values: countValues } = buildCountQuery(table, req.query, req.user);
        const countResult = await pool.query(countQuery, countValues);

        res.json({
            data: sanitizeRowsForTable(table, dataResult.rows, req.user.role),
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

Promise.all([syncBrandsTable(), ensureUsersRoleCompatibility(), ensureNewItemRequestsTable(), ensureVendorPriceExtensions(), ensureDataInquiryExtensions()])
    .then(() => {
        console.log('Brand master synchronized');
        console.log('Request table synchronized');
        console.log('Vendor price extensions synchronized');
        console.log('Inquiry extensions synchronized');
    })
    .catch((err) => {
        console.error('Failed to synchronize brand master:', err.message);
    })
    .finally(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    });

const mysql = require('mysql2');
const express = require('express');
const { body, query, validationResult } = require('express-validator');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const expressLayouts = require('express-ejs-layouts');

const app = express();
require('dotenv').config();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// View engine setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.set('layout', 'layout');
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'School Management API',
      version: '1.0.0',
      description: 'API for managing schools and their locations',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
      },
    ],
  },
  apis: ['./index.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Database connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
}).promise();

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * @swagger
 * /api/schools:
 *   post:
 *     summary: Add a new school
 *     tags: [Schools]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *               - latitude
 *               - longitude
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 */
app.post('/api/schools', [
  body('name').notEmpty().trim().escape(),
  body('address').notEmpty().trim().escape(),
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, address, latitude, longitude } = req.body;
    const [result] = await connection.execute(
      'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)',
      [name, address, latitude, longitude]
    );

    res.status(201).json({
      success: true,
      message: 'School added successfully',
      data: { id: result.insertId, name, address, latitude, longitude }
    });
  } catch (error) {
    console.error('Error adding school:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/schools:
 *   get:
 *     summary: Get list of schools sorted by distance from given coordinates
 *     tags: [Schools]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 */
app.get('/api/schools', [
  query('latitude').isFloat({ min: -90, max: 90 }),
  query('longitude').isFloat({ min: -180, max: 180 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { latitude, longitude } = req.query;
    const [schools] = await connection.query('SELECT * FROM schools');

    // Calculate distance for each school and sort
    const schoolsWithDistance = schools.map(school => ({
      ...school,
      distance: calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        school.latitude,
        school.longitude
      )
    }));

    schoolsWithDistance.sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: schoolsWithDistance
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Web interface routes
app.get('/', async (req, res) => {
  try {
    const [result] = await connection.query('SELECT COUNT(*) as count FROM schools');
    const schoolCount = result[0].count;
    res.render('index', { 
      title: 'Home',
      schoolCount 
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error fetching school count');
  }
});

app.get('/listSchools', async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    const [schools] = await connection.query('SELECT * FROM schools');
    
    // If latitude and longitude are provided, calculate distances
    let schoolsWithDistance = schools;
    if (latitude && longitude) {
      schoolsWithDistance = schools.map(school => ({
        ...school,
        distance: calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          school.latitude,
          school.longitude
        )
      }));
      // Sort schools by distance
      schoolsWithDistance.sort((a, b) => a.distance - b.distance);
    }
    
    res.render('listschool', { 
      title: 'Schools Directory',
      schools: schoolsWithDistance, 
      latitude, 
      longitude,
      hasCoordinates: !!(latitude && longitude)
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error fetching schools');
  }
});

app.get('/addSchools', (req, res) => {
  res.render('addschool', { title: 'Add New School' });
});

app.post('/addSchools', async (req, res) => {
  try {
    const { name, address, latitude, longitude } = req.body;
    await connection.execute(
      'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)',
      [name, address, latitude, longitude]
    );
    res.redirect('/listSchools');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error adding school');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/api-docs`);
});
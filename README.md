# School Management API

A Node.js-based API system for managing school data with location-based sorting capabilities.

## Features

- Add new schools with location data
- List schools sorted by proximity to given coordinates
- Input validation and error handling
- Swagger API documentation
- Web interface for managing schools
- RESTful API endpoints

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following content:
   ```
   DB_HOST=localhost
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=school_management
   DB_PORT=3306
   PORT=3000
   ```
4. Create the database and tables:
   ```bash
   mysql -u your_mysql_user -p < database.sql
   ```

## Running the Application

1. Start the server:
   ```bash
   npm start
   ```
   For development with auto-reload:
   ```bash
   npm run dev
   ```

2. Access the application:
   - Web Interface: http://localhost:3000
   - API Documentation: http://localhost:3000/api-docs

## API Endpoints

### Add School
- **POST** `/api/schools`
- Body:
  ```json
  {
    "name": "School Name",
    "address": "School Address",
    "latitude": 37.7749,
    "longitude": -122.4194
  }
  ```

### List Schools
- **GET** `/api/schools?latitude=37.7749&longitude=-122.4194`
- Query Parameters:
  - latitude: Float (-90 to 90)
  - longitude: Float (-180 to 180)

## Testing

Import the provided Postman collection (`School_Management.postman_collection.json`) to test the APIs.

## License

ISC

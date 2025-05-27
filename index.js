const mysql = require('mysql2');
const express = require('express');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'devang@123',
    database: 'school_management'
});
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the MySQL database.');
});

app.get('/', (req, res) => {
    let sql = 'SELECT count(*) FROM schools';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching schools:', err);
            res.status(500).send('Error fetching schools');
            return;
        }
        let schoolCount = results[0]['count(*)'];
        res.render('index', { schoolCount });
    });
}
);

app.get('/listSchools', (req, res) => {
    const { latitude,longitude } = req.query;
    let sql = 'SELECT * FROM schools';
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching schools:', err);
            res.status(500).send('Error fetching schools');
            return;
        }
        res.render('listschool', { schools: results, latitude,longitude });
    }); 
}
);

app.get('/addSchools', (req, res) => {
    res.render('addschool');
}
);

app.post('/addSchools', (req, res) => {
    const { name, address, latitude,longitude } = req.body;
    let sql = 'INSERT INTO schools (name, address, latitude , longitude) VALUES (?, ?, ?,?)';
    connection.query(sql, [name, address, latitude,longitude], (err, results) => {
        if (err) {
            console.error('Error adding school:', err);
            res.status(500).send('Error adding school');
            return;
        }
        res.redirect('/listSchools');
    });
}
);


app.listen(3000, () => {
  console.log('Server is running on port 3000');
}
);
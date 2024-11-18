const express = require('express');
// const mysqlSync = require('mysql2');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const joi = require('joi');
const cors = require('cors');

dotenv.config();

let connection;
mysql
  .createConnection({
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  })
  .then((conn) => (connection = conn));

const port = process.env.PORT;
const app = express();
app.use(cors());
app.use(express.json());

app.get('/boxes', async function (req, res) {
  const [rows] = await connection.execute(
    'select id, title from boxes where isActive = 1',
    []
  );
  res.json({ status: true, message: 'box list fetched', data: rows });
});

app.get('/boxes/:id', async function (req, res) {
  const [rows] = await connection.execute(
    'select id, title from boxes where isActive = 1 and id = ?',
    [req.params.id]
  );
  const row = rows?.[0];
  if (!row) {
    return handleError(res, new Error('Not found'), 404);
  }
  res.json({ status: true, message: 'box fetched', data: row });
});

app.post('/boxes', async function (req, res) {
  try {
    const validRes = joi
      .object({ title: joi.string().required() })
      .validate(req.body);
    if (validRes.error) return handleError(res, validRes.error, 400);

    const queryResult = await connection.execute(
      'insert into boxes(title) values(?)',
      [req.body.title]
    );

    res
      .status(201)
      .json({
        status: true,
        message: 'box created',
        data: queryResult.insertedId,
      })
      .send();
  } catch (error) {
    handleError(res, error);
  }
});

app.delete('/boxes/:id', async function (req, res) {
  try {
    const queryResult = await connection.execute(
      'update boxes set isActive = 0 where isActive = 1 and id = ?',
      [req.params.id]
    );
    res.json({ status: true, message: 'box deleted', data: null }).send();
  } catch (error) {
    handleError(res, error);
  }
});

app.listen(port, () => {
  console.log(`App running on ${port}`);
});

function handleError(res, error, statusCode = 500) {
  res.status(statusCode);
  res.json({ status: false, message: error.message, data: null });
}

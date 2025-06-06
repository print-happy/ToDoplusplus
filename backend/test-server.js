const express = require('express');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Test server is running on port ${PORT}`);
});

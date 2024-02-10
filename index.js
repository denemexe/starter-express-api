const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Örnek anahtar depolama
let keys = [];

// Anahtar oluşturma endpoint'i
app.post('/create-key', (req, res) => {
  const key = generateKey();
  keys.push(key);
  res.status(201).json({ key });
});

// Anahtar silme endpoint'i
app.delete('/delete-key/:key', (req, res) => {
  const { key } = req.params;
  const index = keys.indexOf(key);
  if (index !== -1) {
    keys.splice(index, 1);
    res.status(200).json({ message: 'Anahtar başarıyla silindi.' });
  } else {
    res.status(404).json({ message: 'Belirtilen anahtar bulunamadı.' });
  }
});

// Rasgele anahtar oluşturma fonksiyonu
function generateKey() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const keyLength = 10;
  let key = '';
  for (let i = 0; i < keyLength; i++) {
    key += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return key;
}

// Ana sayfa rotası
app.get('/', (req, res) => {
  res.send('Ana sayfaya hoş geldiniz!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda başlatıldı...`);
});

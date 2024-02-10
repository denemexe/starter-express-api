const express = require('express');
const crypto = require('crypto');

const app = express();
const port = 3000;

// Anahtarlar için bir veri deposu
let keyStore = {};

// Anahtar oluşturma endpoint'i
app.get('/key-olustur/:kullaniciAdi', (req, res) => {
    const kullaniciAdi = req.params.kullaniciAdi;
    const key = generateKey(kullaniciAdi);
    keyStore[kullaniciAdi] = key; // Anahtarı depolayalım
    res.send(key);
});

// Anahtar listeleme endpoint'i
app.get('/key-list', (req, res) => {
    res.send(keyStore);
});

// Anahtar silme endpoint'i
app.delete('/key-sil/:kullaniciAdi', (req, res) => {
    const kullaniciAdi = req.params.kullaniciAdi;
    if (keyStore[kullaniciAdi]) {
        delete keyStore[kullaniciAdi];
        res.send('Anahtar başarıyla silindi.');
    } else {
        res.status(404).send('Belirtilen kullanıcı adına ait anahtar bulunamadı.');
    }
});

// Anahtar oluşturma fonksiyonu
function generateKey(kullaniciAdi) {
    const secret = 'bu-gizli-bir-anahtar'; // Daha güvenli bir anahtar belirleyebilirsiniz
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(kullaniciAdi);
    const key = `${kullaniciAdi}-${hmac.digest('hex')}`;
    return key;
}

app.listen(port, () => {
    console.log(`Uygulama ${port} portunda çalışıyor.`);
});

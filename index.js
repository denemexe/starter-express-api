const express = require('express');
const crypto = require('crypto');

const app = express();
const port = 3000;

// Anahtar oluşturma endpoint'i
app.get('/key-olustur/:kullaniciAdi', (req, res) => {
    const kullaniciAdi = req.params.kullaniciAdi;
    const key = generateKey(kullaniciAdi);
    res.send(key);
});

// Anahtar silme endpoint'i (istediğinizde kullanabilirsiniz)
app.delete('/key-sil/:anahtar', (req, res) => {
    // Anahtarı silme işlemini burada gerçekleştirin
    res.send('Anahtar başarıyla silindi.');
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

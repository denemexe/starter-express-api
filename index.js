const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const port = 3000;

// Body-parser middleware'i uygulamaya ekle
app.use(bodyParser.urlencoded({ extended: true }));

// Yetkili anahtarlar için bir veri deposu
let authorizedKeys = ["yetkilikey1", "yetkilikey2", "yetkilikey3"];

// Örnek anahtarlar için bir veri deposu
let keyStore = {};

// Anahtar oluşturma endpoint'i
app.post('/key-olustur', (req, res) => {
    const kullaniciAdi = req.body.kullaniciAdi; // req.body'yi kullanarak kullanıcı adını al
    const key = generateKey(kullaniciAdi);
    keyStore[kullaniciAdi] = key; // Anahtarı depolayalım
    res.send(key);
});

// Anahtar listeleme endpoint'i
app.get('/key-list', (req, res) => {
    // Anahtar listesini HTML formatında oluşturalım
    let keyListHTML = '<h1>Anahtar Listesi</h1>';
    for (const [kullaniciAdi, anahtar] of Object.entries(keyStore)) {
        keyListHTML += `${kullaniciAdi}: ${anahtar} <form action="/key-sil/${kullaniciAdi}" method="post"><button type="submit">Sil</button></form>, `;
    }
    keyListHTML = keyListHTML.slice(0, -2); // Son virgülü kaldır
    keyListHTML += '<br><br><a href="/keymanagment">Anahtar Yönetimine Geri Dön</a>';
    res.send(keyListHTML);
});

// Yetkili anahtarları listeleme endpoint'i
app.get('/login', (req, res) => {
    let loginHTML = `
        <h1>Yetkili Anahtar Girişi</h1>
        <form action="/logincheck" method="post">
            <label for="yetkiliAnahtar">Yetkili Anahtar:</label>
            <input type="text" id="yetkiliAnahtar" name="yetkiliAnahtar" required>
            <button type="submit">Giriş Yap</button>
        </form>
    `;
    res.send(loginHTML);
});

// Yetkili anahtar kontrol endpoint'i
app.post('/logincheck', (req, res) => {
    const yetkiliAnahtar = req.body.yetkiliAnahtar; // req.body'yi kullanarak yetkili anahtarı al
    if (authorizedKeys.includes(yetkiliAnahtar)) {
        res.send('<h1>Giriş Başarılı</h1>');
        // Yetkili anahtar doğru olduğunda anahtarları listeleme
        for (const [kullaniciAdi, anahtar] of Object.entries(keyStore)) {
            res.write(`${kullaniciAdi}: ${anahtar}<br>`);
        }
        res.end();
    } else {
        res.send('<h1 style="color:red;">Yetkisiz Erişim!</h1><p>Lütfen geçerli bir yetkili anahtar giriniz.</p>');
    }
});

// Yeni kullanıcı için anahtar oluşturma endpoint'i
app.get('/newlogincreate/:kullaniciAdi', (req, res) => {
    const kullaniciAdi = req.params.kullaniciAdi;
    const key = generateRandomKey(); // Rastgele anahtar oluştur
    keyStore[kullaniciAdi] = key; // Anahtarı depolayalım
    res.redirect('/logincheck');
});

// Anahtar silme endpoint'i
app.post('/key-sil/:kullaniciAdi', (req, res) => {
    const kullaniciAdi = req.params.kullaniciAdi;
    if (keyStore.hasOwnProperty(kullaniciAdi)) {
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
    const uniqueString = Date.now().toString(); // Farklılık sağlamak için benzersiz bir değer kullanın
    hmac.update(kullaniciAdi + '-' + uniqueString); // "-" işaretiyle ayrılmış şekilde kullanıcı adını ve benzersiz değeri birleştirin
    const key = `${kullaniciAdi}-${hmac.digest('hex')}`;
    return key;
}

// Rastgele anahtar oluşturma fonksiyonu
function generateRandomKey() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 7; i++) {
        key += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return key;
}

app.listen(port, () => {
    console.log(`Uygulama ${port} portunda çalışıyor.`);
});

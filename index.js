const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const port = 3000;

// Body-parser middleware'i uygulamaya ekle
app.use(bodyParser.urlencoded({ extended: true }));

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
        keyListHTML += `${anahtar}, `;
    }
    keyListHTML = keyListHTML.slice(0, -2); // Son virgülü kaldır
    keyListHTML += '<br><br><a href="/keymanagment">Anahtar Yönetimine Geri Dön</a>';
    res.send(keyListHTML);
});

// Anahtar yönetimi sayfası
app.get('/keymanagment', (req, res) => {
    let keyManagmentHTML = `
        <h1>Anahtar Yönetimi</h1>
        <form action="/key-olustur" method="post">
            <label for="kullaniciAdi">Kullanıcı Adı:</label>
            <input type="text" id="kullaniciAdi" name="kullaniciAdi" required>
            <button type="submit">Anahtar Oluştur</button>
        </form>
        <br>
        <a href="/key-list">Anahtarları Listele</a>
    `;
    res.send(keyManagmentHTML);
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

// Login sayfası
app.get('/login', (req, res) => {
    res.send(`
        <h1>Login</h1>
        <form action="/login-check" method="post">
            <label for="anahtar">Anahtar:</label>
            <input type="text" id="anahtar" name="anahtar" required>
            <button type="submit">Giriş Yap</button>
        </form>
    `);
});

// Anahtar kontrolü endpoint'i
app.post('/login-check', async (req, res) => {
    const anahtar = req.body.anahtar;

    // Burada anahtarın geçerli olup olmadığını kontrol edebilirsiniz
    // Örnek olarak, belirlediğiniz siteden anahtarın geçerliliğini kontrol edebilirsiniz
    try {
        const response = await axios.get('https://sparkly-puppy-684355.netlify.app/keys.html');
        const keysHTML = response.data;
        
        // Anahtarın HTML içinde geçip geçmediğini kontrol et
        if (keysHTML.includes(anahtar)) {
            res.send('Anahtar geçerli, giriş yapıldı.');
        } else {
            res.send('Anahtar geçersiz, giriş başarısız.');
        }
    } catch (error) {
        res.status(500).send('Anahtar kontrolünde bir hata oluştu.');
    }
});

app.listen(port, () => {
    console.log(`Uygulama ${port} portunda çalışıyor.`);
});

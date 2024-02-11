const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const port = 3000;

// Body-parser middleware'i uygulamaya ekle
app.use(bodyParser.urlencoded({ extended: true }));

// Örnek anahtarlar için bir veri deposu
let keyStore = {};
let loginKeys = [];

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

// Login kısmı
app.get('/login', (req, res) => {
    res.send('<h1>Lütfen yetkili anahtarı giriniz:</h1><form action="/newlogincreate" method="post"><label for="loginKey">Yetkili Anahtar:</label><input type="text" id="loginKey" name="loginKey" required><button type="submit">Giriş Yap</button></form>');
});

// Yeni login oluşturma
app.post('/newlogincreate', (req, res) => {
    const loginKey = req.body.loginKey;
    const kullaniciAdi = generateRandomString(7); // Rastgele kullanıcı adı oluştur
    const key = generateKey(kullaniciAdi);
    loginKeys.push({ kullaniciAdi, key }); // Yeni login anahtarını kaydet
    res.redirect('/loginkeys');
});

// Login anahtarlarını listeleme
app.get('/loginkeys', (req, res) => {
    let loginKeysHTML = '<h1>Login Anahtarları</h1>';
    loginKeys.forEach(loginKey => {
        loginKeysHTML += `<p>${loginKey.kullaniciAdi}: ${loginKey.key} <form action="/loginkeys/${loginKey.kullaniciAdi}" method="post"><button type="submit">Sil</button></form></p>`;
    });
    loginKeysHTML += '<br><a href="/keymanagment">Anahtar Yönetimine Geri Dön</a>';
    res.send(loginKeysHTML);
});

// Login anahtarı silme
app.post('/loginkeys/:kullaniciAdi', (req, res) => {
    const kullaniciAdi = req.params.kullaniciAdi;
    const index = loginKeys.findIndex(loginKey => loginKey.kullaniciAdi === kullaniciAdi);
    if (index !== -1) {
        loginKeys.splice(index, 1);
        res.send('Login anahtarı başarıyla silindi.');
    } else {
        res.status(404).send('Belirtilen kullanıcı adına ait login anahtarı bulunamadı.');
    }
});

// Kullanıcıyı anahtar yönetimine yönlendir
app.post('/login', (req, res) => {
    res.redirect('/keymanagment');
});

// Rastgele kullanıcı adı oluşturma
function generateRandomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

app.listen(port, () => {
    console.log(`Uygulama ${port} portunda çalışıyor.`);
});

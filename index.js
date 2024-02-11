const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

// Body-parser middleware'i uygulamaya ekle
app.use(bodyParser.urlencoded({ extended: true }));

// SQLite veritabanı bağlantısı oluştur
const db = new sqlite3.Database(':memory:');

// Anahtar tablosunu oluştur
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS keys (id INTEGER PRIMARY KEY, kullaniciAdi TEXT, anahtar TEXT, yetki TEXT)");
});

// Örnek yetkili anahtarlar
const yetkiliAnahtarlar = {
    "staffkey": "staff",
    "adminkey": "admin",
    "ownerkey": "owner"
};

// Anahtar oluşturma endpoint'i
app.post('/key-olustur', (req, res) => {
    const kullaniciAdi = req.body.kullaniciAdi; // req.body'yi kullanarak kullanıcı adını al
    const yetki = req.body.yetki;
    const key = generateKey(kullaniciAdi);

    // Anahtarı veritabanına ekle
    db.run('INSERT INTO keys (kullaniciAdi, anahtar, yetki) VALUES (?, ?, ?)', [kullaniciAdi, key, yetki], (err) => {
        if (err) {
            return console.error(err.message);
        }
        res.send(key);
    });
});

// Anahtar listeleme endpoint'i
app.get('/key-list', (req, res) => {
    // Anahtar listesini al
    db.all('SELECT * FROM keys', [], (err, rows) => {
        if (err) {
            return console.error(err.message);
        }
        // Anahtar listesini HTML formatında oluştur
        let keyListHTML = '<h1>Anahtar Listesi</h1>';
        rows.forEach((row) => {
            keyListHTML += `<p>${row.anahtar} (${row.kullaniciAdi}, ${row.yetki}) <form action="/key-sil/${row.id}" method="post"><button type="submit">Sil</button></form></p>`;
        });
        keyListHTML += '<br><a href="/keymanagment">Anahtarları Yönet</a>';
        res.send(keyListHTML);
    });
});

// Anahtar yönetimi sayfası
app.get('/keymanagment', (req, res) => {
    let keyManagmentHTML = `
        <h1>Anahtar Yönetimi</h1>
        <form action="/key-olustur" method="post">
            <label for="kullaniciAdi">Kullanıcı Adı:</label>
            <input type="text" id="kullaniciAdi" name="kullaniciAdi" required>
            <label for="yetki">Yetki:</label>
            <input type="text" id="yetki" name="yetki" required>
            <button type="submit">Anahtar Oluştur</button>
        </form>
        <br>
        <a href="/key-list">Anahtarları Listele</a>
    `;
    res.send(keyManagmentHTML);
});

// Anahtar silme endpoint'i
app.post('/key-sil/:id', (req, res) => {
    const id = req.params.id;
    // Anahtarı veritabanından sil
    db.run('DELETE FROM keys WHERE id = ?', id, (err) => {
        if (err) {
            return console.error(err.message);
        }
        res.send('Anahtar başarıyla silindi.');
    });
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
    let loginHTML = `
        <h1>Giriş Yap</h1>
        <form action="/login" method="post">
            <label for="key">Anahtar:</label>
            <input type="text" id="key" name="key" required>
            <button type="submit">Giriş Yap</button>
        </form>
    `;
    res.send(loginHTML);
});

// Giriş işlemi
app.post('/login', (req, res) => {
    const key = req.body.key;
    // Anahtarın yetkisini kontrol et
    db.get('SELECT * FROM keys WHERE anahtar = ?', key, (err, row) => {
        if (err) {
            return console.error(err.message);
        }
        if (row) {
            const yetki = row.yetki;
            // Yetkiye göre webhook mesajı gönder
            sendWebhookMessage(`Giriş yapıldı: ${key} (${yetki})`);
            res.redirect('/keymanagment');
        } else {
            res.status(404).send('Anahtar bulunamadı!');
        }
    });
});

app.listen(port, () => {
    console.log(`Uygulama ${port} portunda çalışıyor.`);
});

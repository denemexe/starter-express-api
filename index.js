const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const http = require('http');

const app = express();
const port = 3000;

// Body-parser middleware'i uygulamaya ekle
app.use(bodyParser.urlencoded({ extended: true }));

// Örnek anahtarlar için bir veri deposu
let keyStore = {
    "staffkey": "staffkey-1eaca29ae2354aa8db4ac9aa7ce300b67e1560e6774ba357a5a349ece8785690",
    "adminkey": "adminkey-c8e5677e7f3f8bfba4bc7753d3c6f1e073b3c4933c9fff63eaae2e35e9d4ed29",
    "ownerkey": "ownerkey-6c50c5dece8c1f4b72b686ed842d79b5cf3d1812d3583eb8605ed84262b5ee1c"
};

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
        keyListHTML += `<p>${anahtar} <form action="/key-sil/${kullaniciAdi}" method="post"><button type="submit">Sil</button></form></p>`;
    }
    keyListHTML += '<br><a href="/keymanagment">Anahtar Yönetimine Geri Dön</a>';
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
    if (keyStore.hasOwnProperty(key)) {
        if (key === 'staffkey' || key === 'adminkey' || key === 'ownerkey') {
            const role = key.slice(0, -3); // staffkey, adminkey, ownerkey'den role'u al
            sendWebhookMessage(role); // Discord webhook mesajını gönder
            res.redirect('/keymanagment');
        } else {
            res.status(403).send('Yetkisiz giriş!');
        }
    } else {
        res.status(404).send('Anahtar bulunamadı!');
    }
});

// Discord webhook mesajı gönderme fonksiyonu
function sendWebhookMessage(role) {
    const message = `Bir ${role} panele giriş yapıldı.`;
    const webhookURL = 'https://discord.com/api/webhooks/1205871174895140874/YOZkPBLr4F7JiaiMjmcRH2l7xyc_eKuO7E5EDYBteTT07Bx9xCEdeoZY-XG9mrlVMJ03'; // Discord webhook URL'i

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(webhookURL, options, (res) => {
        console.log(`statusCode: ${res.statusCode}`);
        res.on('data', (d) => {
            process.stdout.write(d);
        });
    });

    req.on('error', (error) => {
        console.error(error);
    });

    req.write(JSON.stringify({ content: message }));
    req.end();
}

app.listen(port, () => {
    console.log(`Uygulama ${port} portunda çalışıyor.`);
});

const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const port = 3000;

// Body-parser middleware'i uygulamaya ekle
app.use(bodyParser.urlencoded({ extended: true }));

// Anahtarların ve son kullanma zamanlarının saklanacağı veri deposu
let keyStore = {};

// Anahtar oluşturma endpoint'i
app.post('/key-olustur', (req, res) => {
    const kullaniciAdi = req.body.kullaniciAdi; // req.body'yi kullanarak kullanıcı adını al
    const key = generateKey(kullaniciAdi);
    keyStore[kullaniciAdi] = { key: key, lastUsed: Date.now() }; // Anahtarı depolayalım ve son kullanım zamanını kaydedelim

    // Anahtar oluşturulduğunda webhook'a mesaj gönder
    sendWebhookMessage(`Yeni bir ${kullaniciAdi} anahtarı oluşturuldu: ${key}`);

    res.send(key);
});

// Anahtar listeleme endpoint'i
app.get('/key-list', (req, res) => {
    // Anahtar listesini HTML formatında oluşturalım
    let keyListHTML = '<h1>Anahtar Listesi</h1>';
    for (const [kullaniciAdi, anahtarInfo] of Object.entries(keyStore)) {
        keyListHTML += `<p>${anahtarInfo.key} <form action="/key-sil/${kullaniciAdi}" method="post"><button type="submit">Sil</button></form></p>`;
    }
    keyListHTML += '<br><a href="/keymanagment">Anahtarları Yönet</a>';
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
    if (kullaniciAdi === 'staffkey' || kullaniciAdi === 'adminkey' || kullaniciAdi === 'ownerkey') {
        res.status(403).send('Bu anahtarı silemezsiniz!');
    } else if (keyStore.hasOwnProperty(kullaniciAdi)) {
        // Anahtar silindiğinde webhook'a mesaj gönder
        sendWebhookMessage(`Silinen anahtar: ${keyStore[kullaniciAdi].key}`);
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

// Discord webhook mesajı gönderme fonksiyonu
function sendWebhookMessage(message) {
    const webhookURL = 'https://discord.com/api/webhooks/1205871174895140874/YOZkPBLr4F7JiaiMjmcRH2l7xyc_eKuO7E5EDYBteTT07Bx9xCEdeoZY-XG9mrlVMJ03'; // Discord webhook URL'i
    axios.post(webhookURL, { content: message })
        .then(response => {
            console.log('Webhook mesajı başarıyla gönderildi:', response.data);
        })
        .catch(error => {
            console.error('Webhook mesajı gönderilirken hata oluştu:', error);
        });
}

// Anahtarların belirli bir süre sonra otomatik olarak silinmesi
setInterval(() => {
    const now = Date.now();
    for (const [kullaniciAdi, anahtarInfo] of Object.entries(keyStore)) {
        if (now - anahtarInfo.lastUsed >= 86400000) { // 24 saatlik süre (1 gün)
            delete keyStore[kullaniciAdi];
            sendWebhookMessage(`Anahtar otomatik olarak silindi (süre doldu): ${anahtarInfo.key}`);
        }
    }
}, 86400000); // 24 saatlik süre (1 gün)

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
        sendWebhookMessage(`Giriş yapıldı: ${key}`);
        res.redirect('/keymanagment');
    } else {
        res.status(404).send('Anahtar bulunamadı!');
    }
});

app.listen(port, () => {
    console.log(`Uygulama ${port} portunda çalışıyor.`);
});

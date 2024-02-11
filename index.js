const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const port = 3000;

// Body-parser middleware'i uygulamaya ekle
app.use(bodyParser.urlencoded({ extended: true }));

// Örnek anahtarlar için bir veri deposu
let keyStore = {
    "staffkey": "staff-key-value",
    "adminkey": "admin-key-value",
    "ownerkey": "owner-key-value"
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
    keyListHTML += '<br><a href="/keymanagment">Anahtarları Listele</a>';
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

// Login endpoint'i
app.post('/login', (req, res) => {
    const key = req.body.key; // Anahtarı al
    if (keyStore.hasOwnProperty(key)) {
        const userType = getKeyType(key);
        // Discord Webhook'a mesaj gönderme
        sendDiscordMessage(userType);
        res.redirect('/keymanagment'); // Anahtar doğruysa /keymanagment sayfasına yönlendir
    } else {
        res.send('Geçersiz anahtar'); // Anahtar geçersizse hata mesajı göster
    }
});

// Anahtar türünü belirleme fonksiyonu
function getKeyType(key) {
    if (key === keyStore.staffkey) {
        return 'Staff';
    } else if (key === keyStore.adminkey) {
        return 'Admin';
    } else if (key === keyStore.ownerkey) {
        return 'Owner';
    }
    return 'Unknown';
}

// Discord Webhook'a mesaj gönderme fonksiyonu
function sendDiscordMessage(userType) {
    const webhookURL = 'https://discord.com/api/webhooks/1205871174895140874/YOZkPBLr4F7JiaiMjmcRH2l7xyc_eKuO7E5EDYBteTT07Bx9xCEdeoZY-XG9mrlVMJ03';
    const message = `${userType} sisteme giriş yaptı.`;
    axios.post(webhookURL, { content: message })
        .then(response => {
            console.log('Discord mesajı gönderildi:', response.data);
        })
        .catch(error => {
            console.error('Discord mesajı gönderirken hata oluştu:', error);
        });
}

app.listen(port, () => {
    console.log(`Uygulama ${port} portunda çalışıyor.`);
});

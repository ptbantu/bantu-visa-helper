import http from 'http';

const data = JSON.stringify({
  customer_name: 'John Doe',
  passport_no: 'A1234567',
  visa_type: 'ITAS',
  expiry_date: '2026-12-31T00:00:00.000Z',
  is_urgent: false,
  phone: '1234567890',
  whatsapp: '1234567890',
  reminder_enabled: true
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/visas',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let resData = '';
  res.on('data', (chunk) => {
    resData += chunk;
  });
  res.on('end', () => {
    console.log(resData);
  });
});

req.on('error', (err) => {
  console.log('Error: ' + err.message);
});

req.write(data);
req.end();

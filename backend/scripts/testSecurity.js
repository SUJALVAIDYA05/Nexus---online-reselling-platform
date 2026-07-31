const http = require('http');
const express = require('express');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const { authLimiter, apiLimiter, messageLimiter } = require('../middleware/rateLimiter');
const { signupRules, loginRules, listingRules, messageRules } = require('../middleware/validators');

async function testSecurity() {
  console.log('--- Starting Security Hardening Tests ---');

  const app = express();
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
      }
    }
  }));
  app.use(mongoSanitize());
  app.use(express.json());
  app.use('/api', apiLimiter);

  // Dummy routes with middleware attached
  app.post('/api/auth/signup', authLimiter, signupRules, (req, res) => {
    res.status(201).json({ success: true, body: req.body });
  });

  app.post('/api/auth/login', authLimiter, loginRules, (req, res) => {
    res.json({ success: true, body: req.body });
  });

  app.post('/api/listings', listingRules, (req, res) => {
    res.status(201).json({ success: true, body: req.body });
  });

  app.post('/api/conversations/123/messages', messageLimiter, messageRules, (req, res) => {
    res.json({ success: true });
  });

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    console.log(`Test server running on port ${port}`);

    let passed = 0;
    let failed = 0;

    // Helper request
    function makeReq(path, method = 'GET', body = null) {
      return new Promise((resolve, reject) => {
        const url = new URL(path, baseUrl);
        const options = {
          method,
          headers: {
            'Content-Type': 'application/json'
          }
        };
        const req = http.request(url, options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            let json = null;
            try { json = JSON.parse(data); } catch (e) {}
            resolve({ status: res.statusCode, headers: res.headers, body: json || data });
          });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
      });
    }

    try {
      // Test 1: Helmet Headers
      console.log('\n[Test 1] Helmet Security Headers');
      const res1 = await makeReq('/api/auth/signup', 'POST', { name: 'Test', email: 'test@example.com', password: 'password123' });
      if (res1.headers['x-content-type-options'] === 'nosniff' && res1.headers['content-security-policy']) {
        console.log('✅ Helmet headers present (nosniff, CSP active)');
        passed++;
      } else {
        console.error('❌ Helmet headers missing:', res1.headers);
        failed++;
      }

      // Test 2: Input Validation (Invalid Signup)
      console.log('\n[Test 2] Input Validation - Signup Validation Error');
      const res2 = await makeReq('/api/auth/signup', 'POST', { name: '', email: 'invalid-email', password: '123' });
      if (res2.status === 400 && res2.body.error) {
        console.log('✅ Validation correctly returned 400 with error:', res2.body.error);
        passed++;
      } else {
        console.error('❌ Signup validation failed to reject invalid input:', res2);
        failed++;
      }

      // Test 3: Listing Validation
      console.log('\n[Test 3] Input Validation - Listing Validation');
      const res3 = await makeReq('/api/listings', 'POST', { title: 'Hi', description: 'short', price: -5, category: '123' });
      if (res3.status === 400) {
        console.log('✅ Invalid listing rejected with 400:', res3.body.error);
        passed++;
      } else {
        console.error('❌ Invalid listing accepted:', res3);
        failed++;
      }

      // Test 4: NoSQL Injection Sanitization
      console.log('\n[Test 4] NoSQL Injection Protection');
      const res4 = await makeReq('/api/auth/login', 'POST', { email: { "$gt": "" }, password: "password123" });
      // express-mongo-sanitize strips keys starting with $ from req.body
      // So email becomes empty object {}, which fails validation with 400 or 401
      if (res4.status === 400 || res4.status === 401) {
        console.log('✅ Mongo operator injection sanitized and rejected');
        passed++;
      } else {
        console.error('❌ Mongo operator injection not sanitized:', res4);
        failed++;
      }

      // Test 5: Rate Limiting
      console.log('\n[Test 5] Auth Rate Limiting');
      let hitLimit = false;
      for (let i = 0; i < 12; i++) {
        const resRate = await makeReq('/api/auth/login', 'POST', { email: 'test@example.com', password: 'password123' });
        if (resRate.status === 429) {
          hitLimit = true;
          console.log(`✅ Rate limit triggered on request #${i + 1} with HTTP 429`);
          break;
        }
      }
      if (hitLimit) {
        passed++;
      } else {
        console.error('❌ Rate limit did not trigger after 12 requests');
        failed++;
      }

      console.log(`\n--- Test Summary: ${passed} Passed, ${failed} Failed ---`);
    } catch (err) {
      console.error('Test execution error:', err);
    } finally {
      server.close();
      process.exit(failed > 0 ? 1 : 0);
    }
  });
}

testSecurity();

const assert = require('node:assert/strict');
const test = require('node:test');
const { sendEmail } = require('../services/emailService');

const originalFetch = global.fetch;
const originalApiKey = process.env.RESEND_API_KEY;
const originalFrom = process.env.RESEND_FROM_EMAIL;

test.afterEach(() => {
  global.fetch = originalFetch;
  if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = originalApiKey;
  if (originalFrom === undefined) delete process.env.RESEND_FROM_EMAIL;
  else process.env.RESEND_FROM_EMAIL = originalFrom;
});

test('email service requires a Resend API key and sender', async () => {
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM_EMAIL;
  global.fetch = () => assert.fail('fetch should not be called without configuration');

  await assert.rejects(
    sendEmail({ to: 'parent@example.com', subject: 'Test', html: '<p>Test</p>' }),
    /RESEND_API_KEY and RESEND_FROM_EMAIL/
  );
});

test('email service sends messages through the Resend HTTPS API', async () => {
  process.env.RESEND_API_KEY = 'test-api-key';
  process.env.RESEND_FROM_EMAIL = 'FindCare NS <alerts@example.com>';
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer test-api-key');
    assert.deepEqual(JSON.parse(options.body), {
      from: 'FindCare NS <alerts@example.com>',
      to: 'parent@example.com',
      subject: 'Test alert',
      html: '<p>There is an opening.</p>',
    });
    return { ok: true, json: async () => ({ id: 'email-id' }) };
  };

  const result = await sendEmail({
    to: 'parent@example.com',
    subject: 'Test alert',
    html: '<p>There is an opening.</p>',
  });

  assert.deepEqual(result, { id: 'email-id' });
});

test('email service surfaces provider errors', async () => {
  process.env.RESEND_API_KEY = 'test-api-key';
  process.env.RESEND_FROM_EMAIL = 'FindCare NS <alerts@example.com>';
  global.fetch = async () => ({
    ok: false,
    status: 422,
    text: async () => '{"message":"Invalid sender"}',
  });

  await assert.rejects(
    sendEmail({ to: 'parent@example.com', subject: 'Test', html: '<p>Test</p>' }),
    /Email provider request failed \(422\): .*Invalid sender/
  );
});

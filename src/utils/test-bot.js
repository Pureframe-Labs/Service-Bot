const axios = require("axios")

const BASE_URL = process.env.BASE_URL || "http://localhost:3000"
const WHATSAPP_PHONE = process.env.TEST_PHONE_NUMBER || "919999999999"

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
}

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`)
}

async function testEndpoint(method, url, data = null) {
  try {
    log(colors.cyan, `\n[${method}] ${url}`)

    const config = {
      method,
      url: `${BASE_URL}${url}`,
      validateStatus: () => true,
    }

    if (data) {
      config.data = data
    }

    const response = await axios(config)

    if (response.status >= 200 && response.status < 300) {
      log(colors.green, `✅ Status: ${response.status}`)
      if (response.data && typeof response.data === "object") {
        console.log(JSON.stringify(response.data, null, 2))
      }
      return true
    } else {
      log(colors.red, `❌ Status: ${response.status}`)
      console.log(JSON.stringify(response.data, null, 2))
      return false
    }
  } catch (error) {
    log(colors.red, `❌ Error: ${error.message}`)
    return false
  }
}

async function runTests() {
  log(colors.blue, "\n" + "=".repeat(60))
  log(colors.blue, "WhatsApp Bot - Test Suite")
  log(colors.blue, "=".repeat(60))

  const results = {}

  // Test 1: Health Check
  log(colors.yellow, "\n📋 Test 1: Health Check")
  results.health = await testEndpoint("GET", "/health")

  // Test 2: Get Test Data
  log(colors.yellow, "\n📋 Test 2: Get Test Data")
  results.testData = await testEndpoint("GET", "/test/data")

  // Test 3: Simulate Webhook Verification
  log(colors.yellow, "\n📋 Test 3: Webhook Verification")
  results.webhookVerify = await testEndpoint(
    "GET",
    `/webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=${process.env.VERIFY_TOKEN}`,
  )

  // Test 4: Payment Checkout
  log(colors.yellow, "\n📋 Test 4: Payment Checkout Page")
  results.checkoutPage = await testEndpoint("GET", "/payment/checkout?orderId=TEST001&whatsappId=919999999999")

  // Test 5: Simulate Payment Success
  log(colors.yellow, "\n📋 Test 5: Payment Success (Mock)")
  results.paymentSuccess = await testEndpoint("GET", "/payment/success?orderId=TEST001&paymentId=mock123&mock=true")

  // Summary
  log(colors.blue, "\n" + "=".repeat(60))
  log(colors.blue, "Test Summary")
  log(colors.blue, "=".repeat(60))

  const passed = Object.values(results).filter((r) => r).length
  const total = Object.keys(results).length

  log(colors.green, `✅ Passed: ${passed}/${total}`)

  if (passed === total) {
    log(colors.green, "\n🎉 All tests passed! Bot is ready.")
    log(colors.yellow, '\nNext: Send "hi" to your WhatsApp Business number')
  } else {
    log(colors.red, "\n⚠️  Some tests failed. Check configuration.")
  }

  log(colors.blue, "=".repeat(60) + "\n")
}

runTests().catch((error) => {
  log(colors.red, `Fatal error: ${error.message}`)
  process.exit(1)
})

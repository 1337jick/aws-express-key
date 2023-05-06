const express = require("express");
const puppeteer = require("puppeteer");
const cors = require('cors'); // Add this line

const app = express();
const port = 3001;

app.use(cors()); // Add this line to enable CORS for all routes

app.get("/generate-keys", async (req, res) => {
  // Same Puppeteer code from the previous example
  
  (async () => {
    const browser = await puppeteer.launch({ headless: false });
    // const browser = await puppeteer.launch(); // headless: true is the default option
    const page = await browser.newPage();

    // Set the default navigation timeout to 60,000 ms (60 seconds)
    page.setDefaultNavigationTimeout(60000);

    // Enable request setRequestInterception
    // await page.setRequestInterception(true);

    // Log in to AWS Console
    await page.goto('https://console.aws.amazon.com/');
    await page.type('#resolving_input', '1337jick@gmail.com'); // Replace with your AWS email
    await page.click('#next_button');

    // Check if reCAPTCHA is present
    const isRecaptchaPresent = await page.$('#captcha_container') !== null;

    if (isRecaptchaPresent) {
      // Pause the script execution and show a message
      console.log('reCAPTCHA detected. Please solve the challenge manually and press Enter to continue...');
      await new Promise((resolve) => {
        process.stdin.once('data', () => {
          resolve();
        });
      });
    }

    
    // Wait for the password field to appear and enter the password
    await page.waitForSelector('#password');
    await page.type('#password', 'Rehbwfc[kt,jv#1337aws%', {delay: 50 }); // Replace with your AWS password
 
    await page.click('#signin_button'),
    await page.waitForNavigation(), // Wait for login to complete
  

    // Navigate to Security Credentials page
    await page.goto(
      "https://console.aws.amazon.com/iamv2/home?#/security_credentials"
    );


    // Click on the "Create access key" button using the class selector
    await page.waitForXPath("//button[.//span[contains(., 'Create access key')]]", { timeout: 60000 });
    // Click the button
    const createKeyButton1 = await page.$x("//button[.//span[contains(., 'Create access key')]]");
    await createKeyButton1[0].click();

    // Accept the root access key warning
    // Check if the #ack-risk checkbox is present and click on it
    const ackRiskCheckbox = await page.$('#ack-risk');
    if (ackRiskCheckbox) {
      await page.click('#ack-risk');
    }

    // Click on the "Create access key" button using the class selector
    await page.waitForXPath("//button[.//span[contains(., 'Create access key')]]", { timeout: 60000 });
    // Click the button
    const createKeyButton = await page.$x("//button[.//span[contains(., 'Create access key')]]");


    // Intercept the response and retrieve accessKeyId and secretAccessKey
    let accessKeyId, secretAccessKey;
    const onResponse = async (response) => {

      console.log('response started');
      const url = response.url();

      if (url.includes('https://us-east-1.console.aws.amazon.com/iamv2/api/iam')) {
        console.log('response inside if');
        const responseBody = await response.json();
        console.log('responseBody', responseBody);
        if (responseBody.AccessKey) {
          accessKeyId = responseBody.AccessKey.AccessKeyId;
          secretAccessKey = responseBody.AccessKey.SecretAccessKey;

          // Log the keys
          console.log(`Access key: ${accessKeyId}`);
          console.log(`Secret access key: ${secretAccessKey}`);


          res.json({ accessKeyId, secretAccessKey });
          // Remove the response listener
          page.removeListener('response', onResponse);

          // Resolve the Promise
          return Promise.resolve();
        }
      }
    };

    // Add the response listener
    page.on('response', onResponse);

    // Click the "Create access key" button and wait for the Promise to resolve
    await createKeyButton[0].click();
    await new Promise((resolve) => {
      onResponse.resolve = resolve;
    });
    await browser.close();

  })();
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});



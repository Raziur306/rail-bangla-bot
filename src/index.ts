import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import clc from "cli-color";
require("dotenv").config();

puppeteer.use(StealthPlugin());

const desiredSeatClass = "SNIGDHA";
const phoneNumber = process.env.TEST_PHONE_NUMBER;
const loginPassword = process.env.TEST_PASSWORD;
const fromCity = "Dhaka";
const tocity = "Bheramara";
const dateOfJourney = "24-Jun-2024";

const checkAndBookSeat = async (page: any) => {
  const trainElements = await page.$$("app-single-trip");
  console.log("Train Found 🚆: ", trainElements.length);

  for (let train of trainElements) {
    const collapseButton = await train.$(".trip-collapse-btn");
    await collapseButton.click();
    const seatClasses = await train.$$(".single-seat-class");
    let seatAvailable = false;

    //checking seat class and availability
    for (let seatClass of seatClasses) {
      const classNameElement = await seatClass.$(".seat-class-name");
      const className = await page.evaluate(
        (el: any) => el.innerText,
        classNameElement
      );

      if (className === desiredSeatClass) {
        const availableSeatsElement = await seatClass.$(".all-seats");
        const availableSeatsText = await page.evaluate(
          (el: any) => el.innerText,
          availableSeatsElement
        );
        const availableSeats = parseInt(availableSeatsText, 10);

        if (availableSeats > 0) {
          seatAvailable = true;
          console.log(
            clc.yellow(
              `Train ${await page.evaluate(
                (el: any) => el.querySelector(".trip-name h2").innerText,
                train
              )} has ${availableSeats} ${desiredSeatClass} seats available.`
            )
          );

          const bookNowButton = await seatClass.$(".book-now-btn");
          if (bookNowButton) {
            await bookNowButton.click();

            await new Promise((resolve) => {
              setTimeout(async () => {
                console.log(clc.green("Booking Seat....🎉"));
                resolve(null);
              }, 2000);
            });

            await page.screenshot({
              path: "BookingComplete.png",
              fullPage: true,
            });

            return; // Exit after booking the seat
          }
        }
      }
    }
  }
};

(async () => {
  console.log(clc.green("Rail Bangla Script Running.....🍑"));
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate the page to a URL.
  await page.goto("https://eticket.railway.gov.bd/login");

  console.log(clc.red("Trying to login.......🫏"));
  const mobileNumber = await page.$("#mobile_number");
  await mobileNumber?.type(`${phoneNumber}`);
  const password = await page.$("#password");
  await password?.type(`${loginPassword}`);
  const loginBtn = await page.$('[type="submit"]');
  await loginBtn?.click();

  await new Promise((resolve) => {
    setTimeout(async () => {
      console.log(clc.green("Login Successful....🎉"));
      resolve(null);
    }, 2500);
  });

  console.log(clc.blue("Accepting Policy....📜"));
  const policyAgreeBtn = await page.$(".agree-btn");
  await policyAgreeBtn?.click();

  await new Promise((resolve) => {
    setTimeout(async () => {
      console.log(clc.green("Policy Accepted....🎉"));
      resolve(null);
    }, 1000);
  });

  await page.goto(
    `https://eticket.railway.gov.bd/booking/train/search?fromcity=${fromCity}&tocity=${tocity}&doj=${dateOfJourney}&class=AC_B`
  );

  checkAndBookSeat(page);
})();

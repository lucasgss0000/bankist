'use strict';

history.scrollRestoration = "manual" // prevent page from keeping scroll position on reloading

let lastActivity = '';
let tenMinutesFromLastActivity = '';
let logOffTimeout;
let logOffInterval;

// DATA
const account1 = {
  owner: 'Jonas Schmedtmann',
  movements: [200, 455.23, -306.5, 25000, -642.21, -133.9, 79.97, 1300],
  movementsDates: [
    '2019-11-18T21:31:17.178Z',
    '2019-12-23T07:42:02.383Z',
    '2020-01-28T09:15:04.904Z',
    '2020-04-01T10:17:24.185Z',
    '2020-05-08T14:11:59.604Z',
    '2020-05-27T17:01:17.194Z',
    '2020-07-11T23:36:17.929Z',
    '2020-07-12T10:51:36.790Z',
  ],
  interestRate: 1.2, // %
  pin: 1111,
  currency: ["EUR", "€"],
  locale: 'pt-PT',
};

const account2 = {
  owner: 'Jessica Davis',
  movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
  movementsDates: [
    '2019-11-01T13:15:33.035Z',
    '2019-11-30T09:48:16.867Z',
    '2019-12-25T06:04:23.907Z',
    '2020-01-25T14:18:46.235Z',
    '2020-02-05T16:33:06.386Z',
    '2020-04-10T14:43:26.374Z',
    '2020-06-25T18:49:59.371Z',
    '2020-07-26T12:01:20.894Z',
  ],
  interestRate: 1.5,
  pin: 2222,
  currency: ["USD", "$"],
  locale: 'en-US',
};

const account3 = {
  owner: 'Steven Thomas Williams',
  movements: [200, -200, 340, -300, -20, 50, 400, -460],
  movementsDates: [
    '2019-11-05T13:15:33.035Z',
    '2019-11-07T09:48:16.867Z',
    '2019-12-20T06:04:23.907Z',
    '2020-01-14T14:18:46.235Z',
    '2020-02-09T16:33:06.386Z',
    '2020-04-18T14:43:26.374Z',
    '2020-06-27T18:49:59.371Z',
    '2022-09-27T12:01:20.894Z',
  ],
  interestRate: 0.7,
  pin: 3333,
  currency: ["GBP", "£"],
  locale: "en-GB",
};

const account4 = {
  owner: 'Sarah Smith',
  movements: [430, 1000, 700, 50, 90, -300],
  movementsDates: [
    '2021-11-02T13:15:33.035Z',
    '2021-11-28T09:48:16.867Z',
    '2021-12-25T06:04:23.907Z',
    '2022-02-03T14:18:46.235Z',
    '2024-06-02T18:11:00.000Z',
    '2024-06-12T18:10:06.386Z',
  ],
  interestRate: 1,
  pin: 4444,
  currency: ["BRL", "R$"],
  locale: "pt-BR",
};

const accounts = [account1, account2, account3, account4];

// RATES FOR ALL POSSIBLE CURRENCY CONVERSIONS

var USD_TO_EUR = 0.93;
var USD_TO_GBP = 0.79;
var USD_TO_BRL = 5.35;

var BRL_TO_USD = 1 / USD_TO_BRL;
var BRL_TO_EUR = BRL_TO_USD * USD_TO_EUR;
var BRL_TO_GBP = BRL_TO_USD * USD_TO_GBP;

var EUR_TO_USD = 1 / USD_TO_EUR;
var EUR_TO_GBP = EUR_TO_USD * USD_TO_GBP;
var EUR_TO_BRL = EUR_TO_USD * USD_TO_BRL;

var GBP_TO_USD = 1 / USD_TO_GBP;
var GBP_TO_EUR = GBP_TO_USD * USD_TO_EUR;
var GBP_TO_BRL = GBP_TO_USD * USD_TO_BRL;

// DOM ELEMENTS
const DOM_labelWelcome = document.querySelector('.welcome');
const DOM_labelDate = document.querySelector('.date');
const DOM_labelBalance = document.querySelector('.balance__value');
const DOM_labelBalanceDate = document.querySelector('span.date');
const DOM_labelSumIn = document.querySelector('.summary__value--in');
const DOM_labelSumOut = document.querySelector('.summary__value--out');
const DOM_labelSumInterest = document.querySelector('.summary__value--interest');
const DOM_labelTimer = document.querySelector('.timer');

const DOM_containerApp = document.querySelector('.app');
const DOM_containerMovements = document.querySelector('.movements');

const DOM_btnLogin = document.querySelector('.login__btn');
const DOM_btnTransfer = document.querySelector('.form__btn--transfer');
const DOM_btnLoan = document.querySelector('.form__btn--loan');
const DOM_btnClose = document.querySelector('.form__btn--close');
const DOM_btnSort = document.querySelectorAll('.btn--sort');

const DOM_inputLoginUsername = document.querySelector('.login__input--user');
const DOM_inputLoginPin = document.querySelector('.login__input--pin');
const DOM_inputTransferTo = document.querySelector('.form__input--to');
const DOM_inputTransferAmount = document.querySelector('.form__input--amount');
const DOM_inputLoanAmount = document.querySelector('.form__input--loan-amount');
const DOM_inputCloseUsername = document.querySelector('.form__input--user');
const DOM_inputClosePin = document.querySelector('.form__input--pin');

// FORMATTING FUNCTIONS
function formatDate(date, locale) {
  const now = new Date();
  const diff = now - date;
  if (diff < 1000) {
      return "right now";
  } else if (diff <= 1000 * 60) {
      const seconds = Math.floor((diff) / 1000);
      return `${seconds} ${(seconds === 1) ? "second" : "seconds"} ago`;
  } else if (diff <= 1000 * 60 * 60) {
      const minutes = Math.floor((diff) / (1000 * 60));
      return `${minutes} ${(minutes === 1) ? "minute" : "minutes"} ago`;
  } else if (diff <= 1000 * 60 * 60 * 24) {
      const hours = Math.floor((diff) / (1000 * 60 * 60));
      return `${hours} ${(hours === 1) ? "hour" : "hours"} ago`;
  } else if (diff >= 1000 * 60 * 60 * 24 && diff < 2 * 1000 * 60 * 60 * 24) {
      return "yesterday";
  } else if (diff >= 2 * 1000 * 60 * 60 * 24 && diff <= 14 * 1000 * 60 * 60 * 24) {
    const days = Math.floor((diff) / (1000 * 60 * 60 * 24));
    return `${days} days ago`
  } else return new Intl.DateTimeFormat(locale).format(date);
}

function formatMoney(value, locale, currency) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
} 

// CLEAR TIMER AND CREATE NEW
function clearTimerCreateNew() {  
  lastActivity = new Date();
  tenMinutesFromLastActivity = tenMinutesFromLastActivity = new Date(new Date(lastActivity).setMinutes(lastActivity.getMinutes() + 10));
  
  if (logOffTimeout && logOffInterval) {    
    clearInterval(logOffInterval);
    clearTimeout(logOffTimeout);
  }
  
  setTimer();
  
  function setTimer() {
    // LOG OUT AFTER 10 MINUTES
    logOffTimeout = setTimeout(() => {
      logout();
    }, 1000 * 60 * 10);
  
    // DISPLAY
    DOM_labelTimer.textContent = "10:00";
    logOffInterval = setInterval(() => {
      const now = new Date();
      const diff = Math.round((tenMinutesFromLastActivity - now) / 1000); // diff in seconds
      DOM_labelTimer.textContent = `${Math.trunc(diff / 60).toString().padStart(2, "0")}:${(diff % 60).toString().padStart(2, "0")}`;
    }, 1000);
  }
}

// REPLACE "movements" and "movementsDates" arrays for a map
accounts.forEach((account) => {
  const movementsMap = new Map();
  account.movements.forEach((movement, i) => {
    movementsMap.set(account.movementsDates[i], movement);
  });
  delete account.movements;
  delete account.movementsDates;
  account.movements = movementsMap;
});

// CREATE USERNAMES 
createUsernames(accounts);

function createUsernames(accounts) {
  function getUsernameFromFullName(str) {
    return str.toLowerCase().split(' ').map(item => item[0]).join('');
  }
  accounts.forEach((obj) => obj.username = getUsernameFromFullName(obj.owner));
}

// SET STATE TO FALSE
function setActiveStatesToFalse(accounts) {
  accounts.forEach((obj) => obj.isActive = false);
}

// LOGIN
function login() {
  const username = DOM_inputLoginUsername.value;
  const password = +DOM_inputLoginPin.value;
  const objBeingAcessed = accounts.find((item) => item.username === username);

  // clear UI
  DOM_inputLoginUsername.value = DOM_inputLoginPin.value = '';
  DOM_inputLoginUsername.blur();
  DOM_inputLoginPin.blur();

  if (objBeingAcessed?.pin === password) {    
    const hour = lastActivity.getHours();
    const welcomeMessage = (hour >= 5 && hour <= 12) ? "Good Morning" : 
    (hour > 12 && hour <= 18) ? "Good Afternoon" : 
    (hour > 18 && hour <= 22) ? "Good Evening" : "Good Night";

    // show UI
    DOM_containerApp.style.opacity = '1';
    DOM_labelWelcome.textContent = `${welcomeMessage}, ${objBeingAcessed.owner.split(' ')[0]}!`;
    // workaround for the login page scroll problem
    // whenever the user logs off, these declarations below are cancelled and the page automatically scrolls up
    document.body.style.height = "unset";
    document.body.style.minHeight = "100svh";
    document.body.style.overflow = "unset";

    setActiveStatesToFalse(accounts);
    objBeingAcessed.isActive = true;
    objBeingAcessed.isSorted = false;

    // update UI
    displayMovements();
    displaySummaryBalance();
  }
}

// LOG OUT
function logout() {
  setActiveStatesToFalse(accounts);
  DOM_containerApp.style.opacity = '0';
  DOM_labelWelcome.textContent = `Log in to get started`;
  window.scrollTo(0, 0);
  document.body.style = '';
}

// MOVEMENTS
function displayMovements() {
  DOM_containerMovements.innerHTML = '';
  const activeObj = accounts.find((item) => item.isActive);
  const movements = (activeObj.isSorted) ? Array.from(activeObj.movements.values()).sort((a, b) => a - b) : Array.from(activeObj.movements.values());
  const dates = (activeObj.isSorted) ? Array.from(activeObj.movements.keys()).sort((a, b) => activeObj.movements.get(a) - activeObj.movements.get(b)) : Array.from(activeObj.movements.keys());
  // the isSorted property defines which array will be iterated over: the normal one, or the sorted one
  movements.forEach(function(mov, i, arr) {
    const movType = (mov >= 0) ? "deposit" : "withdrawal";
    const html = 
    `<div class="movements__row">
      <div class="movements__type movements__type--${movType}">${i + 1} ${movType}</div>
      <div class="movements__date">${formatDate(new Date(dates[i]), activeObj.locale)}</div>
      <div class="movements__value">${formatMoney(mov, activeObj.locale, activeObj.currency[0])}</div>
    </div>`
    DOM_containerMovements.insertAdjacentHTML("afterbegin", html);
  });
  DOM_containerMovements.prepend(Array.from(DOM_btnSort).find((btn) => !btn.classList.contains("hidden")));
}

function sort() {
  Array.from(DOM_btnSort).forEach((btn) => btn.classList.toggle("hidden"));
  const activeObj = accounts.find((item) => item.isActive);
  activeObj.isSorted = (activeObj.isSorted) ? false : true;
  displayMovements();
  displaySummaryBalance();
}

// SUMMARY & BALLANCE
function displaySummaryBalance() {
  const activeObj = accounts.find((item) => item.isActive);

  const income = Array.from(activeObj.movements.values())
  .filter((item) => item >= 0)
  .reduce((sum, item) => sum + item, 0);

  const outcome = Array.from(activeObj.movements.values())
  .filter((item) => item < 0)
  .reduce((sum, item) => sum + item, 0);

  const interest = Array.from(activeObj.movements.values())
  .filter((item) => item >= 0)
  .map((deposit) => deposit * activeObj.interestRate * 0.01)
  .filter((item) => item >= 1)
  .reduce((sum, item) => sum + item, 0);

  DOM_labelBalance.textContent = formatMoney(income + outcome, activeObj.locale, activeObj.currency[0]);
  DOM_labelBalanceDate.textContent = new Intl.DateTimeFormat(activeObj.locale, { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', }).format(new Date());
  DOM_labelSumIn.textContent = formatMoney(income, activeObj.locale, activeObj.currency[0]);
  DOM_labelSumOut.textContent = formatMoney(Math.abs(outcome), activeObj.locale, activeObj.currency[0]);
  DOM_labelSumInterest.textContent = formatMoney(interest, activeObj.locale, activeObj.currency[0]);
}

// OPERATION: TRANSFER
function transfer() {
  const activeObj = accounts.find((item) => item.isActive);
  const targetUsername = DOM_inputTransferTo.value;
  const targetObj = accounts.find((item) => item.username === targetUsername);
  const amount = +DOM_inputTransferAmount.value;
  const activeObjBalance = Array.from(activeObj.movements.values()).reduce((sum, mov) => sum + mov, 0);

  // clear UI
  DOM_inputTransferTo.value = '';
  DOM_inputTransferAmount.value = '';
  DOM_inputTransferTo.blur();
  DOM_inputTransferAmount.blur();


  if (activeObjBalance >= amount && activeObj !== targetObj && amount > 0) {
    targetObj.movements.set(new Date().toISOString(), amount * globalThis[`${activeObj.currency[0]}_TO_${targetObj.currency[0]}`]);
    activeObj.movements.set(new Date().toISOString(), -amount);

    // update UI
    displayMovements();
    displaySummaryBalance();
  }
}

// OPERATION: LOAN
function loan() {
  const activeObj = accounts.find((item) => item.isActive);
  const amount = +DOM_inputLoanAmount.value;

  // clear UI
  DOM_inputLoanAmount.value = '';
  DOM_inputLoanAmount.blur();

  // if there's ANY deposit that is more than 10% of the requested amount, the loan
  // request will be approved
  if (Array.from(activeObj.movements.values()).filter((mov) => mov >= 0).some((deposit) => deposit > amount * 0.1) && amount > 0) {
    setTimeout(() => {
      activeObj.movements.set(new Date().toISOString(), amount);
      displayMovements();
      displaySummaryBalance();
    }, 5000); // the bank will take 5 seconds to process the loan request, kinda
  }
}

// OPERATION: CLOSE ACCOUNT
function close() {
  const activeObj = accounts.find((item) => item.isActive);
  const username = DOM_inputCloseUsername.value;
  const password = +DOM_inputClosePin.value;

  // clear UI
  DOM_inputCloseUsername.value = DOM_inputClosePin.value = '';
  DOM_inputCloseUsername.blur();
  DOM_inputClosePin.blur();
  

  if (activeObj.username === username && activeObj.pin === password) {
    for (let key in activeObj) {
      delete activeObj[key];
    }
    accounts.splice(accounts.findIndex((obj) => obj.username === activeObj.username), 1);

    // back to log in page
    logout();
  }
}



DOM_btnLogin.addEventListener("click", (e) => {
  e.preventDefault();
  clearTimerCreateNew();
  login();
});
DOM_btnClose.addEventListener("click", (e) => {
  e.preventDefault();
  clearTimerCreateNew();
  close();
});
DOM_btnTransfer.addEventListener("click", (e) => {
  e.preventDefault();
  clearTimerCreateNew();
  transfer();
});
DOM_btnLoan.addEventListener("click", (e) => {
  e.preventDefault();
  clearTimerCreateNew();
  loan();
});
Array.from(DOM_btnSort).forEach((btn) => btn.addEventListener("click", (e) => {
  e.preventDefault();
  clearTimerCreateNew();
  sort();
}));

const passwordInput = document.querySelector("#passwordInput");
const generator = document.querySelector(".generator");
const copyBtn = document.querySelector("#copyBtn");
const generateBtn = document.querySelector("#generateBtn");
const generateModeBtn = document.querySelector("#generateModeBtn");
const checkModeBtn = document.querySelector("#checkModeBtn");
const controls = document.querySelector("#controls");
const lengthRange = document.querySelector("#lengthRange");
const lengthValue = document.querySelector("#lengthValue");
const uppercase = document.querySelector("#uppercase");
const lowercase = document.querySelector("#lowercase");
const numbers = document.querySelector("#numbers");
const symbols = document.querySelector("#symbols");
const readable = document.querySelector("#readable");
const message = document.querySelector("#message");
const passwordHint = document.querySelector("#passwordHint");
const strengthLabel = document.querySelector("#strengthLabel");
const strengthFill = document.querySelector("#strengthFill");

if (window.AOS) {
  AOS.init({
    once: true,
    duration: 650,
    easing: "ease-out-cubic",
    offset: 40
  });
}

const chars = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*_-+=?"
};

const similarChars = /[0OolI1|]/g;
let mode = "generate";

function updateLengthValue() {
  lengthValue.textContent = lengthRange.value;
}

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);

  if (text && window.innerWidth <= 1024) {
    message.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

function shake(element) {
  element.classList.remove("shake");
  void element.offsetWidth;
  element.classList.add("shake");
}

function getSelectedSets() {
  const selectedSets = [];

  if (uppercase.checked) selectedSets.push(chars.uppercase);
  if (lowercase.checked) selectedSets.push(chars.lowercase);
  if (numbers.checked) selectedSets.push(chars.numbers);
  if (symbols.checked) selectedSets.push(chars.symbols);

  if (!readable.checked) {
    return selectedSets;
  }

  return selectedSets
    .map((set) => set.replace(similarChars, ""))
    .filter(Boolean);
}

function getRandomChar(source) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return source[values[0] % source.length];
}

function shuffle(value) {
  const letters = value.split("");

  for (let i = letters.length - 1; i > 0; i--) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    const j = values[0] % (i + 1);
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }

  return letters.join("");
}

function getPasswordSetsCount(password) {
  return [
    /[A-Z]/,
    /[a-z]/,
    /[0-9]/,
    /[^A-Za-z0-9]/
  ].filter((pattern) => pattern.test(password)).length;
}

function estimateStrength(password) {
  const length = password.length;
  const setsCount = getPasswordSetsCount(password);
  let score = 0;

  if (length >= 6) score += 1;
  if (length >= 12) score += 1;
  if (length >= 18) score += 1;
  if (setsCount >= 3) score += 1;
  if (setsCount >= 4) score += 1;

  return Math.min(score, 5);
}

function updateStrength(password) {
  if (mode === "check" && password.length > 0 && password.length < 6) {
    strengthLabel.textContent = "Слишком короткий";
    strengthFill.style.width = "14%";
    strengthFill.style.background = "#f87171";
    return;
  }

  if (mode === "check" && password.length > 40) {
    strengthLabel.textContent = "Слишком длинный";
    strengthFill.style.width = "100%";
    strengthFill.style.background = "#f87171";
    return;
  }

  const states = [
    ["Проверка надежности", "0", "#2a2a2a"],
    ["Слабый", "24%", "#f87171"],
    ["Нормальный", "44%", "#fb923c"],
    ["Хороший", "64%", "#facc15"],
    ["Сильный", "82%", "#86efac"],
    ["Очень сильный", "100%", "#7dd3fc"]
  ];
  const score = password ? estimateStrength(password) : 0;
  const [label, width, color] = states[score];

  strengthLabel.textContent = label;
  strengthFill.style.width = width;
  strengthFill.style.background = color;
}

function validateCheckedPassword() {
  if (mode !== "check") {
    passwordHint.classList.remove("visible", "warning");
    return true;
  }

  const length = passwordInput.value.length;
  const isEmpty = length === 0;
  const isValid = isEmpty || (length >= 6 && length <= 40);

  passwordHint.classList.add("visible");
  passwordHint.classList.toggle("warning", !isValid);
  passwordHint.textContent = isValid
    ? "Пароль должен состоять от 6 до 40 символов"
    : "Предупреждение: пароль должен состоять от 6 до 40 символов";

  return isValid;
}

function generatePassword() {
  const length = Number(lengthRange.value);
  const selectedSets = getSelectedSets();

  if (!selectedSets.length) {
    passwordInput.value = "";
    updateStrength("");
    showMessage("Выбери хотя бы один тип символов", true);
    shake(generateBtn);
    return;
  }

  const allChars = selectedSets.join("");
  const requiredChars = selectedSets.map(getRandomChar);
  const restLength = Math.max(length - requiredChars.length, 0);
  let password = requiredChars.join("");

  for (let i = 0; i < restLength; i++) {
    password += getRandomChar(allChars);
  }

  passwordInput.value = shuffle(password).slice(0, length);
  updateStrength(passwordInput.value);
  showMessage("");
  shake(passwordInput);
}

function setMode(nextMode) {
  mode = nextMode;
  const isCheckMode = mode === "check";

  generateModeBtn.classList.toggle("active", !isCheckMode);
  checkModeBtn.classList.toggle("active", isCheckMode);
  generator.classList.toggle("check-mode", isCheckMode);
  controls.classList.toggle("hidden", isCheckMode);
  passwordInput.readOnly = !isCheckMode;
  passwordInput.placeholder = isCheckMode ? "Вставь пароль для проверки" : "Пароль появится здесь";
  generateBtn.textContent = isCheckMode ? "Очистить" : "Сгенерировать";
  showMessage("");

  if (isCheckMode) {
    passwordInput.value = "";
    updateStrength("");
    validateCheckedPassword();
    passwordInput.focus();
    return;
  }

  validateCheckedPassword();
  generatePassword();
}

async function copyPassword() {
  const password = passwordInput.value.trim();

  if (!password) {
    showMessage(mode === "check" ? "Сначала введи пароль" : "Сначала сгенерируй пароль", true);
    return;
  }

  try {
    await navigator.clipboard.writeText(password);
    showMessage("Пароль скопирован");
  } catch {
    passwordInput.select();
    showMessage("Выделил пароль, можно скопировать вручную", true);
  }
}

lengthRange.addEventListener("input", () => {
  updateLengthValue();
  generatePassword();
});

[uppercase, lowercase, numbers, symbols, readable].forEach((input) => {
  input.addEventListener("change", generatePassword);
});

passwordInput.addEventListener("input", () => {
  if (mode === "check") {
    updateStrength(passwordInput.value);
    validateCheckedPassword();
    showMessage("");
  }
});

generateModeBtn.addEventListener("click", () => setMode("generate"));
checkModeBtn.addEventListener("click", () => setMode("check"));

generateBtn.addEventListener("click", () => {
  if (mode === "check") {
    passwordInput.value = "";
    updateStrength("");
    validateCheckedPassword();
    passwordInput.focus();
    showMessage("");
    return;
  }

  generatePassword();
});

copyBtn.addEventListener("click", copyPassword);

updateLengthValue();
generatePassword();

/* Konfigurasi MAXI MOBILE. Isi API_URL dengan URL Web App Apps Script (berakhiran /exec). */
window.MAXI_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbwKNh3io6ix8W5Otpg9tiVkA_l4wwHvmvz0fwZDTtxiRuvdDJ05uS6jNUR37_e-S7oR/exec',
  /* true = mode demo (data tiruan di browser). Otomatis mati begitu API_URL diisi. */
  USE_MOCK: true,
  TIMEOUT_MS: 30000,
  /* Set true jika halamannya sudah dibuat. Yang false tampil "Segera" dan tidak bisa diklik. */
  FEATURES: { attendance: true, leave: true, permission: true, overtime: true, activity: false, approval: true, employees: true, team: true, holidays: true, settings: true }
};

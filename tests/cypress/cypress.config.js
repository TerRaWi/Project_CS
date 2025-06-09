const { defineConfig } = require("cypress");

module.exports = defineConfig({
  reporter: 'cypress-mochawesome-reporter', // ✅ เพิ่มตรงนี้
  reporterOptions: {
    reportDir: 'cypress/reports',      // 📁 ที่เก็บ report
    overwrite: false,
    html: false,                        // เราจะรวมเป็น HTML ทีหลัง
    json: true
  },
  e2e: {
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on); // ✅ plugin ของ reporter
      return config;
    },
    experimentalStudio: true,
  },
});

describe("FinPulse transaction screening", () => {
  it("screens a high-risk transaction and displays BLOCK decision", () => {
    cy.intercept("GET", "/api/v1/transactions", {
      statusCode: 200,
      body: [],
    }).as("getTransactions");

    cy.intercept("POST", "/api/v1/transactions", {
      statusCode: 200,
      body: {
        id: 999,
        user_id: 1,
        amount: "1500000.00",
        currency: "INR",
        merchant: "Cypress High Risk Test",
        category: "Shopping",
        timestamp: "2026-09-25T10:00:00+05:30",
        location: "Kolkata",
        device_id: "device_cypress",
        status: "pending",
      },
    }).as("createTransaction");

    cy.intercept("GET", "/api/v1/users/1/risk", {
      statusCode: 200,
      body: [
        {
          id: 999,
          user_id: 1,
          amount: "1500000.00",
          currency: "INR",
          merchant: "Cypress High Risk Test",
          category: "Shopping",
          timestamp: "2026-09-25T10:00:00+05:30",
          location: "Kolkata",
          device_id: "device_cypress",
          status: "blocked",
          risk: {
            risk_score: 95,
            risk_level: "HIGH",
            decision: "BLOCK",
            reasons: [
              "Extremely high transaction amount",
              "Transaction from a new device",
            ],
          },
        },
      ],
    }).as("getRisk");

    cy.visit("/transactions");

    cy.contains("Analyze a new transaction").should("be.visible");

    cy.get('input[type="number"]')
      .clear()
      .type("1500000");

    cy.contains("label", "Merchant")
      .parent()
      .find("input")
      .clear()
      .type("Cypress High Risk Test");

    cy.contains("label", "Category")
      .parent()
      .find("select")
      .select("Shopping");

    cy.contains("label", "Currency")
      .parent()
      .find("select")
      .select("INR");

    cy.contains("label", "Location")
      .parent()
      .find("input")
      .clear()
      .type("Kolkata");

    cy.contains("label", "Device ID")
      .parent()
      .find("input")
      .clear()
      .type("device_cypress");

    cy.contains("button", "Analyze Transaction")
      .click();

    cy.wait("@createTransaction");

    cy.contains("Screening in progress")
      .should("be.visible");

    cy.wait("@getRisk");

    cy.contains("BLOCK")
      .should("be.visible");

    cy.contains("HIGH")
      .should("be.visible");

    cy.contains("Cypress High Risk Test")
      .should("be.visible");
  });
});
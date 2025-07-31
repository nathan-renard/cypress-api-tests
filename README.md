# Cypress API Tests

This repository contains automated API tests for validating endpoints using [Cypress](https://www.cypress.io/).

## Table of Contents

- [Getting Started](#getting-started)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)

## Getting Started

Clone the repository:

```bash
git clone https://github.com/nathan-renard/cypress-api-tests.git
cd cypress-api-tests
```

## Installation

Install dependencies using npm:

```bash
npm install
```

## Configuration

Update the `cypress.config.js` file to set your API base URL and other environment variables as needed.

## Running Tests

To execute all API tests, run:

```bash
npx cypress run
```

To open the Cypress Test Runner UI:

```bash
npx cypress open
```

## Project Structure

```
cypress-api-tests/
├── cypress/
│   ├── e2e/           # API test specs
│   └── support/       # Custom commands and utilities
├── cypress.config.js  # Cypress configuration
├── package.json
└── README.md
```
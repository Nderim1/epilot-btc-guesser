# BTC Price Guesser

## Project overview
BTC Price Guesser is a full stack web application that allows users to guess the future price of Bitcoin and earn (or lose) points based on their accuracy.



## Features
- Fetch current price of Bitcoin
- See historical price of Bitcoin
- Submit a guess every 60 seconds
- See current score
- See current active guess

## Tech stack
- Frontend: React, Typescript, Tanstack Query, Chart.js, Heroicons, Tailwind CSS
- Backend: Node.js, AWS SAM, AWS Lambda, AWS API Gateway, AWS DynamoDB

## Architecture
  - **Project structure**
    - btc-guesser-backend: Backend code
    - btc-guesser-frontend: Frontend code

  - **Frontend**
    - React app build with Vite and Typescript
    - Tanstack Query for data fetching (caching, query invalidation and refetching)
    - Chart.js for visualizing the price history
    - Heroicons for icons
    - Tailwind CSS for styling

  - **Backend**
    - **API Gateway** Exposes RESTful endpoints for the frontend.
    - **AWS Lambda:** Node.js functions to handle business logic:
      - `GetPriceFunction`: Fetches the current BTC price from an external API (Coinbase).
      - `SubmitGuessFunction`: Allows users to submit their price guess and stores it using the player ID (name).
      - `GetStatusFunction`: Retrieves the player's current game status (score, active guesses).
    - **DynamoDB:** NoSQL database (`BtcGuesserPlayerTable`) to store player data (player ID, score, active guesses).

## Prerequisites
Make sure you have the following tools installed:
- Node.js (LTS version recommended, e.g., v18.x or v20.x)
- npm or yarn
- AWS CLI (configured with your AWS credentials and default region)
- AWS SAM CLI

## Getting Started

### 1. Clone the Repository
```bash
git clone git@github.com:Nderim1/epilot-btc-guesser.git
cd epilot-btc-guesser
```

### 2. Backend Setup (`btc-guesser-backend`)
The backend is an AWS SAM application.

**a. Build the SAM application:**
Navigate to the backend directory and run the build command. This will compile your Lambda functions and prepare deployment artifacts.
```bash
cd btc-guesser-backend
sam build
```

**b. Deploy the SAM application to AWS:**
This command will package and deploy your application to AWS CloudFormation, creating the necessary resources (API Gateway, Lambdas, DynamoDB table).
```bash
sam deploy --guided
```
Take note of the API Gateway endpoints provided in the outputs. You'll need these for the frontend configuration.

**c. (Optional) Local Backend Development:**
To run the API Gateway and Lambda functions locally for development:
```bash
sam local start-api
```
This will typically start a local server at `http://127.0.0.1:3000`.

### 3. Frontend Setup (`btc-guesser-frontend`)

**a. Navigate to the frontend directory:**
```bash
cd ./btc-guesser-frontend
```

**b. Install dependencies:**
```bash
npm install
# or
# yarn install
```

**c. Configure API Endpoints:**
You'll need to tell the frontend where your backend API is running. Create a `.env` file in the `btc-guesser-frontend` directory with the following content:
```env
# btc-guesser-frontend/.env
VITE_API_BASE_URL="https://<your-api-gateway-id>.execute-api.<your-region>.amazonaws.com/Prod"
```
Replace `<your-api-gateway-id>` and `<your-region>` with the actual values from your `sam deploy` output (specifically, the `ApiGatewayBaseUrl` output).

**d. Run the development server:**
```bash
npm run dev
# or
# yarn dev
```
The application should now be accessible at `http://localhost:5173` (or another port if 5173 is busy).

## API Endpoints
The backend exposes the following API endpoints. Replace `<api-id>` and `<region>` with your specific deployment details from the `sam deploy` output.
- **Get Current BTC Price**
  - `GET /price`
  - Example: `curl https://<api-id>.execute-api.<region>.amazonaws.com/Prod/price`
- **Submit Guess**
  - `POST /guess`
  - Request Body: `{ "playerId": "string", "guess": "up" | "down" }`
  - Example: `curl -X POST -H "Content-Type: application/json" -d '{"playerId":"testUser123", "guess":"up"}' https://<api-id>.execute-api.<region>.amazonaws.com/Prod/guess`
- **Get Player Status**
  - `GET /player-status/{playerId}`
  - Example: `curl https://<api-id>.execute-api.<region>.amazonaws.com/Prod/player-status/testUser123`


## Steps I took
- Initialize codebase
  - created folder structure and git repo
- Configure AWS
  - created a new IAM user and added it to the AWS console
  - chose a BTC API to get the current price of BTC (Coinbase)
  - installed aws-sam-cli (serverless application model cli tool)
  - Created a new SAM project
  - updated the template.yaml file to create a new API Gateway endpoint and define a new DynamoDB table
- Implement Lambda functions
  - Get BTC price Lambda function
    - created the lambda function to get the BTC price
    - build and deployed the app with SAM for the first time using SAM build and SAM deploy --guided
    - curling GET https://d1d64qf74g.execute-api.eu-west-1.amazonaws.com/Prod/price to make sure it returns the current price of BTC
  - Submit guess Lambda function
    - created the lambda function to submit a guess by passing player id and guess
    - build and deployed the app with SAM
    - curling POST with player id and guess https://d1d64qf74g.execute-api.eu-west-1.amazonaws.com/Prod/guess works correctly
  - Get Status Lambda function
    - created the lambda function to get the status of the user (active guesses and current score)
    - build and deployed the app with SAM
    - curling GET https://d1d64qf74g.execute-api.eu-west-1.amazonaws.com/Prod/player-status/{playerID} to make sure it returns the current status of the game
- Implement frontend
  - created a new React and Typescript project with Vite
  - installed additional libraries: Tanstack query, chart.js, heroicons and Tailwind CSS
  - had to enable CORS in the API Gateway console to remove the CORS error

## Things I would do if I had more time
- BE
  - better API endpoint naming conventions 
  - create a player ID generator (UUID) instead of using the player name as ID
  - unit testing
  - minify lambda code
  - add logging and tracing
  - better error handling
- FE
  - unit testing
  - env variables for API URLs (no hardcoding)
  - better component structure (separate components for different parts of the UI)
  - get BTC historical price using my own BE instead of directly calling Coinbase
- General
  - create CI/CD pipeline for automatic testing, building and deployment on push
  - better documentation
  

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import https from 'https';

const httpsGet = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const coinbaseApiUrl = 'https://api.coinbase.com/v2/prices/BTC-USD/spot';

  try {
    console.log('Fetching price from Coinbase API:', coinbaseApiUrl);
    const responseData = await httpsGet(coinbaseApiUrl);
    console.log('Received data from Coinbase:', responseData);

    const parsedData = JSON.parse(responseData);

    if (parsedData.data && parsedData.data.amount) {
      const price = parseFloat(parsedData.data.amount);
      console.log('Parsed price:', price);

      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*", // Allow all origins (for simplicity in dev)
          "Access-Control-Allow-Methods": "GET,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"
        },
        body: JSON.stringify({
          price: price,
          currency: 'USD',
          source: 'Coinbase'
        }),
      };
    } else {
      console.error('Unexpected data structure from Coinbase:', parsedData);
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: 'Error parsing price data from Coinbase' }),
      };
    }
  } catch (error: any) {
    console.error('Error fetching price from Coinbase or processing data:', error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        message: 'Failed to fetch BTC price',
        error: error.message,
      }),
    };
  }
};
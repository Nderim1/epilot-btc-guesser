import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import https from 'https';

const tableName = process.env.PLAYER_TABLE_NAME || 'BtcGuesserPlayerTable';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const httpsGet = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve(data); });
    }).on('error', (err) => { reject(err); });
  });
};

const getCurrentBtcPrice = async (): Promise<number | null> => {
  const coinbaseApiUrl = 'https://api.coinbase.com/v2/prices/BTC-USD/spot';
  try {
    const responseData = await httpsGet(coinbaseApiUrl);
    const parsedData = JSON.parse(responseData);
    if (parsedData.data && parsedData.data.amount) {
      return parseFloat(parsedData.data.amount);
    }
    console.error('Unexpected data structure from Coinbase for price:', parsedData);
    return null;
  } catch (error) {
    console.error('Error fetching current BTC price:', error);
    return null;
  }
};

interface GuessRequestBody {
  playerId: string;
  guess: 'up' | 'down';
}

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: 'Missing request body' }),
    };
  }

  let requestBody: GuessRequestBody;
  try {
    requestBody = JSON.parse(event.body);
    if (!requestBody.playerId || !requestBody.guess || !['up', 'down'].includes(requestBody.guess)) {
      throw new Error('Invalid request body structure or values.');
    }
  } catch (error) {
    console.error('Invalid request body:', error);
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: 'Invalid request body. Expecting { "playerId": "string", "guess": "up"|"down" }' }),
    };
  }

  const { playerId, guess } = requestBody;
  const timestamp = Date.now();

  try {
    const getPlayerCommand = new GetCommand({
      TableName: tableName,
      Key: { PlayerId: playerId },
    });
    const playerResult = await docClient.send(getPlayerCommand);
    const playerItem = playerResult.Item;

    if (playerItem && playerItem.ActiveGuess) {
      return {
        statusCode: 409, // Conflict - guess already active
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: 'An active guess already exists for this player. Please wait for it to resolve.' }),
      };
    }

    const initialPrice = await getCurrentBtcPrice();
    if (initialPrice === null) {
      return {
        statusCode: 503,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: 'Failed to fetch current BTC price. Please try again.' }),
      };
    }

    const activeGuessDetails = {
      initialPrice: initialPrice,
      direction: guess,
      timestamp: timestamp,
    };

    if (playerItem) {
      const updateCommand = new UpdateCommand({
        TableName: tableName,
        Key: { PlayerId: playerId },
        UpdateExpression: 'SET ActiveGuess = :ag',
        ExpressionAttributeValues: {
          ':ag': activeGuessDetails,
        },
        ReturnValues: 'UPDATED_NEW',
      });
      await docClient.send(updateCommand);
    } else {
      const putCommand = new PutCommand({
        TableName: tableName,
        Item: {
          PlayerId: playerId,
          Score: 0,
          ActiveGuess: activeGuessDetails,
        },
      });
      await docClient.send(putCommand);
    }

    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"
      },
      body: JSON.stringify({
        message: 'Guess submitted successfully.',
        playerId: playerId,
        activeGuess: activeGuessDetails,
      }),
    };

  } catch (dbError: any) {
    console.error('DynamoDB Error:', dbError);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: 'Failed to process guess due to a database error.', error: dbError.message }),
    };
  }
};
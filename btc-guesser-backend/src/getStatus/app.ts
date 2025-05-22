import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import https from 'https';

const tableName = process.env.PLAYER_TABLE_NAME || 'BtcGuesserPlayerTable';
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const RESOLUTION_WINDOW_SECONDS = 60;

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

interface PlayerData {
  PlayerId: string;
  Score: number;
  ActiveGuess?: {
    initialPrice: number;
    direction: 'up' | 'down';
    timestamp: number;
  };
}

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const playerId = event.pathParameters?.playerId;

  if (!playerId) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: 'Missing playerId in path' }),
    };
  }

  try {
    const getPlayerCommand = new GetCommand({
      TableName: tableName,
      Key: { PlayerId: playerId },
    });
    const playerResult = await docClient.send(getPlayerCommand);
    let playerItem = playerResult.Item as PlayerData | undefined;

    let resolutionMessage: string | null = null;
    let scoreChange = 0;

    if (!playerItem) {
      const newPlayer: PlayerData = { PlayerId: playerId, Score: 0 };
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          playerId: playerId,
          score: 0,
          activeGuess: null,
          resolutionMessage: "Player not found, starting with score 0.",
        }),
      };
    }

    if (playerItem && playerItem.ActiveGuess) {
      const activeGuess = playerItem.ActiveGuess;
      const timeSinceGuessMs = Date.now() - activeGuess.timestamp;
      const timeSinceGuessSeconds = timeSinceGuessMs / 1000;

      console.log(`Player ${playerId}: Time since guess: ${timeSinceGuessSeconds}s`);

      if (timeSinceGuessSeconds >= RESOLUTION_WINDOW_SECONDS) {
        console.log(`Player ${playerId}: Guess is older than ${RESOLUTION_WINDOW_SECONDS}s. Attempting resolution.`);
        const currentPrice = await getCurrentBtcPrice();

        if (currentPrice === null) {
          console.warn(`Player ${playerId}: Could not fetch current price to resolve guess. Guess remains active.`);
        } else if (currentPrice !== activeGuess.initialPrice) {
          console.log(`Player ${playerId}: Current price ${currentPrice} differs from initial ${activeGuess.initialPrice}. Resolving.`);
          let correctGuess = false;
          if (activeGuess.direction === 'up' && currentPrice > activeGuess.initialPrice) {
            correctGuess = true;
          } else if (activeGuess.direction === 'down' && currentPrice < activeGuess.initialPrice) {
            correctGuess = true;
          }

          scoreChange = correctGuess ? 1 : -1;
          playerItem.Score += scoreChange;
          resolutionMessage = correctGuess
            ? `Correct! Price went from ${activeGuess.initialPrice} to ${currentPrice}. You gained 1 point.`
            : `Incorrect. Price went from ${activeGuess.initialPrice} to ${currentPrice}. You lost 1 point.`;

          console.log(`Player ${playerId}: Guess result - ${resolutionMessage}`);

          const updateCommand = new UpdateCommand({
            TableName: tableName,
            Key: { PlayerId: playerId },
            UpdateExpression: 'SET Score = :s REMOVE ActiveGuess',
            ExpressionAttributeValues: {
              ':s': playerItem.Score,
            },
            ReturnValues: 'UPDATED_NEW',
          });
          await docClient.send(updateCommand);
          playerItem.ActiveGuess = undefined;
        } else {
          console.log(`Player ${playerId}: Price ${currentPrice} is same as initial ${activeGuess.initialPrice}. Guess remains active.`);
        }
      } else {
        console.log(`Player ${playerId}: Guess is too recent (${timeSinceGuessSeconds}s). Not resolving yet.`);
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"
      },
      body: JSON.stringify({
        playerId: playerItem.PlayerId,
        score: playerItem.Score,
        activeGuess: playerItem.ActiveGuess || null,
        resolutionMessage: resolutionMessage,
        scoreChange: scoreChange
      }),
    };

  } catch (error: any) {
    console.error('Error getting player status or resolving guess:', error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: 'Failed to get player status.', error: error.message }),
    };
  }
};
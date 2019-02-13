# AWS Lambda Diablo III Discord Bot
A AWS Lambda powered Discord bot which tracks players on the leaderboard.
With [AWS CloudWatch](https://aws.amazon.com/cloudwatch/) this function can be configured to repeatedly (e.g. every 4 hours) fetch rift leaderboards and track your "Heroes" positions. 

E.g.:
```
Leaderboard stats from Mon, 28 Jan 2019 09:36:17 GMT

Leaderboard for rift barbarian:
* Anon#1234 at rank 140
* Anon#1244 not in list
```

**NOTE:** At the moment the leadboard is only searched by players' [BattleTags](https://eu.battle.net/support/en/article/75767). However it is possible to have multiple "Heros" in one rift leaderboard with the same [BattleTags](https://eu.battle.net/support/en/article/75767). This would cause only the first "Hero" to be found.

## Costs
Since this function requests the [Battle.net API](https://develop.battle.net/documentation) the runtime highly depends on the response time of the API.
You should definitely set a timout for your Lambda function (e.g. 3 seconds).

To be precise: 1 request is made to obtain an `access_token`. Additionally for each rift another request is made.

The [response JSON](https://develop.battle.net/documentation/api-reference/diablo-3-game-data-api) has a size of about ~500kb per leaderboard and needs to be parsed internally.

### Stats
Monitoring stats using 1 leaderboard for 1 player:
* execution time: ~1500 ms
* memory usage: ~50 MB

## Prerequisites
1. Follow the guide at https://develop.battle.net/documentation/guides/getting-started to create a Battle.net API Client.
    1. Obtain the **Client ID** and **Client Secret** from your newly created [client](https://develop.battle.net/access/)
2. Create a Webbhook for a channel in your Discord server
    1. Edit a channel you wish to be notified in
    2. Create a new "Webhook"
    3. Copy the **URL**

## Deployment
1. Create a new Lambda function either through the AWS Console or using the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html):
    ```
    $ aws cli lambda create-function \
        --function-name YOUR-FUNCTION-NAME \
        --runtime nodejs8.10 \
        --role YOUR-ROLE \
        --handler index.trackLeaderboard \
        --environment 'Variables={BATTLENET_CLIENT_ID=<YOUR-CLIENT-ID>,BATTLENET_CLIENT_SECRET=<YOUR-CLIENT-SECRET>,DISCORD_BOT_WEBHOOK_URL=<YOUR-WEBHOOK-URL>}'
    ```
2. Archive the lambda function and publish it:
    ```
    $ zip pkg.zip index.js
    $ aws lambda update-function-code \
        --function-name YOUR-FUNCTION-NAME \
        --zip-file pkg.zip
    ```
3. Create a CloudWatch Event Rule, add the lambda function as target and select "Constant (JSON text)" under "Configure input":
    ```json
    {
      "rifts": {
        "barbarian": [
          "Anon#1234"
        ]
      }
    }
    ```
    **WARNING:** Please note that [Battle.net API Clients](https://develop.battle.net/documentation/guides/getting-started) are limited to 36,000 requests per hour at a rate of 100 requests per second (see [Throttling](https://develop.battle.net/documentation/guides/getting-started)).

## API Documentation
### Environemnt variables
The lambda function uses the following environment variables which can be set in the ["Environment variables" section](https://docs.aws.amazon.com/lambda/latest/dg/env_variables.html):
* `BATTLENET_CLIENT_ID` Battle.net API Client ID
* `BATTLENET_CLIENT_SECRET` Battle.net API Client ID
* `BATTLENET_REGION` Battle.net region (default: `eu`)
* `BATTLENET_SEASON` Current season to track (default: `16`)
* `DISCORD_BOT_WEBHOOK_URL` The Discord Webhook URL to post leaderboard messages to
* `DISCORD_BOT_NAME` Name of the Discord bot, displayed in the channel (default: `Leaderboard BOT`)

### Input
The lambda function accepts the following input from an event payload:
```typescript
interface payload {
    rifts: { [riftName: string]: string[] }
}
```

For each `riftName` all given player [BattleTags](https://eu.battle.net/support/en/article/75767) will be searched in the rift leaderboard.

E.g:
```json
{
  "rifts": {
    "barbarian": [
      "Anon#1234",
      "Anon#4321"
    ],
    "wizard": [
      "Anon#1237"
    ]
  }
}
```

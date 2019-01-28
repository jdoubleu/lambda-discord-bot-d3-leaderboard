# AWS Lambda Diablo III Discord Bot
A AWS Lambda powered discord bot which tracks players on the leaderboard.

E.g.:
```
Leaderboard stats from Mon, 28 Jan 2019 09:36:17 GMT

Leaderboard for rift barbarian:
* Anon#1234 at rank 140
* Anon#1244 not in list
```

## Costs
Since this function requests the [Battle.net API](https://develop.battle.net/documentation) the runtime highly depends on the response time of the API.
You should definitely set a timout for your Lambda function (e.g. 3 seconds).

The [response JSON](https://develop.battle.net/documentation/api-reference/diablo-3-game-data-api) has a size of about ~500kb per leaderboard and needs to be parsed internally.

### Stats
Monitoring stats using 1 leaderboard for 1 player:
* execution time: ~1500 ms
* memory usage: ~50 MB

## Prerequisites
1. You need an [Battle.net API Access Token](https://develop.battle.net/access/) which you can obtain by creating a new App/Client
    1. Navigate to https://develop.battle.net/documentation/api-reference/diablo-3-game-data-api and open your browser's developer console
    2. Click the "Try it" button of any API endpoint
    3. Enter your App/Client's ID and Secret in the popup window and confirm
    4. You should be switched to page where you have to log in and grant the App access to your account; consent.
    5. You will be redirected back to the endpoint overview. A new network request will show up in the Networking Tab of the developer console (from `https://us.battle.net/oauth/token?grant_type=authorization_code&client_id=...&client_secret=...&redirect_uri=https://develop.battle.net/documentation/api-reference/diablo-3-game-data-api`)
    6. Get the `access_token` of the network request's response
2. Create a Webbhook for a channel in your Discord server
    1. Edit a channel you wish to be notified in
    2. Create a new "Webhook"
    3. Copy the URL

## Deployment
1. Create a new Lambda function either through the AWS Console or using the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html):
    ```
    $ aws cli lambda create-function \
        --function-name YOUR-FUNCTION-NAME \
        --runtime nodejs8.10 \
        --role YOUR-ROLE \
        --handler index.trackLeaderboard \
        --environment 'Variables={BATTLENET_API_ACCESS_TOKEN=<YOUR-ACCESS-TOKEN>,DISCORD_BOT_WEBHOOK_URL=<YOUR-WEBHOOK-URL>}'
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
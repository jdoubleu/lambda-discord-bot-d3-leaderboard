const https = require('https')
const url = require('url')

/**
 * Simple Battle.net API client to retrieve leaderboard
 * @see https://develop.battle.net/documentation/api-reference/diablo-3-game-data-api
 */
class BattlenetAPIClient {
    constructor(access_token) {
        this.access_token = access_token
    }

    _buildLeaderboardUrl(rift) {
        return `https://eu.api.blizzard.com/data/d3/season/16/leaderboard/rift-${rift}`
    }

    async fetchLeaderboard(rift) {
        return this._request(
            this._buildLeaderboardUrl(rift)
        )
    }

    async _request(baseUrl) {
        let url = baseUrl

        url += '?access_token=' + this.access_token

        return new Promise((resolve, reject) => {
            https.get(url, res => {
                res.setEncoding('utf8')
                let rawData = ''
                res.on('data', chunk => rawData += chunk)
                res.on('end', () => {
                    if (res.statusCode !== 200) {
                        const errMsg = `Error from Battle.net API!
                        Details (status code: ${res.statusCode}:
                        ${rawData}`

                        reject(new Error(errMsg))
                    } else {
                        resolve(rawData)
                    }
                })
            })
        }).then(raw => {
            return JSON.parse(raw)
        })
    }
}

/**
 * Reduces the leaderboard and returns only results for battle tags
 * Important: This function is not save when there are multiple heroes with the same battle tag
 *
 * @param {Array} leaderboard only the rows
 * @param {string[]} battleTags to find in leaderboard
 * @return {{}} players stats
 */
function findPlayersInLeaderboard(leaderboard, battleTags) {
    let remainingPlayers = battleTags
    const res = {}

    for (let row of leaderboard) {
        const heroBattleTag = row['player'][0]['data'][0]['string']

        let playerIndex
        if ((playerIndex = remainingPlayers.indexOf(heroBattleTag)) !== -1) {
            remainingPlayers.splice(playerIndex)

            res[heroBattleTag] = row['data']
        }

        if (remainingPlayers.length === 0) {
            break
        }
    }

    for (let player of remainingPlayers) {
        res[player] = false
    }

    return res
}

function formatMessage(rift, playerStats) {
    let output = `Leaderboard for rift ${rift}:`

    Object.entries(playerStats).forEach(([player, stats]) => {
        output += `\n* ${player}`

        if (!stats) {
            output += ' not in list'
        } else {
            const rank = stats[0]['number']
            output += ` at rank ${rank}`
        }
    })

    return output
}

class DiscordBot {
    constructor(name, webhookUrl) {
        this.name = name
        this.webhook = webhookUrl
    }

    _parseWebhookUrl() {
        return new url.URL(this.webhook)
    }

    _getRequestOptions() {
        const urlInfo = this._parseWebhookUrl()

        return {
            method: 'POST',
            hostname: urlInfo.hostname,
            path: urlInfo.pathname,
            headers: {
                'Content-Type': 'application/json'
            }
        }
    }

    _getRequestContent(msg) {
        const content = {
            username: this.name,
            content: msg
        }

        return JSON.stringify(content)
    }

    async sendMessage(msg) {
        return new Promise((resolve, reject) => {
            const req = https.request(this._getRequestOptions(), (res) => {
                if (res.statusCode !== 204) {
                    reject(new Error('Could not send message to Discord!'))
                }

                resolve(true)
            })

            req.on('error', e => {
                reject(new Error('Could not send message to Discord!\nDetails:\n' + e.message))
            })

            req.write(this._getRequestContent(msg))
            req.end()
        })
    }
}

async function trackLeaderboard(rifts) {
    const apiClient = new BattlenetAPIClient(process.env.BATTLENET_API_ACCESS_TOKEN)

    let msg = 'Leaderboard stats from ' + new Date().toUTCString()
    for (let rift in rifts) {
        let { row } = await apiClient.fetchLeaderboard(rift)
        let playerStats = findPlayersInLeaderboard(row, rifts[rift])

        msg += '\n\n' + formatMessage(rift, playerStats)
    }

    const bot = new DiscordBot(
        process.env.DISCORD_BOT_NAME || 'Leaderboard BOT',
        process.env.DISCORD_BOT_WEBHOOK_URL
    )

    await bot.sendMessage(msg)
}

exports.trackLeaderboard = async (event) => {
    const { rifts } = event

    await trackLeaderboard(rifts)
}

process.on('unhandledRejection', e => {
    throw new Error(e)
})

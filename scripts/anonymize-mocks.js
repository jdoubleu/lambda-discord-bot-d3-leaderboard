#!/usr/bin/env node
// Anonymize API response mocks
const fs = require('fs')
const path = require('path')

const mocksFolder = path.resolve(__dirname, '../__mocks__')

// 1. season-leaderboard
const d3mocks = path.resolve(mocksFolder, 'blizzard-api/diablo-3-game-data-api')
const slFile = path.resolve(d3mocks, 'season-leaderboard.json')
let sl = fs.readFileSync(slFile)
sl = JSON.parse(sl)

const date = new Date().getTime()
let counter = 1234
sl.row = sl.row.map(p => {
    const battleTag = 'Anon#' + counter

    let playerData = p['player'][0]['data']

    // HeroBattleTag
    playerData[0]['string'] = battleTag
    // GameAccount
    playerData[1]['number'] = 1e5 + counter
    // HeroId
    playerData[playerData.length - 1]['number'] = 1e6 + counter

    if (playerData[6]['id'] === 'HeroClanTag') {
        // HeroClanTag
        playerData[6]['string'] = 'ABC'
        // ClanName
        playerData[7]['string'] = 'ABClan'
    }

    playerData = p['data']

    // CompletedTime
    playerData[3]['timestamp'] = date + counter
    // BattleTag
    playerData[4]['string'] = battleTag

    counter++

    return p
})

sl = JSON.stringify(sl, null, 4)
fs.writeFileSync(slFile, sl)

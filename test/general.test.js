const rew = require('rewire')
const leaderboard = require('../__mocks__/blizzard-api/diablo-3-game-data-api/season-leaderboard.json').row

describe('internals', () => {
    const module = rew('../index.js')

    describe('#findPlayersInLeaderboard', () => {
        const subject = module.__get__('findPlayersInLeaderboard')
        const knownBattletags = ['Anon#1234', 'Anon#1256', 'Anon#1244']

        it('should return empty object when no battle tags provided', () => {
            const result = subject(leaderboard, [])

            expect(result).to.be.an('object').which.is.empty
        })

        it('should find one player in leaderboard', () => {
            const battleTag = knownBattletags[0]
            const result = subject(leaderboard, [battleTag])

            expect(result).to.have.property(battleTag).that.is.not.empty
        })

        it('should find multiple players in leaderboard', () => {
            const result = subject(leaderboard, knownBattletags)

            knownBattletags.forEach(battleTag => {
                expect(result).to.have.property(battleTag).that.is.not.empty
            })
        })

        it('should always return all players', () => {
            const players = ['1', '2', knownBattletags[1]]
            const result = subject(leaderboard, players)

            expect(Object.keys(result).length).to.equal(players.length)
        })

        it('should return "false" if player not found', () => {
            const player = '_unknown_'
            const result = subject(leaderboard, [player])

            expect(result).to.have.property(player).which.is.false
        })
    })

    describe('#formatMessage', () => {
        const subject = module.__get__('formatMessage')
        const riftName = 'SomeRift_Name'
        const players = {
            'some_player': [
                { number: 999 }
            ]
        }

        it('should include rift name', () => {
            const result = subject(riftName, {})

            expect(result).to.contain(riftName)
        })

        it('should include stats for players', () => {
            const result = subject(riftName, players)

            expect(result).to.contain('some_player')
        })

        it('should display player without a rank', () => {
            const result = subject(riftName, { 'other_player': false })

            expect(result).to.contain('other_player')
        })
    })
})

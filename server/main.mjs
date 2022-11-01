import { WebSocketServer } from "ws"
import { v4 as uuid } from 'uuid'
import * as grid from '../shared/grid.mjs'

const wss = new WebSocketServer({ port: 8090 })

/*
  MESSAGES

  {type: 'id', id: string}
  {type: 'request', id: string} // player id
  {type: 'accept', id: string} // player id
  {type: 'start', id: string} // game id
  {type: 'end', results: { id: score, id: score}}
  {type: 'card', card: string}


*/

const games = {}
const connections = {}
const requests = {}

const otherPlayer = (game, id) => {
  return game.players.filter(player => player !== id)[0]
}

wss.on('connection', (ws, req) => {
  const id = uuid()
  connections[id] = ws
  ws.send(JSON.stringify({type: 'id', id: id}))
  const ip = req.socket.remoteAddress
  console.log('connection from:', ip, 'assigned: ', id)

  ws.on('message', (data) => {
    const msg = JSON.parse(data)
    console.log('recv', msg)

    switch(msg.type) {
      case 'pong': {
        break;
      }
      case 'request': {
        // make sure the other player is connected
        if(!connections[msg.id]) {
          return
        }
    
        // make a request object
        requests[id] = {to: msg.id}
    
        // send a request
        connections[msg.id].send(JSON.stringify({type: 'request', id: id}))
        break;
      }
      case 'accept': {
        // make sure a request was sent
        if(!requests[msg.id] || requests[msg.id].to !== id) {
          return
        }
        
        // clean up the request
        delete requests[msg.id]

        // make a game object
        const game = {
          id: uuid(),
          players: [id, msg.id],
          initPlayer: msg.id,
          waitingForCard: false
        }
        games[game.id] = game
        // todo: shuffle decks and store

        // tell everyone the game is starting
        const out = JSON.stringify({type: 'start', id: game.id})
        ws.send(out)
        connections[msg.id].send(out)
        break;
      }
      case 'action': {
        const game = games[msg.gameId]
        if(game.waitingForCard) {
          // take both cards and combine with the board
          // then send the board to both players
          // {action: 'play', card: 'splattershot', special: 'true', x: 0, y: 3, turns: 1}
          const plays = {
            [id]: msg,
            [otherPlayer(game, id)]: game.otherCard
          }

          // make a copy of the grid
          // play the card on the copy


          // TODO: convert card + x + y into play (grid space) here
          // TODO: rotate their placement 180

          // todo: validate (only rotate firstplayer's card)
          // check for overlap
          // game.board = combineCards(game.board, cardA, cardB)

          // combine cards and board state

          // send out results
          // sends each player the other player's play rotated 180
          game.players.forEach(player => {
            connections[player].send(JSON.stringify({
              type: 'results',
              play: plays[otherPlayer(game, player)]
            }))
          })
          game.waitingForCard = false
          // todo: send card draw
        } else {
          // wait for the next card
          game.otherCard = msg
          game.waitingForCard = true
        }
        break;
      }
    }
  })

  ws.on('close', () => {
    delete connections[id]
    delete requests[id]
  })
})
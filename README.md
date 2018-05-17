This is a simple JS blockchain implementation based on [this tutorial](https://hackernoon.com/learn-blockchains-by-building-one-117428612f46)

1. Clone and run `yarn install` to install the dependencies
1. if you want to run `yarn start`, make sure you have `nodemon` installed globally, otherwise you can just run `yarn serve`
1. Run `yarn serve` to start a blockchain node instance
1. To have more than one instance, run it on different ports with a `PORT` env variable (ex. `PORT=3001 yarn serve`)
1. Interact with your nodes using the following routes

## Routes
- POST `/transactions/new` - creates a new transaction
  expected format:
  ```
    {
      "sender": "my address",
      "recipient": "someone else's address",
      "amount": 5
    }
  ```
- GET `/mine` - tell the server to mine a new block.
- GET `/chain` - returns the full blockchain.
- POST `/nodes/register` - accept a list of new nodes in the form of URLs.
  ```
    {
      "node": ["http://localhost:3001"],
    }
  ```
- GET `/nodes/resolve` - run the Consensus Algorithm, which resolves any conflicts to ensure a node has the correct chain.



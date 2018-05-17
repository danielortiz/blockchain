import express from 'express'
import Blockchain from './blockchain'
import bodyParser from 'body-parser'
import { isUndefined } from 'lodash'
import uuid from 'uuid/v4'

const blockchain = new Blockchain

const app = express()

const jsonParser = bodyParser.json()

const nodeIdentifier = uuid().replace('-', '')

app.get(
  '/mine',
  (req, res) => {
    const lastBlock = blockchain.lastBlock()
    const lastProof = lastBlock.proof
    const proof = blockchain.proofOfWork(lastProof)

    blockchain.newTransaction(0, nodeIdentifier, 1)

    const previousHash = blockchain.hash(lastBlock)
    const block = blockchain.newBlock(previousHash, proof)

    const response = {
      message: 'New Block Forged',
      index: block.index,
      transactions: block.transactions,
      proof: block.proof,
      previousHash: block.previousHash,
    }

    res.status(200).send(response)
  }
)

app.post(
  '/transactions/new',
  jsonParser,
  (req, res) => {
    const values = req.body

    // Check that the required fields are in the POST'ed data
    const required = ['sender', 'recipient', 'amount']
    if (
      required.some((requiredField) =>
        isUndefined(values[requiredField])
      )
    ) {
      res.status(400).send('Missing values')
      return
    }
    // Create a new Transaction
    const index = blockchain.newTransaction(values['sender'], values['recipient'], values['amount'])
    const response = {
      message: `Transaction will be added to Block ${index}`
    }

    res.status(201).send(response)
  }
)

app.get(
  '/chain',
  (req, res) => {
    const response = {
      chain: blockchain.chain,
      length: blockchain.length,
    }
    res.send(response)
  }
)


app.post(
  '/nodes/register',
  jsonParser,
  (req, res) => {
    const values = req.body
    const nodes = values.nodes
    if (!nodes) {
      res.status(400).send('Error: Please supply a valid list of nodes')
      return
    }
    nodes.forEach((node) => {
      blockchain.registerNode(node)
    })
    const response = {
      message: 'New nodes have been added',
      totalNodes: blockchain.nodes.value.length,
    }
    res.status(201).send(response)
  }
)

app.get(
  '/nodes/resolve',
  (req, res) => {
    const replaced = blockchain.resolveConflicts()
    res.status(200).send({
      message: replaced ? 'Our chain was replaced' : 'Our chain is authoritative',
      [replaced ? 'newChain' : 'chain']: blockchain.chain
    })
  }
)
const port = process.env.PORT || 3000
app.listen(port, () => console.log(`Blockchain app listening on port ${port}!`))

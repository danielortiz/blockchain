import sortKeys from 'sort-keys'
import shajs from 'sha.js'
import request from 'sync-request'
import urlParse from 'url-parse'
import { uniq } from 'lodash'

class Blockchain {
  chain = []
  currentTransactions = []
  nodes = {
    add: (val) => {
      this.nodes.value = uniq([...this.nodes.value, val])
      return this.nodes.value
    },
    value: [],
  }

  constructor() {
    // Create the genesis block
    this.newBlock(1, 100)
  }
  /**
   * Create a new Block in the Blockchain
   *
   * @param {number} proof - The proof given by the Proof of Work algorithm
   * @param {string} previousHash - Hash of previous Block
   *
   * @returns {object} new block
   */
  newBlock = (previousHash, proof = null) => {
    const block = {
      index: this.chain.length + 1,
      timestamp: (new Date()).getTime(),
      transactions: this.currentTransactions,
      proof,
      previousHash: previousHash || this.hash(this.chain[this.chain.length - 1]),
    }
    // Reset the current list of transactions

    this.currentTransactions = []
    this.chain.push(block)
    return block
  }
  /*
   * adds a transaction to the list,
   * it returns the index of the block
   * which the transaction will be added
   * to—the next one to be mined
  */
  newTransaction = (sender, recipient, amount) => {
    this.currentTransactions.push({
      sender,
      recipient,
      amount
    })
    return this.lastBlock().index + 1
  }
  /**
   * Creates a SHA-256 hash of a Block
   *
   * @param {object} Block
   *
   * @returns {string} Block hash
   */
  hash = (block) => {
    // We must make sure that the Dictionary is Ordered, or we'll have inconsistent hashes
    const blockString = JSON.stringify(sortKeys(block))

    return shajs('sha256').update(blockString).digest('hex')
  }

  lastBlock = () => {
    return this.chain[this.chain.length - 1]
  }

  /**
   * Simple Proof of Work Algorithm:
   * - Find a number p' such that hash(pp') contains leading 4 zeroes, where p is the previous p'
   * - p is the previous proof, and p' is the new proof
   * @param {number} lastProof
   * @return {number} proof
   */
  proofOfWork = (lastProof) => {


    let proof = 0
    while (this.validProof(lastProof, proof) === false) {
      proof++
    }
    return proof
  }

  validProof = (lastProof, proof) => {
    const guess = encodeURI(`${lastProof}${proof}`)
    const guessHash = shajs('sha256').update(guess).digest('hex')
    return guessHash.slice(0, 4) === '0000'
  }

  validChain = (chain) => {
    let lastBlock = chain[0]
    let currentIndex = 1

    while (currentIndex < chain.length) {
      // Check that the hash of the block is correct
      const block = chain[currentIndex]
      if (block.previousHash !== this.hash(lastBlock)) {
        return false
      }

      // Check that the Proof of Work is correct
      if (this.validProof(lastBlock.proof, block.proof) === false) {
        return false
      }
      lastBlock = block
      currentIndex++
    }
    return true
  }
  /**
   * This is our Consensus Algorithm, it resolves conflicts
   * by replacing our chain with the longest one in the network.
   * @returns {bool} True if our chain was replaced, False if not
   */

  resolveConflicts = () => {
    const neighbours = this.nodes.value
    let newChain = null
    let maxLength = this.chain.length
    neighbours.forEach((node) => {
      const response = JSON.parse(request('GET', `http://${node}/chain`).getBody('utf8'))
      if (response) {
        const length = response.chain.length
        const chain = response.chain
        console.log(length, chain)
        if (length > maxLength && this.validChain(chain)) {
          maxLength = length
          newChain = chain
        }
      }
    })

    if (newChain) {
      this.chain = newChain
      return true
    }
    return false
  }
  /**
   * Add a new node to the list of nodes
   * @param {string} address Address of node. Eg. 'http://192.168.0.5:5000'
   */
  registerNode(address) {
    const parsedUrl = urlParse(address, true)
    this.nodes.add(parsedUrl.host)
  }
}

export default Blockchain

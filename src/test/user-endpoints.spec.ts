export {}
const chai = require('chai')
const chaiHttp = require('chai-http')
import { GraphQLServer } from 'graphql-yoga'
const { server } = require('../server')
const gql = require('graphql-tag')

let app: GraphQLServer

const { expect } = chai
chai.use(chaiHttp)

before(async () => {
  app = await server
})

describe('User Endpoints', () => {
  it('fetches logged in user profile', async () => {
    const res = await chai
      .request(app)
      .post('/')
      .set('Cookie', "token=" + process.env.ADMIN_TOKEN)
      .send({ query: '{ me { username }}' })
    expect(res).to.have.status(200)
    expect(res.body.data.me.username).to.exist
  })
  it('fetches list of users', async () => {
    const res = await chai
      .request(app)
      .post('/')
      .set('Cookie', "token=" + process.env.ADMIN_TOKEN)
      .send({ query: '{ users { username }}' })
    expect(res).to.have.status(200)
    expect(res.body.data.users).to.be.an('array')
  })
})

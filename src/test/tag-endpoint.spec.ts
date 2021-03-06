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

describe('Tag Endpoints', () => {
  // SERVER TAGS

  it('non logged in users can view server tags', async () => {
    const res = await chai.request(app).post('/').send({
      query: `query{ server(id: 1) { title, tags { tagName } } }`,
    })
    expect(res).to.have.status(200)
    expect(res.body.data.server.tags[0].tagName).to.be.a('string', 'test')
  })

  it('logged in users can view server tags', async () => {
    const res = await chai
      .request(app)
      .post('/')
      .set('Cookie', 'token=' + process.env.USER_TOKEN)
      .send({
        query: `query{ server(id: 1) { title, tags { tagName } } }`,
      })
    expect(res).to.have.status(200)
    expect(res.body.data.server.tags[0].tagName).to.be.a('string', 'test')
  })

  it('non logged in users can view server authors from feed', async () => {
    const res = await chai.request(app).post('/').send({
      query: `query{ feed { title, tags { tagName } } }`,
    })
    expect(res).to.have.status(200)
    expect(res.body.data.feed[0].tags[0].tagName).to.be.a('string', 'test')
  })

  it('logged in users can view server authors from feed', async () => {
    const res = await chai
      .request(app)
      .post('/')
      .set('Cookie', 'token=' + process.env.USER_TOKEN)
      .send({
        query: `query{ feed { title, tags { tagName } } }`,
      })
    expect(res).to.have.status(200)
    expect(res.body.data.feed[0].tags[0].tagName).to.be.a('string', 'Guru')
  })
  it('tag search query works', async () => {
    const res = await chai
      .request(app)
      .post('/')
      .set('Cookie', 'token=' + process.env.USER_TOKEN)
      .send({
        query: `query { searchTags (searchString: "") { id } }`,
      })
    expect(res).to.have.status(200)
    expect(res.body.data.searchTags).to.be.an('array')
  })

  it('tag search query works with search string', async () => {
    const res = await chai
      .request(app)
      .post('/')
      .set('Cookie', 'token=' + process.env.USER_TOKEN)
      .send({
        query: `query { searchTags (searchString: "test") { id } }`,
      })
    expect(res).to.have.status(200)
    expect(res.body.data.searchTags).to.be.an('array')
  })
})

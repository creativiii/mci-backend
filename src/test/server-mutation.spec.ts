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

describe('Server mutations', () => {
  it('users can post servers', async () => {
    const res = await chai
      .request(app)
      .post('/')
      .set('Cookie', 'token=' + process.env.USER_TOKEN)
      .send({
        query: `
          mutation {
              createServer(title: "test server 4", content: "A description of the server that contains at least 200 characters, I do realise that is quite a lot but we might as well ask for a decent description rather than leaving it being shit. This is still not enough which is honestly quite surprising as I really did think it was going to be 200 characters", cover: "https://via.placeholder.com/350x150.jpg", tags: ["test", "test2"], ip: "eu.mineplex.com") {
                  title
              }
          }
          `,
      })
    expect(res).to.have.status(200)
    expect(res.body.data.createServer.title).to.exist
  })
  it("banned users can't post servers", async () => {
    const res = await chai
      .request(app)
      .post('/')
      .set('Cookie', 'token=' + process.env.BANNED_TOKEN)
      .send({
        query: `
          mutation {
              createServer(title: "test server 4", content: "A description of the server that contains at least 200 characters, I do realise that is quite a lot but we might as well ask for a decent description rather than leaving it being shit. This is still not enough which is honestly quite surprising as I really did think it was going to be 200 characters", cover: "https://via.placeholder.com/350x150.jpg", tags: ["test", "test2"], ip: "eu.mineplex.com") {
                  title
              }
          }
          `,
      })
    expect(res).to.have.status(401)
  })
  it("user can't edit servers it doesn't own", async () => {
    const res = await chai
      .request(app)
      .post('/')
      .set('token', process.env.USER_TOKEN)
      .send({
        query: `
          mutation{
            updateTitle(id: 2, title: "A title that's a little longer than before") {
              title
            }
          }
        `,
      })
    expect(res).to.have.status(401)
    expect(res.body.errors).to.be.an('array')
    expect(res.body.errors[0].message).to.be.a('string', 'Not Authorised!')
  })
  it("banned user can't edit servers it owns", async () => {
    const res = await chai
      .request(app)
      .post('/')
      .set('token', process.env.BANNED_TOKEN)
      .send({
        query: `
          mutation{
            updateTitle(id: 3, title: "A title that's a little longer than before") {
              title
            }
          }
        `,
      })
    expect(res).to.have.status(401)
    expect(res.body.errors).to.be.an('array')
    expect(res.body.errors[0].message).to.be.a('string', 'Not Authorised!')
  })
  it('Can create server with new version', async () => {
    const res = await chai
      .request(app)
      .post('/')
      .set('Cookie', 'token=' + process.env.USER_TOKEN)
      .send({
        query: `
          mutation {
            createServer(title: "test server 3", content: "A description of the server that contains at least 200 characters, I do realise that is quite a lot but we might as well ask for a decent description rather than leaving it being shit. This is still not enough which is honestly quite surprising as I really did think it was going to be 200 characters", cover: "https://via.placeholder.com/350x150.jpg", tags: ["test", "test2"], ip: "server.mcs.gg") {
              version {
                versionName
              }
            }
          }        
        `,
      })
    expect(res).to.have.status(200)
    expect(res.body.data.createServer.version.versionName).to.be.a('string')
  })
  it('Can create server with new tags', async () => {
    const res = await chai
      .request(app)
      .post('/')
      .set('Cookie', 'token=' + process.env.USER_TOKEN)
      .send({
        query: `
          mutation {
            createServer(title: "test server 3", content: "A description of the server that contains at least 200 characters, I do realise that is quite a lot but we might as well ask for a decent description rather than leaving it being shit. This is still not enough which is honestly quite surprising as I really did think it was going to be 200 characters", cover: "https://via.placeholder.com/350x150.jpg", tags: ["a new tag", "something else here"], ip: "server.mcs.gg") {
              tags {
                tagName
              }
            }
          }        
        `,
      })
    expect(res).to.have.status(200)
    expect(res.body.data.createServer.tags).to.have.deep.members([
      {
        tagName: 'a new tag',
      },
      {
        tagName: 'something else here',
      },
    ])
  })
})

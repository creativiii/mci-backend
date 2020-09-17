import { rule, shield, and, or } from 'graphql-shield'
import { getUserId, getUserRole } from '../utils'

const rules = {
  isAuthenticatedUser: rule()(async (parent, args, context) => {
    const userId = getUserId(context)
    const user = await context.prisma.user.findOne({
      where: {
        id: Number(userId),
      },
    })
    console.log(
      'is authenticated and unbanned',
      Boolean(userId) && !user.banned,
    )
    return Boolean(userId) && !user.banned
  }),
  isPostOwner: rule()(async (parent, { id }, context) => {
    const userId = getUserId(context)
    const author = await context.prisma.post
      .findOne({
        where: {
          id: Number(id),
        },
      })
      .author()
    return userId === author.id
  }),
  isServerOwner: rule()(async (parent, { id }, context) => {
    const userId = getUserId(context)
    const author = await context.prisma.server
      .findOne({
        where: {
          id: Number(id),
        },
      })
      .author()
    console.log('is server owner', userId === author.id)
    return userId === author.id
  }),
  isMod: rule()(async (parent, { id }, context) => {
    const userId = getUserId(context)
    const user = await context.prisma.user.findOne({
      where: {
        id: Number(userId),
      },
    })
    console.log('is mod or admin', user.role === 'admin' || user.role === 'mod')
    return user.role === 'admin' || user.role === 'mod'
  }),
  isAdmin: rule()(async (parent, { id }, context) => {
    const userId = getUserId(context)
    const user = await context.prisma.user.findOne({
      where: {
        id: Number(userId),
      },
    })
    console.log('is admin', user.role === 'admin')
    return user.role === 'admin'
  }),
}

// Being admin or mod takes precedence over being banned or not
export const permissions = shield({
  Query: {
    me: rules.isAuthenticatedUser,
    filterPosts: rules.isAuthenticatedUser,
    post: rules.isAuthenticatedUser,
  },
  Mutation: {
    // User Permissions
    updateRole: rules.isAdmin,
    updateBan: rules.isMod,
    // Servers Permissions
    createServer: rules.isAuthenticatedUser,
    updateTitle: or(
      rules.isMod,
      and(rules.isAuthenticatedUser, rules.isServerOwner),
    ),
    addTag: or(
      rules.isMod,
      and(rules.isAuthenticatedUser, rules.isServerOwner),
    ),
    removeTag: or(
      rules.isMod,
      and(rules.isAuthenticatedUser, rules.isServerOwner),
    ),
    updateCover: or(
      rules.isMod,
      and(rules.isAuthenticatedUser, rules.isServerOwner),
    ),
    updateIp: or(
      rules.isMod,
      and(rules.isAuthenticatedUser, rules.isServerOwner),
    ),
    updateRemoteInfo: or(
      rules.isMod,
      and(rules.isAuthenticatedUser, rules.isServerOwner),
    ),
    deleteServer: or(
      rules.isMod,
      and(rules.isAuthenticatedUser, rules.isServerOwner),
    ),
    publish: or(
      rules.isMod,
      and(rules.isAuthenticatedUser, rules.isServerOwner),
    ),
  },
})

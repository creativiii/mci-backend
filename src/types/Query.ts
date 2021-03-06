import { intArg, nonNull, nullable, queryType, stringArg } from 'nexus'
import { getDates, getUserId } from '../utils'

export const Query = queryType({
  definition(t) {
    t.field('me', {
      type: 'User',
      resolve: (parent, args, ctx) => {
        const userId = getUserId(ctx)
        return ctx.prisma.user.findUnique({
          where: {
            id: Number(userId),
          },
        })
      },
    })

    t.list.field('users', {
      type: 'User',
      resolve: (parent, args, ctx) => {
        return ctx.prisma.user.findMany()
      },
    })

    t.list.field('allServers', {
      type: 'Server',
      resolve: (parent, args, ctx) => {
        return ctx.prisma.server.findMany()
      },
    })

    t.list.field('feed', {
      type: 'Server',
      args: {
        date: nonNull(stringArg({ default: new Date().toISOString() })),
        page: nonNull(intArg({ default: 0 })),
      },
      resolve: (parent, { date, page }, ctx) => {
        const pageLimit = 10
        const [d, f] = getDates(date)

        let userId
        try {
          userId = getUserId(ctx, true)
        } catch (error) {}

        if (userId) {
          return ctx.prisma.$queryRaw`
                SELECT DISTINCT
                    s.id
                ,   s.title
                ,   s.content
                ,   s.ip
                ,   s."lastUpdated"
                ,   s.cover
                ,   s.slots
                ,   s."createdAt"
                ,   a."authorObj"::jsonb
                ,   COALESCE(v."VOTES", 0) AS "voteCount" 
                ,   CASE WHEN uv."serverId" IS NULL THEN 1 ELSE 0 END AS
                "canVote"
                ,   tag."tagsArray"::jsonb
                FROM "Server" AS s
                    -- Get tags
                    INNER JOIN
                    (
                        SELECT
                            st."A"
                        ,   json_agg(
                                json_build_object(
                                    'id', 
                                    t.id, 
                                    'tagName', 
                                    t."tagName"
                                )
                            ) as "tagsArray"
                        FROM
                            "_ServerToTag" AS st
                        INNER JOIN
                            "Tag" AS t
                        ON
                            t.id = st."B"
                        GROUP BY
                            st."A"
                    ) AS tag
                    ON
                        tag."A" = s.id
                    -- Build the author objects
                    INNER JOIN
                    (
                        SELECT
                            id
                        ,   json_build_object(
                                'username', u.username,
                                'id', u.id,
                                'photoUrl', u."photoUrl"
                            ) AS "authorObj"
                        FROM
                            "User" as u
                    ) AS a
                    ON
                        a.id = s."authorId"
                    LEFT JOIN 
                    (
                        SELECT
                            "serverId"
                        ,   COUNT(DISTINCT v."authorId") AS "VOTES" 
                        FROM 
                            "Vote" as v 
                        WHERE 
                            v."createdAt" >= ${d} AND 
                            v."createdAt" < ${f} 
                        GROUP BY "serverId"
                    ) as v 
                    ON 
                        s.id = v."serverId"
                    -- Get the current user's votes in this period
                    LEFT JOIN
                    (
                        SELECT DISTINCT
                            "serverId"
                        FROM
                            "Vote"
                        WHERE
                            "createdAt" >= ${d}
                        AND
                            "createdAt" <  ${f}
                        AND
                            "authorId" = ${userId}
                    ) AS uv
                    ON
                        v."serverId" = s.id
                ORDER BY
                    "voteCount" DESC, s."lastUpdated" DESC
                OFFSET ${page > 10 ? pageLimit * 25 : page} LIMIT 25;
            `
        } else {
          ctx.res.status(200)
          return ctx.prisma.$queryRaw`
                SELECT 
                    s.id
                ,   s.title
                ,   s.content
                ,   s.ip
                ,   s."lastUpdated"
                ,   s.cover
                ,   s.slots
                ,   s."createdAt"
                ,   a."authorObj"::jsonb
                ,   COALESCE(v."VOTES", 0) AS "voteCount" 
                ,   0 AS "canVote"
                ,   tag."tagsArray"::jsonb
                FROM "Server" AS s
                    -- Get tags
                    INNER JOIN
                    (
                        SELECT
                            st."A"
                        ,   json_agg(
                                json_build_object(
                                    'id', 
                                    t.id, 
                                    'tagName', 
                                    t."tagName"
                                )
                            ) as "tagsArray"
                        FROM
                            "_ServerToTag" AS st
                        INNER JOIN
                            "Tag" AS t
                        ON
                            t.id = st."B"
                        GROUP BY
                            st."A"
                    ) AS tag
                    ON
                        tag."A" = s.id
                    -- Build the author objects
                    INNER JOIN
                    (
                        SELECT
                            id
                        ,   json_build_object(
                                'username', u.username,
                                'id', u.id,
                                'photoUrl', u."photoUrl"
                            ) AS "authorObj"
                        FROM
                            "User" as u
                    ) AS a
                    ON
                        a.id = s."authorId"
                    LEFT JOIN 
                    (
                        SELECT 
                            "serverId"
                        ,   COUNT(*) AS "VOTES" 
                        FROM 
                            "Vote" as v 
                        WHERE 
                            v."createdAt" >= ${d} AND 
                            v."createdAt" < ${f} 
                        GROUP BY "serverId"
                    ) as v 
                    ON 
                        s.id = v."serverId"
                ORDER BY
                    "voteCount" DESC, s."lastUpdated" DESC
                OFFSET ${page > 10 ? pageLimit * 25 : page} LIMIT 25;
            `
        }
      },
    })

    t.list.field('searchServers', {
      type: 'Server',
      args: {
        date: nonNull(stringArg({ default: new Date().toISOString() })),
        searchString: nullable(stringArg()),
        page: nonNull(intArg({ default: 0 })),
      },
      resolve: async (parent, { searchString, date, page }, ctx) => {
        const [d, f] = getDates(date)
        const pageLimit = 10
        return await ctx.prisma
          .$queryRaw`SELECT s.id, s.title, s.cover, s."createdAt", s.content, s.slots, s.cover, sum(case WHEN v."createdAt" >= ${d} AND v."createdAt" < ${f}
          THEN 1 ELSE 0 END ) AS "voteCount", CASE WHEN EXISTS 
          (SELECT v.id FROM "Vote" AS v WHERE v."createdAt" >= '2020-09-01' AND v."createdAt" <= '2020-10-01' AND v."authorId" = 6667)
            THEN 1 
            ELSE 0 
            END as "hasVoted",
            json_agg(json_build_object('id', t.id, 'tagName', t."tagName")) as "tags",
          json_build_object('username', u.username, 'id', u.id, 'photoUrl', u."photoUrl") AS "author" 
        FROM "Server" AS s 
          LEFT JOIN "User" u ON (s."authorId" = u.id) 
          LEFT JOIN "Vote" AS v ON (s.id = "serverId") 
          LEFT JOIN "_ServerToTag" st ON (s.id = st."A") 
          LEFT JOIN "Tag" t ON (st."B" = t.id)
        WHERE title LIKE ${'%' + searchString + '%'} OR content LIKE ${
          '%' + searchString + '%'
        } 
        GROUP BY s.id, u.id 
        ORDER BY "voteCount" DESC
        OFFSET ${page > 10 ? pageLimit * 25 : page} LIMIT 25;`
      },
    })

    t.field('server', {
      type: 'Server',
      args: {
        id: nullable(intArg()),
        date: nonNull(stringArg({ default: new Date().toISOString() })),
      },
      resolve: async (parent, { id, date }, ctx) => {
        const [d, f] = getDates(date)

        let userId
        try {
          userId = getUserId(ctx, true)
        } catch (error) {
          ctx.res.status(200)
        }

        let servers

        if (userId) {
          servers = await ctx.prisma.$queryRaw`
            SELECT 
                s.id
            ,   s.title
            ,   s.content
            ,   s.cover
            ,   s."lastUpdated"
            ,   s.ip
            ,   s.slots
            ,   s."createdAt"
            ,   a."authorObj"::jsonb
            ,   COALESCE(v."VOTES", 0) AS "voteCount" 
            ,   CASE WHEN uv."serverId" IS NULL THEN 1 ELSE 0 END AS
            "canVote"
            ,   tag."tagsArray"::jsonb
            FROM "Server" AS s
                -- Get tags
                INNER JOIN
                (
                    SELECT
                        st."A"
                    ,   json_agg(
                            json_build_object(
                                'id', 
                                t.id, 
                                'tagName', 
                                t."tagName"
                            )
                        ) as "tagsArray"
                    FROM
                        "_ServerToTag" AS st
                    INNER JOIN
                        "Tag" AS t
                    ON
                        t.id = st."B"
                    GROUP BY
                        st."A"
                ) AS tag
                ON
                    tag."A" = s.id
                -- Build the author objects
                INNER JOIN
                (
                    SELECT
                        id
                    ,   json_build_object(
                            'username', u.username,
                            'id', u.id,
                            'photoUrl', u."photoUrl"
                        ) AS "authorObj"
                    FROM
                        "User" as u
                ) AS a
                ON
                    a.id = s."authorId"
                LEFT JOIN 
                (
                    SELECT 
                        "serverId"
                    ,   COUNT(*) AS "VOTES" 
                    FROM 
                        "Vote" as v 
                    WHERE 
                        v."createdAt" >= ${d} AND 
                        v."createdAt" < ${f} 
                    GROUP BY "serverId"
                ) as v 
                ON 
                    s.id = v."serverId"
                -- Get the current user's votes in this period
                LEFT JOIN
                (
                    SELECT DISTINCT
                        "serverId"
                    FROM
                        "Vote"
                    WHERE
                        "createdAt" >= ${d}
                    AND
                        "createdAt" <  ${f}
                    AND
                        "authorId" = ${userId}
                ) AS uv
                ON
                    v."serverId" = s.id
                WHERE 
                    s.id = ${id}
                LIMIT 1;
                ;`
        } else {
          servers = await ctx.prisma.$queryRaw`
            SELECT 
                s.id
            ,   s.title
            ,   s.content
            ,   s.ip
            ,   s."lastUpdated"
            ,   s.cover
            ,   s.slots
            ,   s."createdAt"
            ,   a."authorObj"::jsonb
            ,   COALESCE(v."VOTES", 0) AS "voteCount" 
            ,   false AS "canVote"
            ,   tag."tagsArray"::jsonb
            FROM "Server" AS s
                -- Get tags
                INNER JOIN
                (
                    SELECT
                        st."A"
                    ,   json_agg(
                            json_build_object(
                                'id', 
                                t.id, 
                                'tagName', 
                                t."tagName"
                            )
                        ) as "tagsArray"
                    FROM
                        "_ServerToTag" AS st
                    INNER JOIN
                        "Tag" AS t
                    ON
                        t.id = st."B"
                    GROUP BY
                        st."A"
                ) AS tag
                ON
                    tag."A" = s.id
                -- Build the author objects
                INNER JOIN
                (
                    SELECT
                        id
                    ,   json_build_object(
                            'username', u.username,
                            'id', u.id,
                            'photoUrl', u."photoUrl"
                        ) AS "authorObj"
                    FROM
                        "User" as u
                ) AS a
                ON
                    a.id = s."authorId"
                LEFT JOIN 
                (
                    SELECT 
                        "serverId"
                    ,   COUNT(*) AS "VOTES" 
                    FROM 
                        "Vote" as v 
                    WHERE 
                        v."createdAt" >= ${d} AND 
                        v."createdAt" < ${f} 
                    GROUP BY "serverId"
                ) as v 
                ON 
                    s.id = v."serverId"
                WHERE 
                    s.id = ${id}
                LIMIT 1;`
        }
        return servers[0]
      },
    })

    t.list.field('searchTags', {
      type: 'Tag',
      args: {
        searchString: nonNull(stringArg()),
      },
      resolve: async (parent, { searchString }, ctx) => {
        return await ctx.prisma.$queryRaw`
                SELECT 
                    t.id
                ,   t."tagName"
                ,   COALESCE(tag."TAGS", 0) AS popularity
                FROM 
                    "Tag" as t 
                INNER JOIN
                (
                    SELECT
                        st."B"
                    ,   COUNT(*) AS "TAGS"    
                    FROM
                        "_ServerToTag" AS st
                    INNER JOIN
                        "Server" AS s
                    ON
                        s.id = st."A"
                    GROUP BY
                        st."B"
                ) AS tag
                ON
                    tag."B" = t.id
                WHERE 
                    t."tagName" 
                LIKE 
                    ${'%' + searchString + '%'}
                ORDER BY
                    popularity DESC
                LIMIT 
                    10
                ;
            `
      },
    })
  },
})

# Migration `20200917201433-initial-migration`

This migration has been generated by Leonardo Petrucci at 9/17/2020, 9:14:33 PM.
You can check out the [state of the schema](./schema.prisma) after the migration.

## Database Steps

```sql
CREATE TABLE "public"."Server" (
"id" SERIAL,
"title" text   NOT NULL ,
"content" text   ,
"published" boolean   NOT NULL DEFAULT false,
"cover" text   ,
"slots" integer   NOT NULL ,
"ip" text   NOT NULL DEFAULT E'',
"authorId" integer   NOT NULL ,
"versionId" integer   NOT NULL ,
PRIMARY KEY ("id")
)

CREATE TABLE "public"."User" (
"id" integer   NOT NULL ,
"email" text   NOT NULL ,
"username" text   NOT NULL ,
"role" text   NOT NULL ,
"photoUrl" text   NOT NULL DEFAULT E'',
"posts" integer   NOT NULL DEFAULT 0,
"banned" boolean   NOT NULL DEFAULT false,
PRIMARY KEY ("id")
)

CREATE TABLE "public"."Tag" (
"id" SERIAL,
"tagName" text   NOT NULL ,
PRIMARY KEY ("id")
)

CREATE TABLE "public"."Vote" (
"id" SERIAL,
"authorId" integer   NOT NULL ,
"serverId" integer   NOT NULL ,
PRIMARY KEY ("id")
)

CREATE TABLE "public"."Version" (
"id" SERIAL,
"versionName" text   NOT NULL ,
PRIMARY KEY ("id")
)

CREATE TABLE "public"."_ServerToTag" (
"A" integer   NOT NULL ,
"B" integer   NOT NULL 
)

CREATE UNIQUE INDEX "User.email_unique" ON "public"."User"("email")

CREATE UNIQUE INDEX "Tag.tagName_unique" ON "public"."Tag"("tagName")

CREATE UNIQUE INDEX "Version.versionName_unique" ON "public"."Version"("versionName")

CREATE UNIQUE INDEX "_ServerToTag_AB_unique" ON "public"."_ServerToTag"("A", "B")

CREATE INDEX "_ServerToTag_B_index" ON "public"."_ServerToTag"("B")

ALTER TABLE "public"."Server" ADD FOREIGN KEY ("authorId")REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE

ALTER TABLE "public"."Server" ADD FOREIGN KEY ("versionId")REFERENCES "public"."Version"("id") ON DELETE CASCADE ON UPDATE CASCADE

ALTER TABLE "public"."Vote" ADD FOREIGN KEY ("authorId")REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE

ALTER TABLE "public"."Vote" ADD FOREIGN KEY ("serverId")REFERENCES "public"."Server"("id") ON DELETE CASCADE ON UPDATE CASCADE

ALTER TABLE "public"."_ServerToTag" ADD FOREIGN KEY ("A")REFERENCES "public"."Server"("id") ON DELETE CASCADE ON UPDATE CASCADE

ALTER TABLE "public"."_ServerToTag" ADD FOREIGN KEY ("B")REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE
```

## Changes

```diff
diff --git schema.prisma schema.prisma
migration ..20200917201433-initial-migration
--- datamodel.dml
+++ datamodel.dml
@@ -1,0 +1,56 @@
+generator client {
+  provider = "prisma-client-js"
+}
+
+datasource db {
+  provider = ["postgres", "sqlite"]
+  url = "***"
+}
+
+model Server {
+  id        Int     @default(autoincrement()) @id
+  title     String
+  content   String?
+  published Boolean @default(false)
+  cover     String?
+  slots     Int
+  ip        String  @default("")
+  author    User    @relation(fields: [authorId], references: [id])
+  authorId  Int
+  version   Version @relation(fields: [versionId], references: [id])
+  versionId Int
+  tags      Tag[]
+  votes     Vote[]
+}
+
+model User {
+  id       Int      @id
+  email    String   @unique
+  username String
+  role     String
+  photoUrl String   @default("")
+  posts    Int      @default(0)
+  banned   Boolean  @default(false)
+  Votes    Vote[]
+  Servers  Server[]
+}
+
+model Tag {
+  id      Int      @default(autoincrement()) @id
+  tagName String   @unique
+  Servers Server[]
+}
+
+model Vote {
+  id       Int    @default(autoincrement()) @id
+  authorId Int
+  serverId Int
+  author   User   @relation(fields: [authorId], references: [id])
+  server   Server @relation(fields: [serverId], references: [id])
+}
+
+model Version {
+  id          Int      @default(autoincrement()) @id
+  versionName String   @unique
+  Servers     Server[]
+}
```


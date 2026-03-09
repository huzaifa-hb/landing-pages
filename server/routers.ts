import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { folders, templates, tags, templateTags } from "../drizzle/schema";

const folderRouter = router({
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(folders).orderBy(folders.name);
  }),

  create: publicProcedure
    .input(z.object({ name: z.string().min(1).max(255), parentId: z.number().nullable().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const result = await db.insert(folders).values({
        name: input.name,
        parentId: input.parentId ?? null,
      });
      return { id: Number(result[0].insertId), name: input.name, parentId: input.parentId ?? null };
    }),

  rename: publicProcedure
    .input(z.object({ id: z.number(), name: z.string().min(1).max(255) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(folders).set({ name: input.name }).where(eq(folders.id, input.id));
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(templates).set({ folderId: null }).where(eq(templates.folderId, input.id));
      await db.update(folders).set({ parentId: null }).where(eq(folders.parentId, input.id));
      await db.delete(folders).where(eq(folders.id, input.id));
      return { success: true };
    }),
});

const tagRouter = router({
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(tags).orderBy(tags.name);
  }),

  create: publicProcedure
    .input(z.object({ name: z.string().min(1).max(100), color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const result = await db.insert(tags).values({
        name: input.name,
        color: input.color ?? "#6366f1",
      });
      return { id: Number(result[0].insertId), name: input.name, color: input.color ?? "#6366f1", createdAt: new Date() };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(templateTags).where(eq(templateTags.tagId, input.id));
      await db.delete(tags).where(eq(tags.id, input.id));
      return { success: true };
    }),
});

const templateRouter = router({
  list: publicProcedure
    .input(z.object({
      folderId: z.number().nullable().optional(),
      tagId: z.number().optional(),
      search: z.string().optional(),
      all: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      let rows = await db.select().from(templates).orderBy(templates.updatedAt);

      if (!input.all) {
        if (input.folderId === null || input.folderId === undefined) {
          rows = rows.filter(t => t.folderId === null);
        } else {
          rows = rows.filter(t => t.folderId === input.folderId);
        }
      }

      if (input.search) {
        const q = input.search.toLowerCase();
        rows = rows.filter(t => t.name.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q));
      }

      const templateIds = rows.map(t => t.id);
      if (templateIds.length === 0) return rows.map(t => ({ ...t, tags: [] }));

      const tagLinks = await db
        .select({ templateId: templateTags.templateId, tagId: templateTags.tagId })
        .from(templateTags)
        .where(inArray(templateTags.templateId, templateIds));

      const allTagIds = Array.from(new Set(tagLinks.map(l => l.tagId)));
      const allTags = allTagIds.length > 0
        ? await db.select().from(tags).where(inArray(tags.id, allTagIds))
        : [];

      const tagMap = new Map(allTags.map(t => [t.id, t]));

      let result = rows.map(t => ({
        ...t,
        tags: tagLinks.filter(l => l.templateId === t.id).map(l => tagMap.get(l.tagId)).filter(Boolean) as typeof allTags,
      }));

      if (input.tagId) {
        result = result.filter(t => t.tags.some(tag => tag.id === input.tagId));
      }

      return result;
    }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(templates).where(eq(templates.id, input.id)).limit(1);
      if (!rows[0]) return null;
      const t = rows[0];

      const tagLinks = await db.select().from(templateTags).where(eq(templateTags.templateId, t.id));
      const tagIds = tagLinks.map(l => l.tagId);
      const templateTagsList = tagIds.length > 0
        ? await db.select().from(tags).where(inArray(tags.id, tagIds))
        : [];

      return { ...t, tags: templateTagsList };
    }),

  create: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      code: z.string().min(1),
      folderId: z.number().nullable().optional(),
      tagIds: z.array(z.number()).optional(),
      thumbnailUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const result = await db.insert(templates).values({
        name: input.name,
        description: input.description ?? null,
        code: input.code,
        folderId: input.folderId ?? null,
        thumbnailUrl: input.thumbnailUrl ?? null,
      });
      const newId = Number(result[0].insertId);

      if (input.tagIds && input.tagIds.length > 0) {
        await db.insert(templateTags).values(input.tagIds.map(tagId => ({ templateId: newId, tagId })));
      }

      return { id: newId };
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      code: z.string().optional(),
      folderId: z.number().nullable().optional(),
      tagIds: z.array(z.number()).optional(),
      thumbnailUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const updateData: Record<string, unknown> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.code !== undefined) updateData.code = input.code;
      if (input.folderId !== undefined) updateData.folderId = input.folderId;
      if (input.thumbnailUrl !== undefined) updateData.thumbnailUrl = input.thumbnailUrl;

      if (Object.keys(updateData).length > 0) {
        await db.update(templates).set(updateData).where(eq(templates.id, input.id));
      }

      if (input.tagIds !== undefined) {
        await db.delete(templateTags).where(eq(templateTags.templateId, input.id));
        if (input.tagIds.length > 0) {
          await db.insert(templateTags).values(input.tagIds.map(tagId => ({ templateId: input.id, tagId })));
        }
      }

      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(templateTags).where(eq(templateTags.templateId, input.id));
      await db.delete(templates).where(eq(templates.id, input.id));
      return { success: true };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(templates).where(eq(templates.id, input.id)).limit(1);
      if (!rows[0]) return null;
      const t = rows[0];
      const tagLinks = await db.select().from(templateTags).where(eq(templateTags.templateId, t.id));
      const tagIds = tagLinks.map(l => l.tagId);
      const templateTagsList = tagIds.length > 0
        ? await db.select().from(tags).where(inArray(tags.id, tagIds))
        : [];
      return { ...t, tags: templateTagsList };
    }),

  move: publicProcedure
    .input(z.object({ id: z.number(), folderId: z.number().nullable() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.update(templates).set({ folderId: input.folderId }).where(eq(templates.id, input.id));
      return { success: true };
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  folder: folderRouter,
  tag: tagRouter,
  template: templateRouter,
});

export type AppRouter = typeof appRouter;

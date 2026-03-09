import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "./db";

function createCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const mockInsertResult = [{ insertId: 42 }];

function createMockDb(overrides: Record<string, unknown> = {}) {
  const insertChain = {
    values: vi.fn().mockResolvedValue(mockInsertResult),
  };
  const updateChain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(undefined),
  };
  const deleteChain = {
    where: vi.fn().mockResolvedValue(undefined),
  };
  const selectChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockResolvedValue([]),
    limit: vi.fn().mockResolvedValue([]),
  };

  return {
    insert: vi.fn().mockReturnValue(insertChain),
    update: vi.fn().mockReturnValue(updateChain),
    delete: vi.fn().mockReturnValue(deleteChain),
    select: vi.fn().mockReturnValue(selectChain),
    ...overrides,
  };
}

describe("folder router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list returns empty array when db unavailable", async () => {
    vi.mocked(getDb).mockResolvedValue(null);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.folder.list();
    expect(result).toEqual([]);
  });

  it("create returns new folder id", async () => {
    const mockDb = createMockDb();
    vi.mocked(getDb).mockResolvedValue(mockDb as ReturnType<typeof createMockDb>);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.folder.create({ name: "Test Folder" });
    expect(result.id).toBe(42);
    expect(result.name).toBe("Test Folder");
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("rename calls update with correct args", async () => {
    const mockDb = createMockDb();
    vi.mocked(getDb).mockResolvedValue(mockDb as ReturnType<typeof createMockDb>);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.folder.rename({ id: 1, name: "Renamed" });
    expect(result.success).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("delete calls update and delete", async () => {
    const mockDb = createMockDb();
    vi.mocked(getDb).mockResolvedValue(mockDb as ReturnType<typeof createMockDb>);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.folder.delete({ id: 1 });
    expect(result.success).toBe(true);
    expect(mockDb.delete).toHaveBeenCalled();
  });
});

describe("tag router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list returns empty array when db unavailable", async () => {
    vi.mocked(getDb).mockResolvedValue(null);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.tag.list();
    expect(result).toEqual([]);
  });

  it("create returns new tag with default color", async () => {
    const mockDb = createMockDb();
    vi.mocked(getDb).mockResolvedValue(mockDb as ReturnType<typeof createMockDb>);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.tag.create({ name: "Performance" });
    expect(result.id).toBe(42);
    expect(result.name).toBe("Performance");
    expect(result.color).toBe("#6366f1");
  });

  it("create accepts custom color", async () => {
    const mockDb = createMockDb();
    vi.mocked(getDb).mockResolvedValue(mockDb as ReturnType<typeof createMockDb>);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.tag.create({ name: "Paid Ads", color: "#ef4444" });
    expect(result.color).toBe("#ef4444");
  });

  it("delete removes tag and its associations", async () => {
    const mockDb = createMockDb();
    vi.mocked(getDb).mockResolvedValue(mockDb as ReturnType<typeof createMockDb>);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.tag.delete({ id: 5 });
    expect(result.success).toBe(true);
    expect(mockDb.delete).toHaveBeenCalledTimes(2); // templateTags + tags
  });
});

describe("template router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list returns empty array when db unavailable", async () => {
    vi.mocked(getDb).mockResolvedValue(null);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.template.list({});
    expect(result).toEqual([]);
  });

  it("getById returns null when db unavailable", async () => {
    vi.mocked(getDb).mockResolvedValue(null);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.template.getById({ id: 1 });
    expect(result).toBeNull();
  });

  it("create returns new template id", async () => {
    const mockDb = createMockDb();
    vi.mocked(getDb).mockResolvedValue(mockDb as ReturnType<typeof createMockDb>);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.template.create({
      name: "SaaS Hero",
      code: "<html><body>Hello</body></html>",
    });
    expect(result.id).toBe(42);
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("create with tags inserts into templateTags", async () => {
    const mockDb = createMockDb();
    vi.mocked(getDb).mockResolvedValue(mockDb as ReturnType<typeof createMockDb>);
    const caller = appRouter.createCaller(createCtx());
    await caller.template.create({
      name: "Tagged Template",
      code: "<html></html>",
      tagIds: [1, 2],
    });
    expect(mockDb.insert).toHaveBeenCalledTimes(2); // templates + templateTags
  });

  it("delete removes template and its tag associations", async () => {
    const mockDb = createMockDb();
    vi.mocked(getDb).mockResolvedValue(mockDb as ReturnType<typeof createMockDb>);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.template.delete({ id: 10 });
    expect(result.success).toBe(true);
    expect(mockDb.delete).toHaveBeenCalledTimes(2);
  });

  it("move updates folderId correctly", async () => {
    const mockDb = createMockDb();
    vi.mocked(getDb).mockResolvedValue(mockDb as ReturnType<typeof createMockDb>);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.template.move({ id: 1, folderId: 3 });
    expect(result.success).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it("move to root sets folderId to null", async () => {
    const mockDb = createMockDb();
    vi.mocked(getDb).mockResolvedValue(mockDb as ReturnType<typeof createMockDb>);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.template.move({ id: 1, folderId: null });
    expect(result.success).toBe(true);
  });
});

describe("template.list all:true", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list with all:true returns all templates regardless of folder", async () => {
    const mockTemplates = [
      { id: 1, name: "A", code: "<html/>", folderId: 1, description: null, thumbnailUrl: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: "B", code: "<html/>", folderId: null, description: null, thumbnailUrl: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 3, name: "C", code: "<html/>", folderId: 2, description: null, thumbnailUrl: null, createdAt: new Date(), updatedAt: new Date() },
    ];
    // First select returns templates, subsequent selects return [] for tag links
    let selectCallCount = 0;
    const makeSelectChain = (resolveWith: unknown[]) => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(resolveWith),
      orderBy: vi.fn().mockResolvedValue(resolveWith),
      limit: vi.fn().mockResolvedValue(resolveWith),
    });
    const mockDb = {
      ...createMockDb(),
      select: vi.fn().mockImplementation(() => {
        selectCallCount++;
        return makeSelectChain(selectCallCount === 1 ? mockTemplates : []);
      }),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as ReturnType<typeof createMockDb>);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.template.list({ all: true });
    expect(result).toHaveLength(3);
  });

  it("list without all returns only unfiled templates", async () => {
    const mockTemplates = [
      { id: 1, name: "A", code: "<html/>", folderId: 1, description: null, thumbnailUrl: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: "B", code: "<html/>", folderId: null, description: null, thumbnailUrl: null, createdAt: new Date(), updatedAt: new Date() },
    ];
    let selectCallCount = 0;
    const makeSelectChain = (resolveWith: unknown[]) => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(resolveWith),
      orderBy: vi.fn().mockResolvedValue(resolveWith),
      limit: vi.fn().mockResolvedValue(resolveWith),
    });
    const mockDb = {
      ...createMockDb(),
      select: vi.fn().mockImplementation(() => {
        selectCallCount++;
        return makeSelectChain(selectCallCount === 1 ? mockTemplates : []);
      }),
    };
    vi.mocked(getDb).mockResolvedValue(mockDb as ReturnType<typeof createMockDb>);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.template.list({});
    // Without all:true and no folderId specified, returns unfiled (folderId === null)
    expect(result.every((t: { folderId: number | null }) => t.folderId === null)).toBe(true);
  });

  it("update changes template fields correctly", async () => {
    const mockDb = createMockDb();
    vi.mocked(getDb).mockResolvedValue(mockDb as ReturnType<typeof createMockDb>);
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.template.update({ id: 1, name: "Updated Name", folderId: 3 });
    expect(result.success).toBe(true);
    expect(mockDb.update).toHaveBeenCalled();
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
    const ctx: TrpcContext = {
      user: {
        id: 1, openId: "test-user", email: "test@example.com", name: "Test",
        loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies).toHaveLength(1);
  });
});

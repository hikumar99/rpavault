import { Client } from "@notionhq/client";
import {
  Task,
  TaskStatus,
  RecurUnit,
  Weekday,
  CreateTaskInput,
  UpdateTaskInput,
  AssigneeDetail,
  TaskComment,
} from "./types";
import { computeNextDue } from "./recurrence";

function getNotionClient(): Client {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    throw new Error("NOTION_TOKEN environment variable is missing.");
  }
  return new Client({ auth: token });
}

function getDataSourceId(): string {
  return process.env.NOTION_DATA_SOURCE_ID || "adeee8c4-8df2-82ec-8281-815b6c3ddb80";
}

// Map user ID to clean human-readable name (prevents random UUID strings from showing in UI)
export const KNOWN_USERS_MAP: Record<string, AssigneeDetail> = {
  "51c6c018-6966-4b29-b65e-e8f63036bbad": {
    id: "51c6c018-6966-4b29-b65e-e8f63036bbad",
    name: "Kumar",
    avatarUrl: "https://s3-us-west-2.amazonaws.com/public.notion-static.com/e34a3ff5-c30c-40bc-bd33-0e70536a7c0c/my-notion-face-transparent.png",
  },
  "2b9d872b-594c-81be-a09c-00024bec7424": {
    id: "2b9d872b-594c-81be-a09c-00024bec7424",
    name: "Shivani",
    avatarUrl: "https://s3-us-west-2.amazonaws.com/public.notion-static.com/e68f6776-c7c3-4994-9244-5179cf5bb722/WhatsApp_Image_2026-03-07_at_9.14.18_PM.jpeg",
  },
  "327d872b-594c-81b0-a962-00027b0ca975": {
    id: "327d872b-594c-81b0-a962-00027b0ca975",
    name: "Guest Member",
  },
};

export function resolveUserName(idOrName: string): string {
  if (KNOWN_USERS_MAP[idOrName]) {
    return KNOWN_USERS_MAP[idOrName].name;
  }
  // Check if it matches a known user ID without hyphens or case insensitive
  const cleanId = idOrName.toLowerCase();
  for (const u of Object.values(KNOWN_USERS_MAP)) {
    if (u.id.toLowerCase() === cleanId || u.name.toLowerCase() === cleanId) {
      return u.name;
    }
  }
  // If it is a raw UUID or "2do" bot, label cleanly
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrName) || idOrName === "2do") {
    return "Kumar";
  }
  return idOrName;
}

/**
 * Normalizes a raw Notion page into a clean Task object.
 */
export function normalizeNotionPage(page: any): Task {
  const props = page.properties || {};

  // Name (title)
  let name = "Untitled Task";
  const titleProp = props["Name"] || props["Task Name"] || props["title"];
  if (titleProp?.title && Array.isArray(titleProp.title) && titleProp.title.length > 0) {
    name = titleProp.title.map((t: any) => t.plain_text).join("");
  }

  // Status (status)
  let status: TaskStatus = "To Do";
  if (props["Status"]?.status?.name) {
    status = props["Status"].status.name as TaskStatus;
  }

  // Due (date)
  let due: string | null = null;
  let dueEnd: string | null = null;
  if (props["Due"]?.date) {
    due = props["Due"].date.start || null;
    dueEnd = props["Due"].date.end || null;
  }

  // Assignee (people) - clean names, replace raw UUIDs with friendly names
  let assignee: string[] = [];
  let assigneeDetails: AssigneeDetail[] = [];
  if (props["Assignee"]?.people && Array.isArray(props["Assignee"].people)) {
    assignee = props["Assignee"].people.map((p: any) => resolveUserName(p.name || p.id));
    assigneeDetails = props["Assignee"].people.map((p: any) => {
      const known = KNOWN_USERS_MAP[p.id];
      return {
        id: p.id,
        name: known?.name || (p.name ? p.name : "Guest Member"),
        avatarUrl: known?.avatarUrl || p.avatar_url || undefined,
      };
    });
  }

  // Recur Int (number)
  const recurInt = typeof props["Recur Int"]?.number === "number" ? props["Recur Int"].number : null;

  // Recur Unit (select)
  const recurUnit = props["Recur Unit"]?.select?.name as RecurUnit | null;

  // Days (multi_select)
  let days: Weekday[] = [];
  if (props["Days"]?.multi_select && Array.isArray(props["Days"].multi_select)) {
    days = props["Days"].multi_select.map((d: any) => d.name as Weekday);
  }

  // Tags (multi_select)
  let tags: string[] = [];
  if (props["Tags"]?.multi_select && Array.isArray(props["Tags"].multi_select)) {
    tags = props["Tags"].multi_select.map((t: any) => t.name);
  }

  // Parent / Sub-task relation
  let parentId: string | null = null;
  const parentProp = props["Parent / Sub-task"] || props["Parent task"] || props["Parent"];
  if (parentProp?.relation && Array.isArray(parentProp.relation) && parentProp.relation.length > 0) {
    parentId = parentProp.relation[0].id;
  }

  // URL (internally userDefined:URL or URL)
  const urlProp = props["URL"] || props["userDefined:URL"];
  const url = urlProp?.url || null;

  return {
    id: page.id,
    name,
    status,
    due,
    dueEnd,
    assignee,
    assigneeDetails,
    recurInt,
    recurUnit,
    days,
    tags,
    parentId,
    url,
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
  };
}

/**
 * Reads page content text (paragraphs/callouts/images) as page description.
 */
export async function getPageDescription(pageId: string): Promise<string> {
  try {
    const notion = getNotionClient();
    const blocks = await notion.blocks.children.list({ block_id: pageId });
    const texts: string[] = [];
    for (const b of blocks.results as any[]) {
      if (b.paragraph?.rich_text) {
        texts.push(b.paragraph.rich_text.map((t: any) => t.plain_text).join(""));
      } else if (b.bulleted_list_item?.rich_text) {
        texts.push("• " + b.bulleted_list_item.rich_text.map((t: any) => t.plain_text).join(""));
      } else if (b.to_do?.rich_text) {
        texts.push((b.to_do.checked ? "[x] " : "[ ] ") + b.to_do.rich_text.map((t: any) => t.plain_text).join(""));
      } else if (b.callout?.rich_text) {
        texts.push(b.callout.rich_text.map((t: any) => t.plain_text).join(""));
      } else if (b.image) {
        const url = b.image.external?.url || b.image.file?.url;
        if (url) {
          texts.push(`![image](${url})`);
        }
      }
    }
    return texts.join("\n");
  } catch (err) {
    console.error("Failed to read page description:", err);
    return "";
  }
}

/**
 * Updates the page body content directly in Notion (handling text and images).
 */
export async function updatePageDescription(pageId: string, description: string): Promise<void> {
  const notion = getNotionClient();
  try {
    const existing = await notion.blocks.children.list({ block_id: pageId });
    for (const b of existing.results) {
      try {
        await notion.blocks.delete({ block_id: b.id });
      } catch {}
    }

    if (description.trim()) {
      const lines = description.split("\n").filter(line => line.trim().length > 0);
      const children: any[] = [];

      for (const line of lines) {
        // Check if markdown image: ![caption](url)
        const imgMatch = line.match(/^!\[(.*?)\]\((https?:\/\/[^\s]+)\)$/);
        if (imgMatch) {
          children.push({
            object: "block",
            type: "image",
            image: {
              type: "external",
              external: { url: imgMatch[2] },
            },
          });
        } else {
          children.push({
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ type: "text", text: { content: line } }],
            },
          });
        }
      }

      if (children.length > 0) {
        await notion.blocks.children.append({
          block_id: pageId,
          children: children.slice(0, 100),
        });
      }
    }
  } catch (err) {
    console.error("Error saving page description to Notion:", err);
  }
}

/**
 * Get all Notion users (people and guests, cleaned of raw UUID numbers).
 */
export async function listNotionUsers(): Promise<AssigneeDetail[]> {
  const userMap = new Map<string, AssigneeDetail>();

  // Add predefined active members
  Object.values(KNOWN_USERS_MAP).forEach((u) => userMap.set(u.id, u));

  try {
    const notion = getNotionClient();
    const users = await notion.users.list({});
    for (const u of users.results) {
      if (u.type === "person" && u.name) {
        userMap.set(u.id, {
          id: u.id,
          name: u.name,
          avatarUrl: u.avatar_url || undefined,
        });
      }
    }

    const database_id = getDataSourceId();
    const query = await notion.databases.query({
      database_id,
      page_size: 50,
    });

    for (const page of query.results as any[]) {
      const people = page.properties?.Assignee?.people;
      if (Array.isArray(people)) {
        for (const p of people) {
          if (p.id && !userMap.has(p.id)) {
            const cleanName = resolveUserName(p.name || p.id);
            userMap.set(p.id, {
              id: p.id,
              name: cleanName,
              avatarUrl: p.avatar_url || undefined,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Error fetching Notion users:", err);
  }

  return Array.from(userMap.values());
}

/**
 * List comments for a task Notion page.
 */
export async function getTaskComments(pageId: string): Promise<TaskComment[]> {
  try {
    const notion = getNotionClient();
    const res = await notion.comments.list({ block_id: pageId });
    return (res.results as any[]).map((c) => {
      let rawText = c.rich_text?.map((r: any) => r.plain_text).join("") || "";
      let author = resolveUserName(c.created_by?.name || c.created_by?.id || "Kumar");

      // If text has "Name: Message", extract the name as author
      const prefixMatch = rawText.match(/^([A-Za-z0-9_\s]{2,20})\s*:\s*([\s\S]+)$/);
      if (prefixMatch) {
        author = prefixMatch[1].trim();
        rawText = prefixMatch[2].trim();
      }

      return {
        id: c.id,
        author,
        authorAvatar: c.created_by?.avatar_url || undefined,
        text: rawText,
        createdTime: c.created_time,
      };
    });
  } catch (e: any) {
    console.error("Failed to list Notion comments:", e.message);
    return [];
  }
}

/**
 * Create a comment on a Notion page with user tagging and author prefix support.
 */
export async function createTaskComment(
  pageId: string,
  text: string,
  taggedUserIds: string[] = [],
  authorName: string = "Kumar"
): Promise<TaskComment> {
  const notion = getNotionClient();

  const richText: any[] = [];

  // If users are tagged, append Notion user mention blocks
  if (taggedUserIds.length > 0) {
    for (const uid of taggedUserIds) {
      richText.push({
        type: "mention",
        mention: {
          type: "user",
          user: { id: uid },
        },
      });
      richText.push({
        type: "text",
        text: { content: " " },
      });
    }
  }

  // Prefix with author name: e.g. "kumar: [comment msg]"
  const formattedText = `${authorName}: ${text}`;
  richText.push({
    type: "text",
    text: { content: formattedText },
  });

  const comment = await notion.comments.create({
    parent: { page_id: pageId },
    rich_text: richText,
  });

  const commentRes: any = comment;
  return {
    id: commentRes.id,
    author: authorName,
    text: text,
    createdTime: commentRes.created_time || new Date().toISOString(),
  };
}

/**
 * List all tasks from Notion data source.
 */
export async function listTasks(filter?: any): Promise<Task[]> {
  const notion = getNotionClient();
  const database_id = getDataSourceId();

  const results: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response: any = await notion.databases.query({
      database_id,
      start_cursor: cursor,
      filter,
      sorts: [
        {
          property: "Due",
          direction: "ascending",
        },
      ],
    });

    results.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  const tasks = results.map(normalizeNotionPage);

  const taskMap = new Map<string, Task>();
  for (const t of tasks) {
    t.subtaskIds = [];
    taskMap.set(t.id, t);
  }

  for (const t of tasks) {
    if (t.parentId && taskMap.has(t.parentId)) {
      taskMap.get(t.parentId)?.subtaskIds?.push(t.id);
    }
  }

  return tasks;
}

/**
 * Deep search across page titles, description/body content, and comments.
 */
export async function searchDeepTasks(query: string): Promise<Task[]> {
  const notion = getNotionClient();
  const database_id = getDataSourceId().replace(/-/g, "").toLowerCase();

  const searchRes = await notion.search({
    query,
    filter: { value: "page", property: "object" },
    page_size: 50,
  });

  const matchingPages = searchRes.results.filter((page: any) => {
    const parentDb = page.parent?.database_id?.replace(/-/g, "").toLowerCase();
    return parentDb === database_id;
  });

  return matchingPages.map(normalizeNotionPage);
}

export async function getTask(pageId: string): Promise<Task> {
  const notion = getNotionClient();
  const page = await notion.pages.retrieve({ page_id: pageId });
  const task = normalizeNotionPage(page);
  task.description = await getPageDescription(pageId);
  return task;
}

export async function createTask(data: CreateTaskInput): Promise<Task> {
  const notion = getNotionClient();
  const database_id = getDataSourceId();

  const properties: any = {
    Name: {
      title: [{ type: "text", text: { content: data.name } }],
    },
    Status: {
      status: { name: data.status || "To Do" },
    },
  };

  if (data.due) {
    properties["Due"] = {
      date: { start: data.due, end: data.dueEnd || null },
    };
  }

  if (data.assignee && data.assignee.length > 0) {
    properties["Assignee"] = {
      people: data.assignee.map((id) => ({ id })),
    };
  }

  if (data.recurInt !== undefined && data.recurInt !== null) {
    properties["Recur Int"] = { number: data.recurInt };
  }

  if (data.recurUnit) {
    properties["Recur Unit"] = { select: { name: data.recurUnit } };
  }

  if (data.days && data.days.length > 0) {
    properties["Days"] = { multi_select: data.days.map((d) => ({ name: d })) };
  }

  if (data.tags && data.tags.length > 0) {
    properties["Tags"] = { multi_select: data.tags.map((t) => ({ name: t })) };
  }

  if (data.parentId) {
    properties["Parent / Sub-task"] = { relation: [{ id: data.parentId }] };
  }

  if (data.url) {
    properties["URL"] = { url: data.url };
  }

  const page = await notion.pages.create({
    parent: { database_id },
    properties,
  });

  const created = normalizeNotionPage(page);
  if (data.description) {
    await updatePageDescription(created.id, data.description);
    created.description = data.description;
  }
  return created;
}

export async function updateTask(pageId: string, data: UpdateTaskInput): Promise<Task> {
  const notion = getNotionClient();
  const properties: any = {};

  if (data.name !== undefined) {
    properties["Name"] = {
      title: [{ type: "text", text: { content: data.name } }],
    };
  }

  if (data.status !== undefined) {
    properties["Status"] = { status: { name: data.status } };
  }

  if (data.due !== undefined) {
    properties["Due"] = data.due
      ? { date: { start: data.due, end: data.dueEnd || null } }
      : { date: null };
  }

  if (data.assignee !== undefined) {
    properties["Assignee"] = {
      people: (data.assignee || []).map((id) => ({ id })),
    };
  }

  if (data.recurInt !== undefined) {
    properties["Recur Int"] = { number: data.recurInt };
  }

  if (data.recurUnit !== undefined) {
    properties["Recur Unit"] = data.recurUnit ? { select: { name: data.recurUnit } } : { select: null };
  }

  if (data.days !== undefined) {
    properties["Days"] = { multi_select: data.days ? data.days.map((d) => ({ name: d })) : [] };
  }

  if (data.tags !== undefined) {
    properties["Tags"] = { multi_select: data.tags ? data.tags.map((t) => ({ name: t })) : [] };
  }

  if (data.parentId !== undefined) {
    properties["Parent / Sub-task"] = { relation: data.parentId ? [{ id: data.parentId }] : [] };
  }

  if (data.url !== undefined) {
    properties["URL"] = { url: data.url || null };
  }

  const page = await notion.pages.update({
    page_id: pageId,
    properties,
  });

  if (data.description !== undefined) {
    await updatePageDescription(pageId, data.description || "");
  }

  const updated = normalizeNotionPage(page);
  updated.description = data.description;
  return updated;
}

export async function deleteTask(pageId: string): Promise<boolean> {
  const notion = getNotionClient();
  await notion.pages.update({
    page_id: pageId,
    archived: true,
  });
  return true;
}

export async function completeAndReschedule(pageId: string): Promise<Task> {
  const task = await getTask(pageId);

  if (task.recurInt && task.recurUnit) {
    const nextDue = computeNextDue(task);
    return updateTask(pageId, {
      status: "To Do",
      due: nextDue,
    });
  } else {
    return updateTask(pageId, {
      status: "Done",
    });
  }
}

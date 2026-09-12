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

// Map user ID to clean human-readable name for default RPAVault workspace
export const RPAVAULT_USERS_MAP: Record<string, AssigneeDetail> = {
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
};

export const KNOWN_USERS_MAP: Record<string, AssigneeDetail> = { ...RPAVAULT_USERS_MAP };

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
  // If it is a raw UUID or bot name
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrName)) {
    return "Member";
  }
  if (idOrName === "2do") {
    return "2Do Bot";
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

  // Status (status / select / checkbox: Status, Chk, Done, etc.)
  let status: TaskStatus = "To Do";
  const statusProp = props["Status"] || props["Chk"] || props["chk"] || props["Status / Chk"];
  if (statusProp) {
    let rawStatusName = "";
    if (statusProp.status?.name) {
      rawStatusName = statusProp.status.name.trim();
    } else if (statusProp.select?.name) {
      rawStatusName = statusProp.select.name.trim();
    } else if (typeof statusProp.checkbox === "boolean") {
      status = statusProp.checkbox ? "Done" : "To Do";
    }

    if (rawStatusName) {
      const lower = rawStatusName.toLowerCase();
      if (
        lower === "done" ||
        lower === "completed" ||
        lower === "complete" ||
        lower === "finished" ||
        lower === "closed" ||
        lower === "yes" ||
        lower === "checked" ||
        lower === "chk" ||
        lower === "resolved"
      ) {
        status = "Done";
      } else if (
        lower === "doing" ||
        lower === "in progress" ||
        lower === "working" ||
        lower === "in-progress" ||
        lower === "ongoing"
      ) {
        status = "Doing";
      } else {
        status = "To Do";
      }
    }
  } else if (props["Done"] && typeof props["Done"].checkbox === "boolean") {
    status = props["Done"].checkbox ? "Done" : "To Do";
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
    rawProperties: props,
  };
}

/**
 * Reads page content blocks (headings, lists, to-dos, quotes, code, paragraphs, and images) as markdown description.
 */
export async function getPageDescription(pageId: string): Promise<string> {
  try {
    const notion = getNotionClient();
    const blocks = await notion.blocks.children.list({ block_id: pageId, page_size: 100 });
    const lines: string[] = [];

    for (const b of blocks.results as any[]) {
      if (b.type === "heading_1" && b.heading_1?.rich_text) {
        lines.push("# " + b.heading_1.rich_text.map((t: any) => t.plain_text).join(""));
      } else if (b.type === "heading_2" && b.heading_2?.rich_text) {
        lines.push("## " + b.heading_2.rich_text.map((t: any) => t.plain_text).join(""));
      } else if (b.type === "heading_3" && b.heading_3?.rich_text) {
        lines.push("### " + b.heading_3.rich_text.map((t: any) => t.plain_text).join(""));
      } else if (b.type === "bulleted_list_item" && b.bulleted_list_item?.rich_text) {
        lines.push("• " + b.bulleted_list_item.rich_text.map((t: any) => t.plain_text).join(""));
      } else if (b.type === "numbered_list_item" && b.numbered_list_item?.rich_text) {
        lines.push("1. " + b.numbered_list_item.rich_text.map((t: any) => t.plain_text).join(""));
      } else if (b.type === "to_do" && b.to_do?.rich_text) {
        lines.push((b.to_do.checked ? "[x] " : "[ ] ") + b.to_do.rich_text.map((t: any) => t.plain_text).join(""));
      } else if (b.type === "quote" && b.quote?.rich_text) {
        lines.push("> " + b.quote.rich_text.map((t: any) => t.plain_text).join(""));
      } else if (b.type === "code" && b.code?.rich_text) {
        lines.push("```\n" + b.code.rich_text.map((t: any) => t.plain_text).join("") + "\n```");
      } else if (b.type === "callout" && b.callout?.rich_text) {
        lines.push("> " + b.callout.rich_text.map((t: any) => t.plain_text).join(""));
      } else if (b.type === "paragraph" && b.paragraph?.rich_text) {
        lines.push(b.paragraph.rich_text.map((t: any) => t.plain_text).join(""));
      } else if (b.type === "image" && b.image) {
        const url = b.image.external?.url || b.image.file?.url;
        if (url) {
          lines.push(`![image](${url})`);
        }
      }
    }
    return lines.join("\n");
  } catch (err) {
    console.error("Failed to read page description:", err);
    return "";
  }
}

/**
 * Updates the page body content directly in Notion safely (without wiping existing blocks if update fails).
 */
export async function updatePageDescription(pageId: string, description: string): Promise<void> {
  const notion = getNotionClient();
  try {
    const rawLines = (description || "").split("\n");
    const newChildren: any[] = [];

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (!line) continue;

      // Markdown image: ![caption](url)
      const imgMatch = line.match(/^!\[(.*?)\]\((.+)\)$/);
      if (imgMatch) {
        const imgUrl = imgMatch[2].trim();
        // Notion API external image blocks require valid HTTP/HTTPS URLs <= 2000 chars
        if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) {
          if (imgUrl.length <= 2000) {
            newChildren.push({
              object: "block",
              type: "image",
              image: {
                type: "external",
                external: { url: imgUrl },
              },
            });
            continue;
          }
        }
        // If image is a local path or data URL, render as callout link instead of invalid block that crashes Notion
        const caption = imgMatch[1] || "Image Attachment";
        newChildren.push({
          object: "block",
          type: "callout",
          callout: {
            rich_text: [
              {
                type: "text",
                text: { content: `🖼️ [${caption}]` },
              },
            ],
          },
        });
        continue;
      }

      // Heading 1
      if (line.startsWith("# ")) {
        newChildren.push({
          object: "block",
          type: "heading_1",
          heading_1: {
            rich_text: [{ type: "text", text: { content: line.slice(2).slice(0, 2000) } }],
          },
        });
        continue;
      }

      // Heading 2
      if (line.startsWith("## ")) {
        newChildren.push({
          object: "block",
          type: "heading_2",
          heading_2: {
            rich_text: [{ type: "text", text: { content: line.slice(3).slice(0, 2000) } }],
          },
        });
        continue;
      }

      // Heading 3
      if (line.startsWith("### ")) {
        newChildren.push({
          object: "block",
          type: "heading_3",
          heading_3: {
            rich_text: [{ type: "text", text: { content: line.slice(4).slice(0, 2000) } }],
          },
        });
        continue;
      }

      // To-Do list
      if (line.startsWith("- [ ] ") || line.startsWith("[ ] ")) {
        const text = line.replace(/^-\s*\[\s*\]\s*|^\[\s*\]\s*/, "").slice(0, 2000);
        newChildren.push({
          object: "block",
          type: "to_do",
          to_do: {
            rich_text: [{ type: "text", text: { content: text } }],
            checked: false,
          },
        });
        continue;
      }
      if (line.startsWith("- [x] ") || line.startsWith("[x] ")) {
        const text = line.replace(/^-\s*\[x\]\s*|^\[x\]\s*/i, "").slice(0, 2000);
        newChildren.push({
          object: "block",
          type: "to_do",
          to_do: {
            rich_text: [{ type: "text", text: { content: text } }],
            checked: true,
          },
        });
        continue;
      }

      // Bulleted list item
      if (line.startsWith("• ") || line.startsWith("- ") || line.startsWith("* ")) {
        const text = line.replace(/^([•\-*]\s*)/, "").slice(0, 2000);
        newChildren.push({
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: {
            rich_text: [{ type: "text", text: { content: text } }],
          },
        });
        continue;
      }

      // Numbered list item
      if (/^\d+\.\s/.test(line)) {
        const text = line.replace(/^\d+\.\s*/, "").slice(0, 2000);
        newChildren.push({
          object: "block",
          type: "numbered_list_item",
          numbered_list_item: {
            rich_text: [{ type: "text", text: { content: text } }],
          },
        });
        continue;
      }

      // Quote / Callout
      if (line.startsWith("> ")) {
        newChildren.push({
          object: "block",
          type: "quote",
          quote: {
            rich_text: [{ type: "text", text: { content: line.slice(2).slice(0, 2000) } }],
          },
        });
        continue;
      }

      // Standard Paragraph (capped at 2000 chars per Notion API limit)
      newChildren.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: line.slice(0, 2000) } }],
        },
      });
    }

    // Retrieve existing blocks
    const existing = await notion.blocks.children.list({ block_id: pageId, page_size: 100 });

    // Append validated new children in chunks of 50
    if (newChildren.length > 0) {
      for (let c = 0; c < newChildren.length; c += 50) {
        await notion.blocks.children.append({
          block_id: pageId,
          children: newChildren.slice(c, c + 50),
        });
      }
    }

    // Safely remove the prior existing blocks only after the new blocks have succeeded!
    for (const b of existing.results) {
      try {
        await notion.blocks.delete({ block_id: b.id });
      } catch {}
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
  const database_id = getDataSourceId();
  const isDefaultDb = database_id === "adeee8c4-8df2-82ec-8281-815b6c3ddb80";

  // Only seed RPAVault team members if connected to the company RPAVault database
  if (isDefaultDb) {
    Object.values(RPAVAULT_USERS_MAP).forEach((u) => userMap.set(u.id, u));
  }

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
export async function listTasks(filter?: any, maxResults: number = 2000): Promise<Task[]> {
  const notion = getNotionClient();
  const database_id = getDataSourceId();

  const results: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const queryPayload: any = {
      database_id,
      start_cursor: cursor,
      page_size: 100, // Query maximum allowed 100 pages per request for 10x faster loading
      filter,
      sorts: [
        {
          property: "Due",
          direction: "ascending",
        },
      ],
    };

    let response: any;
    try {
      response = await notion.databases.query(queryPayload);
    } catch {
      // If sorting by Due fails because Due property doesn't exist, sort without Due
      delete queryPayload.sorts;
      response = await notion.databases.query(queryPayload);
    }

    results.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;

    // Safety cap to prevent browser/server memory timeouts when databases exceed thousands of items
    if (results.length >= maxResults) {
      break;
    }
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

  let page: any;
  try {
    // Check page properties to see the exact schema (Status vs Chk vs Done)
    const existingPage: any = await notion.pages.retrieve({ page_id: pageId });
    const existingProps = existingPage.properties || {};

    if (data.status !== undefined) {
      delete properties["Status"];
      const isDone = data.status === "Done";

      // Detect the column name for completion/status
      const chkKey = Object.keys(existingProps).find((k) =>
        k.toLowerCase() === "chk" || k.toLowerCase() === "done" || k.toLowerCase() === "status" || k.toLowerCase() === "check"
      );

      if (chkKey) {
        const propType = existingProps[chkKey]?.type;
        if (propType === "checkbox") {
          properties[chkKey] = { checkbox: isDone };
        } else if (propType === "status") {
          // Status properties require an exact option name matching the DB schema
          const currentOption = existingProps[chkKey]?.status?.name || "";
          let targetName = isDone ? "Done" : "To Do";
          // If current is "In progress" or other, or if database defines options
          properties[chkKey] = { status: { name: targetName } };
        } else if (propType === "select") {
          properties[chkKey] = { select: { name: data.status } };
        } else {
          properties[chkKey] = { status: { name: data.status } };
        }
      } else {
        properties["Status"] = { status: { name: data.status } };
      }
    }

    try {
      page = await notion.pages.update({
        page_id: pageId,
        properties,
      });
    } catch (firstErr: any) {
      // If updating status failed (e.g. "Done" is not a status option, "Completed" might be)
      const chkKey = Object.keys(existingProps).find((k) =>
        k.toLowerCase() === "chk" || k.toLowerCase() === "done" || k.toLowerCase() === "status" || k.toLowerCase() === "check"
      ) || "Chk";

      const isDone = data.status === "Done";
      const statusCandidates = isDone
        ? ["Completed", "Complete", "Done", "Finished", "Done!"]
        : ["Not started", "To Do", "Not Started", "Todo", "Open"];

      let succeeded = false;
      for (const candidate of statusCandidates) {
        try {
          const retryProps = { ...properties };
          retryProps[chkKey] = { status: { name: candidate } };
          page = await notion.pages.update({
            page_id: pageId,
            properties: retryProps,
          });
          succeeded = true;
          break;
        } catch {}
      }

      if (!succeeded) {
        // Try as checkbox or select
        try {
          const checkProps = { ...properties };
          checkProps[chkKey] = { checkbox: isDone };
          page = await notion.pages.update({
            page_id: pageId,
            properties: checkProps,
          });
          succeeded = true;
        } catch {}
      }

      if (!succeeded) {
        throw firstErr;
      }
    }
  } catch (err: any) {
    console.warn("Failed Notion page update:", err?.message);
    throw err;
  }


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

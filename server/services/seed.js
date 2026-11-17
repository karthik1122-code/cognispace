import { User } from "../models/User.js";
import { Document } from "../models/Document.js";
import { Task } from "../models/Task.js";

/** Gives a new account three starter pages and four starter tasks. Never fails the sign-up. */
export async function seedUserStarterData(userId, userName) {
  try {
    let name = userName;
    if (!name) {
      const foundUser = await User.findById(userId).lean();
      name = foundUser?.name || "You";
    }
    const firstName = name.split(" ")[0] || "You";

    const existingDocsCount = await Document.countDocuments({ userId, isArchived: false });
    if (existingDocsCount === 0) {
      const starterDocs = [
        {
          title: "Welcome to CogniSpace",
          icon: "🚀",
          cover: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)",
          status: "In Progress",
          priority: "High",
          tags: ["Welcome", "Guide"],
          isStarred: true,
          content: `<h2>Welcome to your fresh workspace, ${firstName}!</h2><p>CogniSpace combines the versatility of a Notion-style block editor with Google Gemini AI and sprint tracking.</p><h3>Quick start</h3><ul data-type="taskList"><li data-type="taskItem" data-checked="false">Type <b>/</b> anywhere on an empty line to insert headings, toggles, or code</li><li data-type="taskItem" data-checked="false">Click <b>▶</b> on toggle lists to organize thoughts cleanly</li><li data-type="taskItem" data-checked="false">Highlight any text to rewrite or summarize with Gemini AI</li><li data-type="taskItem" data-checked="false">Click <b>+</b> in the sidebar to create new pages or sub-pages</li><li data-type="taskItem" data-checked="false">Open the <b>Sprint board</b> in the sidebar to plan your tasks</li></ul><details open=""><summary><b>Shortcuts</b></summary><p>• <b>⌘B</b> — Toggle sidebar<br/>• <b>⌘K</b> — Instant quick search<br/>• <b>⌘J</b> — Focus AI Copilot bar<br/>• <b>⌘N</b> — Create new document</p></details>`,
        },
        {
          // Real-looking meeting notes, so a new visitor can try "Create tasks from page" and "Ask your workspace" at once.
          title: "Weekly sync: beta launch",
          icon: "🗓️",
          cover: "linear-gradient(135deg, #3b0764 0%, #6d28d9 45%, #a78bfa 100%)",
          status: "In Review",
          priority: "High",
          tags: ["Meeting"],
          isStarred: true,
          content: `<h2>Decisions</h2><ul><li><p>We launch the public beta on <strong>28 November</strong>, not the 21st, so the new onboarding flow is finished first.</p></li><li><p>Pricing stays free during the beta. We revisit paid plans in January.</p></li><li><p>Support moves to one shared inbox instead of personal email.</p></li></ul><h2>Discussion</h2><p>Sign-up drop-off is still high on the second onboarding step. Priya thinks the workspace-name field confuses people; Arjun wants to test removing it.</p><p>The landing page loads slowly on phones because of the hero video.</p><h2>Action items</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>Priya to redesign onboarding step 2 by Friday</p></li><li data-type="taskItem" data-checked="false"><p>Arjun: run an A/B test without the workspace-name field</p></li><li data-type="taskItem" data-checked="true"><p>Set up the shared support inbox</p></li></ul><p>Someone also needs to compress the hero video before launch, and ${firstName} will draft the beta announcement email by next Wednesday.</p>`,
        },
        {
          title: "Quick Notes",
          icon: "💡",
          cover: "linear-gradient(135deg, #092e35 0%, #0c4a6e 40%, #0284c7 100%)",
          status: "In Progress",
          priority: "Medium",
          tags: ["Scratchpad", "Personal"],
          isStarred: false,
          content: "<h2>Personal Scratchpad</h2><p>Jot down quick thoughts, meeting notes, code snippets, or daily plans here. Your work autosaves automatically in real time.</p>",
        },
      ];

      for (const item of starterDocs) {
        await Document.create({ ...item, userId });
      }
    }

    const existingTasksCount = await Task.countDocuments({ userId });
    if (existingTasksCount === 0) {
      const starterTasks = [
        { name: "Explore the CogniSpace editor", status: "In Progress", priority: "High", assignee: firstName, dueDate: "Today", progress: 60 },
        { name: "Insert a toggle block with /", status: "In Progress", priority: "Medium", assignee: firstName, dueDate: "Today", progress: 20 },
        { name: "Highlight text and try the AI Copilot", status: "Backlog", priority: "Medium", assignee: firstName, dueDate: "Tomorrow", progress: 0 },
        { name: "Drag a task across the sprint board", status: "Backlog", priority: "Low", assignee: firstName, dueDate: "This week", progress: 0 },
      ];

      for (const task of starterTasks) {
        await Task.create({ ...task, userId });
      }
    }
  } catch (err) {
    console.error("Error seeding starter data for user:", err);
  }
}

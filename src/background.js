// Keyboard shortcut (Alt+Shift+D): forwards the toggle to the top frame of the active tab.
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== "toggle-site") return;
  const target = tab ?? (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
  if (!target?.id) return;
  // Browser pages (chrome://, the Web Store) have no content script, so "no receiver" is expected.
  chrome.tabs.sendMessage(target.id, { type: "toggle" }, { frameId: 0 }).catch(() => {});
});

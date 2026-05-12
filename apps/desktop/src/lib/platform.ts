export const isMac = navigator.platform.startsWith("Mac");
export const isWindows = navigator.platform.startsWith("Win");
export const isLinux = !isMac && !isWindows;

/** Short, user-friendly device noun for use in copy ("your {device}"). */
export const deviceLabel = isMac ? "Mac" : isWindows ? "PC" : "computer";

/** OS name for use in copy ("after a {osName} update"). */
export const osName = isMac ? "macOS" : isWindows ? "Windows" : "Linux";

const { execSync } = require("node:child_process");

const port = process.argv[2] ?? "3000";
const dryRun = process.argv.includes("--dry-run");

function freePortOnWindows(targetPort) {
  try {
    const output = execSync(`netstat -ano | findstr :${targetPort}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    const pids = new Set(
      output
        .split(/\r?\n/)
        .filter((line) => line.includes("LISTENING"))
        .map((line) => line.trim().split(/\s+/).pop())
        .filter((pid) => pid && pid !== "0"),
    );

    for (const pid of pids) {
      if (dryRun) {
        console.log(`Puerto ${targetPort} en uso (PID ${pid})`);
        continue;
      }
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
        console.log(`Puerto ${targetPort} liberado (PID ${pid})`);
      } catch {
        // Ignore processes that already exited.
      }
    }
  } catch {
    // Port is already free.
  }
}

if (process.platform === "win32") {
  freePortOnWindows(port);
}

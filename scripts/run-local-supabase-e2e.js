const { spawnSync } = require("node:child_process");

function quoteForCmd(arg) {
  if (!/[ \t"&|<>^]/.test(arg)) {
    return arg;
  }
  return `"${arg.replace(/"/g, '""')}"`;
}

function spawnNpx(args, options) {
  if (process.platform === "win32") {
    const commandLine = ["npx", ...args.map(quoteForCmd)].join(" ");
    return spawnSync("cmd.exe", ["/d", "/s", "/c", commandLine], options);
  }

  return spawnSync("npx", args, options);
}

function runNpx(args, env = process.env) {
  const result = spawnNpx(args, {
    cwd: process.cwd(),
    stdio: "inherit",
    env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`npx ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

function captureNpx(args) {
  const result = spawnNpx(args, {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.stderr.write(result.stderr || "");
    throw new Error(`npx ${args.join(" ")} failed with exit code ${result.status}`);
  }

  return result.stdout || "";
}

function parseEnvOutput(output) {
  return output.split(/\r?\n/).reduce((vars, line) => {
    const separator = line.indexOf("=");
    if (separator === -1) {
      return vars;
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key) {
      vars[key] = value;
    }
    return vars;
  }, {});
}

function isSupabaseRunning() {
  const result = spawnNpx(["supabase", "status", "-o", "env"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  return result.status === 0;
}

let started = false;
const wasRunning = isSupabaseRunning();

try {
  if (!wasRunning) {
    runNpx(["supabase", "start"]);
    started = true;
  }

  runNpx(["supabase", "db", "reset", "--local", "--yes"]);

  const statusOutput = captureNpx(["supabase", "status", "-o", "env"]);
  const supabaseStatus = parseEnvOutput(statusOutput);

  const requiredKeys = ["API_URL", "ANON_KEY", "SERVICE_ROLE_KEY"];
  for (const key of requiredKeys) {
    if (!supabaseStatus[key]) {
      throw new Error(`Missing ${key} in 'supabase status -o env' output.`);
    }
  }

  const testEnv = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: supabaseStatus.API_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseStatus.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: supabaseStatus.SERVICE_ROLE_KEY,
    NEXT_PUBLIC_ENABLE_SUPABASE_MOCK: "false",
  };

  runNpx(["playwright", "test", "-c", "playwright.local.config.ts"], testEnv);
} finally {
  if (started && !wasRunning) {
    runNpx(["supabase", "stop"]);
  }
}

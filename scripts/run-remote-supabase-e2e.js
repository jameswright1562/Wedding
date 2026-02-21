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

function readRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const supabaseUrl = readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = readRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceRoleKey = readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

if (!/^https?:\/\//i.test(supabaseUrl)) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL must be a valid http(s) URL.");
}

const testEnv = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
  SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
  NEXT_PUBLIC_ENABLE_SUPABASE_MOCK: "false",
};

runNpx(["playwright", "test", "-c", "playwright.local.config.ts"], testEnv);

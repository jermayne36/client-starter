import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));
const containerName = `client-starter-hoa-test-${process.pid}`;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: "utf8",
    env: options.env ?? process.env,
    stdio: options.stdio ?? "pipe",
  });

  if (result.status !== 0) {
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
    throw new Error(
      `${command} ${args.join(" ")} failed with exit ${result.status}${output ? `\n${output}` : ""}`,
    );
  }

  return (result.stdout ?? "").trim();
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForPostgres() {
  for (let attempt = 1; attempt <= 40; attempt += 1) {
    const probe = spawnSync(
      "docker",
      [
        "exec",
        containerName,
        "pg_isready",
        "-U",
        "postgres",
        "-d",
        "client_starter_test",
      ],
      { encoding: "utf8" },
    );

    if (probe.status === 0) {
      return;
    }

    await wait(250);
  }

  throw new Error("Synthetic PostgreSQL test container did not become ready");
}

let started = false;

try {
  run("docker", ["info", "--format", "{{.ServerVersion}}"]);
  run("docker", [
    "run",
    "--detach",
    "--rm",
    "--name",
    containerName,
    "--env",
    "POSTGRES_PASSWORD=postgres",
    "--env",
    "POSTGRES_DB=client_starter_test",
    "--publish",
    "127.0.0.1::5432",
    "postgres:16-alpine",
  ]);
  started = true;
  await waitForPostgres();

  const portOutput = run("docker", ["port", containerName, "5432/tcp"]);
  const port = portOutput.match(/:(\d+)$/u)?.[1];

  if (!port) {
    throw new Error(`Could not parse PostgreSQL port from: ${portOutput}`);
  }

  const adminDatabaseUrl = `postgresql://postgres:postgres@127.0.0.1:${port}/client_starter_test?schema=public`;
  const appDatabaseUrl = `postgresql://hoa_test_app:synthetic_test_password@127.0.0.1:${port}/client_starter_test?schema=public`;
  const databaseEnv = {
    ...process.env,
    DATABASE_URL: adminDatabaseUrl,
    DIRECT_URL: adminDatabaseUrl,
  };

  run(
    "pnpm",
    ["--filter", "@client/database", "exec", "prisma", "migrate", "deploy"],
    { env: databaseEnv, stdio: "inherit" },
  );

  run("docker", [
    "exec",
    containerName,
    "psql",
    "-v",
    "ON_ERROR_STOP=1",
    "-U",
    "postgres",
    "-d",
    "client_starter_test",
    "-c",
    [
      "CREATE ROLE hoa_test_app LOGIN PASSWORD 'synthetic_test_password'",
      "GRANT CONNECT ON DATABASE client_starter_test TO hoa_test_app",
      "GRANT USAGE ON SCHEMA public TO hoa_test_app",
      "GRANT SELECT ON hoa_tenants TO hoa_test_app",
      "GRANT SELECT, INSERT ON hoa_cases TO hoa_test_app",
      "GRANT SELECT, INSERT ON hoa_classifier_suggestions TO hoa_test_app",
      "GRANT SELECT, UPDATE, DELETE, TRUNCATE ON hoa_decision_events TO hoa_test_app",
      'GRANT EXECUTE ON FUNCTION "lookup_hoa_membership"(TEXT) TO hoa_test_app',
      'GRANT EXECUTE ON FUNCTION "record_hoa_human_decision"(TEXT, TEXT, TEXT, "HoaDecision", TEXT) TO hoa_test_app',
    ].join("; "),
  ]);

  run(
    "pnpm",
    [
      "exec",
      "tsx",
      "--test",
      "src/pipeline.test.ts",
      "src/persistence.test.ts",
    ],
    {
      cwd: packageRoot,
      env: {
        ...process.env,
        DATABASE_URL: appDatabaseUrl,
        DIRECT_URL: adminDatabaseUrl,
        HOA_TEST_ADMIN_DATABASE_URL: adminDatabaseUrl,
      },
      stdio: "inherit",
    },
  );
} finally {
  if (started) {
    spawnSync("docker", ["stop", containerName], { stdio: "ignore" });
  }
}

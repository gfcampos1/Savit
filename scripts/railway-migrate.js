const { spawn } = require('child_process');

function runShell(command) {
  return new Promise((resolve) => {
    const child = spawn(command, {
      shell: true,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on('close', (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

async function main() {
  const baselineMigration =
    process.env.PRISMA_BASELINE_MIGRATION || '20260112000000_baseline_existing_db';

  const deploy1 = await runShell('npx prisma migrate deploy');
  if (deploy1.code === 0) return;

  const output = `${deploy1.stdout}\n${deploy1.stderr}`;
  const isP3005 = output.includes('P3005') && output.includes('schema is not empty');
  const isP3009 = output.includes('P3009') && output.includes('failed migrations');

  // Handle failed migration (P3009) - mark as rolled back and retry
  if (isP3009) {
    // Extract migration name from output
    const match = output.match(/`(\d+_[^`]+)`\s+migration started at/);
    if (match) {
      const failedMigration = match[1];
      process.stderr.write(
        `\n[railway-migrate] Detected P3009 (failed migration). ` +
          `Rolling back migration: ${failedMigration}\n\n`
      );

      const rollback = await runShell(
        `npx prisma migrate resolve --rolled-back ${failedMigration}`
      );
      if (rollback.code !== 0) {
        process.exit(rollback.code);
        return;
      }

      const deploy2 = await runShell('npx prisma migrate deploy');
      process.exit(deploy2.code);
      return;
    }
  }

  if (!isP3005) {
    process.exit(deploy1.code);
    return;
  }

  process.stderr.write(
    `\n[railway-migrate] Detected P3005 (non-empty schema without baseline). ` +
      `Applying baseline migration: ${baselineMigration}\n\n`
  );

  const resolve = await runShell(
    `npx prisma migrate resolve --applied ${baselineMigration}`
  );
  if (resolve.code !== 0) {
    process.exit(resolve.code);
    return;
  }

  const deploy2 = await runShell('npx prisma migrate deploy');
  process.exit(deploy2.code);
}

main().catch((err) => {
  process.stderr.write(`\n[railway-migrate] Fatal error: ${err?.stack || err}\n`);
  process.exit(1);
});

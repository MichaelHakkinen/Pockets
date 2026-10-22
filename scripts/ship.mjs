// npm run ship -- "commit message"
// Lints, builds, then commits everything and pushes. Stops at the first failure.
import { execSync } from 'node:child_process';

const message = process.argv.slice(2).join(' ').trim() || 'chore: update';
const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

try {
  run('npm run lint');
  run('npm run build');

  const dirty = execSync('git status --porcelain').toString().trim();
  if (dirty) {
    run('git add -A');
    execSync('git commit -F -', { input: message, stdio: ['pipe', 'inherit', 'inherit'] });
  } else {
    console.log('Nothing new to commit; pushing existing commits.');
  }
  run('git push');
  console.log('\nPushed. GitHub Pages will redeploy in a minute or two.');
} catch {
  console.error('\nShip stopped: fix the error above and run it again.');
  process.exit(1);
}
